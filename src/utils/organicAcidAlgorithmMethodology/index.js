import {
  buildOrganicAcidHostGuestWorkbench,
  HGCPS_FORMULA_TEXT,
  ORGANIC_ACID_HOST_GUEST_VERSION,
} from "../organicAcidHostGuest/index.js"
import {
  buildActivationReadinessSummary,
  ORGANIC_ACID_EXPERIMENTAL_ACTIVATION_VERSION,
} from "../organicAcidExperimentalActivation/index.js"

export const ORGANIC_ACID_ALGORITHM_METHODOLOGY_ID = "project-evolution-organic-acid-algorithm-methodology"
export const ORGANIC_ACID_ALGORITHM_METHODOLOGY_VERSION = "V3.9.10"

const SOURCE_LABELS = {
  hostGuestRoutes: "public/data/organic_acid_host_guest/host_guest_routes.json",
  hostMofCandidates: "public/data/organic_acid_host_guest/host_mof_candidates.json",
  guestMetalCandidates: "public/data/organic_acid_host_guest/guest_metal_candidates.json",
  evidenceRiskRecords: "public/data/organic_acid_host_guest/evidence_risk_records.json",
  activationReadiness: "public/data/organic_acid_experimental_activation/activation_readiness_summary.json",
  hostGuestBuilder: "buildOrganicAcidHostGuestWorkbench",
  activationReadinessBuilder: "buildActivationReadinessSummary",
  scoringSpec: "public/data/organic_acid_scoring_spec_v3.json",
  fairMofsSynthesisEvidence: "public/data/fair_mofs_family_synthesis_evidence.json",
  linkerDescriptors: "public/data/linker_descriptor_table.json",
  precursorCosts: "public/data/metal_precursor_cost_table.json",
  scoringAudit: "public/data/organic_acid_audit_v3_9_10.json",
  rerunArtifact: "public/data/organic_acid_rerun_v3_9_10.json",
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function safeText(value, fallback = "pending") {
  if (value === undefined || value === null) return fallback
  const next = String(value).trim()
  return next || fallback
}

function safeNumber(value, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function routeName(route = {}) {
  const host = safeText(route.hostMof, "host")
  const guest = safeText(route.guestMetal, "guest")
  return route.routeName || `${host} + ${guest}`
}

function boolStatus(value, positive, negative) {
  return value ? positive : negative
}

const ROUTE_FACTOR_META = {
  hostStabilityScore: { symbol: "F_{\\mathrm{host\\ stability}}", labelZh: "主体稳定性", labelEn: "Host stability" },
  hostPathwaySupportScore: { symbol: "F_{\\mathrm{host\\ pathway}}", labelZh: "主体路径支持", labelEn: "Host pathway support" },
  guestActivityCompensationScore: { symbol: "F_{\\mathrm{guest\\ activity}}", labelZh: "客体活性补偿", labelEn: "Guest activity compensation" },
  hostGuestComplementarityScore: { symbol: "F_{\\mathrm{complementarity}}", labelZh: "主客体互补", labelEn: "Host-guest complementarity" },
  evidenceConfidenceScore: { symbol: "F_{\\mathrm{evidence}}", labelZh: "证据置信", labelEn: "Evidence confidence" },
  riskPenalty: { symbol: "F_{\\mathrm{risk\\ retention}}", labelZh: "风险保留", labelEn: "Risk retention" },
  synthesizabilityScore: { symbol: "F_{\\mathrm{synthesizability}}", labelZh: "可合成性", labelEn: "Synthesizability" },
  economicScore: { symbol: "F_{\\mathrm{economics}}", labelZh: "经济性", labelEn: "Economics" },
}

function simplifiedGrade(value = "") {
  const level = String(value).toLowerCase()
  if (level.includes("fallback")) return "fallback"
  if (level.includes("curated")) return "curated"
  return "data-derived"
}

export function buildAlgorithmShowcaseModel({
  scoringSpecV1 = {},
  scoringSpecV2 = {},
  showcaseArtifact = {},
  priceTable = {},
} = {}) {
  const topRoute = showcaseArtifact.currentTopRoute || {}
  const provenance = topRoute.provenance || {}
  const factors = asArray(scoringSpecV2.routeScoreWeights).map(([key, weight]) => {
    const meta = ROUTE_FACTOR_META[key] || { symbol: key, labelZh: key, labelEn: key }
    const mapping = scoringSpecV2.routeFactorMappings?.[key] || {}
    const tuple = provenance[key] || {}
    return {
      key,
      ...meta,
      source: tuple.sourceDataset || mapping.source || "pending",
      normalization: tuple.normalization || mapping.normalization || mapping.aggregate || "none",
      weight: safeNumber(weight, 0),
      derivationLevel: tuple.derivationLevel || mapping.derivationLevel || "pending",
      dataGrade: simplifiedGrade(tuple.derivationLevel || mapping.derivationLevel),
      nRecords: safeNumber(tuple.nRecords, 0),
      fallbackReason: safeText(tuple.fallbackReason, ""),
    }
  })
  const proxy = showcaseArtifact.audit?.proxyValidity || {}
  const family = showcaseArtifact.audit?.familyFairness || {}
  const sensitivity = showcaseArtifact.audit?.rankingSensitivity?.summary || showcaseArtifact.audit?.rankingSensitivity || {}
  return {
    version: "V3.9.10",
    titleZh: "算法展示：八因子 HGCPS",
    titleEn: "Algorithm Showcase: Eight-factor HGCPS",
    formula: {
      latex: String.raw`\mathrm{HGCPS}(r)=\prod_{i=1}^{8}\max(F_i(r),0.001)^{w_i},\quad \sum_{i=1}^{8}w_i=1,\quad F_i\in[0,1]`,
      factorSetLatex: String.raw`\mathbf{F}=\{F_{\mathrm{host\ stability}},F_{\mathrm{host\ pathway}},F_{\mathrm{guest\ activity}},F_{\mathrm{complementarity}},F_{\mathrm{evidence}},F_{\mathrm{risk\ retention}},F_{\mathrm{synthesizability}},F_{\mathrm{economics}}\}`,
    },
    factors,
    modelChange: {
      from: scoringSpecV1.hgcpsFormula || "unweighted six-factor product",
      to: scoringSpecV2.algorithm?.routeAggregation || "weighted geometric mean",
      reasonZh: "模型由六因子纯乘法改为八因子加权几何平均：在因子数增加时避免分值整体塌缩，同时保留瓶颈效应，并降低单一弱因子对最终分值的过度支配。",
      reasonEn: "The model moved from a six-factor pure product to an eight-factor weighted geometric mean to avoid score collapse as factors are added, preserve the bottleneck effect, and reduce excessive domination by one weak factor.",
    },
    preregistration: [
      {
        specId: scoringSpecV1.specId || "organic-acid-host-guest-scoring-spec-v1",
        version: scoringSpecV1.version || "V3.9.6",
        lockedAt: scoringSpecV1.lockedAt || "pending",
        commit: "6ccbbfa",
        policy: scoringSpecV1.policy || "rules fixed before ranking computed",
      },
      {
        specId: scoringSpecV2.specId || "organic-acid-host-guest-scoring-spec-v2",
        version: scoringSpecV2.version || "V3.9.7",
        lockedAt: scoringSpecV2.lockedAt || "pending",
        commit: "339041e",
        policy: scoringSpecV2.policy || "new descriptors fixed before re-run",
      },
      {
        specId: "organic-acid-host-guest-scoring-spec-v3",
        version: "V3.9.10",
        lockedAt: "2026-07-28T06:41:01Z",
        commit: "pending-current",
        policy: "abundance-neutral stability and FAIR-MOFs condition-accessibility rules fixed before the rerun",
      },
    ],
    currentRun: {
      routeName: safeText(topRoute.routeName, "pending"),
      finalHGCPS: safeNumber(topRoute.finalHGCPS, 0),
      priceVersion: priceTable.version || showcaseArtifact.priceTable?.version || "pending",
      priceBoundary: priceTable.boundary || showcaseArtifact.priceTable?.boundary || "pending",
    },
    audit: {
      proxyDescriptors: asArray(proxy.descriptors),
      composite: proxy.composite || {},
      lowValidityDescriptors: asArray(proxy.lowValidityDescriptors),
      lowConfidenceFamilies: asArray(family.lowConfidenceFamilies),
      sensitivity: {
        scenarioCount: safeNumber(sensitivity.scenarioCount, 0),
        topRouteFlipFrequency: safeNumber(sensitivity.topRouteFlipFrequency, 0),
        fragility: safeText(sensitivity.fragility, "pending"),
        mostSensitiveFactor: safeText(sensitivity.mostSensitiveFactor, "pending"),
      },
      scoringMutation: showcaseArtifact.audit?.scoringMutation || { applied: false },
      conclusionZh: `复合孔代理 Spearman ρ=${safeNumber(proxy.composite?.spearmanRho, 0)}，单项低有效性描述符为 ${asArray(proxy.lowValidityDescriptors).join("、") || "无"}；低置信家族为 ${asArray(family.lowConfidenceFamilies).join("、") || "无"}。审计不静默改权重。`,
      conclusionEn: `Composite pore-proxy Spearman rho is ${safeNumber(proxy.composite?.spearmanRho, 0)}; low-validity standalone descriptors are ${asArray(proxy.lowValidityDescriptors).join(", ") || "none"}; low-confidence families are ${asArray(family.lowConfidenceFamilies).join(", ") || "none"}. The audit does not silently change weights.`,
    },
    disciplineZh: "规则先于排名：spec v1 / v2 / v3 的锁定时间先于对应重跑。V3.9.10 保持八因子权重不变，移除家族记录数量的直接加分，并把可合成性改为 FAIR-MOFs 合成条件可及性；样本量只影响收缩、置信度与不确定性。",
    disciplineEn: "Rules precede rankings: spec v1/v2/v3 were locked before their reruns. V3.9.10 keeps the eight-factor weights fixed, removes direct family-frequency scoring, and replaces synthesizability with FAIR-MOFs synthesis-condition accessibility; sample size affects shrinkage, confidence, and uncertainty only.",
  }
}

export const ORGANIC_ACID_ALGORITHM_FORMULAS = [
  {
    id: "pathway-flow",
    title: "Pathway -> Descriptor -> Host -> Guest -> Route -> Validation",
    latex: String.raw`\mathrm{Pathway}\rightarrow\mathrm{Descriptor}\rightarrow\mathrm{Host\ MOF}\rightarrow\mathrm{Guest\ Metal}\rightarrow\mathrm{Host{-}Guest\ Route}\rightarrow\mathrm{Validation}`,
  },
  {
    id: "pathway-set",
    title: "Pathway Step Set",
    latex: String.raw`P=\{p_{1},p_{2},\ldots,p_{n}\},\quad p_i\in\{\mathrm{CO}_{2}\ \mathrm{enrichment},\mathrm{CO}_{2}\ \mathrm{activation},\mathrm{HCOO}^{*}\ \mathrm{stabilization},\mathrm{PCET},\mathrm{HCOOH}\ \mathrm{desorption},\mathrm{stability\ risk}\}`,
  },
  {
    id: "descriptor-map",
    title: "Pathway-Step Descriptor Mapping",
    latex: String.raw`p_i\mapsto D_i=\{d_{i1},d_{i2},\ldots,d_{im}\},\quad D_i=f_{\mathrm{map}}(p_i)`,
  },
  {
    id: "host-selection",
    title: "Host MOF Selection",
    latex: String.raw`S_{\mathrm{host}}(h)=\sum_{k=1}^{m}w_{k}^{\mathrm{host}}x_k(h),\quad h^{*}=\arg\max_{h\in H}S_{\mathrm{host}}(h)`,
  },
  {
    id: "guest-selection",
    title: "Guest / Dopant Metal Selection",
    latex: String.raw`S_{\mathrm{guest}}(g\mid h^{*})=\sum_{j=1}^{q}w_{j}^{\mathrm{guest}}y_j(g,h^{*}),\quad g^{*}=\arg\max_{g\in G}S_{\mathrm{guest}}(g\mid h^{*})`,
  },
  {
    id: "route-definition",
    title: "Host-Guest Route Definition",
    latex: String.raw`r=(h,g,t),\quad r^{*}=\arg\max_{r\in R}\mathrm{HGCPS}(r)`,
  },
  {
    id: "hgcps",
    title: "Host-Guest Complementary Pathway Score",
    latex: String.raw`\mathrm{HGCPS}(r)=\prod_{i=1}^{8}\max(F_i(r),0.001)^{w_i},\quad \sum_{i=1}^{8}w_i=1,\quad F_i\in[0,1]`,
  },
  {
    id: "route-selection",
    title: "Route Selection Boundary",
    latex: String.raw`r^{*}=\arg\max_{r\in R}\mathrm{HGCPS}(r),\quad r^{*}\neq\mathrm{final\ catalytic\ proof}`,
  },
  {
    id: "route-hypothesis",
    title: "Experimental Hypothesis Boundary",
    latex: String.raw`r^{*}\Rightarrow\mathrm{high{-}priority\ experimental\ hypothesis}`,
  },
  {
    id: "sensitivity",
    title: "Sensitivity Analysis",
    latex: String.raw`\mathrm{HGCPS}_{i}^{(\pm20\%)}=\prod_j\max(F_j,0.001)^{\tilde{w}_j},\quad \tilde{w}_i\propto w_i(1\pm0.2)`,
  },
  {
    id: "ablation",
    title: "Ablation Analysis",
    latex: String.raw`\Delta_i=\mathrm{HGCPS}(r^{*})-\mathrm{HGCPS}_{-i}(r^{*})`,
  },
  {
    id: "feedback-evidence",
    title: "Experimental Evidence Update",
    latex: String.raw`F_{\mathrm{evidence}}^{\mathrm{new}}=\mathrm{clip}\left(F_{\mathrm{evidence}}^{\mathrm{old}}+\Delta_{\mathrm{exp}},0,1\right)`,
  },
  {
    id: "feedback-risk",
    title: "Risk Retention Update",
    latex: String.raw`F_{\mathrm{risk\ retention}}^{\mathrm{new}}=\mathrm{clip}\left(F_{\mathrm{risk\ retention}}^{\mathrm{old}}+\Delta_{\mathrm{stability}}+\Delta_{\mathrm{leaching}},0,1\right)`,
  },
]

function formulaById(id) {
  return ORGANIC_ACID_ALGORITHM_FORMULAS.find(formula => formula.id === id) || ORGANIC_ACID_ALGORITHM_FORMULAS[0]
}

export function buildOrganicAcidAlgorithmMethodology(input = {}) {
  const hostGuestWorkbench = input.hostGuestWorkbench || buildOrganicAcidHostGuestWorkbench({
    pathwaySteps: input.pathwaySteps,
    pathwayDescriptorMap: input.pathwayDescriptorMap,
    hostMofCandidates: input.hostMofCandidates,
    guestMetalCandidates: input.guestMetalCandidates,
    hostGuestRoutes: input.hostGuestRoutes,
    evidenceRiskRecords: input.evidenceRiskRecords,
    validationExperiments: input.validationExperiments,
    coreMofImport: input.coreMofImport,
    qmofImport: input.qmofImport,
    reactionDataset: input.reactionDataset,
    gasAdsorptionRecords: input.gasAdsorptionRecords,
    literatureDataset: input.literatureDataset,
    goldDataset: input.goldDataset,
  })
  const readiness = input.activationReadiness || buildActivationReadinessSummary(input.activationReadinessSummary || {})
  const topRoute = hostGuestWorkbench.complementarity?.topRoute || {}
  const selectedHost = hostGuestWorkbench.hostSelection?.selectedHost || {}
  const selectedGuest = hostGuestWorkbench.guestSelection?.selectedGuestMetal || {}
  const hgcps = safeNumber(topRoute.finalHGCPS, 0)

  const dynamicContext = {
    version: ORGANIC_ACID_ALGORITHM_METHODOLOGY_VERSION,
    hostGuestVersion: ORGANIC_ACID_HOST_GUEST_VERSION,
    activationVersion: ORGANIC_ACID_EXPERIMENTAL_ACTIVATION_VERSION,
    currentTopRoute: routeName(topRoute),
    routeId: safeText(topRoute.routeId, "route pending"),
    selectedHost: safeText(topRoute.hostMof || selectedHost.displayName, "host pending"),
    topStructuralHost: safeText(selectedHost.displayName, "host pending"),
    selectedGuest: safeText(selectedGuest.guestMetal || topRoute.guestMetal, "guest pending"),
    selectedHostRole: safeText(selectedHost.hostRole, "stable host framework candidate"),
    selectedGuestRole: safeText(selectedGuest.role, "guest / dopant / activity-compensation metal"),
    hgcps,
    hgcpsFormulaText: HGCPS_FORMULA_TEXT,
    readinessLevel: safeText(readiness.readinessLevel, "planning-ready / not performance-validated"),
    performanceClaimStatus: boolStatus(readiness.canUseForPerformanceClaim, "performance claim allowed", "not final catalytic proof"),
    mlReadinessStatus: boolStatus(readiness.canUseForMachineLearning, "ready for formal machine learning", "not ready for formal machine learning"),
    experimentPlanningStatus: boolStatus(readiness.canUseForExperimentPlanning, "experiment planning ready", "experiment planning blocked"),
  }

  const sectionSpecs = [
    {
      id: "algorithm-positioning",
      title: "Algorithm Positioning",
      titleZh: "算法定位",
      formulas: ["pathway-flow", "pathway-set"],
      explanation: "Organic Acid screening is pathway-specific: it models CO2-to-organic-acid reaction bottlenecks, not a generic MOF ranking table.",
      explanationZh: "有机酸筛选是路径专用算法：它围绕 CO2 到有机酸的关键反应瓶颈，而不是通用 MOF 排名表。",
      input: "CO2-to-organic-acid pathway steps and pathway_descriptor_map records.",
      output: "A reaction-pathway algorithm frame with explicit bottleneck steps.",
      dataSource: [SOURCE_LABELS.hostGuestBuilder, "public/data/organic_acid_host_guest/pathway_steps.json", "public/data/organic_acid_host_guest/pathway_descriptor_map.json"],
      limitation: "Pathway steps are curated / proxy descriptors until same-condition experiments are completed.",
    },
    {
      id: "descriptor-mapping",
      title: "Pathway-Step Descriptor Mapping",
      titleZh: "路径步骤—描述符映射",
      formulas: ["descriptor-map"],
      explanation: "Each pathway step owns its descriptor group; descriptors are not collapsed into one undifferentiated score.",
      explanationZh: "每个路径步骤对应自己的描述符组，避免把富集、活化、稳定、脱附和风险混成单一总分。",
      input: "pathway_descriptor_map records.",
      output: "Step-specific descriptor sets for host and guest screening.",
      dataSource: ["public/data/organic_acid_host_guest/pathway_descriptor_map.json"],
      limitation: "Several descriptors remain proxy or missing direct same-condition evidence.",
    },
    {
      id: "host-selection",
      title: "Host MOF Selection",
      titleZh: "主体 MOF 筛选",
      formulas: ["host-selection"],
      explanation: `${dynamicContext.topStructuralHost} is the host-only structural leader; ${dynamicContext.selectedHost} is the host of the top route after ligand, synthesizability, economics, guest, evidence, and risk factors are included.`,
      explanationZh: `${dynamicContext.topStructuralHost} 是主体单项结构得分第一；纳入配体、可合成性、经济性、客体、证据与风险后，top route 主体为 ${dynamicContext.selectedHost}。`,
      input: "host candidates, real datasets, linker descriptor table, and host score weights.",
      output: `${dynamicContext.topStructuralHost} as top structural host and ${dynamicContext.selectedHost} as top route host.`,
      dataSource: [SOURCE_LABELS.hostMofCandidates, SOURCE_LABELS.linkerDescriptors, SOURCE_LABELS.scoringSpec, SOURCE_LABELS.hostGuestBuilder],
      limitation: "Neither host-only rank nor route rank is final catalyst-performance proof.",
    },
    {
      id: "guest-selection",
      title: "Guest Metal Selection",
      titleZh: "客体金属筛选",
      formulas: ["guest-selection", "route-definition"],
      explanation: `${dynamicContext.selectedGuest} is selected after the host is fixed, so it is a guest / dopant / activity-compensation metal under ${dynamicContext.selectedHost}, not a standalone optimum claim.`,
      explanationZh: `${dynamicContext.selectedGuest} 在主体确定后筛出，因此它是 ${dynamicContext.selectedHost} 主体下的客体 / 掺杂 / 活性补偿金属，不是独立最优声明。`,
      input: "guest_metal_candidates records and selected host context.",
      output: `${dynamicContext.currentTopRoute} route definition.`,
      dataSource: [SOURCE_LABELS.guestMetalCandidates, SOURCE_LABELS.hostGuestBuilder],
      limitation: `${dynamicContext.selectedGuest} loading, oxidation state, and local coordination require characterization.`,
    },
    {
      id: "hgcps",
      title: "Host-Guest Complementary Pathway Score",
      titleZh: "主客体互补路径评分",
      formulas: ["hgcps", "route-selection", "route-hypothesis"],
      explanation: `Current ${dynamicContext.currentTopRoute} HGCPS is ${dynamicContext.hgcps}. The preregistered weighted geometric mean combines eight factors, including synthesizability and economic LCC; risk retention remains a 0-1 factor.`,
      explanationZh: `当前 ${dynamicContext.currentTopRoute} 的 HGCPS 为 ${dynamicContext.hgcps}。预注册加权几何平均合并 8 个因子，其中包括可合成性与经济性 LCC；风险保留仍是 0-1 因子。`,
      input: "host_guest_routes, evidence records, linker descriptors, synthesizability frequency, and precursor-cost LCC inputs.",
      output: `${dynamicContext.currentTopRoute} as a high-priority experimental hypothesis.`,
      dataSource: [SOURCE_LABELS.hostGuestRoutes, SOURCE_LABELS.evidenceRiskRecords, SOURCE_LABELS.scoringSpec, SOURCE_LABELS.precursorCosts, SOURCE_LABELS.rerunArtifact, SOURCE_LABELS.hostGuestBuilder],
      limitation: "Top route is not final catalytic proof.",
    },
    {
      id: "sensitivity-ablation-risk",
      title: "Sensitivity, Ablation and Risk Boundary",
      titleZh: "敏感性、消融与风险边界",
      formulas: ["sensitivity", "ablation"],
      explanation: "Sensitivity perturbs each route-factor weight by +/-20% and adds normalization-curvature scenarios; the audit also reports proxy validity and family outliers.",
      explanationZh: "敏感性分析对各路线因子权重做 ±20% 扰动，并加入归一化曲率场景；审计同时报告代理有效性与家族异常值。",
      input: "HGCPS factor table, sensitivity builder output, ablation builder output, risk matrix.",
      output: "Rank-stability interpretation and unresolved-risk boundary.",
      dataSource: [SOURCE_LABELS.hostGuestRoutes, SOURCE_LABELS.evidenceRiskRecords, SOURCE_LABELS.scoringAudit, SOURCE_LABELS.hostGuestBuilder],
      limitation: "Risk matrix is evidence-guided planning support and does not replace experimental validation.",
    },
    {
      id: "experimental-feedback",
      title: "Experimental Feedback and Algorithm Update",
      titleZh: "实验反馈与算法更新",
      formulas: ["feedback-evidence", "feedback-risk"],
      explanation: `Supported results can raise evidence confidence or risk retention; contradicted results lower related factors; inconclusive results, especially incomplete carbon balance, do not force reranking. Current readiness is ${dynamicContext.readinessLevel}.`,
      explanationZh: `supported result 可提升 evidence confidence 或 risk retention；contradicted result 降低相关因子；inconclusive result，尤其碳平衡不闭合，不应强行重排。当前 readiness 为 ${dynamicContext.readinessLevel}。`,
      input: "activation readiness summary, same-condition template, feedback rules.",
      output: "Algorithm update preview only until real same-condition results are provenance-reviewed.",
      dataSource: [SOURCE_LABELS.activationReadiness, SOURCE_LABELS.activationReadinessBuilder],
      limitation: `${dynamicContext.performanceClaimStatus}; ${dynamicContext.mlReadinessStatus}.`,
    },
  ]

  const sections = sectionSpecs.map(section => ({
    ...section,
    formulas: section.formulas.map(id => formulaById(id)),
  }))

  return {
    id: ORGANIC_ACID_ALGORITHM_METHODOLOGY_ID,
    version: ORGANIC_ACID_ALGORITHM_METHODOLOGY_VERSION,
    title: "Organic Acid Host-Guest Algorithm Methodology",
    titleZh: "有机酸主客体路径筛选算法方法论",
    dynamicContext,
    sourceLabels: SOURCE_LABELS,
    formulas: ORGANIC_ACID_ALGORITHM_FORMULAS,
    sections,
    badges: [
      dynamicContext.currentTopRoute,
      "High-priority experimental hypothesis",
      "Not final catalytic proof",
      "Not ready for formal machine learning",
    ],
    exportNames: {
      markdown: "organic-acid-algorithm-methodology.md",
      formulaJson: "organic-acid-algorithm-formulas.json",
      latexSummary: "organic-acid-algorithm-latex-summary.tex",
    },
  }
}

export function buildOrganicAcidAlgorithmFormulaJson(methodology) {
  const next = methodology || buildOrganicAcidAlgorithmMethodology({})
  return {
    version: ORGANIC_ACID_ALGORITHM_METHODOLOGY_VERSION,
    title: next.title,
    dynamicContext: next.dynamicContext,
    formulas: next.formulas.map(formula => ({
      id: formula.id,
      title: formula.title,
      latex: formula.latex,
    })),
    boundary: `${next.dynamicContext?.currentTopRoute || "Current top route"} is a high-priority experimental hypothesis, not final catalytic proof.`,
  }
}

export function buildOrganicAcidAlgorithmLatexSummary(methodology) {
  const next = methodology || buildOrganicAcidAlgorithmMethodology({})
  return [
    "% Organic Acid Host-Guest Algorithm Methodology LaTeX Summary",
    `% Version: ${ORGANIC_ACID_ALGORITHM_METHODOLOGY_VERSION}`,
    "",
    ...next.formulas.map(formula => [
      `% ${formula.title}`,
      `\\[${formula.latex}\\]`,
      "",
    ].join("\n")),
    `% Boundary: ${next.dynamicContext?.currentTopRoute || "Current top route"} is a high-priority experimental hypothesis, not final catalytic proof.`,
    "% Boundary: not ready for formal machine learning.",
    "",
  ].join("\n")
}

export function buildOrganicAcidAlgorithmMethodologyMarkdown(methodology) {
  const next = methodology || buildOrganicAcidAlgorithmMethodology({})
  const context = next.dynamicContext
  const sectionRows = next.sections.flatMap(section => [
    `## ${section.title}`,
    "",
    section.explanation,
    "",
    "Formula:",
    "",
    ...section.formulas.flatMap(formula => [`\\[${formula.latex}\\]`, ""]),
    `Input: ${section.input}`,
    `Output: ${section.output}`,
    `Data source: ${section.dataSource.join("; ")}`,
    `Limitation: ${section.limitation}`,
    "",
  ])
  return [
    `# ${next.title}`,
    "",
    `Version: ${next.version}`,
    `Current top route: ${context.currentTopRoute}`,
    `Selected host: ${context.selectedHost}`,
    `Selected guest: ${context.selectedGuest}`,
    `HGCPS: ${context.hgcps}`,
    `Readiness: ${context.readinessLevel}`,
    `Boundary: ${context.performanceClaimStatus}; ${context.mlReadinessStatus}.`,
    "",
    ...sectionRows,
  ].join("\n")
}
