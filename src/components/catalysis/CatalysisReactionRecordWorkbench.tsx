// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import "./CatalysisResearch.css"
import {
  ArrowSquareOut,
  ChartBarHorizontal,
  Check,
  Database,
  Flask,
  MagnifyingGlass,
  Minus,
  SquaresFour,
  Table,
  WarningCircle,
} from "@phosphor-icons/react"
import { BasisBadge, getCatalysisReactionRecordsV1 } from "../../shared"
import {
  buildCatalysisReactionRecordRows,
  buildCatalysisReactionSummary,
  buildFaradaicEfficiencyRows,
  CATALYSIS_CONDITION_FIELDS,
  CATALYSIS_EVIDENCE_FIELDS,
  filterCatalysisReactionRows,
  formatCatalysisMetric,
  formatCatalysisValue,
} from "../../utils/catalysisReactionRecords"
import { localizeCatalysisText } from "../../utils/catalysisDisplayText"
import { buildCatalysisVerificationView } from "../../utils/catalysisVerificationV2"

const VIEW_OPTIONS = [
  { id: "records", zh: "反应记录", en: "Records", icon: Table },
  { id: "conditions", zh: "条件覆盖", en: "Conditions", icon: SquaresFour },
  { id: "active-phase", zh: "活性相证据", en: "Active phase", icon: Flask },
  { id: "performance", zh: "文献报道性能", en: "Reported metrics", icon: ChartBarHorizontal },
]

function getIdentityLabel(status, zh) {
  if (status === "derived-material-only") return zh ? "仅衍生材料" : "Derived material only"
  if (status === "literature-only-unresolved") return zh ? "文献身份待连接" : "Literature identity unresolved"
  if (status === "linked-to-mof-identity-registry") return zh ? "已连接结构库" : "Registry linked"
  if (status === "publisher-structure-identifier-verified") return zh ? "精确结构已解析" : "Exact structure resolved"
  return zh ? "身份待核验" : "Identity pending"
}

function getConditionValue(fieldId, state, zh) {
  if (!state?.available) return zh ? "缺失" : "Missing"
  if (fieldId === "potential") return `${state.inferredFromMetric ? "≈ " : ""}${formatCatalysisValue(state.value)} V vs RHE`
  if (fieldId === "duration") return `${formatCatalysisValue(state.value)} h`
  return localizeCatalysisText(formatCatalysisValue(state.value), zh)
}

