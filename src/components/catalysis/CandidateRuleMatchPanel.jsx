import { useMemo } from "react"
import { useLang, useT, useViewport } from "../../contexts"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function safeText(value, fallback = "pending") {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "number" && !Number.isFinite(value)) return fallback
  return String(value).replace(/_/g, " ")
}

function list(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function curationTasks(candidate, lang) {
  const source = `${candidate?.sourceDatabase || candidate?.provenance?.sourceDatabase || ""}`.toLowerCase()
  if (source.includes("qmof")) {
    return [
      text(lang, "作为电子描述符种子保留。", "Use as an electronic descriptor seed."),
      text(lang, "补查几何描述符和水稳定性。", "Curate geometry descriptors and water stability."),
      text(lang, "不要推断甲酸路径相关性。", "Do not infer formic-acid relevance."),
    ]
  }
  return [
    text(lang, "查询水稳定性文献。", "Curate water-stability literature."),
    text(lang, "查询 HCOO⁻ / HCO₃⁻ 吸附或结合证据。", "Curate HCOO⁻ / HCO₃⁻ adsorption or binding evidence."),
    text(lang, "若进入实验，记录产物分布和反应后 MOF 稳定性。", "If tested, record product distribution and post-reaction MOF stability."),
  ]
}

function isPendingRelevance(candidate) {
  const relevance = candidate?.organicAcidRelevance || {}
  const statusText = `${relevance.scoreStatus || ""} ${relevance.targetPathway || ""} ${candidate?.dataStatus || ""}`.toLowerCase()
  return statusText.includes("pending") || !list(relevance.possibleRoles).length
}

function matchesForCandidate(candidate, reactionRules, evidenceItems) {
  const roles = list(candidate?.organicAcidRelevance?.possibleRoles)
  if (!roles.length || isPendingRelevance(candidate)) return []
  const rules = Array.isArray(reactionRules) ? reactionRules : []
  const evidence = Array.isArray(evidenceItems) ? evidenceItems : []

  return roles.flatMap((role) => {
    const roleRuleId = role.relatedRuleId
    const roleNode = role.relatedPathwayNode
    const matchedRules = rules.filter(rule => {
      if (roleRuleId && rule.ruleId === roleRuleId) return true
      const nodes = [...list(rule.sourceNodes), ...list(rule.targetNodes)]
      return roleNode && nodes.includes(roleNode)
    })
    return matchedRules.map(rule => ({
      role,
      rule,
      evidenceItems: evidence.filter(item => item.relatedRuleId === rule.ruleId || item.relatedPathwayNode === roleNode),
    }))
  })
}

function StatusPill({ children, t, tone = "info" }) {
  return (
    <span style={{ background: tone === "warn" ? t.badgeWarnBg : t.badgeInfoBg, border: `1px solid ${tone === "warn" ? t.warn : t.border}`, borderRadius: 999, color: tone === "warn" ? t.warn : t.accentText, display: "inline-flex", fontSize: 11, fontWeight: 850, lineHeight: 1.2, padding: "4px 8px" }}>
      {children}
    </span>
  )
}

export function CandidateRuleMatchPanel({
  selectedCandidate,
  reactionRules = [],
  evidenceItems = [],
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

  const matches = useMemo(() => (
    matchesForCandidate(selectedCandidate, reactionRules, evidenceItems)
  ), [evidenceItems, reactionRules, selectedCandidate])
  const pending = isPendingRelevance(selectedCandidate)
  const validationNeeded = list(selectedCandidate?.organicAcidRelevance?.validationNeeded)

  return (
    <section id="candidate-rule-match-panel" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, minWidth: 0, padding: isMobile ? 12 : 14, scrollMarginTop: 118 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900 }}>
          Candidate Rule Match
        </div>
        <h2 style={{ color: t.textStrong, fontSize: isMobile ? 20 : 23, fontWeight: 940, lineHeight: 1.16, margin: 0 }}>
          {text(lang, "候选物规则匹配", "Candidate Rule Match Panel")}
        </h2>
        <div style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, maxWidth: 900 }}>
          {text(
            lang,
            "这里只显示已经被明确挂接到 ruleId 或 pathway node 的候选物角色；pending Open MOF Seed 不会被自动分配路径作用。",
            "Only candidate roles explicitly attached to a ruleId or pathway node are shown here; pending Open MOF Seed records are not automatically assigned pathway roles."
          )}
        </div>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ color: t.faint, fontSize: 11, fontWeight: 850 }}>{text(lang, "候选物", "Candidate")}</div>
          <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 940, lineHeight: 1.2 }}>
            {safeText(selectedCandidate?.name || selectedCandidate?.id)}
          </div>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            {safeText(selectedCandidate?.sourceDatabase || selectedCandidate?.provenance?.sourceDatabase || selectedCandidate?.dataStatus)} · {safeText(selectedCandidate?.organicAcidRelevance?.scoreStatus)}
          </div>
        </div>

        {pending ? (
          <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.muted, display: "grid", fontSize: 12.5, gap: 6, lineHeight: 1.55, padding: 11 }}>
            <strong style={{ color: t.textStrong }}>
              {text(lang, "尚未分配有机酸规则匹配。", "No rule-level organic-acid match assigned yet.")}
            </strong>
            <span>
              {text(
                lang,
                "在没有文献、DFT 或实验支持前，该候选物只作为数据库记录进入浏览和待整理队列，不赋予甲酸路径导向作用结论。",
                "Without literature, DFT, or experimental support, this candidate remains a database record in the curation queue and receives no formic-acid-oriented role assignment."
              )}
            </span>
            <div style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 5, marginTop: 4, paddingTop: 8 }}>
              <strong style={{ color: t.textStrong }}>{text(lang, "建议整理", "Suggested curation")}</strong>
              {curationTasks(selectedCandidate, lang).map(task => <span key={task}>{safeText(task)}</span>)}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <StatusPill t={t}>{text(lang, "匹配规则", "Matched rules")}: {matches.length}</StatusPill>
              <StatusPill t={t} tone="warn">{safeText(selectedCandidate?.organicAcidRelevance?.scoreStatus)}</StatusPill>
            </div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
              {matches.map(({ rule, role, evidenceItems: rows }, index) => (
                <article key={`${rule.ruleId}-${role.relatedPathwayNode || index}`} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, padding: 11 }}>
                  <div style={{ color: t.textStrong, fontSize: 13.5, fontWeight: 920, lineHeight: 1.3 }}>{index + 1}. {safeText(rule.label)}</div>
                  <div style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.5 }}>
                    {text(lang, "可能原因", "Possible reason")}: {safeText(role.relatedFeature || role.role || role.label)}
                  </div>
                  <div style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.5 }}>
                    {text(lang, "证据", "Evidence")}: {safeText(role.evidenceLevel || rule.evidenceLevel)} · {safeText(rule.confidence)}
                  </div>
                  <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5 }}>
                    {text(lang, "待验证", "Validation needed")}: {list(role.validationNeeded).concat(list(rule.requiredValidation)).slice(0, 3).map(item => safeText(item)).join("; ") || "pending"}
                  </div>
                  {rows.length ? (
                    <div style={{ borderTop: `1px solid ${t.border}`, color: t.faint, display: "grid", fontSize: 10.8, gap: 4, lineHeight: 1.45, paddingTop: 7 }}>
                      {rows.slice(0, 2).map(item => <span key={item.evidenceId}>{safeText(item.claim)} · {safeText(item.status)}</span>)}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 6, paddingTop: 9 }}>
              <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "下一步整理任务", "Next curation tasks")}</strong>
              {curationTasks(selectedCandidate, lang).map(task => (
                <span key={task} style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>{safeText(task)}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${t.border}`, color: t.muted, display: "grid", fontSize: 12, gap: 5, lineHeight: 1.5, paddingTop: 9 }}>
          <strong style={{ color: t.textStrong }}>{text(lang, "验证需求", "Validation needs")}</strong>
          {validationNeeded.length ? validationNeeded.slice(0, 5).map(item => <span key={item}>{safeText(item)}</span>) : <span>{text(lang, "待人工、DFT 或实验整理。", "Pending manual, DFT, or experimental curation.")}</span>}
        </div>
      </div>
    </section>
  )
}
