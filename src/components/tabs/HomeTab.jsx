import { useMemo, useState } from "react"
import {
  useT,
  useLang,
  useViewport,
  BrandMark,
  DataModeNote,
  DataModeToggle,
  FONT_MONO,
  InlineFormula,
} from "../../shared"
import { toolbarBtn } from "../../utils/styles"

const CORE_DESCRIPTOR_LABELS = [
  "Surface area",
  "Pore size",
  "Pore volume",
  "CO2 uptake",
  "Band gap",
  "Water stability",
  "Thermal stability",
  "Toxicity concern",
]

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
      <div style={{ minWidth: 0, maxWidth: 820 }}>
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
            maxWidth: 760,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

function ActionButton({ children, onClick, t, primary = false, wide = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
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

function InfoPopover({ label, title, body, t }) {
  return (
    <details style={{ position: "relative", display: "inline-flex" }}>
      <summary
        title={title}
        aria-label={title}
        style={{
          listStyle: "none",
          cursor: "pointer",
          width: 20,
          height: 20,
          borderRadius: 999,
          border: `1px solid ${t.borderStrong}`,
          color: t.accentText,
          background: t.panel,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {label || "i"}
      </summary>
      <div style={{
        position: "absolute",
        top: 26,
        right: 0,
        width: 260,
        maxWidth: "calc(100vw - 36px)",
        zIndex: 30,
        background: t.panel,
        border: `1px solid ${t.borderStrong}`,
        borderRadius: 8,
        boxShadow: t.shadowMd,
        padding: 12,
      }}>
        <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 5 }}>{title}</div>
        <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.6 }}>{body}</div>
      </div>
    </details>
  )
}

function MiniBar({ label, value, color, t }) {
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <span style={{ color: t.muted, fontSize: 11, fontWeight: 750 }}>{label}</span>
        <span style={{ color: t.textStrong, fontSize: 11, fontWeight: 850, fontFamily: FONT_MONO }}>{value}%</span>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: t.surface, border: `1px solid ${t.border}`, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color || t.accent }} />
      </div>
    </div>
  )
}

function HeroVisualPanel({ t, lang, isMobile }) {
  const zh = lang === "zh"
  return (
    <aside className="content-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      boxShadow: t.shadowSm,
      padding: isMobile ? 16 : 18,
      minWidth: 0,
      display: "grid",
      gap: 15,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0 }}>
            Screening score preview
          </div>
          <div style={{ color: t.textStrong, fontSize: isMobile ? 26 : 32, lineHeight: 1, fontWeight: 950, marginTop: 6 }}>
            0.72
          </div>
        </div>
        <div style={{
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          background: t.badgeInfoBg,
          color: t.accentText,
          padding: "7px 9px",
          fontSize: 11,
          fontWeight: 850,
          lineHeight: 1.2,
          textAlign: "right",
        }}>
          {zh ? "演示排序" : "Demo ranking"}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <MiniBar label="Descriptor completeness" value={75} color={t.accent} t={t} />
        <MiniBar label="Evidence coverage" value={58} color={t.cyan || t.accent} t={t} />
        <MiniBar label="Uncertainty flagging" value={82} color={t.violet || t.accent} t={t} />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 8,
      }}>
        {[
          ["8", zh ? "核心描述符" : "core descriptors"],
          ["6", zh ? "证据等级" : "evidence levels"],
          ["2", zh ? "数据模式" : "data modes"],
        ].map(([value, label]) => (
          <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 9px", minWidth: 0 }}>
            <div style={{ color: t.textStrong, fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{value}</div>
            <div style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.35, marginTop: 5 }}>{label}</div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function ReasonCard({ card, t, isMobile }) {
  return (
    <article className="content-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      boxShadow: t.shadowSm,
      padding: isMobile ? 18 : 22,
      display: "grid",
      gap: 12,
      minWidth: 0,
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 9,
        border: `1px solid ${t.border}`,
        background: card.tint,
        color: card.color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        fontWeight: 950,
        fontFamily: FONT_MONO,
      }}>
        {card.mark}
      </div>
      <div>
        <h3 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 17 : 19, lineHeight: 1.25, fontWeight: 900 }}>
          {card.title}
        </h3>
        <p style={{ margin: "7px 0 0", color: t.muted, fontSize: 13, lineHeight: 1.6 }}>
          {card.body}
        </p>
      </div>
      <ul style={{ margin: 0, padding: "0 0 0 17px", color: t.subtle, fontSize: 12, lineHeight: 1.8 }}>
        {card.points.map(point => <li key={point}>{point}</li>)}
      </ul>
    </article>
  )
}

