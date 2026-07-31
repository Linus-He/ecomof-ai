// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { fetchJson } from "../../services/dataService"
import { formatCount } from "../../utils/databaseIndex/databaseIndexFormatters"
import {
  buildEvidenceBackfillSummary,
  evidenceStatusLabel,
  evidenceStatusTone,
  normalizeEvidenceBackfillRecord,
} from "../../utils/databaseIndex/evidenceBackfill"

// Prefer the V2.0-L enriched records (with manual source curation); fall back to V2.0-K.
const ENRICHED_FILE = "data/database_precompute/v2_0_l/evidence_backfill_records_enriched.json"
const RECORDS_FILE = "data/database_precompute/v2_0_k/evidence_backfill_records.json"

export function EvidenceBackfillPanel({ records: recordsProp = null, lang, t, isMobile }) {
  const [records, setRecords] = useState(recordsProp || null)
  const [status, setStatus] = useState(recordsProp ? "loaded" : "idle")

  useEffect(() => {
    if (recordsProp) { setRecords(recordsProp); setStatus("loaded"); return undefined }
    let active = true
    setStatus("loading")
    fetchJson(ENRICHED_FILE, null)
      .then(payload => (Array.isArray(payload?.records) && payload.records.length) ? payload : fetchJson(RECORDS_FILE, null))
      .then(payload => { if (active) { setRecords(Array.isArray(payload?.records) ? payload.records : []); setStatus("loaded") } })
      .catch(() => { if (active) { setRecords([]); setStatus("error") } })
    return () => { active = false }
  }, [recordsProp])

  const normalized = useMemo(() => (records || []).map(normalizeEvidenceBackfillRecord), [records])
  const summary = useMemo(() => buildEvidenceBackfillSummary(records || []), [records])
  const ambiguityCount = useMemo(() => (records || []).filter(row => (row.ambiguityWarnings || []).length).length, [records])
  const sourceConfirmed = summary.sourceStatusCounts.confirmed

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 12 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "证据回填", "Evidence Backfill")}</strong>
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            <ChemicalText value={text(
              lang,
              "记录来源、引文、许可、DOI 和描述符溯源的人工回填进度。来源已确认、引文已就绪或许可已确认均不等于元数据已核查；待补状态用于明确当前证据边界。",
              "Tracks manual backfill of source / citation / license / DOI / descriptor provenance. source confirmed / citation ready / license confirmed are not verified metadata; pending is an honest boundary, not a failure."
            )} />
          </span>
        </div>
        <StatusPill tone="warn" t={t}>{text(lang, "回填进度", "backfill progress")}</StatusPill>
      </header>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(140px, 1fr))" }}>
        {[
          [text(lang, "回填记录", "Backfill records"), summary.recordCount],
          [text(lang, "来源已确认", "Source confirmed"), summary.sourceStatusCounts.confirmed],
          [text(lang, "引用可用", "Citation ready"), summary.citationStatusCounts.ready],
          [text(lang, "license 已确认", "License confirmed"), summary.licenseStatusCounts.confirmed],
          [text(lang, "metadata 已核验", "Verified metadata"), summary.verifiedMetadataCount],
        ].map(([label, value]) => (
          <article key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 4, padding: 9 }}>
            <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
            <strong style={{ color: t.textStrong, fontSize: 16 }}>{formatCount(value)}</strong>
          </article>
        ))}
      </div>

      {summary.verifiedMetadataCount === 0 && sourceConfirmed > 0 ? (
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, color: t.warn, fontSize: 11.8, fontWeight: 800, lineHeight: 1.45, padding: 9 }}>
          {text(lang, "已有来源确认候选，但仍未达到 verified metadata。请继续补充 license / provenance / ambiguity resolution。", "Some candidates have confirmed sources, but none have reached verified metadata yet. Continue license / provenance / ambiguity resolution.")}
        </div>
      ) : summary.verifiedMetadataCount === 0 ? (
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, color: t.warn, fontSize: 11.8, fontWeight: 800, lineHeight: 1.45, padding: 9 }}>
          {text(lang, "暂无经核验候选：所有候选仍需补充 source / citation / license / DOI 或 descriptor provenance。", "No verified candidates yet: all candidates still need source / citation / license / DOI or descriptor provenance backfill.")}
        </div>
      ) : null}

      {ambiguityCount > 0 ? (
        <span style={{ color: t.warn, fontSize: 11.4, fontWeight: 800 }}>{text(lang, `存在 ${ambiguityCount} 条 ambiguity warning（来源记录需进一步消歧）。`, `${ambiguityCount} ambiguity warning(s) present (source record needs disambiguation).`)}</span>
      ) : null}

      {status === "loading" ? (
        <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "加载中…", "Loading…")}</span>
      ) : normalized.length ? (
        isMobile ? (
          <div style={{ display: "grid", gap: 7 }}>
            {normalized.slice(0, 8).map(row => (
              <article key={row.recordId} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 9 }}>
                <strong style={{ color: t.textStrong, fontSize: 12 }}><ChemicalText value={row.displayName} /></strong>
                <span style={{ color: t.muted, fontSize: 11, lineHeight: 1.4 }}>
                  {text(lang, "来源", "source")}: {evidenceStatusLabel(row.sourceStatus, lang)} · {text(lang, "引用", "citation")}: {evidenceStatusLabel(row.citationStatus, lang)} · license: {evidenceStatusLabel(row.licenseStatus, lang)} · DOI: {evidenceStatusLabel(row.doiStatus, lang)}
                </span>
                <span style={{ color: t.faint, fontSize: 10.6 }}>{text(lang, "可核验", "verified eligible")}: {row.verifiedMetadataEligible ? text(lang, "是", "yes") : text(lang, "否", "no")}</span>
              </article>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", minWidth: 720, width: "100%" }}>
              <thead>
                <tr>
                  {[text(lang, "候选", "Candidate"), text(lang, "来源", "Source"), text(lang, "引用", "Citation"), "License", "DOI", text(lang, "溯源", "Provenance"), text(lang, "机制证据", "Mechanism"), text(lang, "可核验", "Verified eligible"), text(lang, "下一步", "Next action")].map(label => (
                    <th key={label} style={{ borderBottom: `1px solid ${t.divider}`, color: t.faint, fontSize: 10.2, padding: "6px 6px", textAlign: "left", textTransform: "uppercase" }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {normalized.slice(0, 18).map(row => (
                  <tr key={row.recordId}>
                    <td style={{ borderTop: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 11, padding: "6px 6px" }}><ChemicalText value={row.displayName} /></td>
                    <td style={{ borderTop: `1px solid ${t.divider}`, padding: "6px 6px" }}><StatusPill tone={evidenceStatusTone(row.sourceStatus)} t={t}>{evidenceStatusLabel(row.sourceStatus, lang)}</StatusPill></td>
                    <td style={{ borderTop: `1px solid ${t.divider}`, padding: "6px 6px" }}><StatusPill tone={evidenceStatusTone(row.citationStatus)} t={t}>{evidenceStatusLabel(row.citationStatus, lang)}</StatusPill></td>
                    <td style={{ borderTop: `1px solid ${t.divider}`, padding: "6px 6px" }}><StatusPill tone={evidenceStatusTone(row.licenseStatus)} t={t}>{evidenceStatusLabel(row.licenseStatus, lang)}</StatusPill></td>
                    <td style={{ borderTop: `1px solid ${t.divider}`, padding: "6px 6px" }}><StatusPill tone={evidenceStatusTone(row.doiStatus)} t={t}>{evidenceStatusLabel(row.doiStatus, lang)}</StatusPill></td>
                    <td style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, fontSize: 10.8, padding: "6px 6px" }}>{evidenceStatusLabel(row.descriptorProvenanceStatus, lang)}</td>
                    <td style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, fontSize: 10.8, padding: "6px 6px" }}>{evidenceStatusLabel(row.mechanismEvidenceStatus, lang)}</td>
                    <td style={{ borderTop: `1px solid ${t.divider}`, color: row.verifiedMetadataEligible ? t.textStrong : t.muted, fontSize: 10.8, padding: "6px 6px" }}>{row.verifiedMetadataEligible ? text(lang, "是", "yes") : text(lang, "否", "no")}</td>
                    <td style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, fontSize: 10.4, padding: "6px 6px" }}>{row.nextActions?.[0] || text(lang, "待补", "pending")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "暂无证据回填记录。", "No evidence backfill records yet.")}</span>
      )}

      <p style={{ color: t.muted, fontSize: 11.5, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "该面板用于追踪证据回填进度，不代表候选已通过完整验证，也不构成最终推荐。",
          "This panel tracks evidence backfill progress only. It does not indicate full verification or final recommendation."
        )} />
      </p>
    </section>
  )
}

export default EvidenceBackfillPanel
