// @ts-nocheck
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
import { MethodFormulaCard } from "../methodology/MethodFormulaCard"
import { MethodModuleSection } from "../methodology/MethodModuleSection"

const MODULE_ORDER = [
  "platform-overview",
  "mof-library",
  "ecoscreen",
  "gassep",
  "catalysis-lab",
  "organic-acid",
  "performance",
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
  return modules.map(module => ({
      id: `methodology-${module.id}`,
      label: module.module,
      labelZh: module.moduleZh,
      level: 1,
      children: (module.methodGroups || []).map(group => ({
        id: `methodology-${group.id}`,
        label: group.title,
        labelZh: group.titleZh,
      })),
      display: text(lang, module.moduleZh, module.module),
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
    { id: "critic-information", label: "CRITIC information content", labelZh: "CRITIC 信息量", latex: "C_j=\\sigma_j\\sum_{k=1}^{m}(1-r_{jk})", fallback: "C_j = σ_j Σ(1-r_jk)" },
    { id: "critic-weight", label: "CRITIC weight", labelZh: "CRITIC 权重", latex: "w_j=\\frac{C_j}{\\sum_{j=1}^{m}C_j}", fallback: "w_j = C_j / ΣC_j" },
    { id: "candidate-raw", label: "Candidate score", labelZh: "候选综合评分", latex: "D_{\\mathrm{raw}}=G\\times\\prod_{j=1}^{m}d_j^{w_j}", fallback: "D_raw = G × Π d_j^w_j" },
    { id: "evidence-confidence", label: "Evidence confidence correction", labelZh: "证据置信度修正", latex: "D_{\\mathrm{expected}}=D_{\\mathrm{raw}}\\times Q", fallback: "D_expected = D_raw × Q" },
    { id: "organic-edge-weight", label: "Organic Acid edge weight", labelZh: "有机酸边权重", latex: "w_{ij}=E_{ij}\\times P_{ij}\\times M_{ij}\\times V_{ij}", fallback: "w_ij = E_ij × P_ij × M_ij × V_ij" },
    { id: "candidate-priority-score", label: "Candidate priority score", labelZh: "候选物优先级评分", latex: "P_c=R_c\\times E_c\\times F_c\\times V_c", fallback: "P_c = R_c × E_c × F_c × V_c" },
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
        {formulas.map(formula => <MethodFormulaCard key={formula.id} formula={formula} lang={lang} t={t} />)}
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

function StructuredFactorEffectsMethod({ lang, t, isMobile }) {
  const rows = [
    ["Why not direct black-box ML?", "为什么不直接黑箱机器学习？", "Sparse chemical data often mixes descriptors, categorical factors, conditions, and uneven evidence; direct prediction can hide data-generation structure.", "稀疏化学数据常混合描述符、分类因素、条件和不均衡证据；直接预测容易掩盖数据生成结构。"],
    ["Categorical factors", "分类因素", "MOF candidate, metal node, linker, pore class, pathway, condition, gas pair, and evidence type are treated as interpretable factors.", "将 MOF 候选物、金属节点、连接体、孔径类别、路径、条件、气体对和证据类型作为可解释因素。"],
    ["Main effects", "主效应", "First-order factor directions are shown before any interaction is trusted.", "先展示一阶因素方向，再判断交互是否可信。"],
    ["Interaction effects", "交互效应", "Pairwise hypotheses explain when a factor matters only under a pathway, condition, risk dimension, or gas pair.", "二阶假设解释某因素何时只在特定路径、条件、风险维度或气体对下起作用。"],
    ["Heredity rule", "遗传规则", "Interactions are downgraded unless related main effects or explicit literature/experimental evidence exist.", "若缺少相关主效应或明确文献 / 实验证据，交互效应默认降权。"],
    ["Evidence-adjusted interpretation", "证据校正解释", "Demo, inferred, literature-derived, and curated records change confidence rather than pretending to be equal labels.", "演示、推断、文献整理和已整理记录改变置信度，而不是被当作同等标签。"],
    ["Validation-first output", "验证优先输出", "The result is a validation queue and decision-support explanation, not final yield or performance prediction.", "输出是验证队列和决策支持解释，不是最终产率或真实性能预测。"],
    ["Limitation", "限制", "This is a structured interpretation layer; it is not a fitted potential energy surface, kinetic model, or process simulator.", "这是结构化解释层，不是拟合势能面、动力学模型或过程模拟器。"],
  ]
  return (
    <section id="structured-factor-effects" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {text(lang, "稀疏化学数据的结构化因素效应分析", "Structured Factor Effects for Sparse Chemical Data")}
        </div>
        <h2 style={{ color: t.textStrong, fontFamily: lang === "zh" ? '"Songti SC", "Noto Serif SC", serif' : '"Times New Roman", Times, serif', fontSize: 21, lineHeight: 1.16, margin: 0 }}>
          {text(lang, "Structured Factor Effects for Sparse Chemical Data / 稀疏化学数据的结构化因素效应分析", "Structured Factor Effects for Sparse Chemical Data")}
        </h2>
        <p style={{ color: t.muted, fontSize: 12.8, lineHeight: 1.62, margin: 0, maxWidth: 980 }}>
          {text(
            lang,
            "EcoMOF-AI 不把稀疏化学数据简单处理为黑箱预测问题，而是将描述符、分类因素、交互假设和证据等级组织成可解释的决策工作流。",
            "EcoMOF-AI does not treat sparse chemical data as a black-box prediction problem. It organizes descriptors, categorical factors, interaction hypotheses, and evidence levels into an interpretable decision workflow."
          )}
        </p>
      </header>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        {rows.map(([en, zh, bodyEn, bodyZh], index) => (
          <article key={en} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 7, padding: 11 }}>
            <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
              <span style={{ alignItems: "center", background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 999, color: t.accentText, display: "inline-flex", fontSize: 11, fontWeight: 900, height: 24, justifyContent: "center", width: 24 }}>{index + 1}</span>
              <strong style={{ color: t.textStrong, fontSize: 12.5, lineHeight: 1.3 }}>{text(lang, zh, en)}</strong>
            </div>
            <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.55 }}>{text(lang, bodyZh, bodyEn)}</span>
          </article>
        ))}
      </div>
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
    const ids = directoryItems.flatMap(item => [item.id, ...(item.children || []).map(child => child.id)])
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
            <StructuredFactorEffectsMethod lang={lang} t={t} isMobile={isMobile} />
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
