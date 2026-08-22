import {
  STAGES,
  buildAssistantAdvice,
  calculateCompetencyProfile,
  calculateStageProgress,
  classifyKano,
  COURSE_MODULES,
  createGroups,
  extractKeywords,
  getStakeholderVisuals,
  getVisibleModules,
  getRiskStatus,
  getStageToolkit,
  mapKeywordsToBubbles,
  parseStudentText,
  rankByTopsis,
  validateClassroomState,
} from './app-core.mjs';

const STORAGE_KEY = 'service-design-studio-v01';
const ACCESS_CODE_KEY = 'service-design-access-code';
const SESSION_TOKEN_KEY = 'service-design-session-token';
const MODEL_SETTINGS_KEY = 'service-design-model-settings';
const LOCAL_ACCOUNTS_KEY = 'service-design-local-accounts';
const REQUEST_TIMEOUT_MS = 15000;

const sampleStudentsText = `20260101 陈一 产品设计1班
20260102 林二 产品设计1班
20260103 周三 产品设计1班
20260104 吴四 产品设计1班
20260105 郑五 产品设计1班
20260106 王六 产品设计1班
20260107 赵七 产品设计1班
20260108 孙八 产品设计1班
20260109 李九 产品设计1班
20260110 钱十 产品设计1班`;

let state = loadState();
let backendAvailable = false;
let backendSaveTimer = null;
let appConfig = { authRequired: false, providers: [] };
let accessCode = sessionStorage.getItem(ACCESS_CODE_KEY) || '';
let sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY) || '';
let isLocalSession = sessionToken.startsWith('local-');
let modelSettings = loadModelSettings();
let activeAuthMode = 'login';
let activeLoginRole = 'student';
let activeRegisterRole = 'student';
let currentUser = null;
let activeRole = 'teacher';
let activeModuleId = 'overview';
let activeGroupId = state.groups[0]?.id || 'g1';
let activeStageId = 'empathy';
let lockedKeyword = '';
let bubblePlayTimer = null;
let bubblePlayIndex = 0;

const els = {
  body: document.body,
  roleButtons: [...document.querySelectorAll('[data-role]')],
  moduleNav: document.querySelector('#moduleNav'),
  workspaceModules: [...document.querySelectorAll('.workspace-module')],
  workspaceRoleHint: document.querySelector('#workspaceRoleHint'),
  studentList: document.querySelector('#studentList'),
  groupSize: document.querySelector('#groupSize'),
  buildGroups: document.querySelector('#buildGroups'),
  stageNav: document.querySelector('#stageNav'),
  groupList: document.querySelector('#groupList'),
  activeStageLabel: document.querySelector('#activeStageLabel'),
  activeProjectTitle: document.querySelector('#activeProjectTitle'),
  overallProgress: document.querySelector('#overallProgress'),
  dashboardEvidence: document.querySelector('#dashboardEvidence'),
  dashboardNeeds: document.querySelector('#dashboardNeeds'),
  dashboardRisk: document.querySelector('#dashboardRisk'),
  projectTitle: document.querySelector('#projectTitle'),
  projectScenario: document.querySelector('#projectScenario'),
  stageTitle: document.querySelector('#stageTitle'),
  stageFocus: document.querySelector('#stageFocus'),
  methodToolkit: document.querySelector('#methodToolkit'),
  stageOutcome: document.querySelector('#stageOutcome'),
  evidenceList: document.querySelector('#evidenceList'),
  addEvidence: document.querySelector('#addEvidence'),
  needList: document.querySelector('#needList'),
  addNeed: document.querySelector('#addNeed'),
  conceptList: document.querySelector('#conceptList'),
  addConcept: document.querySelector('#addConcept'),
  progressBars: document.querySelector('#progressBars'),
  wordCloud: document.querySelector('#wordCloud'),
  rankChart: document.querySelector('#rankChart'),
  competencyRadar: document.querySelector('#competencyRadar'),
  flowFunnel: document.querySelector('#flowFunnel'),
  stakeholderMap: document.querySelector('#stakeholderMap'),
  kanoChart: document.querySelector('#kanoChart'),
  sankeyChart: document.querySelector('#sankeyChart'),
  studentInsights: document.querySelector('#studentInsights'),
  teacherInsights: document.querySelector('#teacherInsights'),
  assistantAdvice: document.querySelector('#assistantAdvice'),
  liveModuleTitle: document.querySelector('#liveModuleTitle'),
  liveCourseMap: document.querySelector('#liveCourseMap'),
  liveNextStep: document.querySelector('#liveNextStep'),
  liveAiCue: document.querySelector('#liveAiCue'),
  liveTeacherMini: document.querySelector('#liveTeacherMini'),
  importData: document.querySelector('#importData'),
  importFile: document.querySelector('#importFile'),
  exportData: document.querySelector('#exportData'),
  resetDemo: document.querySelector('#resetDemo'),
  authGate: document.querySelector('#authGate'),
  authTabs: document.querySelector('#authTabs'),
  loginForm: document.querySelector('#loginForm'),
  registerForm: document.querySelector('#registerForm'),
  codeForm: document.querySelector('#codeForm'),
  loginRoleChoice: document.querySelector('#loginRoleChoice'),
  registerRoleChoice: document.querySelector('#registerRoleChoice'),
  loginIdentityLabel: document.querySelector('#loginIdentityLabel'),
  loginStudentId: document.querySelector('#loginStudentId'),
  loginPassword: document.querySelector('#loginPassword'),
  loginAccount: document.querySelector('#loginAccount'),
  registerName: document.querySelector('#registerName'),
  registerClassField: document.querySelector('#registerClassField'),
  registerClass: document.querySelector('#registerClass'),
  registerIdentityLabel: document.querySelector('#registerIdentityLabel'),
  registerStudentId: document.querySelector('#registerStudentId'),
  registerIdentityHint: document.querySelector('#registerIdentityHint'),
  registerPassword: document.querySelector('#registerPassword'),
  registerAccount: document.querySelector('#registerAccount'),
  accessCodeInput: document.querySelector('#accessCodeInput'),
  unlockApp: document.querySelector('#unlockApp'),
  authMessage: document.querySelector('#authMessage'),
  modelProvider: document.querySelector('#modelProvider'),
  modelStatus: document.querySelector('#modelStatus'),
  modelApiKey: document.querySelector('#modelApiKey'),
  modelName: document.querySelector('#modelName'),
  modelBaseUrl: document.querySelector('#modelBaseUrl'),
  saveModelSettings: document.querySelector('#saveModelSettings'),
  modelPrompt: document.querySelector('#modelPrompt'),
  generateWithModel: document.querySelector('#generateWithModel'),
  modelResult: document.querySelector('#modelResult'),
  userProfile: document.querySelector('#userProfile'),
  userAvatar: document.querySelector('#userAvatar'),
  userName: document.querySelector('#userName'),
  userMeta: document.querySelector('#userMeta'),
  logoutAccount: document.querySelector('#logoutAccount'),
  vizModal: document.querySelector('#vizModal'),
  vizModalTitle: document.querySelector('#vizModalTitle'),
  vizModalBody: document.querySelector('#vizModalBody'),
};

init();