function StatusCell({ available, value, t, zh, title }) {
  return (
    <div title={title} style={{ alignItems: "center", display: "flex", gap: 6, minWidth: 0 }}>
      <span style={{ alignItems: "center", background: available ? t.badgeInfoBg : t.badgeWarnBg, borderRadius: 4, color: available ? t.badgeInfoText : t.badgeWarnText, display: "inline-flex", flex: "0 0 auto", height: 20, justifyContent: "center", width: 20 }}>
        {available ? <Check aria-hidden size={13} weight="bold" /> : <Minus aria-hidden size={13} weight="bold" />}
      </span>
      <span style={{ color: available ? t.text : t.muted, fontSize: 10.5, lineHeight: 1.35, maxWidth: 128, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value || (available ? (zh ? "已记录" : "Recorded") : (zh ? "缺失" : "Missing"))}
      </span>
    </div>
  )
}

function KpiBand({ summary, t, zh, isMobile }) {
  const items = [
    { label: zh ? "DOI 核验来源" : "DOI-verified sources", value: summary.sourceCount },
    { label: zh ? "反应记录" : "Reaction records", value: summary.recordCount },
    { label: zh ? "数值指标" : "Numeric metrics", value: summary.numericMetricCount },
    { label: zh ? "含完整运行记录" : "Records with complete runs", value: summary.rankingEligibleCount, boundary: true },
  ]
  return (
    <div data-testid="catalysis-reaction-kpis" style={{ borderBottom: `1px solid ${t.border}`, borderTop: `1px solid ${t.border}`, display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))" }}>
      {items.map((item, index) => (
        <div key={item.label} style={{ boxShadow: index % (isMobile ? 2 : 4) === 0 ? "none" : `-1px 0 0 ${t.border}`, display: "grid", gap: 3, minWidth: 0, padding: isMobile ? "10px 9px" : "11px 14px" }}>
          <span style={{ color: item.boundary ? t.warn : t.textStrong, fontSize: 22, fontVariantNumeric: "tabular-nums", fontWeight: 900, lineHeight: 1 }}>{item.value}</span>
          <span style={{ color: t.muted, fontSize: 10.5, lineHeight: 1.35 }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== ""
}

function uniqueValues(values) {
  return [...new Set(values.filter(hasValue).map(value => typeof value === "string" ? value.trim() : value))]
}

function summarizeRunValues(values) {
  const unique = uniqueValues(values)
  if (!unique.length) return null
  if (unique.length === 1) return unique[0]
  if (unique.every(value => typeof value === "number")) {
    const sorted = [...unique].sort((a, b) => a - b)
    return `${formatCatalysisValue(sorted[0])}–${formatCatalysisValue(sorted[sorted.length - 1])}`
  }
  return unique.slice(0, 2).join(" / ")
}

function buildRunConditionCoverage(experimentRuns) {
  const runs = experimentRuns || []
  const valuesByField = {
    cell: runs.map(run => run.condition?.cellType),
    electrolyte: runs.map(run => run.condition?.electrolyte),
    potential: runs.map(run => run.condition?.potentialVsRheV ?? run.condition?.potentialVsRheVApprox),
    control: runs.map(run => run.condition?.appliedCurrentDensity != null
      ? `${run.condition.appliedCurrentDensity} ${run.condition.appliedCurrentDensityUnit || ""}`.trim()
      : run.condition?.currentMode),
    duration: runs.map(run => run.condition?.durationH),
    loading: runs.map(run => run.condition?.catalystLoading != null
      ? `${run.condition.catalystLoading} ${run.condition.catalystLoadingUnit || ""}`.trim()
      : run.condition?.catalystLoadingBasis),
    quantification: runs.map(run => run.condition?.productQuantification),
  }

  return Object.fromEntries(CATALYSIS_CONDITION_FIELDS.map(field => {
    const values = valuesByField[field.id] || []
    const availableCount = values.filter(hasValue).length
    return [field.id, {
      available: availableCount > 0,
      availableCount,
      explicitMissing: availableCount === 0,
      inferredFromMetric: false,
      runCount: runs.length,
      value: summarizeRunValues(values),
    }]
  }))
}

function mergeVerificationRows(legacyRows, verificationDatabase, lang) {
  if (!verificationDatabase) return legacyRows
  const zh = lang === "zh"
  const verification = buildCatalysisVerificationView(verificationDatabase)
  const byLegacyId = new Map(verification.recordRows.map(record => [record.legacyRecordId, record]))

  return legacyRows.map(row => {
    const verified = byLegacyId.get(row.id)
    if (!verified) return row
    const metrics = verified.claims.map(claim => ({
      ...claim,
      sourceLocation: claim.evidence?.map(item => item.sourceLocation).filter(Boolean).join("; ")
        || (zh ? "尚未定位到原文图表或章节" : "Not yet located to a source figure, table, or section"),
      status: claim.sourceReportedStatus,
    }))
    const numericMetrics = metrics.filter(metric => Number.isFinite(metric.value))
    const missingMetrics = metrics.filter(metric => !hasValue(metric.value))
    const conditionCoverage = buildRunConditionCoverage(verified.experimentRuns)
    const availableConditionCount = Object.values(conditionCoverage).filter(field => field.available).length
    const comparableRunCount = verified.experimentRuns.filter(run => run.decision?.compareEligible).length
    const firstCondition = verified.experimentRuns[0]?.condition || {}
    const conditionParts = [
      firstCondition.cellType,
      firstCondition.electrolyte,
    ].filter(Boolean).map(value => localizeCatalysisText(value, zh))
    const runLabel = zh
      ? `${verified.experimentRuns.length} 个实验运行 · ${comparableRunCount} 个条件完整`
      : `${verified.experimentRuns.length} experiment run${verified.experimentRuns.length === 1 ? "" : "s"} · ${comparableRunCount} condition-complete`

    return {
      ...row,
      activePhaseEvidence: {
        ...row.activePhaseEvidence,
        claim: verified.activePhaseClaim || row.activePhaseEvidence?.claim,
        activePhaseBoundary: verified.activePhaseBoundary || row.activePhaseEvidence?.activePhaseBoundary,
      },
      availableConditionCount,
      comparability: {
        sameConditionComparable: comparableRunCount > 0,
        reason: zh
          ? `${comparableRunCount} 个实验运行已达到单次运行的条件完整门槛；跨论文比较仍须匹配电位、电解液、池型、时长和载量基准。`
          : `${comparableRunCount} experiment runs pass the per-run condition gate; cross-paper comparison still requires aligned potential, electrolyte, cell, duration, and loading basis.`,
      },
      comparableRunCount,
      conditionCoverage,
      conditionCoverageRatio: availableConditionCount / CATALYSIS_CONDITION_FIELDS.length,
      conditionSummary: [...conditionParts, runLabel].join(" · "),
      experimentRuns: verified.experimentRuns,
      identityCanonicalId: verified.canonicalId,
      identityExactStructureIdentifier: verified.exactStructureIdentifier,
      identityJoinRule: verified.canonicalId
        ? row.identityJoinRule
        : verified.exactStructureIdentifier
          ? (zh
              ? "论文中的精确晶体结构标识已核验；当前本地 mof_identity_registry 尚无完全匹配条目，因此不建立本地 canonicalId。"
              : "The exact crystallographic identifier is verified in the article; no exact row exists in the local mof_identity_registry, so no local canonicalId is assigned.")
          : row.identityJoinRule,
      identityStatus: verified.identityStatus,
      faradaicEfficiencyMetrics: numericMetrics.filter(metric => metric.metric === "faradaic_efficiency"),
      fieldSources: Object.fromEntries([
        ...verified.experimentRuns.map(run => [`run:${run.id}`, run.sourceLocations || []]),
        ...metrics.map(metric => [`claim:${metric.id}`, metric.sourceLocation]),
      ]),
      hasCriticalGaps: verified.experimentRuns.some(run => (run.decision?.conditionCompleteness?.missing || []).length > 0),
      metrics,
      missingFields: [...new Set(verified.experimentRuns.flatMap(run => run.decision?.conditionCompleteness?.missing || []))],
      notExtractedMetricCount: missingMetrics.length,
      notExtractedMetrics: missingMetrics,
      numericMetricCount: numericMetrics.length,
      numericMetrics,
      verificationRecordId: verified.id,
    }
  })
}

function mergeVerificationSummary(legacySummary, verificationDatabase) {
  if (!verificationDatabase?.summary) return legacySummary
  const summary = verificationDatabase.summary
  return {
    ...legacySummary,
    experimentRunCount: summary.experimentRunCount,
    numericMetricCount: summary.numericClaimCount,
    rankingEligibleCount: summary.compareEligibleCount,
    recordCount: summary.reactionRecordCount,
    sourceCount: summary.sourceDocumentCount,
  }
}

function ViewSelector({ view, setView, t, zh, isMobile }) {
  return (
    <div className="glass-segmented-control reaction-record-tabs" aria-label={zh ? "记录库视图" : "Record-library view"} role="tablist">
      {VIEW_OPTIONS.map(option => {
        const Icon = option.icon
        const selected = view === option.id
        return (
          <button
            key={option.id}
            className="glass-segmented-item"
            data-active={selected ? "true" : "false"}
            aria-selected={selected}
            onClick={() => setView(option.id)}
            role="tab"
            type="button"
            style={{ color: selected ? t.accentText : t.muted }}
          >
            <Icon aria-hidden size={15} weight={selected ? "fill" : "regular"} />
            <span>{zh ? option.zh : option.en}</span>
          </button>
        )
      })}
    </div>
  )
}

function FilterBar({ search, setSearch, identityStatus, setIdentityStatus, coverage, setCoverage, t, zh, isMobile, visibleCount, totalCount }) {
  const controlStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, color: t.text, fontSize: 11, height: 34, outline: "none", padding: "0 9px" }
  return (
    <div style={{ alignItems: isMobile ? "stretch" : "center", display: "grid", gap: 7, gridTemplateColumns: isMobile ? "1fr" : "minmax(220px, 1.3fr) minmax(150px, .8fr) minmax(150px, .8fr) auto" }}>
      <label style={{ alignItems: "center", display: "flex", minWidth: 0, position: "relative" }}>
        <MagnifyingGlass aria-hidden color={t.subtle} size={15} style={{ left: 10, position: "absolute" }} />
        <span style={{ height: 1, overflow: "hidden", position: "absolute", width: 1 }}>{zh ? "搜索催化剂、DOI 或材料" : "Search catalyst, DOI, or material"}</span>
        <input
          aria-label={zh ? "搜索催化剂、DOI 或材料" : "Search catalyst, DOI, or material"}
          onChange={event => setSearch(event.target.value)}
          placeholder={zh ? "搜索催化剂、DOI 或材料" : "Search catalyst, DOI, or material"}
          style={{ ...controlStyle, boxSizing: "border-box", paddingLeft: 32, width: "100%" }}
          type="search"
          value={search}
        />
      </label>
      <select aria-label={zh ? "身份连接状态" : "Identity-link status"} onChange={event => setIdentityStatus(event.target.value)} style={controlStyle} value={identityStatus}>
        <option value="all">{zh ? "全部身份状态" : "All identity states"}</option>
        <option value="publisher-structure-identifier-verified">{zh ? "精确结构已解析" : "Exact structure resolved"}</option>
        <option value="literature-only-unresolved">{zh ? "文献身份待连接" : "Literature identity unresolved"}</option>
        <option value="derived-material-only">{zh ? "仅衍生材料" : "Derived material only"}</option>
      </select>
      <select aria-label={zh ? "数据覆盖状态" : "Data-coverage status"} onChange={event => setCoverage(event.target.value)} style={controlStyle} value={coverage}>
        <option value="all">{zh ? "全部覆盖状态" : "All coverage states"}</option>
        <option value="has-metrics">{zh ? "含数值指标" : "Has numeric metrics"}</option>
        <option value="has-in-situ">{zh ? "含原位证据" : "Has in-situ evidence"}</option>
        <option value="missing-critical">{zh ? "关键条件缺失" : "Critical conditions missing"}</option>
      </select>
      <span style={{ color: t.muted, fontSize: 10.5, fontVariantNumeric: "tabular-nums", textAlign: isMobile ? "left" : "right", whiteSpace: "nowrap" }}>
        {zh ? `显示 ${visibleCount} / ${totalCount}` : `Showing ${visibleCount} / ${totalCount}`}
      </span>
    </div>
  )
}

function RecordDetail({ row, t, zh }) {
  const [panel, setPanel] = useState("metrics")
  if (!row) return null
  const hasResolvedIdentity = Boolean(row.identityCanonicalId || row.identityExactStructureIdentifier)
  const panels = [["metrics", zh ? "报道指标" : "Reported metrics"], ["identity", zh ? "结构身份" : "Structure identity"], ["phase", zh ? "活性相与边界" : "Active phase & limits"]]
  return <aside data-testid="catalysis-record-detail" className="cr-detail">
    <header className="cr-detail-heading">
      <div className="cr-eyebrow">{row.year} <span> / </span> {getIdentityLabel(row.identityStatus, zh)}</div>
      <h3>{localizeCatalysisText(row.catalyst, zh)}</h3>
      <p>{localizeCatalysisText(row.activeMaterial || row.frameworkFamily, zh)}</p>
      <a href={row.doiUrl} rel="noreferrer" target="_blank">DOI {row.doi} <ArrowSquareOut aria-hidden size={14} /></a>
    </header>
    <div className="cr-local-nav" aria-label={zh ? "记录阅读视图" : "Record reading views"}>
      {panels.map(([id, label]) => <button key={id} type="button" aria-pressed={panel === id} onClick={() => setPanel(id)}>{label}</button>)}
    </div>
    <section hidden={panel !== "metrics"} className="cr-reading-panel">
      <h4>{zh ? `来源报道指标（${row.numericMetricCount} 个数值）` : `Source-reported metrics (${row.numericMetricCount} numeric)`}</h4>
      <div className="cr-metric-grid">{row.metrics.map(metric => {
        const formatted = formatCatalysisMetric(metric, zh ? "zh" : "en")
        return <article key={metric.id} className="cr-metric" data-metric={metric.metric}>
          <span className="cr-eyebrow">{formatted.label}</span>
          <strong className="cr-metric-value">{formatted.value}</strong>
          <span className="cr-condition">{formatted.condition}</span>
          <small>{localizeCatalysisText(metric.sourceLocation, zh)}</small>
        </article>
      })}</div>
      <div className="cr-inline-note">{zh ? "数值保留原文条件与不等号；不同运行间不直接比较。" : "Values retain source conditions and inequality signs; separate runs are not directly comparable."}</div>
    </section>
    <section hidden={panel !== "identity"} className="cr-reading-panel">
      <h4>{zh ? "结构身份与关联范围" : "Identity and database-link boundary"}</h4>
      <dl className="cr-facts">{[
        [zh ? "前驱 MOF" : "Precursor MOF", row.precursor],
        [zh ? "框架家族" : "Framework family", localizeCatalysisText(row.frameworkFamily, zh)],
        [zh ? "金属中心" : "Metal centers", row.metalCenters.join(", ")],
        [zh ? "论文结构标识" : "Article structure ID", row.identityExactStructureIdentifier || (zh ? "未解析" : "Unresolved")],
        [zh ? "本地结构 ID" : "Local canonical ID", row.identityCanonicalId || (zh ? "尚未连接" : "Not linked")],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl>
      <p className="cr-inline-note">{localizeCatalysisText(row.identityJoinRule, zh)}</p>
    </section>
    <section hidden={panel !== "phase"} className="cr-reading-panel">
      <h4>{zh ? "活性相声明及证据范围" : "Active-phase claim and evidence boundary"}</h4>
      <p>{localizeCatalysisText(row.activePhaseEvidence.claim || "—", zh)}</p>
      <p className="cr-inline-note">{localizeCatalysisText(row.activePhaseEvidence.activePhaseBoundary || "—", zh)}</p>
      <h4>{zh ? "缺失信息与可比性" : "Missing fields and comparability"}</h4>
      <p className="cr-missing">{row.missingFields.map(field => localizeCatalysisText(field, zh)).join(" · ") || (zh ? "当前无缺失字段" : "No missing fields")}</p>
      <p>{localizeCatalysisText(row.comparability.reason, zh)}</p>
      <small>{zh ? `${Object.keys(row.fieldSources).length} 个字段已记录来源` : `${Object.keys(row.fieldSources).length} field-level source mappings`}</small>
    </section>
    <footer className="cr-detail-footer"><span className={hasResolvedIdentity ? "cr-status-pass" : "cr-status-pending"}>{hasResolvedIdentity ? (zh ? "结构已解析" : "Structure resolved") : (zh ? "结构身份待核对" : "Structure review pending")}</span><span>{zh ? `${row.missingFields.length} 项条件待补全` : `${row.missingFields.length} condition gaps`}</span></footer>
  </aside>
}

function RecordsView({ rows, selectedId, setSelectedId, t, zh }) {
  const selected = rows.find(row => row.id === selectedId) || rows[0]
  if (!selected) return <EmptyState t={t} zh={zh} />
  return <div className="cr-record-layout">
    <nav className="cr-record-index" aria-label={zh ? "选择反应记录" : "Choose reaction record"}>
      <div className="cr-eyebrow cr-index-heading">{zh ? "文献记录" : "PUBLICATION RECORDS"}<span>{rows.length}</span></div>
      {rows.map((row, index) => <button key={row.id} type="button" aria-pressed={row.id === selected.id} onClick={() => setSelectedId(row.id)}>
        <span className="cr-record-number">{String(index + 1).padStart(2, "0")}</span>
        <span><strong>{localizeCatalysisText(row.catalyst, zh)}</strong><small>{row.year} · {row.numericMetricCount} {zh ? "项数值" : "numeric claims"}</small></span>
      </button>)}
    </nav>
    <RecordDetail row={selected} t={t} zh={zh} />
  </div>
}

function MatrixTable({ rows, fields, getState, selectedId, setSelectedId, t, zh, firstColumnLabel, testId }) {
  return (
    <div data-testid={testId} style={{ minWidth: 0, overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", minWidth: 980, width: "100%" }}>
        <thead>
          <tr>
            <th scope="col" style={{ background: t.panel, borderBottom: `1px solid ${t.borderStrong}`, color: t.subtle, fontSize: 9.5, left: 0, minWidth: 190, padding: "8px", position: "sticky", textAlign: "left", zIndex: 2 }}>{firstColumnLabel}</th>
            {fields.map(field => <th key={field.id} scope="col" style={{ borderBottom: `1px solid ${t.borderStrong}`, color: t.subtle, fontSize: 9.5, minWidth: 112, padding: "8px", textAlign: "left" }}>{zh ? field.zh : field.en}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const selected = row.id === selectedId
            return (
              <tr key={row.id} onClick={() => setSelectedId(row.id)} style={{ background: selected ? t.badgeInfoBg : "transparent", cursor: "pointer" }}>
                <th scope="row" style={{ background: selected ? t.badgeInfoBg : t.panel, borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 10.5, left: 0, lineHeight: 1.35, padding: "9px 8px", position: "sticky", textAlign: "left", zIndex: 1 }}>
                  {localizeCatalysisText(row.catalyst, zh)}
                  <span style={{ color: t.subtle, display: "block", fontSize: 9, fontWeight: 500, marginTop: 2 }}>{row.year} · {row.doi}</span>
                </th>
                {fields.map(field => {
                  const state = getState(row, field)
                  return (
                    <td key={field.id} style={{ borderBottom: `1px solid ${t.divider}`, padding: "9px 8px" }}>
                      <StatusCell available={state.available} title={state.title} value={state.value} t={t} zh={zh} />
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ConditionsView({ rows, selectedId, setSelectedId, t, zh }) {
  if (!rows.length) return <EmptyState t={t} zh={zh} />
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <MatrixTable
        fields={CATALYSIS_CONDITION_FIELDS}
        firstColumnLabel={zh ? "催化剂 / DOI" : "Catalyst / DOI"}
        getState={(row, field) => {
          const state = row.conditionCoverage[field.id]
          const formatted = getConditionValue(field.id, state, zh)
          const runCoverage = state.runCount > 1
            ? (zh ? `${state.availableCount}/${state.runCount} 个运行` : `${state.availableCount}/${state.runCount} runs`)
            : null
          return {
            ...state,
            value: runCoverage ? `${formatted} · ${runCoverage}` : formatted,
            title: runCoverage ? `${formatted} · ${runCoverage}` : formatted,
          }
        }}
        rows={rows}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        t={t}
        testId="catalysis-condition-matrix"
        zh={zh}
      />
      <p style={{ color: t.muted, fontSize: 10.5, lineHeight: 1.5, margin: 0 }}>
        {zh
          ? "覆盖状态按实验运行分别核对；同一论文中的峰值性能、分电流与稳定性试验不会合并成一套虚构条件。载量基准或产物定量方法未核验时仍保持缺失。"
          : "Coverage is checked per experiment run. Peak performance, partial-current, and stability tests from one paper are not merged into a fictitious shared condition set. Loading basis and quantification remain missing until verified."}
      </p>
    </div>
  )
}

function ActivePhaseView({ rows, selectedId, setSelectedId, t, zh }) {
  const selected = rows.find(row => row.id === selectedId) || rows[0]
  if (!selected) return <EmptyState t={t} zh={zh} />
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <MatrixTable
        fields={CATALYSIS_EVIDENCE_FIELDS}
        firstColumnLabel={zh ? "催化剂 / DOI" : "Catalyst / DOI"}
        getState={(row, field) => {
          const state = row.evidenceCoverage[field.id]
          return {
            available: state.available,
            title: state.items.join("\n") || (zh ? "未记录该类证据" : "No evidence recorded in this class"),
            value: state.available ? (zh ? `${state.count} 条` : `${state.count} item${state.count > 1 ? "s" : ""}`) : (zh ? "未记录" : "Not recorded"),
          }
        }}
        rows={rows}
        selectedId={selected.id}
        setSelectedId={setSelectedId}
        t={t}
        testId="catalysis-active-phase-matrix"
        zh={zh}
      />
      <section className="cr-phase-story">
        <header><span className="cr-eyebrow">{zh ? "活性相解读" : "ACTIVE PHASE"}</span><h3>{localizeCatalysisText(selected.catalyst, zh)}</h3><a href={selected.doiUrl} target="_blank" rel="noreferrer">DOI {selected.doi} <ArrowSquareOut size={13} /></a></header>
        <div className="cr-phase-content"><p className="cr-phase-lead">{localizeCatalysisText(selected.activePhaseEvidence.claim, zh)}</p>
          <div className="cr-phase-timeline">{CATALYSIS_EVIDENCE_FIELDS.filter(field => selected.evidenceCoverage[field.id].available).map((field, index) => <div key={field.id}>
            <span className="cr-eyebrow">{String(index + 1).padStart(2, "0")} / {zh ? field.zh : field.en}</span>
            {selected.evidenceCoverage[field.id].items.map((item, n) => <p key={n}>{localizeCatalysisText(item, zh)}</p>)}
          </div>)}</div>
          <p className="cr-inline-note">{localizeCatalysisText(selected.activePhaseEvidence.activePhaseBoundary, zh)}</p>
        </div>
      </section>
    </div>
  )
}

function PerformanceView({ rows, summary, t, zh }) {
  const data = useMemo(() => buildFaradaicEfficiencyRows(rows), [rows])
  const [selectedId, setSelectedId] = useState(null)
  const selected = data.find(item => item.id === selectedId) || data[0]
  if (!selected) return <EmptyState t={t} zh={zh} />
  return <div className="cr-performance">
    <header className="cr-section-heading"><div><span className="cr-eyebrow">{zh ? "文献性能观察" : "REPORTED PERFORMANCE"}</span><h3>{zh ? "来源报道的法拉第效率（条件不一致，不作排名）" : "Source-reported FE (incompatible conditions; not a ranking)"}</h3><p>{zh ? "按年份与收录顺序排列。选择一项，核对其数值和实验条件。" : "Ordered by year and curation sequence. Select a measurement to inspect its value and conditions."}</p></div><span className="cr-small-note">{zh ? `${summary.rankingEligibleCount} 条记录含条件完整运行` : `${summary.rankingEligibleCount} records with complete runs`}</span></header>
    <div className="cr-performance-layout">
      <div data-testid="catalysis-fe-chart" className="cr-fe-plot" aria-label={zh ? "法拉第效率记录，非排名" : "Faradaic efficiency records, not a ranking"}>
        <div className="cr-fe-axis"><span>{zh ? "催化剂 / 年份" : "Catalyst / year"}</span><span>0 <i>50</i> 100%</span><span>FE</span></div>
        {data.map(item => <button type="button" key={item.id} className="cr-fe-row" aria-pressed={selected.id === item.id} onClick={() => setSelectedId(item.id)}>
          <span className="cr-fe-name"><strong>{localizeCatalysisText(item.catalyst, zh)}</strong><small>{item.year} · {zh ? item.conditionLabelZh : item.conditionLabelEn}</small></span>
          <span className="cr-fe-track" aria-hidden="true"><span style={{ left: `${Math.max(0, Math.min(100, item.value))}%` }} /></span>
          <strong className="cr-fe-value">{item.operator && item.operator !== "=" ? `${item.operator} ` : ""}{item.value}<small> %</small></strong>
        </button>)}
      </div>
      <aside className="cr-fe-inspector" aria-live="polite"><span className="cr-eyebrow">{zh ? "当前测量" : "SELECTED MEASUREMENT"}</span><h4>{localizeCatalysisText(selected.catalyst, zh)}</h4><div className="cr-fe-big">{selected.operator && selected.operator !== "=" ? `${selected.operator} ` : ""}{selected.value}<small> %</small></div><h4>{zh ? "精确数值与实验条件" : "Exact values and conditions"}</h4><p>{zh ? selected.conditionLabelZh : selected.conditionLabelEn}</p><a href={selected.doiUrl} target="_blank" rel="noreferrer">DOI {selected.doi} <ArrowSquareOut size={13} /></a><p className="cr-inline-note">{zh ? "刻度位置表示来源报道数值，不等号保持原意。跨论文比较仍需匹配电位、电解液、池型、时长及载量。" : "Positions encode reported values; inequality signs retain their meaning. Cross-paper comparison still requires matched potentials, electrolytes, cells, durations and loading."}</p></aside>
    </div>
  </div>
}

function EmptyState({ t, zh }) {
  return (
    <div style={{ alignItems: "center", color: t.muted, display: "flex", fontSize: 11, gap: 7, justifyContent: "center", minHeight: 150 }}>
      <MagnifyingGlass aria-hidden size={17} />
      {zh ? "没有符合当前筛选条件的记录" : "No records match the current filters"}
    </div>
  )
}

export function CatalysisReactionRecordWorkbench({ lang = "zh", t, isMobile = false, dataset: datasetProp = null, verificationDatabase = null, embedded = false }) {
  const zh = lang === "zh"
  const [dataset, setDataset] = useState(datasetProp)
  const [loading, setLoading] = useState(!datasetProp)
  const [error, setError] = useState(null)
  const [view, setView] = useState("records")
  const [search, setSearch] = useState("")
  const [identityStatus, setIdentityStatus] = useState("all")
  const [coverage, setCoverage] = useState("all")
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (datasetProp) {
      setDataset(datasetProp)
      setLoading(false)
      setError(null)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    getCatalysisReactionRecordsV1({ throwOnError: true })
      .then(nextDataset => {
        if (cancelled) return
        setDataset(nextDataset)
        setError(null)
      })
      .catch(nextError => {
        if (cancelled) return
        setError(nextError)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [datasetProp])

  const rows = useMemo(
    () => mergeVerificationRows(buildCatalysisReactionRecordRows(dataset, lang), verificationDatabase, lang),
    [dataset, lang, verificationDatabase],
  )
  const filteredRows = useMemo(() => filterCatalysisReactionRows(rows, { search, identityStatus, coverage }), [rows, search, identityStatus, coverage])
  const summary = useMemo(
    () => mergeVerificationSummary(buildCatalysisReactionSummary(dataset, rows), verificationDatabase),
    [dataset, rows, verificationDatabase],
  )

  useEffect(() => {
    if (!filteredRows.length) return
    if (!selectedId || !filteredRows.some(row => row.id === selectedId)) setSelectedId(filteredRows[0].id)
  }, [filteredRows, selectedId])

  return (
    <section className="catalysis-research" id="catalysis-reaction-records" data-testid="catalysis-reaction-record-workbench" style={{ background: embedded ? "transparent" : t.panel, border: embedded ? 0 : `1px solid ${t.border}`, borderRadius: embedded ? 0 : 8, display: "grid", gap: 14, padding: embedded ? 0 : isMobile ? 12 : 16 }}>
      {!embedded ? <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
          <h2 style={{ color: t.textStrong, fontSize: isMobile ? 18 : 21, lineHeight: 1.2, margin: 0 }}>{zh ? "DOI 核验催化反应记录库" : "DOI-verified catalysis reaction library"}</h2>
          <p style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, margin: 0, maxWidth: 850 }}>
            {zh
              ? "统一查看催化剂身份、实验条件、文献报道指标、活性相证据与字段级来源。当前收录范围聚焦铋基 MOF 及其衍生材料电催化 CO₂ 还原制甲酸盐。"
              : "Inspect catalyst identity, operating conditions, source-reported metrics, active-phase evidence, and field-level provenance. The current seed covers Bi-based MOF and MOF-derived CO₂-to-formate electrocatalysts."}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <BasisBadge tone="calc">{zh ? "文献核对数据" : "Literature curated"}</BasisBadge>
            <BasisBadge tone="warn">{zh ? "不同实验条件下不作性能排名" : "No cross-condition ranking"}</BasisBadge>
            <BasisBadge tone="proxy">{zh ? "结构身份逐条核验" : "Identity reviewed per record"}</BasisBadge>
          </div>
        </div>
        <a href="#methodology" style={{ alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, color: t.accentText, display: "inline-flex", fontSize: 10.5, fontWeight: 850, gap: 6, minHeight: 32, padding: "0 10px", textDecoration: "none" }}>
          {zh ? "查看方法标准" : "Method standard"}<ArrowSquareOut aria-hidden size={13} />
        </a>
      </header> : null}

      {loading ? (
        <div style={{ alignItems: "center", color: t.muted, display: "flex", fontSize: 11, gap: 7, justifyContent: "center", minHeight: 180 }}><Database aria-hidden size={17} />{zh ? "正在读取反应记录…" : "Loading reaction records…"}</div>
      ) : error ? (
        <div role="alert" style={{ alignItems: "center", background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 6, color: t.warn, display: "flex", fontSize: 11, gap: 7, padding: "10px 12px" }}><WarningCircle aria-hidden size={17} />{zh ? "反应记录加载失败，请检查数据文件。" : "Reaction records failed to load. Check the dataset."}</div>
      ) : (
        <>
          <KpiBand isMobile={isMobile} summary={summary} t={t} zh={zh} />
          <ViewSelector isMobile={isMobile} setView={setView} t={t} view={view} zh={zh} />
          <FilterBar coverage={coverage} identityStatus={identityStatus} isMobile={isMobile} search={search} setCoverage={setCoverage} setIdentityStatus={setIdentityStatus} setSearch={setSearch} t={t} totalCount={rows.length} visibleCount={filteredRows.length} zh={zh} />

          <div role="tabpanel" style={{ minWidth: 0 }}>
            {view === "records" && <RecordsView isMobile={isMobile} rows={filteredRows} selectedId={selectedId} setSelectedId={setSelectedId} t={t} zh={zh} />}
            {view === "conditions" && <ConditionsView rows={filteredRows} selectedId={selectedId} setSelectedId={setSelectedId} t={t} zh={zh} />}
            {view === "active-phase" && <ActivePhaseView rows={filteredRows} selectedId={selectedId} setSelectedId={setSelectedId} t={t} zh={zh} />}
            {view === "performance" && <PerformanceView isMobile={isMobile} rows={filteredRows} summary={summary} t={t} zh={zh} />}
          </div>

          <footer className="cr-workbench-footnote">
            <WarningCircle aria-hidden color={t.warn} size={15} style={{ flex: "0 0 auto", marginTop: 1 }} />
            <span>{zh ? dataset?.audit?.qualityDecisionZh : dataset?.audit?.qualityDecision} {zh ? dataset?.audit?.requiredNextStepZh : dataset?.audit?.requiredNextStep}</span>
          </footer>
        </>
      )}
    </section>
  )
}
