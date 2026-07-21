// @ts-nocheck
import { useMemo, useState } from "react"
import { useLang, useT, useViewport } from "../../contexts"
import { SCIENTIFIC_TOKEN_FONT } from "./FormulaInline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const NODE_POSITIONS = {
  glucose: { x: 70, y: 210, label: "Glucose" },
  hco3: { x: 70, y: 80, label: "HCO₃⁻" },
  c1_intermediate: { x: 330, y: 170, label: "C1 intermediate" },
  hcoo: { x: 330, y: 80, label: "HCOO⁻" },
  formic_acid: { x: 610, y: 80, label: "Formic acid" },
  lactic_acid: { x: 610, y: 180, label: "Lactic acid" },
  acetic_acid: { x: 610, y: 260, label: "Acetic acid" },
  glycolic_acid: { x: 330, y: 315, label: "Glycolic acid" },
  humins_byproducts: { x: 610, y: 340, label: "Humins / by-products" },
}

function chemicalText(value, fallback = "pending") {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "number" && !Number.isFinite(value)) return fallback
  return String(value)
    .replace(/HCO3[−-]/g, "HCO₃⁻")
    .replace(/HCOO[−-]/g, "HCOO⁻")
    .replace(/CO2/g, "CO₂")
    .replace(/_/g, " ")
}

