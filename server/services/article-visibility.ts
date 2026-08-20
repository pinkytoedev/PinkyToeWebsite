/**
 * The single rule deciding whether an article is publicly visible.
 *
 * Two Airtable fields govern it:
 *
 *   Finished   checkbox  - the editor has signed the piece off
 *   Scheduled  datetime  - the moment it is meant to go live
 *
 * An article is public only when Finished is ticked AND its scheduled time has
 * arrived. Scheduled never publishes anything on its own: an unfinished record
 * stays private forever, however old its date. So:
 *
 *   Finished off                     -> draft, never visible
 *   Finished on,  stored time passed -> visible
 *   Finished on,  stored time ahead  -> held until that moment
 *   Finished on,  no date            -> visible (nothing to wait for)
 *
 * The stored timestamp is the release instant, to the minute - an article set
 * for the 25th at 08:00 ET appears at 08:00 ET, not at midnight. RefreshService
 * sets a timer for that moment so it goes live without waiting for the next
 * periodic refresh.
 */

/** Parse a Scheduled value, or null if it is absent or unusable. */
export function parseScheduled(
  scheduled: Date | string | null | undefined
): Date | null {
  if (scheduled === null || scheduled === undefined || scheduled === '') {
    return null;
  }

  const parsed = scheduled instanceof Date ? scheduled : new Date(scheduled);
  if (Number.isNaN(parsed.getTime())) {
    console.warn(`Unparseable Scheduled value, treating as released: ${String(scheduled)}`);
    return null;
  }

  return parsed;
}

/**
 * Whether a scheduled release time has arrived.
 *
 * A missing or unparseable date means "no embargo" - the Finished flag alone
 * decides. Treating a bad date as an embargo would silently hide published
 * work, which is the worse failure.
 */
export function isReleased(
  scheduled: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  const scheduledDate = parseScheduled(scheduled);
  if (scheduledDate === null) {
    return true;
  }

  // "At or past" the stored time, so a record released exactly now is visible.
  return scheduledDate.getTime() <= now.getTime();
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

/**
 * The soonest moment a currently-held article becomes visible, or null if
 * nothing is waiting.
 *
 * RefreshService uses this to set a timer for the exact release instant, so a
 * scheduled article appears on time instead of on the next periodic refresh.
 * Only finished articles count - an unfinished one has no release time,
 * because its date can never publish it.
 */
export function nextReleaseTime<T extends { get(field: string): any }>(
  records: readonly T[],
  now: Date = new Date()
): Date | null {
  let soonest: Date | null = null;

  for (const record of records) {
    if (record.get('Finished') !== true) continue;

    const scheduled = parseScheduled(record.get('Scheduled'));
    if (scheduled === null || scheduled.getTime() <= now.getTime()) continue;

    if (soonest === null || scheduled.getTime() < soonest.getTime()) {
      soonest = scheduled;
    }
  }

  return soonest;
}
