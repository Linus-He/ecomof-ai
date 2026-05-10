import { useMemo, useState } from "react"
import {
  useT, useLang, useViewport,
  FONT_MONO,
  BasisBadge, PageHeader, ResultLayer, Callout, CopyLinkButton, DisclaimerLink,
  toolbarBtn,
  CRITIC_INDICATORS,
  buildCriticScoringModel,
  computeCriticWeights,
  computeCandidateScores,
  computeSensitivityRanks,
  getDataGapRecommendations,
} from "../../shared"

const pct = value => `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`
const fmt = (value, digits = 3) => Number(value || 0).toFixed(digits)

function labelStatus(status, lang) {
  return lang === "zh" ? status.zh : status.label
}

function Card({ children, style, t }) {
  return (
    <section style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: 14,
      minWidth: 0,
      ...style,
    }}>
      {children}
    </section>
  )
}

function MetricCard({ label, value, note, t }) {
  return (
    <Card t={t} style={{ display: "grid", gap: 6, padding: 13 }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0 }}>{label}</div>
      <div style={{ color: t.textStrong, fontSize: 22, fontWeight: 920, lineHeight: 1.12, overflowWrap: "anywhere", wordBreak: "break-word" }}>{value}</div>
      {note && <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.35 }}>{note}</div>}
    </Card>
  )
}

function ScoreBar({ value, color, t }) {
  return (
    <div style={{ height: 7, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, overflow: "hidden" }}>
      <div style={{ height: "100%", width: pct(value), background: color || t.accentText, borderRadius: 999 }} />
    </div>
  )
}

function IndicatorRow({ label, value, t, isMobile }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0, 1fr) 44px" : "116px minmax(0, 1fr) 44px", alignItems: "center", gap: isMobile ? 6 : 9 }}>
      <div style={{ gridColumn: isMobile ? "1 / -1" : "auto", color: t.muted, fontSize: 11, fontWeight: 800, overflowWrap: "anywhere" }}>{label}</div>
      <ScoreBar value={value} t={t} />
      <div style={{ color: t.textStrong, fontSize: 11, fontFamily: FONT_MONO, textAlign: "right" }}>{fmt(value, 2)}</div>
    </div>
  )
}

function findMainWeakness(candidate, lang) {
  if (!candidate) return "—"
  if (Number(candidate.G) === 0) return candidate.exclusionReason || (lang === "zh" ? "硬筛排除" : "Hard-screen exclusion")
  const scores = [
    [candidate.d_stab_clipped, lang === "zh" ? "170 ℃水相稳定性较弱" : "weaker 170 C aqueous stability"],
    [candidate.d_barrier_clipped, lang === "zh" ? "产甲酸关键能垒证据不足" : "formate-step barrier evidence is weak"],
    [candidate.d_select_clipped, lang === "zh" ? "副产物路径风险偏高" : "byproduct-path risk remains high"],
  ]
  const [value, label] = scores.sort((a, b) => Number(a[0]) - Number(b[0]))[0]
  if (Number(value) >= 0.7 && Number(candidate.confidence_Q) < 0.7) {
    return lang === "zh" ? "证据置信度限制排序解释" : "evidence confidence limits interpretation"
  }
  return label
}