function MetricCard({ metric, t }) {
  return (
    <article className="content-card metric-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: 16,
      boxShadow: "none",
      minWidth: 0,
      display: "grid",
      gap: 9,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ color: t.textStrong, fontSize: 25, fontWeight: 950, lineHeight: 1, fontFamily: FONT_MONO }}>
          {metric.value}
        </div>
        {metric.info && (
          <InfoPopover label="?" title={metric.title} body={metric.info} t={t} />
        )}
      </div>
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850, lineHeight: 1.35 }}>{metric.title}</div>
      <p style={{ margin: 0, color: t.muted, fontSize: 11.5, lineHeight: 1.6 }}>{metric.body}</p>
    </article>
  )
}

function ModuleCard({ module, t, isMobile, onNavigate, onOpenComparisonBuilder }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onNavigate(module.target)
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onNavigate(module.target)}
      onKeyDown={handleKeyDown}
      className="content-card clickable-card"
      style={{
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        boxShadow: t.shadowSm,
        padding: isMobile ? 17 : 19,
        minWidth: 0,
        cursor: "pointer",
        display: "grid",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0 }}>
            {module.kicker}
          </div>
          <h3 style={{ margin: "6px 0 0", color: t.textStrong, fontSize: isMobile ? 18 : 20, lineHeight: 1.25, fontWeight: 900 }}>
            {module.name}
          </h3>
        </div>
        <span aria-hidden="true" style={{ color: t.accentText, fontSize: 18, fontWeight: 900 }}>→</span>
      </div>
      <p style={{ margin: 0, color: t.muted, fontSize: 12.5, lineHeight: 1.65 }}>
        {module.positioning}
      </p>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
        <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0, marginBottom: 4 }}>
          Core function
        </div>
        <div style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.55, fontWeight: 720 }}>
          {module.functionText}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={{
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 34,
          padding: "8px 12px",
          borderRadius: 7,
          border: `1px solid ${t.accent}`,
          color: t.accentText,
          background: t.badgeInfoBg,
          fontSize: 11.5,
          fontWeight: 850,
          lineHeight: 1.2,
        }}>
          {module.buttonLabel}
        </span>
        {module.compareAction && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onOpenComparisonBuilder?.()
            }}
            style={{
              ...toolbarBtn(t),
              minHeight: 34,
              padding: "8px 11px",
              fontSize: 11.5,
              color: t.subtle,
              background: t.panel,
            }}
          >
            {module.compareAction}
          </button>
        )}
      </div>
    </article>
  )
}

function HowStep({ step, t, isMobile, isLast }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "auto minmax(0, 1fr) auto",
      gap: isMobile ? 10 : 14,
      alignItems: "center",
      minWidth: 0,
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        border: `1px solid ${t.accent}`,
        background: t.badgeInfoBg,
        color: t.accentText,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 950,
        fontFamily: FONT_MONO,
      }}>
        {step.number}
      </div>
      <div style={{ minWidth: 0 }}>
        <h3 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 16 : 18, lineHeight: 1.25, fontWeight: 900 }}>
          {step.title}
        </h3>
        <p style={{ margin: "5px 0 0", color: t.muted, fontSize: 12.5, lineHeight: 1.6 }}>
          {step.body}
        </p>
        {step.formula && (
          <div style={{ marginTop: 8, color: t.subtle, fontSize: 12, lineHeight: 1.5 }}>
            <InlineFormula math={step.formula} fallback={step.fallback} />
          </div>
        )}
      </div>
      {!isLast && (
        <div aria-hidden="true" style={{
          color: t.accentText,
          fontSize: isMobile ? 16 : 22,
          fontWeight: 900,
          justifySelf: isMobile ? "start" : "center",
          transform: isMobile ? "rotate(90deg)" : "none",
        }}>
          →
        </div>
      )}
    </div>
  )
}

