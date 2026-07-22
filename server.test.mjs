import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../server.mjs';

const tempDir = await mkdtemp(join(tmpdir(), 'service-design-account-auth-'));
const server = await startServer({
  port: 0,
  rootDir: fileURLToPath(new URL('..', import.meta.url)),
  dataDir: tempDir,
  env: { ENABLE_USER_ACCOUNTS: 'true' },
  silent: true,
});

try {
  const baseUrl = `http://127.0.0.1:${server.port}`;

  const config = await fetchJson(`${baseUrl}/api/config`);
  assert.equal(config.authRequired, true);
  assert.equal(config.userAccounts, true);

  const blockedState = await fetch(`${baseUrl}/api/state`);
  assert.equal(blockedState.status, 401);

  const registerResult = await fetchJson(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: '陈一',
      studentId: '210117001',
      password: 'pass1234',
      className: '产品设计1班',
    }),
  });
  assert.equal(registerResult.ok, true);
  assert.equal(registerResult.user.studentId, '210117001');
  assert.ok(registerResult.token.length > 20);
  assert.equal(JSON.stringify(registerResult).includes('pass1234'), false);

  const invalidStudentId = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: '格式错误学生',
      studentId: '220117001',
      password: 'pass1234',
    }),
  });
  assert.equal(invalidStudentId.status, 400);

  const duplicate = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: '陈一',
      studentId: '210117001',
      password: 'pass1234',
    }),
  });
  assert.equal(duplicate.status, 409);

  const loginResult = await fetchJson(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ studentId: '210117001', password: 'pass1234' }),
  });
  assert.equal(loginResult.ok, true);
  assert.equal(loginResult.user.name, '陈一');

  const me = await fetchJson(`${baseUrl}/api/me`, {
    headers: { authorization: `Bearer ${loginResult.token}` },
  });
  assert.equal(me.user.className, '产品设计1班');
  assert.equal(me.user.studentId, '210117001');

  const authorizedState = await fetchJson(`${baseUrl}/api/state`, {
    headers: { authorization: `Bearer ${loginResult.token}` },
  });
  assert.equal(Array.isArray(authorizedState.groups), true);

  console.log('account auth tests passed');
} finally {
  await server.close();
  await rm(tempDir, { recursive: true, force: true });
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  assert.equal(response.headers.get('content-type')?.includes('application/json'), true);
  assert.ok(response.status >= 200 && response.status < 300);
  return response.json();
}
