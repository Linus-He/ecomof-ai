// @ts-nocheck
import { ChemicalText } from "../../common/ChemicalFormula"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function MethodologyLimitationsCard({ lang, t }) {
  const limitations = [
    [text(lang, "当前模型使用静态描述符。", "Current model uses static descriptors.")],
    [text(lang, "尚未加入微观动力学模型。", "No microkinetic modeling yet.")],
    [text(lang, "尚未对选定 Al-MOF 做直接 DFT。", "No direct selected Al-MOF DFT yet.")],
    [text(lang, "DOI coverage currently 0%。", "DOI coverage currently 0%.")],
    [text(lang, "评分由登记规则和数据字段派生，并标注数据等级。", "Scores are data-derived white-box results with data-grade labels.")],
  ]
  const reproducibility = [
    [text(lang, "描述符字典将公开。", "Descriptor dictionary will be public.")],
    [text(lang, "CRITIC+AHP 配置将公开。", "CRITIC+AHP config will be public.")],
    [text(lang, "金属属性矩阵将公开。", "Metal property matrix will be public.")],
    [text(lang, "敏感性分析配置将公开。", "Sensitivity-analysis configuration will be public.")],
    [text(lang, "保留候选级来源记录。", "Candidate-level provenance retained.")],
  ]

  return (
    <section id="methodology-oafs-limitations" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Limitations & Reproducibility</span>
        <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "限制与复现", "Limitations & Reproducibility")}
        </h3>
      </header>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {[
          [text(lang, "当前限制", "Limitations"), limitations, t.badgeWarnBg, t.warn],
          [text(lang, "可复现性", "Reproducibility"), reproducibility, t.badgeInfoBg, t.accentText],
        ].map(([title, rows, bg, color]) => (
          <article key={title} style={{ background: bg, border: `1px solid ${color}`, borderRadius: 10, display: "grid", gap: 8, minWidth: 0, padding: 12 }}>
            <strong style={{ color: t.textStrong, fontSize: 15 }}>{title}</strong>
            {rows.map(([row]) => (
              <span key={row} style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.45 }}><ChemicalText value={row} /></span>
            ))}
          </article>
        ))}
      </div>

      <p style={{ color: t.muted, fontSize: 12.3, lineHeight: 1.52, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "该方法页展示算法如何从输入走向可证伪实验假设；它不把 Mo 写成最终证明的最优金属，也不把当前代理评分解释为真实转化率预测。",
          "This methodology page shows how the algorithm moves from inputs to falsifiable experimental hypotheses; it does not treat Mo as a finally proven optimal metal or interpret proxy scores as real conversion-rate predictions."
        )} />
      </p>
    </section>
  )
}
