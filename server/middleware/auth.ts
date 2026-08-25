import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Gate for endpoints that invalidate caches and force Airtable re-fetches.
 *
 * These are an amplification vector: each call fans out to several full-table
 * Airtable scans and deliberately bypasses the refresh throttle, so an
 * unauthenticated caller can exhaust the base's rate limit at will.
 *
 * Fails closed in production when ADMIN_TOKEN is unset. In development the
 * gate is open so the console helpers keep working without extra setup.
 */

/** Constant-time compare that also tolerates differing lengths. */
function safeEqual(a: string, b: string): boolean {
  const aHash = crypto.createHash('sha256').update(a).digest();
  const bHash = crypto.createHash('sha256').update(b).digest();

  return crypto.timingSafeEqual(aHash, bHash);
}

/** Pull the presented token from either an Authorization header or X-Admin-Token. */
function extractToken(req: Request): string | null {
  const authHeader = req.get('authorization');
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice('bearer '.length).trim();
  }

  return req.get('x-admin-token') ?? null;
}

/**
 * Gate for the Airtable webhook endpoints.
 *
 * Previously the secret check was skipped entirely when WEBHOOK_SECRET was
 * unset, so a default deployment exposed an open cache-invalidation trigger.
 * Now it fails closed in production, and the comparison is constant-time.
 *
 * The secret is accepted from the X-Webhook-Secret header in preference to the
 * body, since a body field is logged by intermediaries and trivially replayed.
 */
export function requireWebhookSecret(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.WEBHOOK_SECRET;

  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      console.error('WEBHOOK_SECRET is not configured; refusing webhook request');
      res.status(503).json({
        success: false,
        message: 'Webhook endpoints are not configured',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
    return;
  }

  const presented = req.get('x-webhook-secret') ?? req.body?.webhookSecret;
  if (typeof presented !== 'string' || !safeEqual(presented, expected)) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid webhook secret',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.ADMIN_TOKEN;

  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      console.error('ADMIN_TOKEN is not configured; refusing admin request');
      res.status(503).json({
        success: false,
        message: 'Admin endpoints are not configured',
      });
      return;
    }

    // Development convenience only.
    next();
    return;
  }

  const presented = extractToken(req);
  if (!presented || !safeEqual(presented, expected)) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  next();
}