function ValidationItem({ item, t }) {
  return (
    <article style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 9,
      padding: 14,
      minWidth: 0,
      display: "grid",
      gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <h3 style={{ margin: 0, color: t.textStrong, fontSize: 15, lineHeight: 1.3, fontWeight: 900 }}>
          {item.title}
        </h3>
        {item.info && <InfoPopover label="i" title={item.title} body={item.info} t={t} />}
      </div>
      <p style={{ margin: 0, color: t.muted, fontSize: 12.5, lineHeight: 1.6 }}>{item.body}</p>
      <ul style={{ margin: 0, padding: "0 0 0 16px", color: t.subtle, fontSize: 11.5, lineHeight: 1.75 }}>
        {item.points.map(point => <li key={point}>{point}</li>)}
      </ul>
    </article>
  )
}

function AudienceCard({ item, t }) {
  return (
    <article style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 9,
      padding: "14px 15px",
      minWidth: 0,
      display: "grid",
      gap: 6,
    }}>
      <div style={{ color: t.textStrong, fontSize: 13.5, lineHeight: 1.35, fontWeight: 900 }}>{item.role}</div>
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>{item.body}</div>
    </article>
  )
}

function RoadmapItem({ item, t, isLast }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto minmax(0, 1fr)",
      gap: 12,
      position: "relative",
      minWidth: 0,
    }}>
      <div style={{ display: "grid", justifyItems: "center", alignContent: "start", gap: 6 }}>
        <div style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          border: `1px solid ${item.active ? t.accent : t.borderStrong}`,
          background: item.active ? t.badgeInfoBg : t.panel,
          color: item.active ? t.accentText : t.subtle,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 950,
        }}>
          {item.index}
        </div>
        {!isLast && <div style={{ width: 1, height: 42, background: t.border }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 12, minWidth: 0 }}>
        <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900, lineHeight: 1.35 }}>{item.title}</div>
        <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.6, marginTop: 3 }}>{item.body}</div>
      </div>
    </div>
  )
}

