// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { displayValue, formatScore, Panel, StatusPill, statusTone, text, ValueWithSource } from "./FinalScreeningShared"
import { AlgorithmTraceDrawer } from "./AlgorithmTraceDrawer"

const PROVENANCE_KEYS = [
  "co2ActivationPotential",
  "redoxAdaptability",
  "lewisAcidContribution",
  "oxoAffinity",
  "formateAffinityProxy",
  "hydrothermalRisk",
  "leachingRisk",
  "aggregationRisk",
  "costPenalty",
  "toxicityPenalty",
  "nobleMetalPenalty",
]

function sensitivityLabel(row, lang) {
  if (row?.sensitivity?.robust) {
    return text(lang, "Robust high-priority dopant recommendation", "Robust high-priority dopant recommendation")
  }
  return text(lang, "Hypothesis-generating candidate", "Hypothesis-generating candidate")
}

function provenanceSummary(row) {
  const source = row?.source || {}
  const basisCounts = {}
  const confidenceCounts = {}
  let doiCount = 0
  let pendingDoiCount = 0

  PROVENANCE_KEYS.forEach(key => {
    const field = source[key]
    const sourceBasis = field?.sourceBasis || field?.basis || "pending"
    const confidence = field?.confidence || "pending"
    basisCounts[sourceBasis] = (basisCounts[sourceBasis] || 0) + 1
    confidenceCounts[confidence] = (confidenceCounts[confidence] || 0) + 1
    if (field?.sourceDoi || field?.doi) doiCount += 1
    else pendingDoiCount += 1
  })

  const basis = Object.entries(basisCounts).sort((a, b) => b[1] - a[1]).map(([key, value]) => `${key} (${value})`).join(", ")
  const confidence = Object.entries(confidenceCounts).sort((a, b) => b[1] - a[1]).map(([key, value]) => `${key} (${value})`).join(", ")
  return {
    basis: basis || "pending",
    confidence: confidence || "pending",
    doi: doiCount ? `${doiCount} DOI / ${pendingDoiCount} pending` : "evidence pending",
  }
}

function metalRecord(row) {
  const descriptorFieldSources = Object.fromEntries(PROVENANCE_KEYS.map(key => {
    const field = row?.source?.[key] || {}
    return [key, {
      sourceType: field.sourceBasis || field.basis || "pending_provenance",
      sourceDatabase: "Organic Acid Final Screening metal matrix",
      sourceRecordId: `OA-METAL-${row?.metal || "pending"}-${key}`,
      curationStatus: row?.source?.dataStatus?.level || "demo / needs review",
      confidence: null,
      doi: field.sourceDoi || field.doi || null,
      note: field.note || field.notes || "Descriptor-level source detail is retained; direct selected Al-MOF validation may be pending.",
    }]
  }))
  return {
    ...(row?.source || {}),
    sourceDatabase: "Organic Acid Final Screening metal matrix",
    sourceRecordId: `OA-METAL-${row?.metal || "pending"}`,
    fieldSources: { ...descriptorFieldSources, ...(row?.source?.fieldSources || {}) },
  }
}

function roleForMetal(row, lang) {
  if (row?.metal === "Mo") return text(lang, "Primary hypothesis", "Primary hypothesis")
  if (row?.metal === "W") return text(lang, "Backup hypothesis", "Backup hypothesis")
  if (["Ru", "Pd", "Ag"].includes(row?.metal)) return text(lang, "Blind baseline", "Blind baseline")
  return text(lang, "Competitor / context", "Competitor / context")
}

function roleTone(row) {
  if (row?.metal === "Mo") return "pass"
  if (row?.metal === "W") return "warn"
  if (["Ru", "Pd", "Ag"].includes(row?.metal)) return "warn"
  return "info"
}

