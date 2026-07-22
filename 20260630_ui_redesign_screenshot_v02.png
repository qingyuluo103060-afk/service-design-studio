import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../server.mjs';

const tempDir = await mkdtemp(join(tmpdir(), 'service-design-server-'));
const server = await startServer({
  port: 0,
  rootDir: fileURLToPath(new URL('..', import.meta.url)),
  dataDir: tempDir,
  silent: true,
});

try {
  const baseUrl = `http://127.0.0.1:${server.port}`;

  const health = await fetchJson(`${baseUrl}/api/health`);
  assert.deepEqual(health, { ok: true, service: 'service-design-studio' });

  const initialState = await fetchJson(`${baseUrl}/api/state`);
  assert.equal(Array.isArray(initialState.groups), true);

  const nextState = {
    studentText: '20260101 陈一 产品设计1班',
    groups: [
      {
        id: 'g1',
        name: '第1组',
        members: [{ id: 's1', name: '陈一', className: '产品设计1班' }],
        project: {
          title: '导诊服务测试',
          scenario: '医院导诊',
          stages: {
            empathy: { evidence: [] },
            define: { evidence: [] },
            prototype: { evidence: [] },
          },
          needs: [],
          concepts: [],
          feedback: [],
        },
      },
    ],
  };

  const saveResult = await fetchJson(`${baseUrl}/api/state`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(nextState),
  });
  assert.equal(saveResult.ok, true);

  const savedState = await fetchJson(`${baseUrl}/api/state`);
  assert.equal(savedState.groups[0].project.title, '导诊服务测试');

  const page = await fetch(`${baseUrl}/index.html`);
  assert.equal(page.status, 200);
  assert.ok((await page.text()).includes('服务设计智慧工作台'));

  console.log('server tests passed');
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
