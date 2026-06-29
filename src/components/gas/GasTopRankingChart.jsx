// @ts-nocheck
import { useMemo, useState } from "react"
import { ChemicalText, FONT_SANS, SectionTitle, formatPercent, formatScore100 } from "../../shared"
import { getEvidenceScore, getStabilityScore } from "../../utils/gasScoring"
import { GasDataStatusBadge } from "./GasDataStatusBadge"
import { GasScoreBreakdown } from "./GasScoreBreakdown"
import {
  CONTRIBUTION_COLORS,
  metricDisplayValue,
  metricLabel,
  text,
} from "./gasViewUtils"

const SORT_OPTIONS = [
  ["GasScore", "GasScore", "GasScore"],
  ["primaryUptake", "Uptake", "吸附量"],
  ["selectivity", "Selectivity", "选择性"],
  ["workingCapacity", "Working capacity", "工作容量"],
  ["regenerability", "Regenerability", "可再生性"],
  ["stability", "Stability", "稳定性"],
  ["evidence", "Evidence confidence", "证据置信度"],
]

function scoreForSort(record, key) {
  if (key === "GasScore") return Number(record?.score || 0)
  if (key === "stability") return getStabilityScore(record)
  if (key === "evidence") return getEvidenceScore(record)
  return Number(record?.[key] || 0)
}

function Tooltip({ row, t, lang }) {
  if (!row) return null
  const breakdown = row.scoreBreakdown || {}
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 8, boxShadow: t.shadowMd, color: t.muted, fontSize: 11.5, lineHeight: 1.48, maxWidth: 300, padding: 10 }}>
      <strong style={{ color: t.textStrong, display: "block", fontSize: 12.5, marginBottom: 5 }}><ChemicalText value={row.displayName} /></strong>
      <div aria-label={text(lang, "GasScore 评分", "GasScore score")}>GasScore: {formatScore100(row.score, lang)}</div>
      <div>{metricLabel("uptake", lang)}: {formatPercent(breakdown.normalized?.uptake, { lang, normalized: true })}</div>
      <div>{metricLabel("selectivity", lang)}: {formatPercent(breakdown.normalized?.selectivity, { lang, normalized: true })}</div>
      <div>{metricLabel("workingCapacity", lang)}: {formatPercent(breakdown.normalized?.workingCapacity, { lang, normalized: true })}</div>
      <div>{metricLabel("stability", lang)}: {formatPercent(getStabilityScore(row), { lang, normalized: true })}</div>
      <div>{text(lang, "证据等级", "Evidence level")}: {row.evidenceLevel || "C"}</div>
      <div>{text(lang, "数据类型", "Data type")}: {row.dataType || "demo"}</div>
      <div>{text(lang, "主要风险", "Main risk")}: {(row.risks || [text(lang, "待补充", "pending")])[0]}</div>
    </div>
  )
}

function Explanation({ visible, lang, t }) {
  if (!visible.length) return null
  const top = visible[0]
  const highestSelectivity = [...visible].sort((a, b) => Number(b.selectivity || 0) - Number(a.selectivity || 0))[0]
  const drivers = top?.scoreBreakdown?.topDrivers?.slice(0, 2).join(" / ") || "working capacity / evidence confidence"
  return (
    <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 9, color: t.muted, fontSize: 12, lineHeight: 1.58, padding: 11 }}>
      {text(
        lang,
        `当前 Top ${visible.length} 候选中，${top.displayName} 的综合分数最高，主要优势来自 ${drivers}；${highestSelectivity.displayName} 的选择性最高，但综合分数仍受可再生性、证据等级或风险扣分约束。`,
        `Among the current Top ${visible.length} candidates, ${top.displayName} ranks highest because of ${drivers}. ${highestSelectivity.displayName} shows the highest selectivity, but its overall score remains limited by regenerability, evidence level, or risk penalty.`
      )}
    </div>
  )
}