function RankingList({ candidates, selectedId, onSelect, lang, t, isMobile }) {
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
                display: "grid",
                gap: 9,
                padding: 11,
                background: active ? t.badgeInfoBg : t.surface,
                border: `1px solid ${active ? t.accent : t.border}`,
                borderRadius: 8,
                boxShadow: active ? t.shadowSm : "none",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: active ? t.accentText : t.textStrong, fontSize: 12, fontWeight: 900, fontFamily: FONT_MONO }}>
                    {candidate.rank ? `#${candidate.rank}` : "—"}
                  </div>
                  <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900, lineHeight: 1.25, marginTop: 3, overflowWrap: "anywhere" }}>{candidate.name}</div>
                  <div style={{ color: t.faint, fontSize: 10.5, marginTop: 3 }}>{candidate.metalCenter} · demo / illustrative</div>
                </div>
                <span style={{ color: candidate.status.tone === "warn" ? t.warn : t.accentText, fontSize: 11, fontWeight: 850, lineHeight: 1.25, textAlign: "right", maxWidth: 150 }}>
                  {labelStatus(candidate.status, lang)}
                </span>
              </div>
              <div style={{ display: "grid", gap: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, color: t.faint, fontSize: 10.5, fontWeight: 850 }}>
                  <span>D_expected</span>
                  <span style={{ color: t.textStrong, fontFamily: FONT_MONO }}>{fmt(candidate.D_expected)}</span>
                </div>
                <ScoreBar value={candidate.D_expected} t={t} color={candidate.status.tone === "warn" ? t.warn : t.accentText} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 7 }}>
                {[
                  ["D_raw", fmt(candidate.D_raw)],
                  ["Q / confidence_Q", fmt(candidate.confidence_Q_clipped)],
                  ["Evidence", candidate.evidenceLevel],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: "7px 8px", minWidth: 0 }}>
                    <div style={{ color: t.faint, fontSize: 9.5, fontWeight: 850, textTransform: "uppercase", overflowWrap: "anywhere" }}>{label}</div>
                    <div style={{ color: t.textStrong, fontSize: 11, fontWeight: 850, fontFamily: label === "Evidence" ? undefined : FONT_MONO, marginTop: 4, overflowWrap: "anywhere" }}>{value}</div>
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
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: isMobile ? 720 : 0, display: "grid", gap: 7 }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "48px minmax(140px, 1.25fr) minmax(140px, 1.35fr) 82px 82px 90px minmax(135px, 0.9fr)",
            gap: 10,
            color: t.faint,
            fontSize: 10,
            fontWeight: 850,
            textTransform: "uppercase",
            padding: "0 10px",
          }}>
            <span>Rank</span><span>MOF name</span><span>D_expected</span><span>D_raw</span><span>Q / confidence_Q</span><span>Evidence level</span><span>Status</span>
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
                  gridTemplateColumns: "48px minmax(140px, 1.25fr) minmax(140px, 1.35fr) 82px 82px 90px minmax(135px, 0.9fr)",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px",
                  background: active ? t.badgeInfoBg : t.surface,
                  border: `1px solid ${active ? t.accent : t.border}`,
                  borderRadius: 8,
                  boxShadow: active ? t.shadowSm : "none",
                }}
              >
                <span style={{ color: active ? t.accentText : t.textStrong, fontSize: 12, fontWeight: 900, fontFamily: FONT_MONO }}>
                  {candidate.rank ? `#${candidate.rank}` : "—"}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ color: t.textStrong, fontSize: 13, fontWeight: 900, overflowWrap: "anywhere" }}>{candidate.name}</span>
                  <span style={{ display: "block", color: t.faint, fontSize: 10.5, marginTop: 3 }}>{candidate.metalCenter} · demo / illustrative</span>
                </span>
                <span style={{ display: "grid", gap: 5 }}>
                  <span style={{ color: t.textStrong, fontSize: 13, fontWeight: 900, fontFamily: FONT_MONO }}>{fmt(candidate.D_expected)}</span>
                  <ScoreBar value={candidate.D_expected} t={t} color={candidate.status.tone === "warn" ? t.warn : t.accentText} />
                </span>
                <span style={{ color: t.textStrong, fontSize: 12, fontFamily: FONT_MONO }}>{fmt(candidate.D_raw)}</span>
                <span style={{ color: t.textStrong, fontSize: 12, fontFamily: FONT_MONO }}>{fmt(candidate.confidence_Q_clipped)}</span>
                <span style={{ color: t.muted, fontSize: 12, fontWeight: 800 }}>{candidate.evidenceLevel}</span>
                <span style={{ color: candidate.status.tone === "warn" ? t.warn : t.accentText, fontSize: 11, fontWeight: 850, lineHeight: 1.25 }}>
                  {labelStatus(candidate.status, lang)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SelectedCandidateExplanation({ candidate, lang, t, isMobile }) {
  if (!candidate) return null
  const nextGaps = getDataGapRecommendations(candidate)
  return (
    <Card t={t} style={{ display: "grid", gap: 13, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>
            {lang === "zh" ? "选中候选解释" : "Selected Candidate Explanation"}
          </div>
          <h3 style={{ margin: "5px 0 0", color: t.textStrong, fontSize: 18, lineHeight: 1.15 }}>{candidate.name}</h3>
        </div>
        <BasisBadge tone={candidate.status.tone}>{labelStatus(candidate.status, lang)}</BasisBadge>
      </div>

      <div style={{ display: "grid", gap: 9 }}>
        <IndicatorRow label="Stability / d_stab" value={candidate.d_stab_clipped} t={t} isMobile={isMobile} />
        <IndicatorRow label="Barrier / d_barrier" value={candidate.d_barrier_clipped} t={t} isMobile={isMobile} />
        <IndicatorRow label="Byproduct-risk / d_select" value={candidate.d_select_clipped} t={t} isMobile={isMobile} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
        {[
          [lang === "zh" ? "证据等级" : "Evidence level", candidate.evidenceLevel],
          [lang === "zh" ? "证据置信度 / Q" : "Evidence confidence / Q", fmt(candidate.confidence_Q_clipped)],
          [lang === "zh" ? "硬筛结果" : "Hard screen", Number(candidate.G) === 0 ? (lang === "zh" ? "未通过" : "Failed") : (lang === "zh" ? "通过" : "Passed")],
          ["D_raw", fmt(candidate.D_raw)],
          ["D_expected", fmt(candidate.D_expected)],
        ].map(([label, value]) => (
          <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10 }}>
            <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", fontWeight: 850 }}>{label}</div>
            <div style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.45, marginTop: 5, fontWeight: 820, overflowWrap: "anywhere" }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 880 }}>{lang === "zh" ? "指标数据状态" : "Indicator data state"}</div>
        {CRITIC_INDICATORS.map(indicator => {
          const input = candidate.scoreInputs?.[indicator.key]
          return (
            <div key={indicator.key} style={{ display: "flex", justifyContent: "space-between", gap: 8, color: t.muted, fontSize: 11.5, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: "7px 9px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 850 }}>{indicator.label}</span>
              <span style={{ color: input?.missing || input?.trueZero ? t.warn : t.faint }}>{input?.inputState || "reported"}</span>
            </div>
          )
        })}
      </div>

      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
        <strong style={{ color: t.textStrong }}>{lang === "zh" ? "主要限制：" : "Main limitation: "}</strong>
        {findMainWeakness(candidate, lang)}
      </div>

      <div style={{ display: "grid", gap: 7 }}>
        <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 880 }}>{lang === "zh" ? "下一步证据" : "Next data needed"}</div>
        {nextGaps.slice(0, 2).map(gap => (
          <div key={`${gap.limitation}-${gap.nextEvidence}`} style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, borderLeft: `3px solid ${gap.priority === "High" ? t.warn : t.accentText}`, paddingLeft: 9 }}>
            {gap.nextEvidence}
          </div>
        ))}
      </div>
    </Card>
  )
}

