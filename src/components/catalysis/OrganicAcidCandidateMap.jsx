import { useMemo, useState } from "react"
import { FONT_MONO } from "../../constants/theme"
import { useLang, useT, useViewport } from "../../contexts"
import { aggregateOrganicAcidFeatures } from "../../utils/organicAcidFeatureAggregation"
import { calculateFormicAcidPathwayScore, mapEvidenceConfidence } from "../../utils/organicAcidScoring"
import { toolbarBtn } from "../../utils/styles"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const GROUPS = [
  {
    id: "priority",
    zh: "高优先级候选",
    en: "Priority candidates",
    noteZh: "优先级和证据可信度都较高，适合进入第一批验证讨论。",
    noteEn: "Higher priority and evidence confidence; suitable for first validation discussion.",
  },
  {
    id: "hypothesis",
    zh: "假设层候选",
    en: "Hypothesis candidates",
    noteZh: "优先级较高但证据仍弱，适合 DFT 或小规模验证。",
    noteEn: "Higher priority but weak evidence; suitable for DFT or small-scale validation.",
  },
  {
    id: "control",
    zh: "对照候选",
    en: "Control candidates",
    noteZh: "可作为低优先级或对照参考，不代表甲酸路径结论。",
    noteEn: "Useful as lower-priority or control references; no formic-acid conclusion.",
  },
  {
    id: "pending",
    zh: "待整理记录",
    en: "Pending records",
    noteZh: "有机酸相关性尚未整理，不进入优先级判断。",
    noteEn: "Organic-acid relevance is pending and excluded from priority interpretation.",
  },
]

function chemicalText(value, fallback = "pending") {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "number" && !Number.isFinite(value)) return fallback
  return String(value)
    .replace(/HCO3[−-]/g, "HCO₃⁻")
    .replace(/HCOO[−-]/g, "HCOO⁻")
    .replace(/CO2/g, "CO₂")
    .replace(/_/g, " ")
}

function safeNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function roleList(candidate) {
  const roles = candidate?.organicAcidRelevance?.possibleRoles
  return Array.isArray(roles) ? roles : []
}

function validationList(candidate) {
  const rows = candidate?.organicAcidRelevance?.validationNeeded
  return Array.isArray(rows) && rows.length ? rows : ["Organic acid pathway relevance pending curation"]
}

function candidateName(candidate) {
  return candidate?.displayName || candidate?.commonName || candidate?.name || candidate?.mofName || candidate?.id || "Open MOF record"
}

function sourceDatabase(candidate) {
  return candidate?.sourceDatabase || candidate?.provenance?.sourceDatabase || candidate?.provenance?.database || candidate?.dataStatus || "pending"
}

function candidatePriority(candidate) {
  const relevance = candidate?.organicAcidRelevance || {}
  const direct = safeNumber(relevance.pathwayPriorityScore, null)
  if (direct !== null) return direct
  if (String(relevance.scoreStatus || "").toLowerCase().includes("pending")) return 0
  return calculateFormicAcidPathwayScore(candidate).finalScore
}

function isPendingCandidate(candidate) {
  const status = `${candidate?.dataStatus || ""} ${candidate?.organicAcidRelevance?.scoreStatus || ""} ${candidate?.graphMetadata?.graphConfidence || ""}`.toLowerCase()
  return status.includes("pending") && !safeNumber(candidate?.organicAcidRelevance?.pathwayPriorityScore, 0)
}

function candidatePoint(candidate) {
  const scoreStatus = candidate?.organicAcidRelevance?.scoreStatus || candidate?.graphMetadata?.graphConfidence || candidate?.dataStatus
  const features = aggregateOrganicAcidFeatures(candidate)
  const pending = isPendingCandidate(candidate)
  const priority = pending ? 0 : Math.max(0, Math.min(100, candidatePriority(candidate)))
  const evidence = pending ? 0 : mapEvidenceConfidence(scoreStatus)
  let group = "control"
  if (pending) group = "pending"
  else if (priority >= 65 && evidence >= 50) group = "priority"
  else if (priority >= 65 && evidence < 50) group = "hypothesis"

  return {
    id: candidate.id || candidate.name,
    candidate,
    evidence,
    features,
    group,
    pending,
    priority,
  }
}

