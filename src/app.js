import {
  STAGES,
  buildAssistantAdvice,
  calculateCompetencyProfile,
  calculateStageProgress,
  classifyKano,
  createGroups,
  extractKeywords,
  getRiskStatus,
  getStageToolkit,
  parseStudentText,
  rankByTopsis,
  validateClassroomState,
} from './app-core.mjs';

const STORAGE_KEY = 'service-design-studio-v01';
const ACCESS_CODE_KEY = 'service-design-access-code';
const SESSION_TOKEN_KEY = 'service-design-session-token';

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
let activeAuthMode = 'login';
let activeRole = 'teacher';
let activeGroupId = state.groups[0]?.id || 'g1';
let activeStageId = 'empathy';

const els = {
  body: document.body,
  roleButtons: [...document.querySelectorAll('[data-role]')],
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
  assistantAdvice: document.querySelector('#assistantAdvice'),
  importData: document.querySelector('#importData'),
  importFile: document.querySelector('#importFile'),
  exportData: document.querySelector('#exportData'),
  resetDemo: document.querySelector('#resetDemo'),
  authGate: document.querySelector('#authGate'),
  authTabs: document.querySelector('#authTabs'),
  loginForm: document.querySelector('#loginForm'),
  registerForm: document.querySelector('#registerForm'),
  codeForm: document.querySelector('#codeForm'),
  loginEmail: document.querySelector('#loginEmail'),
  loginPassword: document.querySelector('#loginPassword'),
  loginAccount: document.querySelector('#loginAccount'),
  registerName: document.querySelector('#registerName'),
  registerClass: document.querySelector('#registerClass'),
  registerEmail: document.querySelector('#registerEmail'),
  registerPassword: document.querySelector('#registerPassword'),
  registerAccount: document.querySelector('#registerAccount'),
  accessCodeInput: document.querySelector('#accessCodeInput'),
  unlockApp: document.querySelector('#unlockApp'),
  authMessage: document.querySelector('#authMessage'),
  modelProvider: document.querySelector('#modelProvider'),
  modelStatus: document.querySelector('#modelStatus'),
  modelPrompt: document.querySelector('#modelPrompt'),
  generateWithModel: document.querySelector('#generateWithModel'),
  modelResult: document.querySelector('#modelResult'),
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
  await loadBackendState();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

function bindEvents() {
  els.roleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeRole = button.dataset.role;
      render();
    });
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
  els.loginAccount.addEventListener('click', loginAccount);
  els.registerAccount.addEventListener('click', registerAccount);
  els.unlockApp.addEventListener('click', unlockWithAccessCode);
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
  const focusTarget = activeAuthMode === 'register' ? els.registerName : activeAuthMode === 'code' ? els.accessCodeInput : els.loginEmail;
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
}

async function loginAccount() {
  await authenticateAccount('./api/auth/login', {
    email: els.loginEmail.value,
    password: els.loginPassword.value,
  });
}

async function registerAccount() {
  await authenticateAccount('./api/auth/register', {
    name: els.registerName.value,
    className: els.registerClass.value,
    email: els.registerEmail.value,
    password: els.registerPassword.value,
  });
}

async function authenticateAccount(url, payload) {
  setAuthBusy(true);
  els.authMessage.textContent = '';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      els.authMessage.textContent = result.error || '账号验证失败，请检查填写内容。';
      return;
    }
    sessionToken = result.token;
    accessCode = '';
    sessionStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
    sessionStorage.removeItem(ACCESS_CODE_KEY);
    hideAuthGate();
    await loadBackendState();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  } catch {
    els.authMessage.textContent = '无法连接课堂服务器，请稍后重试。';
  } finally {
    setAuthBusy(false);
  }
}

function setAuthBusy(isBusy) {
  els.loginAccount.disabled = isBusy;
  els.registerAccount.disabled = isBusy;
  els.unlockApp.disabled = isBusy;
}

async function unlockWithAccessCode() {
  const nextCode = els.accessCodeInput.value.trim();
  if (!nextCode) {
    showAuthGate('请输入课堂访问口令。');
    return;
  }
  accessCode = nextCode;
  sessionToken = '';
  try {
    const response = await apiFetch('./api/auth/check', { method: 'POST' });
    if (!response.ok) {
      sessionStorage.removeItem(ACCESS_CODE_KEY);
      showAuthGate('口令不正确，请向教师确认。');
      return;
    }
    sessionStorage.setItem(ACCESS_CODE_KEY, accessCode);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    hideAuthGate();
    await loadBackendState();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  } catch {
    showAuthGate('无法连接课堂服务器，请稍后重试。');
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
    <option value="${escapeHtml(provider.id)}" ${provider.configured ? '' : 'disabled'}>
      ${escapeHtml(provider.name)}${provider.configured ? '' : '（未配置）'}
    </option>
  `).join('');

  const configured = providers.filter((provider) => provider.configured);
  els.modelStatus.textContent = configured.length ? `${configured.length} 个可用` : '未配置';
  els.modelProvider.value = configured[0]?.id || '';
}

async function generateModelAdvice() {
  const provider = els.modelProvider.value;
  const prompt = els.modelPrompt.value.trim();
  if (!provider) {
    els.modelResult.textContent = '当前服务器尚未配置可用模型。请教师先设置 API Key。';
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
    els.modelResult.textContent = '模型服务暂时不可用，请检查服务器网络或 API Key 配置。';
  } finally {
    els.generateWithModel.disabled = false;
  }
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
  els.body.classList.toggle('student-mode', activeRole === 'student');
  els.roleButtons.forEach((button) => button.classList.toggle('active', button.dataset.role === activeRole));
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

function renderLight() {
  renderHeader();
  renderVisuals();
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
  els.wordCloud.innerHTML = keywords.length
    ? keywords.map((item) => `<span style="font-size:${12 + item.count * 3}px">${escapeHtml(item.word)}</span>`).join('')
    : '<span>暂无关键词</span>';

  const ranked = rankedConcepts();
  els.rankChart.innerHTML = ranked.length
    ? ranked.map((item) => renderBar(item.title, Math.round(item.score * 100))).join('')
    : '<p class="muted">添加方案后显示排序。</p>';

  els.competencyRadar.innerHTML = renderRadar(calculateCompetencyProfile(project));
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
    if (saved?.groups?.length) return saved;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return createSampleState();
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
