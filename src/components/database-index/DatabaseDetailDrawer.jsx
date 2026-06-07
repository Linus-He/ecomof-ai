// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, displayValue, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { fetchDetailRecord } from "../../utils/databaseIndex/databaseIndexClient"
import { safeText } from "../../utils/databaseIndex/databaseIndexFormatters"

function Row({ label, value, t, fallback = "Pending" }) {
  return (
    <div style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 3, paddingTop: 7 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45, overflowWrap: "anywhere" }}><ChemicalText value={displayValue(value, fallback)} /></span>
    </div>
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

  return (
    <aside role="dialog" aria-label="Database detail drawer" style={{ background: t.panel, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 12, boxShadow: t.shadowMd, display: "grid", gap: 11, marginTop: 2, padding: 13 }}>
      <header style={{ alignItems: "start", display: "flex", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Detail on demand</span>
          <strong style={{ color: t.textStrong, fontSize: 16, lineHeight: 1.25 }}><ChemicalText value={safeText(record.displayName || record.frameworkId || record.id)} /></strong>
        </div>
        <button type="button" onClick={onClose} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 32, padding: "6px 9px" }}>
          {text(lang, "关闭", "Close")}
        </button>
      </header>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <StatusPill tone="proxy" t={t}>{state.status}</StatusPill>
        <StatusPill tone="warn" t={t}>not final recommendation</StatusPill>
        {record.dataStatus?.level ? <StatusPill tone="proxy" t={t}>{record.dataStatus.level}</StatusPill> : null}
      </div>
      {state.status === "loading" ? <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "正在按需加载详情...", "Loading detail on demand...")}</span> : null}
      {state.error ? <span style={{ color: t.warn, fontSize: 12, fontWeight: 850 }}>{displayValue(state.error.message)}</span> : null}
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Row label="sourceDatabase" value={record.sourceDatabase} t={t} />
        <Row label="sourceRecordId" value={record.sourceRecordId || record.frameworkId} t={t} />
        <Row label="sourceDoi" value={record.sourceDoi} fallback="Evidence pending" t={t} />
        <Row label="citation" value={record.citation} fallback="Evidence pending" t={t} />
        <Row label="license" value={record.license} fallback="Evidence pending" t={t} />
        <Row label="retrievedAt" value={record.retrievedAt} fallback="Not available" t={t} />
        <Row label="dataQualityGate" value={dataQualityGate.status || record.dataQualityStatus} t={t} />
        <Row label="dataStatus" value={record.dataStatus?.label || record.dataStatus?.level || record.dataQualityStatus} t={t} />
      </div>
      <section style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        {Object.entries(descriptors).map(([key, value]) => <Row key={key} label={key} value={value} fallback="Not available" t={t} />)}
        {Object.entries(waterStability).map(([key, value]) => <Row key={key} label={`waterStability.${key}`} value={value} fallback="Evidence pending" t={t} />)}
      </section>
      <section style={{ display: "grid", gap: 7 }}>
        <Row label="fieldSources" value={Object.keys(fieldSources).length ? Object.keys(fieldSources).join(" / ") : null} fallback="Evidence pending" t={t} />
        <Row label="evidenceIds" value={record.evidenceIds} fallback="Evidence pending" t={t} />
        <Row label="detailRef" value={detailRef} fallback="Not available" t={t} />
      </section>
    </aside>
  )
}