function relatedNodeLabels(candidate) {
  const nodes = [...new Set(roleList(candidate).map(role => role.relatedPathwayNode).filter(Boolean))]
  if (!nodes.length) return ["pending"]
  return nodes.map(node => chemicalText(node))
}

function availableDescriptorLabels(candidate, lang) {
  const rows = [
    ["surfaceArea", text(lang, "比表面积", "surfaceArea")],
    ["poreSizeA", text(lang, "孔径", "poreSizeA")],
    ["poreVolume", text(lang, "孔体积", "poreVolume")],
    ["bandGap", text(lang, "带隙", "bandGap")],
    ["density", text(lang, "密度", "density")],
  ]
  return rows.filter(([key]) => candidate?.[key] !== null && candidate?.[key] !== undefined && candidate?.[key] !== "pending").map(([, label]) => label)
}

function CandidateMatrixCard({ point, selected, onSelect, lang, t }) {
  const candidate = point.candidate
  const pending = point.group === "pending"
  const nodes = relatedNodeLabels(candidate)
  return (
    <button
      type="button"
      onClick={() => onSelect(point.id)}
      style={{
        background: selected ? t.badgeInfoBg : t.surface,
        border: `1px solid ${selected ? t.accent : t.border}`,
        borderRadius: 8,
        color: t.textStrong,
        cursor: "pointer",
        display: "grid",
        gap: 7,
        minWidth: 0,
        padding: 10,
        textAlign: "left",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", minWidth: 0 }}>
        <strong style={{ fontSize: 13, lineHeight: 1.25, overflowWrap: "anywhere" }}>{candidateName(candidate)}</strong>
        <span style={{ color: pending ? t.warn : t.accentText, fontSize: 10.5, fontWeight: 850, whiteSpace: "nowrap" }}>
          {pending ? "pending" : Math.round(point.priority)}
        </span>
      </div>
      {pending ? (
        <>
          <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
            {text(lang, "来源", "Source")}: {chemicalText(sourceDatabase(candidate))}
          </div>
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45 }}>
            {text(lang, "下一步", "Next")}: {text(lang, "文献 / DFT / 实验整理", "literature / DFT / experiment curation")}
          </div>
        </>
      ) : (
        <>
          <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
            Priority: <span style={{ fontFamily: FONT_MONO }}>{Math.round(point.priority)}</span> · Evidence: <span style={{ fontFamily: FONT_MONO }}>{Math.round(point.evidence)}</span>
          </div>
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45 }}>
            {text(lang, "关联节点", "Related nodes")}: {nodes.slice(0, 3).join(", ")}
          </div>
        </>
      )}
    </button>
  )
}

