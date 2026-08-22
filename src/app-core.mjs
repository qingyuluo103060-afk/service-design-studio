export const STAGES = [
  {
    id: 'empathy',
    title: '探索与共情',
    shortTitle: '共情',
    focus: '选题、情境观察、访谈、问卷、服务探险',
    methods: ['选题雷达', '深度访谈', '观察记录', '利益相关者初筛', '词云洞察'],
  },
  {
    id: 'define',
    title: '定义与构思',
    shortTitle: '定义',
    focus: '用户画像、旅程图、需求筛选、问题定义、方案构思',
    methods: ['用户画像', '利益相关者地图', 'Kano', 'AHP', 'TRIZ'],
  },
  {
    id: 'prototype',
    title: '原型与迭代',
    shortTitle: '迭代',
    focus: '服务蓝图、触点设计、原型测试、方案评价、成果表达',
    methods: ['服务蓝图', 'SERVQUAL', 'TOPSIS', '快速原型测试', '反思画布'],
  },
];

export const COURSE_MODULES = [
  {
    id: 'overview',
    group: '课程驾驶舱',
    icon: '总',
    title: '项目总览',
    description: '查看当前项目阶段、总体进度、过程证据和课堂风险。',
    roles: ['student', 'teacher'],
  },
  {
    id: 'research',
    group: '探索与共情',
    icon: '探',
    title: '选题与调研',
    description: '完成选题方向、访谈、观察、问卷和服务探险证据记录。',
    stageId: 'empathy',
    roles: ['student', 'teacher'],
  },
  {
    id: 'persona',
    group: '定义与构思',
    icon: '像',
    title: '用户画像与利益相关者',
    description: '把调研证据转化为用户画像、利益相关者关系和关键洞察。',
    stageId: 'define',
    roles: ['student', 'teacher'],
  },
  {
    id: 'needs',
    group: '定义与构思',
    icon: '筛',
    title: '需求筛选',
    description: '使用 Kano、AHP 等方法筛选关键需求并形成优先级。',
    stageId: 'define',
    roles: ['student', 'teacher'],
  },
  {
    id: 'concepts',
    group: '方案生成',
    icon: '案',
    title: '方案生成与筛选',
    description: '结合 TRIZ、TOPSIS 和评分雷达形成可比较的服务方案。',
    stageId: 'prototype',
    roles: ['student', 'teacher'],
  },
  {
    id: 'blueprint',
    group: '成果表达',
    icon: '图',
    title: '服务蓝图与成果',
    description: '沉淀服务蓝图、触点设计、成果表达和过程文档。',
    stageId: 'prototype',
    roles: ['student', 'teacher'],
  },
  {
    id: 'testing',
    group: '测试评估',
    icon: '评',
    title: '测试与评估',
    description: '使用 SERVQUAL、TOPSIS 和反馈记录完成测试迭代。',
    stageId: 'prototype',
    roles: ['student', 'teacher'],
  },
  {
    id: 'ai-settings',
    group: '智能协同',
    icon: 'AI',
    title: 'AI 模型设置',
    description: '学生和教师分别接入个人 API Key，生成阶段化设计建议。',
    roles: ['student', 'teacher'],
  },
  {
    id: 'teacher-dashboard',
    group: '教师端',
    icon: '师',
    title: '课堂统计',
    description: '查看全班小组进度、风险分布、能力画像和数据流向。',
    roles: ['teacher'],
  },
  {
    id: 'class-management',
    group: '教师端',
    icon: '班',
    title: '班级与分组',
    description: '导入学生名单、生成小组、导入导出课堂数据。',
    roles: ['teacher'],
  },
];

export function getVisibleModules(role = 'student') {
  const normalizedRole = role === 'teacher' ? 'teacher' : 'student';
  return COURSE_MODULES.filter((item) => item.roles.includes(normalizedRole));
}

