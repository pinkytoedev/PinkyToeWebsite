import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireAdmin, requireWebhookSecret } from '@server/middleware/auth';

function makeReq(headers: Record<string, string> = {}, body: any = {}): Request {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );

  return {
    get: (name: string) => lower[name.toLowerCase()],
    body,
  } as unknown as Request;
}

function makeRes() {
  const res = {
    statusCode: 0,
    payload: undefined as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.payload = payload;
      return this;
    },
  };

  return res as unknown as Response & { statusCode: number; payload: any };
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  delete process.env.ADMIN_TOKEN;
  delete process.env.WEBHOOK_SECRET;
  delete process.env.NODE_ENV;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe('requireAdmin', () => {
  it('accepts a bearer token that matches', () => {
    process.env.ADMIN_TOKEN = 'sekrit';
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes();

    requireAdmin(makeReq({ Authorization: 'Bearer sekrit' }), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(0);
  });

  it('accepts the X-Admin-Token header', () => {
    process.env.ADMIN_TOKEN = 'sekrit';
    const next = vi.fn() as unknown as NextFunction;

    requireAdmin(makeReq({ 'X-Admin-Token': 'sekrit' }), makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects a wrong token with 401', () => {
    process.env.ADMIN_TOKEN = 'sekrit';
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes();

    requireAdmin(makeReq({ Authorization: 'Bearer nope' }), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('rejects a missing token with 401', () => {
    process.env.ADMIN_TOKEN = 'sekrit';
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes();

    requireAdmin(makeReq(), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('fails closed in production when ADMIN_TOKEN is unset', () => {
    // Regression: these endpoints used to be reachable by anyone, and each
    // call forces a full Airtable re-fetch.
    process.env.NODE_ENV = 'production';
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes();

    requireAdmin(makeReq(), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(503);
  });

  it('stays open in development when ADMIN_TOKEN is unset', () => {
    process.env.NODE_ENV = 'development';
    const next = vi.fn() as unknown as NextFunction;

    requireAdmin(makeReq(), makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
  });
});

describe('requireWebhookSecret', () => {
  it('prefers the header over the body', () => {
    process.env.WEBHOOK_SECRET = 'hook';
    const next = vi.fn() as unknown as NextFunction;

    requireWebhookSecret(
      makeReq({ 'X-Webhook-Secret': 'hook' }, { webhookSecret: 'wrong' }),
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it('still accepts the legacy body field', () => {
    process.env.WEBHOOK_SECRET = 'hook';
    const next = vi.fn() as unknown as NextFunction;

    requireWebhookSecret(makeReq({}, { webhookSecret: 'hook' }), makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects a wrong secret with 401', () => {
    process.env.WEBHOOK_SECRET = 'hook';
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes();

    requireWebhookSecret(makeReq({}, { webhookSecret: 'nope' }), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('fails closed in production when WEBHOOK_SECRET is unset', () => {
    // Regression: the check was skipped entirely when the env var was
    // missing, leaving an open cache-invalidation trigger by default.
    process.env.NODE_ENV = 'production';
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes();

    requireWebhookSecret(makeReq({}, {}), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(503);
  });
});
