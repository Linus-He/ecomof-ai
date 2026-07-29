import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const filePath = path.join(process.cwd(), "public/data/methodology_modules_demo.json")
const modules = JSON.parse(fs.readFileSync(filePath, "utf8"))

const organicAcid = {
  id: "organic-acid",
  order: 6,
  module: "Organic Acid Screening",
  moduleZh: "有机酸筛选",
  parentModule: "Catalysis",
  parentModuleZh: "催化",
  summary: "The current V3.9.10 method is a deterministic, abundance-neutral host–guest pathway screen with eight locked factors, explicit provenance, audit artifacts, and validation boundaries.",
  summaryZh: "当前 V3.9.10 方法是丰度中性的主客体路径白盒筛选：八因子与权重预先锁定，来源、审计产物和验证边界全部显式展示。",
  specialNote: "Only the current preregistered V3.9.10 terms are shown. Earlier composite-tier terminology and superseded proxy formulas are excluded.",
  specialNoteZh: "本页只展示当前预登记的 V3.9.10 术语；早期综合分层称谓和已被替换的代理公式不再显示。",
  methodWorkflow: [
    {
      label: "Load governed source layers",
      labelZh: "读取受治理的数据层",
      description: "Load CoRE structural/stability fields, FAIR-MOFs synthesis conditions, literature and gold evidence, and transparent economics inputs.",
      descriptionZh: "读取 CoRE 结构与稳定性字段、FAIR‑MOFs 合成条件、文献与金标准证据，以及透明经济性输入。",
    },
    {
      label: "Resolve identity and conditions",
      labelZh: "核验身份与条件",
      description: "Link structures only by exact or base CSD Refcodes and keep same-DOI records separate unless a structure identifier also matches.",
      descriptionZh: "结构连接只接受精确或基础 CSD Refcode；仅 DOI 相同而结构标识不一致的记录保持独立。",
    },
    {
      label: "Apply abundance-neutral derivation",
      labelZh: "执行丰度中性派生",
      description: "Use counts for empirical-Bayes shrinkage and confidence only; never reward a family simply because it has more rows.",
      descriptionZh: "记录数量只用于经验贝叶斯收缩和置信度，不因某家族条目更多而提高材料得分。",
    },
    {
      label: "Compute eight-factor HGCPS",
      labelZh: "计算八因子 HGCPS",
      description: "Aggregate fixed 0–1 factors with preregistered weights and a weighted geometric mean.",
      descriptionZh: "以预先登记的固定权重，将八个 0–1 因子按加权几何平均聚合。",
    },
    {
      label: "Audit and expose gaps",
      labelZh: "审计并暴露缺口",
      description: "Run invariance, mutation, ablation, sensitivity, and small-sample audits and retain fallback/missing reasons.",
      descriptionZh: "执行不变性、规则变更、消融、敏感性和小样本审计，并保留 fallback／缺失原因。",
    },
  ],
  inputs: [
    "CoRE stability and structural descriptors",
    "FAIR-MOFs synthesis-condition evidence",
    "host and guest factor tables",
    "literature and gold evidence",
    "risk and economics records",
    "field-level provenance",
  ],
  inputsZh: [
    "CoRE 稳定性与结构描述符",
    "FAIR‑MOFs 合成条件证据",
    "主体与客体因子表",
    "文献与金标准证据",
    "风险与经济性记录",
    "字段级来源",
  ],
  outputs: [
    "eight route factors",
    "final HGCPS",
    "factor-level derivation and citations",
    "fallback and missing reasons",
    "sensitivity and abundance-bias audits",
    "validation queue",
  ],
  outputsZh: [
    "八个路径因子",
    "最终 HGCPS",
    "逐因子派生层级与引用",
    "fallback 与缺失原因",
    "敏感性与丰度偏差审计",
    "验证队列",
  ],
  visualizations: [
    {
      title: "Eight-factor method profile",
      titleZh: "八因子方法档案",
      description: "Artifact-derived factors, locked weights, source roles, and fallback states.",
      descriptionZh: "从生成产物读取因子、锁定权重、来源职责和 fallback 状态。",
      chartType: "score",
    },
    {
      title: "Interactive sensitivity explanation",
      titleZh: "交互敏感性解释",
      description: "A non-persistent explanatory control shows how a factor direction changes the geometric aggregate.",
      descriptionZh: "不写回正式结果的演示控件，用于理解单因子方向如何影响几何聚合。",
      chartType: "line",
    },
  ],
  evidenceBoundary: [
    "HGCPS prioritizes validation; it is not measured catalytic yield, selectivity, conversion, or lifetime.",
    "FAIR-MOFs condition accessibility is not a synthesis-success probability.",
    "Family-level correlation audits are indicative because sample size and statistical power remain low.",
    "Fallback factors stay visible and cannot be presented as source-measured properties.",
  ],
  evidenceBoundaryZh: [
    "HGCPS 用于安排验证优先级，不是实测产率、选择性、转化率或寿命。",
    "FAIR‑MOFs 条件可达性不是合成成功概率。",
    "家族级相关性审计样本量与统计功效较低，只能作为提示。",
    "fallback 因子必须保持可见，不能表述为来源实测性质。",
  ],
  validationRoadmap: [
    "Add route-specific synthesis failures and yields",
    "collect condition-matched catalytic controls",
    "verify guest-metal factors experimentally or by dedicated DFT",
    "rerun locked scoring and publish audit deltas",
  ],
  validationRoadmapZh: [
    "补充路线特异的合成失败记录与产率",
    "收集条件匹配的催化对照",
    "用专门实验或 DFT 核验客体金属因子",
    "按锁定规则重跑并公开审计差异",
  ],
  implementationLogic: [
    {
      function: "Identity resolution",
      trigger: "MOF name, CSD Refcode, DOI",
      process: "Exact/base Refcode match; DOI remains article-level only",
      output: "structure link or explicit unmapped state",
      guard: "No fuzzy-name or DOI-only structure merge",
    },
    {
      function: "Abundance correction",
      trigger: "family source rows",
      process: "empirical-Bayes shrinkage toward descriptor-specific global prior",
      output: "shrunk factor plus confidence",
      guard: "duplicating identical rows cannot improve the point score",
    },
    {
      function: "HGCPS calculation",
      trigger: "eight normalized factors",
      process: "locked weighted geometric mean with 0.001 numerical floor",
      output: "final HGCPS and factor trace",
      guard: "weights sum to one; scoring spec mutation fails audit",
    },
    {
      function: "Result explanation",
      trigger: "selected route",
      process: "read generated artifact provenance and audit state",
      output: "factor values, sources, n, citations, fallback reasons",
      guard: "never label the result as measured catalytic performance",
    },
  ],
  methodGroups: [
    {
      id: "organic-data-governance-current",
      title: "Identity, source, and condition governance",
      titleZh: "身份、来源与条件治理",
      purpose: "Prevent cross-material contamination before any factor is derived.",
      purposeZh: "在派生任何因子前阻止跨材料污染。",
      algorithmSteps: [
        { label: "Read source registry", labelZh: "读取来源登记", description: "Load source version, licence, record ids, checksums, and retrieval date.", descriptionZh: "读取来源版本、许可、记录 ID、校验和与检索日期。" },
        { label: "Resolve structure identity", labelZh: "解析结构身份", description: "Use exact/base CSD Refcode; keep DOI associations at article level.", descriptionZh: "使用精确／基础 CSD Refcode；DOI 关联只停留在文章层。" },
        { label: "Preserve conditions", labelZh: "保留实验条件", description: "Retain temperature, time, solvent, adsorbate, and measurement context.", descriptionZh: "保留温度、时间、溶剂、吸附质和测量语境。" },
        { label: "Mark gaps", labelZh: "标记缺失", description: "Record null, fallback, unmapped, or insufficient-n rather than filling a proxy silently.", descriptionZh: "以 null、fallback、未映射或样本不足明确记录，不静默补代理值。" },
      ],
      formulas: [],
      inputs: ["source registry", "CSD identifiers", "DOI", "condition records"],
      inputsZh: ["来源登记", "CSD 标识符", "DOI", "条件记录"],
      outputs: ["governed joins", "condition-aware fields", "missing reasons"],
      outputsZh: ["受治理连接", "条件感知字段", "缺失原因"],
      limitations: ["A source association does not prove that records describe the same structure or experimental condition."],
      limitationsZh: ["来源关联不等于记录描述同一结构或同一实验条件。"],
    },
    {
      id: "organic-abundance-neutral-current",
      title: "Abundance-neutral factor derivation",
      titleZh: "丰度中性因子派生",
      purpose: "Separate evidence maturity from the material point score.",
      purposeZh: "将证据成熟度与材料点估计得分严格分离。",
      algorithmSteps: [
        { label: "Aggregate source properties", labelZh: "聚合来源性质", description: "Use family medians for relevant source fields.", descriptionZh: "对相关来源字段使用家族中位数。" },
        { label: "Shrink to prior", labelZh: "向先验收缩", description: "Apply descriptor-specific empirical-Bayes shrinkage.", descriptionZh: "按描述符执行经验贝叶斯收缩。" },
        { label: "Report confidence", labelZh: "报告置信度", description: "Counts affect confidence and uncertainty only.", descriptionZh: "记录数量只影响置信度和不确定性。" },
        { label: "Test invariance", labelZh: "检验不变性", description: "Duplicate identical rows and require no score improvement.", descriptionZh: "复制相同行并要求得分不得提高。" },
      ],
      formulas: [
        {
          id: "organic-shrinkage-current",
          label: "Empirical-Bayes shrinkage",
          labelZh: "经验贝叶斯收缩",
          latex: "\\tilde{x}=\\lambda\\,\\operatorname{median}(x)+(1-\\lambda)\\mu_0,\\quad \\lambda=\\frac{n_{\\mathrm{eff}}}{n_{\\mathrm{eff}}+k}",
          fallback: "x_tilde = λ median(x) + (1-λ) μ0; λ = n_eff/(n_eff+k)",
          explanation: "Counts control shrinkage strength, never a direct score bonus.",
          explanationZh: "记录数量只控制收缩强度，不直接奖励得分。",
        },
      ],
      inputs: ["family property medians", "global priors", "effective unique conditions"],
      inputsZh: ["家族性质中位数", "全局先验", "有效唯一条件"],
      outputs: ["shrunk property factor", "confidence", "uncertainty"],
      outputsZh: ["收缩后性质因子", "置信度", "不确定性"],
      limitations: ["Sparse families remain close to the prior and must not be read as precisely characterized."],
      limitationsZh: ["稀疏家族会保持接近先验，不能解读为已被精确表征。"],
    },
    {
      id: "organic-hgcps-current",
      title: "Locked eight-factor HGCPS",
      titleZh: "锁定的八因子 HGCPS",
      purpose: "Combine complementary host, guest, evidence, risk, synthesis, and economics factors without hiding bottlenecks.",
      purposeZh: "组合主体、客体、证据、风险、合成与经济性因子，同时保留瓶颈。",
      algorithmSteps: [
        { label: "Normalize factors", labelZh: "归一化因子", description: "Use fixed physical bounds, shrinkage, or explicitly declared curated tiers.", descriptionZh: "使用固定物理边界、收缩或明确登记的整理档位。" },
        { label: "Apply locked weights", labelZh: "应用锁定权重", description: "Read all eight weights from scoring spec v3.", descriptionZh: "从评分规范 v3 读取八个锁定权重。" },
        { label: "Geometric aggregation", labelZh: "几何聚合", description: "Apply a 0.001 numerical floor and weighted product.", descriptionZh: "应用 0.001 数值下限并计算加权乘积。" },
        { label: "Emit trace", labelZh: "输出追踪", description: "Store factor value, derivation level, n, refs, citations, and fallback reason.", descriptionZh: "保存因子值、派生层级、n、记录、引用和 fallback 原因。" },
      ],
      formulas: [
        {
          id: "organic-hgcps-v3-current",
          label: "Final HGCPS",
          labelZh: "最终 HGCPS",
          latex: "\\mathrm{HGCPS}=\\prod_{k=1}^{8}\\max(f_k,0.001)^{w_k},\\quad \\sum w_k=1",
          fallback: "HGCPS = Π max(f_k,0.001)^w_k; Σw_k=1",
          explanation: "The weighted geometric mean keeps a weak factor visible as a bottleneck.",
          explanationZh: "加权几何平均使弱因子持续作为瓶颈可见。",
        },
      ],
      inputs: ["eight normalized factors", "locked route weights", "zero floor"],
      inputsZh: ["八个归一化因子", "锁定路径权重", "数值下限"],
      outputs: ["final HGCPS", "factor trace", "route ordering"],
      outputsZh: ["最终 HGCPS", "逐因子追踪", "路线排序"],
      limitations: ["The route ordering is a validation-planning output, not a measured catalytic ranking."],
      limitationsZh: ["路线排序是验证规划输出，不是实测催化排名。"],
    },
    {
      id: "organic-audit-current",
      title: "Audit, sensitivity, and falsification",
      titleZh: "审计、敏感性与证伪",
      purpose: "Show where the current result is stable, fragile, fallback-driven, or statistically underpowered.",
      purposeZh: "展示当前结果在哪些方面稳定、脆弱、由 fallback 驱动或统计功效不足。",
      algorithmSteps: [
        { label: "Rule mutation audit", labelZh: "规则变更审计", description: "Compare the runtime scoring spec to the locked artifact.", descriptionZh: "对比运行时评分规范与锁定产物。" },
        { label: "Descriptor ablation", labelZh: "描述符消融", description: "Remove one factor at a time and recompute route movement.", descriptionZh: "每次移除一个因子并重算路线变化。" },
        { label: "Ranking sensitivity", labelZh: "排名敏感性", description: "Perturb eligible parameters within declared bounds.", descriptionZh: "在声明边界内扰动合格参数。" },
        { label: "Validation queue", labelZh: "验证队列", description: "Prioritize missing fields and experiments that could change decisions.", descriptionZh: "优先补充可能改变决策的缺失字段与实验。" },
      ],
      formulas: [],
      inputs: ["locked spec", "rerun artifact", "audit artifact", "ablation artifact"],
      inputsZh: ["锁定规范", "重跑产物", "审计产物", "消融产物"],
      outputs: ["pass/fail audits", "rank movement", "fragile factors", "next experiments"],
      outputsZh: ["审计通过／失败", "名次变化", "脆弱因子", "下一步实验"],
      limitations: ["Passing software audits does not validate chemical causality or experimental reproducibility."],
      limitationsZh: ["软件审计通过不等于化学因果或实验可重复性已验证。"],
    },
  ],
}

const nextModules = modules
  .filter(module => module.id !== "performance")
  .map(module => module.id === "organic-acid" ? organicAcid : module)
  .map((module, index) => ({ ...module, order: index + 1 }))

fs.writeFileSync(filePath, `${JSON.stringify(nextModules, null, 2)}\n`)
console.log(`Updated ${path.relative(process.cwd(), filePath)}: removed legacy performance module and installed V3.9.10 Organic Acid methodology.`)
