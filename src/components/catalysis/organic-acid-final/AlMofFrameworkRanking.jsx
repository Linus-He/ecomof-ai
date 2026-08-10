// @ts-nocheck
import { useMemo, useState } from "react"
import { ChemicalText } from "../../../shared"
import { displayValue, formatScore, Panel, StatusBadge, statusTone, text, ValueWithSource } from "./FinalScreeningShared"

function gateLabel(status, lang) {
  const value = String(status || "pending")
  if (lang === "zh") {
    if (value === "pass") return "通过"
    if (value === "needs_review") return "需复核"
    if (value === "fail") return "拦截"
  }
  return value.replace("_", " ")
}

function whyRecommended(row, lang) {
  const status = row?.hydrothermalGate?.status
  if (status === "pass") {
    return text(lang, "通过 >=150C 水热 + PXRD 硬阈值后，按 OACS 排序进入第二金属推荐。", "Passes >=150C hydrothermal + PXRD hard gate, then enters OACS ranking for dopant recommendation.")
  }
  if (status === "needs_review") {
    return text(lang, "有高温水相记录但缺少反应后 PXRD；OACS 归零，不进入 Top recommendation。", "High-temperature water record lacks post-treatment PXRD; OACS is zero and cannot enter Top recommendation.")
  }
  return text(lang, "缺少 >=150C 水热稳定性证据；硬阈值优先于孔结构优势。", "No >=150C hydrothermal evidence; hard gate overrides favorable pore metrics.")
}

function DetailGrid({ candidate, lang, t, isMobile, onInspectCandidate }) {
  if (!candidate) return null
  const rows = [
    ["sourceDatabase", text(lang, "来源数据库", "Source database"), candidate.sourceDatabase],
    ["sourceRecordId", text(lang, "来源记录ID", "Source record ID"), candidate.sourceRecordId],
    ["max_tested_temp_C", text(lang, "最高水热温度", "Max hydrothermal temp"), `${displayValue(candidate.waterStability?.max_tested_temp_C, "Not available")}°C`],
    ["post_treatment_PXRD_retained", text(lang, "反应后 PXRD", "Post-treatment PXRD"), candidate.waterStability?.post_treatment_PXRD_retained === true ? "retained" : "Needs review"],
    ["pldA", "PLD", `${candidate.pldA} A`],
    ["lcdA", "LCD", `${candidate.lcdA} A`],
    ["surfaceArea", text(lang, "比表面积", "Surface area"), `${candidate.surfaceArea} m2/g`],
    ["poreVolume", text(lang, "孔体积", "Pore volume"), `${candidate.poreVolume} cm3/g`],
    ["bandGap", text(lang, "带隙", "Band gap"), `${candidate.bandGap} eV`],
    ["OACS", "OACS", formatScore(candidate.organicAcidScore?.oacs)],
    ["collapseRisk", text(lang, "坍塌风险", "Collapse risk"), formatScore(candidate.organicAcidScore?.collapseRisk)],
  ]
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: t.textStrong, fontSize: 13.5 }}><ChemicalText value={candidate.displayName} /></strong>
        <span style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.45 }}><ChemicalText value={candidate.hydrothermalGate?.reason} /></span>
      </header>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        {rows.map(([field, label, value]) => (
          <div key={field} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 3, paddingTop: 7 }}>
            <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.4 }}>
              <ValueWithSource record={candidate} field={field} label={label} value={value} lang={lang} t={t} />
            </span>
          </div>
        ))}
      </div>
      {onInspectCandidate ? (
        <button
          type="button"
          onClick={() => onInspectCandidate(candidate)}
          style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 8, color: t.accentText, cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 34, padding: "7px 10px" }}
        >
          {text(lang, "查看候选决策", "View candidate decision")}
        </button>
      ) : null}
    </article>
  )
}

