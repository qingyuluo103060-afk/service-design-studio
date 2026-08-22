import assert from 'node:assert/strict';
import {
  buildAssistantAdvice,
  calculateAhpWeights,
  calculateCompetencyProfile,
  calculateStageProgress,
  classifyKano,
  createGroups,
  COURSE_MODULES,
  METHOD_TASK_CHAIN,
  buildMethodTaskPlan,
  summarizeMethodTaskProgress,
  getVisibleModules,
  getStakeholderVisuals,
  mapKeywordsToBubbles,
  getRiskStatus,
  getStageToolkit,
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
assert.deepEqual(
  METHOD_TASK_CHAIN.map((task) => task.id),
  ['topic', 'literature', 'research', 'coding', 'kanoAhp', 'triz', 'topsisBlueprint', 'testingReport'],
  'method chain must keep topic, literature support, research, analysis, method, evaluation, output order',
);

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
      },
    },
  ],
});
assert.equal(validState.ok, true);
assert.equal(validState.value.groups[0].project.title, '导诊服务');
assert.equal(validState.value.groups[0].roles.s1, '用户访谈');
assert.equal(validateClassroomState({ groups: [] }).ok, false);

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
