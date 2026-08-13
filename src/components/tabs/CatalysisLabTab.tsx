// @ts-nocheck
import { useEffect, useRef, useState } from "react"
import {
  BasisBadge,
  CopyLinkButton,
  DataHostingNotice,
  useLang,
  useT,
  useViewport,
} from "../../shared"
import { ModulePageHeader } from "../module/ModuleTop"
import { OrganicAcidEntryCard } from "../catalysis/OrganicAcidEntryCard"
import { OrganicAcidFinalScreening } from "../catalysis/organic-acid-final/OrganicAcidFinalScreening"
import { OrganicAcidWorkspace } from "../catalysis/OrganicAcidWorkspace"
import { CatalysisDiscoveryWorkbench } from "../catalysis/CatalysisDiscoveryWorkbench"

const ORGANIC_ACID_WORKSPACE_HASHES = new Set([
  "catalysis-organic-acid",
  "organic-acid-workbench",
  "organic-acid-graph-explorer",
  "organic-acid-carbon-flow-graph",
  "algorithm-trace-explorer",
  "priority",
  "organic-acid-evidence-matrix",
  "validation",
])

const ORGANIC_ACID_FINAL_HASHES = new Set([
  "catalysis-organic-acid-final-screening",
  "organic-acid-research-validation",
  "organic-acid-evidence-coverage",
  "organic-acid-confidence-matrix",
  "organic-acid-priority-queue",
  "organic-acid-knowledge-graph",
  "organic-acid-final-decision-board",
])

function BoundaryStrip({ t, lang }) {
  const zh = lang === "zh"
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, display: "grid", gap: 5, fontSize: 12.5, lineHeight: 1.5, padding: "11px 13px" }}>
      <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>
        {zh ? "数据范围：文献核对记录、验证用样例与待核候选" : "Data status: demo / seed / literature-derived"}
      </div>
      <div>
        {zh
          ? "本页用于整理来源证据、检查实验条件是否可比，并安排后续核验；候选结果不能替代实验结论。"
          : "This page supports evidence organization, comparability checks, and validation prioritization; candidate results still require experiments."}
      </div>
    </section>
  )
}