export function AlMofFrameworkRanking({ frameworks, selectedFramework, lang, t, isMobile, onInspectCandidate }) {
  const [selectedId, setSelectedId] = useState(selectedFramework?.id || frameworks?.[0]?.id)
  const selected = useMemo(() => (
    frameworks?.find(row => row.id === selectedId) || selectedFramework || frameworks?.[0]
  ), [frameworks, selectedFramework, selectedId])

  const topRows = (frameworks || []).slice(0, 12)
  const blockedHighPore = (frameworks || []).filter(row => (
    row.hydrothermalGate?.status !== "pass" && Number(row.surfaceArea) >= 1800
  )).slice(0, 5)

  return (
    <Panel
      id="organic-acid-final-framework-ranking"
      eyebrow={text(lang, "阶段 1", "Stage 1")}
      title={text(lang, "稳定 Al-MOF 骨架挖掘与排序表", "Stable Al-MOF Framework Mining / Al-MOF Ranking Table")}
      t={t}
    >
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.58, padding: 11 }}>
        <ChemicalText value={text(
          lang,
          "阶段 1 只筛 Al-MOF 稳定骨架。水热硬阈值先于 OACS 评分执行；缺少 >=150C 或反应后 PXRD 证据的候选被置为 OACS=0。",
          "Stage 1 screens only Al-MOF stable scaffolds. The hydrothermal hard gate runs before OACS scoring; candidates missing >=150C or post-treatment PXRD evidence are assigned OACS=0."
        )} />
      </div>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 1120, width: "100%" }}>
          <thead>
            <tr>
              {[text(lang, "名次", "Rank"), "MOF", text(lang, "来源", "Source"), text(lang, "水热门控", "Hydrothermal Gate"), "OACS", text(lang, "坍塌风险", "Collapse Risk"), text(lang, "孔道可达性", "Pore Accessibility"), text(lang, "证据等级", "Evidence Level"), text(lang, "推荐理由", "Why Recommended"), text(lang, "决策", "Decision")].map(label => (
                <th key={label} style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 10.5, fontWeight: 900, padding: "9px 8px", textAlign: "left", textTransform: "uppercase" }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topRows.map(row => (
              <tr key={row.id} onClick={() => setSelectedId(row.id)} style={{ cursor: "pointer" }}>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, fontWeight: 900, padding: "9px 8px" }}>{row.rank}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, fontWeight: 800, padding: "9px 8px" }}>
                  <ValueWithSource record={row} field="displayName" label="MOF" value={row.displayName} lang={lang} t={t} />
                </td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, padding: "9px 8px" }}>
                  <ValueWithSource record={row} field="sourceDatabase" label={text(lang, "来源", "Source")} value={row.sourceDatabase} lang={lang} t={t} />
                </td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, padding: "9px 8px" }}>
                  <StatusBadge tone={statusTone(row.hydrothermalGate?.status)} t={t}>{gateLabel(row.hydrothermalGate?.status, lang)}</StatusBadge>
                </td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, fontWeight: 900, padding: "9px 8px" }}>
                  <ValueWithSource record={row} field="OACS" label="OACS" value={formatScore(row.organicAcidScore?.oacs)} lang={lang} t={t} />
                </td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, padding: "9px 8px" }}>
                  <ValueWithSource record={row} field="collapseRisk" label={text(lang, "坍塌风险", "Collapse risk")} value={formatScore(row.organicAcidScore?.collapseRisk)} lang={lang} t={t} />
                </td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, padding: "9px 8px" }}>
                  <ValueWithSource record={row} field="poreAccessibility" label={text(lang, "孔道可达性", "Pore accessibility")} value={formatScore(row.descriptorScores?.poreAccessibility)} lang={lang} t={t} />
                </td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, padding: "9px 8px" }}>{displayValue(row.organicAcidScore?.evidenceLevel)}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.6, lineHeight: 1.45, padding: "9px 8px" }}>
                  <ChemicalText value={whyRecommended(row, lang)} />
                </td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, padding: "9px 8px" }}>
                  <button
                    type="button"
                    onClick={event => {
                      event.stopPropagation()
                      onInspectCandidate?.(row)
                    }}
                    style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 7, color: t.accentText, cursor: "pointer", fontSize: 11.5, fontWeight: 900, minHeight: 30, padding: "5px 8px" }}
                  >
                    {text(lang, "决策", "Decision")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DetailGrid candidate={selected} lang={lang} t={t} isMobile={isMobile} onInspectCandidate={onInspectCandidate} />

      {blockedHighPore.length ? (
        <article style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, display: "grid", gap: 7, padding: 12 }}>
          <strong style={{ color: t.warn, fontSize: 13 }}>{text(lang, "被硬阈值拦截的高孔结构候选", "High-pore candidates blocked by hard gate")}</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {blockedHighPore.map(row => (
              <StatusBadge key={row.id} tone="warn" t={t}>{`${row.displayName}: ${row.surfaceArea} m2/g, ${gateLabel(row.hydrothermalGate?.status, lang)}`}</StatusBadge>
            ))}
          </div>
        </article>
      ) : null}
    </Panel>
  )
}
