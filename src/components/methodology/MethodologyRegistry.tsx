// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import {
  ArrowSquareOut,
  BookOpenText,
  ChartBar,
  Database,
  ListDashes,
  MagnifyingGlass,
  ShieldCheck,
} from "@phosphor-icons/react"
import { ChemicalText } from "../common/ChemicalFormula"
import { toolbarBtn } from "../../utils/styles"
import { buildMethodologyRegistry, METHODOLOGY_BOUNDARY_LABELS } from "../../utils/methodologyRegistry"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function toneFor(boundary, t) {
  const tone = METHODOLOGY_BOUNDARY_LABELS[boundary]?.tone
  if (tone === "reviewed") return { background: t.badgeCalcBg, color: t.success }
  if (tone === "conditional" || tone === "pending") return { background: t.badgeWarnBg, color: t.warn }
  return { background: t.badgeInfoBg, color: t.accentText }
}
function BoundaryBadge({ boundary, lang, t }) {
  const label = METHODOLOGY_BOUNDARY_LABELS[boundary] || METHODOLOGY_BOUNDARY_LABELS.experimental_pending
  const tone = toneFor(boundary, t)
  return (
    <span style={{ alignItems: "center", background: tone.background, border: `1px solid ${tone.color}`, borderRadius: 6, color: tone.color, display: "inline-flex", fontSize: 10.2, fontWeight: 900, lineHeight: 1.2, padding: "5px 7px" }}>
      {text(lang, label.zh, label.en)}
    </span>
  )
}

function RegistryMetric({ label, value, note, t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, display: "grid", gap: 3, minWidth: 0, padding: "9px 10px" }}>
      <span style={{ color: t.faint, fontSize: 9.8, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color: t.textStrong, fontSize: 19, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{value}</strong>
      <span style={{ color: t.muted, fontSize: 10.6, lineHeight: 1.35 }}>{note}</span>
    </div>
  )
}

function ViewButton({ active, icon: Icon, label, onClick, t }) {
  return (
    <button
      type="button"
      className="glass-segmented-item"
      data-active={active ? "true" : "false"}
      aria-pressed={active}
      onClick={onClick}
      style={{ color: active ? t.accentText : t.muted }}
    >
      <Icon aria-hidden="true" size={14} weight="bold" />
      {label}
    </button>
  )
}