async function init() {
  els.studentList.value = state.studentText;
  bindEvents();
  render();
  await loadPublicConfig();
  renderModelProviders();
  if (appConfig.authRequired && !sessionToken && !accessCode) {
    showAuthGate();
    return;
  }
  await loadCurrentUser();
  await loadBackendState();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

function bindEvents() {
  els.roleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (currentUser?.role === 'student' && button.dataset.role === 'teacher') {
        window.alert('学生账号只能使用学生端。');
        return;
      }
      activeRole = button.dataset.role;
      render();
    });
  });

  els.moduleNav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-module-id]');
    if (!button) return;
    setActiveModule(button.dataset.moduleId);
  });

  els.buildGroups.addEventListener('click', () => {
    const students = parseStudentText(els.studentList.value);
    state.studentText = els.studentList.value;
    state.groups = createGroups(students, Number(els.groupSize.value));
    seedProjects(state.groups);
    activeGroupId = state.groups[0]?.id || activeGroupId;
    saveState();
    render();
  });

  els.stageNav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-stage-id]');
    if (!button) return;
    activeStageId = button.dataset.stageId;
    render();
  });

  els.groupList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-group-id]');
    if (!button) return;
    activeGroupId = button.dataset.groupId;
    render();
  });

  els.projectTitle.addEventListener('input', () => {
    activeGroup().project.title = els.projectTitle.value;
    saveState();
    renderLight();
  });

  els.projectScenario.addEventListener('input', () => {
    activeGroup().project.scenario = els.projectScenario.value;
    saveState();
    renderLight();
  });

  els.addEvidence.addEventListener('click', () => {
    const stage = activeProject().stages[activeStageId];
    stage.evidence.push({
      title: '新证据',
      content: '请记录证据来源、关键发现和与项目的关系。',
      updatedAt: new Date().toISOString(),
    });
    saveState();
    render();
  });

  els.addNeed.addEventListener('click', () => {
    activeProject().needs.push({
      title: '新增需求',
      importance: 4,
      satisfaction: 2,
    });
    saveState();
    render();
  });

  els.addConcept.addEventListener('click', () => {
    activeProject().concepts.push({
      title: '新增方案',
      novelty: 3,
      feasibility: 3,
      serviceQuality: 3,
      risk: 2,
    });
    saveState();
    render();
  });

  els.evidenceList.addEventListener('input', updateEvidence);
  els.needList.addEventListener('input', updateNeeds);
  els.conceptList.addEventListener('input', updateConcepts);

  els.importData.addEventListener('click', () => {
    els.importFile.click();
  });

  els.importFile.addEventListener('change', async () => {
    const file = els.importFile.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      const result = validateClassroomState(imported);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      Object.assign(state, result.value);
      activeGroupId = state.groups[0].id;
      activeStageId = 'empathy';
      els.studentList.value = state.studentText;
      saveState();
      render();
    } catch {
      window.alert('导入失败：请确认文件为有效 JSON。');
    } finally {
      els.importFile.value = '';
    }
  });

  els.exportData.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'service-design-classroom-data-v01.json';
    link.click();
    URL.revokeObjectURL(link.href);
  });

  els.resetDemo.addEventListener('click', () => {
    Object.assign(state, createSampleState());
    activeGroupId = state.groups[0].id;
    activeStageId = 'empathy';
    saveState();
    render();
  });

  els.authTabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-auth-mode]');
    if (!button) return;
    activeAuthMode = button.dataset.authMode;
    renderAuthMode();
  });
  els.loginRoleChoice.addEventListener('click', (event) => {
    const button = event.target.closest('[data-login-role]');
    if (!button) return;
    activeLoginRole = button.dataset.loginRole;
    renderAuthRoleForms();
  });
  els.registerRoleChoice.addEventListener('click', (event) => {
    const button = event.target.closest('[data-register-role]');
    if (!button) return;
    activeRegisterRole = button.dataset.registerRole;
    renderAuthRoleForms();
  });
  els.loginAccount.addEventListener('click', loginAccount);
  els.registerAccount.addEventListener('click', registerAccount);
  els.unlockApp.addEventListener('click', unlockWithAccessCode);
  els.logoutAccount.addEventListener('click', logoutAccount);
  els.saveModelSettings.addEventListener('click', saveModelSettings);
  els.modelProvider.addEventListener('change', () => {
    modelSettings.provider = els.modelProvider.value;
    applyModelSettingsToForm();
  });
  els.loginPassword.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') loginAccount();
  });
  els.registerPassword.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') registerAccount();
  });
  els.accessCodeInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') unlockWithAccessCode();
  });
  els.generateWithModel.addEventListener('click', generateModelAdvice);
  els.body.addEventListener('mouseover', handleVisualizationHover);
  els.body.addEventListener('click', handleVisualizationClick);
}

function updateEvidence(event) {
  const field = event.target.closest('[data-evidence-index]');
  if (!field) return;
  const index = Number(field.dataset.evidenceIndex);
  const key = field.dataset.key;
  const item = activeProject().stages[activeStageId].evidence[index];
  item[key] = field.value;
  item.updatedAt = new Date().toISOString();
  saveState();
  renderLight();
}

function updateNeeds(event) {
  const field = event.target.closest('[data-need-index]');
  if (!field) return;
  const item = activeProject().needs[Number(field.dataset.needIndex)];
  item[field.dataset.key] = field.type === 'number' ? Number(field.value) : field.value;
  saveState();
  renderLight();
}

function updateConcepts(event) {
  const field = event.target.closest('[data-concept-index]');
  if (!field) return;
  const item = activeProject().concepts[Number(field.dataset.conceptIndex)];
  item[field.dataset.key] = field.type === 'number' ? Number(field.value) : field.value;
  saveState();
  renderLight();
}

async function loadPublicConfig() {
  if (location.protocol === 'file:') return;
  try {
    const response = await fetch('./api/config', { cache: 'no-store' });
    if (response.ok) {
      appConfig = await response.json();
    }
  } catch {
    appConfig = { authRequired: false, providers: [] };
  }
}

function showAuthGate(message = '') {
  els.authGate.hidden = false;
  renderAuthMode();
  els.accessCodeInput.value = accessCode;
  els.authMessage.textContent = message;
  const focusTarget = activeAuthMode === 'register' ? els.registerName : activeAuthMode === 'code' ? els.accessCodeInput : els.loginStudentId;
  setTimeout(() => focusTarget.focus(), 0);
}

function hideAuthGate() {
  els.authGate.hidden = true;
  els.authMessage.textContent = '';
}

function renderAuthMode() {
  els.authTabs.querySelectorAll('[data-auth-mode]').forEach((button) => {
    button.classList.toggle('active', button.dataset.authMode === activeAuthMode);
  });
  els.loginForm.hidden = activeAuthMode !== 'login';
  els.registerForm.hidden = activeAuthMode !== 'register';
  els.codeForm.hidden = activeAuthMode !== 'code';
  renderAuthRoleForms();
}

function renderAuthRoleForms() {
  els.loginRoleChoice.querySelectorAll('[data-login-role]').forEach((button) => {
    button.classList.toggle('active', button.dataset.loginRole === activeLoginRole);
  });
  els.registerRoleChoice.querySelectorAll('[data-register-role]').forEach((button) => {
    button.classList.toggle('active', button.dataset.registerRole === activeRegisterRole);
  });

  const loginIsTeacher = activeLoginRole === 'teacher';
  els.loginIdentityLabel.textContent = loginIsTeacher ? '工号' : '学号';
  els.loginStudentId.maxLength = loginIsTeacher ? 8 : 9;
  els.loginStudentId.placeholder = loginIsTeacher ? '021XXXXX' : '21XX17XXX';

  const registerIsTeacher = activeRegisterRole === 'teacher';
  els.registerClassField.hidden = registerIsTeacher;
  els.registerIdentityLabel.textContent = registerIsTeacher ? '工号' : '学号';
  els.registerStudentId.maxLength = registerIsTeacher ? 8 : 9;
  els.registerStudentId.placeholder = registerIsTeacher ? '8位数字，如 02112345' : '9位数字，如 210117001';
  els.registerIdentityHint.textContent = registerIsTeacher
    ? '教师工号规则：8 位数字，前三位固定为 021。'
    : '学号规则：9 位数字，第 1-2 位为 21，第 5-6 位为 17。';
}