const STAGE_TOOLKITS = {
  empathy: {
    symbol: '探',
    tone: 'aqua',
    outcome: '形成调研证据、关键词洞察和初步问题地图。',
    tools: [
      { name: '选题雷达', cue: '从真实场景、用户痛点、可调研性三个维度判断题目。' },
      { name: '深度访谈', cue: '生成访谈提纲，记录原话、情绪和行为证据。' },
      { name: '服务探险', cue: '进入现场记录触点、等待、断点和信息流。' },
    ],
  },
  define: {
    symbol: '定',
    tone: 'amber',
    outcome: '形成用户画像、利益相关者关系、关键需求和问题定义。',
    tools: [
      { name: '用户画像', cue: '把调研证据转化为目标用户、目标、痛点和行为特征。' },
      { name: 'Kano', cue: '区分基本型、期望型、魅力型和低优先级需求。' },
      { name: 'AHP', cue: '用权重比较筛选关键需求，保留决策依据。' },
    ],
  },
  prototype: {
    symbol: '迭',
    tone: 'green',
    outcome: '形成服务蓝图、触点原型、测试反馈和迭代方案。',
    tools: [
      { name: '服务蓝图', cue: '梳理前台行为、后台支持、证据和失败点。' },
      { name: 'SERVQUAL', cue: '从可靠性、响应性、保证性、移情性和有形性评估体验。' },
      { name: 'TOPSIS', cue: '综合创新、可行、质量和风险排序方案。' },
    ],
  },
};

export function getStageToolkit(stageId) {
  return STAGE_TOOLKITS[stageId] || STAGE_TOOLKITS.empathy;
}

export function getRiskStatus(progress) {
  const value = Number(progress) || 0;
  if (value < 40) return { label: '高关注', tone: 'danger', suggestion: '需要教师立即介入，优先补齐过程证据。' };
  if (value < 70) return { label: '需推进', tone: 'warning', suggestion: '已有基础进展，应推进需求筛选和方案验证。' };
  return { label: '稳定', tone: 'success', suggestion: '进度较稳定，可加强测试迭代和成果表达。' };
}

export function createGroups(students, groupSize = 5) {
  const safeSize = Math.max(1, Number(groupSize) || 5);
  const cleanStudents = students
    .map((student, index) => ({
      id: student.id || `s${index + 1}`,
      name: String(student.name || '').trim(),
      className: String(student.className || '').trim(),
    }))
    .filter((student) => student.name);

  const groups = [];
  for (let index = 0; index < cleanStudents.length; index += safeSize) {
    groups.push({
      id: `g${groups.length + 1}`,
      name: `第${groups.length + 1}组`,
      members: cleanStudents.slice(index, index + safeSize),
      project: createEmptyProject(),
    });
  }
  return groups;
}

export function createEmptyProject() {
  return {
    title: '未命名服务设计项目',
    scenario: '请描述真实服务场景、目标用户与初步问题。',
    stages: {
      empathy: { evidence: [] },
      define: { evidence: [] },
      prototype: { evidence: [] },
    },
    needs: [],
    concepts: [],
    feedback: [],
  };
}

export function calculateStageProgress(project) {
  const result = {};
  let sum = 0;
  STAGES.forEach((stage) => {
    const evidence = project?.stages?.[stage.id]?.evidence || [];
    const completed = evidence.filter((item) => item.title && item.content).length;
    const percent = Math.min(100, completed * 50);
    result[stage.id] = percent;
    sum += percent;
  });
  result.overall = Math.round(sum / STAGES.length);
  return result;
}

export function classifyKano(importance, satisfaction) {
  const imp = Number(importance);
  const sat = Number(satisfaction);
  if (imp >= 4 && sat <= 2) return '魅力型需求';
  if (imp >= 4 && sat <= 4) return '期望型需求';
  if (imp >= 4 && sat > 4) return '基本型需求';
  if (imp <= 2 && sat >= 4) return '低优先级需求';
  if (imp <= 2 && sat <= 2) return '观察型需求';
  return '可优化需求';
}

export function calculateAhpWeights(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) return [];
  const geometricMeans = matrix.map((row) => {
    const product = row.reduce((acc, value) => acc * Math.max(Number(value) || 0.0001, 0.0001), 1);
    return product ** (1 / row.length);
  });
  const total = geometricMeans.reduce((sum, value) => sum + value, 0) || 1;
  return geometricMeans.map((value) => value / total);
}

