// @ts-nocheck
import { useMemo, useState } from "react"
import { useLang, useT, useViewport } from "../../contexts"
import { aggregateOrganicAcidFeatures } from "../../utils/organicAcidFeatureAggregation"
import { calculateFormicAcidPathwayScore, mapEvidenceConfidence } from "../../utils/organicAcidScoring"
import { SCIENTIFIC_TOKEN_FONT } from "./FormulaInline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const TIER_ORDER = ["A", "B", "C", "D"]
const TIER_META = {
  A: {
    zh: "Tier A: 优先候选",
    en: "Tier A: strong candidate",
    noteZh: "路径匹配、描述符与证据状态相对完整，适合进入第一批验证讨论。",
    noteEn: "Pathway fit, descriptors, and evidence status are relatively complete; suitable for first validation discussion.",
  },
  B: {
    zh: "Tier B: 有潜力但证据不完整",
    en: "Tier B: promising but incomplete",
    noteZh: "具有可解释信号，但仍存在关键描述符或来源缺口。",
    noteEn: "Useful signals exist, but key descriptors or sources remain incomplete.",
  },
  C: {
    zh: "Tier C: 探索性候选",
    en: "Tier C: exploratory",
    noteZh: "适合作为机制或对照探索，不应被解读为优先验证排序。",
    noteEn: "Suitable for mechanism or control exploration; not a priority validation ranking.",
  },
  D: {
    zh: "Tier D: 低置信度或数据不足",
    en: "Tier D: low confidence or insufficient data",
    noteZh: "pending 或风险过高记录不进入真实优先级排序。",
    noteEn: "Pending or high-risk records are excluded from real priority ranking.",
  },
}

const PATHWAY_LABELS = {
  formaldehyde: ["甲醛 → 甲酸", "Formaldehyde → formic acid"],
  glyceraldehyde: ["甘油醛分支", "Glyceraldehyde branches"],
  pyruvaldehyde: ["丙酮醛分支", "Pyruvaldehyde branches"],
}

function chem(value, fallback = "pending") {
  if (value === null || value === undefined || value === "") return fallback
  return String(value)
    .replace(/HCO3[−-]/g, "HCO₃⁻")
    .replace(/HCOO[−-]/g, "HCOO⁻")
    .replace(/CO2/g, "CO₂")
    .replace(/CH4/g, "CH₄")
    .replace(/N2/g, "N₂")
    .replace(/_/g, " ")
}

function safeNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function candidateName(candidate) {
  return candidate?.displayName || candidate?.commonName || candidate?.name || candidate?.mofName || candidate?.id || "MOF source record"
}

function roles(candidate) {
  return Array.isArray(candidate?.organicAcidRelevance?.possibleRoles) ? candidate.organicAcidRelevance.possibleRoles : []
}

function validationGaps(candidate) {
  const rows = candidate?.organicAcidRelevance?.validationNeeded
  return Array.isArray(rows) && rows.length ? rows : ["literature / DFT / experiment curation pending"]
}

function pathwayForCandidate(candidate) {
  const haystack = [
    candidate?.organicAcidRelevance?.targetPathway,
    candidate?.organicAcidRelevance?.pathway,
    ...roles(candidate).map(role => `${role.relatedPathwayNode || ""} ${role.label || ""} ${role.role || ""}`),
  ].join(" ").toLowerCase()
  if (/glycer|glycolic|c2/.test(haystack)) return "glyceraldehyde"
  if (/pyru|lactic|dehydration/.test(haystack)) return "pyruvaldehyde"
  return "formaldehyde"
}

function candidatePriority(candidate) {
  const relevance = candidate?.organicAcidRelevance || {}
  if (relevance.pathwayPriorityScore !== null && relevance.pathwayPriorityScore !== undefined) {
    return safeNumber(relevance.pathwayPriorityScore)
  }
  return calculateFormicAcidPathwayScore(candidate).finalScore
}