async function loginAccount() {
  await authenticateAccount('./api/auth/login', {
    role: activeLoginRole,
    studentId: els.loginStudentId.value,
    teacherId: els.loginStudentId.value,
    password: els.loginPassword.value,
  });
}

async function registerAccount() {
  const payload = {
    role: activeRegisterRole,
    name: els.registerName.value,
    className: activeRegisterRole === 'student' ? els.registerClass.value : '',
    studentId: els.registerStudentId.value,
    teacherId: els.registerStudentId.value,
    password: els.registerPassword.value,
  };
  const ok = await authenticateAccount('./api/auth/register', payload);
  if (ok && currentUser) saveLocalAccount(payload, currentUser);
}

async function authenticateAccount(url, payload) {
  setAuthBusy(true);
  els.authMessage.textContent = '正在连接课堂服务器，请稍候...';
  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await safeJson(response);
    if (!response.ok || !result.ok) {
      if (url.includes('/login') && response.status === 401 && tryLocalLogin(payload)) {
        hideAuthGate();
        renderUserProfile();
        render();
        return true;
      }
      els.authMessage.textContent = result.error || '账号验证失败，请检查填写内容。';
      return false;
    }
    sessionToken = result.token;
    isLocalSession = false;
    currentUser = result.user || null;
    applyRolePermissions();
    accessCode = '';
    sessionStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
    sessionStorage.removeItem(ACCESS_CODE_KEY);
    hideAuthGate();
    renderUserProfile();
    await loadBackendState();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
    return true;
  } catch (error) {
    if (url.includes('/login') && tryLocalLogin(payload)) {
      hideAuthGate();
      renderUserProfile();
      render();
      return true;
    }
    els.authMessage.textContent = error.name === 'AbortError'
      ? '课堂服务器响应超时，请刷新页面后重试。'
      : '无法连接课堂服务器，请稍后重试。';
    return false;
  } finally {
    setAuthBusy(false);
  }
}

function setAuthBusy(isBusy) {
  els.loginAccount.disabled = isBusy;
  els.registerAccount.disabled = isBusy;
  els.unlockApp.disabled = isBusy;
}

function logoutAccount() {
  sessionToken = '';
  isLocalSession = false;
  accessCode = '';
  currentUser = null;
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_CODE_KEY);
  renderUserProfile();
  showAuthGate('已退出，请重新登录。');
}

async function unlockWithAccessCode() {
  const nextCode = els.accessCodeInput.value.trim();
  if (!nextCode) {
    showAuthGate('请输入课堂访问口令。');
    return;
  }
  accessCode = nextCode;
  sessionToken = '';
  els.authMessage.textContent = '正在验证课堂口令...';
  try {
    const response = await apiFetch('./api/auth/check', { method: 'POST' });
    if (!response.ok) {
      sessionStorage.removeItem(ACCESS_CODE_KEY);
      showAuthGate('口令不正确，请向教师确认。');
      return;
    }
    sessionStorage.setItem(ACCESS_CODE_KEY, accessCode);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    currentUser = { name: '教师口令', role: 'teacher', teacherId: 'access-code' };
    applyRolePermissions();
    hideAuthGate();
    renderUserProfile();
    await loadBackendState();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  } catch (error) {
    showAuthGate(error.name === 'AbortError' ? '课堂服务器响应超时，请刷新页面后重试。' : '无法连接课堂服务器，请稍后重试。');
  }
}

function renderModelProviders() {
  const providers = appConfig.providers || [];
  if (!providers.length) {
    els.modelProvider.innerHTML = '<option value="">离线规则助手</option>';
    els.modelStatus.textContent = '离线';
    return;
  }

  els.modelProvider.innerHTML = providers.map((provider) => `
    <option value="${escapeHtml(provider.id)}">
      ${escapeHtml(provider.name)}
    </option>
  `).join('');

  els.modelStatus.textContent = '个人接入';
  els.modelProvider.value = modelSettings.provider || providers[0]?.id || '';
  applyModelSettingsToForm();
}

function applyModelSettingsToForm() {
  const providerSettings = getCurrentProviderSettings();
  els.modelApiKey.value = providerSettings.apiKey || '';
  els.modelName.value = providerSettings.model || defaultModelName(els.modelProvider.value);
  els.modelBaseUrl.value = providerSettings.baseUrl || '';
}

function saveModelSettings() {
  const provider = els.modelProvider.value;
  if (!provider) {
    els.modelResult.textContent = '请先选择模型服务商。';
    return;
  }
  modelSettings.provider = provider;
  modelSettings.providers = modelSettings.providers || {};
  modelSettings.providers[provider] = {
    apiKey: els.modelApiKey.value.trim(),
    model: els.modelName.value.trim(),
    baseUrl: els.modelBaseUrl.value.trim(),
  };
  localStorage.setItem(MODEL_SETTINGS_KEY, JSON.stringify(modelSettings));
  els.modelStatus.textContent = modelSettings.providers[provider].apiKey ? '已保存' : '缺少 Key';
  els.modelResult.textContent = modelSettings.providers[provider].apiKey
    ? '个人模型设置已保存到当前浏览器。'
    : '模型设置已保存，但生成建议前仍需填写 API Key。';
}

async function generateModelAdvice() {
  const provider = els.modelProvider.value;
  const prompt = els.modelPrompt.value.trim();
  const providerSettings = collectModelSettingsFromForm();
  if (!provider) {
    els.modelResult.textContent = '请先选择模型服务商。';
    return;
  }
  if (!providerSettings.apiKey) {
    els.modelResult.textContent = '请先填写个人 API Key。Key 默认只保存在当前浏览器。';
    return;
  }
  if (!prompt) {
    els.modelResult.textContent = '请先输入要交给模型处理的服务设计任务。';
    return;
  }

  els.generateWithModel.disabled = true;
  els.modelResult.textContent = '正在生成，请稍候...';
  try {
    const response = await apiFetch('./api/llm/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        provider,
        apiKey: providerSettings.apiKey,
        model: providerSettings.model,
        baseUrl: providerSettings.baseUrl,
        prompt,
        context: buildCurrentModelContext(),
      }),
    });
    const result = await response.json();
    if (response.status === 401) {
      showAuthGate('访问口令已失效，请重新输入。');
      return;
    }
    els.modelResult.textContent = result.ok ? result.content : result.error || '模型未返回有效结果。';
  } catch {
    els.modelResult.textContent = '模型服务暂时不可用，请检查个人 API Key、模型名或网络状态。';
  } finally {
    els.generateWithModel.disabled = false;
  }
}

function collectModelSettingsFromForm() {
  return {
    apiKey: els.modelApiKey.value.trim(),
    model: els.modelName.value.trim(),
    baseUrl: els.modelBaseUrl.value.trim(),
  };
}

function getCurrentProviderSettings() {
  return modelSettings.providers?.[els.modelProvider.value] || {};
}

function defaultModelName(provider) {
  const defaults = {
    openai: 'gpt-4.1-mini',
    deepseek: 'deepseek-chat',
    kimi: 'moonshot-v1-8k',
    zhipu: 'glm-4-flash',
    doubao: 'doubao-seed-1-6',
    custom: 'custom-model',
  };
  return defaults[provider] || '';
}

function buildCurrentModelContext() {
  const project = activeProject();
  const stage = activeStage();
  const evidence = project.stages[activeStageId]?.evidence || [];
  return {
    projectTitle: project.title,
    scenario: project.scenario,
    stage: stage.title,
    stageFocus: stage.focus,
    evidence: evidence.map((item) => `${item.title}: ${item.content}`).join('\n'),
    needs: project.needs.map((item) => `${item.title} 重要度${item.importance} 满意度${item.satisfaction}`).join('\n'),
    concepts: project.concepts.map((item) => `${item.title} 创新${item.novelty} 可行${item.feasibility} 质量${item.serviceQuality} 风险${item.risk}`).join('\n'),
  };
}

