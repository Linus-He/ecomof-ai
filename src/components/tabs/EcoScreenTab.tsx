// @ts-nocheck
import { useMemo, useState } from "react"
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts"
import {
  useT, useLang, useViewport,
  FONT_MONO,
  BasisBadge, PageHeader, ResultLayer, Callout, CopyLinkButton, DisclaimerLink,
  toolbarBtn, InlineFormula,
  CRITIC_INDICATORS,
  buildCriticScoringModel,
  GlobalScoringWorkbench,
  getDataGapRecommendations,
  DEFAULT_CANDIDATE_DATA_MODE,
  useMofCandidates,
  GraphDescriptorPanel,
  OrganicAcidRelevancePanel,
} from "../../shared"
import { MofRationaleCard } from "../catalysis/MofRationaleCard"
import { ReactionFingerprintPanel } from "../catalysis/ReactionFingerprintPanel"
import { useMofReactionProfile } from "../catalysis/reactionRationaleData"

const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0))
const pct = value => `${Math.round(clamp01(value) * 100)}%`
const fmt = (value, digits = 3) => Number(value || 0).toFixed(digits)
const fmtPct = value => `${Math.round(clamp01(value) * 100)}%`
const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function labelStatus(status, lang) {
  if (!status) return "—"
  return lang === "zh" ? status.zh : status.label
}

function chartName(name, lang) {
  if (lang !== "zh") return name
  const labels = {
    "CRITIC weight": "CRITIC 权重",
    "active mode weight": "当前模式权重",
    "Performance Score": "性能分",
    "Sustainability Score": "可持续性分",
    "Evidence Score": "证据分",
  }
  return labels[name] || name
}

function Card({ children, style, t, as: Tag = "section" }) {
  return (
    <Tag style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: 14,
      minWidth: 0,
      ...style,
    }}>
      {children}
    </Tag>
  )
}

function PanelTitle({ title, subtitle, t }) {
  return (
    <div>
      <h3 style={{ margin: 0, color: t.textStrong, fontSize: 14, lineHeight: 1.25, fontWeight: 900 }}>{title}</h3>
      {subtitle && <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 4 }}>{subtitle}</div>}
    </div>
  )
}

function ScoreBar({ value, color, t }) {
  return (
    <div style={{ height: 7, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, overflow: "hidden" }}>
      <div style={{ height: "100%", width: pct(value), background: color || t.accentText, borderRadius: 999 }} />
    </div>
  )
}

function MetricCard({ label, value, note, t, tone = "info" }) {
  const toneColor = tone === "warn" ? t.warn : tone === "calc" ? t.success : tone === "proxy" ? t.amber : t.accentText
  return (
    <Card t={t} style={{ display: "grid", gap: 6, padding: 13 }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0 }}>{label}</div>
      <div style={{ color: toneColor, fontSize: 22, fontWeight: 920, lineHeight: 1.12, overflowWrap: "anywhere", wordBreak: "break-word" }}>{value}</div>
      {note && <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.35 }}>{note}</div>}
    </Card>
  )
}

function SegmentedControl({ items, value, onChange, lang, t }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {items.map(item => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            title={lang === "zh" ? item.zhDescription || item.description : item.description}
            style={{
              background: active ? t.badgeInfoBg : t.panel,
              border: `1px solid ${active ? t.accent : t.border}`,
              borderRadius: 7,
              color: active ? t.accentText : t.muted,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 850,
              lineHeight: 1.25,
              padding: "8px 10px",
              minHeight: 34,
            }}
          >
            {lang === "zh" ? item.zhLabel || item.label : item.label}
          </button>
        )
      })}
    </div>
  )
}

function ChartTooltip({ active, payload, label, t, lang }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, boxShadow: t.shadowSm, color: t.textStrong, fontSize: 11, lineHeight: 1.55 }}>
      <div style={{ color: t.textStrong, fontWeight: 900, marginBottom: 4 }}>{label || payload[0]?.payload?.name}</div>
      {payload.map(item => (
        <div key={`${item.dataKey}-${item.name}`} style={{ color: item.color || t.muted }}>
          {chartName(item.name || item.dataKey, lang)}: {Number.isFinite(Number(item.value)) ? fmt(item.value, 3) : item.value}
        </div>
      ))}
    </div>
  )
}

function ScoringMethodSummary({ model, weightingMode, onWeightingModeChange, lang, t, isMobile }) {
  const summary = model.methodSummary
  const activeMode = model.activeWeightingMode
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.2fr) minmax(320px, 0.8fr)", gap: 12 }}>
      <Card t={t} style={{ display: "grid", gap: 12 }}>
        <PanelTitle
          t={t}
          title={text(lang, "评分方法摘要 / Scoring Method Summary", "Scoring Method Summary")}
          subtitle={lang === "zh" ? "切换权重模式后，候选排序和候选详情会同步更新；诊断区仍保留 CRITIC 客观权重解释。" : "Changing the weighting mode updates ranking and candidate details; diagnostics still preserve the CRITIC objective-weight explanation."}
        />
        <SegmentedControl items={model.weightingModes} value={weightingMode} onChange={onWeightingModeChange} lang={lang} t={t} />
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65 }}>
          {lang === "zh" ? activeMode.zhDescription : activeMode.description}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          {CRITIC_INDICATORS.map(indicator => (
            <div key={indicator.key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10, display: "grid", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: t.faint, fontSize: 10.5, fontWeight: 850 }}>
                <span>{lang === "zh" ? indicator.zhLabel : indicator.label}</span>
                <span style={{ fontFamily: FONT_MONO }}>{indicator.symbol}</span>
              </div>
              <ScoreBar value={model.activeWeights[indicator.key]} t={t} />
              <div style={{ color: t.textStrong, fontFamily: FONT_MONO, fontSize: 11, textAlign: "right" }}>{fmt(model.activeWeights[indicator.key])}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr", gap: 10 }}>
        <MetricCard label={text(lang, "权重模式 / Weighting mode", "Weighting mode")} value={lang === "zh" ? summary.weightingModeZh : summary.weightingMode} note="CRITIC / Equal / Expert / Custom" t={t} />
        <MetricCard label={text(lang, "排名稳定性 / Ranking stability", "Ranking stability")} value={lang === "zh" ? summary.rankingStability.zh : summary.rankingStability.label} note={lang === "zh" ? "由权重对比和 remove-one 测试给出" : "From weighting comparison and remove-one tests"} tone={summary.rankingStability.tone} t={t} />
        <MetricCard label={text(lang, "候选数 / Candidates", "Candidates")} value={summary.candidateCount} note={lang === "zh" ? "含 G = 0 硬筛记录" : "includes G = 0 rows"} t={t} />
        <MetricCard label={text(lang, "指标数 / Indicators", "Indicators")} value={summary.indicatorCount} note="d_stab · d_barrier · d_select" t={t} />
        <MetricCard label={text(lang, "缺失比例 / Missing data", "Missing data")} value={fmtPct(summary.missingDataRatio)} note={lang === "zh" ? `${summary.missingData.missingCells}/${summary.missingData.totalCells} 个指标单元格` : `${summary.missingData.missingCells}/${summary.missingData.totalCells} indicator cells`} tone={summary.missingDataRatio > 0.1 ? "warn" : "calc"} t={t} />
        <MetricCard label={text(lang, "归一化 / Normalization", "Normalization")} value="0.01-1" note={lang === "zh" ? summary.normalizationMethodZh : summary.normalizationMethod} t={t} />
      </div>

      <Card t={t} style={{ gridColumn: isMobile ? "auto" : "1 / -1", display: "grid", gap: 7, background: t.surface }}>
        <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{text(lang, "Benefit / Cost 方向调整", "Benefit / Cost direction adjustment")}</div>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65 }}>
          {lang === "zh" ? summary.directionAdjustmentZh : summary.directionAdjustment}
        </div>
      </Card>
    </div>
  )
}

