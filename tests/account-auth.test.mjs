import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../server.mjs';

const tempDir = await mkdtemp(join(tmpdir(), 'service-design-account-auth-'));
const authEnv = { ENABLE_USER_ACCOUNTS: 'true', SESSION_SECRET: 'test-session-secret-for-account-auth' };
await writeFile(
  join(tempDir, 'classroom-state.json'),
  JSON.stringify({
    studentText: '210117001 陈一 产品设计1班\n210117002 林二 产品设计1班',
    groups: [
      {
        id: 'g1',
        name: '第1组',
        members: [
          { id: '210117001', name: '陈一', className: '产品设计1班' },
          { id: '210117002', name: '林二', className: '产品设计1班' },
        ],
        project: {
          title: '第一组项目',
          scenario: '第一组场景',
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
      {
        id: 'g2',
        name: '第2组',
        members: [
          { id: '210117003', name: '周三', className: '产品设计1班' },
        ],
        project: {
          title: '第二组项目',
          scenario: '第二组场景',
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
    stages: [],
    projects: {},
  }),
  'utf8',
);
const server = await startServer({
  port: 0,
  rootDir: fileURLToPath(new URL('..', import.meta.url)),
  dataDir: tempDir,
  env: authEnv,
  silent: true,
});

try {
  const baseUrl = `http://127.0.0.1:${server.port}`;

  const config = await fetchJson(`${baseUrl}/api/config`);
  assert.equal(config.authRequired, true);
  assert.equal(config.userAccounts, true);

  const blockedState = await fetch(`${baseUrl}/api/state`);
  assert.equal(blockedState.status, 401);

  const unlistedStudent = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      role: 'student',
      name: '未列名',
      studentId: '210217001',
      password: 'pass1234',
    }),
  });
  assert.equal(unlistedStudent.status, 403);

  const wrongRosterName = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      role: 'student',
      name: '张三',
      studentId: '210117001',
      password: 'pass1234',
    }),
  });
  assert.equal(wrongRosterName.status, 403);

  const registerResult = await fetchJson(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      role: 'student',
      name: '陈一',
      studentId: '210117001',
      password: 'pass1234',
      className: '产品设计1班',
    }),
  });
  assert.equal(registerResult.ok, true);
  assert.equal(registerResult.user.role, 'student');
  assert.equal(registerResult.user.studentId, '210117001');
  assert.ok(registerResult.token.length > 20);
  assert.equal(JSON.stringify(registerResult).includes('pass1234'), false);

  const invalidStudentId = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      role: 'student',
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
      role: 'student',
      name: '陈一',
      studentId: '210117001',
      password: 'pass1234',
    }),
  });
  assert.equal(duplicate.status, 409);

  const loginResult = await fetchJson(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ role: 'student', studentId: '210117001', password: 'pass1234' }),
  });
  assert.equal(loginResult.ok, true);
  assert.equal(loginResult.user.name, '陈一');
  assert.equal(loginResult.user.role, 'student');

  const me = await fetchJson(`${baseUrl}/api/me`, {
    headers: { authorization: `Bearer ${loginResult.token}` },
  });
  assert.equal(me.user.className, '产品设计1班');
  assert.equal(me.user.studentId, '210117001');
  assert.equal(me.user.role, 'student');

  const teacherRegisterResult = await fetchJson(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      role: 'teacher',
      name: '教师A',
      teacherId: '02112345',
      password: 'pass1234',
    }),
  });
  assert.equal(teacherRegisterResult.ok, true);
  assert.equal(teacherRegisterResult.user.role, 'teacher');
  assert.equal(teacherRegisterResult.user.teacherId, '02112345');
  assert.equal(teacherRegisterResult.user.studentId, '');

  const invalidTeacherId = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      role: 'teacher',
      name: '格式错误教师',
      teacherId: '02212345',
      password: 'pass1234',
    }),
  });
  assert.equal(invalidTeacherId.status, 400);

  const duplicateTeacher = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      role: 'teacher',
      name: '教师A',
      teacherId: '02112345',
      password: 'pass1234',
    }),
  });
  assert.equal(duplicateTeacher.status, 409);

  const teacherLoginResult = await fetchJson(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ role: 'teacher', teacherId: '02112345', password: 'pass1234' }),
  });
  assert.equal(teacherLoginResult.ok, true);
  assert.equal(teacherLoginResult.user.role, 'teacher');

  const authorizedState = await fetchJson(`${baseUrl}/api/state`, {
    headers: { authorization: `Bearer ${loginResult.token}` },
  });
  assert.equal(Array.isArray(authorizedState.groups), true);
  assert.equal(authorizedState.groups.length, 1, 'student state should include only the student group');
  assert.equal(authorizedState.groups[0].id, 'g1');

  const studentSave = await fetchJson(`${baseUrl}/api/state`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${loginResult.token}` },
    body: JSON.stringify({
      studentText: '999999999 非法改名 非法班级',
      groups: [
        {
          id: 'g1',
          name: '第1组',
          members: [{ id: '210117001', name: '陈一', className: '产品设计1班' }],
          project: {
            title: '学生更新自己的项目',
            scenario: '只允许更新本组项目',
            stages: {
              empathy: { evidence: [{ title: '访谈', content: '学生补充本组证据' }] },
              define: { evidence: [] },
              prototype: { evidence: [] },
            },
            needs: [],
            concepts: [],
            feedback: [],
          },
        },
        {
          id: 'g2',
          name: '第2组',
          members: [{ id: '210117003', name: '被篡改', className: '非法班级' }],
          project: {
            title: '不应被学生覆盖',
            scenario: '非法',
            stages: { empathy: { evidence: [] }, define: { evidence: [] }, prototype: { evidence: [] } },
            needs: [],
            concepts: [],
            feedback: [],
          },
        },
      ],
    }),
  });
  assert.equal(studentSave.ok, true);

  const teacherStateAfterStudentSave = await fetchJson(`${baseUrl}/api/state`, {
    headers: { authorization: `Bearer ${teacherLoginResult.token}` },
  });
  assert.equal(teacherStateAfterStudentSave.groups.length, 2);
  assert.equal(teacherStateAfterStudentSave.groups[0].project.title, '学生更新自己的项目');
  assert.equal(teacherStateAfterStudentSave.groups[1].project.title, '第二组项目');
  assert.equal(teacherStateAfterStudentSave.studentText.includes('非法改名'), false);

  const restartedServer = await startServer({
    port: 0,
    rootDir: fileURLToPath(new URL('..', import.meta.url)),
    dataDir: tempDir,
    env: authEnv,
    silent: true,
  });
  try {
    const restartedMe = await fetchJson(`http://127.0.0.1:${restartedServer.port}/api/me`, {
      headers: { authorization: `Bearer ${loginResult.token}` },
    });
    assert.equal(restartedMe.user.studentId, '210117001');
    assert.equal(restartedMe.user.name, '陈一');
  } finally {
    await restartedServer.close();
  }

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
