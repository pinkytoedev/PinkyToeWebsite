import type { Team } from "@shared/schema";

/**
 * Match a byline to a team member.
 *
 * Bylines are free text in Airtable and team names are records, so they agree
 * often but not always: "Photo by Alex Gains" and "alex gains " both have to
 * find Alex Gains, or the credit renders as plain text and the reader loses
 * the link to that person's page.
 *
 * Both article views carried their own near-identical copy of this; they had
 * already drifted on which prefixes they stripped.
 */

/** Prefixes editors type in front of a photo credit. */
const CREDIT_PREFIX = /^\s*(photo\s*(by|credit)\s*:?\s*|credit\s*:?\s*)/i;

/** Airtable hands back either a string or a single-element array. */
function firstValue(value: string | string[] | undefined | null): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return typeof value === "string" ? value : "";
}

function normalize(value: string): string {
  return value.replace(CREDIT_PREFIX, "").trim().toLowerCase();
}

export function findTeamMemberByName(
  teamMembers: Team[] | undefined | null,
  name: string | string[] | undefined | null,
): Team | undefined {
  if (!teamMembers?.length) return undefined;

  const target = normalize(firstValue(name));
  if (!target) return undefined;

  const exact = teamMembers.find(member => member.name?.trim().toLowerCase() === target);
  if (exact) return exact;

  // Fall back to containment, which is what catches "Lauren Matz (she/her)"
  // and the trailing-initial spellings.
  return teamMembers.find(member => {
    const memberName = member.name?.trim().toLowerCase();
    if (!memberName) return false;
    return target.includes(memberName) || memberName.includes(target);
  });
}
