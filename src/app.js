import {
  STAGES,
  analyzeKanoResponses,
  buildAssistantAdvice,
  calculateAhpConsistency,
  calculateCompetencyProfile,
  calculateStageProgress,
  classifyKano,
  COURSE_MODULES,
  METHOD_TASK_CHAIN,
  METHOD_PROCESS_TEMPLATES,
  buildMethodTaskPlan,
  summarizeMethodTaskProgress,
  createGroups,
  extractKeywords,
  getStakeholderVisuals,
  getVisibleModules,
  getRiskStatus,
  getStageToolkit,
  mapKeywordsToBubbles,
  parseStudentText,
  calculateTopsisAnalysis,
  parseAhpMatrixCsv,
  parseTopsisMatrixCsv,
  parseCsvTable,
  buildJourneyRows,
  buildTrizRows,
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
  currentMethodPanel: document.querySelector('#currentMethodPanel'),
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
  methodChainSummary: document.querySelector('#methodChainSummary'),
  methodTaskBoard: document.querySelector('#methodTaskBoard'),
  methodProcessBoard: document.querySelector('#methodProcessBoard'),
  projectTitle: document.querySelector('#projectTitle'),
  projectScenario: document.querySelector('#projectScenario'),
  generateTaskPlan: document.querySelector('#generateTaskPlan'),
  recommendLiterature: document.querySelector('#recommendLiterature'),
  taskPlanPreview: document.querySelector('#taskPlanPreview'),
  literatureResult: document.querySelector('#literatureResult'),
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
  personaBoard: document.querySelector('#personaBoard'),
  kanoChart: document.querySelector('#kanoChart'),
  kanoQuestionnaire: document.querySelector('#kanoQuestionnaire'),
  kanoSurveyFile: document.querySelector('#kanoSurveyFile'),
  downloadKanoSurvey: document.querySelector('#downloadKanoSurvey'),
  analyzeKanoSurvey: document.querySelector('#analyzeKanoSurvey'),
  kanoSurveyResult: document.querySelector('#kanoSurveyResult'),
  ahpMatrixText: document.querySelector('#ahpMatrixText'),
  ahpNote: document.querySelector('#ahpNote'),
  ahpMatrixFile: document.querySelector('#ahpMatrixFile'),
  downloadAhpTemplate: document.querySelector('#downloadAhpTemplate'),
  analyzeAhpMatrix: document.querySelector('#analyzeAhpMatrix'),
  analyzeAhpWithAi: document.querySelector('#analyzeAhpWithAi'),
  ahpMatrixResult: document.querySelector('#ahpMatrixResult'),
  journeyTable: document.querySelector('#journeyTable'),
  journeyMap: document.querySelector('#journeyMap'),
  journeyFile: document.querySelector('#journeyFile'),
  downloadJourneyTemplate: document.querySelector('#downloadJourneyTemplate'),
  analyzeJourney: document.querySelector('#analyzeJourney'),
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
  testModelConnection: document.querySelector('#testModelConnection'),
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
  rawResearchData: document.querySelector('#rawResearchData'),
  rawResearchFile: document.querySelector('#rawResearchFile'),
  researchAnalysisPrompt: document.querySelector('#researchAnalysisPrompt'),
  runResearchAnalysis: document.querySelector('#runResearchAnalysis'),
  researchAnalysisResult: document.querySelector('#researchAnalysisResult'),
  researchQuadrant: document.querySelector('#researchQuadrant'),
  interviewTranscript: document.querySelector('#interviewTranscript'),
  interviewTranscriptFile: document.querySelector('#interviewTranscriptFile'),
  interviewMethod: document.querySelector('#interviewMethod'),
  interviewCodingPrompt: document.querySelector('#interviewCodingPrompt'),
  runInterviewCoding: document.querySelector('#runInterviewCoding'),
  interviewCodingResult: document.querySelector('#interviewCodingResult'),
  blueprintTemplate: document.querySelector('#blueprintTemplate'),
  analyzeBlueprint: document.querySelector('#analyzeBlueprint'),
  generateProjectReport: document.querySelector('#generateProjectReport'),
  exportProjectPackage: document.querySelector('#exportProjectPackage'),
  printProjectPdf: document.querySelector('#printProjectPdf'),
  projectReportPreview: document.querySelector('#projectReportPreview'),
  rubricText: document.querySelector('#rubricText'),
  rubricFile: document.querySelector('#rubricFile'),
  gradeComposition: document.querySelector('#gradeComposition'),
  runSmartScore: document.querySelector('#runSmartScore'),
  exportGradebook: document.querySelector('#exportGradebook'),
  gradingTable: document.querySelector('#gradingTable'),
  randomAssignRoles: document.querySelector('#randomAssignRoles'),
  clearGroupRoles: document.querySelector('#clearGroupRoles'),
  roleBoard: document.querySelector('#roleBoard'),
  challengeBoard: document.querySelector('#challengeBoard'),
  trizWorksheet: document.querySelector('#trizWorksheet'),
  trizFile: document.querySelector('#trizFile'),
  downloadTrizTemplate: document.querySelector('#downloadTrizTemplate'),
  analyzeTriz: document.querySelector('#analyzeTriz'),
  trizResult: document.querySelector('#trizResult'),
  topsisMatrixFile: document.querySelector('#topsisMatrixFile'),
  downloadTopsisTemplate: document.querySelector('#downloadTopsisTemplate'),
  analyzeTopsisMatrix: document.querySelector('#analyzeTopsisMatrix'),
  analyzeTopsisWithAi: document.querySelector('#analyzeTopsisWithAi'),
  topsisMatrixResult: document.querySelector('#topsisMatrixResult'),
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
  els.generateTaskPlan?.addEventListener('click', generateTaskPlan);
  els.recommendLiterature?.addEventListener('click', recommendLiterature);
  els.methodTaskBoard?.addEventListener('click', handleMethodTaskClick);
  els.taskPlanPreview?.addEventListener('click', handleMethodTaskClick);

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
  els.testModelConnection?.addEventListener('click', testModelConnection);
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
  els.rawResearchFile?.addEventListener('change', () => readTextFileInto(els.rawResearchFile, els.rawResearchData));
  els.interviewTranscriptFile?.addEventListener('change', () => readTextFileInto(els.interviewTranscriptFile, els.interviewTranscript));
  els.rubricFile?.addEventListener('change', () => readTextFileInto(els.rubricFile, els.rubricText));
  els.runResearchAnalysis?.addEventListener('click', runResearchAnalysis);
  els.runInterviewCoding?.addEventListener('click', runInterviewCoding);
  els.downloadKanoSurvey?.addEventListener('click', downloadKanoSurvey);
  els.analyzeKanoSurvey?.addEventListener('click', analyzeKanoSurvey);
  els.downloadAhpTemplate?.addEventListener('click', downloadAhpTemplate);
  els.ahpMatrixFile?.addEventListener('change', () => readTextFileInto(els.ahpMatrixFile, els.ahpMatrixText));
  els.analyzeAhpMatrix?.addEventListener('click', analyzeAhpMatrix);
  els.analyzeAhpWithAi?.addEventListener('click', () => explainMethodResultWithAi('ahp'));
  els.downloadJourneyTemplate?.addEventListener('click', downloadJourneyTemplate);
  els.journeyFile?.addEventListener('change', importJourneyFile);
  els.analyzeJourney?.addEventListener('click', analyzeJourney);
  els.downloadTrizTemplate?.addEventListener('click', downloadTrizTemplate);
  els.trizFile?.addEventListener('change', importTrizFile);
  els.analyzeTriz?.addEventListener('click', analyzeTriz);
  els.downloadTopsisTemplate?.addEventListener('click', downloadTopsisTemplate);
  els.analyzeTopsisMatrix?.addEventListener('click', analyzeTopsisMatrix);
  els.analyzeTopsisWithAi?.addEventListener('click', () => explainMethodResultWithAi('topsis'));
  els.topsisMatrixFile?.addEventListener('change', analyzeTopsisMatrix);
  els.analyzeBlueprint?.addEventListener('click', () => openSmartAnalysis('blueprintTemplate'));
  els.generateProjectReport?.addEventListener('click', generateProjectReport);
  els.exportProjectPackage?.addEventListener('click', exportProjectPackage);
  els.printProjectPdf?.addEventListener('click', printProjectPdf);
  els.runSmartScore?.addEventListener('click', runSmartScore);
  els.exportGradebook?.addEventListener('click', exportGradebook);
  els.gradingTable?.addEventListener('input', updateGradebookRecord);
  els.randomAssignRoles?.addEventListener('click', randomAssignRoles);
  els.clearGroupRoles?.addEventListener('click', clearGroupRoles);
  els.roleBoard?.addEventListener('input', updateGroupRole);
  els.body.addEventListener('mouseover', handleVisualizationHover);
  els.body.addEventListener('mouseout', handleVisualizationLeave);
  els.body.addEventListener('click', handleVisualizationClick);
}