function WeightBarChart({ model, t, isMobile, lang }) {
  const data = CRITIC_INDICATORS.map(indicator => {
    const row = model.decomposition.find(item => item.key === indicator.key) || {}
    return {
      name: lang === "zh" ? indicator.zhLabel : indicator.shortLabel,
      label: indicator.label,
      weight: model.weights[indicator.key],
      activeWeight: model.activeWeights[indicator.key],
      sigma: row.sigma,
      conflict: row.conflict,
      information: row.information,
    }
  })
  return (
    <ResponsiveContainer width="100%" height={isMobile ? 230 : 255}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
        <XAxis dataKey="name" tick={{ fill: t.subtle, fontSize: 11 }} />
        <YAxis domain={[0, 1]} tick={{ fill: t.subtle, fontSize: 10 }} width={42} />
        <Tooltip content={<ChartTooltip t={t} lang={lang} />} />
        <Legend wrapperStyle={{ color: t.subtle, fontSize: 11 }} />
        <Bar dataKey="weight" name={text(lang, "CRITIC 权重", "CRITIC weight")} fill={t.accentText} radius={[4, 4, 0, 0]} />
        <Bar dataKey="activeWeight" name={text(lang, "当前模式权重", "active mode weight")} fill={t.badgeCalcText} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ConflictHeatmap({ model, lang, t }) {
  const [mode, setMode] = useState("conflict")
  const maxConflict = CRITIC_INDICATORS.flatMap(row => CRITIC_INDICATORS.map(col => model.conflictMatrix[row.key]?.[col.key] || 0)).reduce((max, value) => Math.max(max, value), 1)
  const cellBg = (value, isDiag) => {
    if (isDiag) return t.surface
    const ratio = mode === "conflict" ? clamp01(value / Math.max(1, maxConflict)) : clamp01((value + 1) / 2)
    if (ratio > 0.72) return t.badgeInfoBg
    if (ratio > 0.48) return t.badgeCalcBg
    return t.panel
  }
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <SegmentedControl
        items={[
          { id: "conflict", label: "Descriptor conflict", zhLabel: "指标冲突度", description: "Non-redundant information between descriptors.", zhDescription: "指标之间的非冗余信息。" },
          { id: "correlation", label: "correlation", zhLabel: "correlation 相关性", description: "Pearson correlation between indicators.", zhDescription: "指标之间的 Pearson 相关性。" },
        ]}
        value={mode}
        onChange={setMode}
        lang={lang}
        t={t}
      />
      <div style={{ display: "grid", gridTemplateColumns: "86px repeat(3, minmax(0, 1fr))", gap: 6 }}>
        <span />
        {CRITIC_INDICATORS.map(item => <span key={item.key} style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textAlign: "center" }}>{item.shortLabel}</span>)}
        {CRITIC_INDICATORS.flatMap(row => [
          <span key={`${row.key}-head`} style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, alignSelf: "center" }}>{row.shortLabel}</span>,
          ...CRITIC_INDICATORS.map(col => {
            const isDiag = row.key === col.key
            const value = mode === "conflict"
              ? model.conflictMatrix[row.key]?.[col.key] ?? 0
              : model.correlationMatrix[row.key]?.[col.key] ?? 0
            return (
              <span key={`${row.key}-${col.key}`} title={`${mode}: ${fmt(value, 3)}`} style={{ background: cellBg(value, isDiag), border: `1px solid ${t.border}`, borderRadius: 7, padding: "10px 6px", color: t.textStrong, fontFamily: FONT_MONO, fontSize: 11, textAlign: "center" }}>
                {fmt(value, 2)}
              </span>
            )
          }),
        ])}
      </div>
      <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55 }}>
        {lang === "zh"
          ? "指标冲突度越高，说明两个指标提供的排序信息越不重复；这会提高 CRITIC 权重中的非冗余贡献。"
          : "Higher descriptor conflict means less redundant ranking information between two descriptors, increasing the non-redundant contribution in CRITIC weighting."}
      </div>
    </div>
  )
}