function list(value) {
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

function ruleTone(rule, t) {
  const group = ruleGroup(rule)
  if (group === "formic") return t.success || "#15803D"
  if (group === "competing") return t.warn || "#D97706"
  if (group === "side") return "#8B5E5E"
  return t.accentText || "#2563EB"
}

function evidenceStroke(rule) {
  const evidence = `${rule?.evidenceLevel || ""} ${rule?.status || ""}`.toLowerCase()
  if (evidence.includes("experiment")) return { dash: "", opacity: 1, width: 3.5 }
  if (evidence.includes("literature")) return { dash: "", opacity: 0.9, width: 2.4 }
  if (evidence.includes("hypothesis")) return { dash: "8 6", opacity: 0.76, width: 2.2 }
  return { dash: "4 8", opacity: 0.42, width: 1.8 }
}

function sourceNode(rule) {
  return list(rule?.sourceNodes)[0]
}

function targetNode(rule) {
  return list(rule?.targetNodes)[0]
}

function pathForRule(rule) {
  const source = NODE_POSITIONS[sourceNode(rule)]
  const target = NODE_POSITIONS[targetNode(rule)]
  if (!source || !target) return ""
  const sx = source.x + 70
  const sy = source.y + 24
  const tx = target.x
  const ty = target.y + 24
  const midX = sx + (tx - sx) * 0.52
  const offset = target.y > source.y ? 18 : -10
  return `M ${sx} ${sy} C ${midX} ${sy + offset}, ${midX} ${ty - offset}, ${tx} ${ty}`
}

function pathwayForRule(rule) {
  const haystack = [
    rule?.ruleId,
    rule?.label,
    rule?.pathwayRole,
    rule?.reactionType,
    ...(Array.isArray(rule?.sourceNodes) ? rule.sourceNodes : []),
    ...(Array.isArray(rule?.targetNodes) ? rule.targetNodes : []),
  ].join(" ").toLowerCase()
  if (/formaldehyde|formic|hcoo|c1/.test(haystack)) return "formaldehyde"
  if (/glycer|glycolic|c2/.test(haystack)) return "glyceraldehyde"
  if (/pyru|lactic|dehydration/.test(haystack)) return "pyruvaldehyde"
  return "all"
}

function pathwayLabel(pathway, lang) {
  if (pathway === "formaldehyde") return text(lang, "甲醛 → 甲酸", "Formaldehyde → formic acid")
  if (pathway === "glyceraldehyde") return text(lang, "甘油醛分支", "Glyceraldehyde branches")
  if (pathway === "pyruvaldehyde") return text(lang, "丙酮醛分支", "Pyruvaldehyde branches")
  return text(lang, "全部路径", "All pathways")
}

function selectStyle(t) {
  return {
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    color: t.textStrong,
    fontSize: 12,
    minHeight: 34,
    padding: "0 9px",
  }
}

function relatedEvidenceForRule(evidenceItems, ruleId) {
  return list(evidenceItems).filter(item => item.relatedRuleId === ruleId)
}

function relatedEvidenceForNode(evidenceItems, nodeId) {
  return list(evidenceItems).filter(item => item.relatedPathwayNode === nodeId)
}

function rulesForNode(rules, nodeId) {
  return list(rules).filter(rule => [...list(rule.sourceNodes), ...list(rule.targetNodes)].includes(nodeId))
}

function Pill({ children, t, tone = "info" }) {
  const warn = tone === "warn"
  return (
    <span style={{ background: warn ? t.badgeWarnBg : t.badgeInfoBg, border: `1px solid ${warn ? t.warn : t.border}`, borderRadius: 999, color: warn ? t.warn : t.accentText, display: "inline-flex", fontSize: 11, fontWeight: 800, lineHeight: 1.2, padding: "4px 8px" }}>
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

function ReactionRuleNetwork({
  rules,
  selectedRule,
  selectedPathwayNodeId,
  candidateRuleIds,
  candidateNodeIds,
  onSelectRule,
  onSelectPathwayNode,
  t,
  lang,
}) {
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, minWidth: 0, padding: 10 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{text(lang, "反应规则网络", "Reaction Rule Network")}</strong>
        <span style={{ color: t.faint, fontSize: 11 }}>
          {text(lang, "节点是路径物种，边是 reaction rules。", "Nodes are pathway species; edges are reaction rules.")}
        </span>
      </div>
      <svg viewBox="0 0 760 410" role="img" aria-label="Reaction Rule Network" style={{ display: "block", width: "100%", height: "auto", fontFamily: SCIENTIFIC_TOKEN_FONT }}>
        <defs>
          <marker id="rule-network-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7.5" refY="4">
            <path d="M0,0 L8,4 L0,8 Z" fill={t.faint} />
          </marker>
        </defs>

        {rules.map(rule => {
          const active = selectedRule?.ruleId === rule.ruleId
          const candidateLinked = candidateRuleIds.has(rule.ruleId)
          const stroke = evidenceStroke(rule)
          const color = ruleTone(rule, t)
          return (
            <path
              key={rule.ruleId}
              d={pathForRule(rule)}
              fill="none"
              markerEnd="url(#rule-network-arrow)"
              onClick={() => onSelectRule(rule.ruleId)}
              opacity={active || candidateLinked ? 1 : stroke.opacity}
              stroke={active || candidateLinked ? color : t.borderStrong || color}
              strokeDasharray={stroke.dash}
              strokeWidth={active ? stroke.width + 1.8 : candidateLinked ? stroke.width + 0.8 : stroke.width}
              style={{ cursor: "pointer" }}
            />
          )
        })}

        {Object.entries(NODE_POSITIONS).map(([nodeId, node]) => {
          const selected = selectedPathwayNodeId === nodeId
          const candidateLinked = candidateNodeIds.has(nodeId)
          const active = selected || candidateLinked
          return (
            <g key={nodeId} role="button" tabIndex="0" onClick={() => onSelectPathwayNode(nodeId)} style={{ cursor: "pointer" }}>
              <rect
                x={node.x}
                y={node.y}
                width="140"
                height="48"
                rx="8"
                fill={active ? t.badgeInfoBg : t.panel}
                stroke={selected ? t.accent : candidateLinked ? t.success || t.accent : t.border}
                strokeWidth={selected ? 2.6 : candidateLinked ? 2 : 1.2}
              />
              <text x={node.x + 12} y={node.y + 29} fill={t.textStrong} fontSize="13" fontWeight="900">
                {node.label}
              </text>
            </g>
          )
        })}
      </svg>
    </section>
  )
}

export function ReactionRuleExplorer({
  reactionRules = [],
  evidenceItems = [],
  selectedCandidate,
  selectedRuleId,
  onSelectRule = () => {},
  selectedPathwayNodeId,
  onSelectPathwayNode = () => {},
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
  const [localRuleId, setLocalRuleId] = useState("")
  const [filters, setFilters] = useState({
    pathway: "synced",
    product: "all",
    evidence: "all",
    mechanism: "all",
    status: "all",
  })

  const rules = useMemo(() => (Array.isArray(reactionRules) ? reactionRules : []), [reactionRules])
  const effectivePathway = filters.pathway === "synced" ? selectedPathwayId : filters.pathway
  const filterOptions = useMemo(() => ({
    evidence: [...new Set(rules.map(rule => chemicalText(rule.evidenceLevel)).filter(Boolean))],
    mechanism: [...new Set(rules.map(rule => chemicalText(rule.reactionType)).filter(Boolean))],
    status: [...new Set(rules.map(rule => chemicalText(rule.status)).filter(Boolean))],
  }), [rules])
  const filteredRules = useMemo(() => rules.filter(rule => {
    const rulePath = pathwayForRule(rule)
    const productText = list(rule.targetNodes).join(" ").toLowerCase()
    const matchPathway = effectivePathway === "all" || rulePath === effectivePathway || rulePath === "all"
    const matchProduct = filters.product === "all" || productText.includes(filters.product)
    const matchEvidence = filters.evidence === "all" || chemicalText(rule.evidenceLevel) === filters.evidence
    const matchMechanism = filters.mechanism === "all" || chemicalText(rule.reactionType) === filters.mechanism
    const matchStatus = filters.status === "all" || chemicalText(rule.status) === filters.status
    return matchPathway && matchProduct && matchEvidence && matchMechanism && matchStatus
  }), [effectivePathway, filters.evidence, filters.mechanism, filters.product, filters.status, rules])
  const groupedRules = useMemo(() => {
    const groups = { formic: [], competing: [], side: [], validation: [] }
    filteredRules.forEach(rule => {
      groups[ruleGroup(rule)].push(rule)
    })
    return groups
  }, [filteredRules])

  const activeRuleId = selectedRuleId || localRuleId || groupedRules.formic[0]?.ruleId || filteredRules[0]?.ruleId || rules[0]?.ruleId || ""
  const selectedRule = rules.find(rule => rule.ruleId === activeRuleId) || null
  const selectedEvidence = selectedRule ? relatedEvidenceForRule(evidenceItems, selectedRule.ruleId) : []
  const nodeRules = selectedPathwayNodeId ? rulesForNode(rules, selectedPathwayNodeId) : []
  const nodeEvidence = selectedPathwayNodeId ? relatedEvidenceForNode(evidenceItems, selectedPathwayNodeId) : []
  const candidateRoles = list(selectedCandidate?.organicAcidRelevance?.possibleRoles)
  const candidateRuleIds = new Set(candidateRoles.map(role => role.relatedRuleId).filter(Boolean))
  const candidateNodeIds = new Set(candidateRoles.map(role => role.relatedPathwayNode).filter(Boolean))

  const selectRule = (ruleId) => {
    setLocalRuleId(ruleId)
    onSelectRule(ruleId)
  }

  return (
    <section id="organic-acid-reaction-rule-explorer" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, minWidth: 0, padding: isMobile ? 12 : 14, scrollMarginTop: 118 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900 }}>{text(lang, "反应规则浏览器", "Reaction Rule Explorer")}</div>
        <h2 style={{ color: t.textStrong, fontSize: isMobile ? 20 : 23, fontWeight: 940, lineHeight: 1.16, margin: 0 }}>
          {text(lang, "有机酸反应规则与证据图", "Organic Acid Reaction Rules and Evidence")}
        </h2>
        <div style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, maxWidth: 920 }}>
          {text(
            lang,
            "用节点—边网络展示路径节点、反应规则、证据条目和候选物角色之间的关系。",
            "A node-edge network connecting pathway nodes, reaction rules, evidence items, and candidate roles."
          )}
        </div>
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.muted, fontSize: 11.5, lineHeight: 1.55, padding: 10 }}>
          {text(
            lang,
            "这是一个假设层反应规则图。它不确认有机酸机理。它不预测甲酸产率。相关判断需要实验或 DFT 验证。",
            "This is a hypothesis-layer reaction rule map. It does not confirm the organic-acid mechanism. It does not predict formic acid yield. Experimental or DFT validation is required."
          )}
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: isNarrow ? "1fr" : "repeat(5, minmax(0, 1fr))" }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "路径", "Pathway")}</span>
            <select value={filters.pathway} onChange={event => setFilters(prev => ({ ...prev, pathway: event.target.value }))} style={selectStyle(t)}>
              <option value="synced">{text(lang, "跟随三路径网络", "Synced to network")}: {pathwayLabel(selectedPathwayId, lang)}</option>
              <option value="all">{text(lang, "全部路径", "All pathways")}</option>
              <option value="formaldehyde">{pathwayLabel("formaldehyde", lang)}</option>
              <option value="glyceraldehyde">{pathwayLabel("glyceraldehyde", lang)}</option>
              <option value="pyruvaldehyde">{pathwayLabel("pyruvaldehyde", lang)}</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "产物类别", "Product class")}</span>
            <select value={filters.product} onChange={event => setFilters(prev => ({ ...prev, product: event.target.value }))} style={selectStyle(t)}>
              <option value="all">{text(lang, "全部", "All")}</option>
              <option value="formic">formic / HCOO</option>
              <option value="lactic">lactic</option>
              <option value="acetic">acetic</option>
              <option value="glycolic">glycolic</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "证据", "Evidence")}</span>
            <select value={filters.evidence} onChange={event => setFilters(prev => ({ ...prev, evidence: event.target.value }))} style={selectStyle(t)}>
              <option value="all">{text(lang, "全部", "All")}</option>
              {filterOptions.evidence.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "机理", "Mechanism")}</span>
            <select value={filters.mechanism} onChange={event => setFilters(prev => ({ ...prev, mechanism: event.target.value }))} style={selectStyle(t)}>
              <option value="all">{text(lang, "全部", "All")}</option>
              {filterOptions.mechanism.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "状态", "Status")}</span>
            <select value={filters.status} onChange={event => setFilters(prev => ({ ...prev, status: event.target.value }))} style={selectStyle(t)}>
              <option value="all">{text(lang, "全部", "All")}</option>
              {filterOptions.status.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
      </div>

      {isMobile ? (
        <SectionCard t={t} title={text(lang, "移动端规则列表", "Mobile rule list")}>
          <div style={{ display: "grid", gap: 7 }}>
            {filteredRules.map(rule => (
              <button key={rule.ruleId} type="button" onClick={() => selectRule(rule.ruleId)} style={{ background: selectedRule?.ruleId === rule.ruleId ? t.badgeInfoBg : t.panel, border: `1px solid ${selectedRule?.ruleId === rule.ruleId ? t.accent : t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", padding: 10, textAlign: "left" }}>
                <strong style={{ display: "block", fontSize: 12.5, lineHeight: 1.35 }}>{chemicalText(rule.label)}</strong>
                <span style={{ color: t.muted, display: "block", fontSize: 11.5, lineHeight: 1.45, marginTop: 3 }}>{pathwayLabel(pathwayForRule(rule), lang)} · {chemicalText(rule.status)}</span>
              </button>
            ))}
          </div>
        </SectionCard>
      ) : (
        <ReactionRuleNetwork
          rules={filteredRules}
          selectedRule={selectedRule}
          selectedPathwayNodeId={selectedPathwayNodeId}
          candidateRuleIds={candidateRuleIds}
          candidateNodeIds={candidateNodeIds}
          onSelectRule={selectRule}
          onSelectPathwayNode={onSelectPathwayNode}
          t={t}
          lang={lang}
        />
      )}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "minmax(260px, 0.82fr) minmax(0, 1.35fr)", minWidth: 0 }}>
        <SectionCard t={t} title={text(lang, "反应规则", "Reaction rules")}>
          {Object.entries(groupedRules).map(([group, rows]) => (
            <div key={group} style={{ display: "grid", gap: 7 }}>
              <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{groupLabel(group, lang)}</div>
              {rows.map(rule => {
                const active = selectedRule?.ruleId === rule.ruleId
                const candidateMatched = candidateRuleIds.has(rule.ruleId)
                return (
                  <button
                    key={rule.ruleId}
                    type="button"
                    onClick={() => selectRule(rule.ruleId)}
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
                    <span style={{ fontSize: 12.5, fontWeight: 900, lineHeight: 1.3 }}>{chemicalText(rule.label)}</span>
                    <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.4 }}>{chemicalText(rule.reactionType)} · {chemicalText(rule.status)}</span>
                    {candidateMatched ? <Pill t={t}>{text(lang, "候选物已关联", "Candidate-linked")}</Pill> : null}
                  </button>
                )
              })}
            </div>
          ))}
        </SectionCard>

        <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
          <SectionCard t={t} title={text(lang, "规则详情", "Rule detail")}>
            {selectedRule ? (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <Pill t={t}>{chemicalText(selectedRule.evidenceLevel)}</Pill>
                  <Pill t={t} tone="warn">{chemicalText(selectedRule.status)}</Pill>
                  <Pill t={t}>{chemicalText(selectedRule.confidence)}</Pill>
                </div>
                <h3 style={{ color: t.textStrong, fontSize: 18, lineHeight: 1.22, margin: 0 }}>{chemicalText(selectedRule.label)}</h3>
                <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>
                  {list(selectedRule.sourceNodes).map(chemicalText).join(", ") || "pending"} → {list(selectedRule.targetNodes).map(chemicalText).join(", ") || "pending"}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "待验证内容", "Validation needed")}</strong>
                  {list(selectedRule.requiredValidation).map(item => (
                    <span key={item} style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>{chemicalText(item)}</span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: t.muted, fontSize: 12 }}>{text(lang, "反应规则待加载。", "Reaction rules pending load.")}</div>
            )}
          </SectionCard>

          <SectionCard t={t} title={text(lang, "证据条目与节点上下文", "Evidence items and node context")}>
            <div style={{ display: "grid", gap: 8 }}>
              <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "规则证据", "Rule evidence")}</strong>
              {selectedEvidence.length ? selectedEvidence.map(item => (
                <article key={item.evidenceId} style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 4, paddingTop: 8 }}>
                  <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 850 }}>{chemicalText(item.claim)}</div>
                  <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>{chemicalText(item.evidenceType)} · {chemicalText(item.confidence)} · {chemicalText(item.status)}</div>
                </article>
              )) : (
                <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}>
                  {text(lang, "该规则暂无证据条目；后续文献、DFT 或实验结果可挂接到 ruleId。", "No evidence items are assigned to this rule yet; literature, DFT, or experimental results can be attached by ruleId later.")}
                </div>
              )}
            </div>

            {selectedPathwayNodeId && (
              <div style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 7, paddingTop: 9 }}>
                <strong style={{ color: t.textStrong, fontSize: 12.5 }}>
                  {text(lang, "选中节点", "Selected node")}: {chemicalText(NODE_POSITIONS[selectedPathwayNodeId]?.label || selectedPathwayNodeId)}
                </strong>
                <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
                  {text(lang, "相关规则", "Related rules")}: {nodeRules.map(rule => chemicalText(rule.label)).join("; ") || "pending"}
                </span>
                <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
                  {text(lang, "相关证据", "Related evidence")}: {nodeEvidence.map(item => chemicalText(item.claim)).join("; ") || "pending"}
                </span>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </section>
  )
}
