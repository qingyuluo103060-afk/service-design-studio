import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PORT = Number(process.env.PORT || 4174);
const ROOT_DIR = fileURLToPath(new URL('.', import.meta.url));
const DEFAULT_DATA_DIR = process.env.DATA_DIR || join(ROOT_DIR, 'data');
const STATE_FILE = 'classroom-state.json';
const USERS_FILE = 'users.json';
const PROVIDERS = [
  {
    id: 'openai',
    name: 'ChatGPT / OpenAI',
    keyEnv: 'OPENAI_API_KEY',
    modelEnv: 'OPENAI_MODEL',
    defaultModel: 'gpt-4.1-mini',
    baseUrlEnv: 'OPENAI_BASE_URL',
    defaultBaseUrl: 'https://api.openai.com/v1',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    keyEnv: 'DEEPSEEK_API_KEY',
    modelEnv: 'DEEPSEEK_MODEL',
    defaultModel: 'deepseek-chat',
    baseUrlEnv: 'DEEPSEEK_BASE_URL',
    defaultBaseUrl: 'https://api.deepseek.com',
  },
  {
    id: 'kimi',
    name: 'Kimi / Moonshot',
    keyEnv: 'MOONSHOT_API_KEY',
    modelEnv: 'MOONSHOT_MODEL',
    defaultModel: 'moonshot-v1-8k',
    baseUrlEnv: 'MOONSHOT_BASE_URL',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
  },
  {
    id: 'zhipu',
    name: '智谱清言 / GLM',
    keyEnv: 'ZHIPU_API_KEY',
    modelEnv: 'ZHIPU_MODEL',
    defaultModel: 'glm-4-flash',
    baseUrlEnv: 'ZHIPU_BASE_URL',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  },
  {
    id: 'doubao',
    name: '豆包 / 火山方舟',
    keyEnv: 'DOUBAO_API_KEY',
    modelEnv: 'DOUBAO_MODEL',
    defaultModel: 'doubao-seed-1-6',
    baseUrlEnv: 'DOUBAO_BASE_URL',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  },
  {
    id: 'custom',
    name: '自定义 OpenAI 兼容接口',
    keyEnv: 'CUSTOM_LLM_API_KEY',
    modelEnv: 'CUSTOM_LLM_MODEL',
    defaultModel: 'custom-model',
    baseUrlEnv: 'CUSTOM_LLM_BASE_URL',
    defaultBaseUrl: '',
  },
];

