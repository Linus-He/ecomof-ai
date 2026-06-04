// @ts-nocheck
import { ChemicalText } from "../../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function MethodologyCitationPanel({ coverage, lang, t }) {
  const rows = [
    [text(lang, "Evidence records", "Evidence records"), coverage?.totalRecords || 0],
    [text(lang, "Literature proxy", "Literature proxy"), coverage?.literatureProxy || 0],
    [text(lang, "Expert prior", "Expert prior"), coverage?.expertPrior || 0],
    [text(lang, "Pending verification records", "Pending verification records"), coverage?.pendingVerification || 0],
    [text(lang, "DOI coverage", "DOI coverage"), coverage?.doiCoveragePercent || "0%"],
    [text(lang, "Fake DOI count", "Fake DOI count"), coverage?.fakeDoiCount || 0],
  ]

  return (
    <section id="methodology-oafs-citation-panel" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Methodology Citation Panel</span>
        <h3 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "证据层状态", "Evidence Data Layer Status")}
        </h3>
      </header>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {rows.map(([label, value]) => (
          <article key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 4, minWidth: 0, padding: 10 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
            <strong style={{ color: label.includes("DOI") || label.includes("Fake") || label.includes("覆盖") ? t.warn : t.textStrong, fontSize: 18, lineHeight: 1.1 }}>
              <ChemicalText value={value} />
            </strong>
          </article>
        ))}
      </div>
      <p style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.52, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "Evidence layer is currently demo/proxy; no verified DOI-backed records yet. 这表示当前证据层仍处于演示与待验证阶段，而不是数据错误。",
          coverage?.warning || "Evidence layer is currently demo/proxy; no verified DOI-backed records yet."
        )} />
      </p>
    </section>
  )
}
