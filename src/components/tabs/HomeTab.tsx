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
  formatStatus,
  loadHomeSummary,
} from "../../utils/homeSummary"

const text = (zh, en, lang) => (lang === "zh" ? zh : en)

function numberText(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "Not available"
  return String(number)
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

function SectionHeader({ eyebrow, title, subtitle, t, isMobile, action }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
      marginBottom: isMobile ? 14 : 18,
      flexWrap: "wrap",
    }}>
      <div style={{ minWidth: 0, maxWidth: 860 }}>
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
      {action}
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

function MetricCard({ metric, t }) {
  return (
    <article
      data-testid={`home-metric-${metric.id}`}
      className="content-card home-current-metric-card"
      style={{
        background: t.panel,
        border: `1px solid ${metric.emphasis ? t.accent : t.border}`,
        borderRadius: 10,
        padding: 16,
        boxShadow: metric.emphasis ? t.shadowSm : "none",
        minWidth: 0,
        display: "grid",
        gap: 9,
      }}
    >
      <div style={{
        color: metric.tone === "pending" ? t.warn : metric.tone === "status" ? t.accentText : t.textStrong,
        fontSize: metric.compact ? 18 : 25,
        fontWeight: 950,
        lineHeight: 1.08,
        fontFamily: metric.mono === false ? "inherit" : FONT_MONO,
        wordBreak: "break-word",
      }}>
        {metric.value}
      </div>
      <div>
        <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900, lineHeight: 1.35 }}>{metric.zhTitle}</div>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, marginTop: 2, textTransform: "uppercase", letterSpacing: 0 }}>
          {metric.enTitle}
        </div>
      </div>
      <p style={{ margin: 0, color: t.muted, fontSize: 11.5, lineHeight: 1.6 }}>{metric.body}</p>
    </article>
  )
}

function CapabilityCard({ item, t }) {
  return (
    <article className="content-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      boxShadow: t.shadowSm,
      padding: 16,
      minWidth: 0,
      display: "grid",
      gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          border: `1px solid ${t.borderStrong}`,
          background: item.tint,
          color: item.color,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 950,
          fontFamily: FONT_MONO,
          flexShrink: 0,
        }}>
          {item.mark}
        </div>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, color: t.textStrong, fontSize: 16, lineHeight: 1.25, fontWeight: 900 }}>
            {item.title}
          </h3>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, marginTop: 3, textTransform: "uppercase", letterSpacing: 0 }}>
            {item.subtitle}
          </div>
        </div>
      </div>
      <ul style={{ margin: 0, padding: "0 0 0 17px", color: t.muted, fontSize: 12, lineHeight: 1.75 }}>
        {item.points.map(point => <li key={point}>{point}</li>)}
      </ul>
    </article>
  )
}

