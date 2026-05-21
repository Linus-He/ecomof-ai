import { useMemo, useState } from "react"
import { useLang, useT, useViewport } from "../../contexts"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function safeText(value, fallback = "pending") {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "number" && !Number.isFinite(value)) return fallback
  return String(value).replace(/_/g, " ")
}

function normalizeList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function ruleGroup(rule) {
  const role = String(rule?.pathwayRole || "").toLowerCase()
  if (role.includes("formic")) return "formic"
  if (role.includes("competing")) return "competing"
  if (role.includes("side")) return "side"
  return "validation"
}

function groupLabel(group, lang) {
  if (group === "formic") return text(lang, "甲酸路径", "Formic acid pathway")
  if (group === "competing") return text(lang, "竞争路径", "Competing pathways")
  if (group === "side") return text(lang, "副反应", "Side reactions")
  return text(lang, "验证规则", "Validation rules")
}

function Pill({ children, t, tone = "info" }) {
  const background = tone === "warn" ? t.badgeWarnBg : t.badgeInfoBg
  const color = tone === "warn" ? t.warn : t.accentText
  return (
    <span style={{ background, border: `1px solid ${tone === "warn" ? t.warn : t.border}`, borderRadius: 999, color, display: "inline-flex", fontSize: 11, fontWeight: 800, lineHeight: 1.2, padding: "4px 8px" }}>
      {children}
    </span>
  )
}

function SectionCard({ title, children, t }) {
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, minWidth: 0, padding: 12 }}>
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>{title}</div>
      {children}
    </section>
  )
}

function DetailRow({ label, children, t }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ color: t.faint, fontSize: 11, fontWeight: 850 }}>{label}</div>
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>{children}</div>
    </div>
  )
}

function findEvidenceForRule(evidenceItems, ruleId) {
  return normalizeList(evidenceItems).filter(item => item.relatedRuleId === ruleId)
}

