import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../server.mjs';

const env = {
  APP_ACCESS_CODE: 'class-2026',
  DEEPSEEK_MODEL: 'deepseek-test',
};

const capturedRequests = [];
const fakeFetch = async (url, options = {}) => {
  capturedRequests.push({ url, options });
  if (String(url).includes('api.openalex.org/works')) {
    const isChineseQuery = decodeURIComponent(String(url)).includes('服务设计');
    return new Response(
      JSON.stringify({
        results: isChineseQuery ? [{
          id: 'https://openalex.org/W1',
          title: '近年服务设计与用户体验研究',
          publication_year: 2024,
          cited_by_count: 12,
          doi: 'https://doi.org/10.1000/chinese',
          primary_location: { source: { display_name: '包装工程' } },
          authorships: [{ author: { display_name: '张研究' } }],
        }] : [
          {
            id: 'https://openalex.org/W0',
            title: 'Advanced catalyst design',
            publication_year: 2024,
            cited_by_count: 500,
            doi: 'https://doi.org/10.1000/unrelated',
            primary_location: { source: { display_name: 'Chemistry Journal' } },
            authorships: [{ author: { display_name: 'C. Chemist' } }],
          },
          {
            id: 'https://openalex.org/W2',
            title: 'Service design for hospital navigation',
            publication_year: 2024,
            cited_by_count: 12,
            doi: 'https://doi.org/10.1000/example',
            primary_location: { source: { display_name: 'Design Journal' } },
            authorships: [{ author: { display_name: 'A. Researcher' } }],
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }
  if (String(url).includes('api.crossref.org/works')) {
    return new Response(
      JSON.stringify({
        message: {
          items: [{
            title: ['Kano AHP TRIZ service innovation'],
            published: { 'date-parts': [[2023]] },
            DOI: '10.1000/crossref',
            'container-title': ['Service Systems'],
            author: [{ given: 'B.', family: 'Scholar' }],
            'is-referenced-by-count': 5,
          }],
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }
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
  assert.deepEqual(config.storage, {
    durable: false,
    driver: 'file',
    warning: '当前未连接持久数据库，Render 重启或重新部署后注册账号可能丢失。请在 Render 配置 DATABASE_URL。',
  });
  assert.deepEqual(
    config.providers.find((provider) => provider.id === 'deepseek'),
    { id: 'deepseek', name: 'DeepSeek', configured: false, supportsUserKey: true },
  );
  assert.equal(JSON.stringify(config).includes('student-key'), false);

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

  const missingStudentKey = await fetchJson(`${baseUrl}/api/llm/chat`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-access-code': 'class-2026',
    },
    body: JSON.stringify({
      provider: 'deepseek',
      prompt: '生成调研建议',
    }),
  });
  assert.equal(missingStudentKey.ok, false);
  assert.equal(capturedRequests.length, 0);

  const modelResult = await fetchJson(`${baseUrl}/api/llm/chat`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-access-code': 'class-2026',
    },
    body: JSON.stringify({
      provider: 'deepseek',
      apiKey: 'student-key',
      model: 'deepseek-student',
      prompt: '生成调研建议',
      context: { stage: '探索与共情', projectTitle: '医院导诊服务优化' },
    }),
  });
  assert.equal(modelResult.ok, true);
  assert.equal(modelResult.content, '请先补充用户访谈样本量与关键洞察。');
  assert.equal(capturedRequests.length, 1);
  assert.equal(capturedRequests[0].url, 'https://api.deepseek.com/chat/completions');
  assert.equal(capturedRequests[0].options.headers.authorization, 'Bearer student-key');
  assert.equal(JSON.parse(capturedRequests[0].options.body).model, 'deepseek-student');

  const literature = await fetchJson(`${baseUrl}/api/literature/search`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-access-code': 'class-2026',
    },
    body: JSON.stringify({ query: 'hospital navigation service design', limit: 4 }),
  });
  assert.equal(literature.ok, true);
  assert.ok(literature.items.length >= 2);
  assert.ok(/service design|服务设计/i.test(literature.items[0].title), 'literature results should rank service-design relevance ahead of broad high-citation papers');
  assert.ok(literature.items.some((item) => item.source === 'OpenAlex'));
  assert.ok(literature.items.some((item) => item.source === 'Crossref'));
  assert.ok(literature.items.some((item) => /服务设计/.test(item.title)), 'literature search should include recent Chinese-oriented results');
  assert.ok(
    capturedRequests.some((request) => String(request.url).includes('from_publication_date:2021-01-01')),
    'OpenAlex requests should prefer literature from the recent 3-5 year window',
  );
  assert.ok(
    capturedRequests.some((request) => String(request.url).includes('from-pub-date:2021-01-01')),
    'Crossref requests should prefer literature from the recent 3-5 year window',
  );

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