function MethodIndex({ cards, selectedId, onSelect, query, onQueryChange, boundaryFilter, onBoundaryFilter, lang, t, isMobile }) {
  const filters = [
    ["all", text(lang, "全部", "All")],
    ["governance", text(lang, "治理", "Governance")],
    ["decision_support", text(lang, "决策支持", "Decision support")],
    ["condition_gated", text(lang, "条件门控", "Condition gated")],
    ["experimental_pending", text(lang, "待实验", "Experimental gap")],
  ]
  const filtered = cards.filter(card => {
    const matchesBoundary = boundaryFilter === "all"
      || card.boundary === boundaryFilter
      || (boundaryFilter === "governance" && card.boundary === "evidence_governed")
    const haystack = [card.title, card.titleZh, card.summary, card.summaryZh, card.databaseLabel, card.databaseLabelZh].join(" ").toLowerCase()
    return matchesBoundary && haystack.includes(query.trim().toLowerCase())
  })

  return (
    <div style={{ display: "grid", gap: 9, minWidth: 0 }}>
      <label style={{ alignItems: "center", background: t.surface, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 6, display: "grid", gap: 7, gridTemplateColumns: "auto minmax(0, 1fr)", minHeight: 38, padding: "0 10px" }}>
        <MagnifyingGlass aria-hidden="true" color={t.faint} size={15} weight="bold" />
        <input
          type="search"
          aria-label={text(lang, "搜索方法模块", "Search method modules")}
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          placeholder={text(lang, "搜索模块、数据库或任务", "Search module, database, or task")}
          style={{ background: "transparent", border: 0, color: t.textStrong, font: "inherit", fontSize: 11.8, minWidth: 0, outline: "none", width: "100%" }}
        />
      </label>
      <div aria-label={text(lang, "方法边界筛选", "Method boundary filters")} style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {filters.map(([id, label]) => {
          const active = id === boundaryFilter
          return (
            <button key={id} type="button" aria-pressed={active} onClick={() => onBoundaryFilter(id)} style={{ ...toolbarBtn(t), background: active ? t.badgeInfoBg : t.surface, borderColor: active ? t.accent : t.border, color: active ? t.accentText : t.muted, fontSize: 10.4, minHeight: 30, padding: "4px 7px" }}>
              {label}
            </button>
          )
        })}
      </div>
      <div style={{ display: "grid", gap: 6, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {filtered.map(card => {
          const selected = card.id === selectedId
          return (
            <button
              key={card.id}
              type="button"
              data-testid={`method-registry-item-${card.id}`}
              aria-pressed={selected}
              onClick={() => onSelect(card.id)}
              style={{ background: selected ? t.badgeInfoBg : t.surface, border: `1px solid ${selected ? t.accent : t.border}`, borderRadius: 6, color: t.textStrong, cursor: "pointer", display: "grid", gap: 7, minHeight: 108, minWidth: 0, padding: 10, textAlign: "left" }}
            >
              <span style={{ alignItems: "start", display: "flex", gap: 8, justifyContent: "space-between" }}>
                <strong style={{ fontSize: 12.5, lineHeight: 1.3 }}><ChemicalText value={text(lang, card.titleZh, card.title)} /></strong>
                <span style={{ color: t.faint, fontSize: 9.8, fontVariantNumeric: "tabular-nums", fontWeight: 900 }}>{String(card.sequence).padStart(2, "0")}</span>
              </span>
              <span style={{ color: t.muted, fontSize: 10.8, lineHeight: 1.4 }}><ChemicalText value={text(lang, card.databaseLabelZh, card.databaseLabel)} /></span>
              <span style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto" }}>
                <BoundaryBadge boundary={card.boundary} lang={lang} t={t} />
                <span style={{ color: t.faint, fontSize: 9.9, fontWeight: 850 }}>{card.groups.length} {text(lang, "方法", "methods")} · {card.formulas.length} {text(lang, "公式", "formulas")}</span>
              </span>
            </button>
          )
        })}
      </div>
      {!filtered.length ? (
        <div style={{ border: `1px dashed ${t.borderStrong || t.border}`, borderRadius: 6, color: t.muted, fontSize: 11.5, padding: 14, textAlign: "center" }}>
          {text(lang, "没有匹配的方法模块。", "No method modules match the current filters.")}
        </div>
      ) : null}
    </div>
  )
}

function DefinitionRow({ label, children, t }) {
  return (
    <div style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 6, gridTemplateColumns: "minmax(112px, 0.28fr) minmax(0, 1fr)", padding: "9px 0" }}>
      <strong style={{ color: t.faint, fontSize: 10.4, lineHeight: 1.4, textTransform: "uppercase" }}>{label}</strong>
      <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, minWidth: 0 }}>{children}</div>
    </div>
  )
}

