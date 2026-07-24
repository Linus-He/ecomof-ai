// @ts-nocheck
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react"
import {
  BasisBadge,
  BlockFormula,
  ChemFormula,
  CopyLinkButton,
  PageHeader,
  SCIENTIFIC_TOKEN_FONT,
  chemText,
  fetchDataJson,
  toolbarBtn,
  useLang,
  useT,
  useViewport,
} from "../../shared"
import { MethodologySidebar } from "../methodology/MethodologySidebar"
import { MethodologySectionSkeleton } from "../methodology/MethodologySkeleton"
import { MethodFormulaCard } from "../methodology/MethodFormulaCard"
import { MethodModuleSection } from "../methodology/MethodModuleSection"
import { AlgorithmValidationCenter, ALGORITHM_VALIDATION_DIRECTORY } from "../methodology/algorithm-validation/AlgorithmValidationCenter"
import { ReactionEvidenceGraph } from "../methodology/model-credibility/ReactionEvidenceGraph"
import { ORGANIC_ACID_FINAL_DIRECTORY } from "../methodology/organic-acid-final/directory"
import { runOrganicAcidFinalScreening } from "../../utils/organicAcidFinalScreening"
import { summarizeDataFoundation } from "../../utils/dataFoundation"
import { runDataAudit } from "../../utils/dataAudit/index.js"
import { dataIngestionSummary } from "../../utils/dataIngestion/index.js"

const OrganicAcidFinalMethodology = lazy(() =>
  import("../methodology/OrganicAcidFinalMethodology").then(module => ({ default: module.OrganicAcidFinalMethodology })),
)

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
    window.dispatchEvent(new Event("hashchange"))
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

