import assert from 'node:assert/strict';
import {
  analyzeKanoResponses,
  buildAssistantAdvice,
  calculateAhpConsistency,
  calculateAhpWeights,
  calculateCompetencyProfile,
  calculateStageProgress,
  classifyKano,
  createGroups,
  createRandomGroups,
  COURSE_MODULES,
  decodeUploadText,
  shouldUseLocalLoginFallback,
  METHOD_TASK_CHAIN,
  METHOD_PROCESS_TEMPLATES,
  buildMethodTaskPlan,
  summarizeMethodTaskProgress,
  getVisibleModules,
  getStakeholderVisuals,
  mapKeywordsToBubbles,
  getRiskStatus,
  getStageToolkit,
  calculateTopsisAnalysis,
  parseAhpMatrixCsv,
  parseTopsisMatrixCsv,
  parseCsvTable,
  normalizeFeedbackEntries,
  summarizeFeedbackEntries,
  parseMarkdownTables,
  normalizeGeneratedText,
  buildStructuredResearchAnalysis,
  buildStructuredThematicAnalysis,
  buildStructuredGroundedTheoryAnalysis,
  buildStructuredProjectReport,
  buildJourneyRows,
  buildTrizRows,
  rankByTopsis,
  validateClassroomState,
} from '../src/app-core.mjs';

const studentModules = getVisibleModules('student').map((item) => item.id);
const teacherModules = getVisibleModules('teacher').map((item) => item.id);
assert.ok(COURSE_MODULES.length >= 8, 'course workspace should expose a full service design module set');
assert.ok(studentModules.includes('research') && studentModules.includes('testing'));
assert.ok(!studentModules.includes('teacher-dashboard'), 'students should not see teacher dashboard module');
assert.ok(teacherModules.includes('teacher-dashboard') && teacherModules.includes('class-management'));
assert.ok(COURSE_MODULES.every((item) => item.icon && item.group), 'each module needs a sidebar icon and group');
assert.equal(shouldUseLocalLoginFallback({ protocol: 'https:', userAccounts: true }), false);
assert.equal(shouldUseLocalLoginFallback({ protocol: 'file:', userAccounts: true }), true);
assert.equal(shouldUseLocalLoginFallback({ protocol: 'https:', userAccounts: false }), true);
assert.deepEqual(
  METHOD_TASK_CHAIN.map((task) => task.id),
  ['topic', 'literature', 'research', 'coding', 'kanoAhp', 'triz', 'topsisBlueprint', 'testingReport'],
  'method chain must keep topic, literature support, research, analysis, method, evaluation, output order',
);
assert.ok(METHOD_PROCESS_TEMPLATES.some((item) => item.id === 'kano' && item.rows.some((row) => row[0].includes('Better'))));
assert.ok(METHOD_PROCESS_TEMPLATES.some((item) => item.id === 'ahp' && item.steps.some((step) => step.includes('CR'))));
assert.ok(METHOD_PROCESS_TEMPLATES.some((item) => item.id === 'topsis' && item.steps.some((step) => step.includes('贴近度'))));

const students = [
  { id: 's1', name: '陈一', className: '产品设计1班' },
  { id: 's2', name: '林二', className: '产品设计1班' },
  { id: 's3', name: '周三', className: '产品设计1班' },
  { id: 's4', name: '吴四', className: '产品设计1班' },
  { id: 's5', name: '郑五', className: '产品设计1班' },
];

const groups = createGroups(students, 2);
assert.equal(groups.length, 3, 'five students at two per group should create three groups');
assert.deepEqual(groups[0].members.map((item) => item.name), ['陈一', '林二']);
assert.equal(groups[2].name, '第3组');

const randomGroups = createRandomGroups(students, 2, () => 0.1);
assert.equal(randomGroups.length, 3, 'random grouping should keep the same group count');
assert.deepEqual(
  randomGroups.flatMap((group) => group.members).map((item) => item.id).sort(),
  students.map((item) => item.id).sort(),
  'random grouping should keep every student exactly once',
);
assert.notDeepEqual(randomGroups[0].members.map((item) => item.name), ['陈一', '林二']);

