import { describe, it, expect } from 'vitest';
import { isReleased, isPubliclyVisible } from '@server/services/article-visibility';

/**
 * Publication rule:
 *   Finished off                   -> never visible, whatever the date
 *   Finished on, day reached/past  -> visible
 *   Finished on, day still ahead   -> held until that day
 *   Finished on, no date           -> visible
 *
 * Days are reckoned in America/New_York, so an article dated the 25th appears
 * from the start of the 25th in New York.
 */

/** 2026-08-20, 12:00 ET (16:00 UTC, EDT). */
const NOW = new Date('2026-08-20T16:00:00.000Z');

describe('isReleased', () => {
  it('releases a date in the past', () => {
    expect(isReleased('2026-08-19T12:00:00.000Z', NOW)).toBe(true);
  });

  it('holds a date in the future', () => {
    expect(isReleased('2026-08-21T12:00:00.000Z', NOW)).toBe(false);
  });

  it('releases anything scheduled for today, whatever the clock time', () => {
    // Same ET day, later in the day than "now" - the day has arrived, so it
    // publishes. This is the day-granularity rule, not a timestamp compare.
    expect(isReleased('2026-08-20T23:30:00.000Z', NOW)).toBe(true);
    expect(isReleased('2026-08-20T04:00:00.000Z', NOW)).toBe(true);
  });

  it('treats a missing date as no embargo', () => {
    expect(isReleased(null, NOW)).toBe(true);
    expect(isReleased(undefined, NOW)).toBe(true);
    expect(isReleased('', NOW)).toBe(true);
  });

  it('treats an unparseable date as no embargo rather than hiding the article', () => {
    expect(isReleased('not a date', NOW)).toBe(true);
  });

  it('accepts a Date instance as well as a string', () => {
    expect(isReleased(new Date('2026-08-21T12:00:00.000Z'), NOW)).toBe(false);
    expect(isReleased(new Date('2026-08-19T12:00:00.000Z'), NOW)).toBe(true);
  });

  describe('day boundaries in the newsroom timezone', () => {
    it('holds until midnight New York, not midnight UTC', () => {
      // 2026-08-21T02:00Z is already the 21st in UTC but still 22:00 on the
      // 20th in New York, so an article dated the 21st must stay held.
      const lateOnThe20th = new Date('2026-08-21T02:00:00.000Z');

      expect(isReleased('2026-08-21T12:00:00.000Z', lateOnThe20th)).toBe(false);
    });

    it('releases at the first moment of the scheduled day in New York', () => {
      // 04:00Z is 00:00 EDT on the 21st.
      const midnightET = new Date('2026-08-21T04:00:00.000Z');

      expect(isReleased('2026-08-21T12:00:00.000Z', midnightET)).toBe(true);
    });

    it('handles the winter offset too', () => {
      // In January New York is EST (UTC-5), so midnight is 05:00Z.
      const justBefore = new Date('2026-01-15T04:59:00.000Z');
      const justAfter = new Date('2026-01-15T05:01:00.000Z');

      expect(isReleased('2026-01-15T12:00:00.000Z', justBefore)).toBe(false);
      expect(isReleased('2026-01-15T12:00:00.000Z', justAfter)).toBe(true);
    });
  });
});

describe('isPubliclyVisible', () => {
  it('publishes a finished article whose day has arrived', () => {
    expect(isPubliclyVisible({ finished: true, scheduled: '2026-08-19T12:00:00.000Z' }, NOW))
      .toBe(true);
  });

  it('holds a finished article scheduled for a later day', () => {
    expect(isPubliclyVisible({ finished: true, scheduled: '2026-08-25T12:00:00.000Z' }, NOW))
      .toBe(false);
  });

  it('publishes a finished article with no scheduled date', () => {
    expect(isPubliclyVisible({ finished: true, scheduled: null }, NOW)).toBe(true);
  });

  it('never publishes an unfinished article, however old the date', () => {
    // Scheduled is a gate, not a trigger: a past date cannot publish a draft.
    expect(isPubliclyVisible({ finished: false, scheduled: '2020-01-01T00:00:00.000Z' }, NOW))
      .toBe(false);
    expect(isPubliclyVisible({ finished: undefined, scheduled: '2020-01-01T00:00:00.000Z' }, NOW))
      .toBe(false);
    expect(isPubliclyVisible({ finished: false, scheduled: null }, NOW)).toBe(false);
  });

  it('does not accept a truthy non-boolean as finished', () => {
    for (const finished of ['true', 'false', 1, 'yes', {}]) {
      expect(isPubliclyVisible({ finished, scheduled: null }, NOW)).toBe(false);
    }
  });

  it('goes live on the scheduled day without anyone touching the record', () => {
    const article = { finished: true, scheduled: '2026-08-25T12:00:00.000Z' };

    expect(isPubliclyVisible(article, new Date('2026-08-24T23:00:00.000Z'))).toBe(false);
    // 04:00Z on the 25th = midnight ET on the 25th.
    expect(isPubliclyVisible(article, new Date('2026-08-25T04:00:00.000Z'))).toBe(true);
  });
});
