import { FONT_MONO } from "../../constants/theme"
import { useLang, useT, useViewport } from "../../contexts"
import { calculateFormicAcidPathwayScore } from "../../utils/organicAcidScoring"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const PATHWAY_LABELS = {
  formic_acid_oriented: ["Formic-acid-oriented pathway", "甲酸导向路径"],
  formic_acid_oriented_but_stability_limited: ["Formic-acid-oriented, stability-limited", "甲酸导向但受稳定性限制"],
  formic_acid_oriented_after_functionalization: ["Formic-acid-oriented after functionalization", "功能化后甲酸导向"],
  hco3_hcoo_interaction_hypothesis: ["HCO₃⁻/HCOO⁻ interaction hypothesis", "HCO₃⁻/HCOO⁻ 相互作用假设"],
  c1_intermediate_hypothesis: ["C1 intermediate hypothesis", "C1 中间体假设"],
  competing_pathway_control: ["Competing pathway control", "竞争路径控制"],
  pending: ["Pending curation", "待整理"],
}

function labelFor(value, lang) {
  const label = PATHWAY_LABELS[value]
  return label ? (lang === "zh" ? label[1] : label[0]) : String(value || "pending").replace(/_/g, " ")
}

function DetailCard({ title, children, t, tone = "normal" }) {
  const bg = tone === "warn" ? t.badgeWarnBg : t.surface
  const border = tone === "warn" ? t.warn : t.border
  return (
    <section style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: 11, display: "grid", gap: 8, minWidth: 0 }}>
      <div style={{ color: tone === "warn" ? t.badgeWarnText : t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{title}</div>
      {children}
    </section>
  )
}

function ScoreBreakdown({ breakdown, t, lang }) {
  const rows = [
    [text(lang, "Water score", "Water score"), breakdown.waterScore],
    [text(lang, "Thermal score", "Thermal score"), breakdown.thermalScore],
    [text(lang, "Graph motif", "Graph motif"), breakdown.graphMotifScore],
    [text(lang, "Active motif", "Active motif"), breakdown.activeMotifBonus],
    [text(lang, "HCO₃⁻/HCOO⁻", "HCO₃⁻/HCOO⁻"), breakdown.hco3RoleBonus],
    [text(lang, "Diversity", "Diversity"), breakdown.diversityBonus],
    [text(lang, "Toxicity penalty", "Toxicity penalty"), -breakdown.toxicityPenalty],
    [text(lang, "Evidence penalty", "Evidence penalty"), -breakdown.evidencePenalty],
  ]
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, color: t.muted, fontSize: 11.5, lineHeight: 1.4 }}>
          <span>{label}</span>
          <strong style={{ color: Number(value) < 0 ? t.warn : t.textStrong, fontFamily: FONT_MONO }}>
            {Number(value) > 0 ? "+" : ""}{Number(value).toFixed(0)}
          </strong>
        </div>
      ))}
    </div>
  )
}

