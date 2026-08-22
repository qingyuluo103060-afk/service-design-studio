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

export const METHOD_TASK_CHAIN = [
  {
    id: 'topic',
    phase: '选题确定',
    moduleId: 'research',
    title: '明确服务设计选题与真实场景',
    method: '选题雷达 / 服务场景界定',
    tools: ['选题输入', '服务场景描述', '任务拆解'],
    actions: ['写清服务对象、场景边界和初始问题', '判断是否可调研、可接触、可改进'],
    outputs: ['项目主题', '真实服务场景', '初始问题陈述'],
  },
  {
    id: 'literature',
    phase: '文献支撑',
    moduleId: 'research',
    title: '检索相关文献并提炼研究空白',
    method: 'AI 文献检索提示词 / 研究空白分析',
    tools: ['一键文献推荐', '研究空白分析', '关键词扩展'],
    actions: ['围绕选题检索服务设计、用户体验、评价方法相关研究', '归纳已有研究关注点和未解决问题'],
    outputs: ['推荐文献方向', '研究空白', '可借鉴方法'],
  },
  {
    id: 'research',
    phase: '用户调研',
    moduleId: 'research',
    title: '完成真实或模拟用户调研',
    method: '访谈 / 观察 / 问卷 / 服务探险',
    tools: ['访谈提纲', '原始数据上传', '调研四象限'],
    actions: ['收集访谈文字稿、观察记录或问卷数据', '保留原始证据与关键摘录'],
    outputs: ['调研原始数据', '访谈/观察证据', '初步问题点'],
  },
  {
    id: 'coding',
    phase: '分析定义',
    moduleId: 'persona',
    title: '从调研材料中提炼用户画像与利益相关者',
    method: '主题分析 / 扎根理论 / 利益相关者地图',
    tools: ['访谈编码', '用户画像卡片', '利益相关者生态图'],
    actions: ['进行开放编码或主题归纳', '识别目标用户、协同者、管理者、平台设备'],
    outputs: ['编码表', '用户画像', '利益相关者关系图'],
  },
  {
    id: 'kanoAhp',
    phase: '需求筛选',
    moduleId: 'needs',
    title: '形成需求列表并完成 Kano-AHP 优先级判断',
    method: 'Kano 分类 / AHP 权重',
    tools: ['Kano 问卷生成', '问卷数据上传', '需求优先级图'],
    actions: ['把调研发现转化为需求条目', '生成并回收 Kano 问卷', '用 AHP 判断需求权重'],
    outputs: ['Kano 分类表', 'AHP 权重', '关键需求清单'],
  },
  {
    id: 'triz',
    phase: '方案生成',
    moduleId: 'concepts',
    title: '基于关键需求和 TRIZ 生成创新方案',
    method: 'TRIZ 矛盾分析 / 发明原理',
    tools: ['方案卡片', '智能方案建议', '成员协作分工'],
    actions: ['识别服务矛盾', '用 TRIZ 原理生成多个备选方案', '说明方案对应的需求证据'],
    outputs: ['TRIZ 矛盾说明', '备选方案', '方案证据链'],
  },
  {
    id: 'topsisBlueprint',
    phase: '方案筛选与蓝图',
    moduleId: 'blueprint',
    title: '用 TOPSIS 筛选方案并转化为服务蓝图',
    method: 'AHP-TOPSIS / 服务蓝图',
    tools: ['TOPSIS 排序图', '服务蓝图模板', '智能分析'],
    actions: ['设置评价指标与权重', '计算方案贴近度并排序', '将优先方案转化为标准服务蓝图'],
    outputs: ['TOPSIS 排序', '优选方案', '服务蓝图'],
  },
  {
    id: 'testingReport',
    phase: '测试评估与成果',
    moduleId: 'testing',
    title: '完成测试评估并生成课程报告',
    method: 'SERVQUAL / 迭代记录 / 项目报告',
    tools: ['测试反馈', '智能评价', '报告导出'],
    actions: ['收集测试反馈', '从服务质量维度解释改进效果', '导出报告与资料包'],
    outputs: ['测试评估', '迭代建议', '课程项目报告'],
  },
];

