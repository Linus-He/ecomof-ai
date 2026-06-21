// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import {
  useT,
  useLang,
  useViewport,
  FONT_MONO,
  LogoMark,
  BrandMotif,
} from "../../shared"
import { BrandMotionBackground } from "../home"
import { toolbarBtn } from "../../utils/styles"
import {
  DEFAULT_HOME_SUMMARY,
  loadHomeSummary,
} from "../../utils/homeSummary"

const text = (zh, en, lang) => (lang === "zh" ? zh : en)

function numberText(value, suffix = "") {
  const number = Number(value)
  if (!Number.isFinite(number)) return "Not available"
  return `${number}${suffix}`
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener?.("change", sync)
    return () => media.removeEventListener?.("change", sync)
  }, [])

  return reduced
}

function SectionHeader({ eyebrow, title, subtitle, t, isMobile }) {
  return (
    <div style={{ marginBottom: isMobile ? 14 : 18, maxWidth: 880 }}>
      <div style={{
        color: t.accentText,
        fontSize: 11,
        fontWeight: 850,
        textTransform: "uppercase",
        letterSpacing: 0,
        marginBottom: 7,
      }}>
        {eyebrow}
      </div>
      <h2 style={{
        margin: 0,
        color: t.textStrong,
        fontSize: isMobile ? 22 : 30,
        lineHeight: 1.15,
        fontWeight: 900,
        letterSpacing: 0,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          margin: "8px 0 0",
          color: t.muted,
          fontSize: isMobile ? 13 : 14,
          lineHeight: 1.65,
          maxWidth: 780,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

function ActionButton({ children, onClick, t, primary = false, wide = false, hash }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-hash={hash}
      className={primary ? "btn-primary" : "btn-secondary"}
      style={{
        ...toolbarBtn(t),
        justifyContent: "center",
        minHeight: 40,
        padding: "10px 15px",
        fontSize: 12.5,
        fontWeight: 850,
        border: `1px solid ${primary ? t.accent : t.borderStrong}`,
        background: primary ? t.accent : t.panel,
        color: primary ? "#FFFFFF" : t.accentText,
        width: wide ? "100%" : "auto",
        whiteSpace: "normal",
        textAlign: "center",
      }}
    >
      {children}
    </button>
  )
}

function IconBadge({ children, t, tone = "info" }) {
  const toneMap = {
    info: [t.badgeInfoBg, t.accentText],
    success: [t.badgeCalcBg, t.success || t.accentText],
    warn: [t.badgeWarnBg, t.warn],
    neutral: [t.surface, t.subtle],
  }
  const [background, color] = toneMap[tone] || toneMap.info
  return (
    <span style={{
      width: 38,
      height: 38,
      borderRadius: 9,
      border: `1px solid ${t.borderStrong}`,
      background,
      color,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 950,
      fontFamily: FONT_MONO,
      flexShrink: 0,
    }}>
      {children}
    </span>
  )
}

function PlatformCapabilityCard({ item, t }) {
  return (
    <article className="content-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      boxShadow: t.shadowSm,
      padding: 16,
      minWidth: 0,
      display: "grid",
      gap: 13,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <IconBadge t={t} tone={item.tone}>{item.mark}</IconBadge>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, color: t.textStrong, fontSize: 17, lineHeight: 1.25, fontWeight: 900 }}>
            {item.title}
          </h3>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, marginTop: 3, textTransform: "uppercase", letterSpacing: 0 }}>
            {item.subtitle}
          </div>
        </div>
      </div>
      <div style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 9,
        padding: "10px 11px",
        display: "grid",
        gap: 5,
      }}>
        {item.highlights.map(highlight => (
          <strong key={highlight} style={{ color: t.textStrong, fontSize: 13, lineHeight: 1.35, fontWeight: 900 }}>
            {highlight}
          </strong>
        ))}
      </div>
      <p style={{ margin: 0, color: t.muted, fontSize: 12, lineHeight: 1.6 }}>{item.body}</p>
    </article>
  )
}

function DataCard({ item, t }) {
  return (
    <article style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 9,
      padding: "13px 14px",
      display: "grid",
      gap: 6,
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <strong style={{ color: t.textStrong, fontSize: 13.5, lineHeight: 1.3 }}>{item.name}</strong>
        <span style={{ color: t.accentText, fontFamily: FONT_MONO, fontSize: 13, fontWeight: 950 }}>{item.value}</span>
      </div>
      <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{item.body}</span>
    </article>
  )
}