function render() {
  applyRolePermissions();
  els.body.classList.toggle('student-mode', activeRole === 'student');
  els.roleButtons.forEach((button) => button.classList.toggle('active', button.dataset.role === activeRole));
  renderModuleNav();
  renderWorkspaceModules();
  renderStages();
  renderGroups();
  renderProject();
  renderToolkit();
  renderStage();
  renderEvidence();
  renderNeeds();
  renderConcepts();
  renderLight();
}

function setActiveModule(moduleId) {
  const module = COURSE_MODULES.find((item) => item.id === moduleId);
  if (!module) return;
  if (!module.roles.includes(activeRole)) return;
  activeModuleId = module.id;
  if (module.stageId) {
    activeStageId = module.stageId;
  }
  render();
}

function renderModuleNav() {
  const visibleModules = getVisibleModules(activeRole);
  if (!visibleModules.some((item) => item.id === activeModuleId)) {
    activeModuleId = visibleModules[0]?.id || 'overview';
  }
  if (els.workspaceRoleHint) {
    els.workspaceRoleHint.textContent = activeRole === 'teacher'
      ? '教师可查看课堂统计、班级管理和学生工作区'
      : '学生仅显示个人项目工作模块';
  }

  const grouped = visibleModules.reduce((acc, module) => {
    if (!acc.has(module.group)) acc.set(module.group, []);
    acc.get(module.group).push(module);
    return acc;
  }, new Map());

  els.moduleNav.innerHTML = [...grouped.entries()].map(([group, modules], groupIndex) => `
    <details class="module-group" ${groupIndex < 3 ? 'open' : ''}>
      <summary>${escapeHtml(group)}</summary>
      <div class="module-group-list">
        ${modules.map((module) => `
          <button class="module-link${module.id === activeModuleId ? ' active' : ''}" data-module-id="${module.id}">
            <span class="module-icon">${escapeHtml(module.icon)}</span>
            <span>
              <strong>${escapeHtml(module.title)}</strong>
              <small>${escapeHtml(module.description)}</small>
            </span>
          </button>
        `).join('')}
      </div>
    </details>
  `).join('');
}

function renderWorkspaceModules() {
  const visibleIds = new Set(getVisibleModules(activeRole).map((module) => module.id));
  els.workspaceModules.forEach((module) => {
    const moduleId = module.id.replace('module-', '');
    const visible = visibleIds.has(moduleId);
    module.hidden = !visible;
    module.classList.toggle('active', visible && moduleId === activeModuleId);
  });
}

async function loadCurrentUser() {
  if (isLocalSession) {
    currentUser = loadLocalSessionUser();
    applyRolePermissions();
    renderUserProfile();
    return;
  }
  if (!sessionToken || location.protocol === 'file:') {
    renderUserProfile();
    return;
  }
  try {
    const response = await apiFetch('./api/me', { cache: 'no-store' });
    if (!response.ok) {
      currentUser = null;
      sessionToken = '';
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      return;
    }
    const result = await response.json();
    currentUser = result.user || null;
    applyRolePermissions();
    renderUserProfile();
  } catch {
    renderUserProfile();
  }
}

function applyRolePermissions() {
  if (currentUser?.role === 'student') {
    activeRole = 'student';
  }
  els.roleButtons.forEach((button) => {
    const locked = currentUser?.role === 'student' && button.dataset.role === 'teacher';
    button.disabled = locked;
    button.title = locked ? '学生账号不能进入教师端' : '';
    button.classList.toggle('locked', locked);
  });
}

function renderUserProfile() {
  const hasUser = Boolean(currentUser || accessCode);
  els.userProfile.hidden = !hasUser;
  els.logoutAccount.hidden = !hasUser;
  if (!hasUser) return;
  const user = currentUser || { name: '教师口令', role: 'teacher' };
  const identity = user.role === 'teacher'
    ? `教师 · ${user.teacherId || '口令进入'}`
    : `学生 · ${user.studentId || ''}${user.className ? ` · ${user.className}` : ''}`;
  els.userName.textContent = user.name || '未命名用户';
  els.userMeta.textContent = identity;
  els.userAvatar.textContent = buildAvatarText(user.name || user.role);
}

function buildAvatarText(name) {
  const text = String(name || 'SD').trim();
  if (!text) return 'SD';
  return text.slice(0, 2).toUpperCase();
}

function renderLight() {
  renderHeader();
  renderVisuals();
  renderLiveRail();
  renderAssistant();
}

function renderStages() {
  const progress = calculateStageProgress(activeProject());
  els.stageNav.innerHTML = STAGES.map((stage) => {
    const active = stage.id === activeStageId ? ' active' : '';
    return `<button class="stage-button${active}" data-stage-id="${stage.id}">
      <span class="stage-dot">${stage.shortTitle}</span>
      <span class="stage-copy">
        <strong>${stage.title}</strong>
        <small>${stage.focus}</small>
      </span>
      <span class="stage-percent">${progress[stage.id]}%</span>
    </button>`;
  }).join('');
}

function renderGroups() {
  els.groupList.innerHTML = state.groups.map((group) => {
    const active = group.id === activeGroupId ? ' active' : '';
    const progress = calculateStageProgress(group.project);
    return `<button class="group-button${active}" data-group-id="${group.id}">
      <span>
        <strong>${group.name}</strong>
        <small>${group.members.map((member) => member.name).join('、')}</small>
      </span>
      <span class="group-progress">${progress.overall}%</span>
    </button>`;
  }).join('');
}

function renderHeader() {
  const group = activeGroup();
  const stage = activeStage();
  const progress = calculateStageProgress(group.project);
  const risk = getRiskStatus(progress.overall);
  els.activeStageLabel.textContent = stage.title;
  els.activeProjectTitle.textContent = `${group.name}：${group.project.title}`;
  els.overallProgress.textContent = `${progress.overall}%`;
  const evidenceCount = STAGES.reduce(
    (sum, item) => sum + (group.project.stages[item.id]?.evidence?.length || 0),
    0,
  );
  els.dashboardEvidence.textContent = evidenceCount;
  els.dashboardNeeds.textContent = group.project.needs.length;
  els.dashboardRisk.textContent = risk.label;
  els.dashboardRisk.closest('.stat-card').dataset.tone = risk.tone;
}

function renderProject() {
  const project = activeProject();
  els.projectTitle.value = project.title;
  els.projectScenario.value = project.scenario;
}

function renderStage() {
  const stage = activeStage();
  els.stageTitle.textContent = `${stage.title}任务`;
  els.stageFocus.textContent = stage.focus;
}

function renderToolkit() {
  const toolkit = getStageToolkit(activeStageId);
  els.stageOutcome.textContent = toolkit.outcome;
  els.stageOutcome.dataset.tone = toolkit.tone;
  els.methodToolkit.innerHTML = toolkit.tools.map((tool, index) => `
    <article class="tool-card" data-tone="${toolkit.tone}">
      <span class="tool-symbol">${toolkit.symbol}${index + 1}</span>
      <div>
        <h3>${escapeHtml(tool.name)}</h3>
        <p>${escapeHtml(tool.cue)}</p>
      </div>
    </article>
  `).join('');
}

function renderEvidence() {
  const evidence = activeProject().stages[activeStageId].evidence;
  if (!evidence.length) {
    els.evidenceList.innerHTML = '<div class="empty-state">尚未提交证据。建议先添加访谈、观察、旅程图、服务蓝图或测试反馈。</div>';
    return;
  }
  els.evidenceList.innerHTML = evidence.map((item, index) => `
    <article class="evidence-item">
      <div class="card-meta">
        <span class="status-chip">${getEvidenceType(item.title)}</span>
        <small>${formatDate(item.updatedAt)}</small>
      </div>
      <label>证据标题
        <input data-evidence-index="${index}" data-key="title" value="${escapeHtml(item.title)}" />
      </label>
      <label>证据内容
        <textarea rows="4" data-evidence-index="${index}" data-key="content">${escapeHtml(item.content)}</textarea>
      </label>
    </article>
  `).join('');
}