function IndicatorDiagnostics({ model, lang, t, isMobile }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: isMobile ? 720 : 760, borderCollapse: "separate", borderSpacing: "0 7px" }}>
          <thead>
            <tr style={{ color: t.faint, fontSize: 10, textAlign: "left", textTransform: "uppercase" }}>
              <th style={{ padding: "0 10px" }}>{text(lang, "指标", "Indicator")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "权重", "Weight")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "标准差", "Standard deviation")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "差异度", "Contrast intensity")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "冲突度", "Conflict intensity")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "解释", "Interpretation")}</th>
            </tr>
          </thead>
          <tbody>
            {model.indicatorDiagnostics.map(row => (
              <tr key={row.key} style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
                <td style={{ padding: "10px", background: t.surface, borderRadius: "7px 0 0 7px", color: t.textStrong, fontWeight: 850 }}>{lang === "zh" ? row.zhLabel : row.label}</td>
                <td style={{ padding: "10px", background: t.surface, color: t.textStrong, fontFamily: FONT_MONO }}>{fmt(row.criticWeight)}</td>
                <td style={{ padding: "10px", background: t.surface, fontFamily: FONT_MONO }}>{fmt(row.standardDeviation)}</td>
                <td style={{ padding: "10px", background: t.surface, fontFamily: FONT_MONO }}>{fmt(row.contrastIntensity)}</td>
                <td style={{ padding: "10px", background: t.surface, fontFamily: FONT_MONO }}>{fmt(row.conflictIntensity)}</td>
                <td style={{ padding: "10px", background: t.surface, borderRadius: "0 7px 7px 0" }}>{lang === "zh" ? row.zhInterpretation : row.interpretation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        {model.indicatorDiagnostics.map(row => (
          <div key={`${row.key}-note`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? row.zhLabel : row.label}</div>
            <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 6 }}>
              {lang === "zh" ? row.zhDescription : row.description}
            </div>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 7 }}>
              {lang === "zh" ? row.zhInterpretation : row.interpretation}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WeightDiagnostics({ model, lang, t, isMobile }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(300px, 0.8fr)", gap: 12 }}>
        <Card t={t}>
          <PanelTitle
            t={t}
            title={text(lang, "CRITIC 权重概览", "CRITIC Weight Overview")}
            subtitle={lang === "zh" ? "蓝色为 CRITIC 客观权重；绿色为当前评分模式权重，用于判断 active ranking 是否偏离 CRITIC。" : "Blue shows objective CRITIC weights; gray shows the active scoring-mode weights."}
          />
          <WeightBarChart model={model} t={t} isMobile={isMobile} lang={lang} />
        </Card>
        <Card t={t}>
          <PanelTitle
            t={t}
            title={lang === "zh" ? "指标冲突热图" : "Indicator Conflict Heatmap"}
            subtitle={lang === "zh" ? "基于相关性矩阵展示指标间的信息重复和非冗余贡献。" : "Uses the descriptor correlation matrix to show redundancy and non-redundant information."}
          />
          <div style={{ marginTop: 12 }}>
            <ConflictHeatmap model={model} lang={lang} t={t} />
          </div>
        </Card>
      </div>
      <Card t={t}>
        <PanelTitle
          t={t}
          title={text(lang, "权重诊断 / Weight Diagnostics", "Weight Diagnostics")}
          subtitle={lang === "zh" ? "标准差表示候选物之间的区分度；冲突度表示指标之间的非冗余信息贡献。" : "Standard deviation represents contrast intensity across candidates; descriptor conflict represents non-redundant information across indicators."}
        />
        <div style={{ marginTop: 12 }}>
          <IndicatorDiagnostics model={model} lang={lang} t={t} isMobile={isMobile} />
        </div>
      </Card>
    </div>
  )
}

function CandidateRanking({ candidates, selectedId, onSelect, lang, t, isMobile }) {
  if (isMobile) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {candidates.map(candidate => {
          const active = candidate.id === selectedId
          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => onSelect(candidate.id)}
              style={{
                all: "unset",
                cursor: "pointer",
                background: active ? t.badgeInfoBg : t.panel,
                border: `1px solid ${active ? t.accent : t.border}`,
                borderRadius: 8,
                padding: 11,
                display: "grid",
                gap: 9,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: active ? t.accentText : t.textStrong, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 900 }}>{candidate.rank ? `#${candidate.rank}` : "—"}</div>
                  <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900, lineHeight: 1.25, marginTop: 3 }}>{candidate.name}</div>
                  <div style={{ color: t.faint, fontSize: 10.5, marginTop: 2 }}>{candidate.metalCenter} · {lang === "zh" ? candidate.evidenceSource.zh : candidate.evidenceSource.label}</div>
                </div>
                <span style={{ color: candidate.status.tone === "warn" ? t.warn : t.accentText, fontSize: 11, fontWeight: 850, textAlign: "right" }}>{labelStatus(candidate.status, lang)}</span>
              </div>
              <ScoreBar value={candidate.overallScore} t={t} color={candidate.status.tone === "warn" ? t.warn : t.accentText} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 7 }}>
                {[
                  [text(lang, "性能", "Performance"), candidate.performanceScore],
                  [text(lang, "可持续性", "Sustainability"), candidate.sustainabilityScore],
                  [text(lang, "证据", "Evidence"), candidate.evidenceScore],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: "7px 8px" }}>
                    <div style={{ color: t.faint, fontSize: 9.5, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
                    <div style={{ color: t.textStrong, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 850, marginTop: 4 }}>{fmt(value, 2)}</div>
                  </div>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 940, display: "grid", gap: 7 }}>
        <div style={{ display: "grid", gridTemplateColumns: "46px minmax(150px,1.2fr) 92px 92px 104px 86px 130px 110px 120px", gap: 10, color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", padding: "0 10px" }}>
          <span>{text(lang, "名次", "Rank")}</span><span>{text(lang, "候选材料", "Candidate")}</span><span>{text(lang, "综合分", "Overall")}</span><span>{text(lang, "性能", "Performance")}</span><span>{text(lang, "可持续性", "Sustainability")}</span><span>{text(lang, "证据", "Evidence")}</span><span>{text(lang, "完整度", "Completeness")}</span><span>{text(lang, "置信度", "Confidence")}</span><span>{text(lang, "状态", "Status")}</span>
        </div>
        {candidates.map(candidate => {
          const active = candidate.id === selectedId
          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => onSelect(candidate.id)}
              style={{
                all: "unset",
                cursor: "pointer",
                display: "grid",
                gridTemplateColumns: "46px minmax(150px,1.2fr) 92px 92px 104px 86px 130px 110px 120px",
                gap: 10,
                alignItems: "center",
                background: active ? t.badgeInfoBg : t.panel,
                border: `1px solid ${active ? t.accent : t.border}`,
                borderRadius: 8,
                padding: "10px",
              }}
            >
              <span style={{ color: active ? t.accentText : t.textStrong, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 900 }}>{candidate.rank ? `#${candidate.rank}` : "—"}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", color: t.textStrong, fontSize: 13, fontWeight: 900, overflowWrap: "anywhere" }}>{candidate.name}</span>
                <span style={{ display: "block", color: t.faint, fontSize: 10.5, marginTop: 2 }}>{candidate.metalCenter} · {lang === "zh" ? candidate.evidenceSource.zh : candidate.evidenceSource.label}</span>
              </span>
              {[candidate.overallScore, candidate.performanceScore, candidate.sustainabilityScore, candidate.evidenceScore].map((value, index) => (
                <span key={index} style={{ display: "grid", gap: 5 }}>
                  <span style={{ color: t.textStrong, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 850 }}>{fmt(value, 3)}</span>
                  <ScoreBar value={value} t={t} color={index === 0 ? t.accentText : t.badgeCalcText} />
                </span>
              ))}
              <span style={{ color: t.muted, fontSize: 11, fontWeight: 800 }}>{lang === "zh" ? candidate.descriptorCompleteness.zhLabel : candidate.descriptorCompleteness.label}</span>
              <span style={{ color: candidate.rankingConfidence.tone === "warn" ? t.warn : candidate.rankingConfidence.tone === "proxy" ? t.amber : t.accentText, fontSize: 11, fontWeight: 850 }}>
                {lang === "zh" ? candidate.rankingConfidence.zh : candidate.rankingConfidence.label}
              </span>
              <span style={{ color: candidate.status.tone === "warn" ? t.warn : t.accentText, fontSize: 11, fontWeight: 850 }}>{labelStatus(candidate.status, lang)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CandidateDetail({ candidate, lang, t, isMobile }) {
  const { profile } = useMofReactionProfile(candidate)
  if (!candidate) return null
  const gaps = getDataGapRecommendations(candidate)
  const scoreRows = [
    ["Overall Score", "综合分", candidate.overallScore],
    ["Performance Score", "性能分", candidate.performanceScore],
    ["Sustainability Score", "可持续性分", candidate.sustainabilityScore],
    ["Evidence Score", "证据分", candidate.evidenceScore],
  ]
  return (
    <Card t={t} style={{ display: "grid", gap: 13, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>
            {lang === "zh" ? "联动候选详情" : "Linked candidate detail"}
          </div>
          <h3 style={{ margin: "5px 0 0", color: t.textStrong, fontSize: 18, lineHeight: 1.15 }}>{candidate.name}</h3>
          <div style={{ color: t.faint, fontSize: 11.5, marginTop: 5 }}>{candidate.metalCenter} · {candidate.frameworkType} · {lang === "zh" ? candidate.evidenceSource.zh : candidate.evidenceSource.label}</div>
        </div>
        <BasisBadge tone={candidate.rankingConfidence.tone}>{lang === "zh" ? candidate.rankingConfidence.zh : candidate.rankingConfidence.label}</BasisBadge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        {scoreRows.map(([en, zh, value]) => (
          <div key={en} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10, display: "grid", gap: 6 }}>
            <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", fontWeight: 850 }}>{lang === "zh" ? zh : en}</div>
            <div style={{ color: t.textStrong, fontFamily: FONT_MONO, fontSize: 14, fontWeight: 900 }}>{fmt(value)}</div>
            <ScoreBar value={value} t={t} />
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
        {[
          [text(lang, "描述符完整度", "Descriptor completeness"), lang === "zh" ? candidate.descriptorCompleteness.zhLabel : candidate.descriptorCompleteness.label],
          [text(lang, "证据等级", "Evidence level"), candidate.evidenceLevel],
          [text(lang, "证据修正前综合评分", "Raw candidate score"), fmt(candidate.D_raw)],
          [text(lang, "证据修正后期望评分", "Evidence-corrected expected score"), fmt(candidate.D_expected)],
        ].map(([label, value]) => (
          <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10 }}>
            <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", fontWeight: 850 }}>{label}</div>
            <div style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.45, marginTop: 5, fontWeight: 820, overflowWrap: "anywhere" }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 7, padding: 11 }}>
        <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>
          {text(lang, "Expert-prior score, pending experimental calibration", "Expert-prior score, pending experimental calibration")}
        </div>
        <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55 }}>
          {text(
            lang,
            "这里解释候选优先级和路径假设，不输出 predicted yield 或 validated AI score。",
            "This explains candidate priority and pathway hypothesis; it does not output predicted yield or a validated AI score."
          )}
        </div>
      </div>

      <ReactionFingerprintPanel profile={profile} t={t} compact />
      <MofRationaleCard profile={profile} t={t} defaultOpen />

      <details open style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
        <summary style={{ color: t.textStrong, cursor: "pointer", fontSize: 12, fontWeight: 900 }}>
          {text(lang, "该候选为何排序靠前？/ 排序解释", "Why this candidate ranks high?")}
        </summary>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, marginTop: 9 }}>
          {lang === "zh" ? candidate.whyHigh.zh : candidate.whyHigh.en}
        </div>
        <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 8 }}>
          {lang === "zh"
            ? "解释对象是 ranking influence，不是化学因果机制；真实结论仍需实验、DFT 或文献证据闭环。"
            : "This explains ranking influence, not chemical causality; real conclusions still require experimental, DFT, or literature evidence closure."}
        </div>
      </details>

      <div style={{ display: "grid", gap: 7 }}>
        <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 880 }}>{lang === "zh" ? "下一步证据" : "Next evidence"}</div>
        {gaps.slice(0, 3).map(gap => (
          <div key={`${gap.limitation}-${gap.nextEvidence}`} style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, borderLeft: `3px solid ${gap.priority === "High" ? t.warn : t.accentText}`, paddingLeft: 9 }}>
            {gap.nextEvidence}
          </div>
        ))}
      </div>

      <GraphDescriptorPanel graphMetadata={candidate.candidate?.graphMetadata || candidate.graphMetadata} t={t} lang={lang} isMobile={isMobile} />
      <OrganicAcidRelevancePanel
        relevance={candidate.candidate?.organicAcidRelevance || candidate.organicAcidRelevance}
        candidate={candidate.candidate || candidate}
        t={t}
        lang={lang}
        isMobile={isMobile}
      />
    </Card>
  )
}