const DEFAULT_STATE = {
  studentText: `20260101 陈一 产品设计1班
20260102 林二 产品设计1班
20260103 周三 产品设计1班
20260104 吴四 产品设计1班
20260105 郑五 产品设计1班
20260106 王六 产品设计1班
20260107 赵七 产品设计1班
20260108 孙八 产品设计1班
20260109 李九 产品设计1班
20260110 钱十 产品设计1班`,
  groups: [
    {
      id: 'g1',
      name: '第1组',
      members: [
        { id: '20260101', name: '陈一', className: '产品设计1班' },
        { id: '20260102', name: '林二', className: '产品设计1班' },
        { id: '20260103', name: '周三', className: '产品设计1班' },
        { id: '20260104', name: '吴四', className: '产品设计1班' },
        { id: '20260105', name: '郑五', className: '产品设计1班' },
      ],
      project: {
        title: '医院无忧导诊服务优化',
        scenario: '围绕老年患者、陪诊家属、导诊员和医生之间的信息传递断点，优化从入院咨询到候诊就医的服务体验。',
        stages: {
          empathy: {
            evidence: [
              {
                title: '深度访谈提纲',
                content: '访谈老年患者、家属、导诊员，关注等待、指引、信息理解和情绪压力。',
                updatedAt: new Date().toISOString(),
              },
              {
                title: '服务探险记录',
                content: '记录入口、挂号、分诊、候诊、缴费等触点，标注拥堵与信息断点。',
                updatedAt: new Date().toISOString(),
              },
            ],
          },
          define: {
            evidence: [
              {
                title: '核心用户画像',
                content: '主要用户为低数字熟练度的老年患者，关键陪同者为家属，服务协作者为导诊员。',
                updatedAt: new Date().toISOString(),
              },
            ],
          },
          prototype: { evidence: [] },
        },
        needs: [
          { title: '入口处快速理解就诊流程', importance: 5, satisfaction: 2 },
          { title: '候诊状态可视化提醒', importance: 4, satisfaction: 3 },
          { title: '家属远程同步进度', importance: 3, satisfaction: 2 },
        ],
        concepts: [
          { title: '导诊触点重构方案', novelty: 4, feasibility: 4, serviceQuality: 5, risk: 2 },
          { title: '候诊信息可视化屏', novelty: 3, feasibility: 5, serviceQuality: 4, risk: 1 },
          { title: '陪诊小程序提醒', novelty: 4, feasibility: 3, serviceQuality: 4, risk: 3 },
        ],
        feedback: [],
      },
    },
    {
      id: 'g2',
      name: '第2组',
      members: [
        { id: '20260106', name: '王六', className: '产品设计1班' },
        { id: '20260107', name: '赵七', className: '产品设计1班' },
        { id: '20260108', name: '孙八', className: '产品设计1班' },
        { id: '20260109', name: '李九', className: '产品设计1班' },
        { id: '20260110', name: '钱十', className: '产品设计1班' },
      ],
      project: {
        title: '校园共享学习空间服务优化',
        scenario: '围绕学生预约、自习、设备借用和空间秩序维护，优化校园学习空间的服务触点。',
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

export async function startServer(options = {}) {
  const rootDir = resolve(options.rootDir || ROOT_DIR);
  const dataDir = resolve(options.dataDir || DEFAULT_DATA_DIR);
  const env = options.env || process.env;
  const fetchImpl = options.fetchImpl || fetch;
  const sessions = options.sessions || new Map();
  await mkdir(dataDir, { recursive: true });

  const server = createServer(async (request, response) => {
    try {
      await routeRequest(request, response, { rootDir, dataDir, env, fetchImpl, sessions });
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error.message || '服务器内部错误' });
    }
  });

  await new Promise((resolveListen) => server.listen(options.port ?? DEFAULT_PORT, resolveListen));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : options.port ?? DEFAULT_PORT;
  if (!options.silent) {
    console.log(`Service Design Studio running at http://127.0.0.1:${port}/`);
  }
  return {
    port,
    close: () => new Promise((resolveClose) => server.close(resolveClose)),
  };
}

async function routeRequest(request, response, context) {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  if (url.pathname === '/api/health' && request.method === 'GET') {
    sendJson(response, 200, { ok: true, service: 'service-design-studio' });
    return;
  }

  if (url.pathname === '/api/config' && request.method === 'GET') {
    sendJson(response, 200, getPublicConfig(context.env));
    return;
  }

  if (url.pathname === '/api/auth/register' && request.method === 'POST') {
    const result = await registerUser(context.dataDir, context.env, context.sessions, JSON.parse(await readBody(request) || '{}'));
    sendJson(response, result.status || 200, withoutStatus(result));
    return;
  }

  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    const result = await loginUser(context.dataDir, context.env, context.sessions, JSON.parse(await readBody(request) || '{}'));
    sendJson(response, result.ok ? 200 : 401, result);
    return;
  }

  if (url.pathname === '/api/auth/check' && request.method === 'POST') {
    if (!hasAccess(request, context.env, context.sessions)) {
      sendJson(response, 401, { ok: false, error: '访问口令不正确' });
      return;
    }
    sendJson(response, 200, { ok: true });
    return;
  }

  if (url.pathname === '/api/me' && request.method === 'GET') {
    const user = getSessionUser(request, context.sessions);
    if (!user) {
      sendJson(response, 401, { ok: false, error: '请先登录' });
      return;
    }
    sendJson(response, 200, { ok: true, user });
    return;
  }

  if (url.pathname === '/api/state' && request.method === 'GET') {
    if (!requireAccess(request, response, context)) return;
    sendJson(response, 200, await readState(context.dataDir, context.env));
    return;
  }

  if (url.pathname === '/api/state' && request.method === 'PUT') {
    if (!requireAccess(request, response, context)) return;
    const body = await readBody(request);
    const state = JSON.parse(body || '{}');
    validateStateShape(state);
    await writeState(context.dataDir, state, context.env);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (url.pathname === '/api/llm/chat' && request.method === 'POST') {
    if (!requireAccess(request, response, context)) return;
    const body = JSON.parse(await readBody(request) || '{}');
    sendJson(response, 200, await callModel(body, context.env, context.fetchImpl));
    return;
  }

  if (url.pathname === '/api/literature/search' && request.method === 'POST') {
    if (!requireAccess(request, response, context)) return;
    const body = JSON.parse(await readBody(request) || '{}');
    sendJson(response, 200, await searchLiterature(body, context.fetchImpl));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    sendJson(response, 404, { ok: false, error: '接口不存在' });
    return;
  }

  await serveStatic(request, response, context.rootDir, url.pathname);
}

export function getPublicConfig(env = process.env) {
  const userAccounts = userAccountsEnabled(env);
  return {
    authRequired: userAccounts || Boolean(getAccessCode(env)),
    userAccounts,
    providers: PROVIDERS.map((provider) => ({
      id: provider.id,
      name: provider.name,
      configured: false,
      supportsUserKey: true,
    })),
  };
}

function getAccessCode(env) {
  return String(env.APP_ACCESS_CODE || '').trim();
}

function userAccountsEnabled(env) {
  return String(env.ENABLE_USER_ACCOUNTS || '').toLowerCase() === 'true';
}

function hasAccess(request, env, sessions) {
  const accountsEnabled = userAccountsEnabled(env);
  if (accountsEnabled && getSessionUser(request, sessions)) return true;
  const accessCode = getAccessCode(env);
  if (accessCode) return getRequestHeader(request, 'x-access-code') === accessCode;
  return !accountsEnabled;
}

function requireAccess(request, response, context) {
  if (hasAccess(request, context.env, context.sessions)) return true;
  sendJson(response, 401, { ok: false, error: '需要有效课堂访问口令' });
  return false;
}

async function callModel(payload, env, fetchImpl) {
  const provider = PROVIDERS.find((item) => item.id === payload.provider);
  if (!provider) {
    return { ok: false, error: '暂不支持该模型服务商' };
  }

  const apiKey = getPayloadApiKey(payload);
  const baseUrl = getPayloadBaseUrl(payload) || getProviderBaseUrl(provider, env);
  if (!apiKey || !baseUrl) {
    return { ok: false, error: `请先为 ${provider.name} 填写个人 API Key` };
  }

  const prompt = String(payload.prompt || '').trim();
  if (!prompt) {
    return { ok: false, error: '请输入要提交给模型的任务说明' };
  }

  const model = String(payload.model || env[provider.modelEnv] || provider.defaultModel).trim();
  const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: '你是服务设计课程的教学助手。请围绕调研证据、用户画像、需求筛选、方案筛选、测试评估给出可执行建议，避免编造数据。',
        },
        {
          role: 'user',
          content: buildModelPrompt(prompt, payload.context),
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, error: data.error?.message || `模型接口调用失败：${response.status}` };
  }

  return {
    ok: true,
    provider: provider.id,
    model,
    content: data.choices?.[0]?.message?.content || data.output_text || '',
  };
}

