// @ts-nocheck

export const DATABASE_INDEX_COPY = {
  expandedScreeningUi: {
    en: "Expanded Database Screening UI",
    zh: "扩展数据库筛选界面",
  },
  workerScoringBoundaryPreview: {
    en: "Worker Scoring Boundary Preview",
    zh: "Worker 评分边界预览",
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
    en: "Why in preview?",
    zh: "为什么进入预览？",
  },
  topNPreviewOnly: {
    en: "Top-N preview only",
    zh: "仅 Top-N 预览",
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
    en: "loaded-scope dry run",
    zh: "已加载范围试算",
  },
  previewIndexDataOnly: {
    en: "comparison is based on currently loaded preview/index data only",
    zh: "对比仅基于当前已加载的预览/索引数据",
  },
  localLoadedScopeNotice: {
    en: "This is a local loaded-scope dry run, not full database screening.",
    zh: "这是当前已加载范围的本地试算，不是全量数据库筛选。",
  },
  fullDatabaseReason: {
    en: "Full database scoring must be precomputed or run outside the browser main thread.",
    zh: "全量数据库评分必须预计算，或在浏览器主线程之外执行。",
  },
  noExtraFetch: {
    en: "The worker request is built from records already loaded in the UI; it does not fetch additional index parts or detail records.",
    zh: "Worker 请求只使用界面中已经加载的记录，不会额外读取索引分片或详情记录。",
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
    en: "full database: browser unavailable",
    zh: "全量数据库：浏览器内不可用",
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
  if (status.includes("ready")) return lang === "zh" ? "可进入预览评分" : "ready for scoring"
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