export function rankByTopsis(items, criteria) {
  if (!items.length || !criteria.length) return [];
  const normalized = {};
  criteria.forEach((criterion) => {
    const denominator = Math.sqrt(
      items.reduce((sum, item) => sum + (Number(item[criterion.key]) || 0) ** 2, 0),
    ) || 1;
    normalized[criterion.key] = items.map((item) => (Number(item[criterion.key]) || 0) / denominator);
  });

  const weightedRows = items.map((item, rowIndex) => {
    const values = {};
    criteria.forEach((criterion) => {
      values[criterion.key] = normalized[criterion.key][rowIndex] * criterion.weight;
    });
    return { item, values };
  });

  const idealBest = {};
  const idealWorst = {};
  criteria.forEach((criterion) => {
    const values = weightedRows.map((row) => row.values[criterion.key]);
    idealBest[criterion.key] =
      criterion.direction === 'cost' ? Math.min(...values) : Math.max(...values);
    idealWorst[criterion.key] =
      criterion.direction === 'cost' ? Math.max(...values) : Math.min(...values);
  });

  return weightedRows
    .map((row) => {
      const bestDistance = euclideanDistance(row.values, idealBest, criteria);
      const worstDistance = euclideanDistance(row.values, idealWorst, criteria);
      const score = worstDistance / ((bestDistance + worstDistance) || 1);
      return { ...row.item, score: Number(score.toFixed(4)) };
    })
    .sort((a, b) => b.score - a.score);
}

export function buildAssistantAdvice(project, stageId) {
  const progress = calculateStageProgress(project);
  const stage = STAGES.find((item) => item.id === stageId) || STAGES[0];
  const evidence = project?.stages?.[stage.id]?.evidence || [];
  const advice = [
    `当前处于“${stage.title}”阶段，建议围绕“${stage.focus}”补齐证据。`,
  ];

  if (stage.id === 'empathy') {
    advice.push('优先完成至少3类调研证据：访谈、观察、问卷或服务探险，避免只凭主观经验定义问题。');
    advice.push('将访谈原话转化为关键词，可用于词云和痛点聚类。');
  }
  if (stage.id === 'define') {
    advice.push('先用用户画像和利益相关者地图界定对象，再用Kano或AHP筛选关键需求。');
    advice.push('每个核心需求都要能回溯到调研证据，形成“证据-需求-方案”的链条。');
  }
  if (stage.id === 'prototype') {
    advice.push('先建立服务蓝图，再选择关键触点制作原型，最后用SERVQUAL或TOPSIS进行测试评价。');
    advice.push('保留原型、测试反馈和修改记录，形成数据闭环。');
  }

  if (evidence.length < 2) {
    advice.push('本阶段证据数量偏少，建议至少提交2项高质量证据后再进入下一阶段。');
  }
  if (progress.overall < 60) {
    advice.push('整体进度尚未过半，教师端可将该组标记为需要课堂巡回指导。');
  } else {
    advice.push('整体进度已形成基础闭环，可继续加强方案验证和成果表达。');
  }
  return advice;
}

export function calculateCompetencyProfile(project) {
  const stages = project?.stages || {};
  const empathyEvidence = stages.empathy?.evidence?.length || 0;
  const defineEvidence = stages.define?.evidence?.length || 0;
  const prototypeEvidence = stages.prototype?.evidence?.length || 0;
  const needs = project?.needs?.length || 0;
  const concepts = project?.concepts?.length || 0;
  const feedback = project?.feedback?.length || 0;

  return {
    知识掌握: clampScore((empathyEvidence + defineEvidence + prototypeEvidence) * 18),
    用户研究: clampScore(empathyEvidence * 34),
    问题定义: clampScore(defineEvidence * 30 + needs * 12),
    方案创造: clampScore(concepts * 28 + needs * 8),
    测试迭代: clampScore(prototypeEvidence * 30 + feedback * 20),
  };
}

export function validateClassroomState(input) {
  if (!input || !Array.isArray(input.groups) || input.groups.length === 0) {
    return { ok: false, error: '导入文件缺少小组数据。' };
  }

  const groups = input.groups
    .map((group, groupIndex) => {
      const project = normalizeProject(group.project);
      return {
        id: String(group.id || `g${groupIndex + 1}`),
        name: String(group.name || `第${groupIndex + 1}组`),
        members: Array.isArray(group.members)
          ? group.members.map((member, memberIndex) => ({
              id: String(member.id || `s${memberIndex + 1}`),
              name: String(member.name || '').trim(),
              className: String(member.className || '').trim(),
            })).filter((member) => member.name)
          : [],
        project,
      };
    })
    .filter((group) => group.members.length > 0);

  if (groups.length === 0) {
    return { ok: false, error: '导入文件中的小组没有有效成员。' };
  }

  return {
    ok: true,
    value: {
      studentText: String(input.studentText || ''),
      groups,
    },
  };
}