function WeightsPanel({ model, lang, t, isMobile }) {
  const rows = model.decomposition
  const matrixCells = [
    <span key="matrix-corner" />,
    ...CRITIC_INDICATORS.map(item => (
      <span key={`matrix-head-${item.key}`} style={{ color: t.faint, fontSize: 10, fontWeight: 850, textAlign: "center" }}>{item.shortLabel}</span>
    )),
    ...CRITIC_INDICATORS.flatMap(row => [
      <span key={`matrix-row-${row.key}`} style={{ color: t.faint, fontSize: 10, fontWeight: 850, alignSelf: "center" }}>{row.shortLabel}</span>,
      ...CRITIC_INDICATORS.map(col => {
        const value = model.correlationMatrix[row.key]?.[col.key] ?? 0
        return (
          <span key={`matrix-${row.key}-${col.key}`} style={{
            color: t.textStrong,
            background: row.key === col.key ? t.badgeInfoBg : t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 6,
            padding: "8px 4px",
            textAlign: "center",
            fontSize: 10.5,
            fontFamily: FONT_MONO,
          }}>
            {fmt(value, 2)}
          </span>
        )
      }),
    ]),
  ]
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.95fr) minmax(0, 0.9fr) minmax(0, 1.15fr)", gap: 12 }}>
      <Card t={t}>
        <h3 style={{ margin: 0, color: t.textStrong, fontSize: 13 }}>CRITIC weights</h3>
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {CRITIC_INDICATORS.map(item => (
            <div key={item.key} style={{ display: "grid", gap: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, color: t.muted, fontSize: 11, fontWeight: 850 }}>
                <span>{item.key.replace("d_", "w_")}</span>
                <span style={{ color: t.textStrong, fontFamily: FONT_MONO }}>{fmt(model.weights[item.key])}</span>
              </div>
              <ScoreBar value={model.weights[item.key]} t={t} />
            </div>
          ))}
        </div>
      </Card>

      <Card t={t}>
        <h3 style={{ margin: 0, color: t.textStrong, fontSize: 13 }}>{lang === "zh" ? "Indicator correlation matrix" : "Indicator correlation matrix"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "72px repeat(3, minmax(0, 1fr))", gap: 5, marginTop: 12 }}>
          {matrixCells}
        </div>
      </Card>

      <Card t={t}>
        <h3 style={{ margin: 0, color: t.textStrong, fontSize: 13 }}>{lang === "zh" ? "Information decomposition" : "Information decomposition"}</h3>
        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px", minWidth: 320 }}>
            <thead>
              <tr style={{ color: t.faint, fontSize: 10, textAlign: "left" }}>
                <th>Metric</th><th>sigma</th><th>conflict</th><th>C_j</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.key} style={{ color: t.textStrong, fontSize: 11 }}>
                  <td style={{ padding: "7px 8px", background: t.surface, borderRadius: "6px 0 0 6px", fontWeight: 850 }}>{row.shortLabel}</td>
                  <td style={{ padding: "7px 8px", background: t.surface, fontFamily: FONT_MONO }}>{fmt(row.sigma)}</td>
                  <td style={{ padding: "7px 8px", background: t.surface, fontFamily: FONT_MONO }}>{fmt(row.conflict)}</td>
                  <td style={{ padding: "7px 8px", background: t.surface, borderRadius: "0 6px 6px 0", fontFamily: FONT_MONO }}>{fmt(row.information)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function EvidenceGapsTable({ candidates, lang, t }) {
  const rows = candidates.flatMap(candidate => getDataGapRecommendations(candidate).map(gap => ({ candidate, ...gap })))
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 7px", minWidth: 760 }}>
        <thead>
          <tr style={{ color: t.faint, fontSize: 10, textAlign: "left", textTransform: "uppercase" }}>
            <th style={{ padding: "0 10px" }}>MOF</th>
            <th style={{ padding: "0 10px" }}>{lang === "zh" ? "当前限制" : "Current limitation"}</th>
            <th style={{ padding: "0 10px" }}>{lang === "zh" ? "Recommended next evidence" : "Recommended next evidence"}</th>
            <th style={{ padding: "0 10px" }}>Priority</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={`${row.candidate.id}-${row.limitation}-${row.nextEvidence}`} style={{ color: t.muted, fontSize: 12 }}>
              <td style={{ padding: "10px", background: t.surface, borderRadius: "7px 0 0 7px", color: t.textStrong, fontWeight: 850 }}>{row.candidate.name}</td>
              <td style={{ padding: "10px", background: t.surface }}>{row.limitation}</td>
              <td style={{ padding: "10px", background: t.surface }}>{row.nextEvidence}</td>
              <td style={{ padding: "10px", background: t.surface, borderRadius: "0 7px 7px 0", color: row.priority === "High" ? t.warn : t.accentText, fontWeight: 850 }}>{row.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SensitivityTable({ sensitivity, lang, t }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {(sensitivity.modes || [{ id: "expected", label: "Confidence-adjusted sensitivity based on D_expected", rows: sensitivity.rows }]).map(mode => (
        <div key={mode.id} style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, color: t.textStrong, fontSize: 13 }}>{lang === "zh" ? mode.zh || mode.label : mode.label}</h3>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>{mode.id === "raw" ? "ranked by D_raw" : "ranked by D_expected"}</span>
          </div>
          <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
            {mode.id === "raw"
              ? (lang === "zh" ? "Raw-score sensitivity based on D_raw：仅观察权重变化对三维指标综合评分的影响。" : "Raw-score sensitivity based on D_raw: isolates the effect of weight changes on the three-indicator composite score.")
              : (lang === "zh" ? "Confidence-adjusted sensitivity based on D_expected：同时考虑权重变化和证据置信度影响。" : "Confidence-adjusted sensitivity based on D_expected: includes both weight changes and evidence-confidence effects.")}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 7px", minWidth: 780 }}>
              <thead>
                <tr style={{ color: t.faint, fontSize: 10, textAlign: "left", textTransform: "uppercase" }}>
                  <th style={{ padding: "0 10px" }}>MOF</th>
                  {sensitivity.schemes.map(scheme => <th key={scheme.id} style={{ padding: "0 10px" }}>{scheme.label}</th>)}
                  <th style={{ padding: "0 10px" }}>{lang === "zh" ? "稳健性" : "Robustness"}</th>
                </tr>
              </thead>
              <tbody>
                {mode.rows.map(row => (
                  <tr key={`${mode.id}-${row.id}`} style={{ color: t.muted, fontSize: 12 }}>
                    <td style={{ padding: "10px", background: t.surface, borderRadius: "7px 0 0 7px", color: t.textStrong, fontWeight: 850 }}>{row.name}</td>
                    {sensitivity.schemes.map(scheme => (
                      <td key={scheme.id} style={{ padding: "10px", background: t.surface, fontFamily: FONT_MONO }}>
                        {Number.isFinite(row.ranks[scheme.id]) ? `#${row.ranks[scheme.id]}` : row.ranks[scheme.id]}
                      </td>
                    ))}
                    <td style={{ padding: "10px", background: t.surface, borderRadius: "0 7px 7px 0", color: row.robustness === "Evidence-limited" || row.robustness === "Weight-sensitive" ? t.warn : t.accentText, fontWeight: 850 }}>
                      {row.robustness}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

export function EcoScreenTab({ onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [selectedId, setSelectedId] = useState("MOF-B")
  const model = useMemo(() => {
    const baseModel = buildCriticScoringModel()
    const sourceCandidates = baseModel.sourceCandidates || []
    const critic = computeCriticWeights(sourceCandidates)
    const candidates = computeCandidateScores(sourceCandidates, critic.weights)
    const sensitivity = computeSensitivityRanks(sourceCandidates, critic.weights)
    return { ...critic, sourceCandidates, candidates, sensitivity }
  }, [])
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
        document.getElementById("critic-mcda-methodology")?.scrollIntoView({ block: "start", behavior: "smooth" })
      }, 180)
    }
  }

  return (
    <div id="candidate-scoring-lab" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={lang === "zh" ? "Candidate Scoring Lab / 候选材料评分工作台" : "Candidate Scoring Lab / 候选材料评分工作台"}
        subtitle={lang === "zh"
          ? "Interpretable CRITIC-MCDA screening for hydrothermal formate-formation candidates. 基于水热稳定性、产甲酸关键能垒与副产物路径风险，对 MOF 候选进行可解释优先级排序。"
          : "Interpretable CRITIC-MCDA screening for hydrothermal formate-formation candidates. 基于水热稳定性、产甲酸关键能垒与副产物路径风险，对 MOF 候选进行可解释优先级排序。"}
        meta={lang === "zh"
          ? "CRITIC weights · D_raw · confidence_Q · D_expected · status · rank · Evidence & Data Gaps · Sensitivity Analysis"
          : "CRITIC weights · D_raw · confidence_Q · D_expected · status · rank · Evidence & Data Gaps · Sensitivity Analysis"}
        action={
          <>
            <BasisBadge tone="proxy">demo / illustrative</BasisBadge>
            <CopyLinkButton hash="ecoscreen" ariaLabel={lang === "zh" ? "复制 EcoScreen 链接" : "Copy EcoScreen link"} />
          </>
        }
      />

      <Callout tone="info">
        {lang === "zh"
            ? "This module supports early-stage candidate prioritization, not direct formate yield prediction. 本模块用于早期候选优先级判断，不用于直接预测甲酸产率。"
          : "This module supports early-stage candidate prioritization, not direct formate yield prediction. 本模块用于早期候选优先级判断，不用于直接预测甲酸产率。"}{" "}
        <DisclaimerLink />
      </Callout>
      <Callout tone="warn">
        {lang === "zh"
          ? "演示记录，不代表已验证催化性能。"
          : "Illustrative demo record — not validated catalytic evidence."}
      </Callout>

      <ResultLayer number="01" title="Candidate Scoring Lab / 候选材料评分工作台" subtitle="CRITIC weights · D_raw · confidence_Q · D_expected · status · rank">
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.25fr) minmax(360px, 0.75fr)", gap: 12, alignItems: "stretch", marginBottom: 12 }}>
          <Card t={t} style={{ display: "grid", gap: 10 }}>
            <div style={{ color: t.textStrong, fontSize: isMobile ? 20 : 24, lineHeight: 1.08, fontWeight: 940 }}>
              Candidate Scoring Lab
            </div>
            <div style={{ color: t.textStrong, fontSize: isMobile ? 16 : 18, lineHeight: 1.2, fontWeight: 860 }}>
              候选材料评分工作台
            </div>
            <div style={{ color: t.muted, fontSize: 13, lineHeight: 1.65, maxWidth: 780 }}>
              Interpretable CRITIC-MCDA screening for hydrothermal formate-formation candidates.
            </div>
            <div style={{ color: t.muted, fontSize: 13, lineHeight: 1.65, maxWidth: 860 }}>
              基于水热稳定性、产甲酸关键能垒与副产物路径风险，对 MOF 候选进行可解释优先级排序。
            </div>
            <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.65, maxWidth: 860 }}>
              {lang === "zh"
                ? "基于水热稳定性、产甲酸关键能垒与副产物路径风险，对 MOF 候选进行可解释优先级排序。演示记录，不代表已验证催化性能。"
                : "Uses hydrothermal stability, formate-formation barrier, and byproduct-risk evidence to rank MOF candidates. Illustrative demo record — not validated catalytic evidence."}
            </div>
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
            <MetricCard label={lang === "zh" ? "Total candidates / 候选总数" : "Total candidates"} value={model.candidates.length} note="demo set" t={t} />
            <MetricCard label={lang === "zh" ? "Scored candidates / 已评分候选" : "Scored candidates"} value={scored.length} note="G = 1" t={t} />
            <MetricCard label={lang === "zh" ? "Excluded / 已硬筛排除" : "Excluded"} value={excluded.length} note="G = 0" t={t} />
            <MetricCard label={lang === "zh" ? "Top candidate / 当前最高优先级候选" : "Top candidate"} value={topCandidate?.name || "—"} note={topCandidate ? `D_expected ${fmt(topCandidate.D_expected)}` : ""} t={t} />
            <MetricCard label={lang === "zh" ? "Weighting method / 权重方法" : "Weighting method"} value="CRITIC-MCDA" note="dataset-specific weights" t={t} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.45fr) minmax(320px, 0.9fr)", gap: 12, alignItems: "stretch" }}>
          <Card t={t}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: t.textStrong, fontSize: 14 }}>{lang === "zh" ? "MOF Candidate Usefulness Ranking" : "MOF Candidate Usefulness Ranking"}</h3>
              <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>D_expected = D_raw × Q</span>
            </div>
            <RankingList candidates={model.candidates} selectedId={selectedCandidate?.id} onSelect={setSelectedId} lang={lang} t={t} isMobile={isMobile} />
          </Card>
          <SelectedCandidateExplanation candidate={selectedCandidate} lang={lang} t={t} isMobile={isMobile} />
        </div>
      </ResultLayer>

      <ResultLayer number="02" title={lang === "zh" ? "CRITIC 权重解释" : "CRITIC Weight Explanation"} subtitle="C_j = sigma_j * sum_k(1 - r_jk); w_j = C_j / sum(C_j)">
        <WeightsPanel model={model} lang={lang} t={t} isMobile={isMobile} />
      </ResultLayer>

      <ResultLayer number="03" title={lang === "zh" ? "Evidence & Data Gaps / 证据与数据缺口" : "Evidence & Data Gaps / 证据与数据缺口"}>
        <EvidenceGapsTable candidates={model.candidates} lang={lang} t={t} />
      </ResultLayer>

      <ResultLayer number="04" title={lang === "zh" ? "Sensitivity Analysis / 权重敏感性分析" : "Sensitivity Analysis / 权重敏感性分析"} subtitle={lang === "zh" ? "同时展示基于 D_raw 的原始评分敏感性，以及基于 D_expected 的置信度修正敏感性。" : "Shows both raw-score sensitivity based on D_raw and confidence-adjusted sensitivity based on D_expected."}>
        <SensitivityTable sensitivity={model.sensitivity} lang={lang} t={t} />
      </ResultLayer>

      <ResultLayer number="05" title={lang === "zh" ? "方法论入口" : "Methodology Link"}>
        <Card t={t} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900 }}>CRITIC-MCDA Candidate Scoring</div>
            <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, marginTop: 5 }}>
              {lang === "zh"
                ? "查看公式、边界、小样本限制，以及为什么当前阶段不直接使用 RSM 跨 MOF 拟合产率。"
                : "Open formulas, boundaries, small-sample limits, and why RSM is not used for cross-MOF yield fitting at this stage."}
            </div>
          </div>
          <button type="button" onClick={openMethodology} style={{ ...toolbarBtn(t), color: t.accentText, borderColor: t.accent, justifyContent: "center" }}>
            {lang === "zh" ? "打开方法论说明" : "Open Methodology"}
          </button>
        </Card>
      </ResultLayer>
    </div>
  )
}
