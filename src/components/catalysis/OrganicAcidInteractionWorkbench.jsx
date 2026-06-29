// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { BasisBadge, ChemicalText, fetchDataJson, useViewport } from "../../shared"
import {
  ORGANIC_ACID_FONT,
  SCIENTIFIC_TOKEN_FONT,
  organicAcidPalette as palette,
} from "./FormulaInline"

const pick = (lang, zh, en) => (lang === "zh" ? zh : en)

const FACTORS = [
  ["MOF candidate", "MOF 候选物"],
  ["metal node", "金属节点"],
  ["linker / functional group", "连接体 / 官能团"],
  ["pore size class", "孔径类别"],
  ["water stability", "水稳定性"],
  ["reaction pathway", "反应路径"],
  ["reaction condition", "反应条件"],
  ["evidence type", "证据类型"],
]

const MAIN_EFFECTS = [
  {
    factor: "MOF candidate",
    factorZh: "MOF 候选物",
    target: "formic acid priority",
    targetZh: "甲酸优先级",
    direction: "positive",
    directionZh: "正向",
    strength: "high",
    evidence: "B",
    explanation: "Candidate-level descriptors support formaldehyde to formic-acid routing, but this remains a validation hypothesis.",
    explanationZh: "候选物描述符支持甲醛到甲酸路径，但仍属于待验证假设。",
    source: "pathway rule map + candidate descriptors",
  },
  {
    factor: "reaction pathway",
    factorZh: "反应路径",
    target: "suppress competing pathway",
    targetZh: "抑制竞争路径",
    direction: "unknown",
    directionZh: "未知",
    strength: "low",
    evidence: "D",
    explanation: "No direct evidence yet shows that the C2 branch is suppressed under matched conditions.",
    explanationZh: "尚无直接证据表明同条件下 C2 支路被抑制。",
    source: "validation queue",
  },
  {
    factor: "water stability",
    factorZh: "水稳定性",
    target: "water-phase stability",
    targetZh: "水相稳定性",
    direction: "positive",
    directionZh: "正向",
    strength: "medium",
    evidence: "C",
    explanation: "Stable frameworks receive priority because aqueous reaction conditions can dominate catalyst viability.",
    explanationZh: "稳定框架被优先考虑，因为水相条件会主导催化剂可用性。",
    source: "descriptor gap + stability flags",
  },
  {
    factor: "evidence type",
    factorZh: "证据类型",
    target: "validation feasibility",
    targetZh: "验证可行性",
    direction: "neutral",
    directionZh: "中性",
    strength: "medium",
    evidence: "C",
    explanation: "Literature-derived or demo evidence helps organize hypotheses but cannot replace same-condition validation.",
    explanationZh: "文献整理或演示证据有助于组织假设，但不能替代同条件验证。",
    source: "field-level provenance",
  },
]

const STATUS_STYLE = {
  "positive synergy": { color: palette.positive, bg: "rgba(42, 122, 74, 0.14)", zh: "正向协同" },
  "negative conflict": { color: palette.risk, bg: "rgba(182, 84, 84, 0.14)", zh: "负向冲突" },
  uncertain: { color: palette.mixed, bg: "rgba(181, 122, 35, 0.14)", zh: "不确定" },
  "no evidence": { color: palette.faint, bg: palette.surface, zh: "无证据" },
  "needs validation": { color: palette.accent, bg: palette.accentSoft, zh: "需要验证" },
}

function statusMeta(status = "") {
  return STATUS_STYLE[status] || STATUS_STYLE["no evidence"]
}

function evidenceTone(level = "C") {
  if (level === "A") return "calc"
  if (level === "B") return "info"
  if (level === "D") return "warn"
  return "proxy"
}

function MiniLabel({ children, color = palette.faint }) {
  return <span style={{ color, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>{children}</span>
}

function SectionShell({ children, id }) {
  return (
    <section id={id} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, display: "grid", gap: 13, minWidth: 0, padding: 14 }}>
      {children}
    </section>
  )
}

