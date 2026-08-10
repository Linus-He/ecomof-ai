// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusBadge, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { fetchJson } from "../../services/dataService"
import { formatCount } from "../../utils/databaseIndex/databaseIndexFormatters"
import {
  buildCurationProgressSummary,
  curationFieldStatusLabel,
  curationStatusLabel,
  curationStatusTone,
  normalizeMetadataCuration,
} from "../../utils/databaseIndex/metadataCuration"

const CURATION_FILE = "data/database_precompute/v2_0_i/manual_metadata_curation.json"

export function ManualMetadataCurationPanel({ curationRecords = null, lang, t, isMobile }) {
  const [records, setRecords] = useState(curationRecords || null)
  const [status, setStatus] = useState(curationRecords ? "loaded" : "idle")

  useEffect(() => {
    if (curationRecords) {
      setRecords(curationRecords)
      setStatus("loaded")
      return undefined
    }
    let active = true
    setStatus("loading")
    fetchJson(CURATION_FILE, null)
      .then(payload => {
        if (!active) return
        setRecords(Array.isArray(payload?.curation) ? payload.curation : [])
        setStatus("loaded")
      })
      .catch(() => {
        if (!active) return
        setRecords([])
        setStatus("error")
      })
    return () => { active = false }
  }, [curationRecords])

  const normalized = useMemo(() => (records || []).map(normalizeMetadataCuration), [records])
  const summary = useMemo(() => buildCurationProgressSummary(records || []), [records])

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 12 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "人工 metadata 整理", "Manual Metadata Curation")}</strong>
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            <ChemicalText value={text(
              lang,
              "追踪来源链接补全进度：source_confirmed / citation_ready 不等于 verified_metadata；找不到 DOI/license/来源时保持待补，不伪造任何字段。",
              "Tracks source-link enrichment progress: source_confirmed / citation_ready are not verified_metadata; when DOI/license/source cannot be found they stay pending and nothing is fabricated."
            )} />
          </span>
        </div>
        <StatusBadge tone="warn" t={t}>{text(lang, "整理进度", "curation progress")}</StatusBadge>
      </header>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(140px, 1fr))" }}>
        {[
          [text(lang, "队列数量", "Queue size"), summary.queueSize],
          [text(lang, "待来源核验", "Needs source review"), summary.statusCounts.needs_source_review],
          [text(lang, "来源已确认", "Source confirmed"), summary.statusCounts.source_confirmed],
          [text(lang, "引用可用", "Citation ready"), summary.statusCounts.citation_ready],
          [text(lang, "license 已确认", "License confirmed"), summary.statusCounts.license_confirmed],
          [text(lang, "metadata 已核验", "Verified metadata"), summary.statusCounts.verified_metadata],
          [text(lang, "整理受阻", "Curation blocked"), summary.statusCounts.curation_blocked],
        ].map(([label, value]) => (
          <article key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 4, padding: 9 }}>
            <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
            <strong style={{ color: t.textStrong, fontSize: 16 }}>{formatCount(value)}</strong>
          </article>
        ))}
      </div>

      {status === "loading" ? (
        <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "加载中…", "Loading…")}</span>
      ) : normalized.length ? (
        isMobile ? (
          <div style={{ display: "grid", gap: 7 }}>
            {normalized.slice(0, 8).map(row => (
              <article key={row.recordId} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 9 }}>
                <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "space-between" }}>
                  <strong style={{ color: t.textStrong, fontSize: 12 }}><ChemicalText value={row.displayName} /></strong>
                  <StatusBadge tone={curationStatusTone(row.curationStatus)} t={t}>{curationStatusLabel(row.curationStatus, lang)}</StatusBadge>
                </div>
                <span style={{ color: t.muted, fontSize: 11, lineHeight: 1.4 }}>
                  DOI: {curationFieldStatusLabel(row.doiStatus, lang)} · {text(lang, "来源", "source")}: {curationFieldStatusLabel(row.sourceUrlStatus, lang)} · license: {curationFieldStatusLabel(row.licenseStatus, lang)}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", minWidth: 640, width: "100%" }}>
              <thead>
                <tr>
                  {[text(lang, "候选", "Candidate"), text(lang, "整理状态", "Curation status"), text(lang, "来源", "Source"), text(lang, "引用", "Citation"), "License", "DOI", text(lang, "下一步", "Next action")].map(label => (
                    <th key={label} style={{ borderBottom: `1px solid ${t.divider}`, color: t.faint, fontSize: 10.3, padding: "6px 6px", textAlign: "left", textTransform: "uppercase" }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {normalized.slice(0, 18).map(row => (
                  <tr key={row.recordId}>
                    <td style={{ borderTop: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 11.2, padding: "6px 6px" }}><ChemicalText value={row.displayName} /></td>
                    <td style={{ borderTop: `1px solid ${t.divider}`, padding: "6px 6px" }}><StatusBadge tone={curationStatusTone(row.curationStatus)} t={t}>{curationStatusLabel(row.curationStatus, lang)}</StatusBadge></td>
                    <td style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, fontSize: 11, padding: "6px 6px" }}>{curationFieldStatusLabel(row.sourceUrlStatus, lang)}</td>
                    <td style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, fontSize: 11, padding: "6px 6px" }}>{curationFieldStatusLabel(row.citationStatus, lang)}</td>
                    <td style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, fontSize: 11, padding: "6px 6px" }}>{curationFieldStatusLabel(row.licenseStatus, lang)}</td>
                    <td style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, fontSize: 11, padding: "6px 6px" }}>{curationFieldStatusLabel(row.doiStatus, lang)}</td>
                    <td style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, fontSize: 10.6, padding: "6px 6px" }}>{row.nextActions?.[1] || row.nextActions?.[0] || text(lang, "待补", "pending")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "暂无人工整理记录。", "No manual curation records yet.")}</span>
      )}

      <p style={{ color: t.muted, fontSize: 11.5, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "该面板用于追踪人工 metadata 整理进度，不代表候选已通过完整验证，也不构成最终推荐。",
          "This panel tracks manual metadata curation progress only. It does not indicate full verification or final recommendation."
        )} />
      </p>
    </section>
  )
}

export default ManualMetadataCurationPanel
