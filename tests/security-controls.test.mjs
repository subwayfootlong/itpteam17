import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { isSameOriginMutation } from '../lib/requestSecurity.ts';
import {
  getSessionCookieOptions,
  isSessionIdleExpired,
  SESSION_IDLE_TIMEOUT_MS,
} from '../lib/sessionPolicy.ts';

delete process.env.APP_URL;

test('same-origin control accepts safe methods and exact-origin mutations', () => {
  assert.equal(
    isSameOriginMutation(new Request('https://app.example/api/member/profile', {
      method: 'GET',
      headers: { Origin: 'https://attacker.example' },
    })),
    true,
  );
  assert.equal(
    isSameOriginMutation(new Request('https://app.example/api/member/profile', {
      method: 'PATCH',
      headers: { Origin: 'https://app.example' },
    })),
    true,
  );
});

test('same-origin control rejects missing, cross-site, and scheme-mismatched origins', () => {
  const cases = [
    new Request('https://app.example/api/member/profile', { method: 'PATCH' }),
    new Request('https://app.example/api/member/profile', {
      method: 'PATCH',
      headers: { Origin: 'https://attacker.example' },
    }),
    new Request('https://app.example/api/member/profile', {
      method: 'PATCH',
      headers: { Origin: 'http://app.example' },
    }),
  ];

  for (const request of cases) assert.equal(isSameOriginMutation(request), false);
});

test('session cookies explicitly carry browser security attributes', () => {
  const options = getSessionCookieOptions();
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, 'lax');
  assert.equal(options.priority, 'high');
  assert.equal(options.path, '/');
  assert.equal(options.maxAge, 60 * 60 * 24 * 7);

  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  assert.equal(getSessionCookieOptions().secure, true);
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});

test('idle timeout rejects timestamps beyond the configured window', () => {
  assert.equal(isSessionIdleExpired(Date.now()), false);
  assert.equal(isSessionIdleExpired(Date.now() - SESSION_IDLE_TIMEOUT_MS - 1), true);
});

test('JWT verification rejects an expired session token', async () => {
  process.env.JWT_SECRET = 'test-only-secret-that-is-long-enough';
  const { verifyAccessToken } = await import('../lib/auth.ts');
  const expired = jwt.sign({ sub: 'test-user', email: 'test@example.com' }, process.env.JWT_SECRET, {
    expiresIn: -1,
  });

  assert.throws(() => verifyAccessToken(expired), /expired/i);
});