function workspaceFromHash() {
  if (typeof window === "undefined") return "overview"
  const hash = String(window.location.hash || "").replace(/^#/, "").trim()
  if (ORGANIC_ACID_FINAL_HASHES.has(hash)) return "organic-acid-final"
  return ORGANIC_ACID_WORKSPACE_HASHES.has(hash) ? "organic-acid" : "overview"
}

function organicAcidScrollTargetFromHash() {
  if (typeof window === "undefined") return null
  const hash = String(window.location.hash || "").replace(/^#/, "").trim()
  return ORGANIC_ACID_WORKSPACE_HASHES.has(hash) && hash !== "catalysis-organic-acid" ? hash : null
}

function organicAcidFinalScrollTargetFromHash() {
  if (typeof window === "undefined") return null
  const hash = String(window.location.hash || "").replace(/^#/, "").trim()
  return ORGANIC_ACID_FINAL_HASHES.has(hash) && hash !== "catalysis-organic-acid-final-screening" ? hash : null
}

export function CatalysisLabTab() {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const zh = lang === "zh"
  const [activeWorkspace, setActiveWorkspace] = useState(workspaceFromHash)
  const [pendingOrganicScrollTarget, setPendingOrganicScrollTarget] = useState(null)
  const [pendingFinalScrollTarget, setPendingFinalScrollTarget] = useState(null)
  const workspaceRef = useRef(null)
  const openLiteratureCenter = () => {
    window.location.hash = "catalysis-literature-verification"
  }

  useEffect(() => {
    const syncWorkspace = () => {
      const nextWorkspace = workspaceFromHash()
      setActiveWorkspace(nextWorkspace)
      if (nextWorkspace === "organic-acid") setPendingOrganicScrollTarget(organicAcidScrollTargetFromHash())
      if (nextWorkspace === "organic-acid-final") setPendingFinalScrollTarget(organicAcidFinalScrollTargetFromHash())
    }
    syncWorkspace()
    window.addEventListener("hashchange", syncWorkspace)
    window.addEventListener("popstate", syncWorkspace)
    return () => {
      window.removeEventListener("hashchange", syncWorkspace)
      window.removeEventListener("popstate", syncWorkspace)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || activeWorkspace !== "organic-acid" || !pendingOrganicScrollTarget) return undefined
    const delays = [90, 260, 620, 1100, 1650]
    const timers = delays.map((delay, index) => window.setTimeout(() => {
      document.getElementById(pendingOrganicScrollTarget)?.scrollIntoView({
        behavior: index === 0 ? "smooth" : "auto",
        block: "start",
      })
      if (index === delays.length - 1) setPendingOrganicScrollTarget(null)
    }, delay))
    return () => timers.forEach(timer => window.clearTimeout(timer))
  }, [activeWorkspace, pendingOrganicScrollTarget])

  useEffect(() => {
    if (typeof window === "undefined" || activeWorkspace !== "organic-acid-final" || !pendingFinalScrollTarget) return undefined
    const delays = [120, 360, 800, 1400, 2200]
    const timers = delays.map((delay, index) => window.setTimeout(() => {
      document.getElementById(pendingFinalScrollTarget)?.scrollIntoView({
        behavior: index === 0 ? "smooth" : "auto",
        block: "start",
      })
      if (index === delays.length - 1) setPendingFinalScrollTarget(null)
    }, delay))
    return () => timers.forEach(timer => window.clearTimeout(timer))
  }, [activeWorkspace, pendingFinalScrollTarget])

  const openOrganicAcidWorkspace = () => {
    setActiveWorkspace("organic-acid")
    if (typeof window !== "undefined" && window.location.hash !== "#catalysis-organic-acid") {
      window.history.pushState(null, "", `${window.location.pathname}${window.location.search}#catalysis-organic-acid`)
      window.dispatchEvent(new Event("hashchange"))
    }
  }

  const openOrganicAcidFinalScreening = () => {
    setActiveWorkspace("organic-acid-final")
    if (typeof window !== "undefined" && window.location.hash !== "#catalysis-organic-acid-final-screening") {
      window.history.pushState(null, "", `${window.location.pathname}${window.location.search}#catalysis-organic-acid-final-screening`)
      window.dispatchEvent(new Event("hashchange"))
    }
  }

  const backToOverview = () => {
    setActiveWorkspace("overview")
    if (typeof window !== "undefined" && window.location.hash !== "#catalysis") {
      window.history.pushState(null, "", `${window.location.pathname}${window.location.search}#catalysis`)
      window.dispatchEvent(new Event("hashchange"))
    }
  }

  const workspaceShellStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    margin: "0 auto",
    maxWidth: 1280,
    overflow: "visible",
    padding: isMobile ? "0 2px" : 0,
    position: "relative",
  }

  if (activeWorkspace === "organic-acid") {
    return (
      <div ref={workspaceRef} style={workspaceShellStyle}>
        <OrganicAcidWorkspace lang={lang} t={t} isMobile={isMobile} onBack={backToOverview} />
      </div>
    )
  }

  if (activeWorkspace === "organic-acid-final") {
    return (
      <div ref={workspaceRef} style={workspaceShellStyle}>
        <OrganicAcidFinalScreening lang={lang} t={t} isMobile={isMobile} onBack={backToOverview} />
      </div>
    )
  }

  return (
    <div ref={workspaceRef} style={workspaceShellStyle}>
      <ModulePageHeader
        title={zh ? "催化" : "Catalysis"}
        subtitle={zh
          ? "查看 DOI 核验反应记录、实验条件与活性相证据，以及有机酸转化专题、候选排序和研究验证中心。"
          : "Explore DOI-verified reaction records, operating conditions, active-phase evidence, organic-acid workspaces, candidate prioritization, and research validation."}
        action={<CopyLinkButton hash="catalysis" ariaLabel={zh ? "复制催化链接" : "Copy Catalysis link"} />}
      />

      <DataHostingNotice lang={lang} placement="catalysis" />

      <BoundaryStrip t={t} lang={lang} />

      <section
        id="catalysis-research-overview"
        data-testid="catalysis-research-overview"
        style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 8, padding: 16 }}
      >
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{zh ? "本页内容" : "Catalysis Research Overview"}</span>
        <h3 style={{ color: t.textStrong, fontSize: 18, lineHeight: 1.2, margin: 0 }}>{zh ? "催化研究资料与验证入口" : "Catalysis Research Overview"}</h3>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, margin: 0, maxWidth: 920 }}>
          {zh
            ? "文献与反应记录中心集中呈现 DOI 已核对的来源、实验条件、活性相证据、数值声明位置与数据缺口；有机酸专题保留独立研究区，并与相应方法说明互相链接。"
            : "The Catalysis literature and reaction record center uses DOI-verified records as a reusable layer for conditions, active-phase evidence, claim verification, admission tasks, and field provenance. Organic Acid remains an independent workspace linked to Methodology."}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(zh
            ? ["文献与反应记录", "实验条件覆盖", "声明与来源核对", "字段级来源", "有机酸专题", "研究验证"]
            : ["Literature and Record Center", "Condition Matrix", "Evidence Admission", "Field Provenance", "Organic Acid Entry", "Research Validation Center"]
          ).map(label => (
            <span key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, color: t.muted, fontSize: 10.6, fontWeight: 700, padding: "3px 9px" }}>{label}</span>
          ))}
        </div>
      </section>

      <section
        data-testid="catalysis-literature-center-entry"
        style={{ alignItems: "end", background: t.panel, borderTop: `1px solid ${t.border}`, display: "grid", gap: 18, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto", padding: "22px 0" }}
      >
        <div style={{ display: "grid", gap: 7, maxWidth: 900 }}>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{zh ? "独立研究中心" : "Independent research center"}</span>
          <h2 style={{ color: t.textStrong, fontSize: 22, lineHeight: 1.18, margin: 0 }}>{zh ? "催化文献核验中心" : "Catalysis Literature Verification"}</h2>
          <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>
            {zh
              ? "集中查看 DOI 身份、出版方核验、实验条件、数值声明位置、活性相证据、许可范围与待办任务。反应记录和核验中心使用同一底层数据库。"
              : "Review DOI identity, publisher verification, conditions, claim locations, active-phase evidence, licensing, and open tasks. Reaction records and verification share one underlying database."}
          </p>
        </div>
        <button type="button" onClick={openLiteratureCenter} style={{ background: t.textStrong, border: 0, borderRadius: 6, color: t.bg, cursor: "pointer", fontSize: 12, fontWeight: 850, minHeight: 38, padding: "0 14px" }}>
          {zh ? "进入核验中心" : "Open verification center"}
        </button>
      </section>

      <CatalysisDiscoveryWorkbench lang={lang} t={t} isMobile={isMobile} />

      <OrganicAcidEntryCard
        t={t}
        lang={lang}
        isMobile={isMobile}
        onOpen={openOrganicAcidWorkspace}
      />

      <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 14 }}>
        <div style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
          <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
            <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
              {zh ? "最终筛选与验证" : "Final screening loop"}
            </div>
            <h2 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.18, margin: 0 }}>
              {zh ? "有机酸最终筛选" : "Organic Acid Final Screening"}
            </h2>
            <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0, maxWidth: 860 }}>
              {zh
                ? "独立展示 170°C 水相 CO₂ 向甲酸 / 有机酸转化时的 Al-MOF 稳定骨架筛选、第二金属排序、Mo 排序依据、敏感性分析、盲测基线和 EXAFS 可证伪预测。"
                : "Open the separate 170°C aqueous CO₂ to formic acid / organic acids workflow for Al-MOF scaffold mining, dopant recommendation, Why Mo waterfall, sensitivity analysis, blind baselines, and EXAFS falsification."}
            </p>
          </div>
          <button
            type="button"
            onClick={openOrganicAcidFinalScreening}
            style={{ background: t.accent, border: `1px solid ${t.accent}`, borderRadius: 8, color: t.buttonText || "#fff", cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 36, padding: "8px 12px" }}
          >
            {zh ? "进入最终筛选" : "Enter final screening"}
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {(zh
            ? ["阶段 1：仅筛选 Al-MOF", "阶段 2：第二金属排序", "Mo 为当前筛选结果", "需要验证"]
            : ["Stage 1: Al-MOF only", "Stage 2: dopant ranking", "Mo as current outcome", "needs validation"]
          ).map(label => <BasisBadge key={label} tone={label === "需要验证" || label === "needs validation" ? "warn" : "proxy"}>{label}</BasisBadge>)}
        </div>
      </section>

      <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.55, padding: "11px 13px" }}>
        <strong style={{ color: t.textStrong }}>
          {zh ? "有机酸子工作台边界：" : "Organic Acid workspace boundary: "}
        </strong>
        {zh
          ? "有机酸转化是催化模块中优先展示的子工作台，但不是催化模块的全部范围。"
          : "Organic acid conversion is a prioritized sub-workspace within Catalysis, not the full scope of the module."}
      </section>
    </div>
  )
}
