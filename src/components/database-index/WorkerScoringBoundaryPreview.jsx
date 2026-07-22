// @ts-nocheck
import { useMemo, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, displayValue, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { dbScopeLabel, dbText } from "../../utils/databaseIndex/databaseIndexCopy"
import { formatCount } from "../../utils/databaseIndex/databaseIndexFormatters"
import { buildScoringBoundaryNotice, buildWorkerScoringRequest, buildWorkerScoringTrace, canRunBrowserScoring, runLoadedScopeDryRun } from "../../utils/databaseIndex/databaseScoringBoundary"

function ScopeCard({ scope, count, lang, t }) {
  const boundary = canRunBrowserScoring(scope)
  return (
    <article style={{ background: t.panel, border: `1px solid ${boundary.browserAllowed ? t.border : t.warn}`, borderRadius: 9, display: "grid", gap: 5, padding: 9 }}>
      <strong style={{ color: boundary.browserAllowed ? t.textStrong : t.warn, fontSize: 12.4 }}><ChemicalText value={dbScopeLabel(scope, lang)} /></strong>
      <span style={{ color: t.muted, fontSize: 11.7 }}>{text(lang, "记录数", "record count")}: {formatCount(count)}</span>
      <span style={{ color: boundary.browserAllowed ? t.muted : t.warn, fontSize: 11.5, lineHeight: 1.4 }}>
        <ChemicalText value={buildScoringBoundaryNotice(scope, lang)} />
      </span>
    </article>
  )
}

function Metric({ label, value, t }) {
  return (
    <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 4, padding: 9 }}>
      <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color: t.textStrong, fontSize: 14 }}><ChemicalText value={displayValue(value)} /></strong>
    </article>
  )
}

export function WorkerScoringBoundaryPreview({ topCandidates = [], selectedPartRecords = [], selectedCandidates = [], lang, t, isMobile }) {
  const [dryRun, setDryRun] = useState(null)
  const scopes = useMemo(() => ([
    ["top_n_preview", topCandidates.length],
    ["selected_index_part", selectedPartRecords.length],
    ["selected_candidates", selectedCandidates.length],
    ["full_database_precompute_required", 0],
  ]), [topCandidates.length, selectedPartRecords.length, selectedCandidates.length])

  const runSelectedPartDryRun = () => {
    const request = buildWorkerScoringRequest(selectedPartRecords, { scope: "selected_index_part" })
    const result = runLoadedScopeDryRun(request)
    setDryRun({ request, result, trace: buildWorkerScoringTrace(result) })
  }

  const trace = dryRun?.trace
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 12 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{dbText(lang, "workerScoringBoundaryPreview")}</strong>
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            <ChemicalText value={text(
              lang,
              "当前试算只处理已加载记录或用户选择的小批量候选，不会自动读取全部索引分片或详情记录。",
              "The trial scoring handles only currently loaded records or user-selected small candidate batches; it does not load all index parts or detail records."
            )} />
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <StatusPill tone="proxy" t={t}>{dbText(lang, "loadedScopeDryRun")}</StatusPill>
          <StatusPill tone="warn" t={t}>{dbText(lang, "notFinalRecommendation")}</StatusPill>
        </div>
      </header>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(170px, 1fr))" }}>
        {scopes.map(([scope, count]) => <ScopeCard key={scope} scope={scope} count={count} lang={lang} t={t} />)}
      </div>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <p style={{ color: t.warn, fontSize: 12, fontWeight: 850, lineHeight: 1.45, margin: 0 }}>
          <ChemicalText value={dbText(lang, "localLoadedScopeNotice")} />
        </p>
        <button type="button" disabled={!selectedPartRecords.length} onClick={runSelectedPartDryRun} style={{ background: selectedPartRecords.length ? t.accent : t.panel, border: `1px solid ${selectedPartRecords.length ? t.accent : t.border}`, borderRadius: 8, color: selectedPartRecords.length ? t.buttonText || "#fff" : t.faint, cursor: selectedPartRecords.length ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 900, minHeight: 34, padding: "7px 11px" }}>
          {text(lang, "运行已加载范围试算", "Run loaded-scope trial")}
        </button>
      </div>
      {dryRun ? (
        <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 9, padding: 10 }}>
          <header style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "space-between" }}>
            <strong style={{ color: t.textStrong, fontSize: 12.8 }}>{text(lang, "试算结果", "Trial-scoring result")}</strong>
            <StatusPill tone="warn" t={t}>{dbText(lang, "notFinalRecommendation")}</StatusPill>
          </header>
          <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))" }}>
            <Metric label={text(lang, "记录数", "record count")} value={formatCount(dryRun.result.inputRecordCount)} t={t} />
            <Metric label={text(lang, "已评分", "scored count")} value={formatCount(dryRun.result.scoredRecordCount)} t={t} />
            <Metric label={text(lang, "跳过", "skipped count")} value={formatCount(dryRun.result.skippedRecordCount)} t={t} />
            <Metric label={text(lang, "评分范围", "scoring scope")} value={dbScopeLabel(dryRun.result.scope, lang)} t={t} />
          </div>
          <div style={{ display: "grid", gap: 5 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "边界说明", "boundary notice")}</span>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}><ChemicalText value={lang === "zh" ? dryRun.result.boundaryZh : dryRun.result.boundary} /></span>
          </div>
          <div style={{ display: "grid", gap: 5 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "追踪摘要", "trace summary")}</span>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45, overflowWrap: "anywhere" }}>
              <ChemicalText value={text(
                lang,
                `${trace.runId} · ${dbScopeLabel(trace.scope, lang)} · 已评分 ${formatCount(trace.scoredRecordCount)} · 非最终边界已启用`,
                `${trace.runId} · ${dbScopeLabel(trace.scope, lang)} · ${formatCount(trace.scoredRecordCount)} scored · non-final boundary active`
              )} />
            </span>
          </div>
        </section>
      ) : null}
    </section>
  )
}