export function DopantMetalRecommendationMatrix({ metals, moRecommendation, selectedFramework, algorithmTrace, lang, t }) {
  const rows = (metals || []).slice(0, 14)
  return (
    <Panel
      id="organic-acid-final-dopant-matrix"
      eyebrow={text(lang, "Stage 2", "Stage 2")}
      title={text(lang, "第二金属推荐矩阵 / Dopant Metal Recommendation Matrix", "Dopant Metal Recommendation Matrix")}
      t={t}
    >
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.58, padding: 11 }}>
        <ChemicalText value={text(
          lang,
          `基于 ${selectedFramework?.displayName || "selected Al-MOF"}，DMRS 评估活性位价值、三路径机制可行性、水相稳定、证据支持和浸出 / 聚集风险。Mo 是推荐结果，不是直接筛选条件。`,
          `Using ${selectedFramework?.displayName || "the selected Al-MOF"}, DMRS evaluates active-site value, mechanism feasibility across three paths, aqueous stability, evidence support, and leaching / aggregation risk. Mo is the recommendation outcome, not a direct search condition.`
        )} />
      </div>

      {moRecommendation ? (
        <article style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 10, display: "grid", gap: 8, padding: 12 }}>
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
            <strong style={{ color: t.textStrong, fontSize: 14 }}>
              <ChemicalText value={`Mo rank #${moRecommendation.rank}: ${moRecommendation.mostLikelyForm}`} />
            </strong>
            <StatusPill tone={statusTone(moRecommendation.sensitivityStatus)} t={t}>{moRecommendation.sensitivityStatus}</StatusPill>
          </div>
          <span style={{ color: t.muted, fontSize: 12.4, lineHeight: 1.5 }}>
            <ChemicalText value={text(
              lang,
              "节点取代被明确降权；当前更合理的实验假设是缺陷锚定 Mo-oxo 与孔道限域 MoOx-like 物种。",
              "Node substitution is explicitly down-weighted; the current experimental hypothesis favors defect-anchored Mo-oxo and pore-confined MoOx-like species."
            )} />
          </span>
          <span style={{ color: t.warn, fontSize: 12.2, fontWeight: 850, lineHeight: 1.45 }}>
            <ChemicalText value={text(
              lang,
              "Mo: direct selected Al-MOF DFT pending；Mo K-edge XANES/EXAFS 必须验证后才能提升证据等级。",
              "Mo: direct selected Al-MOF DFT pending; Mo K-edge XANES/EXAFS is required before the evidence level can be raised."
            )} />
          </span>
        </article>
      ) : null}

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 1440, width: "100%" }}>
          <thead>
            <tr>
              {[text(lang, "Rank", "Rank"), text(lang, "Metal", "Metal"), text(lang, "Role", "Role"), "DMRS", text(lang, "Data Status", "Data Status"), "Source Basis", "Confidence", "DOI / Pending", text(lang, "Most likely form", "Most likely form"), text(lang, "Main strength", "Main strength"), text(lang, "Main risk", "Main risk"), text(lang, "Sensitivity status", "Sensitivity status")].map(label => (
                <th key={label} style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 10.5, fontWeight: 900, padding: "9px 8px", textAlign: "left", textTransform: "uppercase" }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const record = metalRecord(row)
              const provenance = provenanceSummary(row)
              const isBaseline = ["Ru", "Pd", "Ag"].includes(row.metal)
              return (
                <tr key={row.metal}>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, fontWeight: 900, padding: "9px 8px" }}>{row.rank}</td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, fontWeight: 900, padding: "9px 8px" }}>
                    <ValueWithSource record={record} field="metal" label={text(lang, "金属", "Metal")} value={row.metal} lang={lang} t={t} />
                    {isBaseline ? <StatusPill tone="warn" t={t}>blind baseline</StatusPill> : null}
                    {row.metal === "Mo" && algorithmTrace ? <div style={{ marginTop: 6 }}><AlgorithmTraceDrawer trace={algorithmTrace} lang={lang} t={t} compact /></div> : null}
                  </td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.8, lineHeight: 1.45, padding: "9px 8px" }}>
                    <StatusPill tone={roleTone(row)} t={t}>{roleForMetal(row, lang)}</StatusPill>
                  </td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, fontWeight: 900, padding: "9px 8px" }}>
                    <ValueWithSource record={record} field="DMRS" label="DMRS" value={formatScore(row.dmrs)} lang={lang} t={t} />
                  </td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.8, lineHeight: 1.45, padding: "9px 8px" }}>
                    <StatusPill tone={row.dataStatus?.tone || "warn"} t={t}>{row.dataStatus?.label || "Pending"}</StatusPill>
                  </td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.5, lineHeight: 1.4, padding: "9px 8px" }}>
                    <ChemicalText value={provenance.basis} />
                  </td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.5, lineHeight: 1.4, padding: "9px 8px" }}>
                    <ChemicalText value={provenance.confidence} />
                  </td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.warn, fontSize: 11.5, fontWeight: 850, lineHeight: 1.4, padding: "9px 8px" }}>
                    <ChemicalText value={provenance.doi} />
                  </td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, lineHeight: 1.45, padding: "9px 8px" }}>
                    <ChemicalText value={displayValue(row.mostLikelyForm)} />
                  </td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, padding: "9px 8px" }}>
                    <ValueWithSource record={record} field={row.mainStrength} label={text(lang, "主要优势", "Main strength")} value={row.mainStrength} lang={lang} t={t} />
                  </td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, padding: "9px 8px" }}>
                    <ValueWithSource record={record} field={row.mainRisk} label={text(lang, "主要风险", "Main risk")} value={row.mainRisk} lang={lang} t={t} />
                  </td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.8, lineHeight: 1.45, padding: "9px 8px" }}>
                    <StatusPill tone={row.sensitivity?.robust ? "pass" : "warn"} t={t}>{sensitivityLabel(row, lang)}</StatusPill>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