export function OrganicAcidRelevancePanel({ relevance, candidate, t: tone, lang: forcedLang, isMobile: forcedMobile }) {
  const theme = useT()
  const { lang: contextLang } = useLang()
  const viewport = useViewport()
  const t = tone || theme
  const lang = forcedLang || contextLang
  const isMobile = forcedMobile ?? viewport.isMobile
  const data = relevance || {
    targetPathway: "pending",
    possibleRoles: [],
    pathwayPriorityScore: null,
    scoreStatus: "pending",
    validationNeeded: ["Organic acid pathway relevance pending curation"],
    notes: "Organic acid relevance pending curation.",
  }
  const roles = Array.isArray(data.possibleRoles) ? data.possibleRoles : []
  const validationNeeded = Array.isArray(data.validationNeeded) ? data.validationNeeded : []
  const score = candidate ? calculateFormicAcidPathwayScore(candidate) : null
  const displayScore = data.pathwayPriorityScore !== null && data.pathwayPriorityScore !== undefined && data.pathwayPriorityScore !== "" && Number.isFinite(Number(data.pathwayPriorityScore))
    ? Number(data.pathwayPriorityScore).toFixed(0)
    : score?.finalScore != null && data.scoreStatus !== "pending"
      ? Number(score.finalScore).toFixed(0)
      : "pending"

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
            {text(lang, "Organic Acid Relevance Panel", "Organic Acid Relevance Panel")}
          </div>
          <div style={{ color: t.textStrong, fontSize: 13.5, lineHeight: 1.25, fontWeight: 900, marginTop: 3 }}>
            {text(lang, "Formic-acid-oriented pathway mapping", "Formic-acid-oriented pathway mapping")}
          </div>
        </div>
        <span style={{ color: data.scoreStatus === "pending" ? t.warn : t.accentText, background: data.scoreStatus === "pending" ? t.badgeWarnBg : t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 6, fontSize: 10.5, fontWeight: 850, padding: "5px 7px" }}>
          {data.scoreStatus || "pending"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.8fr) minmax(0, 1.2fr)", gap: 10 }}>
        <DetailCard title={text(lang, "Target pathway", "Target pathway")} t={t}>
          <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900, lineHeight: 1.35 }}>
            {labelFor(data.targetPathway, lang)}
          </div>
          <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
            {text(lang, "Pathway priority score", "Pathway priority score")}: <strong style={{ color: t.textStrong, fontFamily: FONT_MONO }}>{displayScore}</strong>
          </div>
          <div style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.45 }}>
            {text(lang, "Hypothesis-layer decision-support score; not yield prediction.", "Hypothesis-layer decision-support score; not yield prediction.")}
          </div>
        </DetailCard>

        <DetailCard title={text(lang, "Score basis", "Score basis")} t={t}>
          {score ? <ScoreBreakdown breakdown={score} t={t} lang={lang} /> : (
            <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
              {text(lang, "Score breakdown is pending candidate context.", "Score breakdown is pending candidate context.")}
            </div>
          )}
        </DetailCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.2fr) minmax(0, 0.8fr)", gap: 10 }}>
        <DetailCard title={text(lang, "Possible MOF roles", "Possible MOF roles")} t={t}>
          {roles.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {roles.map((role, index) => (
                <article key={`${role.role || role.label}-${index}`} style={{ borderTop: index ? `1px solid ${t.border}` : "none", paddingTop: index ? 8 : 0, display: "grid", gap: 4 }}>
                  <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{role.label || role.role}</div>
                  <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>
                    {text(lang, "Related feature", "Related feature")}: {String(role.relatedFeature || "pending").replace(/_/g, " ")}
                  </div>
                  <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>
                    {text(lang, "Related pathway node", "Related pathway node")}: {String(role.relatedPathwayNode || "pending").replace(/_/g, " ")}
                  </div>
                  <div style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.45 }}>
                    {text(lang, "Evidence", "Evidence")}: {role.evidenceLevel || "pending"} · {text(lang, "Confidence", "Confidence")}: {role.confidence || "pending"}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
              {text(lang, "Organic acid relevance pending curation.", "Organic acid relevance pending curation.")}
            </div>
          )}
        </DetailCard>

        <DetailCard title={text(lang, "Validation needed", "Validation needed")} t={t} tone={data.scoreStatus === "pending" ? "warn" : "normal"}>
          <div style={{ display: "grid", gap: 6 }}>
            {(validationNeeded.length ? validationNeeded : ["Organic acid pathway relevance pending curation"]).slice(0, 5).map(item => (
              <div key={item} style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
                {item}
              </div>
            ))}
          </div>
        </DetailCard>
      </div>

      <DetailCard title={text(lang, "Notes / limitation", "Notes / limitation")} t={t}>
        <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
          {data.notes || text(lang, "Organic acid relevance is used for hypothesis-layer mapping only.", "Organic acid relevance is used for hypothesis-layer mapping only.")}
        </div>
      </DetailCard>
    </div>
  )
}
