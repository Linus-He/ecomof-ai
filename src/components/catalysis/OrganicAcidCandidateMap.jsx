import { useMemo } from "react"
import { FONT_MONO } from "../../constants/theme"
import { useLang, useT, useViewport } from "../../contexts"
import { aggregateOrganicAcidFeatures } from "../../utils/organicAcidFeatureAggregation"
import { calculateFormicAcidPathwayScore, mapEvidenceConfidence } from "../../utils/organicAcidScoring"
import { toolbarBtn } from "../../utils/styles"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const CLUSTER_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0E7490"]

function safeText(value, fallback = "pending") {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "number" && !Number.isFinite(value)) return fallback
  return String(value).replace(/_/g, " ")
}

function safeNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function clusterColor(candidate) {
  const key = String(candidate?.graphMetadata?.graphCluster || candidate?.metalNode || candidate?.metalNodes?.[0] || candidate?.name || "pending")
  const sum = key.split("").reduce((total, char) => total + char.charCodeAt(0), 0)
  return CLUSTER_COLORS[sum % CLUSTER_COLORS.length]
}

function roleList(candidate) {
  const roles = candidate?.organicAcidRelevance?.possibleRoles
  return Array.isArray(roles) ? roles : []
}

function validationList(candidate) {
  const rows = candidate?.organicAcidRelevance?.validationNeeded
  return Array.isArray(rows) && rows.length ? rows : ["Organic acid pathway relevance pending curation"]
}

function provenanceRows(candidate) {
  const provenance = candidate?.provenance || {}
  return [
    ["sourceDatabase", provenance.sourceDatabase || candidate?.sourceDatabase || provenance.database],
    ["sourceRecordId", candidate?.sourceRecordId || provenance.sourceRecordId],
    ["sourceVersion", candidate?.sourceVersion || provenance.sourceVersion],
    ["retrievedAt", provenance.retrievedAt],
    ["citation", provenance.citation],
    ["sourceUrl", provenance.sourceUrl],
    ["license", provenance.license],
    ["curationStatus", provenance.curationStatus || candidate?.curationStatus],
  ]
}

function completenessRows(candidate) {
  const completeness = candidate?.descriptorCompleteness || {}
  return [
    ["surfaceArea", completeness.surfaceArea],
    ["poreSizeA", completeness.poreSizeA],
    ["poreVolume", completeness.poreVolume],
    ["bandGap", completeness.bandGap],
    ["waterStability", completeness.waterStability],
  ]
}

function candidatePriority(candidate) {
  const relevance = candidate?.organicAcidRelevance || {}
  const direct = safeNumber(relevance.pathwayPriorityScore, null)
  if (direct !== null) return direct
  if (String(relevance.scoreStatus || "").toLowerCase().includes("pending")) return 0
  return calculateFormicAcidPathwayScore(candidate).finalScore
}

function isPendingCandidate(candidate) {
  const textValue = `${candidate?.dataStatus || ""} ${candidate?.organicAcidRelevance?.scoreStatus || ""} ${candidate?.graphMetadata?.graphConfidence || ""}`.toLowerCase()
  return textValue.includes("pending") && !safeNumber(candidate?.organicAcidRelevance?.pathwayPriorityScore, 0)
}

