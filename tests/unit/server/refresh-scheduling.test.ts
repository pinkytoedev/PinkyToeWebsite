import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RefreshService, isRefreshableEntity, REFRESHABLE_ENTITIES } from '@server/services/refresh-service';
import { PublicationScheduler } from '@server/services/publication-scheduler';

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