function LazyMethodologyGate({ ids = [], fallback, children }) {
  const ref = useRef(null)
  const [loaded, setLoaded] = useState(() => {
    if (typeof window === "undefined") return false
    const hash = String(window.location.hash || "").replace(/^#/, "")
    return ids.includes(hash)
  })

  useEffect(() => {
    if (loaded) return undefined
    const onHash = () => {
      const hash = String(window.location.hash || "").replace(/^#/, "")
      if (ids.includes(hash)) setLoaded(true)
    }
    onHash()
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [ids, loaded])

  useEffect(() => {
    if (loaded || typeof IntersectionObserver === "undefined") return undefined
    const node = ref.current
    if (!node) return undefined
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) setLoaded(true)
    }, { rootMargin: "560px 0px 560px 0px", threshold: 0.01 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [loaded])

  useEffect(() => {
    if (!loaded || typeof window === "undefined") return undefined
    const hash = String(window.location.hash || "").replace(/^#/, "")
    if (!ids.includes(hash)) return undefined
    const timers = [80, 240, 520].map(delay => window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: delay === 80 ? "smooth" : "auto", block: "start" })
    }, delay))
    return () => timers.forEach(timer => window.clearTimeout(timer))
  }, [ids, loaded])

  if (!loaded) {
    return <div ref={ref} id={ids[0]} style={{ scrollMarginTop: 118 }}>{fallback}</div>
  }
  return <Suspense fallback={fallback}>{children}</Suspense>
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

function LiteratureInspirationSourceCard({ source, lang, t }) {
  const title = source?.title || "Untitled source"
  const statusTone = source?.status === "validated_literature" || source?.status === "official_standard" || source?.status === "official_reference"
    ? "calc"
    : source?.status?.includes("pending")
      ? "warn"
      : "info"
  const statusColor = statusTone === "warn" ? t.warn : statusTone === "calc" ? t.success : t.accentText
  const statusLabel = ({
    validated_literature: text(lang, "已核验文献", "verified literature"),
    official_standard: text(lang, "官方标准", "official standard"),
    official_reference: text(lang, "官方来源", "official reference"),
    uploaded_verified: text(lang, "上传文献已核验", "uploaded source verified"),
    pending_metadata: text(lang, "元数据待补", "metadata pending"),
  })[source?.status] || source?.status || text(lang, "待核验", "pending")
  const metadata = [
    source?.authors && source.authors !== "metadata pending" ? source.authors : null,
    source?.year,
    source?.journal && !String(source.journal).toLowerCase().includes("metadata pending") ? source.journal : null,
  ].filter(Boolean)
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 11 }}>
      <div style={{ alignItems: "start", display: "flex", gap: 9, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 12.8, lineHeight: 1.35 }}>{title}</strong>
        <span style={{ color: statusColor, flex: "0 0 auto", fontSize: 10.2, fontWeight: 900 }}>{statusLabel}</span>
      </div>
      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45 }}>
        {metadata.join(" · ") || text(lang, "已保留上传记录，书目信息待核验", "uploaded record retained; bibliographic metadata pending")}
      </div>
      <div style={{ color: t.muted, fontSize: 11.7, lineHeight: 1.58 }}>
        {text(lang, source?.coreIdeaZh, source?.coreIdeaEn)}
      </div>
      <div style={{ color: t.faint, fontSize: 11.2, lineHeight: 1.5 }}>
        <strong style={{ color: t.textStrong }}>{text(lang, "采用方式", "Adopted as")}: </strong>
        {text(lang, source?.adoptedInZh, source?.adoptedInEn)}
      </div>
      <div style={{ color: t.warn, fontSize: 11.2, lineHeight: 1.5 }}>
        <strong>{text(lang, "边界", "Boundary")}: </strong>
        {text(lang, source?.boundaryZh, source?.boundaryEn)}
      </div>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
        {source?.doi ? <BasisBadge tone="info">DOI {source.doi}</BasisBadge> : <BasisBadge tone="proxy">{text(lang, "DOI 待核验", "DOI pending")}</BasisBadge>}
        {source?.evidenceRole ? <BasisBadge tone="calc">{source.evidenceRole}</BasisBadge> : null}
        {(Array.isArray(source?.relatedUrls) && source.relatedUrls.length
          ? source.relatedUrls
          : source?.url
            ? [{ label: text(lang, "打开来源", "Open source"), url: source.url }]
            : []
        ).map(link => (
          <a key={`${source?.id}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" style={{ color: t.accentText, fontSize: 11.2, fontWeight: 850 }}>
            {link.label || text(lang, "打开来源", "Open source")}
          </a>
        ))}
      </div>
    </article>
  )
}

function MethodMetricCard({ label, value, note, t, tone = "info" }) {
  const color = tone === "calc" ? t.success : tone === "warn" ? t.warn : t.accentText
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 10 }}>
      <span style={{ color: t.faint, fontSize: 10.2, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color, fontSize: 20, lineHeight: 1.12 }}>{value}</strong>
      {note ? <span style={{ color: t.muted, fontSize: 11, lineHeight: 1.35 }}>{note}</span> : null}
    </article>
  )
}

function LiteratureInspirationSection({ records, lang, t, isMobile }) {
  const categories = Array.isArray(records?.categories) ? records.categories : []
  const sources = Array.isArray(records?.sources) ? records.sources : []
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id || "platform-method")

  useEffect(() => {
    if (!categories.length) return
    if (!categories.some(category => category.id === activeCategoryId)) setActiveCategoryId(categories[0].id)
  }, [categories, activeCategoryId])

  useEffect(() => {
    if (typeof window === "undefined" || !categories.length) return undefined
    const syncHashCategory = () => {
      const hash = String(window.location.hash || "").replace(/^#/, "")
      const prefix = "methodology-literature-inspiration-"
      if (!hash.startsWith(prefix)) return
      const nextId = hash.slice(prefix.length)
      if (categories.some(category => category.id === nextId)) setActiveCategoryId(nextId)
    }
    syncHashCategory()
    window.addEventListener("hashchange", syncHashCategory)
    return () => window.removeEventListener("hashchange", syncHashCategory)
  }, [categories])

  const sourceById = useMemo(() => new Map(sources.map(source => [source.id, source])), [sources])
  const activeCategory = categories.find(category => category.id === activeCategoryId) || categories[0]
  const activeSources = (activeCategory?.sourceIds || []).map(id => sourceById.get(id)).filter(Boolean)
  const validatedCount = sources.filter(source => ["validated_literature", "official_standard", "official_reference", "uploaded_verified"].includes(source.status)).length
  const pendingCount = sources.filter(source => source.status === "pending_metadata").length
  const categorySourceCount = activeCategory?.sourceIds?.length || 0

  return (
    <section id="methodology-literature-inspiration" data-testid="methodology-literature-inspiration" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            {text(lang, "文献灵感来源", "Literature Inspiration Sources")}
          </div>
          <CopyLinkButton hash="methodology-literature-inspiration" ariaLabel={text(lang, "复制文献灵感来源链接", "Copy literature inspiration link")} />
        </div>
        <h2 style={{ color: t.textStrong, fontSize: 22, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "按模块分类的文献来源与采用边界", "Module-Classified Literature Sources And Adoption Boundaries")}
        </h2>
        <p style={{ color: t.muted, fontSize: 12.8, lineHeight: 1.62, margin: 0, maxWidth: 980 }}>
          {text(
            lang,
            records?.boundaryZh || "正在读取文献来源；该区只记录方法灵感、采用方式和证据边界，不作为候选材料性能证明。",
            records?.boundaryEn || "Loading literature sources; this section records method inspiration, adoption use, and evidence boundaries, not material-performance evidence."
          )}
        </p>
      </header>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <MethodMetricCard label={text(lang, "分类版块", "Sections")} value={categories.length} note={text(lang, "目录置顶", "first in directory")} t={t} />
        <MethodMetricCard label={text(lang, "来源条目", "Sources")} value={sources.length} note={text(lang, "动态读取", "loaded from data")} t={t} />
        <MethodMetricCard label={text(lang, "已核验/官方", "Verified / official")} value={validatedCount} note={text(lang, "可直接显示 DOI 或官方链接", "DOI or official links shown")} t={t} tone="calc" />
        <MethodMetricCard label={text(lang, "待补元数据", "Metadata pending")} value={pendingCount} note={text(lang, "保留上传记录，不视为性能证据", "retained uploads, not performance evidence")} t={t} tone={pendingCount ? "warn" : "calc"} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {categories.map(category => {
          const active = category.id === activeCategory?.id
          return (
            <button
              key={category.id}
              id={`methodology-literature-inspiration-${category.id}`}
              type="button"
              aria-pressed={active}
              data-active={active ? "true" : "false"}
              onClick={() => setActiveCategoryId(category.id)}
              style={{
                ...toolbarBtn(t),
                background: active ? t.accentText : t.panel,
                borderColor: active ? t.accent : t.border,
                boxShadow: active ? "0 8px 18px rgba(26,109,181,0.18)" : "none",
                color: active ? "#fff" : t.muted,
                scrollMarginTop: 118,
              }}
            >
              {text(lang, category.titleZh, category.titleEn)}
              <span style={{ background: active ? "rgba(255,255,255,0.18)" : t.badgeInfoBg, borderRadius: 999, color: active ? "#fff" : t.accentText, fontSize: 10.5, fontWeight: 900, padding: "1px 6px" }}>
                {category.sourceIds?.length || 0}
              </span>
            </button>
          )
        })}
      </div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 6, padding: 11 }}>
        <div style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <strong style={{ color: t.textStrong, fontSize: 13.2 }}>{text(lang, activeCategory?.titleZh, activeCategory?.titleEn)}</strong>
          <span style={{ color: t.accentText, fontSize: 11, fontWeight: 900 }}>{categorySourceCount} {text(lang, "条来源", "sources")}</span>
        </div>
        <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>{text(lang, activeCategory?.purposeZh, activeCategory?.purposeEn)}</span>
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        {activeSources.map(source => <LiteratureInspirationSourceCard key={source.id} source={source} lang={lang} t={t} />)}
      </div>
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
        <h2 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.16, margin: 0 }}>
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

function CatalysisEnergyPlaygroundMethod({ lang, t, isMobile }) {
  const rows = [
    ["Activation energy proxy", "活化能 proxy", "ΔEa changes are explanatory proxies driven by descriptor chips and interaction-zone emphasis, not calculated barriers.", "ΔEa 变化是由描述符 chip 和交互区重点驱动的解释性 proxy，不是计算能垒。"],
    ["Descriptor-to-barrier mapping", "描述符到能垒映射", "Pore matching, open metal sites, polar groups, water stability, surface area, and adsorption heat are mapped to Ea, ΔE, stabilization, and risk shifts.", "孔径匹配、开放金属位点、极性官能团、水稳定性、比表面积和吸附热被映射到 Ea、ΔE、稳定化和风险变化。"],
    ["Risk penalty", "风险惩罚", "Strong adsorption heat, framework-collapse risk, and missing evidence reduce pathway priority even when the curve looks favorable.", "过强吸附热、结构坍塌风险和证据不足会降低路径优先级，即使曲线看起来有利。"],
    ["Evidence level", "证据等级", "Each interaction carries an A-D evidence level so demo and inferred states remain visible.", "每个交互绑定 A-D 证据等级，让 demo 和 inferred 状态保持可见。"],
    ["Limitations", "限制", "The playground is not DFT, microkinetics, or experimental yield prediction; it is an interactive explanation layer.", "该游乐场不是 DFT、微观动力学或实验产率预测，而是交互式解释层。"],
  ]
  return (
    <section id="catalysis-energy-playground-method" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 15 }}>
      <header style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {text(lang, "催化能量解释方法说明", "Catalysis Energy Explanation Method")}
        </div>
        <h2 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.18, margin: 0 }}>
          {text(lang, "Catalysis Energy Explanation Method / 催化能量解释方法说明", "Catalysis Energy Explanation Method")}
        </h2>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0, maxWidth: 940 }}>
          {text(lang, "该方法说明连接催化交互、描述符映射、风险惩罚和证据等级，强调它是解释性假设视图。", "This method note links catalytic interaction cues, descriptor mapping, risk penalties, and evidence levels while keeping the view hypothesis-based.")}
        </p>
      </header>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))" }}>
        {rows.map(([en, zh, bodyEn, bodyZh], index) => (
          <article key={en} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 7, padding: 10 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.2, lineHeight: 1.28 }}>{index + 1}. {text(lang, zh, en)}</strong>
            <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.48 }}>{text(lang, bodyZh, bodyEn)}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

function ProjectEvolutionShortcutCard({ lang, t, onNavigate }) {
  return (
    <section id="methodology-project-evolution-shortcut" data-testid="methodology-project-evolution-shortcut" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: 12, scrollMarginTop: 118 }}>
      <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "查看项目演化历史", "View project evolution history")}</strong>
        <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}>
          {text(lang, "版本演化时间线、版本更新记录、关键里程碑与发展路线图已移至独立一级入口：项目演化。", "Version timeline, Release Notes, Milestones, and Roadmap now live in the first-level Project Evolution entry.")}
        </span>
      </div>
      <button type="button" onClick={() => onNavigate?.("projectEvolution")} style={{ ...toolbarBtn(t), color: t.accentText, borderColor: t.accent, justifyContent: "center" }}>
        {text(lang, "进入项目演化", "Enter Project Evolution")}
      </button>
    </section>
  )
}

export function MethodsLimitationsTab({ onNavigate } = {}) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [modules, setModules] = useState([])
  const [modelValidationSummary, setModelValidationSummary] = useState(null)
  const [organicAcidResult, setOrganicAcidResult] = useState(null)
  const [dataFoundation, setDataFoundation] = useState(null)
  const [dataAudit, setDataAudit] = useState(null)
  const [dataIngestion, setDataIngestion] = useState(null)
  const [firstBenchmark, setFirstBenchmark] = useState(null)
  const [credibility, setCredibility] = useState(null)
  const [reactionGraph, setReactionGraph] = useState(null)
  const [robustness, setRobustness] = useState(null)
  const [literatureInspiration, setLiteratureInspiration] = useState(null)
  const [activeId, setActiveId] = useState("methodology-literature-inspiration")

  useEffect(() => {
    let active = true
    Promise.all([
      fetchDataJson("methodology_modules_demo.json", []),
      fetchDataJson("database_precompute/v2_2/scalable_database_preview_summary.json", null),
      fetchDataJson("organic_acid_final_screening/al_mof_framework_candidates.json", []),
      fetchDataJson("organic_acid_final_screening/dopant_metal_property_matrix.json", []),
      fetchDataJson("organic_acid_final_screening/organic_acid_screening_rules.json", {}),
      fetchDataJson("organic_acid_final_screening/organic_acid_evidence_records.json", []),
      fetchDataJson("organic_acid_gold_dataset_v2.json", null),
      fetchDataJson("organic_acid_literature_dataset_v2.json", null),
      fetchDataJson("benchmark_dataset_v2.json", null),
      fetchDataJson("organic_acid_labels_v2.json", null),
      fetchDataJson("data_ingestion/organic_acid_reaction_dataset_v1.json", null),
      fetchDataJson("data_ingestion/verified_metadata_expansion_report.json", null),
      fetchDataJson("data_ingestion/reaction_data_expansion_summary_v3_1.json", null),
      fetchDataJson("data_ingestion/source_registry.json", null),
      fetchDataJson("data_ingestion/data_ingestion_summary_v3.json", null),
      fetchDataJson("first_real_benchmark_report_v1.json", null),
      fetchDataJson("model_credibility_report_v1.json", null),
      fetchDataJson("reaction_evidence_graph_v1.json", null),
      fetchDataJson("model_robustness_report_v1.json", null),
      fetchDataJson("methodology_literature_inspiration_records.json", null),
    ])
      .then(([rows, previewSummary, organicFrameworks, organicMetals, organicRules, organicEvidence, gold, literature, benchmark, labels, reaction, verifiedMetadataReport, growthSummary, sourceRegistry, ingestionSummaryV3, firstBenchmarkReport, credibilityReport, reactionGraphData, robustnessReport, literatureInspirationData]) => {
        if (!active) return
        setModules(Array.isArray(rows) ? rows : [])
        setModelValidationSummary(previewSummary && typeof previewSummary === "object" ? previewSummary : null)
        setOrganicAcidResult(runOrganicAcidFinalScreening(organicFrameworks || [], organicMetals || [], organicRules || {}, organicEvidence || [], { reactionDataset: reaction, goldDataset: gold, labelDataset: labels }))
        setDataFoundation(summarizeDataFoundation({ gold, literature, benchmark, labels, reaction, verifiedMetadataReport, growthSummary, sourceRegistry }))
        setDataAudit(runDataAudit({ gold, labels, benchmark, reaction, sampleSize: 100 }))
        setDataIngestion(ingestionSummaryV3 && typeof ingestionSummaryV3 === "object" ? ingestionSummaryV3 : null)
        setFirstBenchmark(firstBenchmarkReport && typeof firstBenchmarkReport === "object" ? firstBenchmarkReport : null)
        setCredibility(credibilityReport && typeof credibilityReport === "object" ? credibilityReport : null)
        setReactionGraph(reactionGraphData && typeof reactionGraphData === "object" ? reactionGraphData : null)
        setRobustness(robustnessReport && typeof robustnessReport === "object" ? robustnessReport : null)
        setLiteratureInspiration(literatureInspirationData && typeof literatureInspirationData === "object" ? literatureInspirationData : null)
      })
      .catch(() => {
        if (active) {
          setModules([])
          setModelValidationSummary(null)
          setOrganicAcidResult(null)
          setDataFoundation(null)
          setDataAudit(null)
          setDataIngestion(null)
          setFirstBenchmark(null)
          setCredibility(null)
          setReactionGraph(null)
          setRobustness(null)
          setLiteratureInspiration(null)
        }
      })
    return () => { active = false }
  }, [])

  const orderedModules = useMemo(() => {
    const byId = new Map(modules.map(item => [item.id, item]))
    return MODULE_ORDER.map(id => byId.get(id)).filter(Boolean)
  }, [modules])

  const directoryItems = useMemo(() => {
    const items = buildDirectory(orderedModules, lang)
    const insertIndex = items.findIndex(item => item.id === "methodology-organic-acid")
    const finalItem = {
      ...ORGANIC_ACID_FINAL_DIRECTORY,
      display: text(lang, ORGANIC_ACID_FINAL_DIRECTORY.labelZh, ORGANIC_ACID_FINAL_DIRECTORY.label),
      children: (ORGANIC_ACID_FINAL_DIRECTORY.children || []).map(child => ({
        ...child,
        display: text(lang, child.labelZh, child.label),
      })),
    }
    const algorithmValidationItem = {
      ...ALGORITHM_VALIDATION_DIRECTORY,
      display: text(lang, ALGORITHM_VALIDATION_DIRECTORY.labelZh, ALGORITHM_VALIDATION_DIRECTORY.label),
      children: (ALGORITHM_VALIDATION_DIRECTORY.children || []).map(child => ({
        ...child,
        display: text(lang, child.labelZh, child.label),
      })),
    }
    const literatureItem = {
      id: "methodology-literature-inspiration",
      label: "Literature Inspiration Sources",
      labelZh: "文献灵感来源",
      display: text(lang, "文献灵感来源", "Literature Inspiration Sources"),
      children: (literatureInspiration?.categories || []).map(category => ({
        id: `methodology-literature-inspiration-${category.id}`,
        label: category.titleEn,
        labelZh: category.titleZh,
        display: text(lang, category.titleZh, category.titleEn),
      })),
    }
    const itemsWithValidation = [algorithmValidationItem, ...items]
    const adjustedInsertIndex = itemsWithValidation.findIndex(item => item.id === "methodology-organic-acid")
    if (insertIndex >= 0) {
      return [
        literatureItem,
        ...itemsWithValidation.slice(0, adjustedInsertIndex + 1),
        finalItem,
        ...itemsWithValidation.slice(adjustedInsertIndex + 1),
      ]
    }
    return [literatureItem, ...itemsWithValidation, finalItem]
  }, [orderedModules, lang, literatureInspiration])

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

  useEffect(() => {
    if (typeof window === "undefined") return undefined
    const targetId = String(window.location.hash || "").replace(/^#/, "").trim()
    if (!targetId.startsWith("methodology-")) return undefined
    const delays = [120, 360, 820, 1400]
    const timers = delays.map((delay, index) => window.setTimeout(() => {
      const target = document.getElementById(targetId)
      if (target) {
        target.scrollIntoView({ behavior: index === 0 ? "smooth" : "auto", block: "start" })
      }
    }, delay))
    return () => timers.forEach(timer => window.clearTimeout(timer))
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
          <LiteratureInspirationSection records={literatureInspiration} lang={lang} t={t} isMobile={isMobile || isNarrow} />
          <ProjectEvolutionShortcutCard lang={lang} t={t} onNavigate={onNavigate} />
          <AlgorithmValidationCenter
            summary={modelValidationSummary || {}}
            organicAcidResult={organicAcidResult}
            dataFoundation={dataFoundation}
            dataAudit={dataAudit}
            dataIngestion={dataIngestion}
            firstBenchmark={firstBenchmark}
            credibility={credibility}
            robustness={robustness}
            lang={lang}
            t={t}
            isMobile={isMobile || isNarrow}
          />
          {reactionGraph ? <ReactionEvidenceGraph graph={reactionGraph} lang={lang} t={t} isMobile={isMobile || isNarrow} /> : null}

          <section id="methodology-platform-overview" style={{ display: "grid", gap: 16, scrollMarginTop: 118 }}>
            <PlatformFlowCard lang={lang} t={t} isMobile={isMobile} />
            <FormulaIndex lang={lang} t={t} />
            <MethodologyDataBoundary lang={lang} t={t} />
            <StructuredFactorEffectsMethod lang={lang} t={t} isMobile={isMobile} />
            <CatalysisEnergyPlaygroundMethod lang={lang} t={t} isMobile={isMobile} />
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

          {orderedModules.map(item => {
            if (item.id === "platform-overview") return null
            const moduleBlock = (
              <div key={item.id} style={{ display: "grid", gap: 16 }}>
                <MethodModuleSection item={item} lang={lang} t={t} />
                {item.id === "organic-acid" ? (
                  <LazyMethodologyGate
                    ids={[ORGANIC_ACID_FINAL_DIRECTORY.id, ...ORGANIC_ACID_FINAL_DIRECTORY.children.map(child => child.id)]}
                    fallback={<MethodologySectionSkeleton lang={lang} t={t} title="Organic Acid Final Screening Methodology" titleZh="有机酸最终筛选方法论" />}
                  >
                    <OrganicAcidFinalMethodology lang={lang} t={t} />
                  </LazyMethodologyGate>
                ) : null}
              </div>
            )
            if (item.id === "organic-acid") {
              return [
                moduleBlock,
              ]
            }
            return moduleBlock
          })}
        </main>
      </div>
    </div>
  )
}
