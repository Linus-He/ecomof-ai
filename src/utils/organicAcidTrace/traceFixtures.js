// @ts-nocheck

export const TRACE_WORKFLOW_VERSION = "V1.7"

export const TRACE_BOUNDARIES = [
  {
    id: "auditability-not-proof",
    label: "Auditability boundary",
    labelZh: "可审计性边界",
    detail: "Algorithm Trace Workbench explains how the current demo / mapped fixture / curated example workflow produces a recommendation. It provides auditability and transparency, not proof of catalytic performance.",
    detailZh: "算法追踪工作台用于解释当前演示数据、映射样例或人工整理真实样例如何经过筛选流程产生推荐结果。它提供可审计性和透明度，不证明实际催化性能。",
  },
  {
    id: "mo-hypothesis",
    label: "Mo interpretation boundary",
    labelZh: "Mo 解释边界",
    detail: "Mo is a recommendation outcome and primary hypothesis, not a direct retrieval condition or experimentally proven optimum.",
    detailZh: "Mo 是推荐结果与主假设，不是直接检索条件，也不是已由实验证明的最优结论。",
  },
  {
    id: "needs-review-block",
    label: "Needs-review blocking rule",
    labelZh: "needs-review 拦截规则",
    detail: "Needs-review records remain visible in trace and maps, but they cannot enter final recommendation until provenance and hard-gate evidence are reviewed.",
    detailZh: "needs-review 记录在 trace 和图表中保持可见，但在来源与硬阈值证据复核前不能进入最终推荐。",
  },
]

