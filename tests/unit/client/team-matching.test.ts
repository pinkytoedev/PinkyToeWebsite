import { describe, it, expect } from 'vitest';
import { findTeamMemberByName } from '@/lib/team-matching';

const members = [
  { id: 'rec1', name: 'Lauren Matz' },
  { id: 'rec2', name: 'Alex Gains' },
] as any[];

/**
 * A byline that fails to match renders as plain text, so the reader loses the
 * link to that person's page - the failure is silent, which is why it is worth
 * pinning the shapes editors actually type.
 */
describe('findTeamMemberByName', () => {
  it('matches an exact name', () => {
    expect(findTeamMemberByName(members, 'Alex Gains')?.id).toBe('rec2');
  });

  it('ignores case and stray whitespace', () => {
    expect(findTeamMemberByName(members, '  lauren matz ')?.id).toBe('rec1');
  });

  it('takes the first entry when Airtable sends an array', () => {
    expect(findTeamMemberByName(members, ['Alex Gains'])?.id).toBe('rec2');
  });

  it('strips the prefixes editors put in front of a photo credit', () => {
    for (const credit of ['Photo by Alex Gains', 'Photo credit: Alex Gains', 'Credit: Alex Gains']) {
      expect(findTeamMemberByName(members, credit)?.id).toBe('rec2');
    }
  });

  it('matches a byline that carries extra words', () => {
    expect(findTeamMemberByName(members, 'Lauren Matz (she/her)')?.id).toBe('rec1');
  });

  it('returns nothing rather than guessing', () => {
    expect(findTeamMemberByName(members, 'Someone Else')).toBeUndefined();
    expect(findTeamMemberByName(members, '')).toBeUndefined();
    expect(findTeamMemberByName(members, undefined)).toBeUndefined();
    expect(findTeamMemberByName([], 'Alex Gains')).toBeUndefined();
    expect(findTeamMemberByName(undefined, 'Alex Gains')).toBeUndefined();
  });
});
