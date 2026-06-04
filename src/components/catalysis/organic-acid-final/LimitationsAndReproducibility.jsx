// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { MethodologyLink, Panel, StatusPill, text } from "./FinalScreeningShared"

export function LimitationsAndReproducibility({ statement, audit, coverage, lang, t }) {
  const limitations = [
    text(lang, "当前模型聚焦过渡金属掺杂路径，暂未覆盖非金属配体掺杂、单原子催化剂和配体杂原子工程。", "The current model focuses on transition-metal dopant paths and does not yet cover non-metal ligand doping, single-atom catalysts, or ligand heteroatom engineering."),
    text(lang, "当前 OACS/DMRS 基于静态描述符、文献代理指标和证据可信度，不等同于实际转化率预测。", "OACS/DMRS use static descriptors, literature proxies, and evidence confidence; they are not absolute conversion-rate predictions."),
    text(lang, "当前模型缺少微动力学、显式溶剂和反应路径 DFT，需要 EXAFS、DFT 和同条件实验验证。", "The model lacks microkinetics, explicit solvent, and reaction-pathway DFT; EXAFS, DFT, and same-condition experiments are required."),
    text(lang, "若 Mo 在 1000 次扰动中始终保持第一，只能标记为 robust but audit required；必须审计 descriptor 饱和、竞品方差和 source-basis 偏倚。", "If Mo stays first across 1000 perturbations, the result is only robust but audit required; descriptor saturation, competitor variance, and source-basis bias must be audited."),
    text(lang, "无真实 DOI 的 descriptor 字段必须显示为 evidence pending；当前模块启用 No fake DOI policy。", "Descriptor fields without real DOI must be shown as evidence pending; the module enforces a No fake DOI policy."),
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
      <article style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.muted, display: "grid", gap: 6, fontSize: 12.4, lineHeight: 1.55, padding: 12 }}>
        <strong style={{ color: t.warn, fontSize: 13 }}>
          {text(lang, "V1.1 robustness audit status", "V1.1 robustness audit status")}
        </strong>
        <ChemicalText value={audit?.reason} />
        <ChemicalText value={text(
          lang,
          `Provenance coverage: sourceBasis ${Math.round((coverage?.sourceBasisCoverage || 0) * 100)}%, confidence ${Math.round((coverage?.confidenceCoverage || 0) * 100)}%, fake DOI ${coverage?.fakeDoiCount || 0}.`,
          `Provenance coverage: sourceBasis ${Math.round((coverage?.sourceBasisCoverage || 0) * 100)}%, confidence ${Math.round((coverage?.confidenceCoverage || 0) * 100)}%, fake DOI ${coverage?.fakeDoiCount || 0}.`
        )} />
      </article>
    </Panel>
  )
}
