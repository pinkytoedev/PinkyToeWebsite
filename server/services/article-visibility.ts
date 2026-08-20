import { PublicationScheduler } from './publication-scheduler';

/**
 * The single rule deciding whether an article is publicly visible.
 *
 * Two Airtable fields govern it:
 *
 *   Finished   checkbox  - the editor has signed the piece off
 *   Scheduled  datetime  - the day it is meant to go live
 *
 * An article is public only when Finished is ticked AND its scheduled day has
 * arrived. Scheduled never publishes anything on its own: an unfinished record
 * stays private forever, however old its date. So:
 *
 *   Finished off                    -> draft, never visible
 *   Finished on,  day reached/past  -> visible
 *   Finished on,  day still ahead   -> held until that day
 *   Finished on,  no date           -> visible (nothing to wait for)
 *
 * Comparison is by *day*, not by timestamp, in the newsroom timezone - an
 * article dated the 25th appears from the start of the 25th in New York,
 * regardless of the clock time stored alongside it. (To hold it to the exact
 * stored time instead, compare the instants in isReleased rather than the day
 * keys.)
 */

/**
 * The calendar day a moment falls on, in the given zone, as `YYYY-MM-DD`.
 *
 * en-CA formats as ISO, which makes these keys directly comparable with `<=`
 * and sidesteps any date arithmetic across DST boundaries.
 */
function dayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Whether a scheduled date has come around yet.
 *
 * A missing or unparseable date means "no embargo" - the Finished flag alone
 * decides. Treating a bad date as an embargo would silently hide published
 * work, which is the worse failure.
 */
export function isReleased(
  scheduled: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (scheduled === null || scheduled === undefined || scheduled === '') {
    return true;
  }

  const scheduledDate = scheduled instanceof Date ? scheduled : new Date(scheduled);
  if (Number.isNaN(scheduledDate.getTime())) {
    console.warn(`Unparseable Scheduled value, treating as released: ${String(scheduled)}`);
    return true;
  }

  const timeZone = PublicationScheduler.getTimezone();

  return dayKey(scheduledDate, timeZone) <= dayKey(now, timeZone);
}

/** The Airtable fields this rule reads. */
export interface PublicationFields {
  finished: unknown;
  scheduled: Date | string | null | undefined;
}

/**
 * Whether an article should be visible to the public.
 *
 * `finished` is compared against `true` rather than tested for truthiness:
 * an Airtable checkbox is either true or absent, so any other value (a stray
 * string, a number) is not a publish signal and must not open the gate.
 */
export function isPubliclyVisible(
  { finished, scheduled }: PublicationFields,
  now: Date = new Date()
): boolean {
  return finished === true && isReleased(scheduled, now);
}

/** Read the publication fields off an Airtable record. */
export function publicationFieldsOf(
  record: { get(field: string): any }
): PublicationFields {
  return {
    finished: record.get('Finished'),
    scheduled: record.get('Scheduled'),
  };
}

/** Keep only the records the public may see. */
export function filterPubliclyVisible<T extends { get(field: string): any }>(
  records: readonly T[],
  now: Date = new Date()
): T[] {
  return records.filter(record => isPubliclyVisible(publicationFieldsOf(record), now));
}