function MiniBarChart({ title, rows, t }) {
  return (
    <article className="content-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: 15,
      display: "grid",
      gap: 12,
      minWidth: 0,
    }}>
      <h3 style={{ margin: 0, color: t.textStrong, fontSize: 14.5, lineHeight: 1.3, fontWeight: 900 }}>{title}</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {rows.map(row => (
          <div key={row.label} style={{ display: "grid", gap: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.35, fontWeight: 780 }}>{row.label}</span>
              <span style={{ color: t.textStrong, fontSize: 11.5, lineHeight: 1.35, fontWeight: 900, fontFamily: FONT_MONO }}>{row.value}</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: t.surface, border: `1px solid ${t.border}`, overflow: "hidden" }}>
              <div style={{ width: `${Math.max(5, Math.min(100, row.percent))}%`, height: "100%", background: row.color || t.accent }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

function FlowStep({ item, t, index, isLast }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 11, position: "relative", minWidth: 0 }}>
      <div style={{ display: "grid", justifyItems: "center", alignContent: "start", gap: 7 }}>
        <IconBadge t={t} tone={item.tone}>{String(index + 1).padStart(2, "0")}</IconBadge>
        {!isLast && <span style={{ width: 1, height: 34, background: t.borderStrong }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 10 }}>
        <strong style={{ color: t.textStrong, fontSize: 14, lineHeight: 1.35 }}>{item.title}</strong>
        <p style={{ margin: "4px 0 0", color: t.muted, fontSize: 12, lineHeight: 1.55 }}>{item.body}</p>
      </div>
    </div>
  )
}

function ScenarioCard({ scenario, t, isMobile, onNavigate }) {
  return (
    <article className="content-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      boxShadow: t.shadowSm,
      padding: 17,
      display: "grid",
      gap: 13,
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <IconBadge t={t} tone={scenario.tone}>{scenario.mark}</IconBadge>
        <h3 style={{ margin: 0, color: t.textStrong, fontSize: 18, lineHeight: 1.25, fontWeight: 950 }}>{scenario.title}</h3>
      </div>
      <p style={{ margin: 0, color: t.muted, fontSize: 12.5, lineHeight: 1.65 }}>{scenario.body}</p>
      <ActionButton t={t} wide={isMobile} hash={`#${scenario.hash}`} onClick={() => onNavigate(scenario.hash, scenario.target)}>
        {scenario.button}
      </ActionButton>
    </article>
  )
}

function LimitationItem({ item, t }) {
  return (
    <li style={{
      listStyle: "none",
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 9,
      padding: "12px 13px",
      color: t.textStrong,
      display: "grid",
      gap: 3,
      minWidth: 0,
    }}>
      <strong style={{ fontSize: 13, lineHeight: 1.35 }}>{item.zh}</strong>
      <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{item.en}</span>
    </li>
  )
}

function HeroVisual({ t, lang, summary }) {
  const rows = [
    { label: "MOF DB", value: numberText(summary.totalRecords, "+") },
    { label: "Trace", value: "Field-level" },
    { label: "Screen", value: "White-box" },
    { label: "Validate", value: "Benchmark" },
  ]

  return (
    <aside className="content-card home-platform-visual" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      boxShadow: t.shadowSm,
      padding: 18,
      display: "grid",
      gap: 15,
      minWidth: 0,
      position: "relative",
      overflow: "hidden",
    }}>
      <BrandMotif
        size={150}
        color={t.accentText}
        opacity={0.045}
        className="hero-brand-watermark"
        style={{ position: "absolute", right: -28, top: -28, pointerEvents: "none" }}
      />
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <LogoMark size={24} radius={7} />
          <strong style={{ color: t.textStrong, fontSize: 12.5, lineHeight: 1.2 }}>
            {text("平台工作流", "Platform Workflow", lang)}
          </strong>
        </div>
        <span style={{
          color: t.accentText,
          background: t.badgeInfoBg,
          border: `1px solid ${t.border}`,
          borderRadius: 999,
          padding: "6px 9px",
          fontSize: 10.5,
          fontWeight: 850,
        }}>
          Benchmark Available
        </span>
      </div>
      <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 9 }}>
        {rows.map((row, index) => (
          <div key={row.label} style={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr)",
            gap: 10,
            alignItems: "center",
          }}>
            <IconBadge t={t} tone={index === 0 ? "info" : index === 1 ? "success" : index === 2 ? "warn" : "neutral"}>
              {String(index + 1).padStart(2, "0")}
            </IconBadge>
            <div style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 9,
              padding: "10px 11px",
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
            }}>
              <span style={{ color: t.muted, fontSize: 12, fontWeight: 820 }}>{row.label}</span>
              <strong style={{ color: t.textStrong, fontSize: 12.5, fontFamily: FONT_MONO, lineHeight: 1.3 }}>{row.value}</strong>
            </div>
          </div>
        ))}
      </div>
      <p style={{ position: "relative", zIndex: 1, margin: 0, color: t.subtle, fontSize: 11.5, lineHeight: 1.55, borderTop: `1px solid ${t.divider || t.border}`, paddingTop: 10 }}>
        {text("从数据库到筛选解释，再到验证准备。", "From database to screening explanation, then validation preparation.", lang)}
      </p>
    </aside>
  )
}