function isPendingCandidate(candidate) {
  const status = `${candidate?.dataStatus || ""} ${candidate?.organicAcidRelevance?.scoreStatus || ""} ${candidate?.graphMetadata?.graphConfidence || ""}`.toLowerCase()
  return status.includes("pending") && !safeNumber(candidate?.organicAcidRelevance?.pathwayPriorityScore, 0)
}

function evidenceScore(candidate, pending) {
  if (pending) return 0
  return mapEvidenceConfidence(candidate?.organicAcidRelevance?.scoreStatus || candidate?.graphMetadata?.graphConfidence || candidate?.dataStatus || "pending")
}

function riskLevel(candidate, features, pending) {
  if (pending) return "high"
  const textBlob = `${candidate?.organicAcidRelevance?.riskPenalty || ""} ${candidate?.organicAcidRelevance?.stabilityConcern || ""} ${candidate?.waterStability || ""} ${candidate?.toxicityConcern || ""}`.toLowerCase()
  if (/toxic|leach|unstable|high|risk|pending/.test(textBlob)) return "high"
  if (safeNumber(features?.stabilitySignals, 0) > 0 || safeNumber(candidate?.waterStabilityScore, 0) > 0.65) return "low"
  return "medium"
}

function tierFor({ pending, priority, evidence, risk }) {
  if (pending || evidence <= 0) return "D"
  if (priority >= 72 && evidence >= 55 && risk !== "high") return "A"
  if (priority >= 58 && evidence >= 35) return "B"
  if (priority >= 35 || evidence >= 25) return "C"
  return "D"
}

function buildPoint(candidate) {
  const pending = isPendingCandidate(candidate)
  const features = aggregateOrganicAcidFeatures(candidate)
  const priority = pending ? null : Math.max(0, Math.min(100, candidatePriority(candidate)))
  const evidence = evidenceScore(candidate, pending)
  const risk = riskLevel(candidate, features, pending)
  const pathway = pathwayForCandidate(candidate)
  const tier = tierFor({ pending, priority: safeNumber(priority), evidence, risk })
  const ruleMatches = roles(candidate).filter(role => role.relatedRuleId)
  return {
    candidate,
    evidence,
    features,
    id: candidate?.id || candidate?.name || candidateName(candidate),
    pathway,
    pending,
    priority,
    risk,
    ruleMatches,
    tier,
  }
}

function Select({ label, value, onChange, children, t }) {
  return (
    <label style={{ display: "grid", gap: 4 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, fontSize: 12, minHeight: 34, padding: "0 9px" }}
      >
        {children}
      </select>
    </label>
  )
}

function CellButton({ point, metric, value, note, onClick, t }) {
  return (
    <button
      type="button"
      title={`${metric}: ${value || "pending"} ${note ? `- ${note}` : ""}`}
      onClick={onClick}
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 7,
        color: t.textStrong,
        cursor: "pointer",
        display: "grid",
        gap: 2,
        minHeight: 54,
        padding: "7px 8px",
        textAlign: "left",
      }}
    >
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>{metric}</span>
      <span style={{ fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 12.2, fontWeight: 850, lineHeight: 1.25 }}>{point.pending ? "pending" : value}</span>
    </button>
  )
}

