// @ts-nocheck
import { useMemo } from "react"
import {
  buildAuditExportBundle,
  buildDataQualityAudit,
  buildDatabaseHealthSummary,
} from "../../utils/dataQualityAudit"
import { downloadTextFile } from "../../utils/report"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const pct = value => `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`

const DEFAULT_THEME = {
  panel: "#ffffff",
  surface: "#f8fafc",
  border: "#dbe4ef",
  textStrong: "#0f172a",
  muted: "#475569",
  faint: "#64748b",
  accentText: "#2563eb",
  warn: "#b45309",
  danger: "#b91c1c",
  good: "#047857",
  badgeWarnBg: "#fff7ed",
  badgeInfoBg: "#eff6ff",
}

function theme(t) {
  return { ...DEFAULT_THEME, ...(t || {}) }
}

function Card({ id, title, subtitle, children, t }) {
  return (
    <section className="data-quality-openai-section" id={id} data-testid={id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, minWidth: 0, padding: 12, scrollMarginTop: 118 }}>
      <div style={{ display: "grid", gap: 3 }}>
        <h3 style={{ color: t.textStrong, fontSize: 14.5, lineHeight: 1.2, margin: 0 }}>{title}</h3>
        {subtitle ? <p style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45, margin: 0 }}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

function Metric({ label, value, note, t, tone = "info" }) {
  const color = tone === "warn" ? t.warn : tone === "danger" ? t.danger : tone === "pass" ? t.good : t.textStrong
  return (
    <div className="data-quality-metric" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, minWidth: 0, padding: 9 }}>
      <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color, fontSize: 18, fontWeight: 920, lineHeight: 1.12, marginTop: 5, overflowWrap: "anywhere" }}>{value}</div>
      {note ? <div style={{ color: t.muted, fontSize: 10.5, lineHeight: 1.35, marginTop: 4 }}>{note}</div> : null}
    </div>
  )
}

function ExportButton({ children, onClick, t }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 7,
        color: t.textStrong,
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 850,
        minHeight: 32,
        padding: "7px 9px",
      }}
    >
      {children}
    </button>
  )
}

export function DatabaseHealthScoreCard({ audit, lang = "en", t: rawTheme, isMobile = false }) {
  const t = theme(rawTheme)
  const health = useMemo(() => buildDatabaseHealthSummary(audit), [audit])
  return (
    <Card
      id="database-health-score-card"
      title={text(lang, "数据库健康评分", "Database Health Score")}
      subtitle={text(lang, "综合描述符覆盖、来源完整度、来源确认、已核验元数据与高风险记录。", "Combines descriptor coverage, provenance completeness, source confirmation, verified metadata, and high-risk records.")}
      t={t}
    >
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <Metric label={text(lang, "健康评分", "Health score")} value={pct(health.healthScore)} note={health.healthStatus} t={t} tone={health.healthScore >= 0.75 ? "pass" : "warn"} />
        <Metric label={text(lang, "特征覆盖率", "Feature coverage")} value={pct(health.descriptorCoverage)} t={t} />
        <Metric label={text(lang, "数据就绪度", "Data readiness")} value={pct(health.provenanceCoverage)} t={t} />
        <Metric label={text(lang, "验证就绪度", "Validation readiness")} value={health.verifiedMetadataCount} note={text(lang, "已核验元数据数量", "verified metadata count")} t={t} tone={health.verifiedMetadataCount > 0 ? "pass" : "warn"} />
      </div>
    </Card>
  )
}

