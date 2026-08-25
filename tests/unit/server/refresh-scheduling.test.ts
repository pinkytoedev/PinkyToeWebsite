import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RefreshService, isRefreshableEntity, REFRESHABLE_ENTITIES } from '@server/services/refresh-service';
import { PublicationScheduler } from '@server/services/publication-scheduler';
import { storage } from '@server/storage';

const MINUTE = 60 * 1000;

describe('RefreshService scheduling', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    // Keep the scheduler off the network - we only care about timer wiring.
    vi.spyOn(RefreshService, 'refreshAll').mockResolvedValue(undefined);
    vi.spyOn(RefreshService, 'refreshRecentArticles').mockResolvedValue(undefined);
    vi.spyOn(RefreshService, 'refreshFeaturedArticles').mockResolvedValue(undefined);
    vi.spyOn(RefreshService, 'refreshArticles').mockResolvedValue(undefined);
    vi.spyOn(RefreshService, 'refreshTeam').mockResolvedValue(undefined);
    vi.spyOn(RefreshService, 'refreshQuotes').mockResolvedValue(undefined);
  });

  afterEach(() => {
    RefreshService.stopRefreshSchedules();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('lets a content timer actually fire', () => {
    // Regression: the 15-minute schedule monitor unconditionally cleared and
    // recreated every content timer. Since the shortest content interval is
    // 30 minutes during business hours, no content timer ever survived long
    // enough to elapse and background refresh never ran at all.
    vi.spyOn(PublicationScheduler, 'isBusinessHours').mockReturnValue(true);

    RefreshService.startRefreshSchedules();
    vi.mocked(RefreshService.refreshRecentArticles).mockClear();

    // Past the 15-minute monitor tick, but not yet the 30-minute interval.
    vi.advanceTimersByTime(20 * MINUTE);
    expect(RefreshService.refreshRecentArticles).not.toHaveBeenCalled();

    // Now past the 30-minute critical interval.
    vi.advanceTimersByTime(15 * MINUTE);
    expect(RefreshService.refreshRecentArticles).toHaveBeenCalled();
  });

  it('reschedules when business hours change', () => {
    const isBusinessHours = vi
      .spyOn(PublicationScheduler, 'isBusinessHours')
      .mockReturnValue(true);

    RefreshService.startRefreshSchedules();
    vi.mocked(RefreshService.refreshRecentArticles).mockClear();

    // Cross into off-hours, where the critical interval becomes 60 minutes.
    isBusinessHours.mockReturnValue(false);
    vi.advanceTimersByTime(15 * MINUTE); // monitor tick observes the transition

    // The old 30-minute timer must be gone: nothing at the 30-minute mark.
    vi.advanceTimersByTime(30 * MINUTE);
    expect(RefreshService.refreshRecentArticles).not.toHaveBeenCalled();

    // The new 60-minute timer fires instead.
    vi.advanceTimersByTime(31 * MINUTE);
    expect(RefreshService.refreshRecentArticles).toHaveBeenCalled();
  });

  it('stops every timer on shutdown', () => {
    vi.spyOn(PublicationScheduler, 'isBusinessHours').mockReturnValue(true);

    RefreshService.startRefreshSchedules();
    RefreshService.stopRefreshSchedules();
    vi.mocked(RefreshService.refreshRecentArticles).mockClear();

    vi.advanceTimersByTime(24 * 60 * MINUTE);

    expect(RefreshService.refreshRecentArticles).not.toHaveBeenCalled();
  });
});