function readTextFileInto(fileInput, textArea) {
  const file = fileInput?.files?.[0];
  if (!file || !textArea) return;
  const reader = new FileReader();
  reader.onload = () => {
    textArea.value = String(reader.result || '');
  };
  reader.readAsText(file, 'utf-8');
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

async function testModelConnection() {
  const provider = els.modelProvider.value;
  const providerSettings = collectModelSettingsFromForm();
  if (!provider || !providerSettings.apiKey) {
    els.modelResult.textContent = '请先选择模型并填写个人 API Key，再测试连接。';
    return;
  }
  saveModelSettings();
  els.testModelConnection.disabled = true;
  els.modelStatus.textContent = '测试中';
  els.modelResult.textContent = '正在测试模型连接，会发送一条很短的课堂测试消息...';
  try {
    const response = await apiFetch('./api/llm/check', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        provider,
        apiKey: providerSettings.apiKey,
        model: providerSettings.model,
        baseUrl: providerSettings.baseUrl,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || '连接测试失败');
    els.modelStatus.textContent = '连接可用';
    els.modelResult.textContent = `连接成功：${result.provider} / ${result.model}\n模型返回：${result.content || 'OK'}`;
  } catch (error) {
    els.modelStatus.textContent = '连接失败';
    els.modelResult.textContent = `模型连接失败：${error.message}\n请检查 API Key、模型名、Base URL 和账号余额。`;
  } finally {
    els.testModelConnection.disabled = false;
  }
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
  renderCurrentMethodPanel();
  renderStages();
  renderGroups();
  renderProject();
  renderMethodChain();
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
    <details class="module-group" ${modules.some((module) => module.id === activeModuleId) || groupIndex < 2 ? 'open' : ''}>
      <summary><span>${String(groupIndex + 1).padStart(2, '0')}</span>${escapeHtml(group)}</summary>
      <div class="module-group-list">
        ${modules.map((module) => `
          <button class="module-link${module.id === activeModuleId ? ' active' : ''}" data-module-id="${module.id}">
            <span class="module-icon">${escapeHtml(module.icon)}</span>
            <span>
              <strong>${escapeHtml(module.title)}</strong>
              <small>${escapeHtml(shortenText(module.description, 34))}</small>
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
    const active = visibleIds.has(moduleId) && moduleId === activeModuleId;
    module.hidden = !active;
    module.setAttribute('aria-hidden', active ? 'false' : 'true');
    module.style.display = active ? 'grid' : 'none';
    module.classList.toggle('active', active);
  });
}

function renderCurrentMethodPanel() {
  if (!els.currentMethodPanel) return;
  const module = COURSE_MODULES.find((item) => item.id === activeModuleId) || COURSE_MODULES[0];
  const templates = METHOD_PROCESS_TEMPLATES.filter((item) => item.moduleId === activeModuleId);
  const plan = buildMethodTaskPlan(activeProject());
  const nextTask = plan.find((task) => !task.completed) || plan[plan.length - 1];
  const activeTask = plan.find((task) => task.moduleId === activeModuleId) || nextTask;
  els.currentMethodPanel.innerHTML = `
    <div class="current-method-grid">
      <div class="current-method-main">
        <p class="eyebrow">Current Step</p>
        <h2>${escapeHtml(module.title)}</h2>
        <p>${escapeHtml(activeTask?.title || module.description)}</p>
        <button type="button" class="ghost stage-ai-button" data-stage-ai="${escapeHtml(activeModuleId)}">本阶段 AI 助教</button>
      </div>
      <div class="current-method-check">
        <b>本步先准备</b>
        ${(templates[0]?.inputs || activeTask?.actions || ['填写当前模块材料']).slice(0, 4).map((item) => `<span>${escapeHtml(item)}</span>`).join('')}
      </div>
      <div class="current-method-check">
        <b>本步应产出</b>
        ${(templates[0]?.rows?.map((row) => row[0]) || activeTask?.outputs || ['阶段证据']).slice(0, 4).map((item) => `<span>${escapeHtml(item)}</span>`).join('')}
      </div>
    </div>
  `;
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
  renderMethodChain();
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
  if (els.literatureResult) {
    els.literatureResult.textContent = project.literatureReview?.result
      || '选题确定后，可使用个人大模型 API 生成相关文献方向、检索关键词和研究空白分析。';
  }
}

function renderMethodChain() {
  const project = activeProject();
  const plan = buildMethodTaskPlan(project);
  const summary = summarizeMethodTaskProgress(plan);
  if (els.methodChainSummary) {
    els.methodChainSummary.textContent = `${summary.completed}/${summary.total} · ${summary.percent}%`;
  }
  const markup = plan.map((task, index) => renderMethodTaskCard(task, index)).join('');
  if (els.methodTaskBoard) els.methodTaskBoard.innerHTML = markup;
  if (els.taskPlanPreview) els.taskPlanPreview.innerHTML = markup;
  renderMethodProcessBoard();
}

function renderMethodTaskCard(task, index) {
  const stateClass = task.completed ? ' completed' : task.autoReady ? ' ready' : '';
  const tools = task.tools.map((tool) => `<span>${escapeHtml(tool)}</span>`).join('');
  const outputs = task.outputs.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  return `
    <article class="method-task-card${stateClass}">
      <div class="method-task-head">
        <span class="method-task-index">${index + 1}</span>
        <div>
          <small>${escapeHtml(task.phase)} · ${escapeHtml(task.method)}</small>
          <h3>${escapeHtml(task.title)}</h3>
        </div>
        <button type="button" class="ghost" data-method-task="${task.id}">
          ${task.manualCompleted ? '取消标记' : task.completed ? '已完成' : '标记完成'}
        </button>
      </div>
      <p>${task.actions.map((item) => escapeHtml(item)).join('；')}</p>
      <div class="method-tool-row">${tools}</div>
      <ul>${outputs}</ul>
      ${task.note ? `<p class="method-note">${escapeHtml(task.note)}</p>` : ''}
    </article>
  `;
}

function renderMethodProcessBoard() {
  if (!els.methodProcessBoard) return;
  const focused = METHOD_PROCESS_TEMPLATES.filter((item) => item.moduleId === activeModuleId);
  const templates = focused.length ? focused : METHOD_PROCESS_TEMPLATES;
  els.methodProcessBoard.innerHTML = `
    <div class="method-process-head">
      <div><p class="eyebrow">Method Tables</p><h3>标准化过程表格与报告素材</h3></div>
      <span>${focused.length ? '当前模块' : '全流程'} · ${templates.length} 张表</span>
    </div>
    <div class="method-process-grid">
      ${templates.map(renderMethodProcessCard).join('')}
    </div>
  `;
}

function renderMethodProcessCard(template) {
  return `
    <article class="method-process-card">
      <div class="method-process-title">
        <span>${escapeHtml(template.phase)}</span>
        <h3>${escapeHtml(template.title)}</h3>
        <p>${escapeHtml(template.purpose)}</p>
      </div>
      <div class="method-mini-list">
        <b>进入本方法前需要</b>
        ${template.inputs.map((item) => `<small>${escapeHtml(item)}</small>`).join('')}
      </div>
      <ol>${template.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
      <div class="method-template-table" style="--cols:${template.columns.length}">
        ${template.columns.map((column) => `<b>${escapeHtml(column)}</b>`).join('')}
        ${template.rows.flatMap((row) => row.map((cell) => `<span>${escapeHtml(cell)}</span>`)).join('')}
      </div>
    </article>
  `;
}

function handleMethodTaskClick(event) {
  const button = event.target.closest('[data-method-task]');
  if (!button) return;
  const project = activeProject();
  const taskId = button.dataset.methodTask;
  const current = project.taskStatus?.[taskId] || {};
  project.taskStatus = project.taskStatus || {};
  project.taskStatus[taskId] = {
    completed: !current.completed,
    note: current.completed ? '' : '学生手动确认本阶段材料已完成。',
    updatedAt: new Date().toISOString(),
  };
  saveState();
  render();
}

function generateTaskPlan() {
  const project = activeProject();
  project.taskStatus = project.taskStatus || {};
  project.taskStatus.topic = {
    completed: Boolean(project.title && project.scenario),
    note: '已根据当前选题生成课程方法链任务。',
    updatedAt: new Date().toISOString(),
  };
  saveState();
  render();
  activeModuleId = 'overview';
  render();
}

async function recommendLiterature() {
  const project = activeProject();
  const query = `${project.title}\n${project.scenario}`.trim();
  if (!query || project.title === '未命名服务设计项目') {
    els.literatureResult.textContent = '请先填写具体项目主题和真实服务场景，再进行文献推荐。';
    return;
  }
  els.recommendLiterature.disabled = true;
  els.literatureResult.textContent = '正在检索 OpenAlex / Crossref 公开文献题录，并准备研究空白分析...';
  let literatureItems = [];
  try {
    const response = await apiFetch('./api/literature/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, limit: 6 }),
    });
    const result = await safeJson(response);
    if (response.ok && result.ok) literatureItems = result.items || [];
  } catch {
    literatureItems = [];
  }
  const prompt = buildLiteraturePrompt(project, literatureItems);
  try {
    const aiText = await requestModelText(prompt);
    saveLiteratureResult(project, query, `${formatLiteratureItems(literatureItems)}\n\n研究空白分析：\n${aiText}`, literatureItems);
  } catch (error) {
    saveLiteratureResult(project, query, `${formatLiteratureItems(literatureItems)}\n\n${buildLocalLiteratureReview(project, literatureItems)}\n\n未能调用个人大模型，已生成本地文献分析模板。原因：${error.message}`, literatureItems);
  } finally {
    els.recommendLiterature.disabled = false;
    saveState();
    render();
  }
}

function saveLiteratureResult(project, query, result, items = []) {
  project.literatureReview = {
    query,
    result,
    items,
    updatedAt: new Date().toISOString(),
  };
  project.taskStatus = project.taskStatus || {};
  project.taskStatus.literature = {
    completed: true,
    note: '已形成文献推荐与研究空白分析。',
    updatedAt: new Date().toISOString(),
  };
}

function buildLiteraturePrompt(project, items = []) {
  const references = items.length
    ? items.map((item, index) => `${index + 1}. ${item.title} (${item.year || 'n.d.'}) ${item.authors || ''} ${item.venue || ''} DOI:${item.doi || '无'} 引用:${item.citedBy || 0}`).join('\n')
    : '未检索到可用题录，请基于关键词给出检索策略，且不要编造具体文献。';
  return [
    '你是服务设计课程的研究助教。请围绕学生选题生成文献检索与研究空白分析，必须服务于后续调研、Kano-AHP、TRIZ、TOPSIS和服务蓝图，不要直接替学生给最终方案。',
    '',
    `项目主题：${project.title}`,
    `真实服务场景：${project.scenario}`,
    '',
    '已检索到的公开题录：',
    references,
    '',
    '请输出：',
    '1. 中文与英文检索关键词各8-12个。',
    '2. 推荐检索方向或文献主题，不要编造具体不存在的论文题名、作者、DOI。',
    '3. 已有研究可能关注什么。',
    '4. 本项目可切入的研究空白或设计机会。',
    '5. 后续调研应优先验证的3-5个问题。',
    '6. 如何把文献启发接入 Kano-AHP-TRIZ-TOPSIS 方法链。',
  ].join('\n');
}

function buildLocalLiteratureReview(project, items = []) {
  const keywords = extractKeywords(`${project.title} ${project.scenario}`).slice(0, 8).map((item) => item.word);
  const base = keywords.length ? keywords.join('、') : '服务触点、用户体验、服务质量、需求分类、方案评价';
  return [
    '文献推荐与研究空白分析',
    '',
    `检索关键词建议：${base}、service design、user experience、service blueprint、Kano model、AHP、TRIZ、TOPSIS。`,
    `真实检索题录数量：${items.length}。推荐继续补充 CNKI、Web of Science 或 Google Scholar 的课堂人工复核。`,
    '推荐检索方向：服务设计流程、目标用户体验痛点、服务质量评价、需求分类与权重、创新方案生成、方案多准则评价。',
    '可能研究空白：现有研究常停留在体验问题描述或单一方法应用，本项目可强调“调研证据-需求分类-权重排序-创新方案-方案评价-服务蓝图”的闭环。',
    '后续调研问题：目标用户在关键触点遇到什么障碍？哪些需求是基本型、期望型或魅力型？哪些服务矛盾阻碍体验提升？用户如何评价备选方案？',
    '方法链接入：先用调研材料提取需求，再用 Kano 分类和 AHP 权重筛选关键需求，用 TRIZ 转化为方案，最后用 TOPSIS 排序并沉淀服务蓝图。',
  ].join('\n');
}

function formatLiteratureItems(items = []) {
  if (!items.length) return '公开文献题录：暂未检索到稳定结果。';
  return [
    '公开文献题录：',
    ...items.slice(0, 10).map((item, index) =>
      `${index + 1}. ${item.title}（${item.year || 'n.d.'}，${item.source}，引用 ${item.citedBy || 0}）\n   作者：${item.authors || '未记录'}；来源：${item.venue || '未记录'}；DOI：${item.doi || '未记录'}`,
    ),
  ].join('\n');
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
        return `
      <span
        class="keyword-bubble"
        data-tone="${item.tone}"
        data-keyword="${escapeHtml(item.word)}"
        data-count="${item.count}"
        data-raw-count="${item.rawCount}"
        data-detail="${escapeHtml(detail)}"
        style="--size:${item.size}px;--x:${item.x}%;--y:${item.y}%;--delay:${index * -0.28}s"
        title="${escapeHtml(item.word)}：权重 ${item.count}"
      >
        <b>${escapeHtml(item.word)}</b>
        <small>${item.count}</small>
      </span>`;
      }).join('')}
      <aside class="bubble-detail" id="bubbleDetail" hidden></aside>
    `
    : '<span class="keyword-bubble empty-bubble"><b>暂无关键词</b><small>0</small></span><aside class="bubble-detail" hidden></aside>';

  const ranked = rankedConcepts();
  els.rankChart.innerHTML = ranked.length
    ? ranked.map((item) => renderBar(item.title, Math.round(item.score * 100))).join('')
    : '<p class="muted">添加方案后显示排序。</p>';

  els.competencyRadar.innerHTML = renderRadar(calculateCompetencyProfile(project));
  renderFunnel(project);
  renderStakeholderMap(project);
  renderPersonaBoard(project);
  renderKanoChart(project);
  renderKanoQuestionnaire(project);
  renderAhpMatrixResult(project);
  renderJourneyWorkspace(project);
  renderTrizWorkspace(project);
  renderTopsisMatrixResult(project);
  renderSankeyChart(project);
  renderBlueprintTemplate(project);
  renderStudentInsights(project);
  renderTeacherInsights();
  renderResearchQuadrant(buildQuadrantPoints(project));
  renderGradingTable();
  renderRoleBoard();
  renderChallengeBoard();
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
  const visuals = getStakeholderVisuals();
  const center = visuals[0];
  const around = visuals.slice(1);
  const scenario = `${project.title} ${project.scenario}`;
  els.stakeholderMap.innerHTML = `
    <div class="stakeholder-orbit-stage">
      <div class="orbit-ring outer"></div>
      <div class="orbit-ring inner"></div>
      <article class="stakeholder-core" data-tone="${escapeHtml(center.tone)}">
        <span>${escapeHtml(center.symbol)}</span>
        <b>${escapeHtml(center.label)}</b>
        <em>${escapeHtml(center.role)}</em>
      </article>
      ${around.map((item, index) => `
        <article class="stakeholder-satellite sat-${index + 1}" data-tone="${escapeHtml(item.tone)}">
          <span>${escapeHtml(item.symbol)}</span>
          <b>${escapeHtml(item.label)}</b>
          <em>${escapeHtml(item.role)}</em>
          <div>${(item.items || []).map((name) => `<small>${escapeHtml(name)}</small>`).join('')}</div>
        </article>
      `).join('')}
      <i class="orbit-link l1"></i><i class="orbit-link l2"></i><i class="orbit-link l3"></i><i class="orbit-link l4"></i>
    </div>
    <div class="stakeholder-method-strip">
      <span>产品与家具方向</span><span>产品与交互方向</span><span>产品与移动方向</span><span>产品与休闲方向</span>
    </div>
    <p class="stakeholder-note">当前场景：${escapeHtml(scenario.slice(0, 70))}</p>
  `;
}

function renderKanoChart(project) {
  if (!els.kanoChart) return;
  if (!project.needs.length) {
    els.kanoChart.innerHTML = '<p class="muted">添加需求后显示 Kano 分类。</p>';
    return;
  }
  const points = project.needs.map((need) => {
    const x = Math.max(6, Math.min(94, Number(need.satisfaction) * 18));
    const y = Math.max(6, Math.min(94, 100 - Number(need.importance) * 18));
    return `<span class="kano-point" style="left:${x}%;top:${y}%;" title="${escapeHtml(need.title)}">${escapeHtml(need.title.slice(0, 2))}</span>`;
  }).join('');
  const ahp = buildNeedAhpAnalysis(project.needs);
  const weights = ahp.weights.map((weight, index) => `<small>${escapeHtml(project.needs[index]?.title || `需求${index + 1}`)}：${Math.round(weight * 100)}%</small>`).join('');
  els.kanoChart.innerHTML = `
    ${points}<span class="kano-axis x">满意度</span><span class="kano-axis y">重要度</span>
    <div class="ahp-summary">
      <b>AHP 权重与一致性</b>
      <span>CR=${ahp.cr} · ${ahp.consistent ? '一致性可接受' : '需重新判断矩阵'}</span>
      <div>${weights}</div>
    </div>
  `;
}

function buildNeedAhpAnalysis(needs) {
  const priorities = needs.map((need) => Math.max(1, Number(need.importance || 1) * (6 - Number(need.satisfaction || 3))));
  const matrix = priorities.map((rowValue) => priorities.map((colValue) => rowValue / (colValue || 1)));
  return calculateAhpConsistency(matrix);
}

function renderPersonaBoard(project) {
  if (!els.personaBoard) return;
  const keywords = extractKeywords(`${project.title} ${project.scenario}`).slice(0, 4);
  const needs = project.needs.slice(0, 4);
  const personas = [
    {
      name: '核心体验者',
      avatar: '人',
      tone: 'green',
      tags: keywords.map((item) => item.word),
      goals: ['快速理解流程', '减少等待焦虑', '获得清晰反馈'],
      pain: needs[0]?.title || '信息入口不清晰',
      radar: [4, 3, 5, 2, 4],
    },
    {
      name: '协同陪伴者',
      avatar: '伴',
      tone: 'amber',
      tags: ['陪同', '沟通', '提醒', '决策'],
      goals: ['同步进度', '协助判断', '降低沟通成本'],
      pain: needs[1]?.title || '无法及时掌握服务状态',
      radar: [3, 4, 4, 3, 5],
    },
  ];
  els.personaBoard.innerHTML = personas.map((persona) => `
    <article class="persona-card" data-tone="${persona.tone}">
      <div class="persona-head">
        <span class="persona-avatar">${escapeHtml(persona.avatar)}</span>
        <div><h3>${escapeHtml(persona.name)}</h3><p>基于当前调研证据自动生成，可作为画像草稿继续修改。</p></div>
      </div>
      <div class="persona-tags">${persona.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
      <div class="persona-matrix">
        <section><b>目标</b>${persona.goals.map((goal) => `<small>${escapeHtml(goal)}</small>`).join('')}</section>
        <section><b>痛点</b><small>${escapeHtml(persona.pain)}</small></section>
      </div>
      <div class="mini-radar">${persona.radar.map((value, index) => `<i style="--v:${value * 20}%" title="维度${index + 1}"></i>`).join('')}</div>
    </article>
  `).join('');
}

function renderKanoQuestionnaire(project) {
  if (!els.kanoQuestionnaire) return;
  const needs = project.needs.length ? project.needs : [{ title: '待补充需求', importance: 3, satisfaction: 3 }];
  els.kanoQuestionnaire.innerHTML = needs.map((need, index) => `
    <article class="kano-question-card">
      <b>Q${index + 1}. ${escapeHtml(need.title)}</b>
      <p>正向问题：如果系统能够“${escapeHtml(need.title)}”，你的感受是？</p>
      <p>反向问题：如果系统不能“${escapeHtml(need.title)}”，你的感受是？</p>
      <small>选项：喜欢 / 理应如此 / 无所谓 / 可以忍受 / 不喜欢</small>
    </article>
  `).join('');
}

function downloadKanoSurvey() {
  const rows = [['need_id', 'need', 'question_type', 'question', 'options']];
  activeProject().needs.forEach((need, index) => {
    rows.push([index + 1, need.title, 'functional', `如果能够${need.title}，你的感受是？`, '喜欢|理应如此|无所谓|可以忍受|不喜欢']);
    rows.push([index + 1, need.title, 'dysfunctional', `如果不能${need.title}，你的感受是？`, '喜欢|理应如此|无所谓|可以忍受|不喜欢']);
  });
  downloadText('kano-questionnaire.csv', rowsToCsv(rows), 'text/csv;charset=utf-8');
}

async function analyzeKanoSurvey() {
  if (!els.kanoSurveyResult) return;
  const file = els.kanoSurveyFile?.files?.[0];
  const fallback = activeProject().needs.map((need) => `${need.title}：${classifyKano(need.importance, need.satisfaction)}`);
  if (!file) {
    els.kanoSurveyResult.textContent = `未上传问卷数据，已根据当前需求评分生成分类建议：\n${fallback.join('\n')}`;
    return;
  }
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] || '').map((cell) => cell.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => parseCsvLine(line));
  const findIndex = (...names) => headers.findIndex((header) => names.some((name) => header.includes(name)));
  const needIndex = findIndex('need', '需求');
  const functionalIndex = findIndex('functional', '正向');
  const dysfunctionalIndex = findIndex('dysfunctional', '反向');
  const responses = rows
    .map((cells) => ({
      need: cells[needIndex >= 0 ? needIndex : 1] || cells[0] || '',
      functional: cells[functionalIndex],
      dysfunctional: cells[dysfunctionalIndex],
    }))
    .filter((row) => row.need && row.functional && row.dysfunctional);
  if (!responses.length) {
    els.kanoSurveyResult.textContent = '已读取文件，但未识别到 need/functional/dysfunctional 三列。建议上传包含“需求、正向答案、反向答案”的回收数据 CSV。';
    return;
  }
  const analysis = analyzeKanoResponses(responses);
  els.kanoSurveyResult.innerHTML = `
    <b>已读取 ${responses.length} 份 Kano 正反向答案。</b>
    <div class="method-table">
      <span>需求</span><span>主导类型</span><span>Better</span><span>Worse</span><span>样本</span>
      ${analysis.map((item) => `
        <b>${escapeHtml(item.need)}</b>
        <b>${escapeHtml(item.dominantCategory)}</b>
        <span>${item.better}</span>
        <span>${item.worse}</span>
        <span>${item.total}</span>
      `).join('')}
    </div>
  `;
}

function downloadAhpTemplate() {
  const needs = activeProject().needs.length ? activeProject().needs.slice(0, 4) : [
    { title: '候诊提醒' },
    { title: '导诊清晰' },
    { title: '陪诊协同' },
  ];
  const labels = needs.map((need) => need.title);
  const rows = [['需求', ...labels]];
  labels.forEach((label, rowIndex) => {
    rows.push([label, ...labels.map((_, colIndex) => (rowIndex === colIndex ? 1 : rowIndex < colIndex ? 3 : 0.333))]);
  });
  downloadText('ahp-pairwise-matrix-template.csv', rowsToCsv(rows), 'text/csv;charset=utf-8');
}

function analyzeAhpMatrix() {
  const project = activeProject();
  const source = els.ahpMatrixText?.value?.trim() || buildAhpTemplateText(project);
  const parsed = parseAhpMatrixCsv(source);
  const validRows = parsed.matrix.filter((row) => row.length === parsed.labels.length);
  if (!parsed.labels.length || validRows.length !== parsed.labels.length) {
    els.ahpMatrixResult.textContent = '矩阵格式不完整。请使用“下载 AHP 模板”生成 CSV，再按需求名称填写互反判断矩阵。';
    return;
  }
  const analysis = calculateAhpConsistency(validRows);
  project.ahpAnalysis = {
    labels: parsed.labels,
    matrix: validRows,
    note: els.ahpNote?.value?.trim() || '',
    ...analysis,
    updatedAt: new Date().toISOString(),
  };
  saveState();
  renderAhpMatrixResult(project);
  renderLight();
}

function buildAhpTemplateText(project) {
  const needs = project.needs.length ? project.needs.slice(0, 4) : [
    { title: '候诊提醒', importance: 5, satisfaction: 2 },
    { title: '导诊清晰', importance: 4, satisfaction: 2 },
    { title: '陪诊协同', importance: 3, satisfaction: 3 },
  ];
  const priorities = needs.map((need) => Math.max(1, Number(need.importance || 1) * (6 - Number(need.satisfaction || 3))));
  const rows = [['需求', ...needs.map((need) => need.title)]];
  needs.forEach((need, rowIndex) => {
    rows.push([need.title, ...needs.map((_, colIndex) => Number((priorities[rowIndex] / priorities[colIndex]).toFixed(3)))]);
  });
  return rowsToCsv(rows);
}

function renderAhpMatrixResult(project) {
  if (!els.ahpMatrixResult) return;
  const analysis = project.ahpAnalysis || (() => {
    const parsed = parseAhpMatrixCsv(buildAhpTemplateText(project));
    return { labels: parsed.labels, matrix: parsed.matrix, ...calculateAhpConsistency(parsed.matrix), note: '课堂演示矩阵，建议上传小组真实判断矩阵。' };
  })();
  els.ahpMatrixResult.innerHTML = `
    <b>AHP 权重与一致性检验</b>
    <div class="method-table ahp-output-table">
      <span>指标</span><span>权重</span><span>排序</span>
      ${analysis.labels.map((label, index) => `
        <b>${escapeHtml(label)}</b><span>${Math.round((analysis.weights[index] || 0) * 1000) / 10}%</span><span>${index + 1}</span>
      `).join('')}
    </div>
    <div class="analysis-badges">
      <span>λmax ${analysis.lambdaMax}</span><span>CI ${analysis.ci}</span><span>CR ${analysis.cr}</span><span>${analysis.consistent ? '一致性通过' : '需要修正矩阵'}</span>
    </div>
    ${analysis.note ? `<p class="muted">${escapeHtml(analysis.note)}</p>` : ''}
  `;
}

function downloadJourneyTemplate() {
  const rows = [
    ['stage', 'touchpoint', 'action', 'emotion', 'pain', 'opportunity', 'evidence'],
    ['进入服务', '入口/页面', '寻找服务入口', 2, '入口不清晰', '入口聚合与分层导引', '访谈A-01'],
    ['等待办理', '排队/通知', '等待叫号或反馈', 3, '等待不确定', '状态可视化与提醒', '观察记录B-02'],
  ];
  downloadText('journey-map-template.csv', rowsToCsv(rows), 'text/csv;charset=utf-8');
}

async function importJourneyFile() {
  const file = els.journeyFile?.files?.[0];
  if (!file) return;
  const table = parseCsvTable(await file.text());
  const index = csvHeaderIndex(table.headers);
  activeProject().journey = table.rows.map((row) => ({
    stage: row[index('stage', '阶段')] || '',
    touchpoint: row[index('touchpoint', '触点')] || '',
    action: row[index('action', '行为')] || '',
    emotion: Number(row[index('emotion', '情绪')]) || 3,
    pain: row[index('pain', '痛点')] || '',
    opportunity: row[index('opportunity', '机会')] || '',
    evidence: row[index('evidence', '证据')] || '',
  })).filter((row) => row.stage || row.touchpoint || row.pain);
  saveState();
  render();
}

async function analyzeJourney() {
  const project = activeProject();
  if (!project.journey?.length) project.journey = buildJourneyRows(project);
  saveState();
  renderJourneyWorkspace(project);
  try {
    const json = await requestModelJson(
      `请根据以下项目和旅程图数据，优化用户旅程图。必须保持服务设计课程逻辑：先调研证据，再阶段触点，再痛点机会，不要直接跳到最终方案。\n项目：${project.title}\n场景：${project.scenario}\n旅程数据：${JSON.stringify(project.journey)}`,
      '{"journey":[{"stage":"阶段","touchpoint":"触点","action":"用户行为","emotion":1-5,"pain":"痛点","opportunity":"机会点","evidence":"证据来源"}],"analysis":"不超过300字的分析"}',
    );
    if (Array.isArray(json.journey) && json.journey.length) {
      project.journey = json.journey.map((row) => ({
        stage: String(row.stage || ''),
        touchpoint: String(row.touchpoint || ''),
        action: String(row.action || ''),
        emotion: Number(row.emotion) || 3,
        pain: String(row.pain || ''),
        opportunity: String(row.opportunity || ''),
        evidence: String(row.evidence || ''),
      }));
      saveState();
      renderJourneyWorkspace(project);
    }
    els.journeyTable.insertAdjacentHTML('beforeend', `<div class="model-result"><b>智能分析</b>\n${escapeHtml(json.analysis || '已根据模型返回结果更新旅程图。')}</div>`);
  } catch (error) {
    els.journeyTable.insertAdjacentHTML('beforeend', `<div class="model-result"><b>本地结果已生成</b>\n模型结构化输出未完成：${escapeHtml(error.message)}。请检查 API Key，或继续使用当前旅程图。 </div>`);
  }
}

function renderJourneyWorkspace(project) {
  if (!els.journeyMap || !els.journeyTable) return;
  const rows = buildJourneyRows(project);
  els.journeyTable.innerHTML = `
    <div class="method-table journey-output-table">
      <span>阶段</span><span>触点</span><span>用户行为</span><span>情绪</span><span>痛点</span><span>机会点</span><span>证据</span>
      ${rows.map((row) => `
        <b>${escapeHtml(row.stage)}</b><span>${escapeHtml(row.touchpoint)}</span><span>${escapeHtml(row.action)}</span>
        <span>${escapeHtml(row.emotion)}</span><span>${escapeHtml(row.pain)}</span><span>${escapeHtml(row.opportunity)}</span><span>${escapeHtml(row.evidence)}</span>
      `).join('')}
    </div>
  `;
  els.journeyMap.innerHTML = `
    <div class="journey-line"></div>
    ${rows.map((row, index) => {
      const emotion = Math.max(1, Math.min(5, Number(row.emotion) || 3));
      return `<article class="journey-step" style="--i:${index};--emotion:${emotion}">
        <span>${index + 1}</span>
        <h3>${escapeHtml(row.stage)}</h3>
        <b>${escapeHtml(row.touchpoint)}</b>
        <p>${escapeHtml(row.action)}</p>
        <em>情绪 ${emotion}/5</em>
        <small>痛点：${escapeHtml(row.pain)}</small>
        <small>机会：${escapeHtml(row.opportunity)}</small>
      </article>`;
    }).join('')}
  `;
}

function downloadTrizTemplate() {
  const rows = [['need', 'improve', 'worsen', 'principle', 'concept', 'evidence']];
  buildTrizRows(activeProject()).forEach((row) => rows.push([row.need, row.improve, row.worsen, row.principle, row.concept, row.evidence]));
  downloadText('triz-worksheet-template.csv', rowsToCsv(rows), 'text/csv;charset=utf-8');
}

async function importTrizFile() {
  const file = els.trizFile?.files?.[0];
  if (!file) return;
  const table = parseCsvTable(await file.text());
  const index = csvHeaderIndex(table.headers);
  activeProject().triz = table.rows.map((row) => ({
    need: row[index('need', '需求')] || '',
    improve: row[index('improve', '改善')] || '',
    worsen: row[index('worsen', '恶化')] || '',
    principle: row[index('principle', '原理')] || '',
    concept: row[index('concept', '方案')] || '',
    evidence: row[index('evidence', '证据')] || '',
  })).filter((row) => row.need || row.concept);
  saveState();
  render();
}

async function analyzeTriz() {
  const project = activeProject();
  project.triz = buildTrizRows(project);
  project.triz.forEach((row) => {
    if (!project.concepts.some((concept) => concept.title === row.concept)) {
      project.concepts.push({ title: row.concept, novelty: 4, feasibility: 3, serviceQuality: 4, risk: 2 });
    }
  });
  saveState();
  renderTrizWorkspace(project);
  renderConcepts();
  renderLight();
  try {
    const json = await requestModelJson(
      `请严格按照 TRIZ 服务创新过程，复核以下矛盾表，补充可执行方案卡。不要编造调研数据，必须保留证据链。\n项目：${project.title}\n关键需求：${JSON.stringify(project.needs)}\nTRIZ 初表：${JSON.stringify(project.triz)}`,
      '{"triz":[{"need":"关键需求","improve":"改善目标","worsen":"恶化风险","principle":"TRIZ发明原理","concept":"服务触点方案","evidence":"证据链"}],"analysis":"不超过300字的TRIZ解释"}',
    );
    if (Array.isArray(json.triz) && json.triz.length) {
      project.triz = json.triz.map((row) => ({
        need: String(row.need || ''),
        improve: String(row.improve || ''),
        worsen: String(row.worsen || ''),
        principle: String(row.principle || ''),
        concept: String(row.concept || ''),
        evidence: String(row.evidence || ''),
      }));
      project.triz.forEach((row) => {
        if (row.concept && !project.concepts.some((concept) => concept.title === row.concept)) {
          project.concepts.push({ title: row.concept, novelty: 4, feasibility: 3, serviceQuality: 4, risk: 2 });
        }
      });
      saveState();
      renderTrizWorkspace(project);
      renderConcepts();
      renderLight();
    }
    els.trizResult.innerHTML = `<b>智能 TRIZ 分析</b>\n${escapeHtml(json.analysis || '已根据模型返回结果更新 TRIZ 工作表。')}`;
  } catch (error) {
    els.trizResult.textContent = `已根据关键需求生成 TRIZ 矛盾表和方案卡。模型结构化输出未完成：${error.message}`;
  }
}

function renderTrizWorkspace(project) {
  if (!els.trizWorksheet) return;
  const rows = buildTrizRows(project);
  els.trizWorksheet.innerHTML = `
    <div class="method-table triz-output-table">
      <span>关键需求</span><span>改善目标</span><span>恶化风险</span><span>TRIZ 原理</span><span>方案转译</span><span>证据</span>
      ${rows.map((row) => `
        <b>${escapeHtml(row.need)}</b><span>${escapeHtml(row.improve)}</span><span>${escapeHtml(row.worsen)}</span>
        <span>${escapeHtml(row.principle)}</span><span>${escapeHtml(row.concept)}</span><span>${escapeHtml(row.evidence)}</span>
      `).join('')}
    </div>
  `;
}

function downloadTopsisTemplate() {
  const rows = [['方案', '创新性', '可行性', '服务质量', '风险']];
  const concepts = activeProject().concepts.length ? activeProject().concepts : [
    { title: '候诊信息可视化屏', novelty: 4, feasibility: 4, serviceQuality: 5, risk: 2 },
    { title: '导诊触点重构方案', novelty: 5, feasibility: 3, serviceQuality: 4, risk: 3 },
  ];
  concepts.forEach((item) => rows.push([item.title, item.novelty, item.feasibility, item.serviceQuality, item.risk]));
  downloadText('topsis-decision-matrix-template.csv', rowsToCsv(rows), 'text/csv;charset=utf-8');
}

async function analyzeTopsisMatrix() {
  const file = els.topsisMatrixFile?.files?.[0];
  const project = activeProject();
  const parsed = file ? parseTopsisMatrixCsv(await file.text()) : { items: project.concepts, criteria: topsisCriteria() };
  if (!parsed.items.length || !parsed.criteria.length) {
    els.topsisMatrixResult.textContent = '未识别到方案评价矩阵。请上传包含“方案,创新性,可行性,服务质量,风险”的 CSV。';
    return;
  }
  const analysis = calculateTopsisAnalysis(parsed.items, parsed.criteria);
  project.topsisAnalysis = { ...analysis, criteria: parsed.criteria, updatedAt: new Date().toISOString() };
  saveState();
  renderTopsisMatrixResult(project);
  renderLight();
}

function renderTopsisMatrixResult(project) {
  if (!els.topsisMatrixResult) return;
  const analysis = project.topsisAnalysis || calculateTopsisAnalysis(project.concepts, topsisCriteria());
  if (!analysis.ranked?.length) {
    els.topsisMatrixResult.textContent = '添加方案或上传 TOPSIS 矩阵后显示排序、理想解距离和贴近度。';
    return;
  }
  els.topsisMatrixResult.innerHTML = `
    <b>TOPSIS 过程结果</b>
    <div class="method-table topsis-output-table">
      <span>排名</span><span>方案</span><span>贴近度 C</span><span>D+</span><span>D-</span>
      ${analysis.ranked.map((item, index) => `
        <b>${index + 1}</b><b>${escapeHtml(item.title)}</b><span>${item.score}</span><span>${item.bestDistance}</span><span>${item.worstDistance}</span>
      `).join('')}
    </div>
    <p class="muted">正理想解：${Object.entries(analysis.idealBest || {}).map(([key, value]) => `${key}=${Number(value).toFixed(3)}`).join('；')}；负理想解：${Object.entries(analysis.idealWorst || {}).map(([key, value]) => `${key}=${Number(value).toFixed(3)}`).join('；')}</p>
  `;
}

async function explainMethodResultWithAi(method) {
  const project = activeProject();
  const isAhp = method === 'ahp';
  const target = isAhp ? els.ahpMatrixResult : els.topsisMatrixResult;
  const payload = isAhp
    ? project.ahpAnalysis || (() => {
      const parsed = parseAhpMatrixCsv(buildAhpTemplateText(project));
      return { labels: parsed.labels, matrix: parsed.matrix, ...calculateAhpConsistency(parsed.matrix) };
    })()
    : project.topsisAnalysis || calculateTopsisAnalysis(project.concepts, topsisCriteria());
  if (!target) return;
  target.insertAdjacentHTML('beforeend', '<div class="model-result"><b>AI 解释</b>\n正在结合课程方法解释计算结果...</div>');
  const resultBox = target.querySelector('.model-result:last-child');
  try {
    const aiText = await requestModelText(
      isAhp
        ? `请解释以下 AHP 判断矩阵结果，必须说明权重、λmax、CI、CR、一致性是否通过、如果 CR 不通过如何修正，以及如何进入 Kano/AHP 需求优先级报告。\n${JSON.stringify(payload)}`
        : `请解释以下 TOPSIS 方案排序结果，必须说明评价指标、正负理想解、D+、D-、贴近度 C、优先方案依据，以及如何转入服务蓝图和测试评估。\n${JSON.stringify(payload)}`,
    );
    resultBox.innerHTML = `<b>AI 解释</b>\n${escapeHtml(aiText)}`;
  } catch (error) {
    const local = isAhp
      ? `AHP 本地解释：CR=${payload.cr}，${payload.consistent ? '一致性通过，可作为权重进入需求优先级或 TOPSIS。' : '一致性未通过，建议回到成对比较矩阵重新调整极端判断。'}`
      : `TOPSIS 本地解释：当前优先方案为 ${payload.ranked?.[0]?.title || '待补充'}，贴近度越高越接近正理想解，应结合调研证据和服务蓝图再判断。`;
    resultBox.innerHTML = `<b>AI 解释</b>\n${escapeHtml(`${local}\n模型未连接：${error.message}`)}`;
  }
}

function csvHeaderIndex(headers = []) {
  return (...names) => {
    const hit = headers.findIndex((header) => names.some((name) => String(header).toLowerCase().includes(String(name).toLowerCase())));
    return hit >= 0 ? hit : 0;
  };
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

function buildQuadrantPoints(project, text = '') {
  const source = [
    ...project.needs.map((item) => ({ label: item.title, x: Number(item.satisfaction) || 2, y: Number(item.importance) || 3, note: '来自需求筛选数据' })),
    ...extractKeywords(`${project.title} ${project.scenario} ${text}`).slice(0, 6).map((item, index) => ({
      label: item.word,
      x: Math.max(1, Math.min(5, 2 + (index % 4))),
      y: Math.max(1, Math.min(5, Math.round(Math.min(5, item.count + 2)))),
      note: `关键词权重 ${item.count}`,
    })),
  ];
  const fallback = [
    { label: '高频痛点', x: 2, y: 5, note: '优先澄清原因与影响范围' },
    { label: '关键触点', x: 4, y: 4, note: '适合进入原型与蓝图' },
    { label: '潜在机会', x: 3, y: 3, note: '继续补充调研证据' },
    { label: '低优事项', x: 4, y: 2, note: '暂缓投入资源' },
  ];
  return (source.length ? source : fallback).slice(0, 10);
}

function renderResearchQuadrant(points) {
  if (!els.researchQuadrant) return;
  const list = points?.length ? points : buildQuadrantPoints(activeProject(), els.rawResearchData?.value || '');
  els.researchQuadrant.innerHTML = `
    <span class="axis-label axis-top">重要程度高</span>
    <span class="axis-label axis-right">满意/可行程度高</span>
    <b class="quad-label q1">优先突破</b>
    <b class="quad-label q2">保持优化</b>
    <b class="quad-label q3">继续观察</b>
    <b class="quad-label q4">低优暂缓</b>
    ${list.map((item) => {
      const x = Math.max(6, Math.min(94, Number(item.x) * 18));
      const y = Math.max(6, Math.min(94, 100 - Number(item.y) * 18));
      return `<button class="quad-point" style="left:${x}%;top:${y}%;" title="${escapeHtml(item.note || '')}">${escapeHtml(String(item.label).slice(0, 4))}</button>`;
    }).join('')}
  `;
}

function renderBlueprintTemplate(project) {
  if (!els.blueprintTemplate) return;
  const bestConcept = rankedConcepts()[0]?.title || '待确定方案';
  const painPoint = project.needs[0]?.title || extractKeywords(project.scenario)[0]?.word || '关键服务断点';
  const evidence = STAGES.flatMap((stage) => project.stages[stage.id]?.evidence || []);
  const columns = ['进入服务', '等待/识别', '核心办理', '结果确认', '反馈迭代'];
  const rows = [
    ['用户行为', '提出需求', `遇到${painPoint}`, `体验${bestConcept}`, '确认结果', '提出反馈'],
    ['前台触点', '入口提示', '导引/问询', '服务执行', '结果说明', '满意度收集'],
    ['后台支持', '规则匹配', '资源调度', '数据记录', '异常处理', '改进归档'],
    ['实体证据', '标识/页面', '排队信息', '服务单据', '结果凭证', '反馈表'],
    ['失败点/机会', painPoint, '信息断点', '协同延迟', '解释不足', evidence[0]?.title || '补充测试证据'],
  ];
  els.blueprintTemplate.innerHTML = `
    <div class="blueprint-grid" style="--cols:${columns.length + 1}">
      <b></b>${columns.map((col) => `<b>${escapeHtml(col)}</b>`).join('')}
      ${rows.map(([row, ...cells]) => `<strong>${escapeHtml(row)}</strong>${cells.map((cell) => `<span>${escapeHtml(cell)}</span>`).join('')}`).join('')}
    </div>
  `;
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

function buildGradeRows() {
  state.gradebook = state.gradebook || {};
  return state.groups.map((group) => {
    const progress = calculateStageProgress(group.project).overall;
    const evidence = STAGES.reduce((sum, stage) => sum + (group.project.stages[stage.id]?.evidence?.length || 0), 0);
    const output = group.project.needs.length * 8 + group.project.concepts.length * 10 + group.project.feedback.length * 8;
    const score = Math.min(100, Math.round(progress * 0.45 + Math.min(35, evidence * 5) + Math.min(20, output)));
    const comment = score >= 85
      ? '过程证据较完整，方案链条清晰，可继续强化测试数据解释。'
      : score >= 70
        ? '已形成基础闭环，建议补充调研证据与服务蓝图细节。'
        : '当前材料偏少，需优先补齐调研、需求筛选和方案验证证据。';
    const record = state.gradebook[group.id] || {};
    return {
      group,
      progress,
      evidence,
      score,
      comment,
      manualScore: record.manualScore ?? score,
      manualComment: record.comment || comment,
      gradedAt: record.gradedAt || '',
    };
  });
}

function renderGradingTable() {
  if (!els.gradingTable) return;
  const rows = buildGradeRows();
  els.gradingTable.innerHTML = rows.length
    ? `
      <div class="grade-row grade-head"><b>小组</b><b>进度</b><b>证据</b><b>智能分</b><b>教师手评分</b><b>评语</b></div>
      ${rows.map((row) => `
        <div class="grade-row">
          <span>${escapeHtml(row.group.name)}</span>
          <span>${row.progress}%</span>
          <span>${row.evidence}</span>
          <strong>${row.score}</strong>
          <input type="number" min="0" max="100" value="${row.manualScore}" data-manual-score="${escapeHtml(row.group.id)}" />
          <textarea rows="2" data-manual-comment="${escapeHtml(row.group.id)}">${escapeHtml(row.manualComment)}</textarea>
        </div>
      `).join('')}
    `
    : '<p class="muted">导入名单并生成分组后显示成绩表。</p>';
}

function updateGradebookRecord(event) {
  const scoreField = event.target.closest('[data-manual-score]');
  const commentField = event.target.closest('[data-manual-comment]');
  const groupId = scoreField?.dataset.manualScore || commentField?.dataset.manualComment;
  if (!groupId) return;
  state.gradebook = state.gradebook || {};
  const score = document.querySelector(`[data-manual-score="${CSS.escape(groupId)}"]`)?.value;
  const comment = document.querySelector(`[data-manual-comment="${CSS.escape(groupId)}"]`)?.value || '';
  state.gradebook[groupId] = {
    manualScore: Math.max(0, Math.min(100, Number(score) || 0)),
    comment,
    gradedAt: new Date().toISOString(),
  };
  saveState();
}

function renderRoleBoard() {
  if (!els.roleBoard) return;
  const group = activeGroup();
  group.roles = group.roles || {};
  els.roleBoard.innerHTML = group.members.length
    ? group.members.map((member) => `
      <article class="role-card">
        <b>${escapeHtml(member.name)}</b>
        <small>${escapeHtml(member.id || '')}</small>
        <select data-role-member="${escapeHtml(member.id || member.name)}">
          ${teamRoleOptions().map((role) => `<option value="${escapeHtml(role)}"${group.roles[member.id || member.name] === role ? ' selected' : ''}>${escapeHtml(role)}</option>`).join('')}
        </select>
      </article>
    `).join('')
    : '<p class="muted">当前小组暂无成员。</p>';
}

function randomAssignRoles() {
  const group = activeGroup();
  const roles = teamRoleOptions();
  group.roles = {};
  group.members.forEach((member, index) => {
    group.roles[member.id || member.name] = roles[index % roles.length];
  });
  saveState();
  renderRoleBoard();
}

function clearGroupRoles() {
  activeGroup().roles = {};
  saveState();
  renderRoleBoard();
}

function updateGroupRole(event) {
  const field = event.target.closest('[data-role-member]');
  if (!field) return;
  const group = activeGroup();
  group.roles = group.roles || {};
  group.roles[field.dataset.roleMember] = field.value;
  saveState();
}

function teamRoleOptions() {
  return ['项目统筹', '用户访谈', '问卷与数据', '画像与洞察', '方案与TRIZ', '蓝图与原型', '测试评估', '报告表达'];
}

function renderChallengeBoard() {
  if (!els.challengeBoard) return;
  const project = activeProject();
  const progress = calculateStageProgress(project);
  const gates = [
    { title: '第1关 选题与调研', done: progress.empathy >= 60, hint: '至少形成访谈/观察/问卷证据' },
    { title: '第2关 画像与利益相关者', done: project.stages.define.evidence.length > 0, hint: '完成画像、关系图和关键洞察' },
    { title: '第3关 Kano/AHP 需求筛选', done: project.needs.length >= 3, hint: '生成问卷并形成需求分类' },
    { title: '第4关 TRIZ/TOPSIS 方案筛选', done: project.concepts.length >= 3, hint: '提出并排序至少3个方案' },
    { title: '第5关 蓝图与测试评估', done: progress.prototype >= 50, hint: '补齐服务蓝图、测试证据和迭代说明' },
  ];
  els.challengeBoard.innerHTML = gates.map((gate, index) => `
    <article class="challenge-card ${gate.done ? 'passed' : ''}">
      <span>${gate.done ? '✓' : index + 1}</span>
      <b>${escapeHtml(gate.title)}</b>
      <small>${escapeHtml(gate.hint)}</small>
    </article>
  `).join('');
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

async function runResearchAnalysis() {
  const text = els.rawResearchData?.value?.trim() || '';
  const prompt = els.researchAnalysisPrompt?.value?.trim() || '请识别调研材料中的高频痛点、关键利益相关者、服务断点，并给出四象限坐标建议。';
  const local = buildLocalAnalysis('researchQuadrant', activeProject(), text);
  if (!text) {
    els.researchAnalysisResult.textContent = '请先粘贴或上传调研原始数据。';
    return;
  }
  els.runResearchAnalysis.disabled = true;
  els.researchAnalysisResult.textContent = '正在分析调研数据...';
  try {
    const aiText = await requestModelText(`${prompt}\n\n原始调研材料：\n${text.slice(0, 5000)}`);
    els.researchAnalysisResult.textContent = aiText || local;
  } catch (error) {
    els.researchAnalysisResult.textContent = `${local}\n\n未能调用大模型，已使用本地启发式分析。原因：${error.message}`;
  } finally {
    renderResearchQuadrant(buildQuadrantPoints(activeProject(), text));
    els.runResearchAnalysis.disabled = false;
  }
}

async function runInterviewCoding() {
  const text = els.interviewTranscript?.value?.trim() || '';
  const method = els.interviewMethod?.value || 'thematic';
  const prompt = els.interviewCodingPrompt?.value?.trim() || '';
  if (!text) {
    els.interviewCodingResult.innerHTML = '<p class="muted">请先粘贴访谈文字稿。</p>';
    return;
  }
  const local = method === 'grounded'
    ? buildGroundedTheoryAnalysis(text, prompt)
    : buildThematicAnalysis(text, prompt);
  activeProject().codingAnalysis = { ...local, updatedAt: new Date().toISOString() };
  saveState();
  els.interviewCodingResult.innerHTML = renderCodingResult(local);
  try {
    const aiText = await requestModelText(`${local.method}。请严格按照以下步骤复核并补充分析，不要跳步：${local.steps.join('、')}。\n研究问题：${prompt}\n访谈材料：\n${text.slice(0, 6000)}`);
    els.interviewCodingResult.innerHTML += `<div class="model-result"><b>大模型复核结果</b>\n${escapeHtml(aiText)}</div>`;
  } catch {
    // Keep deterministic local coding when no personal model is configured.
  }
}

function buildThematicAnalysis(text, researchQuestion) {
  const keywords = extractKeywords(text).slice(0, 10);
  const quotes = splitQualitativeUnits(text).slice(0, 8);
  const codes = keywords.map((item) => ({ code: item.word, evidence: quotes.find((quote) => quote.includes(item.word)) || quotes[0] || '', count: item.count }));
  const themes = [
    { theme: '信息理解与认知负荷', codes: codes.slice(0, 3).map((item) => item.code) },
    { theme: '流程触点与等待体验', codes: codes.slice(3, 6).map((item) => item.code) },
    { theme: '协同支持与情绪压力', codes: codes.slice(6, 9).map((item) => item.code) },
  ].filter((item) => item.codes.length);
  return {
    method: '主题分析',
    question: researchQuestion || '围绕用户体验、服务触点和需求机会进行主题分析。',
    steps: ['熟悉材料', '生成初始编码', '搜索主题', '复核主题', '定义并命名主题', '形成分析报告'],
    codes,
    themes,
    memo: '建议学生回到原始语句复核主题边界，避免只依据高频词命名主题。',
  };
}

function buildGroundedTheoryAnalysis(text, researchQuestion) {
  const units = splitQualitativeUnits(text);
  const keywords = extractKeywords(text).slice(0, 12);
  const openCodes = keywords.map((item, index) => ({ code: item.word, evidence: units[index % Math.max(1, units.length)] || '', count: item.count }));
  const axial = [
    { category: '用户情境', relation: '描述服务发生的场景、限制和资源', codes: openCodes.slice(0, 4).map((item) => item.code) },
    { category: '服务断点', relation: '解释问题如何在触点之间累积', codes: openCodes.slice(4, 8).map((item) => item.code) },
    { category: '设计机会', relation: '连接需求优先级、方案构思与验证', codes: openCodes.slice(8, 12).map((item) => item.code) },
  ].filter((item) => item.codes.length);
  return {
    method: '扎根理论',
    question: researchQuestion || '从访谈资料中归纳服务问题、核心范畴和设计机会。',
    steps: ['开放编码', '持续比较', '主轴编码', '选择编码', '理论备忘录', '饱和检查'],
    codes: openCodes,
    themes: axial.map((item) => ({ theme: item.category, codes: item.codes, relation: item.relation })),
    memo: '当前为课堂辅助编码结果，正式研究需多人编码、比较一致性并继续补充样本至理论饱和。',
  };
}

function renderCodingResult(result) {
  return `
    <div class="coding-steps">${result.steps.map((step, index) => `<span>${index + 1}. ${escapeHtml(step)}</span>`).join('')}</div>
    <article class="coding-card"><h3>${escapeHtml(result.method)}研究问题</h3><p>${escapeHtml(result.question)}</p></article>
    <div class="coding-grid">
      <article class="coding-card"><h3>初始编码</h3>${result.codes.map((item) => `<p><b>${escapeHtml(item.code)}</b><small>${escapeHtml(item.evidence || '待回查原文')}</small></p>`).join('')}</article>
      <article class="coding-card"><h3>主题 / 范畴</h3>${result.themes.map((item) => `<p><b>${escapeHtml(item.theme)}</b><small>${escapeHtml((item.codes || []).join('、'))}${item.relation ? `；${escapeHtml(item.relation)}` : ''}</small></p>`).join('')}</article>
    </div>
    <article class="coding-card"><h3>方法备忘录</h3><p>${escapeHtml(result.memo)}</p></article>
  `;
}

function splitQualitativeUnits(text) {
  return String(text || '')
    .split(/[。！？!?;\n\r]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 6)
    .slice(0, 40);
}

async function openSmartAnalysis(vizId) {
  const title = document.querySelector(`#${vizId}`)?.closest('.visual-card, .panel')?.querySelector('h2,h3')?.textContent || '智能分析';
  const local = buildLocalAnalysis(vizId, activeProject(), els.rawResearchData?.value || '');
  els.vizModalTitle.textContent = `${title} · 智能分析`;
  els.vizModalBody.dataset.vizId = vizId;
  els.vizModalBody.innerHTML = `<div class="model-result">${escapeHtml(local)}</div>`;
  els.vizModal.hidden = false;
  try {
    const aiText = await requestModelText(`请作为服务设计课程助教，对当前可视化「${title}」进行课堂分析，指出结论、风险和下一步行动。\n\n项目数据：\n${JSON.stringify(activeProject()).slice(0, 6000)}`);
    els.vizModalBody.innerHTML = `<div class="model-result">${escapeHtml(aiText)}</div>`;
  } catch {
    // The local analysis above remains visible when no personal API key is configured.
  }
}

async function runStageAiAssistant(moduleId = activeModuleId) {
  const module = COURSE_MODULES.find((item) => item.id === moduleId) || COURSE_MODULES[0];
  const templates = METHOD_PROCESS_TEMPLATES.filter((item) => item.moduleId === moduleId);
  const plan = buildMethodTaskPlan(activeProject());
  const activeTask = plan.find((task) => task.moduleId === moduleId) || plan.find((task) => !task.completed) || plan[0];
  const localPrompt = [
    `当前模块：${module.title}`,
    `当前任务：${activeTask?.title || module.description}`,
    `必须遵循流程：${METHOD_TASK_CHAIN.map((task) => task.phase).join(' → ')}`,
    `本模块前置材料：${templates.flatMap((item) => item.inputs).join('、') || '当前项目数据'}`,
    `本模块应产出：${templates.flatMap((item) => item.rows.map((row) => row[0])).join('、') || activeTask?.outputs?.join('、') || '阶段成果'}`,
    '请输出：1. 学生现在应该做什么；2. 需要上传/填写哪些数据；3. 推荐使用哪些方法；4. 结果应该形成哪些表格/图形；5. 容易犯错的地方。',
  ].join('\n');
  els.vizModalTitle.textContent = `${module.title} · 本阶段 AI 助教`;
  els.vizModalBody.dataset.vizId = `stage-${moduleId}`;
  els.vizModalBody.innerHTML = `<div class="model-result">${escapeHtml(`${localPrompt}\n\n未连接模型时，可先按以上清单推进。`)}</div>`;
  els.vizModal.hidden = false;
  try {
    const aiText = await requestModelText(localPrompt);
    els.vizModalBody.innerHTML = `<div class="model-result">${escapeHtml(aiText)}</div>`;
  } catch (error) {
    els.vizModalBody.innerHTML = `<div class="model-result">${escapeHtml(`${localPrompt}\n\n模型未连接：${error.message}\n请到“AI 模型设置”测试个人 API Key。`)}</div>`;
  }
}

async function requestModelText(prompt) {
  const provider = modelSettings.provider;
  const providerSettings = modelSettings.providers?.[provider] || {};
  if (!providerSettings.apiKey) throw new Error('未配置个人 API Key');
  const response = await apiFetch('./api/llm/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      apiKey: providerSettings.apiKey,
      model: providerSettings.model || modelSettings.model || '',
      baseUrl: providerSettings.baseUrl || '',
      prompt,
      context: buildCurrentModelContext(),
    }),
  });
  if (!response.ok) throw new Error(`接口返回 ${response.status}`);
  const data = await response.json();
  if (data.ok === false) throw new Error(data.error || '模型未返回有效结果');
  return data.content || data.text || data.message || '';
}

async function requestModelJson(prompt, shapeHint) {
  const content = await requestModelText(`${prompt}\n\n请只返回严格 JSON，不要使用 Markdown。JSON 结构要求：${shapeHint}`);
  return parseModelJson(content);
}

function parseModelJson(content) {
  const text = String(content || '').trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const raw = fenced || text;
  return JSON.parse(raw);
}

function buildLocalAnalysis(vizId, project, rawText = '') {
  const progress = calculateStageProgress(project);
  const evidenceCount = STAGES.reduce((sum, stage) => sum + (project.stages[stage.id]?.evidence?.length || 0), 0);
  const keywords = extractKeywords(`${project.title} ${project.scenario} ${rawText}`).slice(0, 6);
  const topConcept = rankedConcepts()[0]?.title || '暂未形成明确优先方案';
  const base = [
    `项目：${project.title}`,
    `整体进度：${progress.overall}%，过程证据 ${evidenceCount} 条，需求 ${project.needs.length} 条，方案 ${project.concepts.length} 个。`,
    `主要关键词：${keywords.map((item) => `${item.word}(${item.count})`).join('、') || '暂无'}`,
  ];
  if (vizId === 'rankChart') {
    const topsis = project.topsisAnalysis?.ranked?.length ? project.topsisAnalysis : calculateTopsisAnalysis(project.concepts, topsisCriteria());
    base.push(`TOPSIS 当前优先方案为「${topConcept}」，建议核查评分依据是否来自真实调研证据。`);
    topsis.ranked.slice(0, 5).forEach((item, index) => {
      base.push(`${index + 1}. ${item.title}：贴近度 ${item.score}，正理想距离 ${item.bestDistance}，负理想距离 ${item.worstDistance}`);
    });
  }
  if (vizId === 'kanoChart') base.push('Kano 图应重点关注“重要度高、满意度低”的需求，把它们转入方案构思和测试验证。');
  if (vizId === 'stakeholderMap') base.push('利益相关者需要从角色名称推进到责任、触点、利益冲突和协同关系。');
  if (vizId === 'journeyMap') base.push('用户旅程图应重点检查低情绪阶段，将痛点和机会点转入服务蓝图的失败点与前后台触点。');
  if (vizId === 'blueprintTemplate' || vizId === 'sankeyChart') base.push('服务蓝图应补齐用户行为、前台触点、后台支持、实体证据和失败点。');
  if (vizId === 'researchQuadrant') base.push('四象限坐标可用于区分优先突破、保持优化、继续观察和低优暂缓。');
  base.push('下一步：补充可追溯原始材料，并将分析结论同步到需求筛选、方案排序和测试评估中。');
  return base.join('\n');
}

function runSmartScore() {
  renderGradingTable();
  if (els.gradingTable) {
    const note = document.createElement('p');
    note.className = 'muted';
    note.textContent = '已根据当前过程证据生成智能分和初始评语，教师可在表格中直接手动调整。';
    els.gradingTable.prepend(note);
  }
}

function exportGradebook() {
  const rows = [['group', 'members', 'progress', 'evidence', 'smart_score', 'manual_score', 'comment', 'graded_at']];
  buildGradeRows().forEach((row) => {
    rows.push([
      row.group.name,
      row.group.members.map((member) => member.name).join(' / '),
      row.progress,
      row.evidence,
      row.score,
      row.manualScore,
      row.manualComment,
      row.gradedAt,
    ]);
  });
  downloadText('service-design-gradebook.csv', rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n'), 'text/csv;charset=utf-8');
}

function generateProjectReport() {
  const project = activeProject();
  const report = buildProjectReport(project);
  els.projectReportPreview.textContent = report;
  downloadText('service-design-project-report.doc', htmlDocumentFromText(report), 'application/msword;charset=utf-8');
}

function exportProjectPackage() {
  const project = activeProject();
  downloadText('service-design-project-data.json', JSON.stringify({ exportedAt: new Date().toISOString(), state, activeGroupId, project }, null, 2), 'application/json;charset=utf-8');
  downloadText('service-design-project-data.csv', projectToCsv(project), 'text/csv;charset=utf-8');
  downloadText('service-design-project-report.doc', htmlDocumentFromText(buildProjectReport(project)), 'application/msword;charset=utf-8');
  downloadText('service-design-project-excel.xls', htmlWorkbook(project), 'application/vnd.ms-excel;charset=utf-8');
}

function printProjectPdf() {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(htmlDocumentFromText(buildProjectReport(activeProject())));
  win.document.close();
  win.focus();
  win.print();
}

function buildProjectReport(project) {
  const progress = calculateStageProgress(project);
  const keywords = extractKeywords(`${project.title} ${project.scenario}`).slice(0, 8);
  const ranked = rankedConcepts();
  const methodPlan = buildMethodTaskPlan(project);
  const methodSummary = summarizeMethodTaskProgress(methodPlan);
  const methodLines = methodPlan.map((task, index) => `${index + 1}. ${task.phase}：${task.title}（${task.completed ? '已完成' : '待完善'}）`).join('\n');
  const processAppendix = METHOD_PROCESS_TEMPLATES.map((template, index) => [
    `${index + 1}. ${template.title}`,
    `目的：${template.purpose}`,
    `前置材料：${template.inputs.join('、')}`,
    `过程步骤：${template.steps.join(' → ')}`,
    `建议表格字段：${template.columns.join(' / ')}`,
  ].join('\n')).join('\n\n');
  return [
    `《服务设计》课程项目报告`,
    '',
    `一、项目主题：${project.title}`,
    `二、服务场景：${project.scenario}`,
    `三、方法链完成情况：${methodSummary.completed}/${methodSummary.total}，完成度 ${methodSummary.percent}%。`,
    methodLines,
    '',
    `四、文献推荐与研究空白：${project.literatureReview?.result || '待补充。建议先完成一键文献推荐，再提炼研究空白。'}`,
    `五、调研方法与原始证据：共记录 ${STAGES.reduce((sum, stage) => sum + (project.stages[stage.id]?.evidence?.length || 0), 0)} 条过程证据。`,
    `六、访谈/问卷分析：建议按主题分析或扎根理论呈现编码过程，并说明需求如何从原始材料中产生。`,
    project.codingAnalysis ? `访谈分析过程：${project.codingAnalysis.method}；步骤：${project.codingAnalysis.steps.join(' → ')}；主题/范畴：${project.codingAnalysis.themes.map((item) => item.theme).join('、')}` : '',
    `七、用户画像、利益相关者与用户旅程：围绕目标用户、陪伴者、一线服务、管理者和平台/设备建立关系图；旅程阶段包括 ${buildJourneyRows(project).map((row) => row.stage).join('、')}。`,
    `八、需求筛选：已记录 ${project.needs.length} 条需求，应结合 Kano 分类和 AHP 权重解释优先级。${project.ahpAnalysis ? `当前 AHP CR=${project.ahpAnalysis.cr}，${project.ahpAnalysis.consistent ? '一致性通过' : '需修正矩阵'}。` : ''}`,
    `九、TRIZ 方案生成：已记录 ${project.concepts.length} 个方案，TRIZ 矛盾表 ${buildTrizRows(project).length} 条，应说明服务矛盾、创新原理和需求证据链。`,
    `十、TOPSIS 方案筛选与服务蓝图：当前优先方案为 ${ranked[0]?.title || '待补充'}，建议按用户行为、前台触点、后台支持、实体证据和失败点展开蓝图。${project.topsisAnalysis?.ranked?.length ? `TOPSIS 已输出 ${project.topsisAnalysis.ranked.length} 个方案贴近度。` : ''}`,
    `十一、测试与评估：当前整体闭环进度 ${progress.overall}%，需结合 SERVQUAL/TOPSIS 说明验证结果。`,
    `十二、关键词摘要：${keywords.map((item) => `${item.word}(${item.count})`).join('、') || '待补充'}`,
    `十三、反思与迭代：说明本轮设计的局限、数据不足和下一轮改进计划。`,
    '',
    '附录：方法过程表格清单',
    processAppendix,
  ].join('\n');
}

function htmlDocumentFromText(text) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>服务设计项目报告</title><style>body{font-family:Microsoft YaHei,Arial,sans-serif;line-height:1.8;padding:32px;color:#12252b;white-space:pre-wrap}</style></head><body>${escapeHtml(text)}</body></html>`;
}

function htmlWorkbook(project) {
  return `<!doctype html><html><head><meta charset="utf-8"></head><body><table border="1"><tr><th>类型</th><th>标题</th><th>指标A</th><th>指标B</th><th>内容</th></tr>${projectToCsv(project).split('\n').slice(1).map((line) => {
    const cells = line.split('","').map((cell) => cell.replace(/^"|"$/g, ''));
    return `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`;
  }).join('')}</table></body></html>`;
}

function enhanceVisualCards() {
  [
    ['progressBars', '阶段进度柱状图'],
    ['wordCloud', '调研关键词气泡云'],
    ['competencyRadar', '能力画像雷达图'],
    ['flowFunnel', '证据到方案漏斗图'],
    ['stakeholderMap', '利益相关者地图'],
    ['journeyMap', '用户旅程图'],
    ['kanoChart', 'Kano 需求分类图'],
    ['journeyMap', '用户旅程图'],
    ['rankChart', 'TOPSIS 方案排序图'],
    ['sankeyChart', '数据闭环桑基图'],
    ['researchQuadrant', '调研四象限图'],
    ['blueprintTemplate', '标准服务蓝图'],
  ].forEach(([id, title]) => {
    const chart = document.querySelector(`#${id}`);
    const card = chart?.closest('.visual-card, .panel');
    if (!chart || !card || card.querySelector(`[data-viz-toolbar="${id}"]`)) return;
    const toolbar = document.createElement('div');
    toolbar.className = 'viz-toolbar';
    toolbar.dataset.vizToolbar = id;
    toolbar.innerHTML = `
      <span>${title}</span>
      <button type="button" data-viz-ai="${id}">智能分析</button>
      <button type="button" data-viz-fullscreen="${id}">全屏</button>
      <div class="export-menu">
        <button type="button">导出</button>
        <div class="export-options">
          <button type="button" data-viz-export="png" data-viz-target="${id}">PNG</button>
          <button type="button" data-viz-export="svg" data-viz-target="${id}">SVG</button>
          <button type="button" data-viz-export="json" data-viz-target="${id}">JSON</button>
          <button type="button" data-viz-export="csv" data-viz-target="${id}">CSV</button>
          <button type="button" data-viz-export="psd" data-viz-target="${id}">PSD说明</button>
        </div>
      </div>
    `;
    card.prepend(toolbar);
  });
}

function handleVisualizationHover(event) {
  const bubble = event.target.closest('.keyword-bubble[data-keyword]');
  if (!bubble) return;
  updateBubbleDetail(bubble);
}

function handleVisualizationLeave(event) {
  const bubble = event.target.closest('.keyword-bubble[data-keyword]');
  if (!bubble || bubblePlayTimer) return;
  const next = event.relatedTarget;
  if (next && bubble.contains(next)) return;
  hideBubbleDetail();
}

function handleVisualizationClick(event) {
  const close = event.target.closest('[data-close-viz]');
  if (close) {
    closeVizModal();
    return;
  }

  const bubble = event.target.closest('.keyword-bubble[data-keyword]');
  if (bubble) {
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

  const smartAnalysis = event.target.closest('[data-viz-ai]');
  if (smartAnalysis) {
    openSmartAnalysis(smartAnalysis.dataset.vizAi);
    return;
  }

  const stageAi = event.target.closest('[data-stage-ai]');
  if (stageAi) {
    runStageAiAssistant(stageAi.dataset.stageAi);
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
  detail.hidden = false;
  detail.innerHTML = `
    <strong>${escapeHtml(bubble.dataset.keyword)}</strong>
    <span>权重 ${escapeHtml(bubble.dataset.count)} · 原始次数 ${escapeHtml(bubble.dataset.rawCount || bubble.dataset.count)} · ${bubbleToneLabel(bubble.dataset.tone)}</span>
    <p>${escapeHtml(bubble.dataset.detail)}</p>
  `;
}

function hideBubbleDetail() {
  const detail = document.querySelector('#bubbleDetail');
  if (!detail) return;
  detail.hidden = true;
  detail.innerHTML = '';
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
  buildJourneyRows(project).forEach((item) => rows.push(['journey', item.stage, item.touchpoint, item.emotion, item.pain, `action=${item.action};opportunity=${item.opportunity};evidence=${item.evidence}`]));
  buildTrizRows(project).forEach((item) => rows.push(['triz', '', item.need, item.improve, item.worsen, `principle=${item.principle};concept=${item.concept};evidence=${item.evidence}`]));
  (project.ahpAnalysis?.labels || []).forEach((label, index) => rows.push(['ahp', '', label, project.ahpAnalysis.weights?.[index] || '', project.ahpAnalysis.cr || '', project.ahpAnalysis.consistent ? 'consistent' : 'revise']));
  (project.topsisAnalysis?.ranked || []).forEach((item, index) => rows.push(['topsis', '', item.title, item.score, index + 1, `D+=${item.bestDistance};D-=${item.worstDistance}`]));
  return rowsToCsv(rows);
}

function rowsToCsv(rows) {
  return rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
}

function parseCsvLine(line) {
  const cells = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(value);
      value = '';
    } else {
      value += char;
    }
  }
  cells.push(value);
  return cells;
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
  const project = activeProject();
  return project.topsisAnalysis?.ranked?.length ? project.topsisAnalysis.ranked : rankByTopsis(project.concepts, topsisCriteria());
}

function topsisCriteria() {
  return [
    { key: 'novelty', weight: 0.25, direction: 'benefit' },
    { key: 'feasibility', weight: 0.3, direction: 'benefit' },
    { key: 'serviceQuality', weight: 0.3, direction: 'benefit' },
    { key: 'risk', weight: 0.15, direction: 'cost' },
  ];
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
    gradebook: {},
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

function shortenText(value, maxLength = 40) {
  const text = String(value || '').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
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