function sourceColor(source, t) {
  if (source?.label === "Experimental") return t.success
  if (source?.label === "Literature") return t.accentText
  if (source?.label === "Simulated") return t.amber
  return t.veryFaint
}

function QuadrantPoint(props) {
  const { cx, cy, payload, selectedId, onSelect, t } = props
  const active = payload.id === selectedId
  const radius = 5 + clamp01(payload.evidenceScore) * 7
  const fill = active ? t.accentText : sourceColor(payload.evidenceSource, t)
  const stroke = active ? t.textStrong : t.panel
  const common = { fill, stroke, strokeWidth: active ? 2.2 : 1.2, cursor: "pointer", onClick: () => onSelect(payload.id) }
  if (payload.evidenceSource?.label === "Literature") {
    return <rect x={cx - radius * 0.75} y={cy - radius * 0.75} width={radius * 1.5} height={radius * 1.5} transform={`rotate(45 ${cx} ${cy})`} rx={2} {...common} />
  }
  if (payload.evidenceSource?.label === "Simulated") {
    return <rect x={cx - radius} y={cy - radius} width={radius * 2} height={radius * 2} rx={3} {...common} />
  }
  if (payload.evidenceSource?.label === "Demo") {
    const points = `${cx},${cy - radius} ${cx + radius},${cy + radius} ${cx - radius},${cy + radius}`
    return <polygon points={points} {...common} />
  }
  return <circle cx={cx} cy={cy} r={radius} {...common} />
}

function QuadrantTooltip({ active, payload, t, lang }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, boxShadow: t.shadowSm, color: t.textStrong, fontSize: 11, lineHeight: 1.55 }}>
      <div style={{ fontWeight: 900, marginBottom: 4 }}>{row.name}</div>
      <div>{text(lang, "性能", "Performance")}: {fmt(row.performanceScore)}</div>
      <div>{text(lang, "可持续性", "Sustainability")}: {fmt(row.sustainabilityScore)}</div>
      <div>{text(lang, "证据", "Evidence")}: {fmt(row.evidenceScore)}</div>
      <div>{lang === "zh" ? row.evidenceSource.zh : row.evidenceSource.label}</div>
    </div>
  )
}