function renderNeeds() {
  const needs = activeProject().needs;
  els.needList.innerHTML = needs.map((need, index) => {
    const kano = classifyKano(need.importance, need.satisfaction);
    const priority = Math.round((Number(need.importance) * (6 - Number(need.satisfaction))) / 25 * 100);
    return `<article class="list-item">
      <div class="list-item-header">
        <input data-need-index="${index}" data-key="title" value="${escapeHtml(need.title)}" />
        <span class="pill">${kano}</span>
      </div>
      ${renderMiniBar('优先级', priority)}
      <div class="metric-row two">
        <label>重要度<input type="number" min="1" max="5" data-need-index="${index}" data-key="importance" value="${need.importance}" /></label>
        <label>满意度<input type="number" min="1" max="5" data-need-index="${index}" data-key="satisfaction" value="${need.satisfaction}" /></label>
      </div>
    </article>`;
  }).join('');
}

function renderConcepts() {
  const ranked = rankedConcepts();
  els.conceptList.innerHTML = activeProject().concepts.map((concept, index) => {
    const rank = ranked.findIndex((item) => item.title === concept.title) + 1;
    const score = ranked.find((item) => item.title === concept.title)?.score || 0;
    return `<article class="list-item">
      <div class="list-item-header">
        <input data-concept-index="${index}" data-key="title" value="${escapeHtml(concept.title)}" />
        <span class="pill">排序 ${rank || '-'}</span>
      </div>
      ${renderMiniBar('综合得分', Math.round(score * 100))}
      <div class="metric-row">
        <label>创新<input type="number" min="1" max="5" data-concept-index="${index}" data-key="novelty" value="${concept.novelty}" /></label>
        <label>可行<input type="number" min="1" max="5" data-concept-index="${index}" data-key="feasibility" value="${concept.feasibility}" /></label>
        <label>质量<input type="number" min="1" max="5" data-concept-index="${index}" data-key="serviceQuality" value="${concept.serviceQuality}" /></label>
        <label>风险<input type="number" min="1" max="5" data-concept-index="${index}" data-key="risk" value="${concept.risk}" /></label>
      </div>
    </article>`;
  }).join('');
}

function renderVisuals() {
  const project = activeProject();
  const progress = calculateStageProgress(project);
  els.progressBars.innerHTML = STAGES.map((stage) => renderBar(stage.title, progress[stage.id])).join('');

  const text = STAGES.flatMap((stage) => project.stages[stage.id].evidence.map((item) => item.content)).join(' ');
  const keywords = extractKeywords(`${project.title} ${project.scenario} ${text}`);
  const keywordBubbles = mapKeywordsToBubbles(keywords);
  els.wordCloud.innerHTML = keywords.length
    ? `
      <button type="button" class="bubble-play" data-bubble-play>播放关键词</button>
      ${keywordBubbles.map((item, index) => {
        const detail = keywordEvidence(item.word, project);
        const activeClass = lockedKeyword === item.word ? ' active' : '';
        return `
      <span
        class="keyword-bubble${activeClass}"
        data-tone="${item.tone}"
        data-keyword="${escapeHtml(item.word)}"
        data-count="${item.count}"
        data-detail="${escapeHtml(detail)}"
        style="--size:${item.size}px;--x:${item.x}%;--y:${item.y}%;--delay:${index * -0.28}s"
        title="${escapeHtml(item.word)}：${item.count}"
      >
        <b>${escapeHtml(item.word)}</b>
        <small>${item.count}</small>
      </span>`;
      }).join('')}
      <aside class="bubble-detail" id="bubbleDetail">${renderBubbleDetail(keywordBubbles[0], project)}</aside>
    `
    : '<span class="keyword-bubble empty-bubble"><b>暂无关键词</b><small>0</small></span><aside class="bubble-detail">添加调研证据后，将显示关键词比重和背后材料。</aside>';

  const ranked = rankedConcepts();
  els.rankChart.innerHTML = ranked.length
    ? ranked.map((item) => renderBar(item.title, Math.round(item.score * 100))).join('')
    : '<p class="muted">添加方案后显示排序。</p>';

  els.competencyRadar.innerHTML = renderRadar(calculateCompetencyProfile(project));
  renderFunnel(project);
  renderStakeholderMap(project);
  renderKanoChart(project);
  renderSankeyChart(project);
  renderStudentInsights(project);
  renderTeacherInsights();
  enhanceVisualCards();
}

function renderFunnel(project) {
  if (!els.flowFunnel) return;
  const evidenceCount = STAGES.reduce((sum, stage) => sum + (project.stages[stage.id]?.evidence?.length || 0), 0);
  const rows = [
    { label: '调研证据', value: evidenceCount, width: 100 },
    { label: '用户洞察', value: Math.max(project.stages.define.evidence.length, 1), width: 78 },
    { label: '需求条目', value: project.needs.length, width: 58 },
    { label: '方案概念', value: project.concepts.length, width: 42 },
    { label: '测试迭代', value: project.stages.prototype.evidence.length, width: 28 },
  ];
  els.flowFunnel.innerHTML = rows.map((row) => `
    <div class="funnel-row" style="--w:${row.width}%">
      <span>${escapeHtml(row.label)}</span>
      <b>${row.value}</b>
    </div>
  `).join('');
}

function renderStakeholderMap(project) {
  if (!els.stakeholderMap) return;
  const scenario = `${project.title} ${project.scenario}`;
  els.stakeholderMap.innerHTML = getStakeholderVisuals().map((item, index) => `
    <div class="stakeholder-node node-${index}" data-stakeholder-type="${escapeHtml(item.type)}" data-tone="${escapeHtml(item.tone)}">
      <span class="stakeholder-symbol">${escapeHtml(item.symbol)}</span>
      <b>${escapeHtml(item.label)}</b>
      <em>${escapeHtml(item.role)}</em>
      <small>${escapeHtml(scenario.slice(0, 18))}</small>
    </div>
  `).join('') + '<div class="stakeholder-legend">人=目标用户  伴=陪伴者  服=一线服务  管=管理者  端=平台/设备</div>';
}

function renderKanoChart(project) {
  if (!els.kanoChart) return;
  if (!project.needs.length) {
    els.kanoChart.innerHTML = '<p class="muted">添加需求后显示 Kano 分类。</p>';
    return;
  }
  els.kanoChart.innerHTML = project.needs.map((need) => {
    const x = Math.max(6, Math.min(94, Number(need.satisfaction) * 18));
    const y = Math.max(6, Math.min(94, 100 - Number(need.importance) * 18));
    return `<span class="kano-point" style="left:${x}%;top:${y}%;" title="${escapeHtml(need.title)}">${escapeHtml(need.title.slice(0, 2))}</span>`;
  }).join('') + '<span class="kano-axis x">满意度</span><span class="kano-axis y">重要度</span>';
}

function renderSankeyChart(project) {
  if (!els.sankeyChart) return;
  const evidenceCount = STAGES.reduce((sum, stage) => sum + (project.stages[stage.id]?.evidence?.length || 0), 0);
  const rows = [
    ['调研证据', evidenceCount],
    ['痛点洞察', Math.max(project.stages.define.evidence.length, 1)],
    ['需求筛选', project.needs.length],
    ['方案方向', project.concepts.length],
    ['成果测试', project.stages.prototype.evidence.length],
  ];
  els.sankeyChart.innerHTML = rows.map(([label, value], index) => `
    <div class="sankey-step">
      <span>${escapeHtml(label)}</span>
      <b>${value}</b>
    </div>
    ${index < rows.length - 1 ? '<i class="sankey-link"></i>' : ''}
  `).join('');
}