export const METHOD_PROCESS_TEMPLATES = [
  {
    id: 'researchPrep',
    phase: '调研准备',
    title: '调研材料准备表',
    moduleId: 'research',
    purpose: '在进入 Kano/AHP 前，先获得可追溯的用户需求来源。',
    inputs: ['选题与场景边界', '目标用户与利益相关者', '访谈提纲/观察表/问卷草案'],
    steps: ['明确调研对象', '设计访谈与观察问题', '收集原始材料', '整理痛点与需求语句'],
    columns: ['材料项', '来源', '完成标准', '当前状态'],
    rows: [
      ['访谈文字稿', '深度访谈', '至少覆盖核心用户、协同者、一线服务者', '待上传/待编码'],
      ['观察记录', '服务探险/现场观察', '记录触点、等待、失败点和情绪反应', '待补充'],
      ['需求语句池', '访谈与观察摘录', '每条需求能回溯到原始证据', '待提取'],
    ],
  },
  {
    id: 'thematicGrounded',
    phase: '访谈分析',
    title: '主题分析/扎根理论过程表',
    moduleId: 'persona',
    purpose: '展示从原始访谈到主题、范畴和设计机会的中间过程。',
    inputs: ['访谈文字稿', '研究问题', '原文证据摘录'],
    steps: ['熟悉材料/开放编码', '生成初始编码', '聚合主题或主轴范畴', '复核并命名', '形成洞察与设计机会'],
    columns: ['分析阶段', '操作要求', '输出材料', '可视化/表格'],
    rows: [
      ['开放编码', '逐句标注行为、情绪、障碍和需求', '编码清单', '编码频次表'],
      ['主轴/主题聚合', '合并相似编码并解释关系', '主题/范畴表', '主题关系图'],
      ['选择编码/报告', '提炼核心故事线和设计机会', '洞察结论', '证据-需求链表'],
    ],
  },
  {
    id: 'kano',
    phase: 'Kano 需求分类',
    title: 'Kano 问卷与 Better-Worse 分析表',
    moduleId: 'needs',
    purpose: '把调研得到的需求转化为正反向问卷，并判断需求属性。',
    inputs: ['需求语句池', 'Kano 正向问题', 'Kano 反向问题', '回收问卷数据'],
    steps: ['生成正反向问题', '回收五级答案', '套用 Kano 评价矩阵', '计算 Better-Worse 系数', '输出需求属性'],
    columns: ['字段', '计算/填写方式', '输出解释', '报告用途'],
    rows: [
      ['A/O/M/I/R/Q 计数', '按正反向答案矩阵统计', '魅力/期望/基本/无差异等类别', 'Kano 属性表'],
      ['Better 系数', '(A+O)/(A+O+M+I)', '提供该功能时满意提升程度', '需求机会解释'],
      ['Worse 系数', '-(O+M)/(A+O+M+I)', '缺失该功能时不满意程度', '优先级判断'],
    ],
  },
  {
    id: 'ahp',
    phase: 'AHP 权重',
    title: 'AHP 判断矩阵与一致性检验表',
    moduleId: 'needs',
    purpose: '用专家或小组判断矩阵确定需求/评价指标权重。',
    inputs: ['指标层级', '成对比较矩阵', '专家/小组评分'],
    steps: ['建立层次结构', '填写判断矩阵', '计算权重', '计算 CI/CR', 'CR 小于 0.1 后进入排序'],
    columns: ['表格', '关键字段', '合格标准', '后续去向'],
    rows: [
      ['层次指标表', '目标层、准则层、指标层', '指标完整且不重叠', 'AHP 矩阵'],
      ['判断矩阵', '1-9 标度成对比较', '矩阵互反', '权重计算'],
      ['一致性表', 'λmax、CI、RI、CR', 'CR ≤ 0.10', 'TOPSIS 权重'],
    ],
  },
  {
    id: 'triz',
    phase: 'TRIZ 方案生成',
    title: 'TRIZ 矛盾与发明原理转化表',
    moduleId: 'concepts',
    purpose: '把关键需求中的服务矛盾转化为可执行方案。',
    inputs: ['关键需求', '服务矛盾', '约束条件', '可用资源'],
    steps: ['识别改善参数', '识别恶化参数', '匹配发明原理', '转译为服务触点方案', '形成方案卡片'],
    columns: ['矛盾对象', '改善目标', '恶化风险', 'TRIZ 原理', '方案转化'],
    rows: [
      ['信息更清晰 vs 流程更复杂', '提升理解', '增加操作负担', '分割/预先作用', '分层导引与预提醒'],
      ['等待更可控 vs 人力更紧张', '降低焦虑', '增加服务负荷', '反馈/动态化', '状态可视化与自动提醒'],
    ],
  },
  {
    id: 'topsis',
    phase: 'TOPSIS 方案筛选',
    title: 'AHP-TOPSIS 综合评价表',
    moduleId: 'blueprint',
    purpose: '用加权指标、正负理想解和贴近度筛选方案。',
    inputs: ['备选方案', '评价指标', 'AHP 权重', '专家/用户评分'],
    steps: ['建立决策矩阵', '归一化', '加权', '确定正负理想解', '计算距离与贴近度', '排序'],
    columns: ['表格', '关键字段', '输出', '报告用途'],
    rows: [
      ['评价指标体系', '创新性、可行性、服务质量、风险等', '准则层/指标层', '评价模型说明'],
      ['规范化加权矩阵', '归一化值×AHP 权重', '可比评价矩阵', 'TOPSIS 计算过程'],
      ['贴近度排序表', 'D+、D-、C 值', '方案排名', '优选方案依据'],
    ],
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
    taskStatus: {},
    literatureReview: {
      query: '',
      result: '',
      updatedAt: '',
    },
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

export function calculateAhpConsistency(matrix) {
  const weights = calculateAhpWeights(matrix);
  const n = weights.length;
  if (!n) return { weights: [], lambdaMax: 0, ci: 0, cr: 0, consistent: false };
  const weightedSums = matrix.map((row) =>
    row.reduce((sum, value, index) => sum + (Number(value) || 0) * weights[index], 0),
  );
  const lambdaValues = weightedSums.map((value, index) => value / (weights[index] || 1));
  const lambdaMax = lambdaValues.reduce((sum, value) => sum + value, 0) / n;
  const ci = n > 2 ? (lambdaMax - n) / (n - 1) : 0;
  const ri = { 1: 0, 2: 0, 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45 };
  const cr = ri[n] ? ci / ri[n] : 0;
  return {
    weights: weights.map((value) => Number(value.toFixed(4))),
    lambdaMax: Number(lambdaMax.toFixed(4)),
    ci: Number(Math.max(0, ci).toFixed(4)),
    cr: Number(Math.max(0, cr).toFixed(4)),
    consistent: cr <= 0.1,
  };
}

export function analyzeKanoResponses(responses = []) {
  const buckets = new Map();
  responses.forEach((response) => {
    const need = String(response.need || response.title || '').trim();
    if (!need) return;
    const category = evaluateKanoPair(response.functional, response.dysfunctional);
    if (!buckets.has(need)) {
      buckets.set(need, {
        need,
        counts: {
          魅力型需求: 0,
          期望型需求: 0,
          基本型需求: 0,
          无差异需求: 0,
          反向需求: 0,
          可疑结果: 0,
        },
        total: 0,
      });
    }
    const bucket = buckets.get(need);
    bucket.counts[category] += 1;
    bucket.total += 1;
  });
  return [...buckets.values()].map((bucket) => {
    const entries = Object.entries(bucket.counts).sort((a, b) => b[1] - a[1]);
    const dominantCategory = entries[0]?.[0] || '无差异需求';
    return {
      ...bucket,
      dominantCategory,
      better: Number((((bucket.counts.魅力型需求 + bucket.counts.期望型需求) / (bucket.total || 1))).toFixed(4)),
      worse: Number((-((bucket.counts.基本型需求 + bucket.counts.期望型需求) / (bucket.total || 1))).toFixed(4)),
    };
  });
}

export function rankByTopsis(items, criteria) {
  return calculateTopsisAnalysis(items, criteria).ranked;
}

export function calculateTopsisAnalysis(items, criteria) {
  if (!items.length || !criteria.length) {
    return { ranked: [], normalized: {}, weightedRows: [], idealBest: {}, idealWorst: {} };
  }
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

  const ranked = weightedRows
    .map((row) => {
      const bestDistance = euclideanDistance(row.values, idealBest, criteria);
      const worstDistance = euclideanDistance(row.values, idealWorst, criteria);
      const score = worstDistance / ((bestDistance + worstDistance) || 1);
      return {
        ...row.item,
        score: Number(score.toFixed(4)),
        bestDistance: Number(bestDistance.toFixed(4)),
        worstDistance: Number(worstDistance.toFixed(4)),
      };
    })
    .sort((a, b) => b.score - a.score);
  return { ranked, normalized, weightedRows, idealBest, idealWorst };
}

export function buildMethodTaskPlan(project = {}) {
  const taskStatus = project.taskStatus && typeof project.taskStatus === 'object' ? project.taskStatus : {};
  return METHOD_TASK_CHAIN.map((task) => {
    const status = taskStatus[task.id] || {};
    const autoReady = isMethodTaskAutoReady(task.id, project);
    return {
      ...task,
      completed: Boolean(status.completed || autoReady),
      manualCompleted: Boolean(status.completed),
      autoReady,
      note: String(status.note || ''),
      updatedAt: status.updatedAt || '',
    };
  });
}

export function summarizeMethodTaskProgress(plan = []) {
  const total = Array.isArray(plan) ? plan.length : 0;
  const completed = Array.isArray(plan) ? plan.filter((task) => task.completed).length : 0;
  return {
    total,
    completed,
    percent: total ? Math.round((completed / total) * 100) : 0,
  };
}

function isMethodTaskAutoReady(taskId, project = {}) {
  const title = String(project.title || '').trim();
  const scenario = String(project.scenario || '').trim();
  const empathyEvidence = project.stages?.empathy?.evidence || [];
  const defineEvidence = project.stages?.define?.evidence || [];
  const prototypeEvidence = project.stages?.prototype?.evidence || [];
  const needs = project.needs || [];
  const concepts = project.concepts || [];
  const feedback = project.feedback || [];
  const hasTopic = title && title !== '未命名服务设计项目' && scenario && scenario !== '请描述真实服务场景、目标用户与初步问题。';

  if (taskId === 'topic') return hasTopic;
  if (taskId === 'literature') return Boolean(project.literatureReview?.result);
  if (taskId === 'research') return empathyEvidence.filter((item) => item.title && item.content).length >= 2;
  if (taskId === 'coding') return defineEvidence.filter((item) => item.title && item.content).length >= 1;
  if (taskId === 'kanoAhp') return needs.length >= 2;
  if (taskId === 'triz') return concepts.length >= 2;
  if (taskId === 'topsisBlueprint') return concepts.length >= 2 && prototypeEvidence.length >= 1;
  if (taskId === 'testingReport') return feedback.length >= 1 || prototypeEvidence.length >= 2;
  return false;
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
        roles: group.roles && typeof group.roles === 'object' ? { ...group.roles } : {},
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
      gradebook: input.gradebook && typeof input.gradebook === 'object'
        ? Object.fromEntries(Object.entries(input.gradebook).map(([key, value]) => [
            key,
            {
              manualScore: Math.max(0, Math.min(100, Number(value?.manualScore) || 0)),
              comment: String(value?.comment || ''),
              gradedAt: value?.gradedAt || '',
            },
          ]))
        : {},
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
  const rawCounts = items.map((item) => Number(item.count) || 1);
  const hasRange = new Set(rawCounts).size > 1;
  const demoWeights = [10, 8, 6, 5, 4, 3, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1];
  const displayCounts = hasRange ? rawCounts : items.map((_, index) => demoWeights[index] || 1);
  const maxCount = Math.max(...displayCounts, 1);
  const minSize = 34;
  const maxSize = 116;
  return items.map((item, index) => {
    const rawCount = Number(item.count) || 1;
    const count = displayCounts[index] || rawCount;
    const ratio = count / maxCount;
    return {
      word: String(item.word || ''),
      count,
      rawCount,
      size: Math.round(minSize + (maxSize - minSize) * Math.sqrt(ratio)),
      tone: keywordTone(item.word),
      x: 8 + ((index * 23) % 84),
      y: 12 + ((index * 31) % 76),
    };
  });
}

export function getStakeholderVisuals() {
  return [
    { type: 'core-user', symbol: '人', label: '目标用户', role: '核心体验者', tone: 'user', items: ['主要用户', '潜在用户', '边缘用户'] },
    { type: 'companion', symbol: '伴', label: '家属/同伴', role: '陪伴与协助者', tone: 'companion', items: ['陪伴者', '同伴支持', '意见影响者'] },
    { type: 'frontline', symbol: '服', label: '一线服务人员', role: '触点执行者', tone: 'frontline', items: ['导引员', '客服/接待', '现场执行者'] },
    { type: 'manager', symbol: '管', label: '管理者', role: '规则与资源配置者', tone: 'manager', items: ['课程教师', '服务主管', '资源协调者'] },
    { type: 'platform', symbol: '端', label: '平台/设备', role: '技术与物理载体', tone: 'platform', items: ['小程序/系统', '空间/设备', '数据平台'] },
  ];
}

function keywordTone(word) {
  const text = String(word || '');
  if (/(需求|痛点|满意|等待|问题|断点)/.test(text)) return 'need';
  if (/(方案|蓝图|原型|触点|设计|流程)/.test(text)) return 'concept';
  if (/(测试|评价|反馈|质量|SERVQUAL|TOPSIS)/i.test(text)) return 'test';
  return 'research';
}

function evaluateKanoPair(functional, dysfunctional) {
  const normalize = (value) => {
    const text = String(value || '').trim();
    if (/不喜欢|dislike/i.test(text)) return 'dislike';
    if (/喜欢|like/i.test(text)) return 'like';
    if (/理应如此|必须|must|expect/i.test(text)) return 'must';
    if (/无所谓|中立|neutral/i.test(text)) return 'neutral';
    if (/可以忍受|忍受|live|tolerate/i.test(text)) return 'tolerate';
    return 'neutral';
  };
  const table = {
    like: {
      like: '可疑结果',
      must: '魅力型需求',
      neutral: '魅力型需求',
      tolerate: '魅力型需求',
      dislike: '期望型需求',
    },
    must: {
      like: '反向需求',
      must: '无差异需求',
      neutral: '无差异需求',
      tolerate: '无差异需求',
      dislike: '基本型需求',
    },
    neutral: {
      like: '反向需求',
      must: '无差异需求',
      neutral: '无差异需求',
      tolerate: '无差异需求',
      dislike: '基本型需求',
    },
    tolerate: {
      like: '反向需求',
      must: '无差异需求',
      neutral: '无差异需求',
      tolerate: '无差异需求',
      dislike: '基本型需求',
    },
    dislike: {
      like: '反向需求',
      must: '反向需求',
      neutral: '反向需求',
      tolerate: '反向需求',
      dislike: '可疑结果',
    },
  };
  return table[normalize(functional)]?.[normalize(dysfunctional)] || '无差异需求';
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
  normalized.taskStatus = project.taskStatus && typeof project.taskStatus === 'object'
    ? Object.fromEntries(Object.entries(project.taskStatus).map(([key, value]) => [
        key,
        {
          completed: Boolean(value?.completed),
          note: String(value?.note || ''),
          updatedAt: value?.updatedAt || '',
        },
      ]))
    : {};
  normalized.literatureReview = project.literatureReview && typeof project.literatureReview === 'object'
    ? {
        query: String(project.literatureReview.query || ''),
        result: String(project.literatureReview.result || ''),
        items: Array.isArray(project.literatureReview.items)
          ? project.literatureReview.items.map((item) => ({
              source: String(item.source || ''),
              title: String(item.title || ''),
              year: item.year || '',
              venue: String(item.venue || ''),
              authors: String(item.authors || ''),
              doi: String(item.doi || ''),
              citedBy: Number(item.citedBy) || 0,
              url: String(item.url || ''),
              abstract: String(item.abstract || ''),
            }))
          : [],
        updatedAt: project.literatureReview.updatedAt || '',
      }
    : { query: '', result: '', items: [], updatedAt: '' };
  return normalized;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
