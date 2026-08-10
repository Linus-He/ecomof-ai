// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { Panel, StatusBadge, text } from "./FinalScreeningShared"

function ListBlock({ title, rows, t, tone = "info" }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 12 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{title}</strong>
        <StatusBadge tone={tone} t={t}>{rows?.length || 0}</StatusBadge>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {(rows || []).map(row => (
          <span key={row} style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.48 }}>
            <ChemicalText value={row} />
          </span>
        ))}
      </div>
    </article>
  )
}

export function ExperimentalValidationRoadmap({ rules, lang, t, isMobile }) {
  return (
    <Panel
      id="organic-acid-final-validation-roadmap"
      eyebrow={text(lang, "实验验证路线", "Experimental validation roadmap")}
      title={text(lang, "Controls, Characterization, and 170C Aqueous CO2 Test", "Controls, Characterization, and 170C Aqueous CO2 Test")}
      t={t}
    >
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.58, padding: 11 }}>
        <ChemicalText value={text(
          lang,
          "验证路线用于区分 Mo 锚定协同效应、游离 MoOx 杂质贡献、Al-MOF 单独活性和无催化背景反应；页面不预测实际转化率。",
          "The validation roadmap separates Mo anchoring synergy, free MoOx impurity contribution, Al-MOF-only activity, and background reaction; the page does not predict absolute conversion."
        )} />
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        <ListBlock title={text(lang, "实验组 / 对照组", "Experimental groups / controls")} rows={rules?.requiredControls || []} t={t} tone="warn" />
        <ListBlock title={text(lang, "必要表征", "Required characterization")} rows={rules?.requiredCharacterization || []} t={t} />
        <ListBlock title={text(lang, "反应验证", "Reaction validation")} rows={rules?.requiredReactionValidation || []} t={t} />
      </div>
    </Panel>
  )
}