function PerformanceSustainabilityQuadrant({ candidates, selectedId, onSelect, lang, t, isMobile }) {
  const data = candidates.map(candidate => ({
    ...candidate,
    x: Number(candidate.sustainabilityScore.toFixed(3)),
    y: Number(candidate.performanceScore.toFixed(3)),
    z: Math.max(60, 320 * clamp01(candidate.evidenceScore)),
  }))
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <ResponsiveContainer width="100%" height={isMobile ? 310 : 380}>
        <ScatterChart margin={{ top: 18, right: 22, bottom: 28, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
          <XAxis type="number" dataKey="x" name={text(lang, "可持续性分", "Sustainability Score")} domain={[0, 1]} tick={{ fill: t.subtle, fontSize: 10 }} label={{ value: text(lang, "可持续性分", "Sustainability Score"), position: "insideBottom", offset: -16, fill: t.subtle, fontSize: 11 }} />
          <YAxis type="number" dataKey="y" name={text(lang, "性能分", "Performance Score")} domain={[0, 1]} tick={{ fill: t.subtle, fontSize: 10 }} width={42} label={{ value: text(lang, "性能分", "Performance Score"), angle: -90, position: "insideLeft", fill: t.subtle, fontSize: 11 }} />
          <ZAxis type="number" dataKey="z" range={[70, 520]} />
          <ReferenceLine x={0.65} stroke={t.borderStrong} strokeDasharray="4 4" />
          <ReferenceLine y={0.65} stroke={t.borderStrong} strokeDasharray="4 4" />
          <Tooltip content={<QuadrantTooltip t={t} lang={lang} />} />
          <Scatter data={data} shape={props => <QuadrantPoint {...props} selectedId={selectedId} onSelect={onSelect} t={t} />}>
            {data.map(candidate => <Cell key={candidate.id} fill={sourceColor(candidate.evidenceSource, t)} />)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        {[
          [text(lang, "高性能 / 高可持续性", "High performance / high sustainability"), lang === "zh" ? "优先复核证据闭环" : "priority for evidence closure"],
          [text(lang, "高性能 / 低可持续性", "High performance / low sustainability"), lang === "zh" ? "需审查稳定性或风险代价" : "review stability or risk burden"],
          [text(lang, "低性能 / 高可持续性", "Low performance / high sustainability"), lang === "zh" ? "可能适合低风险探索" : "possible low-risk exploration"],
          [text(lang, "低性能 / 低可持续性", "Low performance / low sustainability"), lang === "zh" ? "暂不优先" : "lower priority"],
        ].map(([title, body]) => (
          <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10 }}>
            <div style={{ color: t.textStrong, fontSize: 11.5, fontWeight: 900 }}>{title}</div>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45, marginTop: 4 }}>{body}</div>
          </div>
        ))}
      </div>
      <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55 }}>
        {lang === "zh"
          ? "点大小表示 Evidence Score；点形状/颜色表示 Experimental / Literature / Simulated / Demo 来源状态。点击候选点会联动候选详情。"
          : "Point size reflects Evidence Score; marker shape/color marks Experimental / Literature / Simulated / Demo source state. Click a point to update the candidate detail."}
      </div>
    </div>
  )
}