function CandidateExplanation({ point, lang, t }) {
  if (!point) {
    return (
      <aside style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, minWidth: 0, padding: 12 }}>
        <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "候选物解释", "Candidate explanation")}</strong>
        <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>
          {text(lang, "选择一个候选卡片查看规则、证据和验证需求。", "Select a candidate card to inspect rules, evidence, and validation needs.")}
        </span>
      </aside>
    )
  }

  const candidate = point.candidate
  const roles = roleList(candidate)
  const nodes = relatedNodeLabels(candidate)
  const evidenceStatus = candidate?.organicAcidRelevance?.scoreStatus || candidate?.graphMetadata?.graphConfidence || "pending"
  const group = GROUPS.find(item => item.id === point.group)

  return (
    <aside style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 12, minWidth: 0, padding: 12 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ color: t.faint, fontSize: 11, fontWeight: 850 }}>{text(lang, "候选物解释", "Candidate explanation")}</div>
        <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 940, lineHeight: 1.2, overflowWrap: "anywhere" }}>
          {candidateName(candidate)}
        </div>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
          {group ? text(lang, group.zh, group.en) : "pending"} · {chemicalText(sourceDatabase(candidate))}
        </div>
      </div>

      {[
        [
          text(lang, "当前定位", "Candidate summary"),
          point.pending
            ? text(lang, "待整理记录，不代表有机酸路径活性。", "Pending record; no organic-acid pathway role is assigned.")
            : text(lang, "假设层候选，不代表已验证活性。", "Hypothesis-layer candidate; not validated activity."),
        ],
        [
          text(lang, "关联路径节点", "Matched pathway nodes"),
          nodes.join(", "),
        ],
        [
          text(lang, "证据状态", "Current evidence status"),
          chemicalText(evidenceStatus),
        ],
        [
          text(lang, "需要验证", "Validation needed"),
          validationList(candidate).slice(0, 4).map(item => chemicalText(item)).join("; "),
        ],
      ].map(([label, value]) => (
        <div key={label} style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 5, paddingTop: 9 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{label}</strong>
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>{value || "pending"}</span>
        </div>
      ))}

      {roles.length > 0 && (
        <div style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 6, paddingTop: 9 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>Candidate-related MOF roles</strong>
          {roles.slice(0, 4).map((role, index) => (
            <span key={`${role.relatedPathwayNode || role.role || index}`} style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
              {chemicalText(role.label || role.role)} · {chemicalText(role.relatedPathwayNode)} · {chemicalText(role.evidenceLevel)}
            </span>
          ))}
        </div>
      )}
    </aside>
  )
}

function AdvancedScorePlot({ points, selectedPoint, onSelectCandidate, lang, t }) {
  const width = 680
  const height = 310
  const margin = { top: 24, right: 20, bottom: 48, left: 52 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const validPoints = points.filter(point => !point.pending)
  const toX = value => margin.left + (Math.max(0, Math.min(100, value)) / 100) * plotWidth
  const toY = value => margin.top + plotHeight - (Math.max(0, Math.min(100, value)) / 100) * plotHeight

  return (
    <details style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
      <summary style={{ color: t.textStrong, cursor: "pointer", fontSize: 12.5, fontWeight: 900 }}>
        Advanced: View 2D score plot
      </summary>
      <div style={{ marginTop: 10, overflow: "hidden" }}>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Advanced 2D score plot" style={{ display: "block", width: "100%", height: "auto", fontFamily: "inherit" }}>
          <rect x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} rx="8" fill={t.bg} stroke={t.border} />
          <line x1={toX(50)} x2={toX(50)} y1={margin.top} y2={margin.top + plotHeight} stroke={t.borderStrong || t.border} strokeDasharray="5 5" />
          <line x1={margin.left} x2={margin.left + plotWidth} y1={toY(50)} y2={toY(50)} stroke={t.borderStrong || t.border} strokeDasharray="5 5" />
          <text x={margin.left + plotWidth / 2} y={height - 14} textAnchor="middle" fill={t.textStrong} fontSize="12" fontWeight="850">
            Evidence Confidence / 证据可信度
          </text>
          <text x="16" y={margin.top + plotHeight / 2} textAnchor="middle" fill={t.textStrong} fontSize="12" fontWeight="850" transform={`rotate(-90 16 ${margin.top + plotHeight / 2})`}>
            Formic Acid Pathway Priority / 甲酸路径优先级
          </text>
          {validPoints.map((point, index) => {
            const selected = point.id === selectedPoint?.id
            const jitter = (index % 5) * 5 - 10
            return (
              <circle
                key={point.id}
                cx={toX(point.evidence) + jitter}
                cy={toY(point.priority) - jitter}
                r={selected ? 8 : 6}
                fill={point.group === "priority" ? "#15803D" : point.group === "hypothesis" ? "#7C3AED" : "#D97706"}
                opacity={selected ? 0.95 : 0.62}
                stroke={selected ? t.textStrong : "#fff"}
                strokeWidth={selected ? 2.2 : 1.2}
                style={{ cursor: "pointer" }}
                onClick={() => onSelectCandidate(point.id)}
              />
            )
          })}
        </svg>
        <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5 }}>
          {text(lang, "散点图仅作为高级诊断视图；pending records 不进入主体坐标图。", "The plot is an advanced diagnostic view only; pending records are excluded from the main coordinate plane.")}
        </div>
      </div>
    </details>
  )
}

