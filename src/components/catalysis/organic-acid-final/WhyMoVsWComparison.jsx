// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { formatScore, MiniMetric, Panel, StatusBadge, text } from "./FinalScreeningShared"
import { AlgorithmTraceDrawer } from "./AlgorithmTraceDrawer"

function WinList({ title, items, t }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 7, padding: 10 }}>
      <strong style={{ color: t.textStrong, fontSize: 12.8 }}>{title}</strong>
      {(items || []).map(item => (
        <span key={item} style={{ color: t.muted, fontSize: 12, lineHeight: 1.42 }}>
          <ChemicalText value={`+ ${item}`} />
        </span>
      ))}
    </article>
  )
}

export function WhyMoVsWComparison({ comparisons, metals, trace, lang, t, isMobile }) {
  const rows = metals || []
  const mo = rows.find(row => row.metal === "Mo")
  const w = rows.find(row => row.metal === "W")
  const comparison = (comparisons || []).find(row => row.competitor === "W")
  const gap = comparison?.dmrsGap ?? ((mo?.dmrs || 0) - (w?.dmrs || 0))

  return (
    <Panel
      id="organic-acid-final-mo-vs-w"
      eyebrow={text(lang, "核心竞争关系", "Core competition")}
      title={text(lang, "Why Mo vs W Comparison", "Why Mo vs W Comparison")}
      t={t}
      actions={<AlgorithmTraceDrawer trace={trace} lang={lang} t={t} compact />}
    >
      <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.58, padding: 11 }}>
        <ChemicalText value={text(
          lang,
          "W 是强竞争备选金属，而不是被简单排除的候选。Mo 与 W 的 DMRS 差距较小，二者均需 DFT、EXAFS 和同条件水热浸出测试验证。",
          "W remains a strong alternative dopant rather than a rejected candidate. The Mo-W DMRS gap is small, and both require DFT, EXAFS, and same-condition hydrothermal leaching validation."
        )} />
      </div>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        <MiniMetric label={text(lang, "Mo primary hypothesis", "Mo primary hypothesis")} value={formatScore(mo?.dmrs)} t={t} />
        <MiniMetric label={text(lang, "W backup hypothesis", "W backup hypothesis")} value={formatScore(w?.dmrs)} t={t} />
        <MiniMetric label="DMRS gap" value={`+${formatScore(gap)}`} t={t} tone="warn" />
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        <WinList
          title={text(lang, "Mo wins", "Mo wins")}
          items={[
            text(lang, "氧化还原适应性", "Redox adaptability"),
            text(lang, "甲酸盐亲和 proxy", "Formate affinity proxy"),
            text(lang, "缺陷锚定趋势", "Defect anchoring trend"),
          ]}
          t={t}
        />
        <WinList
          title={text(lang, "W wins", "W wins")}
          items={[
            text(lang, "Oxo-metal 稳定性", "Oxo-metal stability"),
            text(lang, "水热 persistence", "Hydrothermal persistence"),
            text(lang, "潜在更低结构扭曲", "Potentially lower structural distortion"),
          ]}
          t={t}
        />
        <WinList
          title={text(lang, "Shared uncertainty", "Shared uncertainty")}
          items={[
            text(lang, "Direct selected Al-MOF DFT pending", "Direct selected Al-MOF DFT pending"),
            text(lang, "EXAFS validation required", "EXAFS validation required"),
            text(lang, "Hydrothermal leaching test required", "Hydrothermal leaching test required"),
          ]}
          t={t}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <StatusBadge tone="info" t={t}>Mo: primary hypothesis</StatusBadge>
        <StatusBadge tone="warn" t={t}>W: backup hypothesis</StatusBadge>
        <StatusBadge tone="warn" t={t}>not final proof</StatusBadge>
      </div>
    </Panel>
  )
}