function FeatureBars({ features, lang, t }) {
  const rows = [
    ["structureFeasibility", text(lang, "结构可行性", "Structure feasibility")],
    ["poreAccessibility", text(lang, "孔道可达性", "Pore accessibility")],
    ["activeMotifPotential", text(lang, "活性基元潜力", "Active motif potential")],
    ["formateInteractionPotential", text(lang, "甲酸盐相互作用潜力", "Formate interaction potential")],
    ["evidenceConfidence", text(lang, "证据可信度", "Evidence confidence")],
  ]
  return (
    <div style={{ display: "grid", gap: 7 }}>
      {rows.map(([key, label]) => {
        const value = safeNumber(features?.[key])
        return (
          <div key={key} style={{ display: "grid", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: t.muted, fontSize: 11.5 }}>
              <span>{label}</span>
              <strong style={{ color: t.textStrong, fontFamily: FONT_MONO }}>{Math.round(value)}</strong>
            </div>
            <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 999, height: 7, overflow: "hidden" }}>
              <div style={{ background: key === "evidenceConfidence" ? t.accent : "#15803D", height: "100%", width: `${Math.max(0, Math.min(100, value))}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CandidateExplanation({ candidate, point, lang, t }) {
  if (!candidate || !point) {
    return (
      <aside style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, display: "grid", gap: 8, minWidth: 0 }}>
        <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>{text(lang, "候选解释", "Candidate explanation")}</div>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>
          {text(lang, "选择一个候选点查看路径相关节点、证据状态和验证需求。", "Select a candidate point to inspect pathway-related nodes, evidence status, and validation needs.")}
        </div>
      </aside>
    )
  }
  const roles = roleList(candidate)
  const openSeed = String(candidate?.dataStatus || "").toLowerCase().includes("open-mof-seed")
  return (
    <aside style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, display: "grid", gap: 10, minWidth: 0, alignSelf: "stretch" }}>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {text(lang, "候选物解释", "Candidate explanation")}
        </div>
        <div style={{ color: t.textStrong, fontSize: 17, fontWeight: 940, lineHeight: 1.2 }}>
          {candidate.name || candidate.id}
        </div>
        <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
          {safeText(candidate.graphMetadata?.graphCluster)} · {safeText(candidate.organicAcidRelevance?.scoreStatus)} · {safeText(candidate.dataStatus)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: 9 }}>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "证据可信度", "Evidence Confidence")}</div>
          <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 940, marginTop: 4, fontFamily: FONT_MONO }}>{point.pending ? "pending" : Math.round(point.x)}</div>
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: 9 }}>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "甲酸路径优先级", "Pathway Priority")}</div>
          <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 940, marginTop: 4, fontFamily: FONT_MONO }}>{point.pending ? "pending" : Math.round(point.y)}</div>
        </div>
      </div>

      {openSeed ? (
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 7, color: t.muted, fontSize: 11.5, lineHeight: 1.55, padding: 9 }}>
          {text(
            lang,
            "该候选物来自 Open MOF seed 数据。目前可能已有结构、几何或电子描述符，但有机酸路径相关性仍待整理。在没有文献、DFT 或实验支持前，不赋予甲酸路径导向作用结论。",
            "This candidate is imported from Open MOF seed data. Structural, geometric, or electronic descriptors may be available, but organic-acid pathway relevance is pending curation. No formic-acid-oriented role is assigned without literature, DFT, or experimental support."
          )}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 7 }}>
        <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>Candidate-related MOF roles</div>
        {roles.length ? roles.map((role, index) => (
          <div key={`${role.role || role.label}-${index}`} style={{ borderTop: index ? `1px solid ${t.border}` : "none", paddingTop: index ? 7 : 0, color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>
            <strong style={{ color: t.textStrong }}>{safeText(role.label || role.role)}</strong>
            <br />
            {text(lang, "相关节点", "Related node")}: {safeText(role.relatedPathwayNode)} · {safeText(role.relatedFeature)} · {safeText(role.evidenceLevel)}
          </div>
        )) : (
          <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>
            Organic acid relevance pending curation.
          </div>
        )}
      </div>

      <FeatureBars features={point.features} lang={lang} t={t} />

      {openSeed ? (
        <div style={{ display: "grid", gap: 7 }}>
          <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>Open database provenance</div>
          {provenanceRows(candidate).map(([label, value]) => (
            <div key={label} style={{ display: "grid", gap: 5, gridTemplateColumns: "92px minmax(0, 1fr)", minWidth: 0 }}>
              <span style={{ color: t.faint, fontSize: 10.8, fontWeight: 850 }}>{label}</span>
              <span style={{ color: t.muted, fontSize: 10.8, lineHeight: 1.4, overflowWrap: "anywhere" }}>{safeText(value)}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 5, paddingTop: 7 }}>
            {completenessRows(candidate).map(([label, value]) => (
              <div key={label} style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                <span style={{ color: t.faint, fontSize: 10.8 }}>{label}</span>
                <strong style={{ color: t.textStrong, fontSize: 10.8 }}>{safeText(value)}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{text(lang, "需要验证", "Validation needed")}</div>
        {validationList(candidate).slice(0, 5).map(item => (
          <div key={item} style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
            {safeText(item)}
          </div>
        ))}
      </div>

      <div style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.45 }}>
        {text(lang, "该地图是证据修正的决策辅助，不是产率预测或已验证机理。", "This map is evidence-adjusted decision support, not yield prediction or a validated mechanism.")}
      </div>
    </aside>
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
  const width = 720
  const height = 430
  const margin = { top: 28, right: 26, bottom: 58, left: 58 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom

  const points = useMemo(() => (
    (Array.isArray(candidates) ? candidates : []).map(candidate => {
      const status = candidate?.organicAcidRelevance?.scoreStatus || candidate?.graphMetadata?.graphConfidence || candidate?.dataStatus
      const features = aggregateOrganicAcidFeatures(candidate)
      const pending = isPendingCandidate(candidate)
      const priority = pending ? 0 : candidatePriority(candidate)
      return {
        id: candidate.id || candidate.name,
        candidate,
        x: pending ? 0 : mapEvidenceConfidence(status),
        y: Math.max(0, Math.min(100, priority)),
        pending,
        features,
        radius: Math.max(6, Math.min(15, 6 + roleList(candidate).length * 2 + (candidate.graphMetadata?.activeMotifs?.length || 0))),
        color: clusterColor(candidate),
      }
    })
  ), [candidates])

  const selectedPoint = points.find(point => point.id === selectedCandidateId) || points.find(point => !point.pending) || points[0] || null
  const validPoints = points.filter(point => !point.pending)
  const pendingPoints = points.filter(point => point.pending)
  const toX = value => margin.left + (Math.max(0, Math.min(100, value)) / 100) * plotWidth
  const toY = value => margin.top + plotHeight - (Math.max(0, Math.min(100, value)) / 100) * plotHeight

  return (
    <section id="organic-acid-candidate-map" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: isMobile ? 12 : 14, display: "grid", gap: 12, minWidth: 0, scrollMarginTop: 118 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          MOF Candidate Map for Organic Acid Pathway
        </div>
        <h2 style={{ color: t.textStrong, fontSize: isMobile ? 20 : 23, lineHeight: 1.16, margin: 0, fontWeight: 940 }}>
          {text(lang, "有机酸路径 MOF 候选物地图", "MOF Candidate Map for Organic Acid Pathway")}
        </h2>
        <div style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55, maxWidth: 920 }}>
          {text(
            lang,
            "二维坐标只展示 5 个高层聚合维度背后的候选优先级，pending 记录单独弱化显示，避免把字段缺口误读为低性能。",
            "The two-axis map exposes candidate priority through five aggregate dimensions; pending records are separated so missing fields are not mistaken for poor performance."
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.6fr) minmax(270px, 0.8fr)", gap: 12, alignItems: "stretch", minWidth: 0 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, minWidth: 0 }}>
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="MOF Candidate Map for Organic Acid Pathway" style={{ display: "block", width: "100%", height: "auto", fontFamily: "inherit" }}>
            <rect x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} rx="8" fill={t.bg} stroke={t.border} />
            <line x1={toX(50)} x2={toX(50)} y1={margin.top} y2={margin.top + plotHeight} stroke={t.borderStrong || t.border} strokeDasharray="5 5" />
            <line x1={margin.left} x2={margin.left + plotWidth} y1={toY(50)} y2={toY(50)} stroke={t.borderStrong || t.border} strokeDasharray="5 5" />
            {[0, 25, 50, 75, 100].map(value => (
              <g key={`x-${value}`}>
                <line x1={toX(value)} x2={toX(value)} y1={margin.top + plotHeight} y2={margin.top + plotHeight + 5} stroke={t.borderStrong || t.border} />
                <text x={toX(value)} y={height - 35} textAnchor="middle" fill={t.faint} fontSize="10.5" fontWeight="780">{value}</text>
              </g>
            ))}
            {[0, 25, 50, 75, 100].map(value => (
              <g key={`y-${value}`}>
                <line x1={margin.left - 5} x2={margin.left} y1={toY(value)} y2={toY(value)} stroke={t.borderStrong || t.border} />
                <text x={margin.left - 12} y={toY(value) + 4} textAnchor="end" fill={t.faint} fontSize="10.5" fontWeight="780">{value}</text>
              </g>
            ))}

            <text x={margin.left + plotWidth / 2} y={height - 12} textAnchor="middle" fill={t.textStrong} fontSize="12" fontWeight="900">
              Evidence Confidence / 证据可信度
            </text>
            <text x="17" y={margin.top + plotHeight / 2} textAnchor="middle" fill={t.textStrong} fontSize="12" fontWeight="900" transform={`rotate(-90 17 ${margin.top + plotHeight / 2})`}>
              Formic Acid Pathway Priority / 甲酸路径优先级
            </text>

            {[
              [75, 88, text(lang, "高优先级 / 高可信度", "High priority / High confidence")],
              [25, 88, text(lang, "高优先级 / 低可信度", "High priority / Low confidence")],
              [75, 20, text(lang, "低优先级 / 高可信度", "Low priority / High confidence")],
              [25, 20, text(lang, "低优先级 / 低可信度", "Low priority / Low confidence")],
            ].map(([x, y, label]) => (
              <text key={label} x={toX(x)} y={toY(y)} textAnchor="middle" fill={t.faint} fontSize="10.5" fontWeight="800">
                {label}
              </text>
            ))}

            {validPoints.map(point => {
              const selected = point.id === selectedPoint?.id
              return (
                <g key={point.id} role="button" tabIndex="0" onClick={() => onSelectCandidate(point.id)} onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") onSelectCandidate(point.id)
                }} style={{ cursor: "pointer" }}>
                  <circle cx={toX(point.x)} cy={toY(point.y)} r={point.radius + (selected ? 4 : 0)} fill={point.color} opacity={selected ? 0.95 : 0.68} stroke={selected ? t.textStrong : "#fff"} strokeWidth={selected ? 2.4 : 1.4} />
                  <text x={toX(point.x)} y={toY(point.y) - point.radius - 8} textAnchor="middle" fill={selected ? t.textStrong : t.muted} fontSize="10.5" fontWeight="850">
                    {point.candidate.name || point.id}
                  </text>
                </g>
              )
            })}
          </svg>

          {pendingPoints.length > 0 && (
            <div style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 8, marginTop: 8, paddingTop: 9 }}>
              <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
                {text(lang, "Pending 区域", "Pending records")}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {pendingPoints.map(point => (
                  <button
                    key={point.id}
                    type="button"
                    onClick={() => onSelectCandidate(point.id)}
                    style={{
                      ...toolbarBtn(t),
                      background: point.id === selectedPoint?.id ? t.badgeWarnBg : t.bg,
                      borderColor: point.id === selectedPoint?.id ? t.warn : t.border,
                      color: point.id === selectedPoint?.id ? t.warn : t.muted,
                      minHeight: 30,
                      padding: "5px 9px",
                    }}
                  >
                    {point.candidate.name || point.id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <CandidateExplanation candidate={selectedPoint?.candidate} point={selectedPoint} lang={lang} t={t} />
      </div>
    </section>
  )
}
