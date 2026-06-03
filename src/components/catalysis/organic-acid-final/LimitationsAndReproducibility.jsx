// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { MethodologyLink, Panel, StatusPill, text } from "./FinalScreeningShared"

export function LimitationsAndReproducibility({ statement, lang, t }) {
  const limitations = [
    text(lang, "当前模型聚焦过渡金属掺杂路径，暂未覆盖非金属配体掺杂、单原子催化剂和配体杂原子工程。", "The current model focuses on transition-metal dopant paths and does not yet cover non-metal ligand doping, single-atom catalysts, or ligand heteroatom engineering."),
    text(lang, "当前 OACS/DMRS 基于静态描述符、文献代理指标和证据可信度，不等同于实际转化率预测。", "OACS/DMRS use static descriptors, literature proxies, and evidence confidence; they are not absolute conversion-rate predictions."),
    text(lang, "当前模型缺少微动力学、显式溶剂和反应路径 DFT，需要 EXAFS、DFT 和同条件实验验证。", "The model lacks microkinetics, explicit solvent, and reaction-pathway DFT; EXAFS, DFT, and same-condition experiments are required."),
  ]
  return (
    <Panel
      id="organic-acid-final-limitations"
      eyebrow={text(lang, "限制与复现", "Limitations and reproducibility")}
      title={text(lang, "Limitations & Reproducibility Statement", "Limitations & Reproducibility Statement")}
      t={t}
      actions={<MethodologyLink lang={lang} t={t} />}
    >
      <div style={{ display: "grid", gap: 8 }}>
        {limitations.map(item => (
          <div key={item} style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, color: t.muted, fontSize: 12.4, lineHeight: 1.55, padding: 10 }}>
            <ChemicalText value={item} />
          </div>
        ))}
      </div>
      <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 12 }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "space-between" }}>
          <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{text(lang, "Reproducibility Statement", "Reproducibility Statement")}</strong>
          <StatusPill tone="info" t={t}>descriptor dictionary / CRITIC+AHP / matrix / scripts</StatusPill>
        </div>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.62, margin: 0 }}>
          <ChemicalText value={lang === "zh" ? statement?.zh : statement?.en} />
        </p>
      </article>
    </Panel>
  )
}
