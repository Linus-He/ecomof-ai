// @ts-nocheck
import { BlockFormula } from "../../ui"
import { organicAcidPalette as palette, SCIENTIFIC_TOKEN_FONT } from "../../catalysis/FormulaInline"
import { DescriptorEvidenceMatrix } from "./DescriptorEvidenceMatrix"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function AuditMetric({ label, value, tone = "default" }) {
  const color = tone === "risk" ? palette.risk : tone === "good" ? palette.positive : palette.accent
  return (
    <article style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 9, display: "grid", gap: 5, minWidth: 0, padding: 10 }}>
      <span style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 17, lineHeight: 1.2 }}>{value}</strong>
    </article>
  )
}

export function AlgorithmShowcaseSection({ model, lang = "zh", t }) {
  if (!model) return null
  return (
    <section id="methodology-oafs-algorithm-showcase" data-testid="algorithm-showcase-section" style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 12, display: "grid", gap: 14, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 5 }}>
        <span style={{ color: palette.accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Methods · V3.9.10</span>
        <h3 style={{ color: palette.text, fontSize: 22, lineHeight: 1.16, margin: 0 }}>{text(lang, model.titleZh, model.titleEn)}</h3>
        <p style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>{text(lang, model.modelChange.reasonZh, model.modelChange.reasonEn)}</p>
      </header>

      <div className="formula-scroll" style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, display: "grid", gap: 10, minWidth: 0, overflowX: "auto", padding: 12 }}>
        <BlockFormula t={t} math={model.formula.latex} fallback="HGCPS = weighted geometric mean of eight factors" />
        <BlockFormula t={t} math={model.formula.factorSetLatex} fallback="Eight HGCPS factors" />
      </div>

      <div style={{ background: palette.accentSoft, border: `1px solid ${palette.accent}`, borderRadius: 9, color: palette.text, display: "grid", fontSize: 12, gap: 5, lineHeight: 1.5, padding: 10 }}>
        <strong>{text(lang, "模型变更", "Model change")}</strong>
        <span>{model.modelChange.from}</span>
        <span>→ {model.modelChange.to}</span>
      </div>

      <DescriptorEvidenceMatrix algorithmRows={model.factors} lang={lang} t={t} />

      <div style={{ display: "grid", gap: 9 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, "预注册纪律", "Preregistration discipline")}</strong>
        <p style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55, margin: 0 }}>{text(lang, model.disciplineZh, model.disciplineEn)}</p>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {model.preregistration.map(row => (
            <article key={row.specId} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 10 }}>
              <strong style={{ color: palette.text, fontSize: 12.5 }}>{row.specId}</strong>
              <span style={{ color: palette.muted, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11.5 }}>{row.version} · {row.lockedAt}</span>
              <span style={{ color: palette.accent, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11.5 }}>commit {row.commit}</span>
              <span style={{ color: palette.faint, fontSize: 11.3, lineHeight: 1.45 }}>{row.policy}</span>
            </article>
          ))}
        </div>
      </div>

      <div data-testid="algorithm-audit-conclusions" style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 11 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, "审计结论", "Audit conclusions")}</strong>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          <AuditMetric label="Composite Spearman ρ" value={model.audit.composite?.spearmanRho ?? "n/a"} tone={model.audit.composite?.validity === "positive-tracking-signal" ? "good" : "risk"} />
          <AuditMetric label={text(lang, "低有效性单项", "Low-validity descriptors")} value={model.audit.lowValidityDescriptors.join(", ") || "none"} tone="risk" />
          <AuditMetric label={text(lang, "低置信家族", "Low-confidence families")} value={model.audit.lowConfidenceFamilies.join(", ") || "none"} tone="risk" />
          <AuditMetric label={text(lang, "敏感性场景", "Sensitivity scenarios")} value={model.audit.sensitivity.scenarioCount} />
          <AuditMetric label={text(lang, "榜首翻转率", "Top-route flip rate")} value={model.audit.sensitivity.topRouteFlipFrequency} tone={model.audit.sensitivity.topRouteFlipFrequency > 0 ? "risk" : "good"} />
        </div>
        <p style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55, margin: 0 }}>{text(lang, model.audit.conclusionZh, model.audit.conclusionEn)}</p>
      </div>

      <p style={{ color: palette.risk, fontSize: 12, fontWeight: 850, lineHeight: 1.5, margin: 0 }}>
        {text(lang, model.currentRun.priceBoundary, model.currentRun.priceBoundary)}
      </p>
    </section>
  )
}

export default AlgorithmShowcaseSection