function renderStudentInsights(project) {
  if (!els.studentInsights) return;
  const progress = calculateStageProgress(project);
  const ranked = rankedConcepts();
  const bestConcept = ranked[0]?.title || '暂无方案';
  const risk = getRiskStatus(progress.overall);
  els.studentInsights.innerHTML = [
    { label: '当前进度', value: `${progress.overall}%`, note: risk.suggestion },
    { label: '优先方案', value: bestConcept, note: '根据 TOPSIS 综合评分生成，可继续结合访谈反馈修正。' },
    { label: '测试证据', value: project.stages.prototype.evidence.length, note: '建议至少记录一次可观察的用户测试或服务走查反馈。' },
  ].map((item) => `
    <article class="insight-card">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <p>${escapeHtml(item.note)}</p>
    </article>
  `).join('');
}

function renderTeacherInsights() {
  if (!els.teacherInsights) return;
  const groupStats = state.groups.map((group) => ({
    name: group.name,
    progress: calculateStageProgress(group.project).overall,
    evidence: STAGES.reduce((sum, stage) => sum + (group.project.stages[stage.id]?.evidence?.length || 0), 0),
    needs: group.project.needs.length,
    concepts: group.project.concepts.length,
  }));
  const average = Math.round(groupStats.reduce((sum, group) => sum + group.progress, 0) / (groupStats.length || 1));
  els.teacherInsights.innerHTML = `
    <div class="visual-card"><h3>全班进度柱状图</h3>${groupStats.map((group) => renderBar(group.name, group.progress)).join('')}</div>
    <div class="visual-card"><h3>小组产出对比</h3>${groupStats.map((group) => renderMiniBar(`${group.name} 证据`, Math.min(100, group.evidence * 20))).join('')}</div>
    <div class="visual-card"><h3>课堂平均进度</h3><div class="big-number">${average}%</div><p class="muted">用于判断是否需要集中讲解或分组辅导。</p></div>
    <div class="visual-card"><h3>数据流桑基概览</h3><div class="sankey-chart compact">${groupStats.map((group) => `<div class="sankey-step"><span>${escapeHtml(group.name)}</span><b>${group.needs + group.concepts}</b></div>`).join('<i class="sankey-link"></i>')}</div></div>
  `;
}

function renderLiveRail() {
  if (!els.liveCourseMap) return;
  const project = activeProject();
  const progress = calculateStageProgress(project);
  const module = COURSE_MODULES.find((item) => item.id === activeModuleId) || COURSE_MODULES[0];
  const evidenceCount = STAGES.reduce(
    (sum, stage) => sum + (project.stages[stage.id]?.evidence?.length || 0),
    0,
  );
  const ranked = rankedConcepts();
  const risk = getRiskStatus(progress.overall);

  els.liveModuleTitle.textContent = module.title;
  els.liveCourseMap.innerHTML = STAGES.map((stage) => `
    <div class="live-step">
      <span class="live-dot">${escapeHtml(stage.shortTitle)}</span>
      <span class="live-track"><span class="live-fill" style="width:${progress[stage.id]}%"></span></span>
      <b>${progress[stage.id]}%</b>
    </div>
  `).join('');

  const nextStep = buildNextStepAdvice(module.id, project, progress, risk);
  els.liveNextStep.textContent = nextStep;
  els.liveAiCue.textContent = modelSettings.providers?.[modelSettings.provider]?.apiKey
    ? '个人 API Key 已保存，可在当前项目材料基础上生成阶段化建议。'
    : '请在“AI 模型设置”中保存个人 API Key，再生成访谈、Kano、TRIZ 或测试建议。';

  if (els.liveTeacherMini) {
    const average = Math.round(state.groups.reduce((sum, group) => (
      sum + calculateStageProgress(group.project).overall
    ), 0) / (state.groups.length || 1));
    els.liveTeacherMini.innerHTML = [
      ['当前小组', activeGroup().name],
      ['全班小组', `${state.groups.length} 组`],
      ['平均进度', `${average}%`],
      ['证据总数', `${evidenceCount} 条`],
      ['优先方案', ranked[0]?.title || '暂无方案'],
    ].map(([label, value]) => `
      <div class="teacher-mini-row"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>
    `).join('');
  }
}

function enhanceVisualCards() {
  [
    ['progressBars', '阶段进度柱状图'],
    ['wordCloud', '调研关键词气泡云'],
    ['competencyRadar', '能力画像雷达图'],
    ['flowFunnel', '证据到方案漏斗图'],
    ['stakeholderMap', '利益相关者地图'],
    ['kanoChart', 'Kano 需求分类图'],
    ['rankChart', 'TOPSIS 方案排序图'],
    ['sankeyChart', '数据闭环桑基图'],
  ].forEach(([id, title]) => {
    const chart = document.querySelector(`#${id}`);
    const card = chart?.closest('.visual-card, .panel');
    if (!chart || !card || card.querySelector(`[data-viz-toolbar="${id}"]`)) return;
    const toolbar = document.createElement('div');
    toolbar.className = 'viz-toolbar';
    toolbar.dataset.vizToolbar = id;
    toolbar.innerHTML = `
      <span>${title}</span>
      <button type="button" data-viz-fullscreen="${id}">全屏</button>
      <button type="button" data-viz-export="png" data-viz-target="${id}">PNG</button>
      <button type="button" data-viz-export="svg" data-viz-target="${id}">SVG</button>
      <button type="button" data-viz-export="json" data-viz-target="${id}">JSON</button>
      <button type="button" data-viz-export="csv" data-viz-target="${id}">CSV</button>
      <button type="button" data-viz-export="psd" data-viz-target="${id}">PSD说明</button>
    `;
    card.prepend(toolbar);
  });
}

function handleVisualizationHover(event) {
  const bubble = event.target.closest('.keyword-bubble[data-keyword]');
  if (!bubble || lockedKeyword) return;
  updateBubbleDetail(bubble);
}

function handleVisualizationClick(event) {
  const close = event.target.closest('[data-close-viz]');
  if (close) {
    closeVizModal();
    return;
  }

  const bubble = event.target.closest('.keyword-bubble[data-keyword]');
  if (bubble) {
    lockedKeyword = lockedKeyword === bubble.dataset.keyword ? '' : bubble.dataset.keyword;
    document.querySelectorAll('.keyword-bubble').forEach((item) => {
      item.classList.toggle('active', item.dataset.keyword === lockedKeyword);
    });
    updateBubbleDetail(bubble);
    return;
  }

  const playButton = event.target.closest('[data-bubble-play]');
  if (playButton) {
    toggleBubblePlayback(playButton);
    return;
  }

  const fullscreen = event.target.closest('[data-viz-fullscreen]');
  if (fullscreen) {
    openVizModal(fullscreen.dataset.vizFullscreen);
    return;
  }

  const exportButton = event.target.closest('[data-viz-export]');
  if (exportButton) {
    exportVisualization(exportButton.dataset.vizTarget || els.vizModalBody?.dataset.vizId, exportButton.dataset.vizExport);
  }
}

function updateBubbleDetail(bubble) {
  const detail = document.querySelector('#bubbleDetail');
  if (!detail) return;
  detail.innerHTML = `
    <strong>${escapeHtml(bubble.dataset.keyword)}</strong>
    <span>权重 ${escapeHtml(bubble.dataset.count)} · ${bubbleToneLabel(bubble.dataset.tone)}</span>
    <p>${escapeHtml(bubble.dataset.detail)}</p>
  `;
}

