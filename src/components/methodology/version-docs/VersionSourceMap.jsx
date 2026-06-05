// @ts-nocheck
import { ChemicalText } from "../../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function sourceLabel(record) {
  if (!record) return "Pending metadata"
  if (record.status === "verified_from_uploaded_file") return `${record.journal || "Verified source"} ${record.year || ""}`.trim()
  return "Pending metadata"
}

export function VersionSourceMap({ versions = [], literatureRecords = [], lang, t, isMobile }) {
  const byId = new Map(literatureRecords.map(record => [record.id, record]))
  const rows = versions.flatMap(version => (version.literatureInspirations || []).map(link => {
    const record = byId.get(link.literatureId)
    return {
      version: version.version,
      source: sourceLabel(record),
      title: record?.title || link.literatureId,
      feature: (link.inspiredFeatures || []).join(" / "),
      boundary: link.evidenceBoundary || link.adaptationNote || record?.adaptationBoundary || "Pending metadata",
      status: record?.status || "pending_metadata",
      doi: record?.doi || "DOI pending",
    }
  }))

  return (
    <section id="methodology-version-source-map" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 14, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 5 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Version ↔ Literature Source Map</span>
        <h3 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "版本 ↔ 文献来源映射", "Version ↔ Literature Source Map")}
        </h3>
      </header>
      {isMobile ? (
        <div style={{ display: "grid", gap: 8 }}>
          {rows.map((row, index) => (
            <article key={`${row.version}-${row.title}-${index}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 6, padding: 10 }}>
              <strong style={{ color: t.textStrong, fontSize: 13 }}>{row.version} · {row.source}</strong>
              <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45 }}><ChemicalText value={row.feature} /></span>
              <span style={{ color: row.status === "pending_metadata" ? t.warn : t.accentText, fontSize: 11.5, fontWeight: 900 }}>{row.doi}</span>
              <span style={{ color: t.muted, fontSize: 11.7, lineHeight: 1.45 }}><ChemicalText value={row.boundary} /></span>
            </article>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 760, width: "100%" }}>
            <thead>
              <tr>
                {["Version", "Literature source", "Inspired feature", "Boundary"].map(label => (
                  <th key={label} style={{ borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 10.5, fontWeight: 900, padding: 8, textAlign: "left", textTransform: "uppercase" }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.version}-${row.title}-${index}`}>
                  <td style={{ borderBottom: `1px solid ${t.divider || t.border}`, color: t.textStrong, fontSize: 12, fontWeight: 900, padding: 8 }}>{row.version}</td>
                  <td style={{ borderBottom: `1px solid ${t.divider || t.border}`, color: t.muted, fontSize: 12, lineHeight: 1.4, padding: 8 }}>
                    <ChemicalText value={`${row.source} · ${row.doi}`} />
                  </td>
                  <td style={{ borderBottom: `1px solid ${t.divider || t.border}`, color: t.muted, fontSize: 12, lineHeight: 1.4, padding: 8 }}><ChemicalText value={row.feature} /></td>
                  <td style={{ borderBottom: `1px solid ${t.divider || t.border}`, color: t.muted, fontSize: 12, lineHeight: 1.4, padding: 8 }}><ChemicalText value={row.boundary} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