const gbkRosterBytes = new Uint8Array([115,116,117,100,101,110,116,95,105,100,44,110,97,109,101,44,99,108,97,115,115,95,110,97,109,101,10,50,49,48,49,49,55,48,48,49,44,213,197,200,253,44,183,254,206,241,201,232,188,198,49,176,224]);
const decodedRoster = decodeUploadText(gbkRosterBytes.buffer);
assert.equal(decodedRoster.includes('张三'), true, 'GB18030 CSV uploads should preserve Chinese names');
assert.equal(decodedRoster.includes('服务设计1班'), true, 'GB18030 CSV uploads should preserve Chinese class names');

const project = {
  stages: {
    empathy: {
      evidence: [
        { title: '访谈提纲', content: '围绕导诊等待、信息查找和家属陪同开展访谈。' },
        { title: '观察记录', content: '记录入口、分诊台、候诊区触点。' },
      ],
    },
    define: {
      evidence: [{ title: '用户画像', content: '老年患者、陪诊家属、导诊人员。' }],
    },
    prototype: {
      evidence: [],
    },
  },
};
assert.deepEqual(calculateStageProgress(project), {
  empathy: 100,
  define: 50,
  prototype: 0,
  overall: 50,
});

assert.equal(classifyKano(5, 1), '魅力型需求');
assert.equal(classifyKano(5, 3), '期望型需求');
assert.equal(classifyKano(2, 5), '低优先级需求');
assert.equal(classifyKano(1, 1), '观察型需求');

const weights = calculateAhpWeights([
  [1, 3, 5],
  [1 / 3, 1, 2],
  [1 / 5, 1 / 2, 1],
]);
assert.equal(weights.length, 3);
assert.equal(Math.round(weights.reduce((sum, value) => sum + value, 0) * 1000), 1000);
assert.ok(weights[0] > weights[1] && weights[1] > weights[2], 'AHP should preserve relative priority');
const ahpAnalysis = calculateAhpConsistency([
  [1, 3, 5],
  [1 / 3, 1, 2],
  [1 / 5, 1 / 2, 1],
]);
assert.equal(ahpAnalysis.weights.length, 3);
assert.ok(ahpAnalysis.cr >= 0 && ahpAnalysis.cr < 0.1, 'AHP consistency ratio should flag acceptable matrices');
assert.equal(ahpAnalysis.consistent, true);

const kanoAnalysis = analyzeKanoResponses([
  { need: '候诊提醒', functional: '喜欢', dysfunctional: '不喜欢' },
  { need: '候诊提醒', functional: '理应如此', dysfunctional: '不喜欢' },
  { need: '流程说明', functional: '喜欢', dysfunctional: '无所谓' },
  { need: '流程说明', functional: '喜欢', dysfunctional: '可以忍受' },
]);
assert.equal(kanoAnalysis.length, 2);
assert.equal(kanoAnalysis[0].need, '候诊提醒');
assert.equal(kanoAnalysis[0].dominantCategory, '期望型需求');
assert.equal(kanoAnalysis[1].dominantCategory, '魅力型需求');

const ranked = rankByTopsis(
  [
    { title: '方案A', novelty: 4, feasibility: 3, serviceQuality: 5, risk: 2 },
    { title: '方案B', novelty: 3, feasibility: 5, serviceQuality: 4, risk: 1 },
    { title: '方案C', novelty: 5, feasibility: 2, serviceQuality: 3, risk: 4 },
  ],
  [
    { key: 'novelty', weight: 0.25, direction: 'benefit' },
    { key: 'feasibility', weight: 0.3, direction: 'benefit' },
    { key: 'serviceQuality', weight: 0.3, direction: 'benefit' },
    { key: 'risk', weight: 0.15, direction: 'cost' },
  ],
);
assert.equal(ranked[0].title, '方案B');
assert.ok(ranked[0].score > ranked[1].score, 'TOPSIS scores should sort descending');

