// @ts-nocheck
import { useMemo, useState } from "react"
import { ChemicalText } from "../../../shared"
import { buildMapperPreviewRows } from "../../../utils/mofDataMappers/mapperPreviewFixtures"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function sanitizeForDisplay(value) {
  if (value === null || value === undefined) return "pending_metadata"
  if (typeof value === "number" && !Number.isFinite(value)) return "not_available"
  if (Array.isArray(value)) return value.map(sanitizeForDisplay)
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeForDisplay(item)]))
  }
  return value
}

function JsonPreview({ title, value, t }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, minWidth: 0, padding: 10 }}>
      <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{title}</strong>
      <pre style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 11, lineHeight: 1.45, margin: 0, maxHeight: 230, overflow: "auto", padding: 10, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {JSON.stringify(sanitizeForDisplay(value), null, 2)}
      </pre>
    </article>
  )
}

function StatusPill({ children, status, t }) {
  const value = String(status || "pending")
  const color = value === "pass" || value === "valid" ? (t.good || t.accentText) : value === "blocked" ? (t.danger || t.warn) : t.warn
  const bg = value === "pass" || value === "valid" ? (t.badgeGoodBg || t.badgeInfoBg) : t.badgeWarnBg
  return (
    <span style={{ background: bg, border: `1px solid ${color}`, borderRadius: 999, color, display: "inline-flex", fontSize: 10.5, fontWeight: 900, padding: "5px 8px", textTransform: "uppercase" }}>
      <ChemicalText value={children} />
    </span>
  )
}

export function DataMappingSchemaValidationPanel({ lang, t }) {
  const preview = useMemo(() => buildMapperPreviewRows(), [])
  const [activeId, setActiveId] = useState(preview.rows[0]?.id)
  const active = preview.rows.find(row => row.id === activeId) || preview.rows[0]

  return (
    <section id="methodology-oafs-data-mapping" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 5 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Data Mapping and Schema Validation</span>
        <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "数据映射层与 Schema Validation", "Data Mapping and Schema Validation")}
        </h3>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0, maxWidth: 980 }}>
          <ChemicalText value={text(
            lang,
            "V1.5 在真实数据接入前建立小型 fixture 驱动的数据映射层：CoRE-like data 映射到有机酸骨架 schema，QMOF-like data 映射到电子描述符 schema，文献证据映射到 evidence record schema。该层负责 mapper preview、schema validation 和 data quality gate，不加载完整 CoRE/QMOF。",
            "V1.5 adds a small-fixture data mapping layer before real data integration: CoRE-like data maps to the Organic Acid framework schema, QMOF-like data maps to the electronic descriptor schema, and literature evidence maps to the evidence record schema. It supports mapper preview, schema validation, and a data quality gate without loading full CoRE/QMOF."
          )} />
        </p>
      </header>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 5, padding: 10 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Data Mapper Preview Panel</span>
          <strong style={{ color: t.textStrong, fontSize: 15 }}>{preview.rows.length} mapper routes</strong>
        </article>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 5, padding: 10 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Schema Validation Panel</span>
          <strong style={{ color: t.textStrong, fontSize: 15 }}>{preview.rows.filter(row => row.validation.valid).length}/{preview.rows.length} valid</strong>
        </article>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 5, padding: 10 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Data Quality Gate Panel</span>
          <strong style={{ color: t.textStrong, fontSize: 15 }}>{preview.summary.pass} pass · {preview.summary.needsReview} review</strong>
        </article>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {preview.rows.map(row => (
          <button
            key={row.id}
            type="button"
            onClick={() => setActiveId(row.id)}
            style={{ background: row.id === active.id ? t.badgeInfoBg : t.surface, border: `1px solid ${row.id === active.id ? t.accentText : t.border}`, borderRadius: 999, color: t.textStrong, cursor: "pointer", fontSize: 11.5, fontWeight: 900, padding: "7px 10px" }}
          >
            <ChemicalText value={text(lang, row.titleZh, row.title)} />
          </button>
        ))}
      </div>

      <article style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 12, minWidth: 0, padding: 12 }}>
        <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <strong style={{ color: t.textStrong, fontSize: 15 }}><ChemicalText value={text(lang, active.titleZh, active.title)} /></strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <StatusPill status={active.validation.valid ? "valid" : "blocked"} t={t}>{active.validation.valid ? "valid schema" : "blocked schema"}</StatusPill>
            <StatusPill status={active.qualityGate.status} t={t}>{active.qualityGate.status}</StatusPill>
          </div>
        </header>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
          <JsonPreview title="Raw input" value={active.raw} t={t} />
          <JsonPreview title="Mapped schema" value={active.mapped} t={t} />
          <JsonPreview title="Validation result" value={{ valid: active.validation.valid, summary: active.validation.summary, errors: active.validation.errors, warnings: active.validation.warnings }} t={t} />
          <JsonPreview title="Quality gate" value={active.qualityGate} t={t} />
        </div>
      </article>

      <p style={{ color: t.warn, fontSize: 12.3, fontWeight: 900, lineHeight: 1.5, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "边界：该 mapper 只验证 schema readiness 和数据接入形状；quality gate 不代表科学有效性，也不改变 OACS / DMRS 核心结论。",
          "Boundary: this mapper validates schema readiness and intake shape only. The quality gate does not establish scientific validity and does not change OACS / DMRS conclusions."
        )} />
      </p>
    </section>
  )
}