function Badge({ children, tone = "proxy" }) {
  return <BasisBadge tone={tone}>{children}</BasisBadge>
}

function MainEffectPanel({ lang }) {
  return (
    <div style={{ display: "grid", gap: 9 }}>
      <h3 style={{ color: palette.text, fontSize: 15, margin: 0 }}>{pick(lang, "Main Effect Panel / 主效应面板", "Main Effect Panel")}</h3>
      <div style={{ overflowX: "auto", maxWidth: "100%" }}>
        <div style={{ display: "grid", gap: 4, minWidth: 760 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 96px 92px 1.7fr 1fr", gap: 4 }}>
            {[pick(lang, "因素", "Factor"), pick(lang, "目标方向", "Target direction"), pick(lang, "方向", "Direction"), pick(lang, "证据", "Evidence"), pick(lang, "解释", "Explanation"), pick(lang, "来源", "Source")].map(label => (
              <MiniLabel key={label}>{label}</MiniLabel>
            ))}
          </div>
          {MAIN_EFFECTS.map(row => (
            <div key={row.factor} style={{ alignItems: "stretch", display: "grid", gap: 4, gridTemplateColumns: "1fr 1fr 96px 92px 1.7fr 1fr" }}>
              <div style={cellStyle()}>{pick(lang, row.factorZh, row.factor)}</div>
              <div style={cellStyle()}>{pick(lang, row.targetZh, row.target)}</div>
              <div style={cellStyle({ fontWeight: 900, color: row.direction === "positive" ? palette.positive : row.direction === "negative" ? palette.risk : palette.faint })}>{pick(lang, row.directionZh, row.direction)}</div>
              <div style={cellStyle()}><Badge tone={evidenceTone(row.evidence)}>A-D: {row.evidence}</Badge></div>
              <div style={cellStyle()}><ChemicalText value={pick(lang, row.explanationZh, row.explanation)} /></div>
              <div style={cellStyle({ fontFamily: SCIENTIFIC_TOKEN_FONT })}>{row.source}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function cellStyle(extra = {}) {
  return {
    background: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 7,
    color: palette.muted,
    fontSize: 11.5,
    lineHeight: 1.45,
    minWidth: 0,
    overflowWrap: "anywhere",
    padding: 8,
    ...extra,
  }
}

function InteractionMatrix({ rows, selected, setSelected, lang }) {
  const columns = ["reaction pathway", "condition", "risk dimension"]
  const matrixRows = ["MOF / descriptor / factor", "water stability", "linker / functional group", "reaction condition"]
  const cellFor = (rowLabel, colLabel) => rows.find(row => row.rowGroup === rowLabel && row.columnGroup === colLabel)
  return (
    <div style={{ display: "grid", gap: 9 }}>
      <h3 style={{ color: palette.text, fontSize: 15, margin: 0 }}>{pick(lang, "Interaction Effect Matrix / 交互效应矩阵", "Interaction Effect Matrix")}</h3>
      <div style={{ color: palette.faint, fontSize: 11.5, lineHeight: 1.5 }}>
        {pick(lang, "点击单元格查看 heredity check、证据等级、验证建议和限制说明。", "Click a cell to inspect heredity check, evidence level, validation suggestion, and limitation.")}
      </div>
      <div style={{ overflowX: "auto", maxWidth: "100%" }}>
        <div style={{ display: "grid", gap: 5, minWidth: 700 }}>
          <div style={{ display: "grid", gap: 5, gridTemplateColumns: "150px repeat(3, minmax(150px, 1fr))" }}>
            <div />
            {columns.map(col => <MiniLabel key={col}>{pick(lang, col === "reaction pathway" ? "反应路径" : col === "condition" ? "条件" : "风险维度", col)}</MiniLabel>)}
          </div>
          {matrixRows.map(rowLabel => (
            <div key={rowLabel} style={{ display: "grid", gap: 5, gridTemplateColumns: "150px repeat(3, minmax(150px, 1fr))" }}>
              <div style={cellStyle({ color: palette.text, fontWeight: 900 })}>
                {pick(lang, rows.find(row => row.rowGroup === rowLabel)?.rowGroupZh || rowLabel, rowLabel)}
              </div>
              {columns.map(col => {
                const item = cellFor(rowLabel, col)
                const meta = statusMeta(item?.status || "no evidence")
                return (
                  <button
                    key={`${rowLabel}-${col}`}
                    type="button"
                    onClick={() => item && setSelected(item)}
                    style={{
                      ...cellStyle({ background: meta.bg, borderColor: selected?.id === item?.id ? palette.accent : palette.border, color: meta.color, cursor: item ? "pointer" : "default", minHeight: 72, textAlign: "left" }),
                    }}
                  >
                    <strong style={{ display: "block", fontSize: 12 }}>{pick(lang, item?.statusZh || meta.zh, item?.status || "no evidence")}</strong>
                    <span style={{ color: palette.muted, display: "block", marginTop: 4 }}>{item ? `${pick(lang, item.factorAZh, item.factorA)} × ${pick(lang, item.factorBZh, item.factorB)}` : pick(lang, "暂无证据", "No evidence")}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Inspector({ item, lang }) {
  if (!item) return null
  const rows = [
    [pick(lang, "因素 A", "Factor A"), pick(lang, item.factorAZh, item.factorA)],
    [pick(lang, "因素 B", "Factor B"), pick(lang, item.factorBZh, item.factorB)],
    [pick(lang, "方向", "Direction"), pick(lang, item.directionZh, item.direction)],
    [pick(lang, "证据等级", "Evidence level"), `A-D: ${item.evidenceLevel || "C"} · ${item.dataStatus || "demo"}`],
    [pick(lang, "Heredity check", "Heredity check"), item.hereditySupport],
    [pick(lang, "Interaction allowed", "Interaction allowed"), item.interactionAllowed],
    [pick(lang, "验证建议", "Validation suggestion"), pick(lang, item.validationSuggestionZh, item.validationSuggestion)],
    [pick(lang, "限制", "Limitation"), pick(lang, item.limitationZh, item.limitation)],
  ]
  return (
    <aside style={{ background: palette.surface, border: `1px solid ${palette.borderStrong}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <h3 style={{ color: palette.text, fontSize: 15, margin: 0 }}>{pick(lang, "Interaction Inspector / 交互检查器", "Interaction Inspector")}</h3>
        <Badge tone={evidenceTone(item.evidenceLevel)}>demo / inferred</Badge>
      </div>
      <div style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.6 }}>
        <ChemicalText value={pick(lang, item.mechanismNoteZh, item.mechanismNote)} />
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ borderTop: `1px solid ${palette.border}`, display: "grid", gap: 5, gridTemplateColumns: "138px minmax(0, 1fr)", paddingTop: 7 }}>
            <MiniLabel>{label}</MiniLabel>
            <span style={{ color: palette.muted, fontFamily: label.includes("Evidence") || label.includes("证据") ? SCIENTIFIC_TOKEN_FONT : undefined, fontSize: 11.8, lineHeight: 1.45, overflowWrap: "anywhere" }}><ChemicalText value={value || "pending"} /></span>
          </div>
        ))}
      </div>
      <div style={{ background: palette.riskSoft, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.risk, fontSize: 12, lineHeight: 1.55, padding: 10 }}>
        {pick(lang, item.riskNoteZh, item.riskNote)}
      </div>
    </aside>
  )
}

function EvidenceGate({ rows, lang }) {
  const selected = rows.slice(0, 4)
  return (
    <div style={{ display: "grid", gap: 9 }}>
      <h3 style={{ color: palette.text, fontSize: 15, margin: 0 }}>{pick(lang, "Heredity Rule Evidence Gate / 遗传规则证据门", "Heredity Rule Evidence Gate")}</h3>
      <div style={{ background: palette.accentSoft, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.muted, fontSize: 12.5, lineHeight: 1.6, padding: 10 }}>
        {pick(
          lang,
          "如果相关主效应缺乏证据，则交互效应默认降权，除非有明确文献或实验支持。",
          "If related main effects lack evidence, the interaction effect is downgraded by default unless explicit literature or experimental support exists."
        )}
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {selected.map(row => (
          <article key={row.id} style={cellStyle()}>
            <strong style={{ color: palette.text, display: "block", fontSize: 12.5 }}>{pick(lang, row.factorAZh, row.factorA)} × {pick(lang, row.factorBZh, row.factorB)}</strong>
            <div style={{ marginTop: 6 }}>{pick(lang, "主效应支持", "Main effect support")}: <b>{row.mainEffectSupport}</b></div>
            <div>{pick(lang, "交互允许", "Interaction allowed")}: <b>{row.interactionAllowed}</b></div>
            <div>{pick(lang, "证据等级", "Evidence level")}: A-D {row.evidenceLevel}</div>
          </article>
        ))}
      </div>
    </div>
  )
}

function CoverageMap({ rows, lang }) {
  return (
    <div style={{ display: "grid", gap: 9 }}>
      <h3 style={{ color: palette.text, fontSize: 15, margin: 0 }}>{pick(lang, "Experimental Design Coverage Map / 实验设计覆盖图", "Experimental Design Coverage Map")}</h3>
      <div style={{ overflowX: "auto", maxWidth: "100%" }}>
        <div style={{ display: "grid", gap: 4, minWidth: 820 }}>
          <div style={{ display: "grid", gap: 4, gridTemplateColumns: "1.4fr 1fr 1fr 1fr 92px 1.4fr" }}>
            {[pick(lang, "因素组合", "Factor combination"), pick(lang, "路径", "Pathway"), pick(lang, "覆盖状态", "Coverage"), pick(lang, "缺口", "Missing"), pick(lang, "优先级", "Priority"), pick(lang, "建议验证", "Suggested validation")].map(label => <MiniLabel key={label}>{label}</MiniLabel>)}
          </div>
          {rows.map(row => (
            <div key={row.id} style={{ display: "grid", gap: 4, gridTemplateColumns: "1.4fr 1fr 1fr 1fr 92px 1.4fr" }}>
              <div style={cellStyle()}><ChemicalText value={pick(lang, row.factorsZh, row.factors)} /></div>
              <div style={cellStyle()}>{pick(lang, row.pathwayZh, row.pathway)}</div>
              <div style={cellStyle({ color: palette.accent, fontWeight: 850 })}>{pick(lang, row.coverageStatusZh, row.coverageStatus)}</div>
              <div style={cellStyle()}>{pick(lang, row.missingZh, row.missing)}</div>
              <div style={cellStyle({ fontWeight: 900, color: row.priority === "high" ? palette.risk : palette.accent })}>{row.priority}</div>
              <div style={cellStyle()}>{pick(lang, row.suggestedValidationZh, row.suggestedValidation)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ValidationQueue({ rows, lang }) {
  return (
    <div style={{ display: "grid", gap: 9 }}>
      <h3 style={{ color: palette.text, fontSize: 15, margin: 0 }}>{pick(lang, "Validation Queue / 验证队列", "Validation Queue")}</h3>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
        {rows.slice(0, 4).map(row => (
          <article key={row.id} style={cellStyle({ display: "grid", gap: 6 })}>
            <Badge tone={row.validationPriority === "high" ? "warn" : "info"}>{row.validationPriority || "medium"}</Badge>
            <strong style={{ color: palette.text, fontSize: 12.5 }}>{pick(lang, row.factorAZh, row.factorA)} × {pick(lang, row.factorBZh, row.factorB)}</strong>
            <span>{pick(lang, "当前证据", "Current evidence")}: A-D {row.evidenceLevel} · {row.dataStatus}</span>
            <span>{pick(lang, "不确定性", "Uncertainty")}: {pick(lang, row.riskNoteZh, row.riskNote)}</span>
            <span>{pick(lang, "建议验证", "Suggested validation")}: {pick(lang, row.validationSuggestionZh, row.validationSuggestion)}</span>
            <span>{pick(lang, "预期影响", "Expected impact")}: {row.expectedImpact}</span>
          </article>
        ))}
      </div>
    </div>
  )
}

export function OrganicAcidInteractionWorkbench({ lang = "en", selectedCandidate, selectedPathwayId }) {
  const { isNarrow } = useViewport()
  const [interactions, setInteractions] = useState([])
  const [coverage, setCoverage] = useState([])
  const organicRows = useMemo(() => interactions.filter(row => row.module === "organic-acid"), [interactions])
  const [selectedId, setSelectedId] = useState("oa-mof-pathway-formate")
  const selected = organicRows.find(row => row.id === selectedId) || organicRows[0]

  useEffect(() => {
    let active = true
    fetchDataJson("interaction_effects_demo.json", []).then(rows => {
      if (active) setInteractions(Array.isArray(rows) ? rows : [])
    }).catch(() => active && setInteractions([]))
    fetchDataJson("experimental_design_coverage_demo.json", []).then(rows => {
      if (active) setCoverage(Array.isArray(rows) ? rows : [])
    }).catch(() => active && setCoverage([]))
    return () => { active = false }
  }, [])

  return (
    <SectionShell id="organic-acid-interaction-workbench">
      <header style={{ display: "grid", gap: 7 }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <div>
            <MiniLabel color={palette.accent}>{pick(lang, "structured factor effects", "structured factor effects")}</MiniLabel>
            <h2 style={{ color: palette.text, fontSize: isNarrow ? 20 : 23, lineHeight: 1.15, margin: "5px 0 0" }}>
              {pick(lang, "Organic Acid Interaction Workbench / 有机酸交互效应工作台", "Organic Acid Interaction Workbench")}
            </h2>
          </div>
          <Badge tone="warn">{pick(lang, "假设与决策支持", "hypothesis / decision support")}</Badge>
        </div>
        <p style={{ color: palette.muted, fontFamily: ORGANIC_ACID_FONT, fontSize: 12.5, lineHeight: 1.6, margin: 0, maxWidth: 940 }}>
          {pick(
            lang,
            "该工作台把 MOF、金属节点、官能团、孔径、水稳定性、反应路径、条件和证据类型视作分类因素，拆分主效应与交互效应；输出用于验证优先级，不是最终产率预测或真实性能结论。",
            "This workbench treats MOF, metal node, functional group, pore class, water stability, pathway, condition, and evidence type as categorical factors. It separates main and interaction effects for validation prioritization, not final yield prediction or real performance claims."
          )}
        </p>
        <div style={{ color: palette.faint, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11.5 }}>
          {pick(lang, "当前候选", "Current candidate")}: {selectedCandidate?.displayName || selectedCandidate?.name || "pending"} · {pick(lang, "路径", "Pathway")}: {selectedPathwayId || "formaldehyde"}
        </div>
      </header>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.25fr) minmax(300px, 0.75fr)" }}>
        <div style={{ display: "grid", gap: 13, minWidth: 0 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <h3 style={{ color: palette.text, fontSize: 15, margin: 0 }}>{pick(lang, "Factor Setup / 因素设置", "Factor Setup")}</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {FACTORS.map(([en, zh]) => <Badge key={en} tone="proxy">{pick(lang, zh, en)}</Badge>)}
            </div>
          </div>
          <MainEffectPanel lang={lang} />
          <InteractionMatrix rows={organicRows} selected={selected} setSelected={row => setSelectedId(row.id)} lang={lang} />
        </div>
        <Inspector item={selected} lang={lang} />
      </div>

      <EvidenceGate rows={organicRows} lang={lang} />
      <CoverageMap rows={coverage} lang={lang} />
      <ValidationQueue rows={organicRows} lang={lang} />
    </SectionShell>
  )
}
