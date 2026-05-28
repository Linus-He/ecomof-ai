import { useEffect, useMemo, useState } from "react"
import {
  BasisBadge,
  BlockFormula,
  ChemFormula,
  CopyLinkButton,
  PageHeader,
  SCIENTIFIC_TOKEN_FONT,
  chemText,
  fetchDataJson,
  useLang,
  useT,
  useViewport,
} from "../../shared"
import { MethodologySidebar } from "../methodology/MethodologySidebar"
import { MethodModuleSection } from "../methodology/MethodModuleSection"

const MODULE_ORDER = [
  "platform-overview",
  "ecoscreen",
  "performance",
  "gassep",
  "catalysis-lab",
  "organic-acid",
  "mof-library",
  "shared-evidence",
  "limitations-validation",
]

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function scrollToSection(id) {
  if (typeof document === "undefined") return
  const target = document.getElementById(id)
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" })
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`)
  }
}

function buildDirectory(modules, lang) {
  const items = []
  modules.forEach(module => {
    items.push({
      id: `methodology-${module.id}`,
      label: module.module,
      labelZh: module.moduleZh,
      level: 1,
      children: (module.methodGroups || []).slice(0, 3).map(group => ({
        id: `methodology-${group.id}`,
        label: group.title,
        labelZh: group.titleZh,
      })),
    })
    ;(module.methodGroups || []).forEach(group => {
      const show =
        module.id === "ecoscreen" ||
        module.id === "gassep" ||
        module.id === "organic-acid" ||
        module.id === "shared-evidence" ||
        module.id === "limitations-validation"
      if (!show) return
      items.push({
        id: `methodology-${group.id}`,
        label: group.title,
        labelZh: group.titleZh,
        level: 2,
      })
    })
  })
  return items.map(item => ({
    ...item,
    display: text(lang, item.labelZh, item.label),
  }))
}

function PlatformFlowCard({ lang, t, isMobile }) {
  const steps = [
    [text(lang, "Data source", "Data source"), text(lang, "整理文献 / 种子数据 / 显式演示数据", "curated literature / seed dataset / explicit demonstration data")],
    [text(lang, "Descriptor / condition extraction", "Descriptor / condition extraction"), text(lang, "描述符、条件、路径规则、验证字段", "descriptors, conditions, pathway rules, validation fields")],
    [text(lang, "Field-level provenance", "Field-level provenance"), text(lang, "来源、位置、证据类型、整理状态", "source, location, evidence type, curation status")],
    [text(lang, "Task-specific scoring / comparison", "Task-specific scoring / comparison"), text(lang, "CRITIC、条件可比性、规则贡献", "CRITIC, condition comparability, rule contribution")],
    [text(lang, "Candidate explanation", "Candidate explanation"), text(lang, "驱动因素、警告、验证缺口", "drivers, warnings, validation gaps")],
  ]
  return (
    <section id="methodology-platform-flow" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 15 }}>
      <header style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {text(lang, "总方法流", "Platform method flow")}
        </div>
        <h2 style={{ color: t.textStrong, fontSize: 22, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "证据感知的决策支持原型", "Evidence-aware decision-support prototype")}
        </h2>
        <p style={{ color: t.muted, fontSize: 13, lineHeight: 1.6, margin: 0, maxWidth: 940 }}>
          {text(
            lang,
            "EcoMOF-AI 不是黑箱排名工具；页面把数据来源、条件、字段级来源、证据状态、模块算法和验证路线放在同一解释链路中。",
            "EcoMOF-AI is not a black-box ranking tool; the page connects data source, conditions, field-level provenance, evidence status, module algorithms, and validation roadmap in one explanation chain."
          )}
        </p>
      </header>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))" }}>
        {steps.map(([title, body], index) => (
          <article key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 7, padding: 10 }}>
            <span style={{ alignItems: "center", background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 999, color: t.accentText, display: "inline-flex", fontSize: 11, fontWeight: 900, height: 24, justifyContent: "center", width: 24 }}>{index + 1}</span>
            <strong style={{ color: t.textStrong, fontSize: 12.5, lineHeight: 1.3 }}>{title}</strong>
            <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{body}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

function FormulaIndex({ lang, t }) {
  const formulas = [
    ["C_j = \\sigma_j \\times \\sum_{k=1}^{m}(1-r_{jk})", "C_j = sigma_j x sum(1-r_jk)", text(lang, "CRITIC 信息量", "CRITIC information content")],
    ["w_j = \\frac{C_j}{\\sum_{j=1}^{m}C_j}", "w_j = C_j / sum(C_j)", text(lang, "CRITIC 权重", "CRITIC weight")],
    ["D_{raw}=G\\times\\prod_{j=1}^{m}d_j^{w_j}", "D_raw = G x product(d_j ^ w_j)", text(lang, "候选综合评分", "Candidate score")],
    ["D_{expected}=D_{raw}\\times Q", "D_expected = D_raw x Q", text(lang, "证据置信度修正", "Evidence confidence correction")],
    ["\\mathrm{Comparable}=\\mathrm{same}(gasSystem, feedRatio, T, P, method)", "Comparable = same(gasSystem, feedRatio, T, P, method)", text(lang, "GasSep 可比性规则", "GasSep comparability rule")],
    ["\\mathrm{Priority\\ Tier}=f(pathway\\ fit,\\ motif/rule\\ match,\\ evidence\\ support,\\ risk\\ penalty,\\ validation\\ gap)", "Priority Tier = f(pathway fit, motif/rule match, evidence support, risk penalty, validation gap)", text(lang, "Organic Acid 优先级逻辑", "Organic Acid priority logic")],
  ]
  return (
    <section id="methodology-formula-index" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 15 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {text(lang, "公式索引", "Formula index")}
        </div>
        <h2 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.18, margin: 0 }}>
          {text(lang, "跨模块算法公式", "Cross-module algorithms and formulas")}
        </h2>
      </header>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {formulas.map(([math, fallback, label]) => (
          <article key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, minWidth: 0, padding: 11 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{label}</strong>
            <BlockFormula math={math} fallback={fallback} t={t} />
          </article>
        ))}
      </div>
    </section>
  )
}

function MethodologyDataBoundary({ lang, t }) {
  const rows = [
    text(lang, "demonstration / seed dataset：用于展示方法流程，不应作为最终科研结论。", "demonstration / seed dataset: used to show method flow and should not be treated as final scientific conclusions."),
    text(lang, "curated literature：来自已整理文献，但仍需要条件、来源位置和证据等级语境。", "curated literature: sourced from curated literature but still requires condition, source location, and evidence-level context."),
    text(lang, "reviewed record：已完成字段核查的记录，也仍需按任务条件判断可比性。", "reviewed record: field-reviewed data that still needs task-specific comparability checks."),
  ]
  return (
    <section id="methodology-data-boundary" style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 12, display: "grid", gap: 8, padding: 14 }}>
      <strong style={{ color: t.warn, fontSize: 13 }}>{text(lang, "全站证据边界", "Platform evidence boundary")}</strong>
      {rows.map(row => <div key={row} style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55 }}>{row}</div>)}
    </section>
  )
}

export function MethodsLimitationsTab() {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [modules, setModules] = useState([])
  const [activeId, setActiveId] = useState("methodology-platform-overview")

  useEffect(() => {
    let active = true
    fetchDataJson("methodology_modules_demo.json", [])
      .then(rows => {
        if (!active) return
        setModules(Array.isArray(rows) ? rows : [])
      })
      .catch(() => {
        if (active) setModules([])
      })
    return () => { active = false }
  }, [])

  const orderedModules = useMemo(() => {
    const byId = new Map(modules.map(item => [item.id, item]))
    return MODULE_ORDER.map(id => byId.get(id)).filter(Boolean)
  }, [modules])

  const directoryItems = useMemo(() => buildDirectory(orderedModules, lang), [orderedModules, lang])

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined
    const ids = directoryItems.map(item => item.id)
    const targets = ids.map(id => document.getElementById(id)).filter(Boolean)
    if (!targets.length) return undefined
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0]
      if (visible?.target?.id) setActiveId(visible.target.id)
    }, { rootMargin: "-120px 0px -58% 0px", threshold: [0, 0.2, 0.6] })
    targets.forEach(target => observer.observe(target))
    return () => observer.disconnect()
  }, [directoryItems])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
      <PageHeader
        title={text(lang, "方法与证据", "Methods & Evidence")}
        subtitle={text(
          lang,
          "按网站菜单顺序组织全站方法论：模块目的、方法流程、算法公式、输入输出、可视化、证据边界、限制和验证路线。",
          "A menu-aligned methods hub covering module purpose, workflow, algorithms, formulas, inputs, outputs, visualizations, evidence boundaries, limitations, and validation roadmap."
        )}
        meta={text(lang, "科学方法中心 · 证据感知 · 决策支持原型", "scientific methods hub · evidence-aware · decision-support prototype")}
        action={
          <>
            <BasisBadge tone="proxy">{text(lang, "不是验证排名", "not validated ranking")}</BasisBadge>
            <CopyLinkButton hash="methodology" ariaLabel={text(lang, "复制方法论链接", "Copy methodology link")} />
          </>
        }
      />

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: isNarrow ? "1fr" : "270px minmax(0, 1fr)", alignItems: "start" }}>
        <MethodologySidebar
          items={directoryItems}
          activeId={activeId}
          onJump={scrollToSection}
          lang={lang}
          t={t}
          isMobile={isMobile || isNarrow}
        />

        <main style={{ display: "grid", gap: 16, minWidth: 0 }}>
          <section id="methodology-platform-overview" style={{ display: "grid", gap: 16, scrollMarginTop: 118 }}>
            <PlatformFlowCard lang={lang} t={t} isMobile={isMobile} />
            <FormulaIndex lang={lang} t={t} />
            <MethodologyDataBoundary lang={lang} t={t} />
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.55, padding: 11 }}>
              <span style={{ color: t.textStrong, fontWeight: 900 }}>{text(lang, "化学式与科学 token：", "Chemistry and scientific tokens: ")}</span>
              <span style={{ fontFamily: SCIENTIFIC_TOKEN_FONT }}>
                {chemText("CO2 / CH4 / N2 / C2H2 / C2H4 / HCO3-")}
              </span>
              {" · "}
              <ChemFormula>CO2</ChemFormula>
              {" / "}
              <ChemFormula>CH4</ChemFormula>
              {" / "}
              <ChemFormula>N2</ChemFormula>
            </div>
          </section>

          {orderedModules.map(item => (
            item.id === "platform-overview" ? null : (
              <MethodModuleSection key={item.id} item={item} lang={lang} t={t} />
            )
          ))}
        </main>
      </div>
    </div>
  )
}
