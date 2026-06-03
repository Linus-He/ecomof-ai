// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { displayValue, formatScore, Panel, StatusPill, statusTone, text, ValueWithSource } from "./FinalScreeningShared"

function sensitivityLabel(row, lang) {
  if (row?.sensitivity?.robust) {
    return text(lang, "Robust high-priority dopant recommendation", "Robust high-priority dopant recommendation")
  }
  return text(lang, "Hypothesis-generating candidate", "Hypothesis-generating candidate")
}

function metalRecord(row) {
  return {
    ...(row?.source || {}),
    sourceDatabase: "Organic Acid Final Screening metal matrix",
    sourceRecordId: `OA-METAL-${row?.metal || "pending"}`,
    fieldSources: row?.source?.fieldSources || {},
  }
}

export function DopantMetalRecommendationMatrix({ metals, moRecommendation, selectedFramework, lang, t }) {
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
        </article>
      ) : null}

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 960, width: "100%" }}>
          <thead>
            <tr>
              {[text(lang, "Rank", "Rank"), text(lang, "Metal", "Metal"), "DMRS", text(lang, "Most likely form", "Most likely form"), text(lang, "Main strength", "Main strength"), text(lang, "Main risk", "Main risk"), text(lang, "Sensitivity status", "Sensitivity status")].map(label => (
                <th key={label} style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 10.5, fontWeight: 900, padding: "9px 8px", textAlign: "left", textTransform: "uppercase" }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const record = metalRecord(row)
              const isBaseline = ["Ru", "Pd", "Ag"].includes(row.metal)
              return (
                <tr key={row.metal}>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, fontWeight: 900, padding: "9px 8px" }}>{row.rank}</td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, fontWeight: 900, padding: "9px 8px" }}>
                    <ValueWithSource record={record} field="metal" label={text(lang, "金属", "Metal")} value={row.metal} lang={lang} t={t} />
                    {isBaseline ? <StatusPill tone="warn" t={t}>blind baseline</StatusPill> : null}
                  </td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, fontWeight: 900, padding: "9px 8px" }}>
                    <ValueWithSource record={record} field="DMRS" label="DMRS" value={formatScore(row.dmrs)} lang={lang} t={t} />
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