export function HomeTab({ setActiveTab, onContactOpen, onOpenComparisonBuilder }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [dataMode, setDataMode] = useState("demo")
  const zh = lang === "zh"

  const go = (target) => setActiveTab?.(target)
  const openContact = () => {
    if (setActiveTab) setActiveTab("contact")
    else onContactOpen?.(true)
  }

  const pageGap = isMobile ? 34 : 52
  const sectionStyle = {
    background: "transparent",
    border: "none",
    borderRadius: 0,
  }
  const bluePanel = {
    background: t === undefined ? "#FFFFFF" : t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    boxShadow: t.shadowSm,
  }

  const reasons = useMemo(() => [
    {
      mark: "D",
      color: t.accentText,
      tint: t.badgeInfoBg,
      title: "Descriptor-aware screening",
      body: zh ? "先检查描述符是否足够，再解释排序结果。" : "Screening starts with descriptor coverage before ranking claims.",
      points: zh ? [
        "8 个核心描述符作为共享检查框架",
        "显式标注缺失、待整理和需复核字段",
        "候选评分不隐藏数据空白",
      ] : [
        "8 core descriptors as the shared check frame",
        "Missing, pending, and review fields stay visible",
        "Candidate scores do not hide data gaps",
      ],
    },
    {
      mark: "E",
      color: t.cyan || t.accentText,
      tint: t.surface,
      title: "Evidence-linked data",
      body: zh ? "结果、描述符和来源状态放在同一个阅读语境里。" : "Results, descriptors, and source status are read together.",
      points: zh ? [
        "保留 evidence level 与字段级来源",
        "区分 demo record 与 real-seed record",
        "支持跳转到 Data Quality & Provenance",
      ] : [
        "Evidence level and field provenance remain attached",
        "Demo records and real-seed records are separated",
        "Data Quality & Provenance is a first-class route",
      ],
    },
    {
      mark: "L",
      color: t.violet || t.accentText,
      tint: t.badgeCalcBg,
      title: "LCA-oriented thinking",
      body: zh ? "不是把 LCA 当作装饰指标，而是让可行性边界提前出现。" : "LCA is treated as an early feasibility lens, not decoration.",
      points: zh ? [
        "把稳定性、毒性关注和可持续性风险纳入早筛",
        "明确当前不是验证级 LCA/LCC 结论",
        "为后续实验与生命周期数据接入预留结构",
      ] : [
        "Stability, toxicity concern, and sustainability risk enter early screening",
        "Current outputs are not validated LCA/LCC conclusions",
        "The structure leaves room for experimental and lifecycle data",
      ],
    },
  ], [t, zh])

  const metrics = useMemo(() => [
    {
      value: "8",
      title: "Core descriptors",
      body: zh ? "比表面积、孔径、孔体积、CO2 吸附量、带隙、水稳定性、热稳定性、毒性关注。" : CORE_DESCRIPTOR_LABELS.join(", "),
      info: zh ? "这是透明度检查框架，不代表所有记录都已经完整或验证。" : "This is a transparency frame, not a claim that every record is complete or validated.",
    },
    {
      value: dataMode === "demo" ? "8/8" : "0/8",
      title: "Descriptor completeness",
      body: dataMode === "demo"
        ? (zh ? "演示数据用于展示完整流程；真实种子字段仍需要逐项复核。" : "Demo data shows the full workflow; real-seed fields still need curation.")
        : (zh ? "真实种子模式优先暴露待整理状态，不伪装成完整数据库。" : "Real-seed mode exposes pending curation instead of pretending to be complete."),
      info: zh ? "X/8 只表示当前模式下核心字段可读程度，不等同实验验证。" : "X/8 describes field readability in the selected mode; it is not experimental validation.",
    },
    {
      value: "6",
      title: "Evidence levels",
      body: zh ? "experimental、literature、simulation、ML-predicted、rule-based、needs-validation。" : "Experimental, literature, simulation, ML-predicted, rule-based, and needs-validation states.",
      info: zh ? "证据等级说明数据状态；High 或 experimental 仍需结合具体任务与条件解释。" : "Evidence level describes data state and must still be read with task and condition context.",
    },
    {
      value: "2",
      title: "Demo + seed separation",
      body: zh ? "演示数据与真实种子数据分离，避免把占位数据误读为科研结论。" : "Demo and real-seed data stay separated to avoid treating placeholders as conclusions.",
      info: zh ? "来源说明保留在 Data Mode、Field-level Provenance 和 Methodology 中。" : "Source boundaries remain visible through Data Mode, field provenance, and Methodology.",
    },
  ], [dataMode, zh])

  const modules = useMemo(() => [
    {
      name: "EcoScreen",
      kicker: "Candidate scoring",
      target: "ecoscreen",
      positioning: zh ? "面向早期环境可行性与候选优先级的筛选入口。" : "Screening entry for early environmental feasibility and candidate priority.",
      functionText: zh ? "用可解释权重、硬筛选边界和不确定性提示排序候选材料。" : "Rank candidates with explainable weights, hard-screen boundaries, and uncertainty signals.",
      buttonLabel: zh ? "Start Screening" : "Start Screening",
    },
    {
      name: "MOF Library",
      kicker: "Descriptors & provenance",
      target: "mofLibrary",
      positioning: zh ? "候选材料、字段状态、来源信息和对比器的主要入口。" : "Main entry for candidates, field status, provenance, and comparison.",
      functionText: zh ? "浏览 demo / real-seed 数据，检查 8 个描述符、证据等级和字段级来源。" : "Browse demo / real-seed data and inspect 8 descriptors, evidence level, and field sources.",
      buttonLabel: zh ? "Explore Library" : "Explore Library",
      compareAction: zh ? "Open builder" : "Open builder",
    },
    {
      name: "Performance Analysis",
      kicker: "Adsorption priority",
      target: "performance",
      positioning: zh ? "面向吸附与性能线索的候选材料分析页面。" : "Candidate analysis page for adsorption and performance cues.",
      functionText: zh ? "查看静态浏览器端模型、候选优先级、保存结果和基准样例。" : "Review the static browser model, candidate priorities, saved runs, and benchmark examples.",
      buttonLabel: zh ? "View Performance" : "View Performance",
    },
    {
      name: "Catalysis Lab",
      kicker: "Task-oriented records",
      target: "catalysis",
      positioning: zh ? "围绕 CO2 转化与有机酸路径的催化探索原型。" : "Catalysis prototype for CO2 conversion and organic-acid pathway exploration.",
      functionText: zh ? "使用 mock / demo records 做任务语境探索，不把候选结果写成已验证结论。" : "Use mock / demo records for task-context exploration without claiming validated performance.",
      buttonLabel: zh ? "Open Catalysis Lab" : "Open Catalysis Lab",
    },
    {
      name: "Methods & Limitations",
      kicker: "Methodology",
      target: "methodology",
      positioning: zh ? "评分、证据、验证状态、限制和引用边界的集中说明。" : "Central explanation for scoring, evidence, validation state, limits, and citation boundaries.",
      functionText: zh ? "阅读 CRITIC-MCDA、RSM 边界、Validation & Evidence 与 benchmark references。" : "Read CRITIC-MCDA, RSM boundaries, Validation & Evidence, and benchmark references.",
      buttonLabel: zh ? "Read Methodology" : "Read Methodology",
    },
  ], [zh])

  const howSteps = useMemo(() => [
    {
      number: "01",
      title: "Collect descriptors",
      body: zh ? "把结构、吸附、稳定性和风险字段整理成可追溯记录。" : "Structure, adsorption, stability, and risk fields are organized into traceable records.",
    },
    {
      number: "02",
      title: "Normalize and weight indicators",
      body: zh ? "对方向不同的指标做归一化，并用透明权重组合。" : "Indicators with different directions are normalized and combined through transparent weights.",
      formula: "S_i = \\sum_j w_j \\cdot \\tilde{x}_{ij}",
      fallback: "S_i = sum_j w_j * x_ij_normalized",
    },
    {
      number: "03",
      title: "Rank with uncertainty awareness",
      body: zh ? "排序结果同时显示证据等级、缺失字段和需要验证的下一步。" : "Ranking is shown with evidence level, missing fields, and next validation needs.",
    },
  ], [zh])

  const validationItems = useMemo(() => [
    {
      title: "Current status",
      body: zh ? "当前为研究原型与候选优先级工具，不是验证级预测引擎。" : "Current status is a research prototype and candidate-priority tool, not a validated prediction engine.",
      points: zh ? [
        "Demo records 用于展示流程",
        "Real-seed records 用于真实数据接入框架",
        "结果用于假设生成与早期筛选",
      ] : [
        "Demo records show the workflow",
        "Real-seed records define the ingestion frame",
        "Outputs support hypothesis generation and early screening",
      ],
      info: zh ? "该说明不是为了弱化产品，而是让研究边界可审计。" : "This boundary makes the research state auditable rather than vague.",
    },
    {
      title: "Checked fields",
      body: zh ? "首页保留核心字段检查：描述符完整性、来源状态、条件语境和风险提示。" : "The homepage preserves checks for descriptor completeness, source status, condition context, and risk flags.",
      points: zh ? [
        "8 core descriptors",
        "Field-level provenance",
        "Data Quality & Provenance deep link",
      ] : [
        "8 core descriptors",
        "Field-level provenance",
        "Data Quality & Provenance deep link",
      ],
    },
    {
      title: "Evidence levels",
      body: zh ? "证据等级是数据状态语言，不把规则推断、模拟和实验支持混为一谈。" : "Evidence level is a data-state language that separates rules, simulation, literature, and experiment.",
      points: zh ? [
        "rule-based 与 needs-validation 默认谨慎呈现",
        "ML-predicted 为保留类别，不冒充当前模型输出",
        "benchmark references 只提供解释语境",
      ] : [
        "rule-based and needs-validation stay cautious",
        "ML-predicted is a reserved category, not active model output",
        "benchmark references provide context, not superiority claims",
      ],
    },
    {
      title: "Next validation plan",
      body: zh ? "下一步是把公开来源、实验记录、条件字段和生命周期数据逐步接入验证工作流。" : "Next work connects public sources, experimental records, condition fields, and lifecycle data into validation-ready workflows.",
      points: zh ? [
        "补全字段来源与条件",
        "加入 replicate / benchmark checks",
        "形成可导出的验证摘要",
      ] : [
        "Complete field sources and conditions",
        "Add replicate and benchmark checks",
        "Produce exportable validation summaries",
      ],
    },
  ], [zh])

  const audiences = useMemo(() => [
    {
      role: "MOF researchers",
      body: zh ? "快速查看候选材料描述符、缺失字段和可疑边界。" : "Review descriptors, missing fields, and questionable boundaries quickly.",
    },
    {
      role: "LCA researchers",
      body: zh ? "把早期环境可行性信号放入材料筛选语境中。" : "Place early environmental feasibility signals inside the material-screening context.",
    },
    {
      role: "ML / informatics researchers",
      body: zh ? "观察透明规则、证据等级和数据整理结构如何影响排序。" : "Inspect how transparent rules, evidence levels, and curation structure affect ranking.",
    },
    {
      role: "Students / portfolio reviewers",
      body: zh ? "理解一个科研产品原型如何组织问题、数据、模型和限制。" : "Understand how a research product prototype organizes questions, data, models, and limits.",
    },
    {
      role: "Potential collaborators",
      body: zh ? "找到数据接入、验证、benchmark 和领域任务扩展的合作点。" : "Find collaboration points for data ingestion, validation, benchmarks, and domain tasks.",
    },
  ], [zh])

  const roadmap = useMemo(() => [
    {
      index: "1",
      active: true,
      title: "Demo screening",
      body: zh ? "稳定展示候选评分、模块入口和研究边界。" : "Stabilize candidate scoring, module entry points, and research boundaries.",
    },
    {
      index: "2",
      active: true,
      title: "Provenance layer",
      body: zh ? "继续完善字段级来源、条件、证据等级和 Data Mode 语义。" : "Improve field sources, conditions, evidence levels, and Data Mode semantics.",
    },
    {
      index: "3",
      active: false,
      title: "Catalysis records",
      body: zh ? "扩展任务导向催化记录，同时保留 mock / demo 边界。" : "Expand task-oriented catalysis records while keeping mock / demo boundaries explicit.",
    },
    {
      index: "4",
      active: false,
      title: "Validation-ready workflow",
      body: zh ? "接入 benchmark、replicate、导出摘要和人工复核流程。" : "Connect benchmarks, replicates, export summaries, and manual review workflow.",
    },
    {
      index: "5",
      active: false,
      title: "Future research workspace",
      body: zh ? "面向团队协作、私有数据接入和可复现实验记录。" : "Support team collaboration, private data ingestion, and reproducible experiment records.",
    },
  ], [zh])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: pageGap, overflow: "hidden" }}>
      <section id="overview" style={{ ...sectionStyle, paddingTop: isMobile ? 12 : 30 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.05fr) minmax(360px, 0.95fr)",
          gap: isMobile ? 18 : 28,
          alignItems: "center",
          minWidth: 0,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <BrandMark size={isMobile ? 48 : 58} radius={14} style={{ boxShadow: t.shadowSm }} />
              <div style={{ color: t.accentText, fontSize: 12, fontWeight: 900, letterSpacing: 0 }}>
                Research prototype · MOF screening
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
              A transparent decision-support platform for sustainable MOF screening
            </p>
            <p style={{
              margin: "13px 0 0",
              color: t.muted,
              fontSize: isMobile ? 14 : 16,
              lineHeight: 1.7,
              maxWidth: 760,
            }}>
              {zh
                ? "面向 MOF 候选材料筛选、数据溯源与早期环境可行性判断的交互式研究原型。"
                : "Interactive research prototype for MOF candidate screening, data provenance, and early environmental feasibility judgment."}
            </p>
            <div style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 22,
            }}>
              <ActionButton t={t} primary wide={isMobile} onClick={() => go("ecoscreen")}>
                Start Screening
              </ActionButton>
              <ActionButton t={t} wide={isMobile} onClick={() => go("mofLibrary")}>
                Explore MOF Library
              </ActionButton>
              <ActionButton t={t} wide={isMobile} onClick={() => go("methodology")}>
                View Methods & Evidence
              </ActionButton>
            </div>
          </div>
          <HeroVisualPanel t={t} lang={lang} isMobile={isMobile} />
        </div>
      </section>

      <section style={sectionStyle}>
        <SectionHeader
          eyebrow="Why EcoMOF-AI"
          title={zh ? "三个核心价值，而不是一组黑箱分数" : "Three reasons beyond a black-box score"}
          subtitle={zh ? "首页把筛选、数据证据和 LCA 思维按研究流程组织，避免让结果脱离来源和限制。" : "The homepage connects screening, evidence, and LCA-oriented reasoning so outputs are not detached from source and limits."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: 14,
        }}>
          {reasons.map(card => <ReasonCard key={card.title} card={card} t={t} isMobile={isMobile} />)}
        </div>
      </section>

      <section style={{
        ...bluePanel,
        padding: isMobile ? "18px 16px" : "24px",
        background: t.badgeInfoBg,
      }}>
        <SectionHeader
          eyebrow="Metrics / Trust Indicators"
          title={zh ? "透明度指标，不是商业夸张指标" : "Transparency indicators, not marketing claims"}
          subtitle={zh ? "这些数字说明原型如何暴露描述符、证据状态和数据模式，而不是承诺科研结论已经完成。" : "These numbers explain how the prototype exposes descriptors, evidence state, and data mode rather than claiming completed scientific validation."}
          t={t}
          isMobile={isMobile}
          action={
            <div style={{ display: "grid", gap: 7, justifyItems: isMobile ? "stretch" : "end", width: isMobile ? "100%" : "auto" }}>
              <DataModeToggle value={dataMode} onChange={setDataMode} lang={lang} />
              <button
                type="button"
                onClick={() => go("data-quality-provenance")}
                style={{
                  ...toolbarBtn(t),
                  minHeight: 32,
                  padding: "7px 10px",
                  fontSize: 11,
                  justifyContent: "center",
                  color: t.accentText,
                  background: t.panel,
                }}
              >
                {zh ? "查看 Data Quality & Provenance" : "View Data Quality & Provenance"}
              </button>
            </div>
          }
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}>
          {metrics.map(metric => <MetricCard key={metric.title} metric={metric} t={t} />)}
        </div>
        <div style={{ marginTop: 12, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, padding: "10px 12px" }}>
          <DataModeNote lang={lang} />
        </div>
      </section>

      <section style={sectionStyle}>
        <SectionHeader
          eyebrow="Platform Modules"
          title={zh ? "从首页进入完整研究工作台" : "Enter the research workspace from the homepage"}
          subtitle={zh ? "模块卡片统一呈现定位、核心功能和入口，保留现有 EcoScreen、Library、Performance、Catalysis 与 Methodology 路由。" : "Module cards present positioning, core function, and entry points while preserving existing EcoScreen, Library, Performance, Catalysis, and Methodology routes."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(5, minmax(0, 1fr))",
          gap: 13,
        }}>
          {modules.map(module => (
            <ModuleCard
              key={module.name}
              module={module}
              t={t}
              isMobile={isMobile}
              onNavigate={go}
              onOpenComparisonBuilder={onOpenComparisonBuilder}
            />
          ))}
        </div>
      </section>

      <section style={{ ...bluePanel, padding: isMobile ? "18px 16px" : "24px" }}>
        <SectionHeader
          eyebrow="How It Works"
          title={zh ? "三步把数据状态转成可质疑的排序" : "A three-step path from data state to questionable ranking"}
          subtitle={zh ? "流程图强调描述符整理、指标归一化和不确定性呈现；公式用 KaTeX 渲染，避免不可读符号。" : "The flow emphasizes descriptor collection, normalization, and uncertainty-aware ranking. Formula rendering uses KaTeX."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: isMobile ? 18 : 14,
          alignItems: "stretch",
        }}>
          {howSteps.map((step, index) => (
            <HowStep
              key={step.number}
              step={step}
              t={t}
              isMobile={isMobile}
              isLast={index === howSteps.length - 1}
            />
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <SectionHeader
          eyebrow="Validation & Evidence"
          title={zh ? "把可信度做成研究面板，而不是免责声明" : "Research credibility panel, not a generic disclaimer"}
          subtitle={zh ? "保留当前验证状态、检查字段、证据等级和下一步验证计划，让读者能质疑每个结果。" : "Current validation status, checked fields, evidence levels, and next validation plans remain visible so every result can be questioned."}
          t={t}
          isMobile={isMobile}
          action={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
              <ActionButton t={t} wide={isMobile} onClick={() => go("validation-evidence")}>
                {zh ? "打开 Validation & Evidence" : "Open Validation & Evidence"}
              </ActionButton>
              <ActionButton t={t} wide={isMobile} onClick={() => go("benchmark-references")}>
                {zh ? "查看 Benchmark References" : "View Benchmark References"}
              </ActionButton>
            </div>
          }
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}>
          {validationItems.map(item => <ValidationItem key={item.title} item={item} t={t} />)}
        </div>
      </section>

      <section style={sectionStyle}>
        <SectionHeader
          eyebrow="Audience"
          title={zh ? "面向不同用户的同一套透明语言" : "One transparent language for different users"}
          subtitle={zh ? "首页保留原有用户类型，并把每类用户能获得的价值压缩成一句话。" : "The homepage keeps the existing audience types and compresses each value proposition into one sentence."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(5, minmax(0, 1fr))",
          gap: 11,
        }}>
          {audiences.map(item => <AudienceCard key={item.role} item={item} t={t} />)}
        </div>
      </section>

      <section style={{ ...bluePanel, padding: isMobile ? "18px 16px" : "24px" }}>
        <SectionHeader
          eyebrow="Development Roadmap"
          title={zh ? "从演示筛选走向可验证研究工作流" : "From demo screening to validation-ready research workflow"}
          subtitle={zh ? "路线图保持简洁，说明当前完成的层、正在打磨的层和未来需要真实数据支撑的层。" : "A concise roadmap separates the current layer, the provenance work in progress, and future layers that need real validation data."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(5, minmax(0, 1fr))",
          gap: isNarrow ? 10 : 14,
        }}>
          {roadmap.map((item, index) => (
            <RoadmapItem key={item.title} item={item} t={t} isLast={index === roadmap.length - 1} />
          ))}
        </div>
      </section>

      <section style={{
        ...bluePanel,
        padding: isMobile ? "22px 18px" : "30px 34px",
        display: "grid",
        gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) auto",
        gap: 18,
        alignItems: "center",
        marginBottom: isMobile ? 4 : 10,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: t.accentText, fontSize: 11, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0, marginBottom: 8 }}>
            Contact / Collaboration
          </div>
          <h2 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 24 : 32, lineHeight: 1.15, fontWeight: 950, letterSpacing: 0 }}>
            Explore, evaluate, and question every result.
          </h2>
          <p style={{ margin: "9px 0 0", color: t.muted, fontSize: 13.5, lineHeight: 1.65, maxWidth: 760 }}>
            {zh
              ? "如果你希望接入催化数据、完善 MOF 描述符、讨论 LCA 评价或共同验证候选材料，可以从这里进入方法说明或联系合作。"
              : "Use EcoMOF-AI to inspect data, question ranking assumptions, and discuss collaboration around descriptors, catalysis records, LCA evaluation, or validation."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: isNarrow ? "flex-start" : "flex-end" }}>
          <ActionButton t={t} primary wide={isMobile} onClick={() => go("ecoscreen")}>
            Open EcoScreen
          </ActionButton>
          <ActionButton t={t} wide={isMobile} onClick={() => go("methodology")}>
            Read Methodology
          </ActionButton>
          <ActionButton t={t} wide={isMobile} onClick={openContact}>
            Contact / Collaborate
          </ActionButton>
        </div>
      </section>
    </div>
  )
}
