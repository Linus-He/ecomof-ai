// @ts-nocheck
import { ChemicalText } from "../../common/ChemicalFormula"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function ExafsFalsificationDiagram({ signature, lang, t }) {
  const features = signature?.expectedFeatures || []
  const falsification = signature?.falsificationCriteria || []
  return (
    <section id="methodology-oafs-exafs" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>EXAFS-Guided Falsification</span>
        <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "EXAFS 引导的假设-证伪闭环", "EXAFS-Guided Hypothesis and Falsification Loop")}
        </h3>
      </header>

      <div style={{ alignItems: "stretch", display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <article style={{ background: t.badgeGoodBg || t.badgeInfoBg, border: `1px solid ${t.good || t.accentText}`, borderRadius: 10, display: "grid", gap: 8, minWidth: 0, padding: 12 }}>
          <strong style={{ color: t.textStrong, fontSize: 14.5 }}>{text(lang, "Hypothesis confirmed", "Hypothesis confirmed")}</strong>
          <p style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.5, margin: 0 }}>
            <ChemicalText value={text(lang, "缺陷锚定 Mo-oxo 物种保持在 Al-MOF 环境中。", "Defect-anchored Mo-oxo species remains in the Al-MOF environment.")} />
          </p>
          {features.map(feature => (
            <span key={feature.feature} style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.4 }}>
              <ChemicalText value={`${feature.feature}: ${feature.expectedDistanceA || feature.expectedIntensity || feature.expectedResult || ""}`} />
            </span>
          ))}
        </article>

        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, minWidth: 0, padding: 12, textAlign: "center" }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "中间验证", "Central test")}</span>
          <strong style={{ color: t.accentText, fontSize: 18, lineHeight: 1.2 }}><ChemicalText value={signature?.technique || "Mo K-edge EXAFS"} /></strong>
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            <ChemicalText value="Mo-O 1.7-1.9 A / weak Mo-O-Al or Mo-O-C / weak or absent Mo-Mo" />
          </span>
        </article>

        <article style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, display: "grid", gap: 8, minWidth: 0, padding: 12 }}>
          <strong style={{ color: t.textStrong, fontSize: 14.5 }}>{text(lang, "Hypothesis falsified", "Hypothesis falsified")}</strong>
          {falsification.map(item => (
            <span key={item} style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.4 }}><ChemicalText value={item} /></span>
          ))}
        </article>
      </div>
    </section>
  )
}

export function ValidationLoopDiagram({ validation, lang, t }) {
  const controls = validation?.controls || []
  return (
    <section id="methodology-oafs-validation-loop" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Experimental Control Loop</span>
        <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "实验控制闭环", "Experimental Control Loop")}
        </h3>
      </header>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {controls.map((control, index) => (
          <article key={control.id} style={{ background: control.name.includes("Mo-anchored") ? t.badgeInfoBg : t.surface, border: `1px solid ${control.name.includes("Mo-anchored") ? t.accentText : t.border}`, borderRadius: 10, display: "grid", gap: 7, minHeight: 116, minWidth: 0, padding: 11 }}>
            <div style={{ alignItems: "center", display: "flex", gap: 7, justifyContent: "space-between" }}>
              <span style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, color: t.accentText, fontSize: 10.5, fontWeight: 900, padding: "4px 7px" }}>{control.step}</span>
              <span aria-hidden style={{ color: t.faint, fontSize: 17 }}>{index === controls.length - 1 ? "↺" : "→"}</span>
            </div>
            <strong style={{ color: t.textStrong, fontSize: 13, lineHeight: 1.25 }}><ChemicalText value={control.name} /></strong>
            <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.4 }}><ChemicalText value={text(lang, control.purposeZh, control.purpose)} /></span>
          </article>
        ))}
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, padding: 11 }}>
        <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{text(lang, "比较读数", "Compare readouts")}</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {(lang === "zh" ? validation?.compareZh : validation?.compare || []).map(item => (
            <span key={item} style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 6, color: t.accentText, fontSize: 10.5, fontWeight: 900, padding: "5px 8px" }}>
              <ChemicalText value={item} />
            </span>
          ))}
        </div>
        <p style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.45, margin: 0 }}>
          <ChemicalText value={text(lang, validation?.interpretationZh, validation?.interpretation)} />
        </p>
      </div>
    </section>
  )
}