export function HomeTab({ setActiveTab }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const reducedMotion = usePrefersReducedMotion()
  const [summary, setSummary] = useState(DEFAULT_HOME_SUMMARY)
  const zh = lang === "zh"

  useEffect(() => {
    let cancelled = false
    loadHomeSummary().then(nextSummary => {
      if (!cancelled) setSummary(nextSummary)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const navigateHash = (hash, fallbackTarget) => {
    setActiveTab?.(fallbackTarget)
    if (typeof window === "undefined") return
    const normalized = String(hash || "").replace(/^#/, "")
    window.location.hash = normalized
    try {
      window.dispatchEvent(new HashChangeEvent("hashchange"))
    } catch {
      window.dispatchEvent(new Event("hashchange"))
    }
  }

  const pageGap = isMobile ? 34 : 52
  const sectionStyle = { background: "transparent", border: "none", borderRadius: 0 }
  const panelStyle = {
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    boxShadow: t.shadowSm,
  }

  const capabilities = useMemo(() => [
    {
      mark: "DL",
      title: zh ? "数据层" : "Data Layer",
      subtitle: "Platform Capabilities",
      tone: "info",
      highlights: [
        `${numberText(summary.totalRecords, "+")} Records`,
        `${numberText(summary.verifiedMetadataCount)} Verified Metadata`,
      ],
      body: zh ? "统一数据库、文献整理与字段级溯源，为筛选结果提供可追踪依据。" : "Unifies database records, literature curation, and field-level provenance for traceable screening.",
    },
    {
      mark: "SC",
      title: zh ? "筛选层" : "Screening Layer",
      subtitle: "Platform Capabilities",
      tone: "success",
      highlights: ["EcoScreen", "Performance Priority", "Ranking Explanation"],
      body: zh ? "把候选筛选、性能优先级和排序解释放在同一套工作流中。" : "Connects candidate screening, performance priority, and ranking explanation in one workflow.",
    },
    {
      mark: "OA",
      title: zh ? "有机酸层" : "Organic Acid Layer",
      subtitle: "Platform Capabilities",
      tone: "warn",
      highlights: ["Reaction Dataset", "Evidence Graph", "Decision Board"],
      body: zh ? "围绕有机酸路径组织反应数据、证据网络和候选决策面板。" : "Organizes reaction data, evidence graph context, and candidate decision boards for organic-acid screening.",
    },
    {
      mark: "VL",
      title: zh ? "验证层" : "Validation Layer",
      subtitle: "Platform Capabilities",
      tone: "neutral",
      highlights: ["Experimental Labels", "Benchmark", "Model Validation"],
      body: zh ? "把实验标签、Benchmark 框架和模型验证入口作为可信度检查层。" : "Uses experimental labels, the benchmark framework, and model validation as credibility checks.",
    },
  ], [summary, zh])

  const dataCards = useMemo(() => [
    { name: "CoRE MOF", value: numberText(summary.coreMofRecords), body: zh ? "外部数据库来源材料记录。" : "External database material records." },
    { name: "QMOF", value: numberText(summary.qmofRecords), body: zh ? "量子化学数据来源材料记录。" : "Quantum chemistry source records." },
    { name: "Organic Acid Literature", value: numberText(summary.organicAcidLiteratureRecords), body: zh ? "有机酸路径文献整理记录。" : "Literature-curated organic-acid pathway records." },
    { name: "Reaction Dataset", value: numberText(summary.reactionDatasetCount), body: zh ? "反应证据与可比性数据层。" : "Reaction evidence and comparability layer." },
    { name: "Gold Dataset", value: numberText(summary.goldDatasetCount), body: zh ? "用于质量审计的高质量整理集合。" : "High-quality curation set for quality audit." },
  ], [summary, zh])

  const chartRows = useMemo(() => ({
    coverage: [
      { label: "CoRE MOF", value: numberText(summary.coreMofRecords), percent: 100 },
      { label: "QMOF", value: numberText(summary.qmofRecords), percent: 100 },
      { label: "Organic Acid Literature", value: numberText(summary.organicAcidLiteratureRecords), percent: 44 },
    ],
    quality: [
      { label: "Verified Metadata", value: numberText(summary.verifiedMetadataCount), percent: Math.round((summary.verifiedMetadataCount / Math.max(1, summary.totalRecords)) * 100) },
      { label: "Gold Dataset", value: numberText(summary.goldDatasetCount), percent: 62 },
      { label: "Reaction Dataset", value: numberText(summary.reactionDatasetCount), percent: 100 },
    ],
    source: [
      { label: "Database", value: numberText(summary.coreMofRecords + summary.qmofRecords), percent: 82 },
      { label: "Literature", value: numberText(summary.organicAcidLiteratureRecords), percent: 18 },
      { label: "Derived Research Layer", value: numberText(summary.reactionDatasetCount), percent: 35 },
    ],
  }), [summary])

  const validationFlow = useMemo(() => [
    {
      title: "White-box Screening",
      body: zh ? "透明规则与权重让筛选路径可检查。" : "Transparent rules and weights keep the screening path inspectable.",
      tone: "info",
    },
    {
      title: "Evidence Adjustment",
      body: zh ? "证据等级、来源状态和风险提示影响解释语境。" : "Evidence level, source status, and risk notes shape the explanation context.",
      tone: "success",
    },
    {
      title: "Sensitivity Analysis",
      body: zh ? "候选稳定性通过参数扰动与排序变化检查。" : "Candidate stability is checked through parameter changes and ranking movement.",
      tone: "warn",
    },
    {
      title: "Experimental Labels",
      body: zh ? "实验标签用于连接候选解释与模型验证。" : "Experimental labels connect candidate explanation to model validation.",
      tone: "neutral",
    },
    {
      title: "Benchmark Framework",
      body: "Benchmark Available",
      tone: "info",
    },
  ], [zh])

  const scenarios = useMemo(() => [
    {
      mark: "MD",
      title: "MOF Discovery",
      body: zh ? "面向早期材料筛选，快速查看候选、来源字段和排序解释。" : "For early material screening: inspect candidates, source fields, and ranking explanations.",
      button: zh ? "进入 EcoScreen" : "Enter EcoScreen",
      hash: "ecoscreen",
      target: "ecoscreen",
      tone: "info",
    },
    {
      mark: "OA",
      title: "Organic Acid Screening",
      body: zh ? "围绕有机酸路径，查看反应数据、证据语境和候选决策面板。" : "For organic-acid pathways: review reaction data, evidence context, and candidate decision boards.",
      button: zh ? "进入 Organic Acid" : "Enter Organic Acid",
      hash: "catalysis-organic-acid",
      target: "catalysisLab",
      tone: "warn",
    },
    {
      mark: "BV",
      title: "Benchmark Validation",
      body: zh ? "查看验证中心的 Benchmark 框架、实验标签层和模型验证状态。" : "Use the validation center for benchmark framework, labels, and model-validation state.",
      button: zh ? "进入 Validation Center" : "Enter Validation Center",
      hash: "methodology-algorithm-validation",
      target: "about",
      tone: "success",
    },
  ], [zh])

  const limitations = useMemo(() => [
    { zh: "Results require experimental validation", en: "Screening outputs need laboratory confirmation before scientific claims." },
    { zh: "Not final recommendation", en: "Candidate rankings support research decisions, not final experimental recommendation." },
    { zh: "Some datasets remain literature-derived", en: "Literature-derived records keep source context and uncertainty visible." },
    { zh: "Model validation is ongoing", en: "Benchmark and validation workflows are available, while model credibility continues to be reviewed." },
  ], [])

  const quickStart = [
    { label: zh ? "进入 EcoScreen" : "Enter EcoScreen", hash: "ecoscreen", target: "ecoscreen", primary: true },
    { label: zh ? "进入 MOF Library" : "Enter MOF Library", hash: "library", target: "mofLibrary" },
    { label: zh ? "进入 Organic Acid" : "Enter Organic Acid", hash: "catalysis-organic-acid", target: "catalysisLab" },
    { label: zh ? "进入 Validation Center" : "Enter Validation Center", hash: "methodology-algorithm-validation", target: "about" },
    { label: zh ? "进入 Research Reports" : "Enter Research Reports", hash: "research-reports", target: "researchReports" },
  ]

  return (
    <div className="home-story-shell" style={{ display: "flex", flexDirection: "column", gap: pageGap, overflow: "hidden", position: "relative" }}>
      <BrandMotionBackground t={t} isMobile={isNarrow} reducedMotion={reducedMotion} />

      <section id="overview" data-testid="home-hero" className="home-hero-section" style={{ ...sectionStyle, paddingTop: isMobile ? 12 : 30, position: "relative", overflow: "hidden" }}>
        <div className="home-hero-bg-layer" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {!isMobile && (
            <BrandMotif
              size={300}
              color={t.accentText}
              opacity={0.052}
              className="hero-bg-brand-motif"
              style={{ position: "absolute", right: -86, top: 10, pointerEvents: "none" }}
              strokeWidth={1.2}
            />
          )}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.05fr) minmax(360px, 0.95fr)",
          gap: isMobile ? 18 : 28,
          alignItems: "center",
          minWidth: 0,
          position: "relative",
          zIndex: 1,
        }}>
          <div className="home-hero-foreground" style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <LogoMark size={isMobile ? 48 : 58} radius={14} style={{ boxShadow: t.shadowSm }} />
              <div style={{ color: t.accentText, fontSize: 12, fontWeight: 900, letterSpacing: 0 }}>
                {zh ? "材料筛选 / 字段级溯源 / 验证准备" : "Material screening / field-level provenance / validation readiness"}
              </div>
            </div>
            <h1 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 42 : 64, lineHeight: 0.98, fontWeight: 950, letterSpacing: 0 }}>
              EcoMOF-AI
            </h1>
            <p style={{ margin: isMobile ? "14px 0 0" : "18px 0 0", color: t.textStrong, fontSize: isMobile ? 20 : 28, lineHeight: 1.18, fontWeight: 900, maxWidth: 860 }}>
              Data-driven MOF Screening and Validation Platform
            </p>
            <p style={{ margin: "13px 0 0", color: t.muted, fontSize: isMobile ? 14 : 16, lineHeight: 1.7, maxWidth: 780 }}>
              {zh
                ? "整合 MOF 数据库、字段级溯源、白盒筛选算法、实验标签与模型验证框架，用于支持材料筛选与研究决策。"
                : "Integrates MOF databases, field-level provenance, white-box screening algorithms, experimental labels, and model-validation frameworks for material screening and research decisions."}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }} className="home-hero-cta">
              {quickStart.slice(0, 3).map(cta => (
                <ActionButton key={cta.hash} t={t} primary={cta.primary} wide={isMobile} hash={`#${cta.hash}`} onClick={() => navigateHash(cta.hash, cta.target)}>
                  {cta.label}
                </ActionButton>
              ))}
            </div>
          </div>
          <HeroVisual t={t} lang={lang} summary={summary} />
        </div>
      </section>

      <section data-testid="home-platform-capabilities" style={sectionStyle}>
        <SectionHeader
          eyebrow={zh ? "平台能力" : "Capabilities"}
          title={zh ? "从数据到验证的四层科研工作台" : "A four-layer research workspace from data to validation"}
          subtitle={zh ? "首页优先说明能做什么，而不是展示版本更新记录。" : "The homepage now prioritizes what the platform does, not release-history reporting."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 14 }}>
          {capabilities.map(item => <PlatformCapabilityCard key={item.title} item={item} t={t} />)}
        </div>
      </section>

      <section data-testid="home-data-foundation" style={{ ...panelStyle, padding: isMobile ? "18px 16px" : "24px", background: t.badgeInfoBg }}>
        <SectionHeader
          eyebrow={zh ? "数据基础" : "Data Foundation"}
          title={zh ? "可追踪的数据来源与质量概览" : "Traceable source and data-quality overview"}
          subtitle={zh ? "展示数据库、文献、反应与 Gold 数据集，不展示版本增长曲线。" : "Shows database, literature, reaction, and Gold datasets without a version-growth chart."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(5, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
          {dataCards.map(item => <DataCard key={item.name} item={item} t={t} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          <MiniBarChart title="Data Coverage" rows={chartRows.coverage} t={t} />
          <MiniBarChart title="Data Quality" rows={chartRows.quality} t={t} />
          <MiniBarChart title="Source Distribution" rows={chartRows.source} t={t} />
        </div>
      </section>

      <section data-testid="home-algorithm-validation" style={sectionStyle}>
        <SectionHeader
          eyebrow={zh ? "算法与验证" : "Validation"}
          title={zh ? "白盒筛选与 Benchmark 验证框架" : "White-box screening with benchmark validation framework"}
          subtitle={zh ? "首页只展示验证能力与 Benchmark 可用状态，具体模型指标留在算法验证中心。" : "The homepage shows validation capabilities and Benchmark Available; detailed model metrics stay in the validation center."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{ ...panelStyle, padding: isMobile ? "16px" : "22px", display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) 220px", gap: 18 }}>
          <div style={{ display: "grid", gap: 2 }}>
            {validationFlow.map((item, index) => (
              <FlowStep key={item.title} item={item} t={t} index={index} isLast={index === validationFlow.length - 1} />
            ))}
          </div>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 15, alignSelf: "start", display: "grid", gap: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 16, lineHeight: 1.3 }}>Benchmark Available</strong>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>
              {zh ? "Benchmark 框架已作为验证入口呈现，模型指标详情由验证中心承载。" : "The benchmark framework is available as the validation entry; model metric details stay in the validation center."}
            </span>
          </div>
        </div>
      </section>

      <section data-testid="home-research-scenarios" style={sectionStyle}>
        <SectionHeader
          eyebrow={zh ? "研究场景" : "Research Scenarios"}
          title={zh ? "三类常见研究入口" : "Three common research entry points"}
          subtitle={zh ? "用户可以从材料发现、有机酸筛选或 Benchmark 验证直接进入对应工作区。" : "Users can enter the right workspace through discovery, organic-acid screening, or benchmark validation."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 14 }}>
          {scenarios.map(scenario => (
            <ScenarioCard key={scenario.title} scenario={scenario} t={t} isMobile={isMobile} onNavigate={navigateHash} />
          ))}
        </div>
      </section>

      <section data-testid="home-current-limitations" style={{ ...panelStyle, padding: isMobile ? "18px 16px" : "24px", background: t.surface }}>
        <SectionHeader
          eyebrow={zh ? "当前边界" : "Current Scope and Limitations"}
          title={zh ? "当前边界直接显示" : "Current scope and limitations are visible"}
          subtitle={zh ? "科研平台需要把验证状态、推荐边界与数据来源边界放在首页。" : "A research platform should surface validation state, recommendation boundary, and data-source boundary on the homepage."}
          t={t}
          isMobile={isMobile}
        />
        <ul style={{ margin: 0, padding: 0, display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {limitations.map(item => <LimitationItem key={item.zh} item={item} t={t} />)}
        </ul>
      </section>

      <section data-testid="home-quick-start" style={{ ...panelStyle, padding: isMobile ? "22px 18px" : "30px 34px", display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) auto", gap: 18, alignItems: "center", marginBottom: isMobile ? 4 : 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: t.accentText, fontSize: 11, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0, marginBottom: 8 }}>
            {zh ? "快速开始" : "Quick Start"}
          </div>
          <h2 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 24 : 32, lineHeight: 1.15, fontWeight: 950, letterSpacing: 0 }}>
            {zh ? "选择研究入口" : "Choose a research entry point"}
          </h2>
          <p style={{ margin: "9px 0 0", color: t.muted, fontSize: 13.5, lineHeight: 1.65, maxWidth: 760 }}>
            {zh ? "从筛选、数据库、有机酸、验证中心或研究报告进入完整工作流。" : "Start from screening, the MOF library, organic acid, the validation center, or research reports."}
          </p>
        </div>
        <div data-testid="home-quick-start-buttons" style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: isNarrow ? "flex-start" : "flex-end" }}>
          {quickStart.map(cta => (
            <ActionButton key={cta.hash} t={t} primary={cta.primary} wide={isMobile} hash={`#${cta.hash}`} onClick={() => navigateHash(cta.hash, cta.target)}>
              {cta.label}
            </ActionButton>
          ))}
        </div>
      </section>
    </div>
  )
}