export function FieldCoverageMatrix({ audit, lang = "en", t: rawTheme }) {
  const t = theme(rawTheme)
  const rows = audit?.fieldCoverage || []
  return (
    <Card
      id="field-coverage-matrix"
      title={text(lang, "字段覆盖矩阵", "Field Coverage Matrix")}
      subtitle={text(lang, "字段状态覆盖：已确认、待补、歧义、缺失、派生、已归一化与合成。", "Field-level status coverage across confirmed, pending, ambiguous, missing, derived, normalized, and synthetic.")}
      t={t}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 760, width: "100%" }}>
          <thead>
            <tr>
              {(lang === "zh"
                ? ["字段", "覆盖率", "来源覆盖", "已确认", "待补", "歧义", "缺失", "派生", "已归一化", "合成"]
                : ["Field", "Coverage", "Provenance", "Confirmed", "Pending", "Ambiguous", "Missing", "Derived", "Normalized", "Synthetic"]
              ).map(label => (
                <th key={label} style={{ borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 10, padding: "6px 5px", textAlign: label === "Field" ? "left" : "right", textTransform: "uppercase" }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.field}>
                <td style={{ borderBottom: `1px solid ${t.border}`, color: t.textStrong, fontSize: 11.5, fontWeight: 850, padding: "6px 5px" }}>{row.field}</td>
                <td style={{ borderBottom: `1px solid ${t.border}`, color: t.textStrong, fontSize: 11.5, padding: "6px 5px", textAlign: "right" }}>{pct(row.coverageRatio)}</td>
                <td style={{ borderBottom: `1px solid ${t.border}`, color: t.textStrong, fontSize: 11.5, padding: "6px 5px", textAlign: "right" }}>{pct(row.provenanceRatio)}</td>
                {["confirmed", "pending", "ambiguous", "missing", "derived", "normalized", "synthetic"].map(key => (
                  <td key={key} style={{ borderBottom: `1px solid ${t.border}`, color: ["pending", "ambiguous", "missing", "synthetic"].includes(key) ? t.warn : t.muted, fontSize: 11.5, padding: "6px 5px", textAlign: "right" }}>{row[key] || 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function ProvenanceCompletenessPanel({ audit, lang = "en", t: rawTheme, isMobile = false }) {
  const t = theme(rawTheme)
  const summary = audit?.summary || {}
  return (
    <Card
      id="provenance-completeness-panel"
      title={text(lang, "来源完整度", "Provenance Completeness")}
      subtitle={text(lang, "字段来源覆盖数据库、记录 ID、来源链接、引用、license、获取时间与整理状态。", "Field-level provenance coverage for sourceDatabase, sourceRecordId, sourceUrl, citation, license, retrievedAt, and curationStatus.")}
      t={t}
    >
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <Metric label={text(lang, "来源覆盖率", "Provenance coverage")} value={pct(summary.provenanceCoverage)} t={t} />
        <Metric label={text(lang, "来源已确认", "Source confirmed")} value={summary.sourceConfirmedCount || 0} t={t} />
        <Metric label={text(lang, "引文就绪", "Citation ready")} value={summary.citationReadyCount || 0} t={t} />
        <Metric label={text(lang, "License 已确认", "License confirmed")} value={summary.licenseConfirmedCount || 0} t={t} />
        <Metric label={text(lang, "DOI 已确认", "DOI confirmed")} value={summary.doiConfirmedCount || 0} t={t} />
        <Metric label={text(lang, "来源链接已确认", "Source URL confirmed")} value={summary.sourceUrlConfirmedCount || 0} t={t} />
        <Metric label={text(lang, "已核验元数据", "Verified metadata")} value={summary.verifiedMetadataCount || 0} t={t} tone={(summary.verifiedMetadataCount || 0) > 0 ? "pass" : "warn"} />
        <Metric label={text(lang, "合成样例", "Synthetic fixture")} value={summary.syntheticFixtureCount || 0} t={t} tone={(summary.syntheticFixtureCount || 0) > 0 ? "warn" : "info"} />
      </div>
    </Card>
  )
}

export function AmbiguityRiskPanel({ audit, lang = "en", t: rawTheme, isMobile = false }) {
  const t = theme(rawTheme)
  const summary = audit?.summary || {}
  const topRisks = (audit?.highRiskRecords || []).slice(0, 5)
  return (
    <Card
      id="ambiguity-risk-panel"
      title={text(lang, "歧义与缺失风险", "Ambiguity Risk")}
      subtitle={text(lang, "歧义、缺失和待补字段会降低就绪度；字段级歧义会阻断 verified_metadata。", "Ambiguous, missing, and pending fields reduce readiness; field-level ambiguity blocks verified_metadata.")}
      t={t}
    >
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <Metric label={text(lang, "歧义警告", "Ambiguity warnings")} value={summary.ambiguityWarningCount || 0} t={t} tone={(summary.ambiguityWarningCount || 0) > 0 ? "warn" : "info"} />
        <Metric label={text(lang, "缺失字段", "Missing fields")} value={summary.missingFieldCount || 0} t={t} tone={(summary.missingFieldCount || 0) > 0 ? "warn" : "info"} />
        <Metric label={text(lang, "高风险记录", "High-risk records")} value={summary.highRiskRecordCount || 0} t={t} tone={(summary.highRiskRecordCount || 0) > 0 ? "warn" : "pass"} />
        <Metric label={text(lang, "记录质量", "Record quality")} value={pct(summary.recordQualityScore)} t={t} />
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {topRisks.map((row, index) => (
          <div key={`${row.candidateId || row.id || row.displayName || "risk"}-${index}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.muted, display: "grid", gap: 3, padding: 8 }}>
            <strong style={{ color: t.textStrong, fontSize: 11.5 }}>{row.displayName || row.candidateId}</strong>
            <span style={{ fontSize: 10.8, lineHeight: 1.4 }}>{(row.blockers || []).slice(0, 4).join("; ") || "pending"}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function VerifiedBlockerSummary({ audit, lang = "en", t: rawTheme }) {
  const t = theme(rawTheme)
  const rows = Object.entries(audit?.blockerCounts || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
  return (
    <Card
      id="verified-blocker-summary"
      title={text(lang, "核验阻断项", "Verified Blocker Summary")}
      subtitle={text(lang, "source_confirmed、citation_ready 与 near_verified 都不会自动等于 verified_metadata。", "source_confirmed, citation_ready, and near_verified do not automatically equal verified_metadata.")}
      t={t}
    >
      <div style={{ display: "grid", gap: 6 }}>
        {rows.map(([reason, count]) => (
          <div key={reason} style={{ alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, display: "grid", gap: 8, gridTemplateColumns: "minmax(0, 1fr) auto", padding: 8 }}>
            <span style={{ color: t.textStrong, fontSize: 11.5, fontWeight: 800, minWidth: 0, overflowWrap: "anywhere" }}>{reason}</span>
            <strong style={{ color: t.warn, fontSize: 12 }}>{count}</strong>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function DataQualityAuditPanel({ records = [], audit: auditProp, lang = "en", t: rawTheme, isMobile = false, compact = false }) {
  const t = theme(rawTheme)
  const audit = useMemo(() => auditProp || buildDataQualityAudit(records, { version: "V2.2-Scalable-Database-Preview" }), [auditProp, records])
  const summary = audit.summary || {}

  const exportBundle = kind => {
    const bundle = buildAuditExportBundle({ records, audit, kind, databaseVersion: audit.databaseVersion || summary.databaseVersion })
    if (kind === "candidate-data-gap") {
      bundle.candidateDataGaps = (audit.records || records).slice(0, 100).map(row => ({
        candidateId: row.candidateId,
        displayName: row.displayName,
        dataGaps: row.dataGaps,
        missingFields: row.missingFields,
        pendingFields: row.pendingFields,
        ambiguousFields: row.ambiguousFields,
      }))
      bundle.truncated = (audit.records || records).length > 100
    }
    downloadTextFile(`v2-2-${kind}.json`, `${JSON.stringify(bundle, null, 2)}\n`, "application/json")
  }

  return (
    <section className="data-quality-openai-center" id="data-quality-audit-panel" data-testid="data-quality-audit-panel" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, minWidth: 0, padding: 12, scrollMarginTop: 118 }}>
      <header style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
          <h2 style={{ color: t.textStrong, fontSize: compact ? 16 : 18, lineHeight: 1.18, margin: 0 }}>{text(lang, "当前数据库审计结果", "Current database audit results")}</h2>
          <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.5, margin: 0 }}>
            {text(lang, "数据库预览 / 非最终推荐。字段来源、覆盖率、阻断项与健康评分贯穿 V2.2。", "Database Preview / Not Final Recommendation. Field-level provenance, coverage, blockers, and health score are carried through V2.2.")}
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          <ExportButton t={t} onClick={() => exportBundle("screening-audit")}>{text(lang, "导出筛选审计", "Export Screening Audit JSON")}</ExportButton>
          <ExportButton t={t} onClick={() => exportBundle("candidate-data-gap")}>{text(lang, "导出候选数据缺口", "Export Candidate Data Gap JSON")}</ExportButton>
          <ExportButton t={t} onClick={() => exportBundle("model-readiness-summary")}>{text(lang, "导出模型就绪度摘要", "Export Model Readiness Summary JSON")}</ExportButton>
        </div>
      </header>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <Metric label={text(lang, "候选总数", "Total candidates")} value={summary.totalCandidates || records.length || 0} t={t} />
        <Metric label={text(lang, "描述符覆盖率", "Descriptor coverage")} value={pct(summary.descriptorCoverage)} t={t} />
        <Metric label={text(lang, "来源覆盖率", "Provenance coverage")} value={pct(summary.provenanceCoverage)} t={t} />
        <Metric label={text(lang, "已核验元数据", "Verified metadata count")} value={summary.verifiedMetadataCount || 0} t={t} tone={(summary.verifiedMetadataCount || 0) > 0 ? "pass" : "warn"} />
        <Metric label={text(lang, "来源已确认", "Source confirmed count")} value={summary.sourceConfirmedCount || 0} t={t} />
        <Metric label={text(lang, "引文就绪", "Citation ready count")} value={summary.citationReadyCount || 0} t={t} />
        <Metric label={text(lang, "License 已确认", "License confirmed count")} value={summary.licenseConfirmedCount || 0} t={t} />
        <Metric label={text(lang, "DOI 已确认", "DOI confirmed count")} value={summary.doiConfirmedCount || 0} t={t} />
        <Metric label={text(lang, "来源链接已确认", "SourceURL confirmed count")} value={summary.sourceUrlConfirmedCount || 0} t={t} />
        <Metric label={text(lang, "歧义警告", "Ambiguity warning count")} value={summary.ambiguityWarningCount || 0} t={t} tone={(summary.ambiguityWarningCount || 0) > 0 ? "warn" : "info"} />
        <Metric label={text(lang, "合成样例", "Synthetic fixture count")} value={summary.syntheticFixtureCount || 0} t={t} tone={(summary.syntheticFixtureCount || 0) > 0 ? "warn" : "info"} />
        <Metric label={text(lang, "缺失字段", "Missing field count")} value={summary.missingFieldCount || 0} t={t} tone={(summary.missingFieldCount || 0) > 0 ? "warn" : "info"} />
        <Metric label={text(lang, "高风险记录", "High-risk records")} value={summary.highRiskRecordCount || 0} t={t} tone={(summary.highRiskRecordCount || 0) > 0 ? "warn" : "pass"} />
      </div>

      <DatabaseHealthScoreCard audit={audit} lang={lang} t={t} isMobile={isMobile} />
      {!compact ? (
        <>
          <FieldCoverageMatrix audit={audit} lang={lang} t={t} />
          <ProvenanceCompletenessPanel audit={audit} lang={lang} t={t} isMobile={isMobile} />
          <AmbiguityRiskPanel audit={audit} lang={lang} t={t} isMobile={isMobile} />
          <VerifiedBlockerSummary audit={audit} lang={lang} t={t} />
        </>
      ) : null}
    </section>
  )
}

export default DataQualityAuditPanel
