// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { Panel, text } from "./FinalScreeningShared"

export function WhyHotSpotMattersCard({ lang, t }) {
  return (
    <Panel
      id="organic-acid-final-why-hot-spot"
      eyebrow={text(lang, "受耦合催化剂设计思想启发", "Inspired by coupled catalyst design")}
      title={text(lang, "热区图的解释用途", "Why Hot Spot Matters")}
      t={t}
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "从排名到设计空间", "From ranking to design space")}</strong>
          <p style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.5, margin: 0 }}>
            <ChemicalText value={text(
              lang,
              "排名只能告诉我们当前哪个候选最高；热区图则说明高优先级候选位于怎样的化学可解释设计空间中。",
              "A ranking tells which candidate is currently highest. A hot spot map explains where high-priority candidates are located in a chemically interpretable design space."
            )} />
          </p>
        </article>
        <article style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "设计思想边界", "Design-philosophy boundary")}</strong>
          <p style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.5, margin: 0 }}>
            <ChemicalText value={text(
              lang,
              "本模块借鉴几何—电子耦合催化剂设计思路，将 OACS / DMRS 映射为耦合描述符热区图，用于有机酸路径的 MOF 筛选解释；该图不复现 ORR 模型。",
              "Inspired by geometric-electronic coupled catalyst design, this module visualizes OACS/DMRS as a coupled descriptor map. The goal is not to replicate the ORR model, but to translate the same design philosophy into an organic-acid-oriented MOF screening workflow."
            )} />
          </p>
        </article>
      </div>
    </Panel>
  )
}
