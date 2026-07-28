// @ts-nocheck

export const DATABASE_INDEX_COPY = {
  expandedScreeningUi: {
    en: "Real Structure Record Explorer",
    zh: "真实结构记录筛选器",
  },
  workerScoringBoundaryPreview: {
    en: "Large-Scale Scoring Boundary Preview",
    zh: "大规模评分边界预览",
  },
  candidateCompare: {
    en: "Candidate Compare",
    zh: "候选对比",
  },
  indexPartBrowser: {
    en: "Index Part Browser",
    zh: "索引分片浏览器",
  },
  whyInPreview: {
    en: "Why selected?",
    zh: "为什么被选作审阅样本？",
  },
  topNPreviewOnly: {
    en: "structural-review sample",
    zh: "结构审阅样本",
  },
  selectedIndexPartOnly: {
    en: "selected index part only",
    zh: "仅当前选定索引分片",
  },
  detailOnDemand: {
    en: "detail-on-demand",
    zh: "详情按需加载",
  },
  notFinalRecommendation: {
    en: "not a final verified recommendation",
    zh: "非最终验证推荐",
  },
  evidencePending: {
    en: "evidence pending",
    zh: "证据待核验",
  },
  fullVerifiedDatabaseScreening: {
    en: "full verified database screening",
    zh: "经完整验证的全量数据库筛选",
  },
  loadedScopeDryRun: {
    en: "loaded-scope trial scoring",
    zh: "已加载范围试算",
  },
  previewIndexDataOnly: {
    en: "comparison is based on currently loaded preview/index data only",
    zh: "对比仅基于当前已加载的预览/索引数据",
  },
  localLoadedScopeNotice: {
    en: "This is loaded-scope trial scoring, not full database screening.",
    zh: "这是当前已加载范围的本地试算，不是全量数据库筛选。",
  },
  fullDatabaseReason: {
    en: "Full database scoring requires source verification, descriptor recomputation, and method audit before it can be treated as a verified result.",
    zh: "全量数据库评分需先完成来源核验、描述符复算与方法审计，才能作为已核验结果使用。",
  },
  noExtraFetch: {
    en: "The current review uses only candidates already visible in this view and does not expand the evidence scope automatically.",
    zh: "当前审阅只使用本视图中已有候选，不会自动扩大证据范围。",
  },
  metadataVerification: {
    en: "Metadata verification",
    zh: "metadata 核验",
  },
  metadataVerificationGate: {
    en: "Metadata Verification Gate",
    zh: "metadata 核验门控",
  },
  eligibleForVerifiedRecommendation: {
    en: "Eligible for verified recommendation",
    zh: "可进入经核验推荐",
  },
  previewOnly: {
    en: "Preview only",
    zh: "仅限预览",
  },
  cannotSupportFinalRecommendation: {
    en: "This candidate cannot yet support a final recommendation",
    zh: "该候选目前不能作为最终推荐依据",
  },
  missingKeyMetadata: {
    en: "This candidate is missing key metadata and is available for index preview only, not verified recommendation.",
    zh: "该候选仍缺少关键 metadata，仅可用于索引预览，不能作为经核验推荐。",
  },
  blockingReasons: {
    en: "Blocking reasons",
    zh: "阻断原因",
  },
  warnings: {
    en: "Warnings",
    zh: "提示",
  },
  currentCandidate: {
    en: "Selected candidate",
    zh: "当前选中候选",
  },
}

export const SCORING_SCOPE_COPY = {
  top_n_preview: {
    en: "Top-N preview",
    zh: "Top-N 预览",
  },
  selected_index_part: {
    en: "selected index part",
    zh: "当前选定索引分片",
  },
  selected_candidates: {
    en: "selected candidates",
    zh: "已选择候选",
  },
  full_database_precompute_required: {
    en: "full database: verification required",
    zh: "全量数据库：需完成核验",
  },
}

export function dbText(lang, key) {
  const row = DATABASE_INDEX_COPY[key]
  if (!row) return key
  return lang === "zh" ? row.zh : row.en
}

export function dbScopeLabel(scope, lang) {
  const row = SCORING_SCOPE_COPY[scope] || SCORING_SCOPE_COPY.selected_index_part
  return lang === "zh" ? row.zh : row.en
}

export function dbStatusLabel(value, lang) {
  const status = String(value || "").toLowerCase().replace(/-/g, "_").replace(/\s+/g, "_")
  if (status === "real_core_mof_cr_index") return lang === "zh" ? "真实 CoRE 2024 CR 全量索引" : "real CoRE 2024 CR full index"
  if (status === "active_source_record_index") return lang === "zh" ? "真实来源记录已接入" : "real source records active"
  if (status === "quarantined") return lang === "zh" ? "已隔离" : "quarantined"
  if (status === "offline_preprocessed") return lang === "zh" ? "离线预处理" : "offline preprocessed"
  if (status === "detail_on_demand") return lang === "zh" ? "详情按需加载" : "detail on demand"
  if (status === "raw_cif_on_demand") return lang === "zh" ? "原始 CIF 按需加载" : "raw CIF on demand"
  if (status === "structural_screening_only") return lang === "zh" ? "仅结构筛选" : "structural screening only"
  if (status.includes("ready")) return lang === "zh" ? "结构筛选字段就绪" : "structural fields ready"
  if (status.includes("review")) return lang === "zh" ? "需要复核" : "needs review"
  if (status.includes("reject")) return lang === "zh" ? "已拒绝" : "rejected"
  if (status === "loaded") return lang === "zh" ? "已加载" : "loaded"
  if (status === "loading") return lang === "zh" ? "加载中" : "loading"
  if (status === "idle") return lang === "zh" ? "待运行" : "idle"
  if (status === "no_detail") return lang === "zh" ? "无详情" : "no detail"
  if (status === "database_index_preview") return lang === "zh" ? "数据库索引预览" : "database index preview"
  return value || dbText(lang, "evidencePending")
}

export function dbFallback(lang, fallbackKey = "evidencePending") {
  return dbText(lang, fallbackKey)
}

export function dbRenderText(value, lang, fallbackKey = "evidencePending") {
  if (value === null || value === undefined || value === "") return dbText(lang, fallbackKey)
  const rendered = String(value)
  if (!rendered || ["undefined", "null", "NaN"].includes(rendered)) return dbText(lang, fallbackKey)
  if (lang !== "zh") return rendered
  return rendered
    .replaceAll("comparison is based on currently loaded preview/index data only", dbText(lang, "previewIndexDataOnly"))
    .replaceAll("not final verified recommendation", dbText(lang, "notFinalRecommendation"))
    .replaceAll("not final recommendation", dbText(lang, "notFinalRecommendation"))
    .replaceAll("evidence pending", dbText(lang, "evidencePending"))
    .replaceAll("Evidence pending", dbText(lang, "evidencePending"))
    .replaceAll("full verified database screening", dbText(lang, "fullVerifiedDatabaseScreening"))
    .replaceAll("Al node candidate", "Al 节点候选")
    .replaceAll("pore descriptor available", "孔径描述符可用")
    .replaceAll("water-stability proxy/evidence available", "水稳定性代理/证据可用")
    .replaceAll("ready for preview scoring", "可进入预览评分")
}
