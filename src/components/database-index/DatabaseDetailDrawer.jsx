// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, displayValue, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { fetchDetailRecord } from "../../utils/databaseIndex/databaseIndexClient"
import { dbFallback, dbRenderText, dbStatusLabel, dbText } from "../../utils/databaseIndex/databaseIndexCopy"
import { descriptorAvailabilityList, descriptorCompletenessPercent, formatPercentValue, organicAcidRelevanceSnapshot, provenanceCompletenessPercent, safeText } from "../../utils/databaseIndex/databaseIndexFormatters"
import { buildMetadataVerificationSummary, metadataLevelLabel, metadataLevelTone, metadataStatusTone, metadataStatusValueLabel } from "../../utils/databaseIndex/metadataVerification"
import { MechanismProxyPanel } from "./MechanismProxyPanel"

function Row({ label, value, lang, t, fallback = "Pending" }) {
  return (
    <div style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 3, paddingTop: 7 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45, overflowWrap: "anywhere" }}><ChemicalText value={dbRenderText(displayValue(value, fallback), lang)} /></span>
    </div>
  )
}

const METADATA_STATUS_ROWS = [
  ["doiStatus", "DOI status", "DOI 状态"],
  ["sourceUrlStatus", "source URL status", "来源链接状态"],
  ["licenseStatus", "license status", "license 状态"],
  ["citationStatus", "citation status", "引用状态"],
  ["descriptorProvenanceStatus", "descriptor provenance status", "描述符溯源状态"],
  ["retrievedAtStatus", "retrievedAt status", "抓取时间状态"],
]

function MetadataVerificationSection({ record, lang, t }) {
  const summary = buildMetadataVerificationSummary(record, lang)
  return (
    <section style={{ background: t.surface, border: `1px solid ${summary.eligible ? t.border : t.warn}`, borderRadius: 9, display: "grid", gap: 8, padding: 10 }}>
      <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 12.7 }}>{text(lang, "Metadata 核验", "Metadata Verification")}</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <StatusPill tone={metadataLevelTone(summary.level)} t={t}>{metadataLevelLabel(summary.level, lang)}</StatusPill>
          <StatusPill tone={summary.eligible ? "pass" : "warn"} t={t}>{summary.eligible ? dbText(lang, "eligibleForVerifiedRecommendation") : dbText(lang, "previewOnly")}</StatusPill>
        </div>
      </header>
      <div style={{ display: "grid", gap: 5 }}>
        {METADATA_STATUS_ROWS.map(([key, en, zh]) => (
          <div key={key} style={{ alignItems: "center", display: "flex", gap: 7, justifyContent: "space-between" }}>
            <span style={{ color: t.muted, fontSize: 11.6 }}>{text(lang, zh, en)}</span>
            <StatusPill tone={metadataStatusTone(summary.status[key])} t={t}>{metadataStatusValueLabel(summary.status[key], lang)}</StatusPill>
          </div>
        ))}
      </div>
      {summary.blockingReasons.length ? (
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{dbText(lang, "blockingReasons")}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {summary.blockingReasons.map(reason => <StatusPill key={reason} tone="warn" t={t}>{reason}</StatusPill>)}
          </div>
        </div>
      ) : null}
      {!summary.eligible ? (
        <span style={{ color: t.warn, fontSize: 11.8, fontWeight: 850, lineHeight: 1.42 }}>
          <ChemicalText value={dbText(lang, "cannotSupportFinalRecommendation")} />
        </span>
      ) : null}
    </section>
  )
}

function Checklist({ title, rows, lang, t }) {
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 7, padding: 10 }}>
      <strong style={{ color: t.textStrong, fontSize: 12.7 }}>{title}</strong>
      <div style={{ display: "grid", gap: 5 }}>
        {rows.map(row => (
          <div key={row.label} style={{ alignItems: "center", display: "flex", gap: 7, justifyContent: "space-between" }}>
            <span style={{ color: t.muted, fontSize: 11.7 }}>{row.label}</span>
            <StatusPill tone={row.available ? "pass" : "warn"} t={t}>{row.available ? text(lang, "可用", "available") : dbText(lang, "evidencePending")}</StatusPill>
          </div>
        ))}
      </div>
    </section>
  )
}