export const STEP_TRACE_RULES = {
  "load-candidate-frameworks": {
    rule: "Load the current demo / seed / mapped-ready framework candidate pool.",
    ruleZh: "加载当前 demo / seed / mapped-ready 骨架候选池。",
    formula: "input rows -> candidate rows",
    formulaZh: "输入行 -> 候选行",
  },
  "apply-hydrothermal-gate": {
    rule: "Hydrothermal evidence >=150 C and post-treatment PXRD retained must pass before OACS ranking.",
    ruleZh: "必须先通过 >=150 C 水热证据和处理后 PXRD 保留要求，才能进入 OACS 排序。",
    formula: "fail or needs_review -> OACS = 0",
    formulaZh: "fail 或 needs_review -> OACS = 0",
  },
  "calculate-oacs": {
    rule: "Calculate OACS only after the hydrothermal hard gate passes.",
    ruleZh: "只对通过水热硬阈值的候选计算 OACS。",
    formula: "OACS = weighted positive descriptors - collapse risk penalty",
    formulaZh: "OACS = 正向描述符加权和 - 坍塌风险惩罚",
  },
  "select-scaffold": {
    rule: "Select the highest-priority pass candidate after gate-first sorting.",
    ruleZh: "在 gate-first 排序后选择最高优先级 pass 候选。",
    formula: "rank 1 pass candidate -> selected scaffold",
    formulaZh: "排名最高的 pass 候选 -> 选定骨架",
  },
  "evaluate-dopant-metals": {
    rule: "Evaluate the configured metal pool after scaffold selection; Mo is not a retrieval condition.",
    ruleZh: "选定骨架后评估配置的第二金属池；Mo 不是检索条件。",
    formula: "selected scaffold + metal descriptors -> metal rows",
    formulaZh: "选定骨架 + 金属描述符 -> 金属候选行",
  },
  "calculate-dmrs": {
    rule: "Calculate DMRS for every metal and keep competitors visible.",
    ruleZh: "对每个金属计算 DMRS，并保持竞品可见。",
    formula: "DMRS = active site + mechanism + aqueous stability + evidence - risk",
    formulaZh: "DMRS = 活性位 + 机制 + 水相稳定 + 证据 - 风险",
  },
  "run-sensitivity-audit": {
    rule: "Rerank all metals under weight perturbation before interpreting robustness.",
    ruleZh: "解释稳健性前，在权重扰动下重排全金属池。",
    formula: "+/- weight perturbation -> rank distribution",
    formulaZh: "+/- 权重扰动 -> 排名分布",
  },
  "build-hot-spot-map": {
    rule: "Project scaffold and metal scores into a coupled descriptor design space.",
    ruleZh: "将骨架与金属分数投影到耦合描述符设计空间。",
    formula: "OACS axis x DMRS axis -> hot spot role",
    formulaZh: "OACS 轴 x DMRS 轴 -> 热区角色",
  },
  "generate-exafs-hypothesis": {
    rule: "Generate falsifiable spectroscopy expectations for the Mo hypothesis.",
    ruleZh: "为 Mo 假设生成可证伪的谱学预期。",
    formula: "most likely Mo form -> EXAFS feature checklist",
    formulaZh: "最可能 Mo 形态 -> EXAFS 特征清单",
  },
  "build-candidate-report-trace": {
    rule: "Compile run, candidate, formula, evidence, warning, and boundary records.",
    ruleZh: "汇总运行、候选、公式、证据、warning 与边界记录。",
    formula: "run result -> exportable trace report",
    formulaZh: "运行结果 -> 可导出 trace 报告",
  },
  "load-curated-framework-examples": {
    rule: "Load small curated examples only; do not treat them as full database screening.",
    ruleZh: "只加载小规模人工整理样例；不能视为全量数据库筛选。",
    formula: "curated rows -> mapped framework examples",
    formulaZh: "curated 行 -> 映射骨架样例",
  },
  "validate-curated-schema": {
    rule: "Map curated rows into the Organic Acid screening schema before scoring.",
    ruleZh: "评分前将 curated 行映射到 Organic Acid 筛选 schema。",
    formula: "raw fields -> normalized screening fields",
    formulaZh: "原始字段 -> 归一化筛选字段",
  },
  "apply-data-quality-gate": {
    rule: "Only ready-for-scoring records can enter OACS; needs-review stays auditable.",
    ruleZh: "只有 ready-for-scoring 记录可进入 OACS；needs-review 保持可审计。",
    formula: "quality gate status -> scoring eligibility",
    formulaZh: "质量门状态 -> 评分资格",
  },
  "attach-qmof-descriptors": {
    rule: "Attach QMOF-like descriptors when record IDs match; unmatched rows remain visible.",
    ruleZh: "记录 ID 匹配时挂接 QMOF-like 描述符；未匹配行保持可见。",
    formula: "framework id + descriptor id -> merged descriptors",
    formulaZh: "骨架 ID + 描述符 ID -> 合并描述符",
  },
  "attach-literature-evidence": {
    rule: "Attach literature evidence without fabricating DOI metadata.",
    ruleZh: "挂接文献证据，但不伪造 DOI 元数据。",
    formula: "evidenceIds -> field-level evidence links",
    formulaZh: "evidenceIds -> 字段级证据链接",
  },
  "apply-hydrothermal-gate-curated": {
    rule: "Curated needs-review records cannot enter final recommendation.",
    ruleZh: "curated needs-review 记录不能进入最终推荐。",
    formula: "data quality gate + hydrothermal gate -> eligibility",
    formulaZh: "数据质量门 + 水热门槛 -> 入选资格",
  },
  "calculate-oacs-curated": {
    rule: "Calculate OACS only for curated records that pass quality and hydrothermal gates.",
    ruleZh: "只对通过质量门与水热门槛的 curated 记录计算 OACS。",
    formula: "eligible curated descriptors -> OACS preview",
    formulaZh: "合格 curated 描述符 -> OACS 预览",
  },
  "project-curated-hot-spot": {
    rule: "Project curated examples with ready / needs-review / rejected roles.",
    ruleZh: "按 ready / needs-review / rejected 角色投影 curated 样例。",
    formula: "quality role + descriptor coordinates -> map point",
    formulaZh: "质量角色 + 描述符坐标 -> 图上点",
  },
  "generate-curated-review-summary": {
    rule: "Report DOI coverage, field provenance, and no-full-database boundary.",
    ruleZh: "报告 DOI 覆盖、字段来源与非全量数据库边界。",
    formula: "mapping report -> review summary",
    formulaZh: "mapping report -> 复核摘要",
  },
}