export function parseStudentText(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line, index) => {
      const parts = line.split(/[,，\t ]+/).filter(Boolean);
      return {
        id: parts[0]?.match(/^\d/) ? parts[0] : `s${index + 1}`,
        name: parts[0]?.match(/^\d/) ? parts[1] || '' : parts[0] || '',
        className: parts[0]?.match(/^\d/) ? parts[2] || '' : parts[1] || '',
      };
    })
    .filter((student) => student.name);
}

export function extractKeywords(text) {
  const stopWords = new Set(['我们', '他们', '这个', '那个', '以及', '进行', '服务', '用户', '需要']);
  const matches = String(text || '').match(/[\u4e00-\u9fa5]{2,}|[A-Za-z]{3,}/g) || [];
  const counts = new Map();
  matches.forEach((word) => {
    if (stopWords.has(word)) return;
    counts.set(word, (counts.get(word) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 18);
}

export function mapKeywordsToBubbles(keywords) {
  const items = Array.isArray(keywords) ? keywords.slice(0, 16) : [];
  const maxCount = Math.max(...items.map((item) => Number(item.count) || 0), 1);
  const minSize = 48;
  const maxSize = 118;
  return items.map((item, index) => {
    const count = Number(item.count) || 1;
    const ratio = count / maxCount;
    return {
      word: String(item.word || ''),
      count,
      size: Math.round(minSize + (maxSize - minSize) * Math.sqrt(ratio)),
      tone: keywordTone(item.word),
      x: 8 + ((index * 23) % 84),
      y: 12 + ((index * 31) % 76),
    };
  });
}

export function getStakeholderVisuals() {
  return [
    { type: 'core-user', symbol: '人', label: '目标用户', role: '核心体验者', tone: 'user' },
    { type: 'companion', symbol: '伴', label: '家属/同伴', role: '陪伴与协助者', tone: 'companion' },
    { type: 'frontline', symbol: '服', label: '一线服务人员', role: '触点执行者', tone: 'frontline' },
    { type: 'manager', symbol: '管', label: '管理者', role: '规则与资源配置者', tone: 'manager' },
    { type: 'platform', symbol: '端', label: '平台/设备', role: '技术与物理载体', tone: 'platform' },
  ];
}

function keywordTone(word) {
  const text = String(word || '');
  if (/(需求|痛点|满意|等待|问题|断点)/.test(text)) return 'need';
  if (/(方案|蓝图|原型|触点|设计|流程)/.test(text)) return 'concept';
  if (/(测试|评价|反馈|质量|SERVQUAL|TOPSIS)/i.test(text)) return 'test';
  return 'research';
}

function euclideanDistance(values, ideal, criteria) {
  return Math.sqrt(
    criteria.reduce((sum, criterion) => sum + (values[criterion.key] - ideal[criterion.key]) ** 2, 0),
  );
}

function normalizeProject(project = {}) {
  const normalized = createEmptyProject();
  normalized.title = String(project.title || normalized.title);
  normalized.scenario = String(project.scenario || normalized.scenario);
  STAGES.forEach((stage) => {
    normalized.stages[stage.id].evidence = Array.isArray(project.stages?.[stage.id]?.evidence)
      ? project.stages[stage.id].evidence.map((item) => ({
          title: String(item.title || ''),
          content: String(item.content || ''),
          updatedAt: item.updatedAt || new Date().toISOString(),
        }))
      : [];
  });
  normalized.needs = Array.isArray(project.needs)
    ? project.needs.map((item) => ({
        title: String(item.title || ''),
        importance: Number(item.importance) || 1,
        satisfaction: Number(item.satisfaction) || 1,
      }))
    : [];
  normalized.concepts = Array.isArray(project.concepts)
    ? project.concepts.map((item) => ({
        title: String(item.title || ''),
        novelty: Number(item.novelty) || 1,
        feasibility: Number(item.feasibility) || 1,
        serviceQuality: Number(item.serviceQuality) || 1,
        risk: Number(item.risk) || 1,
      }))
    : [];
  normalized.feedback = Array.isArray(project.feedback) ? project.feedback : [];
  return normalized;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