export function DatabaseDetailDrawer({ request, onClose, lang, t }) {
  const [state, setState] = useState({ status: "idle", detail: null, error: null })
  const detailRef = request?.detailRef

  useEffect(() => {
    let active = true
    if (!request) {
      setState({ status: "idle", detail: null, error: null })
      return undefined
    }
    if (!detailRef) {
      setState({ status: "no-detail", detail: null, error: null })
      return undefined
    }
    setState({ status: "loading", detail: null, error: null })
    fetchDetailRecord(detailRef).then(result => {
      if (!active) return
      setState({ status: result.error ? "error" : "loaded", detail: result.data, error: result.error })
    })
    return () => { active = false }
  }, [request, detailRef])

  const record = useMemo(() => state.detail || request || {}, [state.detail, request])
  if (!request) return null
  const descriptors = record.descriptors || {}
  const dataQualityGate = record.dataQualityGate || {}
  const waterStability = record.waterStability || {}
  const fieldSources = record.fieldSources || {}
  const descriptorChecklist = descriptorAvailabilityList(record).map(row => ({ label: row.label, available: row.available }))
  const provenanceChecklist = [
    ["sourceDatabase", record.sourceDatabase],
    ["sourceRecordId", record.sourceRecordId || record.frameworkId],
    ["sourceDoi", record.sourceDoi || record.doi],
    ["citation", record.citation],
    ["license", record.license],
    ["fieldSources", Object.keys(fieldSources).length ? fieldSources : null],
    ["evidenceIds", record.evidenceIds],
  ].map(([label, value]) => ({
    label,
    available: value !== null && value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0),
  }))
  const missingSourceFields = provenanceChecklist.filter(row => !row.available).map(row => row.label)

  return (
    <aside role="dialog" aria-label="Database detail drawer" style={{ background: t.panel, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 12, boxShadow: t.shadowMd, display: "grid", gap: 11, marginTop: 2, padding: 13 }}>
      <header style={{ alignItems: "start", display: "flex", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{dbText(lang, "detailOnDemand")}</span>
          <strong style={{ color: t.textStrong, fontSize: 16, lineHeight: 1.25 }}><ChemicalText value={safeText(record.displayName || record.frameworkId || record.id)} /></strong>
        </div>
        <button type="button" onClick={onClose} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 32, padding: "6px 9px" }}>
          {text(lang, "关闭", "Close")}
        </button>
      </header>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <StatusPill tone="proxy" t={t}>{dbStatusLabel(state.status, lang)}</StatusPill>
        <StatusPill tone="warn" t={t}>{dbText(lang, "notFinalRecommendation")}</StatusPill>
        {record.dataStatus?.level ? <StatusPill tone="proxy" t={t}>{dbStatusLabel(record.dataStatus.level, lang)}</StatusPill> : null}
      </div>
      <MetadataVerificationSection record={record} lang={lang} t={t} />
      <MechanismProxyPanel record={record} lang={lang} t={t} />
      <p style={{ color: t.faint, fontSize: 11.2, lineHeight: 1.4, margin: 0 }}>
        <ChemicalText value={text(lang, "描述符冗余说明：高相关描述符（如孔径与 PLD）在冗余门控中会被标记并惩罚，不会删除，也不改变 OACS/DMRS 公式。", "Descriptor redundancy note: highly correlated descriptors (e.g. pore size and PLD) are flagged and penalized by the redundancy gate, not deleted, and do not change OACS/DMRS formulas.")} />
      </p>
      {state.status === "loading" ? <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "正在按需加载详情...", "Loading detail on demand...")}</span> : null}
      {state.error ? <span style={{ color: t.warn, fontSize: 12, fontWeight: 850 }}>{displayValue(state.error.message)}</span> : null}
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Row label="sourceDatabase" value={record.sourceDatabase} lang={lang} t={t} />
        <Row label="sourceRecordId" value={record.sourceRecordId || record.frameworkId} lang={lang} t={t} />
        <Row label="sourceDoi" value={record.sourceDoi} fallback={dbFallback(lang)} lang={lang} t={t} />
        <Row label="citation" value={record.citation} fallback={dbFallback(lang)} lang={lang} t={t} />
        <Row label="license" value={record.license} fallback={dbFallback(lang)} lang={lang} t={t} />
        <Row label="retrievedAt" value={record.retrievedAt} fallback={text(lang, "不可用", "Not available")} lang={lang} t={t} />
        <Row label="dataQualityGate" value={dataQualityGate.status || record.dataQualityStatus} lang={lang} t={t} />
        <Row label="dataStatus" value={record.dataStatus?.label || record.dataStatus?.level || record.dataQualityStatus} lang={lang} t={t} />
      </div>
      <section style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        {Object.entries(descriptors).map(([key, value]) => <Row key={key} label={key} value={value} fallback={text(lang, "不可用", "Not available")} lang={lang} t={t} />)}
        {Object.entries(waterStability).map(([key, value]) => <Row key={key} label={`waterStability.${key}`} value={value} fallback={dbFallback(lang)} lang={lang} t={t} />)}
      </section>
      <section style={{ display: "grid", gap: 7 }}>
        <Row label="fieldSources" value={Object.keys(fieldSources).length ? Object.keys(fieldSources).join(" / ") : null} fallback={dbFallback(lang)} lang={lang} t={t} />
        <Row label="evidenceIds" value={record.evidenceIds} fallback={dbFallback(lang)} lang={lang} t={t} />
        <Row label="detailRef" value={detailRef} fallback={text(lang, "不可用", "Not available")} lang={lang} t={t} />
      </section>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Checklist title={text(lang, "描述符完整度清单", "Descriptor Completeness Checklist")} rows={descriptorChecklist} lang={lang} t={t} />
        <Checklist title={text(lang, "来源清单", "Provenance Checklist")} rows={provenanceChecklist} lang={lang} t={t} />
      </div>
      <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 10 }}>
        <strong style={{ color: t.textStrong, fontSize: 12.7 }}>{text(lang, "来源边界说明", "Source Boundary Block")}</strong>
        <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.48, margin: 0 }}>
          <ChemicalText value={text(
            lang,
            "该详情来自 database_index_preview 的按需记录。缺失 DOI、citation 或 license 时显示证据待核验，不伪造来源；本块不是经完整验证的全量数据库筛选结论。",
            "This detail comes from an on-demand database_index_preview record. Missing DOI, citation, or license remains evidence pending; no source is fabricated. This block is not a full verified database screening result."
          )} />
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          <StatusPill tone="proxy" t={t}>{`descriptor ${formatPercentValue(descriptorCompletenessPercent(record))}`}</StatusPill>
          <StatusPill tone="proxy" t={t}>{`provenance ${formatPercentValue(provenanceCompletenessPercent(record))}`}</StatusPill>
          <StatusPill tone="warn" t={t}>{dbText(lang, "notFinalRecommendation")}</StatusPill>
        </div>
      </section>
      {missingSourceFields.length ? (
        <section style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, color: t.warn, display: "grid", fontSize: 12, fontWeight: 850, gap: 5, lineHeight: 1.45, padding: 10 }}>
          <strong>{text(lang, "缺失证据提醒", "Missing Evidence Warning")}</strong>
          <span><ChemicalText value={`${missingSourceFields.join(", ")}: ${dbText(lang, "evidencePending")}`} /></span>
        </section>
      ) : null}
      <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 6, padding: 10 }}>
        <strong style={{ color: t.textStrong, fontSize: 12.7 }}>{text(lang, "有机酸相关性快照", "Organic Acid Relevance Snapshot")}</strong>
        <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
          <ChemicalText value={organicAcidRelevanceSnapshot(record, lang)} />
        </span>
      </section>
    </aside>
  )
}
