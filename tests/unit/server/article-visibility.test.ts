import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Drafts must never reach the public site.
 *
 * Every listing query filters on `Finished`, but the direct-by-ID lookup did
 * not. That mattered because the Teams table's AuthorSub/PhotoSub link fields
 * include unfinished records, and team profile pages fetch each linked article
 * by ID - so drafts rendered publicly without anyone needing to guess a URL.
 */

const find = vi.fn();
const select = vi.fn();

vi.mock('airtable', () => {
  const base = () => ({ find, select });

  return {
    default: {
      configure: vi.fn(),
      base: () => base,
    },
  };
});

/** Minimal stand-in for an Airtable record. */
function record(id: string, fields: Record<string, unknown>) {
  return {
    id,
    fields,
    get: (name: string) => fields[name],
  };
}

const PUBLISHED = {
  Name: 'A Real Article',
  Description: 'desc',
  Body: '<p>hi</p>',
  Finished: true,
  Scheduled: '2026-01-01T12:00:00.000Z',
};

const DRAFT = { ...PUBLISHED, Name: 'Unfinished Draft', Finished: false };

async function makeStorage() {
  process.env.AIRTABLE_API_KEY = 'test-key';
  process.env.AIRTABLE_BASE_ID = 'test-base';

  const { AirtableStorage } = await import('@server/storage');
  return new AirtableStorage();
}

describe('AirtableStorage.getArticleById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a published article', async () => {
    find.mockResolvedValue(record('recPublished', PUBLISHED));

    const article = await (await makeStorage()).getArticleById('recPublished');

    expect(article).toBeDefined();
    expect(article?.title).toBe('A Real Article');
  });

  it('does not return a draft', async () => {
    find.mockResolvedValue(record('recDraft', DRAFT));

    const article = await (await makeStorage()).getArticleById('recDraft');

    expect(article).toBeUndefined();
  });

  it('treats a missing Finished field as unpublished', async () => {
    const { Finished, ...withoutFinished } = PUBLISHED;
    find.mockResolvedValue(record('recNoFlag', withoutFinished));

    expect(await (await makeStorage()).getArticleById('recNoFlag')).toBeUndefined();
  });

  it('does not accept a truthy non-boolean as published', async () => {
    // Airtable checkboxes are true or absent; anything else is not a publish
    // signal and must not open the gate.
    for (const value of ['false', 'no', 1, 'true']) {
      find.mockResolvedValue(record('recOdd', { ...PUBLISHED, Finished: value }));

      expect(await (await makeStorage()).getArticleById('recOdd')).toBeUndefined();
    }
  });

  it('does not return a finished article whose scheduled day has not arrived', async () => {
    const farFuture = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    find.mockResolvedValue(record('recEmbargoed', { ...PUBLISHED, Scheduled: farFuture }));

    expect(await (await makeStorage()).getArticleById('recEmbargoed')).toBeUndefined();
  });

  it('returns undefined when the record does not exist', async () => {
    find.mockRejectedValue(Object.assign(new Error('Not found'), { statusCode: 404 }));

    expect(await (await makeStorage()).getArticleById('recMissing')).toBeUndefined();
  });
});