function CandidateRow({ point, selected, onSelect, onSelectCell, lang, t }) {
  const candidate = point.candidate
  const pathwayLabel = PATHWAY_LABELS[point.pathway] || PATHWAY_LABELS.formaldehyde
  const productClass = point.pathway === "formaldehyde" ? "formic acid / formate" : point.pathway === "glyceraldehyde" ? "C1/C2 mixed products" : "risk byproducts"
  const metal = candidate?.organicAcidRelevance?.metalSiteRationale || roles(candidate)[0]?.role || candidate?.metalType || "open/acid-base site pending"
  const ligand = candidate?.organicAcidRelevance?.ligandRationale || candidate?.functionalGroups?.join?.(", ") || candidate?.organicAcidRelevance?.functionalGroupRationale || "functional group pending"
  const validation = validationGaps(candidate)[0]
  return (
    <article style={{ background: selected ? t.badgeInfoBg : t.panel, border: `1px solid ${selected ? t.accent : t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 10 }}>
      <button type="button" onClick={() => onSelect(point.id)} style={{ background: "transparent", border: "none", color: t.textStrong, cursor: "pointer", display: "grid", gap: 4, padding: 0, textAlign: "left" }}>
        <span style={{ fontSize: 13.5, fontWeight: 950, lineHeight: 1.25, overflowWrap: "anywhere" }}>{candidateName(candidate)}</span>
        <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
          {text(lang, pathwayLabel[0], pathwayLabel[1])} · {text(lang, TIER_META[point.tier].zh, TIER_META[point.tier].en)}
        </span>
      </button>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))" }}>
        <CellButton point={point} metric="Pathway fit" value={point.priority === null ? "pending" : Math.round(point.priority)} note={text(lang, "路径匹配", "pathway fit")} onClick={() => onSelectCell(point, "Pathway fit", point.priority ?? "pending", "Derived from pathway descriptors and rule matches.")} t={t} />
        <CellButton point={point} metric="CO₂ / HCO₃⁻ activation" value={point.features?.bicarbonateSignals ? "supported" : "pending"} note="descriptor support" onClick={() => onSelectCell(point, "CO₂ / HCO₃⁻ activation", point.features?.bicarbonateSignals ? "supported" : "pending", "Descriptor support for bicarbonate/formate activation.")} t={t} />
        <CellButton point={point} metric="Metal site" value={chem(metal)} note="rationale" onClick={() => onSelectCell(point, "Metal-site rationale", metal, "Rule-based contribution; source may be pending.")} t={t} />
        <CellButton point={point} metric="Ligand / group" value={chem(ligand)} note="rationale" onClick={() => onSelectCell(point, "Ligand / functional group rationale", ligand, "Functional-group descriptor or pending curation field.")} t={t} />
        <CellButton point={point} metric="Evidence" value={point.pending ? "source pending" : Math.round(point.evidence)} note={candidate?.organicAcidRelevance?.scoreStatus || candidate?.dataStatus} onClick={() => onSelectCell(point, "Evidence support", point.pending ? "source pending" : point.evidence, candidate?.organicAcidRelevance?.scoreStatus || "curation status pending")} t={t} />
        <CellButton point={point} metric="Risk" value={point.risk} note={candidate?.organicAcidRelevance?.stabilityConcern || candidate?.toxicityConcern || "risk curation"} onClick={() => onSelectCell(point, "Risk penalty", point.risk, "Combines stability, toxicity/sustainability, and byproduct-risk notes.")} t={t} />
        <CellButton point={point} metric="Rule matches" value={point.ruleMatches.length || "pending"} note={point.ruleMatches.map(role => role.relatedRuleId).join(", ")} onClick={() => onSelectCell(point, "Rule matches", point.ruleMatches.length || "pending", point.ruleMatches.map(role => role.relatedRuleId).join(", ") || "No linked rule yet.")} t={t} />
        <CellButton point={point} metric="Validation gap" value={chem(validation)} note="next evidence need" onClick={() => onSelectCell(point, "Validation gap", validation, "Gap to resolve before experimental interpretation.")} t={t} />
      </div>
    </article>
  )
}

function ExplanationPanel({ point, cell, lang, t }) {
  if (!point) return null
  const candidate = point.candidate
  return (
    <aside style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 11, padding: 12 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900 }}>{text(lang, "解释面板", "Explanation panel")}</div>
        <strong style={{ color: t.textStrong, fontSize: 17, lineHeight: 1.2 }}>{candidateName(candidate)}</strong>
        <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>{text(lang, TIER_META[point.tier].zh, TIER_META[point.tier].en)}</span>
      </div>
      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
        <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{cell?.metric || text(lang, "当前候选物", "Selected candidate")}</div>
        <div style={{ color: t.muted, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 12, lineHeight: 1.55, marginTop: 5 }}>{chem(cell?.value ?? candidate?.organicAcidRelevance?.scoreStatus ?? "pending")}</div>
        <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.5, marginTop: 6 }}>{cell?.note || text(lang, "点击矩阵单元格查看指标来源、贡献和风险。", "Click a matrix cell to inspect metric source, contribution, and risk.")}</div>
      </div>
      {[
        [text(lang, "Stability concern / 稳定性风险", "Stability concern"), candidate?.organicAcidRelevance?.stabilityConcern || candidate?.waterStability || "pending"],
        [text(lang, "Toxicity / sustainability / 毒性与可持续性", "Toxicity / sustainability"), candidate?.toxicityConcern || candidate?.sustainabilityConcern || "pending"],
        [text(lang, "Algorithm trace / 算法追踪", "Algorithm trace"), point.pending ? "pending" : "available"],
        [text(lang, "Field provenance / 字段来源", "Field provenance"), candidate?.provenance?.sourceDatabase || candidate?.sourceDatabase || candidate?.dataStatus || "source pending"],
      ].map(([label, value]) => (
        <div key={label} style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 4, paddingTop: 8 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.2 }}>{label}</strong>
          <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.5 }}>{chem(value)}</span>
        </div>
      ))}
    </aside>
  )
}

export function OrganicAcidCandidateMap({
  candidates = [],
  selectedCandidateId,
  onSelectCandidate = () => {},
  selectedPathwayId = "formaldehyde",
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
  const [filters, setFilters] = useState({ pathway: "synced", tier: "all", evidence: "all", risk: "all" })
  const [selectedCell, setSelectedCell] = useState(null)

  const points = useMemo(() => (Array.isArray(candidates) ? candidates : []).map(buildPoint), [candidates])
  const effectivePathway = filters.pathway === "synced" ? selectedPathwayId : filters.pathway
  const filteredPoints = useMemo(() => points.filter(point => {
    const matchPathway = effectivePathway === "all" || point.pathway === effectivePathway
    const matchTier = filters.tier === "all" || point.tier === filters.tier
    const matchEvidence = filters.evidence === "all" || (filters.evidence === "pending" ? point.pending : point.evidence >= Number(filters.evidence))
    const matchRisk = filters.risk === "all" || point.risk === filters.risk
    return matchPathway && matchTier && matchEvidence && matchRisk
  }), [effectivePathway, filters.evidence, filters.risk, filters.tier, points])

  const grouped = useMemo(() => {
    const result = Object.fromEntries(TIER_ORDER.map(tier => [tier, []]))
    filteredPoints.forEach(point => result[point.tier].push(point))
    Object.values(result).forEach(rows => rows.sort((a, b) => safeNumber(b.priority, -1) - safeNumber(a.priority, -1)))
    return result
  }, [filteredPoints])

  const selectedPoint = points.find(point => point.id === selectedCandidateId) || filteredPoints.find(point => !point.pending) || filteredPoints[0] || points[0] || null
  const selectCell = (point, metric, value, note) => {
    onSelectCandidate(point.id)
    setSelectedCell({ pointId: point.id, metric, value, note })
  }

  return (
    <section id="organic-acid-candidate-map" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, minWidth: 0, padding: isMobile ? 12 : 14, scrollMarginTop: 118 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900 }}>Organic Acid Candidate Priority Matrix</div>
        <h2 style={{ color: t.textStrong, fontSize: isMobile ? 20 : 23, fontWeight: 940, lineHeight: 1.16, margin: 0 }}>
          {text(lang, "有机酸候选物优先级矩阵", "Organic Acid Candidate Priority Matrix")}
        </h2>
        <div style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55, maxWidth: 960 }}>
          {text(
            lang,
            "优先级是基于描述符、规则匹配和证据状态生成的决策支持标签，不是已经实验验证的真实排名。",
            "Priority tiers are decision-support labels derived from curated descriptors, rule matches, and evidence status. They are not validated experimental rankings."
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <Select label={text(lang, "Pathway", "Pathway")} value={filters.pathway} onChange={value => setFilters(prev => ({ ...prev, pathway: value }))} t={t}>
          <option value="synced">{text(lang, "跟随三路径网络", "Synced to network")}</option>
          <option value="all">{text(lang, "全部路径", "All pathways")}</option>
          <option value="formaldehyde">{text(lang, PATHWAY_LABELS.formaldehyde[0], PATHWAY_LABELS.formaldehyde[1])}</option>
          <option value="glyceraldehyde">{text(lang, PATHWAY_LABELS.glyceraldehyde[0], PATHWAY_LABELS.glyceraldehyde[1])}</option>
          <option value="pyruvaldehyde">{text(lang, PATHWAY_LABELS.pyruvaldehyde[0], PATHWAY_LABELS.pyruvaldehyde[1])}</option>
        </Select>
        <Select label="Tier" value={filters.tier} onChange={value => setFilters(prev => ({ ...prev, tier: value }))} t={t}>
          <option value="all">{text(lang, "全部", "All")}</option>
          {TIER_ORDER.map(tier => <option key={tier} value={tier}>{text(lang, TIER_META[tier].zh, TIER_META[tier].en)}</option>)}
        </Select>
        <Select label={text(lang, "Evidence", "Evidence")} value={filters.evidence} onChange={value => setFilters(prev => ({ ...prev, evidence: value }))} t={t}>
          <option value="all">{text(lang, "全部", "All")}</option>
          <option value="55">{text(lang, "较强证据", "Stronger evidence")}</option>
          <option value="35">{text(lang, "中等以上", "Moderate or above")}</option>
          <option value="pending">pending</option>
        </Select>
        <Select label={text(lang, "Risk", "Risk")} value={filters.risk} onChange={value => setFilters(prev => ({ ...prev, risk: value }))} t={t}>
          <option value="all">{text(lang, "全部", "All")}</option>
          <option value="low">{text(lang, "低风险", "Low")}</option>
          <option value="medium">{text(lang, "中等风险", "Medium")}</option>
          <option value="high">{text(lang, "高风险 / pending", "High / pending")}</option>
        </Select>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.5fr) minmax(310px, 0.78fr)", minWidth: 0 }}>
        <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
          {TIER_ORDER.map(tier => (
            <section key={tier} style={{ background: t.surface, border: `1px solid ${tier === "D" ? t.warn : t.border}`, borderRadius: 9, display: "grid", gap: 8, minWidth: 0, padding: 10 }}>
              <div style={{ display: "grid", gap: 3 }}>
                <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{text(lang, TIER_META[tier].zh, TIER_META[tier].en)}</strong>
                <span style={{ color: t.faint, fontSize: 11.2, lineHeight: 1.45 }}>{text(lang, TIER_META[tier].noteZh, TIER_META[tier].noteEn)}</span>
              </div>
              {grouped[tier].length ? grouped[tier].map(point => (
                <CandidateRow
                  key={point.id}
                  point={point}
                  selected={point.id === selectedPoint?.id}
                  onSelect={onSelectCandidate}
                  onSelectCell={selectCell}
                  lang={lang}
                  t={t}
                />
              )) : (
                <div style={{ color: t.faint, fontSize: 12, lineHeight: 1.5 }}>{text(lang, "当前筛选下暂无候选物。", "No candidates under the current filters.")}</div>
              )}
            </section>
          ))}
        </div>
        <ExplanationPanel point={selectedPoint} cell={selectedCell?.pointId === selectedPoint?.id ? selectedCell : null} lang={lang} t={t} />
      </div>
    </section>
  )
}
