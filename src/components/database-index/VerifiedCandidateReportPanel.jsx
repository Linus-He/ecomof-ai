// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { fetchJson } from "../../services/dataService"

// Prefer the V2.0-L enriched report (with manual source curation); fall back to V2.0-K.
const ENRICHED_REPORT_FILE = "data/database_precompute/v2_0_l/verified_candidate_report_enriched.json"
const REPORT_FILE = "data/database_precompute/v2_0_k/verified_candidate_report.json"

const REPORT_STATUS_COPY = {
  no_verified_candidates_yet: { en: "No verified candidates yet", zh: "暂无经核验候选" },
  partial_evidence_ready: { en: "Partial evidence ready", zh: "部分证据已就绪" },
  source_confirmed_candidates_available: { en: "Source-confirmed candidates available", zh: "已有来源确认候选" },
  verified_candidates_available: { en: "Verified candidates available", zh: "已有经核验候选" },
  verified_metadata_candidates_available: { en: "Verified metadata candidates available", zh: "已有第一批 verified metadata 候选" },
}

export function VerifiedCandidateReportPanel({ report: reportProp = null, lang, t, isMobile }) {
  const [report, setReport] = useState(reportProp || null)

  useEffect(() => {
    if (reportProp) { setReport(reportProp); return undefined }
    let active = true
    fetchJson(ENRICHED_REPORT_FILE, null)
      .then(payload => payload || fetchJson(REPORT_FILE, null))
      .then(payload => { if (active && payload) setReport(payload) })
      .catch(() => {})
    return () => { active = false }
  }, [reportProp])

  const reportStatus = report?.reportStatus || "no_verified_candidates_yet"
  const verified = report?.verifiedCandidates || []
  const nearVerified = report?.nearVerifiedCandidates || []
  const statusCopy = REPORT_STATUS_COPY[reportStatus] || REPORT_STATUS_COPY.no_verified_candidates_yet

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 12 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "经核验候选报告", "Verified Candidate Report")}</strong>
        <StatusPill tone={reportStatus === "verified_candidates_available" ? "pass" : "warn"} t={t}>{text(lang, statusCopy.zh, statusCopy.en)}</StatusPill>
      </header>

      {verified.length ? (
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {verified.map(candidate => (
            <article key={candidate.recordId} style={{ background: t.badgeGoodBg || t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 10 }}>
              <strong style={{ color: t.textStrong, fontSize: 12.4 }}><ChemicalText value={candidate.displayName} /></strong>
              <span style={{ color: t.muted, fontSize: 11, lineHeight: 1.4 }}>{candidate.verificationNotes}</span>
              <StatusPill tone="pass" t={t}>{text(lang, "metadata 已核验", "verified metadata")}</StatusPill>
            </article>
          ))}
        </div>
      ) : reportStatus === "source_confirmed_candidates_available" ? (
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, color: t.textStrong, display: "grid", gap: 4, fontSize: 12, lineHeight: 1.5, padding: 10 }}>
          <strong style={{ color: t.warn }}>{text(lang, "已有来源确认候选，但仍无经核验候选", "Source-confirmed candidates available, but none verified yet")}</strong>
          <span style={{ color: t.muted }}>
            {text(lang, "已有来源确认候选，但仍未达到 verified metadata。请继续补充 license / provenance / ambiguity resolution。", "Some candidates have confirmed sources, but none have reached verified metadata yet. Continue license / provenance / ambiguity resolution.")}
          </span>
        </div>
      ) : (
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, color: t.textStrong, display: "grid", gap: 4, fontSize: 12, lineHeight: 1.5, padding: 10 }}>
          <strong style={{ color: t.warn }}>{text(lang, "暂无经核验候选", "No verified candidates yet")}</strong>
          <span style={{ color: t.muted }}>
            {text(lang, "当前候选仍缺来源、引文、许可、DOI 或描述符溯源；证据回填完成前不进入已核查候选集。", "Candidates still require source / citation / license / DOI or descriptor provenance backfill. Complete evidence backfill first.")}
          </span>
        </div>
      )}

      <div style={{ display: "grid", gap: 5 }}>
        <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "最接近经核验的候选", "Near verified candidates")}</span>
        {nearVerified.length ? nearVerified.slice(0, isMobile ? 4 : 8).map(candidate => (
          <article key={candidate.recordId} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 3, padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 11.8 }}><ChemicalText value={candidate.displayName} /></strong>
            <span style={{ color: t.muted, fontSize: 10.8, lineHeight: 1.4 }}>
              {text(lang, "剩余 blocker", "Remaining blockers")}: {(candidate.remainingBlockers || []).join("、") || text(lang, "无", "none")}
            </span>
            <span style={{ color: t.faint, fontSize: 10.6, lineHeight: 1.4 }}>
              {text(lang, "下一步", "Next action")}: {candidate.nextActions?.[0] || text(lang, "待补", "pending")}
            </span>
          </article>
        )) : <span style={{ color: t.muted, fontSize: 11.5 }}>{text(lang, "暂无数据。", "No data yet.")}</span>}
      </div>

      <p style={{ color: t.muted, fontSize: 11.5, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "这只是候选核验报告，不是最终推荐，也不是全量数据库筛选。",
          "This is a candidate verification report only — not a final recommendation and not full database screening."
        )} />
      </p>
    </section>
  )
}

export default VerifiedCandidateReportPanel
