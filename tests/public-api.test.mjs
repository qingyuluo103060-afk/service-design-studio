import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../server.mjs';

const env = {
  APP_ACCESS_CODE: 'class-2026',
  DEEPSEEK_API_KEY: 'test-key',
  DEEPSEEK_MODEL: 'deepseek-test',
};

const capturedRequests = [];
const fakeFetch = async (url, options = {}) => {
  capturedRequests.push({ url, options });
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: '请先补充用户访谈样本量与关键洞察。' } }],
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
};

const tempDir = await mkdtemp(join(tmpdir(), 'service-design-public-api-'));
const server = await startServer({
  port: 0,
  rootDir: fileURLToPath(new URL('..', import.meta.url)),
  dataDir: tempDir,
  env,
  fetchImpl: fakeFetch,
  silent: true,
});

try {
  const baseUrl = `http://127.0.0.1:${server.port}`;

  const config = await fetchJson(`${baseUrl}/api/config`);
  assert.equal(config.authRequired, true);
  assert.deepEqual(
    config.providers.find((provider) => provider.id === 'deepseek'),
    { id: 'deepseek', name: 'DeepSeek', configured: true },
  );
  assert.equal(JSON.stringify(config).includes('test-key'), false);

  const blockedState = await fetch(`${baseUrl}/api/state`);
  assert.equal(blockedState.status, 401);

  const authorizedState = await fetchJson(`${baseUrl}/api/state`, {
    headers: { 'x-access-code': 'class-2026' },
  });
  assert.equal(Array.isArray(authorizedState.groups), true);

  const blockedModel = await fetch(`${baseUrl}/api/llm/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider: 'deepseek', prompt: '生成调研建议' }),
  });
  assert.equal(blockedModel.status, 401);

  const modelResult = await fetchJson(`${baseUrl}/api/llm/chat`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-access-code': 'class-2026',
    },
    body: JSON.stringify({
      provider: 'deepseek',
      prompt: '生成调研建议',
      context: { stage: '探索与共情', projectTitle: '医院导诊服务优化' },
    }),
  });
  assert.equal(modelResult.ok, true);
  assert.equal(modelResult.content, '请先补充用户访谈样本量与关键洞察。');
  assert.equal(capturedRequests.length, 1);
  assert.equal(capturedRequests[0].url, 'https://api.deepseek.com/chat/completions');
  assert.equal(capturedRequests[0].options.headers.authorization, 'Bearer test-key');
  assert.equal(JSON.parse(capturedRequests[0].options.body).model, 'deepseek-test');

  console.log('public api tests passed');
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