function RankComparisonChart({ model, selectedId, onSelect, lang, t, isMobile }) {
  const schemes = model.robustness.schemeRanks
  const visibleCandidates = model.candidates.filter(candidate => Number(candidate.G) !== 0).slice(0, 5)
  const lineData = schemes.map(scheme => {
    const point = { scheme: lang === "zh" ? scheme.zhLabel : scheme.label }
    visibleCandidates.forEach(candidate => {
      point[candidate.name] = Number.isFinite(scheme.ranks[candidate.id]) ? scheme.ranks[candidate.id] : null
    })
    return point
  })
  const maxRank = Math.max(3, model.candidates.filter(candidate => Number(candidate.G) !== 0).length)
  return (
    <ResponsiveContainer width="100%" height={isMobile ? 250 : 285}>
      <LineChart data={lineData} margin={{ top: 10, right: 14, left: 0, bottom: isMobile ? 36 : 42 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
        <XAxis dataKey="scheme" tick={{ fill: t.subtle, fontSize: isMobile ? 9 : 10 }} interval={0} angle={isMobile ? -28 : -18} textAnchor="end" height={isMobile ? 54 : 58} />
        <YAxis reversed domain={[1, maxRank]} tick={{ fill: t.subtle, fontSize: 10 }} width={42} />
        <Tooltip content={<ChartTooltip t={t} lang={lang} />} />
        {visibleCandidates.map((candidate, index) => (
          <Line
            key={candidate.id}
            type="monotone"
            dataKey={candidate.name}
            stroke={candidate.id === selectedId ? t.accentText : index % 2 ? t.badgeCalcText : t.subtle}
            strokeWidth={candidate.id === selectedId ? 3 : 1.7}
            dot={{ r: candidate.id === selectedId ? 4 : 3, cursor: "pointer" }}
            connectNulls
            onClick={() => onSelect(candidate.id)}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

function RemoveOneSensitivity({ model, selectedRemovalId, onSelectRemoval, lang, t, isMobile }) {
  const rows = model.robustness.removeOneRows
  const active = rows.find(row => row.removedId === selectedRemovalId) || rows[0]
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.15fr) minmax(260px, 0.85fr)", gap: 12 }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 620, borderCollapse: "separate", borderSpacing: "0 7px" }}>
          <thead>
            <tr style={{ color: t.faint, fontSize: 10, textAlign: "left", textTransform: "uppercase" }}>
              <th style={{ padding: "0 10px" }}>{text(lang, "移除候选", "Removed candidate")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "Top-3 保留", "Top-3 retained")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "最大位移", "Max shift")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "平均位移", "Mean shift")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "稳定性", "Stability")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const activeRow = row.removedId === active.removedId
              return (
                <tr key={row.removedId} onClick={() => onSelectRemoval(row.removedId)} style={{ cursor: "pointer", color: t.muted, fontSize: 12 }}>
                  <td style={{ padding: "10px", background: activeRow ? t.badgeInfoBg : t.surface, borderRadius: "7px 0 0 7px", color: t.textStrong, fontWeight: 850 }}>{row.removedName}</td>
                  <td style={{ padding: "10px", background: activeRow ? t.badgeInfoBg : t.surface, fontFamily: FONT_MONO }}>{fmtPct(row.retainedTop3)}</td>
                  <td style={{ padding: "10px", background: activeRow ? t.badgeInfoBg : t.surface, fontFamily: FONT_MONO }}>{fmt(row.maxShift, 0)}</td>
                  <td style={{ padding: "10px", background: activeRow ? t.badgeInfoBg : t.surface, fontFamily: FONT_MONO }}>{fmt(row.meanShift, 2)}</td>
                  <td style={{ padding: "10px", background: activeRow ? t.badgeInfoBg : t.surface, borderRadius: "0 7px 7px 0", color: row.stability === "Sensitive" ? t.warn : row.stability === "Moderate" ? t.amber : t.accentText, fontWeight: 850 }}>
                    {lang === "zh" ? row.zhStability : row.stability}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Card t={t} style={{ background: t.surface, display: "grid", gap: 9 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>{lang === "zh" ? "移除情景" : "Remove-one scenario"}</div>
        <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 920 }}>{active?.removedName}</div>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>
          {lang === "zh" ? "重新计算 CRITIC 权重后，当前 Top-3：" : "After recalculating CRITIC weights, current Top-3:"}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {(active?.top3 || []).map((id, index) => {
            const candidate = model.candidates.find(item => item.id === id)
            return (
              <div key={id} style={{ display: "flex", justifyContent: "space-between", gap: 8, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: "7px 9px", color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
                <span>#{index + 1}</span>
                <span>{candidate?.name || id}</span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function RankingRobustness({ model, selectedId, onSelect, lang, t, isMobile }) {
  const [selectedRemovalId, setSelectedRemovalId] = useState(model.robustness.removeOneRows[0]?.removedId)
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        <MetricCard label={text(lang, "Top-3 一致性", "Top-3 consistency")} value={fmtPct(model.robustness.top3Consistency)} note={lang === "zh" ? "CRITIC vs Equal vs Expert 的 Top-3 重合度" : "Top-3 overlap across CRITIC, Equal, and Expert"} t={t} tone={model.robustness.top3Consistency >= 0.84 ? "calc" : "proxy"} />
        <MetricCard label={text(lang, "Remove-one 最大位移", "Remove-one max shift")} value={fmt(model.robustness.maxRemoveOneShift, 0)} note={lang === "zh" ? "移除任一候选后最大名次变化" : "Largest rank shift after removing one candidate"} t={t} tone={model.robustness.maxRemoveOneShift >= 3 ? "warn" : "calc"} />
        <MetricCard label={text(lang, "稳定性徽标", "Stability badge")} value={lang === "zh" ? model.robustness.stability.zh : model.robustness.stability.label} note={lang === "zh" ? "Stable / Moderate / Sensitive" : "Stable / Moderate / Sensitive"} t={t} tone={model.robustness.stability.tone} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(300px, 0.72fr)", gap: 12 }}>
        <Card t={t}>
          <PanelTitle
            t={t}
            title={lang === "zh" ? "CRITIC vs Equal vs Expert 排名对比" : "CRITIC vs Equal vs Expert Ranking"}
            subtitle={lang === "zh" ? "线越平，说明候选对权重模式越不敏感。" : "Flatter lines indicate lower sensitivity to weighting mode."}
          />
          <RankComparisonChart model={model} selectedId={selectedId} onSelect={onSelect} lang={lang} t={t} isMobile={isMobile} />
        </Card>
        <Card t={t}>
          <PanelTitle t={t} title={text(lang, "Top-3 一致性", "Top-3 consistency")} />
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {model.robustness.top3Rows.map(row => (
              <div key={row.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 9 }}>
                <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? row.zhLabel : row.label}</div>
                <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 4 }}>
                  {row.top3.map((id, index) => {
                    const candidate = model.candidates.find(item => item.id === id)
                    return `${index + 1}. ${candidate?.name || id}`
                  }).join("  /  ")}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card t={t}>
        <PanelTitle
          t={t}
          title={text(lang, "Remove-one-candidate 敏感性测试", "Remove-one-candidate sensitivity test")}
          subtitle={lang === "zh" ? "逐个移除候选并重新计算 CRITIC 权重，观察排序是否由单个样本主导。" : "Remove each candidate, recompute CRITIC weights, and check whether rank order is dominated by one sample."}
        />
        <div style={{ marginTop: 12 }}>
          <RemoveOneSensitivity model={model} selectedRemovalId={selectedRemovalId} onSelectRemoval={setSelectedRemovalId} lang={lang} t={t} isMobile={isMobile} />
        </div>
      </Card>
    </div>
  )
}

function EvidenceNotes({ lang, t, isMobile }) {
  const notes = lang === "zh"
    ? [
      ["证据边界", "本页 ranking 表示候选优先级，不代表真实催化性能结论。"],
      ["权重限制", "CRITIC 权重来自当前候选集的差异度与冲突度，解释 ranking influence，不解释 causal mechanism。"],
      ["缺失数据", "缺失描述符采用中性不确定性得分处理；缺失不等于材料失败。"],
      ["小样本敏感性", "候选数较少时，新增或删除样本可能改变标准差、相关性和客观权重。"],
      ["证据异质性", "文献、DFT、实验和 inferred evidence 的可比性不同，必须在后续验证中分层处理。"],
    ]
    : [
      ["Evidence boundary", "Ranking means candidate priority, not validated catalytic performance."],
      ["Weight limitation", "CRITIC weights come from contrast and conflict in this candidate set; they explain ranking influence, not causal mechanism."],
      ["Missing data", "Missing descriptors are handled with a neutral uncertainty score; missing data is not treated as material failure."],
      ["Small sample sensitivity", "With small samples, adding or removing candidates may change standard deviation, correlation, and objective weights."],
      ["Evidence heterogeneity", "Literature, DFT, experiment, and inferred evidence are not equally comparable and need layered validation."],
    ]
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))", gap: 8 }}>
      {notes.map(([title, body]) => (
        <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{title}</div>
          <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 6 }}>{body}</div>
        </div>
      ))}
    </div>
  )
}

export function EcoScreenTab({ onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [scoringMode, setScoringMode] = useState("general")
  const [weightingMode, setWeightingMode] = useState("critic")
  const [selectedId, setSelectedId] = useState("MOF-B")
  const {
    candidates: generalRows,
    status: generalStatus,
    mode: globalCandidateMode,
  } = useMofCandidates(DEFAULT_CANDIDATE_DATA_MODE)
  const model = useMemo(
    () => buildCriticScoringModel(generalRows, weightingMode),
    [generalRows, weightingMode],
  )
  const selectedCandidate = useMemo(() => (
    model.candidates.find(candidate => candidate.id === selectedId) || model.candidates[0]
  ), [model, selectedId])
  const scored = model.candidates.filter(candidate => Number(candidate.G) !== 0)
  const excluded = model.candidates.filter(candidate => Number(candidate.G) === 0)
  const topCandidate = scored[0]

  const openMethodology = () => {
    if (onNavigate) onNavigate("methodology")
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        document.getElementById("critic-methodology-decision-support")?.scrollIntoView({ block: "start", behavior: "smooth" })
      }, 180)
    }
  }
  const openGraphMethodology = () => {
    if (onNavigate) onNavigate("graph-informed-descriptor-integration")
    else if (typeof window !== "undefined") window.location.assign("#graph-informed-descriptor-integration")
  }
  const openOrganicGraph = () => {
    if (onNavigate) onNavigate("organic-acid-graph-explorer")
    else if (typeof window !== "undefined") window.location.assign("#organic-acid-graph-explorer")
  }

  return (
    <div id="candidate-scoring-lab" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={text(lang, "候选评分 / EcoScreen", "EcoScreen / Candidate Scoring")}
        subtitle={lang === "zh"
          ? "默认展示通用 MOF 全局评分工作台，formate CRITIC 作为 case study 保留。"
          : "Defaults to the general MOF global scoring workbench, with the formate CRITIC case retained as a case study."}
        meta={lang === "zh"
          ? "全局描述符评分、CRITIC / Hybrid 权重、解释诊断与证据边界"
          : "Global descriptor scoring, CRITIC / Hybrid weighting, explanation diagnostics, and evidence boundaries"}
        action={
          <>
            <BasisBadge tone="proxy">{text(lang, "Open MOF Seed / 全局候选源", "Open MOF Seed / global source")}</BasisBadge>
            <CopyLinkButton hash="ecoscreen" ariaLabel={lang === "zh" ? "复制 EcoScreen 链接" : "Copy EcoScreen link"} />
          </>
        }
      />

      <Callout tone="info">
        {lang === "zh"
          ? "本模块用于早期候选优先级判断，不用于输出甲酸产物结果；结果应作为研究假设与复核线索。"
          : "This module supports early-stage candidate prioritization, not direct formate-yield output. 本模块用于早期候选优先级判断，不用于输出甲酸产物结果。"}{" "}
        <DisclaimerLink />
      </Callout>
      <Callout tone="warn">
        {lang === "zh"
          ? "当前全局候选数据源为 Open MOF Seed。部分记录缺少 CO₂ 吸附量、水稳定性、毒性或有机酸证据字段，当前筛选结果仅作为临时优先级参考。"
          : "Current global candidate source: Open MOF Seed. Some records lack CO₂ uptake, water stability, toxicity, or organic-acid evidence fields. Current screening results are provisional."}
      </Callout>
      <Callout tone="info">
        {lang === "zh"
          ? `当前全局候选数据源：Open MOF Seed · 已加载记录：${generalRows.length} 条 · 已接入模块：MOF Library / EcoScreen / Organic Acid Project。`
          : `Current global candidate source: Open MOF Seed · Records loaded: ${generalRows.length} · Used by: MOF Library / EcoScreen / Organic Acid Project.`}
      </Callout>

      <Card t={t} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900 }}>
            {text(lang, "How descriptors are connected", "How descriptors are connected")}
          </div>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, marginTop: 5, maxWidth: 760 }}>
            {text(
              lang,
              "查看图论辅助关系图：传统描述符、metal node / linker / functional group、active motif、evidence modifier 和 final score 如何连接。",
              "Open the graph-informed relationship network for traditional descriptors, metal node / linker / functional group, active motif, evidence modifier, and final score."
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={openGraphMethodology} style={{ ...toolbarBtn(t), color: t.accentText, borderColor: t.accent, justifyContent: "center" }}>
            {text(lang, "打开图论方法图", "Open graph method")}
          </button>
          <button type="button" onClick={openOrganicGraph} style={{ ...toolbarBtn(t), justifyContent: "center" }}>
            {text(lang, "View organic acid relevance", "View organic acid relevance")}
          </button>
        </div>
      </Card>

      <Card t={t} style={{ display: "grid", gap: 10 }}>
        <PanelTitle
          t={t}
          title={text(lang, "评分模式", "Scoring mode")}
          subtitle={text(
            lang,
            "默认使用全局 MOF 描述符评分；formate CRITIC case 作为催化 case study 保留。",
            "Default mode uses the global MOF descriptor scoring engine; the formate CRITIC case remains as a catalysis case study."
          )}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { id: "general", zh: "General MOF Scoring", en: "General MOF Scoring" },
            { id: "formate", zh: "Formate CRITIC Case", en: "Formate CRITIC Case" },
          ].map(item => {
            const active = scoringMode === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setScoringMode(item.id)}
                style={{
                  ...toolbarBtn(t),
                  background: active ? t.badgeInfoBg : t.panel,
                  borderColor: active ? t.accent : t.border,
                  color: active ? t.accentText : t.muted,
                }}
              >
                {lang === "zh" ? item.zh : item.en}
              </button>
            )
          })}
        </div>
      </Card>

      {scoringMode === "general" && (
        <GlobalScoringWorkbench
          candidates={generalRows}
          dataMode={globalCandidateMode}
          lang={lang}
          t={t}
          isMobile={isMobile}
          status={generalStatus}
          number="01"
          title={text(lang, "General MOF Scoring Workbench / 通用 MOF 评分工作台", "General MOF Scoring Workbench")}
          subtitle={text(
            lang,
            "EcoScreen 复用全局评分工作台；descriptor registry、权重方法、候选解释和诊断统一来自 createScoringModel。",
            "EcoScreen reuses the global scoring workbench; descriptor registry, weighting methods, candidate explanations, and diagnostics all come from createScoringModel."
          )}
        />
      )}

      {scoringMode === "formate" && (
      <>
      <ResultLayer number="01" title={text(lang, "Formate CRITIC Case / 权重概览", "Formate CRITIC Case / Weight Overview")} subtitle={lang === "zh" ? "展示稳定性、反应能垒、选择性代理、证据修正和可行性门控如何共同形成候选优先级。" : "Shows how stability, reaction-barrier proxy, selectivity proxy, evidence correction, and feasibility gating form candidate priority."}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.25fr) minmax(360px, 0.75fr)", gap: 12, alignItems: "stretch" }}>
            <Card t={t} style={{ display: "grid", gap: 10 }}>
              <div style={{ color: t.textStrong, fontSize: isMobile ? 20 : 24, lineHeight: 1.08, fontWeight: 940 }}>
                {text(lang, "候选评分实验台", "Candidate Scoring Lab")}
              </div>
              <div style={{ color: t.textStrong, fontSize: isMobile ? 16 : 18, lineHeight: 1.2, fontWeight: 860 }}>
                候选材料多指标决策支持面板
              </div>
              <div style={{ color: t.muted, fontSize: 13, lineHeight: 1.65, maxWidth: 860 }}>
                {lang === "zh"
                  ? "面板将 CRITIC 权重、指标诊断、候选排名、稳健性测试和证据限制放在同一解释链路中。"
                  : "The panel connects CRITIC weights, indicator diagnostics, candidate ranking, robustness testing, and evidence limitations in one explanation chain."}
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: t.faint, fontSize: 11 }}>
                <InlineFormula math={"D_{\\mathrm{expected}}=D_{\\mathrm{raw}}\\times Q"} fallback="D_expected = D_raw × Q" />
                <InlineFormula math={"C_j=\\sigma_j\\sum_{k=1}^{m}(1-r_{jk})"} fallback="C_j = σ_j Σ(1-r_jk)" />
                <InlineFormula math={"w_j=\\frac{C_j}{\\sum_{j=1}^{m}C_j}"} fallback="w_j = C_j / ΣC_j" />
              </div>
            </Card>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              <MetricCard label={text(lang, "候选总数 / Total candidates", "Total candidates")} value={model.candidates.length} note={text(lang, "种子记录集", "seed record set")} t={t} />
              <MetricCard label={text(lang, "已评分候选 / Scored candidates", "Scored candidates")} value={scored.length} note={text(lang, "通过可行性门控", "passed feasibility gate")} t={t} />
              <MetricCard label={text(lang, "已门控排除 / Excluded", "Excluded")} value={excluded.length} note={text(lang, "未通过可行性门控", "failed feasibility gate")} t={t} tone={excluded.length ? "warn" : "calc"} />
              <MetricCard label={text(lang, "当前最高优先级候选 / Top candidate", "Top candidate")} value={topCandidate?.name || "—"} note={topCandidate ? `${text(lang, "证据修正后期望评分", "evidence-corrected score")} ${fmt(topCandidate.D_expected)}` : ""} t={t} />
            </div>
          </div>
          <ScoringMethodSummary model={model} weightingMode={weightingMode} onWeightingModeChange={setWeightingMode} lang={lang} t={t} isMobile={isMobile} />
        </div>
      </ResultLayer>

      <ResultLayer number="02" title={text(lang, "指标权重诊断 / Weight Diagnostics", "Weight Diagnostics")} subtitle={lang === "zh" ? "CRITIC 权重、指标冲突热图、标准差 / contrast intensity 和每个指标的解释文本。" : "CRITIC weights, conflict heatmap, standard deviation / contrast intensity, and per-indicator interpretation."}>
        <WeightDiagnostics model={model} lang={lang} t={t} isMobile={isMobile} />
      </ResultLayer>

      <ResultLayer number="03" title={text(lang, "候选排序 / Candidate Ranking", "Candidate Ranking")} subtitle={lang === "zh" ? "候选卡片展示 Overall、Performance、Sustainability、Evidence、descriptor completeness、ranking confidence 和可展开解释。" : "Candidate rows include Overall, Performance, Sustainability, Evidence, descriptor completeness, ranking confidence, and expandable rationale."}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.38fr) minmax(340px, 0.82fr)", gap: 12, alignItems: "stretch" }}>
          <Card t={t}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", marginBottom: 12, flexWrap: "wrap" }}>
              <PanelTitle t={t} title={text(lang, "MOF 候选排序", "MOF Candidate Ranking")} subtitle={lang === "zh" ? "点击候选行会联动详情和四象限图。" : "Click a row to update the detail panel and quadrant chart."} />
              <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>
                {text(lang, "当前模式：", "active mode: ")}{lang === "zh" ? model.activeWeightingMode.zhLabel : model.activeWeightingMode.label}
              </span>
            </div>
            <div style={{ color: t.subtle, fontSize: 11.5, lineHeight: 1.55, marginBottom: 10 }}>
              {lang === "zh"
                ? "该分数用于方法展示和候选优先级解释，不代表该 MOF 的真实性能结论。"
                : "This score supports method demonstration and candidate-priority explanation; it is not a validated performance conclusion for the MOF."}
            </div>
            <CandidateRanking candidates={model.candidates} selectedId={selectedCandidate?.id} onSelect={setSelectedId} lang={lang} t={t} isMobile={isMobile} />
          </Card>
          <CandidateDetail candidate={selectedCandidate} lang={lang} t={t} isMobile={isMobile} />
        </div>
      </ResultLayer>

      <ResultLayer number="04" title={text(lang, "性能 vs 可持续性四象限图", "Performance vs Sustainability Quadrant")} subtitle={lang === "zh" ? "x-axis: Sustainability Score；y-axis: Performance Score；点大小: Evidence Score；点形状/颜色: source state。" : "x-axis: Sustainability Score; y-axis: Performance Score; point size: Evidence Score; marker: source state."}>
        <Card t={t}>
          <PerformanceSustainabilityQuadrant candidates={model.candidates} selectedId={selectedCandidate?.id} onSelect={setSelectedId} lang={lang} t={t} isMobile={isMobile} />
        </Card>
      </ResultLayer>

      <ResultLayer number="05" title={text(lang, "排名稳健性 / Ranking Robustness", "Ranking Robustness")} subtitle={lang === "zh" ? "CRITIC vs Equal Weight vs Expert Preset、Top-3 consistency、remove-one-candidate sensitivity test。" : "CRITIC vs Equal Weight vs Expert Preset, Top-3 consistency, and remove-one-candidate sensitivity."}>
        <RankingRobustness model={model} selectedId={selectedCandidate?.id} onSelect={setSelectedId} lang={lang} t={t} isMobile={isMobile} />
      </ResultLayer>

      <ResultLayer number="06" title={text(lang, "证据与限制说明 / Evidence and Limitation Notes", "Evidence and Limitation Notes")}>
        <EvidenceNotes lang={lang} t={t} isMobile={isMobile} />
      </ResultLayer>

      <ResultLayer number="07" title={text(lang, "方法论入口 / Methodology Link", "Methodology Link")}>
        <Card t={t} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900 }}>{text(lang, "CRITIC-MCDA 决策支持方法论", "CRITIC-MCDA Decision Support Methodology")}</div>
            <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, marginTop: 5 }}>
              {lang === "zh"
                ? "查看 CRITIC 公式、contrast intensity、conflict intensity、objective weight、因果边界和 limitations。"
                : "Open CRITIC formulas, contrast intensity, conflict intensity, objective weight, causal boundary, and limitations."}
            </div>
          </div>
          <button type="button" onClick={openMethodology} style={{ ...toolbarBtn(t), color: t.accentText, borderColor: t.accent, justifyContent: "center" }}>
            {lang === "zh" ? "打开方法论说明" : "Open Methodology"}
          </button>
        </Card>
      </ResultLayer>
      </>
      )}
    </div>
  )
}