describe('RefreshService.scheduleNextRelease', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(RefreshService, 'refreshRecentArticles').mockResolvedValue(undefined);
    vi.spyOn(RefreshService, 'refreshFeaturedArticles').mockResolvedValue(undefined);
    vi.spyOn(RefreshService, 'refreshArticles').mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    RefreshService.stopRefreshSchedules();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Point storage.getNextReleaseTime at a fixed answer. */
  function nextReleaseIs(value: Date | null) {
    return vi.spyOn(storage, 'getNextReleaseTime').mockResolvedValue(value);
  }

  it('refreshes the article views at the release moment, not before', async () => {
    // Without this timer an article scheduled for 08:00 would sit invisible
    // until the next periodic refresh, up to hours later.
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));
    nextReleaseIs(new Date('2026-08-20T13:00:00.000Z'));

    await RefreshService.scheduleNextRelease();
    vi.mocked(RefreshService.refreshArticles).mockClear();

    await vi.advanceTimersByTimeAsync(59 * 60 * 1000);
    expect(RefreshService.refreshArticles).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    expect(RefreshService.refreshArticles).toHaveBeenCalled();
    expect(RefreshService.refreshFeaturedArticles).toHaveBeenCalled();
    expect(RefreshService.refreshRecentArticles).toHaveBeenCalled();
  });

  it('does nothing when nothing is embargoed', async () => {
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));
    nextReleaseIs(null);

    await RefreshService.scheduleNextRelease();
    vi.mocked(RefreshService.refreshArticles).mockClear();

    await vi.advanceTimersByTimeAsync(48 * 60 * 60 * 1000);
    expect(RefreshService.refreshArticles).not.toHaveBeenCalled();
  });

  it('leaves a distant release to a later refresh rather than arming now', async () => {
    // setTimeout cannot represent very long delays, and the periodic refresh
    // will re-arm this closer to the time.
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));
    nextReleaseIs(new Date('2026-10-01T12:00:00.000Z'));

    await RefreshService.scheduleNextRelease();
    vi.mocked(RefreshService.refreshArticles).mockClear();

    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
    expect(RefreshService.refreshArticles).not.toHaveBeenCalled();
  });

  it('still fires for a release that is already due', async () => {
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));
    nextReleaseIs(new Date('2026-08-20T11:00:00.000Z'));

    await RefreshService.scheduleNextRelease();
    vi.mocked(RefreshService.refreshArticles).mockClear();

    await vi.advanceTimersByTimeAsync(10 * 1000);
    expect(RefreshService.refreshArticles).toHaveBeenCalled();
  });

  it('replaces a previously armed timer instead of stacking them', async () => {
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));

    nextReleaseIs(new Date('2026-08-20T13:00:00.000Z'));
    await RefreshService.scheduleNextRelease();

    // A new article is scheduled sooner; re-arming must drop the old timer.
    nextReleaseIs(new Date('2026-08-20T12:30:00.000Z'));
    await RefreshService.scheduleNextRelease();
    vi.mocked(RefreshService.refreshArticles).mockClear();

    await vi.advanceTimersByTimeAsync(90 * 60 * 1000);
    expect(RefreshService.refreshArticles).toHaveBeenCalledTimes(1);
  });

  it('survives a storage failure without arming anything', async () => {
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));
    vi.spyOn(storage, 'getNextReleaseTime').mockRejectedValue(new Error('Airtable down'));

    await expect(RefreshService.scheduleNextRelease()).resolves.toBeUndefined();

    await vi.advanceTimersByTimeAsync(48 * 60 * 60 * 1000);
    expect(RefreshService.refreshArticles).not.toHaveBeenCalled();
  });

  it('clears the release timer on shutdown', async () => {
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));
    nextReleaseIs(new Date('2026-08-20T13:00:00.000Z'));

    await RefreshService.scheduleNextRelease();
    RefreshService.stopRefreshSchedules();
    vi.mocked(RefreshService.refreshArticles).mockClear();

    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
    expect(RefreshService.refreshArticles).not.toHaveBeenCalled();
  });
});

describe('isRefreshableEntity', () => {
  it('accepts every documented entity', () => {
    for (const entity of REFRESHABLE_ENTITIES) {
      expect(isRefreshableEntity(entity)).toBe(true);
    }
  });

  it('rejects anything else', () => {
    for (const value of ['', 'Articles', '__proto__', 'toString', null, undefined, 7, {}]) {
      expect(isRefreshableEntity(value)).toBe(false);
    }
  });
});