function toggleBubblePlayback(button) {
  const bubbles = [...document.querySelectorAll('.keyword-bubble[data-keyword]')];
  if (!bubbles.length) return;
  if (bubblePlayTimer) {
    clearInterval(bubblePlayTimer);
    bubblePlayTimer = null;
    button.textContent = '播放关键词';
    return;
  }
  lockedKeyword = '';
  button.textContent = '暂停播放';
  bubblePlayTimer = setInterval(() => {
    bubbles.forEach((item) => item.classList.remove('active'));
    const bubble = bubbles[bubblePlayIndex % bubbles.length];
    bubble.classList.add('active');
    updateBubbleDetail(bubble);
    bubblePlayIndex += 1;
  }, 1400);
}

function openVizModal(vizId) {
  const source = document.querySelector(`#${vizId}`);
  if (!source || !els.vizModal || !els.vizModalBody) return;
  els.vizModalTitle.textContent = source.closest('.visual-card, .panel')?.querySelector('h2,h3')?.textContent || '可视化预览';
  els.vizModalBody.dataset.vizId = vizId;
  els.vizModalBody.innerHTML = '';
  const clone = source.cloneNode(true);
  clone.id = `${vizId}Fullscreen`;
  clone.classList.add('viz-fullscreen-clone');
  els.vizModalBody.appendChild(clone);
  els.vizModal.hidden = false;
}

function closeVizModal() {
  if (!els.vizModal) return;
  els.vizModal.hidden = true;
  els.vizModalBody.innerHTML = '';
}

function exportVisualization(vizId, format) {
  if (!vizId || !format) return;
  if (format === 'json') {
    downloadText(`${vizId}.json`, JSON.stringify(activeProject(), null, 2), 'application/json');
    return;
  }
  if (format === 'csv') {
    downloadText(`${vizId}.csv`, projectToCsv(activeProject()), 'text/csv;charset=utf-8');
    return;
  }
  if (format === 'psd') {
    downloadText(`${vizId}-psd-workflow.txt`, '浏览器无法直接生成真正的 PSD 分层文件。请导出 SVG 后用 Photoshop、Illustrator、Figma 或 Photopea 打开，即可继续编辑矢量图层。', 'text/plain;charset=utf-8');
    return;
  }
  const node = document.querySelector(`#${vizId}`);
  if (!node) return;
  const svgText = htmlToEditableSvg(node, vizId);
  if (format === 'svg') {
    downloadText(`${vizId}.svg`, svgText, 'image/svg+xml;charset=utf-8');
    return;
  }
  exportSvgAsPng(svgText, `${vizId}.png`);
}