function LimitationItem({ item, t }) {
  return (
    <li style={{
      listStyle: "none",
      background: item.critical ? t.badgeDangerBg : t.panel,
      border: `1px solid ${item.critical ? t.danger : t.border}`,
      borderRadius: 9,
      padding: "11px 12px",
      color: item.critical ? t.danger : t.textStrong,
      display: "grid",
      gap: 3,
      minWidth: 0,
    }}>
      <strong style={{ fontSize: 13, lineHeight: 1.35 }}>{item.zh}</strong>
      <span style={{ color: item.critical ? t.danger : t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{item.en}</span>
    </li>
  )
}

function StatusPanel({ summary, t, lang, isMobile }) {
  const statusRows = [
    {
      label: text("当前版本", "Current Version", lang),
      value: summary.currentVersion,
    },
    {
      label: text("数据总量", "Total Records", lang),
      value: numberText(summary.totalRecords),
    },
    {
      label: text("实验标签", "Experimental Labels", lang),
      value: `${numberText(summary.experimentalLabelCount)} / ${formatStatus(summary.accuracyStatus)}`,
    },
    {
      label: text("验证状态", "Validation Status", lang),
      value: "Accuracy / ROC-AUC Pending",
    },
  ]

  return (
    <aside className="content-card home-status-panel" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      boxShadow: t.shadowSm,
      padding: isMobile ? 16 : 18,
      minWidth: 0,
      display: "grid",
      gap: 15,
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
          <span style={{ color: t.textStrong, fontSize: 12, fontWeight: 900, lineHeight: 1.2 }}>
            {text("首页数据摘要", "Homepage Data Summary", lang)}
          </span>
        </div>
        <span style={{
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          background: t.badgeInfoBg,
          color: t.accentText,
          padding: "7px 9px",
          fontSize: 11,
          fontWeight: 850,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        }}>
          {summary.currentVersion}
        </span>
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 9 }}>
        {statusRows.map(row => (
          <div key={row.label} style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 0.95fr) minmax(0, 1.05fr)",
            gap: 10,
            alignItems: "center",
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 9,
            padding: "10px 11px",
          }}>
            <span style={{ color: t.faint, fontSize: 11, fontWeight: 850, lineHeight: 1.35 }}>{row.label}</span>
            <strong style={{ color: t.textStrong, fontSize: 12.5, lineHeight: 1.35, fontWeight: 900, textAlign: "right" }}>{row.value}</strong>
          </div>
        ))}
      </div>

      <div style={{
        position: "relative",
        zIndex: 1,
        color: t.subtle,
        fontSize: 11.5,
        lineHeight: 1.55,
        fontWeight: 780,
        borderTop: `1px solid ${t.divider || t.border}`,
        paddingTop: 10,
      }}>
        {text(
          "Database Preview · Not Final Recommendation。结果用于早期筛选、候选解释与实验验证准备。",
          "Database Preview · Not Final Recommendation. Outputs support early screening, candidate explanation, and validation preparation.",
          lang,
        )}
      </div>
    </aside>
  )
}

