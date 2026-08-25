import { describe, it, expect } from 'vitest';
import {
  isReleased,
  isPubliclyVisible,
  nextReleaseTime,
} from '@server/services/article-visibility';

/**
 * Publication rule:
 *   Finished off                     -> never visible, whatever the date
 *   Finished on, stored time passed  -> visible
 *   Finished on, stored time ahead   -> held until that moment
 *   Finished on, no date             -> visible
 *
 * The stored timestamp is the release instant, to the minute.
 */

/** 2026-08-20, 12:00 ET (16:00 UTC). */
const NOW = new Date('2026-08-20T16:00:00.000Z');

describe('isReleased', () => {
  it('releases a time in the past', () => {
    expect(isReleased('2026-08-20T15:59:00.000Z', NOW)).toBe(true);
  });

  it('holds a time in the future', () => {
    expect(isReleased('2026-08-20T16:01:00.000Z', NOW)).toBe(false);
  });

  it('releases at exactly the stored instant', () => {
    // "At or past" the stored time.
    expect(isReleased('2026-08-20T16:00:00.000Z', NOW)).toBe(true);
  });

  it('holds later the same day rather than releasing at midnight', () => {
    // The distinguishing case from day-granularity: same calendar day, but
    // the stored time has not arrived, so it stays held.
    expect(isReleased('2026-08-20T20:00:00.000Z', NOW)).toBe(false);
  });

  it('is precise to the minute', () => {
    const releaseAt = '2026-08-25T12:00:00.000Z';

    expect(isReleased(releaseAt, new Date('2026-08-25T11:59:00.000Z'))).toBe(false);
    expect(isReleased(releaseAt, new Date('2026-08-25T12:00:00.000Z'))).toBe(true);
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
});

describe('isPubliclyVisible', () => {
  it('publishes a finished article whose time has arrived', () => {
    expect(isPubliclyVisible({ finished: true, scheduled: '2026-08-19T12:00:00.000Z' }, NOW))
      .toBe(true);
  });

  it('holds a finished article scheduled for later', () => {
    expect(isPubliclyVisible({ finished: true, scheduled: '2026-08-20T18:00:00.000Z' }, NOW))
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

  it('goes live at its stored time without anyone touching the record', () => {
    const article = { finished: true, scheduled: '2026-08-25T12:00:00.000Z' };

    expect(isPubliclyVisible(article, new Date('2026-08-25T11:59:59.000Z'))).toBe(false);
    expect(isPubliclyVisible(article, new Date('2026-08-25T12:00:00.000Z'))).toBe(true);
  });
});

/** Stand-in for an Airtable record. */
const rec = (fields: Record<string, unknown>) => ({ get: (f: string) => fields[f] });

describe('nextReleaseTime', () => {
  it('returns the soonest pending release', () => {
    const records = [
      rec({ Finished: true, Scheduled: '2026-08-27T12:00:00.000Z' }),
      rec({ Finished: true, Scheduled: '2026-08-22T09:00:00.000Z' }),
      rec({ Finished: true, Scheduled: '2026-08-25T12:00:00.000Z' }),
    ];

    expect(nextReleaseTime(records, NOW)?.toISOString()).toBe('2026-08-22T09:00:00.000Z');
  });

  it('ignores anything already released', () => {
    const records = [
      rec({ Finished: true, Scheduled: '2026-08-01T12:00:00.000Z' }),
      rec({ Finished: true, Scheduled: '2026-08-22T09:00:00.000Z' }),
    ];

    expect(nextReleaseTime(records, NOW)?.toISOString()).toBe('2026-08-22T09:00:00.000Z');
  });

  it('ignores drafts, whose date can never publish them', () => {
    const records = [
      rec({ Finished: false, Scheduled: '2026-08-21T09:00:00.000Z' }),
      rec({ Finished: true, Scheduled: '2026-08-25T12:00:00.000Z' }),
    ];

    expect(nextReleaseTime(records, NOW)?.toISOString()).toBe('2026-08-25T12:00:00.000Z');
  });

  it('returns null when nothing is pending', () => {
    expect(nextReleaseTime([rec({ Finished: true, Scheduled: '2026-01-01T00:00:00.000Z' })], NOW))
      .toBeNull();
    expect(nextReleaseTime([rec({ Finished: true, Scheduled: null })], NOW)).toBeNull();
    expect(nextReleaseTime([], NOW)).toBeNull();
  });
});