function buildModelPrompt(prompt, context = {}) {
  const contextLines = Object.entries(context || {})
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim())
    .map(([key, value]) => `${key}: ${String(value).slice(0, 1200)}`);
  return [
    '课堂项目上下文：',
    contextLines.length ? contextLines.join('\n') : '未提供',
    '',
    '学生任务：',
    prompt,
  ].join('\n');
}

function getProviderKey(provider, env) {
  return String(env[provider.keyEnv] || '').trim();
}

function getProviderBaseUrl(provider, env) {
  return String(env[provider.baseUrlEnv] || provider.defaultBaseUrl || '').trim();
}

function getPayloadApiKey(payload) {
  return String(payload.apiKey || '').trim();
}

function getPayloadBaseUrl(payload) {
  const value = String(payload.baseUrl || '').trim();
  if (!value) return '';
  return value;
}

async function searchLiterature(payload, fetchImpl) {
  const query = String(payload.query || '').trim();
  const limit = Math.max(1, Math.min(12, Number(payload.limit) || 6));
  if (!query) return { ok: false, error: '请先提供检索关键词或项目选题', items: [] };
  const encoded = encodeURIComponent(query.slice(0, 240));
  const [openAlex, crossref] = await Promise.allSettled([
    fetchOpenAlexWorks(fetchImpl, encoded, limit),
    fetchCrossrefWorks(fetchImpl, encoded, limit),
  ]);
  const items = [
    ...(openAlex.status === 'fulfilled' ? openAlex.value : []),
    ...(crossref.status === 'fulfilled' ? crossref.value : []),
  ];
  return {
    ok: true,
    query,
    sources: ['OpenAlex', 'Crossref'],
    items: dedupeLiterature(items).slice(0, limit * 2),
  };
}