const topsisAnalysis = calculateTopsisAnalysis(
  [
    { title: '方案A', novelty: 4, feasibility: 3, serviceQuality: 5, risk: 2 },
    { title: '方案B', novelty: 3, feasibility: 5, serviceQuality: 4, risk: 1 },
  ],
  [
    { key: 'novelty', weight: 0.25, direction: 'benefit' },
    { key: 'feasibility', weight: 0.3, direction: 'benefit' },
    { key: 'serviceQuality', weight: 0.3, direction: 'benefit' },
    { key: 'risk', weight: 0.15, direction: 'cost' },
  ],
);
assert.equal(topsisAnalysis.ranked.length, 2);
assert.ok(topsisAnalysis.ranked[0].score >= 0 && topsisAnalysis.ranked[0].score <= 1);
assert.ok(Object.hasOwn(topsisAnalysis.idealBest, 'risk'));

const parsedCsv = parseCsvTable('name,value\n"候诊,提醒",5');
assert.deepEqual(parsedCsv.headers, ['name', 'value']);
assert.equal(parsedCsv.rows[0][0], '候诊,提醒');

const markdownTables = parseMarkdownTables('| 中文关键词 | English keywords | 用途 |\n| --- | --- | --- |\n| 医院导诊 | hospital navigation | 核心检索 |');
assert.equal(markdownTables.length, 1);
assert.deepEqual(markdownTables[0].headers, ['中文关键词', 'English keywords', '用途']);
assert.equal(markdownTables[0].rows[0][0], '医院导诊');
assert.equal(normalizeGeneratedText('**标题**\n* 要点\n|A|B|').includes('*'), false);

const parsedAhp = parseAhpMatrixCsv('需求,候诊提醒,导诊清晰\n候诊提醒,1,3\n导诊清晰,0.333,1');
assert.deepEqual(parsedAhp.labels, ['候诊提醒', '导诊清晰']);
assert.equal(parsedAhp.matrix[0][1], 3);

const parsedTopsis = parseTopsisMatrixCsv('方案,创新性,风险\n方案A,4,2\n方案B,5,4');
assert.equal(parsedTopsis.items.length, 2);
assert.equal(parsedTopsis.criteria.find((item) => item.key === '风险').direction, 'cost');

const journeyRows = buildJourneyRows({
  title: '导诊服务',
  scenario: '医院导诊',
  stages: project.stages,
  needs: [{ title: '入口清晰', importance: 5, satisfaction: 2 }],
});
assert.equal(journeyRows.length, 5);
assert.ok(journeyRows.every((row) => row.stage && row.touchpoint && row.opportunity));

const trizRows = buildTrizRows({
  needs: [{ title: '入口清晰', importance: 5, satisfaction: 2 }],
});
assert.equal(trizRows.length, 1);
assert.ok(trizRows[0].principle && trizRows[0].concept.includes('入口清晰'));

const advice = buildAssistantAdvice(project, 'prototype');
assert.ok(advice.some((item) => item.includes('原型') || item.includes('测试')));
assert.ok(advice.some((item) => item.includes('数据闭环')));

const profile = calculateCompetencyProfile({
  ...project,
  needs: [
    { title: '流程理解', importance: 5, satisfaction: 2 },
    { title: '候诊提醒', importance: 4, satisfaction: 3 },
  ],
  concepts: [
    { title: '信息屏', novelty: 3, feasibility: 5, serviceQuality: 4, risk: 1 },
  ],
  feedback: [{ title: '用户测试', content: '用户认为信息提醒清晰。' }],
});
assert.deepEqual(Object.keys(profile), ['知识掌握', '用户研究', '问题定义', '方案创造', '测试迭代']);
assert.ok(profile['用户研究'] > profile['测试迭代']);
assert.ok(profile['方案创造'] > 0);