export function GasTopRankingChart({
  ranked = [],
  selectedId,
  onSelect,
  rankingMode,
  setRankingMode,
  sortMetric,
  setSortMetric,
  t,
  lang,
  isMobile,
}) {
  const [limit, setLimit] = useState(5)
  const [hover, setHover] = useState(null)
  const sorted = useMemo(() => [...ranked].sort((a, b) => scoreForSort(b, sortMetric) - scoreForSort(a, sortMetric)), [ranked, sortMetric])
  const visible = sorted.slice(0, limit)
  const maxScore = Math.max(1, ...visible.map(row => Number(row.score || 0)))

  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, minWidth: 0 }}>
      <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
        <div>
          <SectionTitle>{text(lang, "Top 候选动态排序", "Top Candidates Interactive Ranking")}</SectionTitle>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
            {text(lang, "支持综合分数与分数贡献拆解两种模式；hover 查看依据，click 联动下方解释。", "Switch between overall score and contribution ranking; hover for rationale, click to update linked panels.")}
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {["overall", "contribution"].map(mode => (
            <button key={mode} type="button" onClick={() => setRankingMode(mode)} aria-label={mode === "overall" ? text(lang, "切换到综合分模式", "Switch to overall score mode") : text(lang, "切换到贡献拆解模式", "Switch to score contribution mode")} title={mode === "overall" ? text(lang, "综合分", "Overall Score") : text(lang, "贡献拆解", "Score Contribution")} style={{ minHeight: 40, background: rankingMode === mode ? t.badgeInfoBg : t.surface, border: `1px solid ${rankingMode === mode ? t.accent : t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", fontSize: 11.5, fontWeight: 850, padding: "7px 10px" }}>
              {mode === "overall" ? text(lang, "综合分", "Overall Score") : text(lang, "贡献拆解", "Score Contribution")}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "150px 190px minmax(0, 1fr)", marginTop: 12 }}>
        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>Top N</span>
          <select aria-label={text(lang, "选择 Top N 候选数量", "Select Top N candidates")} value={limit} onChange={event => setLimit(Number(event.target.value))} style={{ minHeight: 40, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, padding: "8px 10px" }}>
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>{text(lang, "排序依据", "Sort by")}</span>
          <select aria-label={text(lang, "选择 Top 候选排序指标", "Select top candidate sort metric")} value={sortMetric} onChange={event => setSortMetric(event.target.value)} style={{ minHeight: 40, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, padding: "8px 10px" }}>
            {SORT_OPTIONS.map(([key, en, zh]) => <option key={key} value={key}>{text(lang, zh, en)}</option>)}
          </select>
        </label>
        <div style={{ alignSelf: "end", color: t.subtle, fontSize: 11.5, lineHeight: 1.45 }}>
          {text(lang, "当前排序值：", "Current sort value: ")} {SORT_OPTIONS.find(([key]) => key === sortMetric)?.[lang === "zh" ? 2 : 1] || sortMetric}
        </div>
      </div>

      <div style={{ display: "grid", gap: 9, marginTop: 13, position: "relative" }} onMouseLeave={() => setHover(null)}>
        {!visible.length ? (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 12, padding: 12 }}>{text(lang, "当前场景无候选。", "No candidates for the current scenario.")}</div>
        ) : visible.map(row => {
          const selected = row.id === selectedId
          const score = Number(row.score || 0)
          const sortValue = sortMetric === "GasScore" ? formatScore100(row.score, lang) : metricDisplayValue(row, sortMetric, lang, ranked)
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onSelect(row.id)}
              onMouseEnter={() => setHover(row)}
              style={{
                background: selected ? t.badgeInfoBg : t.surface,
                border: `1px solid ${selected ? t.accent : t.border}`,
                borderRadius: 9,
                cursor: "pointer",
                display: "grid",
                gap: 8,
                gridTemplateColumns: isMobile ? "1fr" : "minmax(130px, 0.9fr) minmax(0, 2fr) 76px",
                minHeight: 58,
                padding: 10,
                textAlign: "left",
              }}
            >
              <span style={{ minWidth: 0 }}>
                <strong style={{ color: t.textStrong, display: "block", fontSize: 12.5, fontWeight: 920, overflowWrap: "anywhere" }}><ChemicalText value={row.displayName} /></strong>
                <span style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5 }}>
                  <GasDataStatusBadge type="dataType" value={row.dataType} lang={lang} />
                  <GasDataStatusBadge type="evidence" value={row.evidenceLevel} lang={lang} />
                </span>
              </span>
              {rankingMode === "overall" ? (
                <span style={{ alignSelf: "center", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, height: 12, overflow: "hidden" }}>
                  <span style={{ background: CONTRIBUTION_COLORS.uptake, display: "block", height: "100%", width: `${Math.max(4, (score / maxScore) * 100)}%` }} />
                </span>
              ) : (
                <span style={{ alignSelf: "center", display: "flex", overflow: "hidden", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, height: 14 }}>
                  {["uptake", "selectivity", "workingCapacity", "regenerability", "stability", "evidence"].map(key => {
                    const value = Number(row.scoreBreakdown?.contributions?.[key] || 0)
                    return <span key={key} title={key} style={{ background: CONTRIBUTION_COLORS[key], width: `${Math.max(2, value)}%` }} />
                  })}
                </span>
              )}
              <span style={{ alignSelf: "center", color: t.textStrong, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 900, textAlign: isMobile ? "left" : "right" }}>{sortValue}</span>
              {rankingMode === "contribution" ? (
                <span style={{ gridColumn: "1 / -1" }}>
                  <GasScoreBreakdown record={row} lang={lang} t={t} compact />
                </span>
              ) : null}
            </button>
          )
        })}
        {hover ? <div style={{ position: "absolute", right: 8, top: 8, zIndex: 4 }}><Tooltip row={hover} t={t} lang={lang} /></div> : null}
      </div>
      <div style={{ marginTop: 12 }}>
        <Explanation visible={visible} lang={lang} t={t} />
      </div>
    </section>
  )
}