export function ReactionRuleExplorer({
  reactionRules = [],
  evidenceItems = [],
  selectedCandidate,
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

  const rules = useMemo(() => (Array.isArray(reactionRules) ? reactionRules : []), [reactionRules])
  const groupedRules = useMemo(() => {
    const groups = { formic: [], competing: [], side: [], validation: [] }
    rules.forEach(rule => {
      groups[ruleGroup(rule)].push(rule)
    })
    return groups
  }, [rules])

  const [selectedRuleId, setSelectedRuleId] = useState("")
  const selectedRule = useMemo(() => (
    rules.find(rule => rule.ruleId === selectedRuleId) || groupedRules.formic[0] || rules[0] || null
  ), [groupedRules.formic, rules, selectedRuleId])

  const selectedEvidence = useMemo(() => (
    selectedRule ? findEvidenceForRule(evidenceItems, selectedRule.ruleId) : []
  ), [evidenceItems, selectedRule])

  const candidateRoles = normalizeList(selectedCandidate?.organicAcidRelevance?.possibleRoles)
  const candidateRuleIds = new Set(candidateRoles.map(role => role.relatedRuleId).filter(Boolean))

  return (
    <section id="organic-acid-reaction-rule-explorer" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, minWidth: 0, padding: isMobile ? 12 : 14, scrollMarginTop: 118 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900 }}>
          Reaction Rule Explorer
        </div>
        <h2 style={{ color: t.textStrong, fontSize: isMobile ? 20 : 23, fontWeight: 940, lineHeight: 1.16, margin: 0 }}>
          {text(lang, "有机酸反应规则与证据图", "Organic Acid Reaction Rules and Evidence")}
        </h2>
        <div style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, maxWidth: 920 }}>
          {text(
            lang,
            "把路径图中的边拆解为可验证的反应规则，并把证据条目、候选物匹配和待验证内容连接起来。",
            "Pathway edges are represented as verifiable reaction rules connected to evidence items, candidate matches, and validation needs."
          )}
        </div>
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.muted, fontSize: 11.5, lineHeight: 1.55, padding: 10 }}>
          {text(
            lang,
            "这是一个假设层反应规则图。它不确认有机酸机理。它不预测甲酸产率。相关判断需要实验或 DFT 验证。",
            "This is a hypothesis-layer reaction rule map. It does not confirm the organic-acid mechanism. It does not predict formic acid yield. Experimental or DFT validation is required."
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "minmax(260px, 0.82fr) minmax(0, 1.35fr)", minWidth: 0 }}>
        <SectionCard t={t} title={text(lang, "反应规则", "Reaction rules")}>
          {Object.entries(groupedRules).map(([group, rows]) => (
            <div key={group} style={{ display: "grid", gap: 7 }}>
              <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{groupLabel(group, lang)}</div>
              {rows.length ? rows.map(rule => {
                const active = selectedRule?.ruleId === rule.ruleId
                const candidateMatched = candidateRuleIds.has(rule.ruleId)
                return (
                  <button
                    key={rule.ruleId}
                    type="button"
                    onClick={() => setSelectedRuleId(rule.ruleId)}
                    style={{
                      background: active ? t.badgeInfoBg : t.panel,
                      border: `1px solid ${active ? t.accent : t.border}`,
                      borderRadius: 8,
                      color: t.textStrong,
                      cursor: "pointer",
                      display: "grid",
                      gap: 5,
                      padding: 10,
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: 900, lineHeight: 1.3 }}>{safeText(rule.label)}</span>
                    <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.4 }}>{safeText(rule.reactionType)} · {safeText(rule.status)}</span>
                    {candidateMatched ? <Pill t={t}>{text(lang, "候选物已关联", "Candidate-linked")}</Pill> : null}
                  </button>
                )
              }) : (
                <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, "暂无规则", "No rules")}</div>
              )}
            </div>
          ))}
        </SectionCard>

        <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
          <SectionCard t={t} title={text(lang, "规则详情", "Rule detail")}>
            {selectedRule ? (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <Pill t={t}>{safeText(selectedRule.evidenceLevel)}</Pill>
                  <Pill t={t} tone="warn">{safeText(selectedRule.status)}</Pill>
                  <Pill t={t}>{safeText(selectedRule.confidence)}</Pill>
                </div>
                <h3 style={{ color: t.textStrong, fontSize: 18, lineHeight: 1.22, margin: 0 }}>{safeText(selectedRule.label)}</h3>
                <div style={{ display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
                  <DetailRow t={t} label={text(lang, "路径节点", "Pathway nodes")}>
                    {normalizeList(selectedRule.sourceNodes).join(", ") || "pending"} → {normalizeList(selectedRule.targetNodes).join(", ") || "pending"}
                  </DetailRow>
                  <DetailRow t={t} label={text(lang, "反应类型", "Reaction type")}>{safeText(selectedRule.reactionType)}</DetailRow>
                  <DetailRow t={t} label={text(lang, "可能 MOF 影响点", "Possible MOF influence")}>
                    {normalizeList(selectedRule.possibleMofInfluence).map(item => safeText(item)).join(", ") || "pending"}
                  </DetailRow>
                  <DetailRow t={t} label={text(lang, "证据等级", "Evidence level")}>
                    {safeText(selectedRule.evidenceLevel)} · {safeText(selectedRule.confidence)}
                  </DetailRow>
                </div>
                <DetailRow t={t} label={text(lang, "待验证内容", "Required validation")}>
                  <div style={{ display: "grid", gap: 5 }}>
                    {normalizeList(selectedRule.requiredValidation).map(item => <span key={item}>{safeText(item)}</span>)}
                  </div>
                </DetailRow>
                <DetailRow t={t} label={text(lang, "说明", "Notes")}>{safeText(selectedRule.notes)}</DetailRow>
              </>
            ) : (
              <div style={{ color: t.muted, fontSize: 12 }}>{text(lang, "反应规则待加载。", "Reaction rules pending load.")}</div>
            )}
          </SectionCard>

          <SectionCard t={t} title={text(lang, "证据条目与候选物", "Evidence items and candidate context")}>
            <div style={{ display: "grid", gap: 9 }}>
              <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>
                {text(lang, "关联证据", "Related evidence")}
              </div>
              {selectedEvidence.length ? selectedEvidence.map(item => (
                <article key={item.evidenceId} style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 4, paddingTop: 8 }}>
                  <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 850 }}>{safeText(item.claim)}</div>
                  <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>{safeText(item.evidenceType)} · {safeText(item.confidence)} · {safeText(item.status)}</div>
                  <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45 }}>
                    {text(lang, "待验证", "Validation")}: {normalizeList(item.validationNeeded).map(row => safeText(row)).join("; ") || "pending"}
                  </div>
                </article>
              )) : (
                <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}>
                  {text(lang, "该规则暂无证据条目；后续文献、DFT 或实验结果可挂接到 ruleId。", "No evidence items are assigned to this rule yet; literature, DFT, or experimental results can be attached by ruleId later.")}
                </div>
              )}
            </div>
            <div style={{ borderTop: `1px solid ${t.border}`, color: t.muted, display: "grid", fontSize: 12, gap: 5, lineHeight: 1.5, paddingTop: 9 }}>
              <strong style={{ color: t.textStrong }}>{text(lang, "当前候选物", "Current candidate")}: {safeText(selectedCandidate?.name || selectedCandidate?.id)}</strong>
              {candidateRoles.length
                ? candidateRoles.slice(0, 4).map((role, index) => <span key={`${role.relatedRuleId || role.relatedPathwayNode || index}`}>{safeText(role.label || role.role)} · {safeText(role.relatedRuleId || role.relatedPathwayNode)} · {safeText(role.evidenceLevel)}</span>)
                : <span>{text(lang, "尚未分配候选物规则匹配。", "No candidate rule match assigned yet.")}</span>}
            </div>
          </SectionCard>
        </div>
      </div>
    </section>
  )
}