const keywordBubbles = mapKeywordsToBubbles([
  { word: '等待', count: 6 },
  { word: '需求提醒', count: 3 },
  { word: '蓝图方案', count: 1 },
]);
assert.equal(keywordBubbles.length, 3);
assert.ok(keywordBubbles[0].size > keywordBubbles[1].size && keywordBubbles[1].size > keywordBubbles[2].size);
assert.ok(keywordBubbles.every((item) => item.x >= 8 && item.x <= 92 && item.y >= 12 && item.y <= 88));
assert.equal(keywordBubbles[1].tone, 'need');

const demoBubbles = mapKeywordsToBubbles([
  { word: '入口', count: 1 },
  { word: '等待', count: 1 },
  { word: '导诊', count: 1 },
  { word: '家属', count: 1 },
]);
assert.deepEqual(demoBubbles.map((item) => item.rawCount), [1, 1, 1, 1]);
assert.deepEqual(demoBubbles.map((item) => item.count), [10, 8, 6, 5]);
assert.ok(demoBubbles[0].size > demoBubbles[3].size, 'demo-only keywords should still show visual priority');
assert.ok(demoBubbles[3].size < 100, 'low-weight demo bubbles should stay visually modest');

const stakeholderVisuals = getStakeholderVisuals();
assert.equal(stakeholderVisuals.length, 5);
assert.deepEqual(stakeholderVisuals.map((item) => item.type), ['core-user', 'companion', 'frontline', 'manager', 'platform']);
assert.ok(stakeholderVisuals.every((item) => item.symbol && item.label && item.role));
assert.ok(stakeholderVisuals.every((item) => Array.isArray(item.items) && item.items.length >= 3));

const validState = validateClassroomState({
  studentText: '20260101 陈一 产品设计1班',
  groups: [
    {
      id: 'g1',
      name: '第1组',
      members: [{ id: 's1', name: '陈一', className: '产品设计1班' }],
      roles: { s1: '用户访谈' },
      project: {
        title: '导诊服务',
        scenario: '医院导诊',
        stages: {
          empathy: { evidence: [] },
          define: { evidence: [] },
          prototype: { evidence: [] },
        },
        needs: [],
        concepts: [],
        feedback: [],
        journey: [{ stage: '进入服务', touchpoint: '入口', action: '寻找', emotion: 2, pain: '不清楚', opportunity: '优化入口', evidence: '访谈' }],
        triz: [{ need: '入口清晰', improve: '理解', worsen: '复杂', principle: '分割', concept: '分层入口', evidence: 'AHP' }],
      },
    },
  ],
});
assert.equal(validState.ok, true);
assert.equal(validState.value.groups[0].project.title, '导诊服务');
assert.equal(validState.value.groups[0].roles.s1, '用户访谈');
assert.equal(validState.value.groups[0].project.journey[0].stage, '进入服务');
assert.equal(validState.value.groups[0].project.triz[0].principle, '分割');
assert.equal(validateClassroomState({ groups: [] }).ok, false);

const feedbackEntries = normalizeFeedbackEntries([
  { role: 'student', name: '陈一', groupName: '第1组', type: '界面显示', content: '表格显示不全，报告没有层次。' },
  { role: 'student', name: '林二', groupName: '第2组', type: '模型调用', content: '模型连接偶尔失败，希望提示更清楚。' },
]);
assert.equal(feedbackEntries.length, 2);
assert.ok(feedbackEntries[0].id && feedbackEntries[0].createdAt);
const feedbackSummary = summarizeFeedbackEntries(feedbackEntries);
assert.equal(feedbackSummary.total, 2);
assert.equal(feedbackSummary.byType['界面显示'], 1);
assert.ok(feedbackSummary.upgradeNeeds.some((item) => item.includes('表格')));

