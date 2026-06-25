// @ts-nocheck
import { ChemicalText } from "../../common/ChemicalFormula"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function Badge({ children, t, tone = "info" }) {
  const palette = {
    warn: [t.badgeWarnBg, t.warn],
    good: [t.badgeGoodBg || t.badgeInfoBg, t.good || t.accentText],
    info: [t.badgeInfoBg, t.accentText],
  }[tone] || [t.badgeInfoBg, t.accentText]
  return (
    <span style={{ background: palette[0], border: `1px solid ${palette[1]}`, borderRadius: 999, color: palette[1], display: "inline-flex", fontSize: 10.5, fontWeight: 900, padding: "5px 8px", textTransform: "uppercase" }}>
      <ChemicalText value={children} />
    </span>
  )
}

export function OrganicAcidMethodologyOverview({ lang, t, coverage }) {
  const cards = [
    {
      label: text(lang, "算法", "Algorithm"),
      value: text(lang, "HGCPS · 加权几何均值", "HGCPS · weighted geometric mean"),
    },
    {
      label: text(lang, "描述符", "Descriptors"),
      value: text(lang, "8 个数据派生因子", "8 data-derived factors"),
    },
    {
      label: text(lang, "评分对象", "Scoring target"),
      value: text(lang, "主体-客体路线优先级（不预设赢家）", "Host-guest route priority (no preset winner)"),
    },
    {
      label: text(lang, "证据边界", "Boundary"),
      value: text(lang, "数据驱动白盒 · 按数据等级标注", "Data-driven white-box · labeled by data grade"),
    },
  ]

  return (
    <section id="methodology-oafs-overview" style={{ background: `linear-gradient(135deg, ${t.panel}, ${t.badgeInfoBg})`, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 14, overflow: "hidden", padding: 16, scrollMarginTop: 118 }}>
      <div style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 7, maxWidth: 760 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            <Badge t={t}>{text(lang, "方法论页", "Methodology")}</Badge>
            <Badge t={t} tone="good">{text(lang, "数据驱动白盒", "Data-driven white-box")}</Badge>
            <Badge t={t} tone="warn">{text(lang, "按数据等级标注", "Data-grade labeled")}</Badge>
          </div>
          <h2 style={{ color: t.textStrong, fontSize: 26, lineHeight: 1.08, margin: 0 }}>
            {text(lang, "有机酸最终筛选方法论", "Organic Acid Final Screening Methodology")}
          </h2>
          <p style={{ color: t.muted, fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
            <ChemicalText value={text(
              lang,
              "以 HGCPS（加权几何均值）在 8 个数据派生描述符上对主体-客体路线做优先级评分的数据驱动白盒工作流，不预设赢家。",
              "A data-driven white-box workflow that ranks host-guest route priority with HGCPS (a weighted geometric mean over eight data-derived descriptors), with no preset winner."
            )} />
          </p>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 4, minWidth: 170, padding: 11 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Evidence coverage</span>
          <strong style={{ color: t.textStrong, fontSize: 24, lineHeight: 1 }}>{coverage?.totalRecords || 0}</strong>
          <span style={{ color: t.muted, fontSize: 11.5 }}>{text(lang, `DOI 覆盖 ${coverage?.doiCoveragePercent || "0%"}`, `DOI coverage ${coverage?.doiCoveragePercent || "0%"}`)}</span>
        </div>
      </div>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {cards.map(card => (
          <article key={card.label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 5, minWidth: 0, padding: 11 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{card.label}</span>
            <strong style={{ color: t.textStrong, fontSize: 14, lineHeight: 1.25 }}><ChemicalText value={card.value} /></strong>
          </article>
        ))}
      </div>
    </section>
  )
}
