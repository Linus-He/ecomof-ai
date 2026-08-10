// @ts-nocheck
import { ChemicalText } from "../../common/ChemicalFormula"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function MechanismPathMethodCard({ lang, t }) {
  const cards = [
    {
      title: "Node Substitution",
      titleZh: "节点取代",
      feasibility: "Mo expected feasibility: low",
      feasibilityZh: "Mo 预期可行性：低",
      body: "Direct metal replacement pathway.",
      bodyZh: "直接金属取代路径。",
      reason: "Reason: ionic radius / charge / coordination mismatch.",
      reasonZh: "原因：离子半径 / 电荷 / 配位几何不匹配。",
    },
    {
      title: "Defect Anchoring",
      titleZh: "缺陷锚定",
      feasibility: "Mo expected feasibility: high",
      feasibilityZh: "Mo 预期可行性：高",
      body: "Mo-oxo anchored at missing-linker / OH defects.",
      bodyZh: "Mo-oxo 锚定在缺失配体 / OH 缺陷位。",
      reason: "Preferred hypothesis.",
      reasonZh: "当前优先假设。",
      preferred: true,
    },
    {
      title: "Pore Confinement",
      titleZh: "孔道限域",
      feasibility: "Mo expected feasibility: medium-high",
      feasibilityZh: "Mo 预期可行性：中高",
      body: "MoOx-like species confined in pore environment.",
      bodyZh: "MoOx-like 物种被限域在孔道环境中。",
      reason: "Helps suppress aggregation / leaching.",
      reasonZh: "有助于抑制团聚 / 浸出。",
    },
  ]

  return (
    <section id="methodology-oafs-mechanism-paths" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Mechanism Path Cards</span>
        <h3 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "三路径机制解释", "Three Mechanism Path Interpretation")}
        </h3>
        <span style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 6, color: t.warn, fontSize: 10.5, fontWeight: 900, justifySelf: "start", padding: "4px 8px", textTransform: "uppercase" }}>
          {text(lang, "Curated 专家判断", "Curated expert judgment")}
        </span>
        <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45, margin: 0 }}>
          {text(lang, "Mo 预期可行性为 curated 专家判断（非数据派生），与当前结论（Mo 跨版本稳健）一致。", "Mo expected feasibility is curated expert judgment (not data-derived), consistent with the current conclusion that Mo is robust across versions.")}
        </p>
      </header>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {cards.map(card => (
          <article key={card.title} style={{ background: card.preferred ? t.badgeInfoBg : t.surface, border: `1px solid ${card.preferred ? t.accentText : t.border}`, borderRadius: 10, display: "grid", gap: 8, minWidth: 0, padding: 12 }}>
            <strong style={{ color: t.textStrong, fontSize: 15 }}><ChemicalText value={text(lang, card.titleZh, card.title)} /></strong>
            <span style={{ color: card.preferred ? t.accentText : t.muted, fontSize: 12.3, fontWeight: 900 }}>
              <ChemicalText value={text(lang, card.feasibilityZh, card.feasibility)} />
            </span>
            <p style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.48, margin: 0 }}><ChemicalText value={text(lang, card.bodyZh, card.body)} /></p>
            <p style={{ color: t.faint, fontSize: 11.8, lineHeight: 1.45, margin: 0 }}><ChemicalText value={text(lang, card.reasonZh, card.reason)} /></p>
          </article>
        ))}
      </div>

      <p style={{ color: t.warn, fontSize: 12.5, fontWeight: 900, lineHeight: 1.48, margin: 0 }}>
        <ChemicalText value={text(lang, "模型不默认假设 Mo 直接取代 Al³⁺ 节点。", "Mo is not assumed to directly replace Al³⁺ nodes.")} />
      </p>
    </section>
  )
}