function InlineList({ rows, empty, t }) {
  if (!rows?.length) return <span style={{ color: t.faint }}>{empty}</span>
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {rows.map((row, index) => (
        <span key={`${String(row)}-${index}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, color: t.textStrong, fontSize: 10.6, lineHeight: 1.25, padding: "4px 6px" }}>
          <ChemicalText value={row} />
        </span>
      ))}
    </div>
  )
}

function StandardMethodCard({ card, lang, t, onJump }) {
  if (!card) return null
  const inputs = lang === "zh" ? card.inputsZh : card.inputs
  const outputs = lang === "zh" ? card.outputsZh : card.outputs
  const limitations = lang === "zh" ? card.limitationsZh : card.limitations
  return (
    <article data-testid="standard-method-card" style={{ background: t.panel, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 6, display: "grid", gap: 0, minWidth: 0, padding: "12px 14px" }}>
      <header style={{ display: "grid", gap: 7, paddingBottom: 10 }}>
        <div style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
            <span style={{ color: t.accentText, fontSize: 10.2, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "标准方法卡", "Standard method card")}</span>
            <h3 style={{ color: t.textStrong, fontSize: 18, lineHeight: 1.2, margin: 0 }}><ChemicalText value={text(lang, card.titleZh, card.title)} /></h3>
          </div>
          <BoundaryBadge boundary={card.boundary} lang={lang} t={t} />
        </div>
        <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.55, margin: 0 }}><ChemicalText value={text(lang, card.summaryZh, card.summary)} /></p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <button type="button" onClick={() => onJump(card.methodHash)} style={{ ...toolbarBtn(t), color: t.accentText, minHeight: 32, padding: "5px 8px" }}>
            <BookOpenText aria-hidden="true" size={14} weight="bold" />
            {text(lang, "阅读完整原方法", "Read complete original method")}
          </button>
          <a href={`#${card.functionHash}`} style={{ ...toolbarBtn(t), color: t.textStrong, minHeight: 32, padding: "5px 8px", textDecoration: "none" }}>
            <ArrowSquareOut aria-hidden="true" size={14} weight="bold" />
            {text(lang, card.functionLabelZh, card.functionLabel)}
          </a>
        </div>
      </header>
      <DefinitionRow label={text(lang, "研究定位", "Research position")} t={t}>
        {text(lang, "解释当前功能如何从可核查输入得到受边界约束的输出；不把界面排序自动升级为科学结论。", "Explains how the current function turns reviewable inputs into boundary-constrained outputs; a UI ranking is not automatically promoted to a scientific conclusion.")}
      </DefinitionRow>
      <DefinitionRow label={text(lang, "数据库连接", "Database connection")} t={t}>
        <Database aria-hidden="true" color={t.accentText} size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} weight="bold" />
        <ChemicalText value={text(lang, card.databaseLabelZh, card.databaseLabel)} />
      </DefinitionRow>
      <DefinitionRow label={text(lang, "输入", "Inputs")} t={t}>
        <InlineList rows={inputs} empty={text(lang, "未登记输入", "No inputs registered")} t={t} />
      </DefinitionRow>
      <DefinitionRow label={text(lang, "输出", "Outputs")} t={t}>
        <InlineList rows={outputs} empty={text(lang, "未登记输出", "No outputs registered")} t={t} />
      </DefinitionRow>
      <DefinitionRow label={text(lang, "执行链", "Execution chain")} t={t}>
        {card.workflow.length ? card.workflow.map((step, index) => (
          <span key={`${step.label}-${index}`} style={{ display: "inline" }}>
            {index ? " → " : ""}<ChemicalText value={`${index + 1}. ${text(lang, step.labelZh, step.label)}`} />
          </span>
        )) : text(lang, "未登记执行步骤", "No workflow registered")}
      </DefinitionRow>
      <DefinitionRow label={text(lang, "公式与方法", "Formulas and methods")} t={t}>
        <InlineList rows={card.formulas.slice(0, 8).map(formula => text(lang, formula.labelZh, formula.label))} empty={text(lang, "本模块以规则和数据契约为主，未登记独立公式。", "This module is rule- and contract-led; no standalone formula is registered.")} t={t} />
        {card.formulas.length > 8 ? <div style={{ color: t.faint, marginTop: 5 }}>+{card.formulas.length - 8} {text(lang, "项公式见完整方法", "more formulas in the complete method")}</div> : null}
      </DefinitionRow>
      <DefinitionRow label={text(lang, "来源覆盖", "Source coverage")} t={t}>
        {card.verifiedLiteratureCount} {text(lang, "条已核验/官方来源", "verified or official sources")} · {card.pendingLiteratureCount} {text(lang, "条待补或未审来源", "pending or unreviewed sources")} · {card.references.length} {text(lang, "条方法内引用", "in-method references")}
      </DefinitionRow>
      <DefinitionRow label={text(lang, "停止条件与限制", "Stop conditions and limits")} t={t}>
        {limitations.length ? (
          <div style={{ display: "grid", gap: 5 }}>
            {limitations.slice(0, 4).map((item, index) => <span key={`${item}-${index}`}><ChemicalText value={`${index + 1}. ${item}`} /></span>)}
            {limitations.length > 4 ? <span style={{ color: t.faint }}>+{limitations.length - 4} {text(lang, "项见完整方法", "more in the complete method")}</span> : null}
          </div>
        ) : text(lang, "未登记；正式计算前必须补充边界。", "Not registered; boundaries must be added before formal calculation.")}
      </DefinitionRow>
    </article>
  )
}

function CoverageView({ cards, lang, t }) {
  const columns = "minmax(190px, 1.4fr) repeat(5, minmax(76px, 0.55fr)) minmax(150px, 1fr)"
  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 6, overflowX: "auto" }}>
      <div role="table" aria-label={text(lang, "方法覆盖矩阵", "Method coverage matrix")} style={{ minWidth: 820 }}>
        <div role="row" style={{ background: t.surface, display: "grid", gap: 0, gridTemplateColumns: columns }}>
          {[
            text(lang, "模块", "Module"),
            text(lang, "方法组", "Groups"),
            text(lang, "公式", "Formulas"),
            text(lang, "方法引用", "References"),
            text(lang, "已核验来源", "Verified sources"),
            text(lang, "限制", "Limits"),
            text(lang, "结论边界", "Claim boundary"),
          ].map(label => <strong key={label} role="columnheader" style={{ color: t.faint, fontSize: 10.2, padding: "9px 8px", textTransform: "uppercase" }}>{label}</strong>)}
        </div>
        {cards.map(card => (
          <div key={card.id} role="row" style={{ borderTop: `1px solid ${t.border}`, display: "grid", gridTemplateColumns: columns }}>
            <div role="cell" style={{ color: t.textStrong, fontSize: 11.5, fontWeight: 850, padding: "9px 8px" }}><ChemicalText value={text(lang, card.titleZh, card.title)} /></div>
            {[card.groups.length, card.formulas.length, card.references.length, card.verifiedLiteratureCount, card.limitations.length].map((value, index) => (
              <div key={index} role="cell" style={{ color: t.muted, fontSize: 11.5, fontVariantNumeric: "tabular-nums", padding: "9px 8px" }}>{value}</div>
            ))}
            <div role="cell" style={{ padding: "7px 8px" }}><BoundaryBadge boundary={card.boundary} lang={lang} t={t} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GovernanceView({ governance, lang, t, isMobile }) {
  const fields = Array.isArray(governance?.standardFields) ? governance.standardFields : []
  const frameworks = Array.isArray(governance?.frameworks) ? governance.frameworks : []
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={{ display: "grid", gap: 9 }}>
        <header style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "EcoMOF-AI 标准方法卡字段", "EcoMOF-AI standard method-card fields")}</strong>
          <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>{text(lang, "新方法接入底层注册表时必须覆盖以下十项；缺失内容应显示缺失，不允许静默推断。", "Every new method registered in the shared layer must cover these ten fields. Missing content stays visible and is never silently inferred.")}</span>
        </header>
        <div style={{ display: "grid", gap: 6, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
          {fields.map((field, index) => (
            <div key={field.id} style={{ alignItems: "start", border: `1px solid ${t.border}`, borderRadius: 6, display: "grid", gap: 8, gridTemplateColumns: "28px minmax(0, 1fr)", padding: 8 }}>
              <span style={{ alignItems: "center", background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 6, color: t.accentText, display: "inline-flex", fontSize: 10.5, fontWeight: 900, height: 26, justifyContent: "center", width: 26 }}>{String(index + 1).padStart(2, "0")}</span>
              <strong style={{ color: t.textStrong, fontSize: 11.5, lineHeight: 1.4 }}>{text(lang, field.labelZh, field.labelEn)}</strong>
            </div>
          ))}
        </div>
      </section>
      <section style={{ display: "grid", gap: 9 }}>
        <header style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "采用的方法框架及边界", "Adopted frameworks and boundaries")}</strong>
          <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>{text(lang, governance?.boundaryZh, governance?.boundaryEn)}</span>
        </header>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
          {frameworks.map(framework => (
            <article key={framework.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, display: "grid", gap: 8, minWidth: 0, padding: 10 }}>
              <header style={{ alignItems: "start", display: "flex", gap: 8, justifyContent: "space-between" }}>
                <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                  <span style={{ color: t.accentText, fontSize: 9.8, fontWeight: 900, textTransform: "uppercase" }}>{framework.organization}</span>
                  <strong style={{ color: t.textStrong, fontSize: 12.3, lineHeight: 1.35 }}>{framework.title}</strong>
                </div>
                <a href={framework.url} target="_blank" rel="noreferrer" aria-label={text(lang, `打开 ${framework.title} 官方来源`, `Open official source for ${framework.title}`)} style={{ alignItems: "center", border: `1px solid ${t.border}`, borderRadius: 6, color: t.accentText, display: "inline-flex", flex: "0 0 auto", height: 30, justifyContent: "center", width: 30 }}>
                  <ArrowSquareOut aria-hidden="true" size={14} weight="bold" />
                </a>
              </header>
              <div style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.5 }}><strong style={{ color: t.success }}>{text(lang, "优点：", "Strength: ")}</strong>{text(lang, framework.strengthZh, framework.strengthEn)}</div>
              <div style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.5 }}><strong style={{ color: t.warn }}>{text(lang, "局限：", "Tradeoff: ")}</strong>{text(lang, framework.tradeoffZh, framework.tradeoffEn)}</div>
              <div style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.5 }}><strong style={{ color: t.textStrong }}>{text(lang, "本项目采用：", "Adopted here: ")}</strong>{text(lang, framework.adoptedZh, framework.adoptedEn)}</div>
              <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 6 }}>
                <span style={{ color: t.faint, fontSize: 10 }}>{text(lang, "官方来源已核验", "Official source verified")} · {framework.verifiedAt}</span>
                <span style={{ color: framework.doi ? t.accentText : t.faint, fontSize: 10, fontWeight: 850 }}>{framework.doi ? `DOI ${framework.doi}` : text(lang, "DOI 不适用（官方网页）", "DOI not applicable (official webpage)")}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export function MethodologyRegistry({ modules, literatureRecords, governance, lang, t, isMobile, onJump }) {
  const registry = useMemo(() => buildMethodologyRegistry(modules, literatureRecords), [modules, literatureRecords])
  const [view, setView] = useState("registry")
  const [selectedId, setSelectedId] = useState("platform-overview")
  const [query, setQuery] = useState("")
  const [boundaryFilter, setBoundaryFilter] = useState("all")

  useEffect(() => {
    if (!registry.cards.length) return
    if (!registry.cards.some(card => card.id === selectedId)) setSelectedId(registry.cards[0].id)
  }, [registry.cards, selectedId])

  const selected = registry.cards.find(card => card.id === selectedId) || registry.cards[0]
  const metrics = registry.metrics

  return (
    <section id="methodology-registry" data-testid="methodology-registry" style={{ display: "grid", gap: 13, scrollMarginTop: 118 }}>
      <header style={{ alignItems: "center", display: "grid", gap: 12, justifyItems: "center", textAlign: "center" }}>
        <div style={{ display: "grid", gap: 5, justifyItems: "center", maxWidth: 840 }}>
          <h2 style={{ color: t.textStrong, fontSize: 22, lineHeight: 1.18, margin: 0 }}>{text(lang, "先判断能否使用，再进入完整方法", "Check eligibility before opening the complete method")}</h2>
          <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
            {text(lang, "该总览从现有方法数据动态生成，不替代下方任何正文。每个模块统一显示数据库连接、公式与引用覆盖、验证边界，以及已经打通的功能入口。", "This overview is derived from the existing method data and replaces none of the complete content below. Every module exposes its database connection, formula and citation coverage, validation boundary, and linked product function.")}
          </p>
        </div>
        <div className="glass-segmented-control methodology-view-tabs" aria-label={text(lang, "方法注册表视图", "Method registry views")} role="group">
          <ViewButton active={view === "registry"} icon={ListDashes} label={text(lang, "方法索引", "Method index")} onClick={() => setView("registry")} t={t} />
          <ViewButton active={view === "coverage"} icon={ChartBar} label={text(lang, "覆盖矩阵", "Coverage matrix")} onClick={() => setView("coverage")} t={t} />
          <ViewButton active={view === "governance"} icon={ShieldCheck} label={text(lang, "标准与治理", "Standards and governance")} onClick={() => setView("governance")} t={t} />
        </div>
      </header>

      <div style={{ display: "grid", gap: 7, gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(6, minmax(0, 1fr))" }}>
        <RegistryMetric label={text(lang, "主模块", "Modules")} value={metrics.moduleCount} note={text(lang, "全部保留", "all retained")} t={t} />
        <RegistryMetric label={text(lang, "方法组", "Method groups")} value={metrics.groupCount} note={text(lang, "动态统计", "derived count")} t={t} />
        <RegistryMetric label={text(lang, "公式", "Formulas")} value={metrics.formulaCount} note={text(lang, "来自原数据", "from source data")} t={t} />
        <RegistryMetric label={text(lang, "方法引用", "Method references")} value={metrics.referenceCount} note={text(lang, "组内登记", "registered in groups")} t={t} />
        <RegistryMetric label={text(lang, "限制条目", "Limit entries")} value={metrics.limitationCount} note={text(lang, "显式边界", "explicit boundaries")} t={t} />
        <RegistryMetric label={text(lang, "文献来源", "Literature sources")} value={`${metrics.verifiedSourceCount}/${metrics.sourceCount}`} note={text(lang, "已核验或官方 / 总数", "verified or official / total")} t={t} />
      </div>

      {view === "registry" ? (
        <div style={{ alignItems: "start", display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "minmax(310px, 0.9fr) minmax(390px, 1.1fr)" }}>
          <MethodIndex cards={registry.cards} selectedId={selected?.id} onSelect={setSelectedId} query={query} onQueryChange={setQuery} boundaryFilter={boundaryFilter} onBoundaryFilter={setBoundaryFilter} lang={lang} t={t} isMobile={isMobile} />
          <StandardMethodCard card={selected} lang={lang} t={t} onJump={onJump} />
        </div>
      ) : null}
      {view === "coverage" ? <CoverageView cards={registry.cards} lang={lang} t={t} /> : null}
      {view === "governance" ? <GovernanceView governance={governance} lang={lang} t={t} isMobile={isMobile} /> : null}
    </section>
  )
}