function htmlToEditableSvg(node, label) {
  const rect = node.getBoundingClientRect();
  const width = Math.max(800, Math.ceil(rect.width || 800));
  const height = Math.max(480, Math.ceil(rect.height || 480));
  const html = new XMLSerializer().serializeToString(node.cloneNode(true));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <title>${escapeHtml(label)}</title>
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml">${html}</div>
    </foreignObject>
  </svg>`;
}

function exportSvgAsPng(svgText, filename) {
  const image = new Image();
  const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }));
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width || 1200;
    canvas.height = image.height || 720;
    canvas.getContext('2d').drawImage(image, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(filename, blob);
      URL.revokeObjectURL(url);
    });
  };
  image.src = url;
}

function keywordEvidence(word, project) {
  const evidence = STAGES.flatMap((stage) => project.stages[stage.id]?.evidence || []);
  const matched = evidence.find((item) => `${item.title} ${item.content}`.includes(word));
  const fallback = evidence[0];
  const source = matched || fallback;
  if (!source) return '暂无可追溯调研内容。';
  return `${source.title}：${source.content}`.slice(0, 180);
}

function renderBubbleDetail(item, project) {
  if (!item) return '<strong>暂无关键词</strong><p>添加调研证据后，将显示词语权重和背后材料。</p>';
  return `
    <strong>${escapeHtml(item.word)}</strong>
    <span>权重 ${item.count} · ${bubbleToneLabel(item.tone)}</span>
    <p>${escapeHtml(keywordEvidence(item.word, project))}</p>
  `;
}

function bubbleToneLabel(tone) {
  return {
    research: '调研证据',
    need: '需求/痛点',
    concept: '方案/蓝图',
    test: '测试评估',
  }[tone] || '综合词';
}

function projectToCsv(project) {
  const rows = [['type', 'stage', 'title', 'value_a', 'value_b', 'content']];
  STAGES.forEach((stage) => {
    (project.stages[stage.id]?.evidence || []).forEach((item) => {
      rows.push(['evidence', stage.title, item.title, '', '', item.content]);
    });
  });
  project.needs.forEach((item) => rows.push(['need', '', item.title, item.importance, item.satisfaction, '']));
  project.concepts.forEach((item) => rows.push(['concept', '', item.title, item.feasibility, item.serviceQuality, `novelty=${item.novelty};risk=${item.risk}`]));
  return rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
}

function downloadText(filename, content, type) {
  downloadBlob(filename, new Blob([content], { type }));
}

function downloadBlob(filename, blob) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function buildNextStepAdvice(moduleId, project, progress, risk) {
  const stageEvidence = project.stages[activeStageId]?.evidence?.length || 0;
  if (moduleId === 'research' && stageEvidence < 3) {
    return '当前调研证据还偏少，建议补充访谈、观察或问卷材料，并把原话整理成可追溯证据。';
  }
  if (moduleId === 'persona') {
    return '把调研证据转成一类核心用户画像，再标出目标用户、协作者、管理者和平台资源之间的关系。';
  }
  if (moduleId === 'needs' && project.needs.length < 4) {
    return '建议先扩展需求条目，再用重要度和满意度做 Kano 初筛，避免过早锁定单一方案。';
  }
  if (moduleId === 'concepts' && project.concepts.length < 3) {
    return '用 TRIZ 或触点重构至少提出 3 个方案，再用 TOPSIS 比较创新、可行、质量和风险。';
  }
  if (moduleId === 'blueprint') {
    return '把最佳方案拆成前台行为、后台支持、触点证据和失败点，形成可展示的服务蓝图。';
  }
  if (moduleId === 'testing') {
    return '围绕 SERVQUAL 五个维度记录测试反馈，并把修改依据回连到需求和方案。';
  }
  if (moduleId === 'teacher-dashboard') {
    return '优先关注进度低于 60% 或证据链断裂的小组，课堂巡回时直接查看其阶段材料。';
  }
  if (moduleId === 'ai-settings') {
    return '接入个人模型后，可以让 AI 生成下一轮访谈提纲、需求筛选理由或测试评价问题。';
  }
  if (progress.overall < 70) {
    return risk.suggestion;
  }
  return '项目已经形成基础闭环，下一步应加强测试反馈、成果可视化和最终表达质量。';
}

function renderAssistant() {
  const advice = buildAssistantAdvice(activeProject(), activeStageId);
  const groups = [
    { title: '当前任务建议', items: advice.slice(0, 2) },
    { title: '质量检查', items: advice.slice(2, 4) },
    { title: '下一步行动', items: advice.slice(4) },
  ];
  els.assistantAdvice.innerHTML = groups.map((group) => `
    <section class="advice-section">
      <h3>${group.title}</h3>
      ${group.items.map((item) => `<div class="advice-item">${escapeHtml(item)}</div>`).join('')}
    </section>
  `).join('');
}

function renderBar(label, value) {
  return `<div class="bar-row">
    <div class="bar-label"><span>${escapeHtml(label)}</span><span>${value}%</span></div>
    <div class="bar-track"><div class="bar-fill" style="width:${Math.max(0, Math.min(100, value))}%"></div></div>
  </div>`;
}

function renderMiniBar(label, value) {
  return `<div class="mini-bar">
    <span>${label}</span>
    <div class="bar-track"><div class="bar-fill" style="width:${Math.max(0, Math.min(100, value))}%"></div></div>
    <b>${value}%</b>
  </div>`;
}

function renderRadar(profile) {
  const labels = Object.keys(profile);
  const center = 96;
  const maxRadius = 70;
  const points = labels.map((label, index) => {
    const angle = (-90 + (360 / labels.length) * index) * (Math.PI / 180);
    const radius = (profile[label] / 100) * maxRadius;
    return {
      label,
      value: profile[label],
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      ax: center + Math.cos(angle) * maxRadius,
      ay: center + Math.sin(angle) * maxRadius,
    };
  });
  const polygon = points.map((point) => `${point.x},${point.y}`).join(' ');
  const axes = points.map((point) => `<line x1="${center}" y1="${center}" x2="${point.ax}" y2="${point.ay}" />`).join('');
  const labelsMarkup = points.map((point) => `
    <div class="radar-metric">
      <span>${point.label}</span>
      <b>${point.value}</b>
    </div>
  `).join('');
  return `
    <svg class="radar-svg" viewBox="0 0 192 192" role="img" aria-label="能力画像雷达图">
      <circle cx="${center}" cy="${center}" r="70" />
      <circle cx="${center}" cy="${center}" r="46" />
      <circle cx="${center}" cy="${center}" r="23" />
      ${axes}
      <polygon points="${polygon}" />
    </svg>
    <div class="radar-metrics">${labelsMarkup}</div>
  `;
}

function getEvidenceType(title) {
  const text = String(title || '');
  if (text.includes('访谈')) return '访谈';
  if (text.includes('观察') || text.includes('探险')) return '观察';
  if (text.includes('画像')) return '画像';
  if (text.includes('蓝图')) return '蓝图';
  if (text.includes('测试')) return '测试';
  return '证据';
}

function rankedConcepts() {
  return rankByTopsis(activeProject().concepts, [
    { key: 'novelty', weight: 0.25, direction: 'benefit' },
    { key: 'feasibility', weight: 0.3, direction: 'benefit' },
    { key: 'serviceQuality', weight: 0.3, direction: 'benefit' },
    { key: 'risk', weight: 0.15, direction: 'cost' },
  ]);
}

function activeGroup() {
  return state.groups.find((group) => group.id === activeGroupId) || state.groups[0];
}

function activeProject() {
  return activeGroup().project;
}

function activeStage() {
  return STAGES.find((stage) => stage.id === activeStageId) || STAGES[0];
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleBackendSave();
}

async function loadBackendState() {
  if (isLocalSession) return;
  if (location.protocol === 'file:') return;
  try {
    const response = await apiFetch('./api/state', { cache: 'no-store' });
    if (response.status === 401) {
      showAuthGate('请先输入课堂访问口令。');
      return;
    }
    if (!response.ok) return;
    const result = validateClassroomState(await response.json());
    if (!result.ok) return;
    backendAvailable = true;
    state = result.value;
    activeGroupId = state.groups[0]?.id || activeGroupId;
    activeStageId = 'empathy';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    els.studentList.value = state.studentText;
    render();
  } catch {
    backendAvailable = false;
  }
}

function scheduleBackendSave() {
  if (!backendAvailable || location.protocol === 'file:') return;
  clearTimeout(backendSaveTimer);
  backendSaveTimer = setTimeout(() => {
    persistBackendState().catch(() => {
      backendAvailable = false;
    });
  }, 450);
}

async function persistBackendState() {
  const response = await apiFetch('./api/state', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(state),
  });
  if (response.status === 401) {
    showAuthGate('访问口令已失效，请重新输入。');
  }
  if (!response.ok) throw new Error('backend save failed');
}

function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (sessionToken) {
    headers.set('authorization', `Bearer ${sessionToken}`);
  }
  if (accessCode) {
    headers.set('x-access-code', accessCode);
  }
  return fetch(url, { ...options, headers });
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const result = validateClassroomState(saved);
    if (result.ok) return result.value;
  } catch {
    // Fall through to reset corrupt local state.
  }
  localStorage.removeItem(STORAGE_KEY);
  return createSampleState();
}

function loadModelSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(MODEL_SETTINGS_KEY));
    if (saved && typeof saved === 'object') return saved;
  } catch {
    localStorage.removeItem(MODEL_SETTINGS_KEY);
  }
  return { provider: 'deepseek', providers: {} };
}

function saveLocalAccount(payload, publicUser) {
  const accounts = loadLocalAccounts();
  const key = localAccountKey(payload.role, payload.studentId, payload.teacherId);
  accounts[key] = {
    user: publicUser,
    passwordCheck: weakPasswordCheck(payload.password),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function tryLocalLogin(payload) {
  const key = localAccountKey(payload.role, payload.studentId, payload.teacherId);
  const account = loadLocalAccounts()[key];
  if (!account || account.passwordCheck !== weakPasswordCheck(payload.password)) return false;
  currentUser = account.user;
  activeRole = currentUser.role === 'teacher' ? 'teacher' : 'student';
  sessionToken = `local-${key}-${Date.now()}`;
  isLocalSession = true;
  sessionStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
  els.authMessage.textContent = '已使用本机账号备份进入。Render 服务器账号可能已因重部署丢失，建议后续接入持久数据库。';
  return true;
}

function loadLocalSessionUser() {
  const match = sessionToken.match(/^local-(.+)-\d+$/);
  if (!match) return null;
  return loadLocalAccounts()[match[1]]?.user || null;
}

function loadLocalAccounts() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY));
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    localStorage.removeItem(LOCAL_ACCOUNTS_KEY);
    return {};
  }
}

function localAccountKey(role, studentId, teacherId) {
  const normalizedRole = role === 'teacher' ? 'teacher' : 'student';
  const identity = normalizedRole === 'teacher' ? teacherId : studentId;
  return `${normalizedRole}:${String(identity || '').trim()}`;
}

function weakPasswordCheck(password) {
  let hash = 2166136261;
  String(password || '').split('').forEach((char) => {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  });
  return (hash >>> 0).toString(16);
}

function createSampleState() {
  const groups = createGroups(parseStudentText(sampleStudentsText), 5);
  seedProjects(groups);
  return {
    studentText: sampleStudentsText,
    groups,
  };
}

function seedProjects(groups) {
  groups.forEach((group, index) => {
    if (!group.project) return;
    group.project.title = index === 0 ? '医院无忧导诊服务优化' : '校园共享学习空间服务优化';
    group.project.scenario = index === 0
      ? '围绕老年患者、陪诊家属、导诊员和医生之间的信息传递断点，优化从入院咨询到候诊就医的服务体验。'
      : '围绕学生预约、自习、设备借用和空间秩序维护，优化校园学习空间的服务触点。';
    group.project.stages.empathy.evidence = [
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
    ];
    group.project.stages.define.evidence = [
      {
        title: '核心用户画像',
        content: '主要用户为低数字熟练度的老年患者，关键陪同者为家属，服务协作者为导诊员。',
        updatedAt: new Date().toISOString(),
      },
    ];
    group.project.needs = [
      { title: '入口处快速理解就诊流程', importance: 5, satisfaction: 2 },
      { title: '候诊状态可视化提醒', importance: 4, satisfaction: 3 },
      { title: '家属远程同步进度', importance: 3, satisfaction: 2 },
    ];
    group.project.concepts = [
      { title: '导诊触点重构方案', novelty: 4, feasibility: 4, serviceQuality: 5, risk: 2 },
      { title: '候诊信息可视化屏', novelty: 3, feasibility: 5, serviceQuality: 4, risk: 1 },
      { title: '陪诊小程序提醒', novelty: 4, feasibility: 3, serviceQuality: 4, risk: 3 },
    ];
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatDate(value) {
  if (!value) return '未记录';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return { ok: false, error: '服务器返回内容无法解析，请刷新页面后重试。' };
  }
}