function HomeDataSourceNote({ summary, t, lang }) {
  return (
    <div data-testid="home-data-sources" style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 9,
      padding: "11px 12px",
      color: t.muted,
      fontSize: 11.5,
      lineHeight: 1.65,
    }}>
      <strong style={{ color: t.textStrong }}>{text("轻量首页数据源", "Lightweight homepage sources", lang)}</strong>
      <span> · home_summary.json · data_ingestion_summary_v3.json · version_evolution_records.json</span>
      <span> · {text("未读取多 MB 记录数组", "No multi-MB record arrays are read", lang)}</span>
      <span> · {text("更新日期", "Last updated", lang)}: {summary.lastUpdated || "not available"}</span>
    </div>
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
    if (normalized === "mof-library") {
      window.history.pushState(null, "", `${window.location.pathname}${window.location.search}#${normalized}`)
      return
    }
    window.location.hash = normalized
    try {
      window.dispatchEvent(new HashChangeEvent("hashchange"))
    } catch {
      window.dispatchEvent(new Event("hashchange"))
    }
  }

  const pageGap = isMobile ? 34 : 52
  const sectionStyle = {
    background: "transparent",
    border: "none",
    borderRadius: 0,
  }
  const panelStyle = {
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    boxShadow: t.shadowSm,
  }

  const metricCards = useMemo(() => [
    {
      id: "total-records",
      zhTitle: "数据总量",
      enTitle: "Total Records",
      value: numberText(summary.totalRecords),
      body: `${numberText(summary.coreMofRecords)} CoRE MOF + ${numberText(summary.qmofRecords)} QMOF + ${numberText(summary.organicAcidLiteratureRecords)} literature records.`,
      emphasis: true,
    },
    {
      id: "verified-metadata",
      zhTitle: "已核验元数据",
      enTitle: "Verified Metadata",
      value: numberText(summary.verifiedMetadataCount),
      body: zh ? "已通过来源字段、引用和结构化元数据核验的外部数据库记录。" : "External database records with source fields, citation context, and structured metadata verified.",
    },
    {
      id: "gold-dataset",
      zhTitle: "Gold 数据集",
      enTitle: "Gold Dataset",
      value: numberText(summary.goldDatasetCount),
      body: zh ? "用于数据审计与方法边界说明的高质量整理层。" : "High-quality curation layer for data audit and method-boundary statements.",
    },
    {
      id: "reaction-dataset",
      zhTitle: "反应数据",
      enTitle: "Reaction Dataset",
      value: numberText(summary.reactionDatasetCount),
      body: zh ? "面向反应证据、可比性和有机酸闭环的派生数据层。" : "Derived reaction layer for evidence, comparability, and Organic-acid closure.",
    },
    {
      id: "organic-acid-literature",
      zhTitle: "有机酸文献数据",
      enTitle: "Organic-acid Literature",
      value: numberText(summary.organicAcidLiteratureRecords),
      body: zh ? "来自有机酸路径与催化语境的 literature-curated records。" : "Literature-curated records from organic-acid pathway and catalysis context.",
    },
    {
      id: "experimental-labels",
      zhTitle: "实验标签",
      enTitle: "Experimental Labels",
      value: `${numberText(summary.experimentalLabelCount)} / Pending`,
      body: zh ? "仅统计独立实验测量标签；派生标签不计入实验标签。" : "Only independently measured labels count; derived labels are excluded.",
      tone: "pending",
    },
    {
      id: "accuracy-roc",
      zhTitle: "模型精度",
      enTitle: "Accuracy / ROC-AUC",
      value: "Pending",
      body: zh ? "真实 Accuracy / ROC-AUC 在独立实验标签层建立前保持 Pending。" : "Real Accuracy / ROC-AUC stay Pending until independent experimental labels exist.",
      tone: "pending",
    },
    {
      id: "current-status",
      zhTitle: "当前状态",
      enTitle: "Current Status",
      value: "Database Preview · Not Final Recommendation",
      body: zh ? "数据驱动研究原型；结果不构成最终实验推荐。" : "Data-driven research prototype; outputs are not final experimental recommendations.",
      compact: true,
      mono: false,
      tone: "status",
      emphasis: true,
    },
  ], [summary, zh])

  const capabilities = useMemo(() => [
    {
      mark: "01",
      title: zh ? "数据接入与标准化" : "Data Intake & Standardization",
      subtitle: "Current Capabilities",
      color: t.accentText,
      tint: t.badgeInfoBg,
      points: [
        "CoRE MOF / QMOF / literature ingestion",
        "Unit normalization",
        zh ? "Data provenance / 字段级溯源" : "Data provenance / field-level provenance",
      ],
    },
    {
      mark: "02",
      title: zh ? "筛选与解释" : "Screening & Explanation",
      subtitle: "Current Capabilities",
      color: t.success || t.accentText,
      tint: t.badgeCalcBg,
      points: [
        "EcoScreen",
        "performance priority",
        zh ? "ranking explanation / 排序解释" : "ranking explanation",
      ],
    },
    {
      mark: "03",
      title: zh ? "有机酸算法闭环" : "Organic-acid Algorithm Loop",
      subtitle: "Current Capabilities",
      color: t.warn,
      tint: t.badgeWarnBg,
      points: [
        "white-box MCDA",
        "evidence adjustment",
        "risk penalty",
        "sensitivity analysis",
      ],
    },
    {
      mark: "04",
      title: zh ? "验证与报告" : "Validation & Reports",
      subtitle: "Current Capabilities",
      color: t.violet || t.accentText,
      tint: t.surface,
      points: [
        "Algorithm Validation Center",
        "Interactive Scientific Figure",
        "Research Reports",
        "Benchmark pending until real labels",
      ],
    },
  ], [t, zh])

  const limitations = useMemo(() => [
    {
      zh: "Experimental Labels = 0",
      en: "No independently measured experimental labels are available yet.",
      critical: true,
    },
    {
      zh: "Accuracy / ROC-AUC Pending",
      en: "Model accuracy and ROC-AUC are not shown until a valid label layer exists.",
      critical: true,
    },
    {
      zh: "Final Recommendation Disabled",
      en: "Candidate rankings remain research preparation, not final experimental recommendation.",
    },
    {
      zh: "Results require experimental validation",
      en: "Screening outputs require laboratory confirmation before scientific claims.",
    },
    {
      zh: "CoRE / QMOF values require exact record-level confirmation where marked pending",
      en: "Database-derived values keep pending markers when exact record-level confirmation is still needed.",
    },
  ], [])

  const ctas = [
    {
      label: zh ? "进入 EcoScreen" : "Enter EcoScreen",
      hash: "ecoscreen",
      target: "ecoscreen",
      primary: true,
    },
    {
      label: zh ? "查看算法验证中心" : "View Algorithm Validation Center",
      hash: "methodology-algorithm-validation",
      target: "about",
    },
    {
      label: zh ? "查看研究报告" : "View Research Reports",
      hash: "research-reports",
      target: "researchReports",
    },
    {
      label: zh ? "查看项目演化" : "View Project Evolution",
      hash: "project-evolution",
      target: "projectEvolution",
    },
    {
      label: zh ? "查看 MOF 数据库" : "View MOF Database",
      hash: "mof-library",
      target: "mofLibrary",
    },
  ]

  return (
    <div className="home-story-shell" style={{ display: "flex", flexDirection: "column", gap: pageGap, overflow: "hidden", position: "relative" }}>
      <BrandMotionBackground t={t} isMobile={isNarrow} reducedMotion={reducedMotion} />
      <section id="overview" className="home-hero-section" style={{ ...sectionStyle, paddingTop: isMobile ? 12 : 30, position: "relative", overflow: "hidden" }}>
        <div
          className="home-hero-bg-layer"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        >
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
                {zh ? "数据库预览 / 算法验证 / 字段级溯源" : "Database Preview / Algorithm Validation / Field-level Provenance"}
              </div>
            </div>
            <h1 style={{
              margin: 0,
              color: t.textStrong,
              fontSize: isMobile ? 42 : 64,
              lineHeight: 0.98,
              fontWeight: 950,
              letterSpacing: 0,
            }}>
              EcoMOF-AI
            </h1>
            <p style={{
              margin: isMobile ? "14px 0 0" : "18px 0 0",
              color: t.textStrong,
              fontSize: isMobile ? 20 : 27,
              lineHeight: 1.18,
              fontWeight: 900,
              maxWidth: 860,
            }}>
              数据驱动的 MOF 筛选与验证平台
            </p>
            <p style={{
              margin: "7px 0 0",
              color: t.accentText,
              fontSize: isMobile ? 14 : 16,
              lineHeight: 1.45,
              fontWeight: 850,
              maxWidth: 760,
            }}>
              Data-driven MOF screening and validation platform
            </p>
            <p style={{
              margin: "13px 0 0",
              color: t.muted,
              fontSize: isMobile ? 14 : 16,
              lineHeight: 1.7,
              maxWidth: 780,
            }}>
              {zh
                ? "EcoMOF-AI 将 MOF 数据库、字段级溯源、白盒筛选算法、数据审计与模型基准框架整合在一起，用于支持早期材料筛选、候选解释与实验验证准备。"
                : "EcoMOF-AI integrates MOF databases, field-level provenance, white-box screening algorithms, data audits, and a benchmark framework for early material screening, candidate explanation, and experimental validation preparation."}
            </p>
            <div style={{
              marginTop: 14,
              background: t.badgeWarnBg,
              border: `1px solid ${t.warn}`,
              borderRadius: 9,
              color: t.warn,
              padding: "10px 12px",
              fontSize: 12.5,
              lineHeight: 1.55,
              fontWeight: 820,
              maxWidth: 820,
            }}>
              {zh
                ? "当前仍为数据库预览与算法验证阶段，不构成最终实验推荐。"
                : "Current status remains Database Preview and algorithm validation; it is not a final experimental recommendation."}
            </div>
            <div style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 22,
            }} className="home-hero-cta">
              {ctas.slice(0, 3).map(cta => (
                <ActionButton
                  key={cta.hash}
                  t={t}
                  primary={cta.primary}
                  wide={isMobile}
                  hash={`#${cta.hash}`}
                  onClick={() => navigateHash(cta.hash, cta.target)}
                >
                  {cta.label}
                </ActionButton>
              ))}
            </div>
          </div>
          <StatusPanel summary={summary} t={t} lang={lang} isMobile={isMobile} />
        </div>
      </section>

      <section style={{ ...panelStyle, padding: isMobile ? "18px 16px" : "24px", background: t.badgeInfoBg }}>
        <SectionHeader
          eyebrow={zh ? "当前首页数据摘要" : "Current Homepage Data Summary"}
          title={zh ? "V3.3 数据状态同步到首页" : "V3.3 data status on the homepage"}
          subtitle={zh ? "首页只展示轻量 summary 中的项目状态，不读取大型记录数组，也不声明 V3.4 真实 Benchmark 已完成。" : "The homepage reads lightweight summary state only, avoids large record arrays, and does not claim V3.4 real benchmark completion."}
          t={t}
          isMobile={isMobile}
        />
        <div data-testid="home-current-metrics" style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}>
          {metricCards.map(metric => <MetricCard key={metric.id} metric={metric} t={t} />)}
        </div>
        <div style={{ marginTop: 12 }}>
          <HomeDataSourceNote summary={summary} t={t} lang={lang} />
        </div>
      </section>

      <section style={sectionStyle}>
        <SectionHeader
          eyebrow={zh ? "当前能力" : "Current Capabilities"}
          title={zh ? "数据驱动筛选、解释、审计与报告入口" : "Data-driven screening, explanation, audit, and reporting entry"}
          subtitle={zh ? "首页改为呈现平台当前可用能力，而不是早期演示指标。" : "The homepage now describes current platform capabilities instead of early demo indicators."}
          t={t}
          isMobile={isMobile}
        />
        <div data-testid="home-current-capabilities" style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))",
          gap: 14,
        }}>
          {capabilities.map(item => <CapabilityCard key={item.title} item={item} t={t} />)}
        </div>
      </section>

      <section data-testid="home-current-limitations" style={{
        ...panelStyle,
        padding: isMobile ? "18px 16px" : "24px",
        background: t.surface,
      }}>
        <SectionHeader
          eyebrow={zh ? "当前限制" : "Current Limitations"}
          title={zh ? "验证边界必须在首页可见" : "Validation boundaries stay visible on the homepage"}
          subtitle={zh ? "以下限制直接显示，不隐藏在 tooltip 中。" : "These limitations are shown directly, not hidden inside tooltips."}
          t={t}
          isMobile={isMobile}
        />
        <ul style={{
          margin: 0,
          padding: 0,
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(5, minmax(0, 1fr))",
          gap: 10,
        }}>
          {limitations.map(item => <LimitationItem key={item.zh} item={item} t={t} />)}
        </ul>
      </section>

      <section id="home-next-step" data-testid="home-next-step" style={{
        ...panelStyle,
        padding: isMobile ? "22px 18px" : "30px 34px",
        display: "grid",
        gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) auto",
        gap: 18,
        alignItems: "center",
        marginBottom: isMobile ? 4 : 10,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: t.accentText, fontSize: 11, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0, marginBottom: 8 }}>
            {zh ? "下一步" : "Next Step"}
          </div>
          <h2 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 24 : 32, lineHeight: 1.15, fontWeight: 950, letterSpacing: 0 }}>
            {zh ? "V3.4 建立真实实验标签层" : "V3.4 builds the real experimental label layer"}
          </h2>
          <p style={{ margin: "9px 0 0", color: t.muted, fontSize: 13.5, lineHeight: 1.65, maxWidth: 760 }}>
            {zh
              ? "V3.4 将重点建立真实实验标签层，用于支持第一版合法的模型精度比较。当前首页保持 Accuracy / ROC-AUC Pending。"
              : "V3.4 will focus on real experimental labels for the first legitimate model-accuracy comparison. This homepage keeps Accuracy / ROC-AUC Pending."}
          </p>
        </div>
        <div data-testid="home-navigation-ctas" style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: isNarrow ? "flex-start" : "flex-end" }}>
          {ctas.map(cta => (
            <ActionButton
              key={cta.hash}
              t={t}
              primary={cta.primary}
              wide={isMobile}
              hash={`#${cta.hash}`}
              onClick={() => navigateHash(cta.hash, cta.target)}
            >
              {cta.label}
            </ActionButton>
          ))}
        </div>
      </section>
    </div>
  )
}