const structuredResearch = buildStructuredResearchAnalysis('导诊员说患者等待焦虑，家属不知道下一步去哪里。患者说入口提示不清楚。', {
  title: '医院导诊服务优化',
  scenario: '医院门诊导诊',
});
assert.ok(structuredResearch.sections.length >= 5);
assert.ok(structuredResearch.tables.some((table) => table.title.includes('四象限')));

const thematic = buildStructuredThematicAnalysis('患者说入口提示不清楚。家属说等待时不知道下一步。导诊员说解释压力很大。', '分析导诊体验');
assert.equal(thematic.method, '主题分析');
assert.deepEqual(thematic.steps.slice(0, 2), ['熟悉资料', '初始编码']);
assert.ok(thematic.tables.some((table) => table.title === '主题分析编码表'));
assert.ok(thematic.tables[0].headers.includes('主主题'));

const grounded = buildStructuredGroundedTheoryAnalysis('患者不知道去哪里。家属需要同步信息。导诊员需要重复解释。', '分析服务断点');
assert.equal(grounded.method, '扎根理论');
assert.deepEqual(grounded.steps.slice(0, 3), ['开放编码', '持续比较', '主轴编码']);
assert.ok(grounded.tables.some((table) => table.title === '扎根理论编码表'));
assert.ok(grounded.tables[0].headers.includes('核心范畴'));

const structuredReport = buildStructuredProjectReport({
  title: '医院导诊服务优化',
  scenario: '医院门诊',
  stages: project.stages,
  needs: [{ title: '候诊提醒', importance: 5, satisfaction: 2 }],
  concepts: [{ title: '候诊屏', novelty: 3, feasibility: 5, serviceQuality: 4, risk: 1 }],
  feedback: [],
  codingAnalysis: thematic,
  literatureReview: { result: '已有研究关注医疗服务体验。', items: [] },
});
assert.equal(structuredReport.title, '《服务设计》课程项目报告');
assert.ok(structuredReport.sections.some((section) => section.title.includes('访谈分析')));
assert.ok(structuredReport.sections.some((section) => section.tables?.length));

const methodPlan = buildMethodTaskPlan({
  title: '医院导诊服务优化',
  scenario: '围绕老年患者就医导诊的信息断点进行服务设计。',
  stages: {
    empathy: { evidence: [{ title: '访谈', content: '老年患者不知道下一步去哪里。' }] },
    define: { evidence: [] },
    prototype: { evidence: [] },
  },
  needs: [{ title: '候诊提醒', importance: 5, satisfaction: 2 }],
  concepts: [],
  feedback: [],
  taskStatus: { topic: { completed: true } },
  literatureReview: { result: '已有文献关注医疗服务体验，但导诊信息触点仍可深化。' },
});
assert.equal(methodPlan.length, METHOD_TASK_CHAIN.length);
assert.equal(methodPlan[0].completed, true);
assert.equal(methodPlan[1].autoReady, true, 'literature task should be ready after literature result exists');
assert.equal(methodPlan[2].autoReady, false, 'research task should require enough field evidence before auto-ready');
assert.ok(methodPlan[4].outputs.some((item) => item.includes('Kano')));
const taskSummary = summarizeMethodTaskProgress(methodPlan);
assert.ok(taskSummary.completed >= 2);
assert.equal(taskSummary.total, METHOD_TASK_CHAIN.length);

const empathyToolkit = getStageToolkit('empathy');
assert.equal(empathyToolkit.symbol, '探');
assert.ok(empathyToolkit.tools.some((tool) => tool.name === '深度访谈'));
assert.ok(empathyToolkit.outcome.includes('调研'));

const prototypeToolkit = getStageToolkit('prototype');
assert.equal(prototypeToolkit.symbol, '迭');
assert.ok(prototypeToolkit.tools.some((tool) => tool.name === '服务蓝图'));
assert.equal(getRiskStatus(35).label, '高关注');
assert.equal(getRiskStatus(55).label, '需推进');
assert.equal(getRiskStatus(85).label, '稳定');

console.log('app-core tests passed');
