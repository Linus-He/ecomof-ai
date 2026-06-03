// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { displayValue, formatScore, Panel, StatusPill, text } from "./FinalScreeningShared"

export function BlindBaselinePanel({ baselines, lang, t, isMobile }) {
  return (
    <Panel
      id="organic-acid-final-blind-baseline"
      eyebrow={text(lang, "盲测基线", "Blind baseline")}
      title={text(lang, "Ru / Pd / Ag Negative-Predictive Baseline", "Ru / Pd / Ag Negative-Predictive Baseline")}
      t={t}
    >
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.58, padding: 11 }}>
        <ChemicalText value={text(
          lang,
          "Ru/Pd/Ag 用于检查模型是否具备负向区分能力，而不是只被调参推高 Mo。没有真实 DOI 时，负面证据必须显示 evidence pending。",
          "Ru/Pd/Ag test whether the model has negative predictive power and is not only tuned to promote Mo. Without a real DOI, negative evidence remains evidence pending."
        )} />
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        {(baselines || []).map(row => (
          <article key={row.metal} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 9, padding: 12 }}>
            <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 8 }}>
              <strong style={{ color: t.textStrong, fontSize: 16 }}>{row.metal}</strong>
              <StatusPill tone="warn" t={t}>blind baseline</StatusPill>
            </div>
            <div style={{ display: "grid", gap: 5 }}>
              <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>DMRS / rank</span>
              <strong style={{ color: t.textStrong, fontSize: 18 }}>{formatScore(row.dmrs)} / #{row.rank}</strong>
            </div>
            <p style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.5, margin: 0 }}>
              <ChemicalText value={row.whyRankedLower} />
            </p>
            <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.muted, display: "grid", gap: 5, fontSize: 11.8, lineHeight: 1.45, padding: 9 }}>
              <strong style={{ color: t.warn }}>{text(lang, "Negative evidence", "Negative evidence")}: {row.negativeEvidenceStatus === "pending verification" ? "pending verification" : row.negativeEvidenceStatus}</strong>
              <span>DOI: {displayValue(row.sourceDoi, "evidence pending")}</span>
              {(row.requiredEvidence || []).slice(0, 3).map(item => (
                <span key={item}><ChemicalText value={item} /></span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}