export function OrganicAcidCandidateMap({
  candidates = [],
  selectedCandidateId,
  onSelectCandidate = () => {},
  lang: forcedLang,
  t: tone,
  isMobile: forcedMobile,
}) {
  const theme = useT()
  const { lang: contextLang } = useLang()
  const viewport = useViewport()
  const t = tone || theme
  const lang = forcedLang || contextLang
  const isMobile = forcedMobile ?? viewport.isMobile
  const isNarrow = isMobile || viewport.isNarrow
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const points = useMemo(() => (Array.isArray(candidates) ? candidates : []).map(candidatePoint), [candidates])
  const selectedPoint = points.find(point => point.id === selectedCandidateId) || points.find(point => !point.pending) || points[0] || null
  const groupedPoints = useMemo(() => {
    const groups = Object.fromEntries(GROUPS.map(group => [group.id, []]))
    points.forEach(point => groups[point.group].push(point))
    return groups
  }, [points])

  return (
    <section id="organic-acid-candidate-map" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, minWidth: 0, padding: isMobile ? 12 : 14, scrollMarginTop: 118 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900 }}>
          Organic Acid Candidate Matrix
        </div>
        <h2 style={{ color: t.textStrong, fontSize: isMobile ? 20 : 23, fontWeight: 940, lineHeight: 1.16, margin: 0 }}>
          {text(lang, "有机酸候选物优先级矩阵", "Organic Acid Candidate Matrix")}
        </h2>
        <div style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55, maxWidth: 920 }}>
          {text(
            lang,
            "按优先级、证据可信度和 pending 状态分组展示候选物；该矩阵用于决策辅助，不预测甲酸产率。",
            "Candidates are grouped by priority, evidence confidence, and pending status; the matrix supports decisions and does not predict formic acid yield."
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.55fr) minmax(280px, 0.8fr)", minWidth: 0 }}>
        <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", minWidth: 0 }}>
            {GROUPS.map(group => (
              <section key={group.id} style={{ background: t.surface, border: `1px solid ${group.id === "pending" ? t.warn : t.border}`, borderRadius: 8, display: "grid", gap: 9, minHeight: 150, minWidth: 0, padding: 11 }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ color: t.textStrong, fontSize: 13.5, fontWeight: 930 }}>{text(lang, group.zh, group.en)}</div>
                  <div style={{ color: t.faint, fontSize: 11.2, lineHeight: 1.45 }}>{text(lang, group.noteZh, group.noteEn)}</div>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {groupedPoints[group.id].length ? groupedPoints[group.id].slice(0, group.id === "pending" ? 12 : 8).map(point => (
                    <CandidateMatrixCard
                      key={point.id}
                      point={point}
                      selected={point.id === selectedPoint?.id}
                      onSelect={onSelectCandidate}
                      lang={lang}
                      t={t}
                    />
                  )) : (
                    <div style={{ color: t.faint, fontSize: 12, lineHeight: 1.5 }}>
                      {text(lang, "暂无候选物", "No candidates")}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAdvancedOpen(prev => !prev)}
            style={{ ...toolbarBtn(t), borderStyle: "dashed", justifyContent: "center", minHeight: 34 }}
          >
            {advancedOpen ? text(lang, "收起二维图", "Hide 2D score plot") : "Advanced: View 2D score plot"}
          </button>
          {advancedOpen && (
            <AdvancedScorePlot points={points} selectedPoint={selectedPoint} onSelectCandidate={onSelectCandidate} lang={lang} t={t} />
          )}
        </div>

        <CandidateExplanation point={selectedPoint} lang={lang} t={t} />
      </div>
    </section>
  )
}