async function fetchOpenAlexWorks(fetchImpl, encodedQuery, limit) {
  const response = await fetchImpl(`https://api.openalex.org/works?search=${encodedQuery}&per-page=${limit}&sort=cited_by_count:desc`, {
    headers: { accept: 'application/json' },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return [];
  return (data.results || []).map((item) => ({
    source: 'OpenAlex',
    title: String(item.title || ''),
    year: item.publication_year || '',
    venue: item.primary_location?.source?.display_name || item.host_venue?.display_name || '',
    authors: (item.authorships || []).slice(0, 4).map((auth) => auth.author?.display_name).filter(Boolean).join('; '),
    doi: normalizeDoi(item.doi),
    citedBy: Number(item.cited_by_count) || 0,
    url: item.doi || item.id || '',
    abstract: '',
  })).filter((item) => item.title);
}

async function fetchCrossrefWorks(fetchImpl, encodedQuery, limit) {
  const response = await fetchImpl(`https://api.crossref.org/works?query.bibliographic=${encodedQuery}&rows=${limit}&sort=is-referenced-by-count&order=desc`, {
    headers: { accept: 'application/json' },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return [];
  return (data.message?.items || []).map((item) => ({
    source: 'Crossref',
    title: Array.isArray(item.title) ? String(item.title[0] || '') : String(item.title || ''),
    year: item.published?.['date-parts']?.[0]?.[0] || item.issued?.['date-parts']?.[0]?.[0] || '',
    venue: Array.isArray(item['container-title']) ? String(item['container-title'][0] || '') : '',
    authors: (item.author || []).slice(0, 4).map((author) => [author.given, author.family].filter(Boolean).join(' ')).filter(Boolean).join('; '),
    doi: normalizeDoi(item.DOI),
    citedBy: Number(item['is-referenced-by-count']) || 0,
    url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : ''),
    abstract: String(item.abstract || '').replace(/<[^>]+>/g, ''),
  })).filter((item) => item.title);
}

function dedupeLiterature(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = (item.doi || item.title).toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => (b.citedBy || 0) - (a.citedBy || 0));
}

function normalizeDoi(value) {
  return String(value || '').replace(/^https?:\/\/doi\.org\//i, '').trim();
}

function getRequestHeader(request, headerName) {
  const value = request.headers[headerName.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

async function registerUser(dataDir, env, sessions, payload) {
  const role = normalizeRole(payload.role);
  const studentId = normalizeStudentId(payload.studentId);
  const teacherId = normalizeTeacherId(payload.teacherId);
  const password = String(payload.password || '');
  const name = String(payload.name || '').trim();
  if (!name || password.length < 6) {
    return { status: 400, ok: false, error: '请填写姓名和至少 6 位密码。' };
  }
  if (role === 'student' && !isValidStudentId(studentId)) {
    return { status: 400, ok: false, error: '请填写有效学号。学号需为 9 位数字，格式为 21XX17XXX。' };
  }
  if (role === 'teacher' && !isValidTeacherId(teacherId)) {
    return { status: 400, ok: false, error: '请填写有效教师工号。工号需为 8 位数字，格式为 021XXXXX。' };
  }

  const users = await readUsers(dataDir, env);
  if (role === 'student' && users.some((user) => user.role !== 'teacher' && user.studentId === studentId)) {
    return { status: 409, ok: false, error: '该学号已注册，请直接登录' };
  }
  if (role === 'teacher' && users.some((user) => user.role === 'teacher' && user.teacherId === teacherId)) {
    return { status: 409, ok: false, error: '该教师工号已注册，请直接登录' };
  }

  const user = {
    id: `u_${randomBytes(8).toString('hex')}`,
    name,
    studentId: role === 'student' ? studentId : '',
    teacherId: role === 'teacher' ? teacherId : '',
    className: role === 'student' ? String(payload.className || '').trim() : '',
    role,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
  };
  users.push(user);
  await writeUsers(dataDir, users, env);
  const publicUser = toPublicUser(user);
  const token = createSession(sessions, publicUser);
  return { ok: true, token, user: publicUser };
}

async function loginUser(dataDir, env, sessions, payload) {
  const role = normalizeRole(payload.role);
  const studentId = normalizeStudentId(payload.studentId);
  const teacherId = normalizeTeacherId(payload.teacherId);
  const password = String(payload.password || '');
  const users = await readUsers(dataDir, env);
  const user = role === 'teacher'
    ? users.find((item) => item.role === 'teacher' && item.teacherId === teacherId)
    : users.find((item) => item.role !== 'teacher' && item.studentId === studentId);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: role === 'teacher' ? '工号或密码不正确' : '学号或密码不正确' };
  }
  const publicUser = toPublicUser(user);
  return { ok: true, token: createSession(sessions, publicUser), user: publicUser };
}

async function readUsers(dataDir, env = process.env) {
  const stored = await readJsonStore(env, 'users');
  if (stored) return stored;
  try {
    return JSON.parse(await readFile(join(dataDir, USERS_FILE), 'utf8'));
  } catch {
    return [];
  }
}

async function writeUsers(dataDir, users, env = process.env) {
  if (await writeJsonStore(env, 'users', users)) return;
  await mkdir(dataDir, { recursive: true });
  await writeFile(join(dataDir, USERS_FILE), JSON.stringify(users, null, 2), 'utf8');
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash = '') {
  const [salt, hash] = String(storedHash).split(':');
  if (!salt || !hash) return false;
  const nextHash = pbkdf2Sync(password, salt, 120000, 32, 'sha256');
  const savedHash = Buffer.from(hash, 'hex');
  return savedHash.length === nextHash.length && timingSafeEqual(savedHash, nextHash);
}

function createSession(sessions, user) {
  const token = randomBytes(24).toString('hex');
  sessions.set(token, { user, createdAt: Date.now() });
  return token;
}

function getSessionUser(request, sessions) {
  const authorization = getRequestHeader(request, 'authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return sessions.get(match[1])?.user || null;
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    studentId: user.studentId || '',
    teacherId: user.teacherId || '',
    className: user.className || '',
    role: user.role || 'student',
  };
}

function normalizeRole(role) {
  return String(role || 'student').trim() === 'teacher' ? 'teacher' : 'student';
}

function normalizeStudentId(studentId) {
  return String(studentId || '').trim();
}

function normalizeTeacherId(teacherId) {
  return String(teacherId || '').trim();
}

function isValidStudentId(studentId) {
  return /^21\d{2}17\d{3}$/.test(studentId);
}

function isValidTeacherId(teacherId) {
  return /^021\d{5}$/.test(teacherId);
}

function withoutStatus(result) {
  const { status, ...payload } = result;
  return payload;
}

async function readState(dataDir, env = process.env) {
  const stored = await readJsonStore(env, 'classroom-state');
  if (stored) return stored;
  try {
    return JSON.parse(await readFile(join(dataDir, STATE_FILE), 'utf8'));
  } catch {
    await writeState(dataDir, DEFAULT_STATE, env);
    return DEFAULT_STATE;
  }
}

async function writeState(dataDir, state, env = process.env) {
  if (await writeJsonStore(env, 'classroom-state', state)) return;
  await mkdir(dataDir, { recursive: true });
  await writeFile(join(dataDir, STATE_FILE), JSON.stringify(state, null, 2), 'utf8');
}

function validateStateShape(state) {
  if (!state || !Array.isArray(state.groups) || state.groups.length === 0) {
    throw new Error('课堂数据必须包含至少一个小组。');
  }
}

let pgPoolPromise = null;

async function readJsonStore(env, key) {
  const pool = await getPostgresPool(env);
  if (!pool) return null;
  await ensureStoreTable(pool);
  const result = await pool.query('select payload from service_design_store where key = $1', [key]);
  return result.rows[0]?.payload || null;
}

async function writeJsonStore(env, key, payload) {
  const pool = await getPostgresPool(env);
  if (!pool) return false;
  await ensureStoreTable(pool);
  await pool.query(
    `insert into service_design_store (key, payload, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (key) do update set payload = excluded.payload, updated_at = now()`,
    [key, JSON.stringify(payload)],
  );
  return true;
}

async function getPostgresPool(env) {
  const connectionString = String(env.DATABASE_URL || '').trim();
  if (!connectionString) return null;
  if (!pgPoolPromise) {
    pgPoolPromise = import('pg')
      .then(({ Pool }) => new Pool({
        connectionString,
        ssl: String(env.DATABASE_SSL || 'true').toLowerCase() === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }))
      .catch(() => null);
  }
  return pgPoolPromise;
}

async function ensureStoreTable(pool) {
  await pool.query(`
    create table if not exists service_design_store (
      key text primary key,
      payload jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
}

async function serveStatic(request, response, rootDir, pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405);
    response.end('Method Not Allowed');
    return;
  }

  const safePath = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const filePath = normalize(join(rootDir, safePath));
  if (!filePath.startsWith(rootDir)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error('Not a file');
    response.writeHead(200, {
      'content-type': contentType(filePath),
      'cache-control': filePath.endsWith('sw.js') ? 'no-cache' : 'public, max-age=60',
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('File not found');
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        rejectBody(new Error('请求体过大。'));
        request.destroy();
      }
    });
    request.on('end', () => resolveBody(body));
    request.on('error', rejectBody);
  });
}

function contentType(filePath) {
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.md': 'text/markdown; charset=utf-8',
  };
  return types[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer();
}
