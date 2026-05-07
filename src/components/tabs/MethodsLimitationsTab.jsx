import { useCallback, useEffect, useState } from "react"
import {
  useT, useLang, useViewport,
  FONT_MONO,
  BasisBadge, SectionTitle, Callout, PageHeader, CopyLinkButton, DisclaimerLink, getReferences, getScoringWeights, getEvidenceLevels,
} from "../../shared"

const PROJECT_CITATION_EN = "Linus-He. EcoMOF-AI: An early-stage research prototype for MOF candidate screening, sustainability evaluation, catalysis-oriented exploration, and field-level data provenance. GitHub Pages, 2026. Available at: https://linus-he.github.io/ecomof-ai/"
const PROJECT_CITATION_ZH = "Linus-He. EcoMOF-AI：面向 MOF 候选筛选、可持续性评价、催化任务探索和字段级数据溯源的早期科研原型. GitHub Pages, 2026. https://linus-he.github.io/ecomof-ai/"
const PROJECT_BIBTEX = `@misc{linushe2026ecomofai,
  author = {{Linus-He}},
  title = {EcoMOF-AI: An Early-Stage Research Prototype for MOF Candidate Screening, Sustainability Evaluation, Catalysis-Oriented Exploration, and Field-Level Data Provenance},
  year = {2026},
  url = {https://linus-he.github.io/ecomof-ai/},
  note = {Early-stage research prototype}
}`

function FormulaLine({ children }) {
  return (
    <div style={{ whiteSpace: "nowrap" }}>
      {children}
    </div>
  )
}

function FormulaStrip({ formula, t }) {
  return (
    <div style={{
      padding: "10px 12px",
      overflowX: "auto",
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 6,
      color: t.accentText,
      fontFamily: FONT_MONO,
      fontSize: 12,
      lineHeight: 1.6,
      scrollbarWidth: "thin",
    }}>
      {formula}
    </div>
  )
}

function FormulaDetails({ title, formula, variables, interpretation, limitation, t, zh, defaultOpen = false }) {
  return (
    <details open={defaultOpen} style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: 12,
    }}>
      <summary style={{
        cursor: "pointer",
        color: t.textStrong,
        fontSize: 12,
        fontWeight: 850,
        listStylePosition: "outside",
      }}>
        <span style={{ marginLeft: 4 }}>{title}</span>
      </summary>
      <div style={{ marginTop: 10 }}>
        <FormulaStrip formula={formula} t={t} />
      </div>
      <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
        <div>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
            {zh ? "变量说明" : "Variables"}
          </div>
          <div style={{ display: "grid", gap: 4, marginTop: 5 }}>
            {variables.map(([symbol, desc]) => (
              <div key={symbol} style={{ color: t.muted, fontSize: 11, lineHeight: 1.5 }}>
                <span style={{ color: t.textStrong, fontFamily: FONT_MONO }}>{symbol}</span>: {desc}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
            {zh ? "公式含义" : "Interpretation"}
          </div>
          <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.6, marginTop: 4 }}>{interpretation}</div>
        </div>
        <div style={{ borderTop: `1px solid ${t.divider}`, paddingTop: 8 }}>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
            {zh ? "使用限制" : "Limitation"}
          </div>
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.6, marginTop: 4 }}>{limitation}</div>
        </div>
      </div>
    </details>
  )
}

function CompactCard({ title, body, tone = "info", t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
      <BasisBadge tone={tone}>{title}</BasisBadge>
      <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.65, marginTop: 9 }}>{body}</div>
    </div>
  )
}

function MethodSection({ id, title, body, children, t }) {
  return (
    <section id={id} className="content-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: 18,
      scrollMarginTop: 120,
    }}>
      <SectionTitle>{title}</SectionTitle>
      {body && <p style={{ color: t.subtle, fontSize: 12, lineHeight: 1.55, margin: "6px 0 0", maxWidth: 880 }}>{body}</p>}
      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  )
}

function ChipList({ items, t }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map(item => (
        <span key={item} style={{ color: t.muted, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, padding: "5px 8px", fontSize: 10.5, fontWeight: 780, lineHeight: 1.2 }}>
          {item}
        </span>
      ))}
    </div>
  )
}

function ScoreComponentCard({ marker, title, body, tags, t }) {
  return (
    <article className="content-card" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 13, minHeight: 148 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
        <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", background: t.badgeInfoBg, color: t.accentText, fontSize: 13, fontWeight: 900 }}>
          {marker}
        </span>
        <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 880 }}>{title}</div>
      </div>
      <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.6, marginBottom: 10 }}>{body}</div>
      <ChipList items={tags} t={t} />
    </article>
  )
}

function DescriptorGrid({ zh, t }) {
  const descriptors = zh
    ? ["比表面积", "孔径", "孔体积", "CO₂ 吸附量", "带隙", "水稳定性", "热稳定性", "毒性关注"]
    : ["surfaceArea", "poreSizeA", "poreVolume", "co2Uptake", "bandGap", "waterStability", "thermalStability", "toxicityConcern"]
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <div style={{ color: t.textStrong, fontSize: 11, fontWeight: 850 }}>{zh ? "核心 8 项描述符集合" : "Core 8 descriptor set"}</div>
        <span style={{ color: t.faint, fontSize: 10 }}>{zh ? "字段集合，不代表某个 MOF 的状态" : "field set, not a MOF-specific status"}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
        {descriptors.map((item, index) => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 7, color: t.muted, background: index % 2 ? t.surface : t.badgeCalcBg, border: `1px solid ${t.border}`, borderRadius: 7, padding: "7px 8px", fontSize: 10.5, fontWeight: 760 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: t.accentText, flexShrink: 0 }} />
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

function WorkflowPipeline({ steps, isMobile, t }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${steps.length}, minmax(0, 1fr))`, gap: 8 }}>
      {steps.map((step, index) => (
        <div key={step.title} style={{ position: "relative", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: 11, minHeight: 96 }}>
          <div style={{ color: t.accentText, fontSize: 11, fontWeight: 900, fontFamily: FONT_MONO }}>{String(index + 1).padStart(2, "0")}</div>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, lineHeight: 1.35, marginTop: 8 }}>{step.title}</div>
          <div style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.45, marginTop: 5 }}>{step.note}</div>
          {!isMobile && index < steps.length - 1 && <span aria-hidden="true" style={{ position: "absolute", right: -9, top: "50%", transform: "translateY(-50%)", color: t.faint, fontSize: 14, zIndex: 2 }}>→</span>}
        </div>
      ))}
    </div>
  )
}

function EvidenceLadder({ levels, zh, t }) {
  return (
    <div style={{ display: "grid", gap: 7, position: "relative" }}>
      {levels.map((item, index) => (
        <div key={item.level} style={{
          display: "grid",
          gridTemplateColumns: "84px minmax(0, 1fr)",
          gap: 10,
          alignItems: "stretch",
          marginLeft: `${index * 16}px`,
          width: `calc(100% - ${index * 16}px)`,
        }}>
          <div style={{ background: index === 0 ? t.badgeInfoBg : index === 1 ? t.badgeCalcBg : index === 2 ? t.badgeProxyBg : t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, color: index === 0 ? t.accentText : index === 1 ? t.badgeCalcText : index === 2 ? t.warn : t.faint, fontSize: 12, fontWeight: 900, textAlign: "center", boxShadow: index === 0 ? `0 8px 20px ${t.shadow}` : "none" }}>
            {item.level}
          </div>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{item.title}</div>
            <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>{item.body}</div>
          </div>
        </div>
      ))}
      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 2 }}>
        {zh ? "高证据等级不等于最终实验验证完成。" : "High evidence does not mean final experimental validation."}
      </div>
    </div>
  )
}

function EvidenceCompletenessQuadrant({ zh, t }) {
  const quadrants = zh
    ? [
      ["证据较强，字段待补充", "left-top"],
      ["优先复核候选", "right-top"],
      ["暂不适合比较", "left-bottom"],
      ["字段较全，但证据不足", "right-bottom"],
    ]
    : [
      ["Evidence strong, fields missing", "left-top"],
      ["Strong review candidate", "right-top"],
      ["Not ready for comparison", "left-bottom"],
      ["Complete but uncertain", "right-bottom"],
    ]
  const points = zh
    ? [["示例 A", 34, 72], ["示例 B", 68, 58], ["示例 C", 52, 32]]
    : [["Example A", 34, 72], ["Example B", 68, 58], ["Example C", 52, 32]]
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{
        position: "relative",
        height: 300,
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        padding: "28px 28px 34px 42px",
        overflow: "hidden",
      }}>
        <div aria-hidden="true" style={{ position: "absolute", left: 42, right: 28, top: 28, bottom: 34, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" }}>
          {quadrants.map(([label, key], index) => (
            <div key={key} style={{
              borderRight: index % 2 === 0 ? `1px solid ${t.border}` : "none",
              borderBottom: index < 2 ? `1px solid ${t.border}` : "none",
              background: index === 1 ? t.badgeInfoBg : index === 0 ? t.badgeCalcBg : index === 3 ? t.badgeProxyBg : t.surface,
              opacity: 0.86,
              padding: 10,
              display: "flex",
              alignItems: index < 2 ? "flex-start" : "flex-end",
              justifyContent: index % 2 === 0 ? "flex-start" : "flex-end",
              textAlign: index % 2 === 0 ? "left" : "right",
              color: index === 1 ? t.accentText : t.muted,
              fontSize: 10.5,
              fontWeight: 820,
              lineHeight: 1.35,
            }}>
              {label}
            </div>
          ))}
        </div>
        <div aria-hidden="true" style={{ position: "absolute", left: 42, right: 28, bottom: 34, height: 1, background: t.textStrong }} />
        <div aria-hidden="true" style={{ position: "absolute", left: 42, top: 28, bottom: 34, width: 1, background: t.textStrong }} />
        <div style={{ position: "absolute", left: 42, right: 28, top: 28, bottom: 34 }}>
          {points.map(([label, x, y]) => (
            <div key={label} style={{
              position: "absolute",
              left: `${x}%`,
              bottom: `${y}%`,
              transform: "translate(-50%, 50%)",
              display: "grid",
              justifyItems: "center",
              gap: 3,
            }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: t.accentText, border: `2px solid ${t.surface}`, boxShadow: `0 0 0 1px ${t.border}` }} />
              <span style={{ color: t.faint, fontSize: 9.5, fontWeight: 800, whiteSpace: "nowrap" }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 42, right: 28, bottom: 8, display: "flex", justifyContent: "space-between", color: t.faint, fontSize: 10, fontWeight: 800 }}>
          <span>{zh ? "低" : "Low"}</span>
          <span>{zh ? "数据完整性" : "Data Completeness"}</span>
          <span>{zh ? "高" : "High"}</span>
        </div>
        <div style={{ position: "absolute", left: 8, top: 28, bottom: 34, display: "flex", flexDirection: "column", justifyContent: "space-between", color: t.faint, fontSize: 10, fontWeight: 800, writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
          <span>{zh ? "低" : "Low"}</span>
          <span>{zh ? "证据可信度" : "Evidence Confidence"}</span>
          <span>{zh ? "高" : "High"}</span>
        </div>
      </div>
      <div style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.45 }}>
        {zh ? "示例点仅说明坐标结构，不代表真实候选材料。" : "Example points illustrate chart structure only and do not represent real candidates."}
      </div>
    </div>
  )
}

function ScoreComponentBarChart({ zh, t }) {
  const slots = zh
    ? ["性能信号", "可持续性信号", "数据完整性", "证据可信度", "不确定性惩罚"]
    : ["Performance Signal", "Sustainability Signal", "Data Completeness", "Evidence Confidence", "Uncertainty Penalty"]
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
      <div style={{ display: "grid", gap: 9 }}>
        {slots.map((label, index) => (
          <div key={label} style={{ display: "grid", gridTemplateColumns: "minmax(130px, 180px) minmax(0, 1fr) 42px", gap: 9, alignItems: "center" }}>
            <div style={{ color: index === 4 ? t.warn : t.muted, fontSize: 11, fontWeight: 820 }}>{label}</div>
            <div style={{ position: "relative", height: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(90deg, transparent 0, transparent calc(20% - 1px), rgba(127,127,127,0.22) calc(20% - 1px), rgba(127,127,127,0.22) 20%)" }} />
              <div style={{ width: "100%", height: "100%", background: index === 4 ? t.badgeWarnBg : t.badgeInfoBg, borderRadius: 999 }} />
            </div>
            <div style={{ color: t.faint, fontSize: 10.5, fontFamily: FONT_MONO, textAlign: "right" }}>
              {index === 4 ? "w₅" : `w${index + 1}`}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", color: t.faint, fontSize: 10, fontWeight: 800, marginTop: 8 }}>
        <span>{zh ? "概念结构" : "Conceptual"}</span>
        <span>{zh ? "无百分比" : "no percentages"}</span>
      </div>
    </div>
  )
}

function PriorityInterpretationCurve({ zh, t }) {
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
      <svg viewBox="0 0 360 220" role="img" aria-label={zh ? "优先级解释概念曲线" : "Priority interpretation conceptual curve"} style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1="44" y1="174" x2="326" y2="174" stroke={t.textStrong} strokeWidth="1.4" />
        <line x1="44" y1="174" x2="44" y2="28" stroke={t.textStrong} strokeWidth="1.4" />
        {[0, 1, 2, 3, 4].map(i => (
          <g key={i}>
            <line x1={44 + i * 70.5} y1="170" x2={44 + i * 70.5} y2="178" stroke={t.border} />
            <line x1="40" y1={174 - i * 36.5} x2="48" y2={174 - i * 36.5} stroke={t.border} />
          </g>
        ))}
        <path d="M46 166 C96 154, 116 132, 152 116 S222 78, 326 50" fill="none" stroke={t.accentText} strokeWidth="4" strokeLinecap="round" />
        <path d="M46 166 C96 154, 116 132, 152 116 S222 78, 326 50 L326 174 L46 174 Z" fill={t.badgeInfoBg} opacity="0.55" />
        <circle cx="92" cy="151" r="4" fill={t.accentText} />
        <circle cx="176" cy="106" r="4" fill={t.accentText} />
        <circle cx="278" cy="64" r="4" fill={t.accentText} />
        <text x="184" y="211" textAnchor="middle" fill={t.faint} fontSize="11" fontWeight="700">{zh ? "数据准备度" : "Data readiness"}</text>
        <text x="15" y="104" textAnchor="middle" fill={t.faint} fontSize="11" fontWeight="700" transform="rotate(-90 15 104)">{zh ? "解释可信度" : "Interpretation confidence"}</text>
        <text x="47" y="195" fill={t.faint} fontSize="10">{zh ? "低" : "Low"}</text>
        <text x="305" y="195" fill={t.faint} fontSize="10">{zh ? "高" : "High"}</text>
        <text x="214" y="40" fill={t.accentText} fontSize="11" fontWeight="800">{zh ? "概念曲线" : "Conceptual curve"}</text>
      </svg>
      <div style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.45, marginTop: 6 }}>
        {zh ? "数据准备度提升会增强优先级解释的可信度，但不代表已验证材料性能。" : "Higher data readiness strengthens priority interpretation confidence, but does not indicate validated material performance."}
      </div>
    </div>
  )
}

function WeightBars({ weights, zh, t }) {
  const groups = weights && typeof weights === "object"
    ? Object.entries(weights).filter(([key, value]) => value && typeof value === "object" && !Array.isArray(value) && key !== "notes")
    : []
  const labelMap = zh ? {
    performance: "性能", stability: "稳定性", sustainability: "可持续性", cost: "成本", evidenceConfidence: "证据可信度",
    co2Uptake: "CO₂ 吸附量", selectivity: "选择性", thermodynamicIndicator: "热力学指标",
    co2Affinity: "CO₂ 亲和力", activeSite: "活性位点", poreAccessibility: "孔道可及性", electronicProperty: "电子性质",
  } : {}

  if (!groups.length) {
    return (
      <div style={{ color: t.muted, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, fontSize: 11, lineHeight: 1.6 }}>
        {zh ? "未读取到权重配置；此处仅展示概念权重结构 w₁–w₅。" : "No weight configuration was loaded; this view shows conceptual weights w₁–w₅ only."}
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {groups.map(([groupName, values]) => {
        const entries = Object.entries(values).filter(([, value]) => typeof value === "number")
        const max = Math.max(...entries.map(([, value]) => value), 0.01)
        return (
          <article key={groupName} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 880, marginBottom: 9 }}>{groupName}</div>
            <div style={{ display: "grid", gap: 7 }}>
              {entries.map(([key, value]) => (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 150px) minmax(0, 1fr) 44px", gap: 8, alignItems: "center" }}>
                  <div style={{ color: t.muted, fontSize: 10.5, fontWeight: 760 }}>{labelMap[key] || key}</div>
                  <div style={{ height: 8, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${Math.max(8, (value / max) * 100)}%`, height: "100%", background: t.accentText, borderRadius: 999 }} />
                  </div>
                  <div style={{ color: t.faint, fontSize: 10.5, fontFamily: FONT_MONO, textAlign: "right" }}>{value}</div>
                </div>
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function UseBoundaryMatrix({ suggestedUse, zh, t, isMobile }) {
  const columns = [
    [zh ? "适合用途" : "Appropriate use", suggestedUse.appropriate, "info", "✓"],
    [zh ? "不适合用于" : "Not appropriate for", suggestedUse.notFor, "warn", "×"],
  ]
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
      {columns.map(([title, items, tone, marker]) => (
        <article key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 13 }}>
          <BasisBadge tone={tone}>{title}</BasisBadge>
          <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
            {items.map(item => (
              <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
                <span style={{ color: tone === "info" ? t.accentText : t.warn, fontWeight: 900, flexShrink: 0 }}>{marker}</span>
                {item}
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

function DashboardPanel({ id, title, kicker, children, t }) {
  return (
    <section id={id} style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: 14,
      scrollMarginTop: 120,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", flexWrap: "wrap", marginBottom: 12 }}>
        <h3 style={{ color: t.textStrong, fontSize: 14, fontWeight: 900, margin: 0 }}>{title}</h3>
        {kicker && <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0 }}>{kicker}</span>}
      </div>
      {children}
    </section>
  )
}

function SummaryCard({ title, value, badge, children, t, action }) {
  return (
    <article style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: 12,
      display: "grid",
      gap: 9,
      minHeight: 0,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
        <div>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0 }}>{title}</div>
          <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 920, lineHeight: 1.15, marginTop: 5 }}>{value}</div>
        </div>
        {badge && <BasisBadge tone="info">{badge}</BasisBadge>}
      </div>
      {children}
      {action && <div>{action}</div>}
    </article>
  )
}

function FormulaTerm({ symbol, label, tone = "info", t }) {
  const toneStyles = {
    info: [t.badgeInfoBg, t.accentText],
    calc: [t.badgeCalcBg, t.badgeCalcText],
    proxy: [t.badgeProxyBg, t.badgeProxyText],
    warn: [t.badgeWarnBg, t.warn],
  }
  const [background, color] = toneStyles[tone] || toneStyles.info
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background,
      color,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: "7px 9px",
      fontSize: 12,
      fontWeight: 850,
      lineHeight: 1.25,
    }}>
      <span style={{ fontFamily: FONT_MONO }}>{symbol}</span>
      {label}
    </span>
  )
}

function MiniDescriptorGrid({ zh, t }) {
  const descriptors = zh
    ? ["比表面积", "孔径", "孔体积", "CO₂", "带隙", "水稳", "热稳", "毒性"]
    : ["surface", "pore A", "pore V", "CO₂", "band gap", "water", "thermal", "toxicity"]
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 5 }}>
      {descriptors.map(item => (
        <span key={item} style={{ color: t.muted, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, padding: "6px 5px", fontSize: 9.5, fontWeight: 780, textAlign: "center", minWidth: 0 }}>
          {item}
        </span>
      ))}
    </div>
  )
}

function MiniEvidenceSegments({ zh, t }) {
  const segments = zh ? ["高", "中", "低", "待补充"] : ["High", "Medium", "Low", "Pending"]
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 5 }}>
      {segments.map((item, index) => (
        <span key={item} style={{
          background: index === 0 ? t.badgeInfoBg : index === 1 ? t.badgeCalcBg : index === 2 ? t.badgeProxyBg : t.panel,
          color: index === 0 ? t.accentText : index === 1 ? t.badgeCalcText : index === 2 ? t.badgeProxyText : t.faint,
          border: `1px solid ${t.border}`,
          borderRadius: 6,
          padding: "7px 4px",
          textAlign: "center",
          fontSize: 10,
          fontWeight: 850,
        }}>
          {item}
        </span>
      ))}
    </div>
  )
}

function MiniPipeline({ steps, t }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5 }}>
      {steps.map((step, index) => (
        <span key={`${step}-${index}`} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ color: t.muted, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, padding: "5px 7px", fontSize: 10, fontWeight: 820 }}>
            {step}
          </span>
          {index < steps.length - 1 && <span style={{ color: t.faint, fontSize: 11 }}>→</span>}
        </span>
      ))}
    </div>
  )
}

function ScoreCompositionGraph({ zh, isMobile, t }) {
  const terms = zh
    ? [["性能信号", "+"], ["可持续性信号", "+"], ["数据完整性", "+"], ["证据可信度", "−"], ["不确定性惩罚", ""]]
    : [["Performance Signal", "+"], ["Sustainability Signal", "+"], ["Data Completeness", "+"], ["Evidence Confidence", "−"], ["Uncertainty Penalty", ""]]
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))",
        gap: 8,
        alignItems: "center",
      }}>
        {terms.map(([label, connector], index) => (
          <div key={label} style={{ position: "relative" }}>
            <div style={{
              background: index === 4 ? t.badgeWarnBg : t.panel,
              border: `1px solid ${t.border}`,
              borderRadius: 9,
              padding: "11px 9px",
              minHeight: 58,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: index === 4 ? t.warn : t.textStrong,
              fontSize: 11.5,
              fontWeight: 880,
              lineHeight: 1.35,
              textAlign: "center",
            }}>
              {label}
            </div>
            {connector && !isMobile && <span style={{ position: "absolute", right: -14, top: "50%", transform: "translateY(-50%)", color: t.faint, fontSize: 15, fontWeight: 900, zIndex: 2 }}>{connector}</span>}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", justifyItems: "center", gap: 8 }}>
        <span style={{ color: t.faint, fontSize: 16 }}>↓</span>
        <div style={{ background: t.badgeInfoBg, color: t.accentText, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 920, textAlign: "center", minWidth: isMobile ? "100%" : 260 }}>
          {zh ? "候选优先级总分" : "Total Priority Score"}
        </div>
      </div>
    </div>
  )
}

export function MethodsLimitationsTab({ onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const zh = lang === "zh"
  const [references, setReferences] = useState([])
  const [referencesStatus, setReferencesStatus] = useState("loading")
  const [evidenceReady, setEvidenceReady] = useState(false)
  const [scoringWeights, setScoringWeights] = useState(null)
  const [weightsStatus, setWeightsStatus] = useState("loading")
  const [evidenceLevels, setEvidenceLevels] = useState([])

  useEffect(() => {
    let active = true
    setReferencesStatus("loading")
    getReferences({ throwOnError: true })
      .then(data => {
        if (!active) return
        const next = Array.isArray(data) ? data : []
        setReferences(next)
        setReferencesStatus(next.length ? "loaded" : "empty")
      })
      .catch((error) => {
        console.warn("References data load failed.", error)
        if (active) { setReferences([]); setReferencesStatus("error") }
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    setWeightsStatus("loading")
    Promise.all([
      getScoringWeights({ throwOnError: true }).catch(error => {
        console.warn("Scoring weights load failed.", error)
        return null
      }),
      getEvidenceLevels({ throwOnError: true }).catch(error => {
        console.warn("Evidence levels load failed.", error)
        return []
      }),
    ]).then(([weights, levels]) => {
      if (!active) return
      setScoringWeights(weights && typeof weights === "object" ? weights : null)
      setWeightsStatus(weights && typeof weights === "object" ? "loaded" : "fallback")
      setEvidenceLevels(Array.isArray(levels) ? levels : [])
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    setEvidenceReady(false)
    let timer = null
    const frame = window.requestAnimationFrame(() => {
      timer = window.setTimeout(() => setEvidenceReady(true), 80)
    })
    return () => {
      window.cancelAnimationFrame(frame)
      if (timer) window.clearTimeout(timer)
    }
  }, [lang])

  const handleViewDataQuality = useCallback(() => {
    if (onNavigate) {
      onNavigate("data-quality-provenance")
      let attempts = 0
      const tryScroll = () => {
        const el = document.getElementById("data-quality-provenance")
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" })
        } else if (attempts < 12) {
          attempts++
          setTimeout(tryScroll, 100)
        }
      }
      setTimeout(tryScroll, 150)
    }
  }, [onNavigate])

  const toc = zh
    ? [
      ["method-score-overview", "方法评分总览"],
      ["method-formulas", "总分公式"],
      ["score-components", "子分数构成"],
      ["scoring-axes", "评分坐标图"],
      ["method-workflow", "数据与证据工作流"],
      ["evidence-level-ladder", "证据等级阶梯"],
      ["weight-configuration", "权重配置"],
      ["method-data", "数据边界"],
      ["method-limitations", "使用边界"],
      ["method-references", "参考与引用"],
      ["method-disclaimer-center", "声明中心"],
    ]
    : [
      ["method-score-overview", "Method Score Overview"],
      ["method-formulas", "Total Score Formula"],
      ["score-components", "Score Components"],
      ["scoring-axes", "Scoring Axes"],
      ["method-workflow", "Data & Evidence Workflow"],
      ["evidence-level-ladder", "Evidence Level Ladder"],
      ["weight-configuration", "Weight Configuration"],
      ["method-data", "Data Boundaries"],
      ["method-limitations", "Use Boundaries"],
      ["method-references", "References & Citation"],
      ["method-disclaimer-center", "Disclaimer Center"],
    ]

  const dataCards = zh
    ? [
      ["演示数据集", "用于展示工作流和交互逻辑，不应被当作真实科研结论。", "proxy"],
      ["真实种子数据集", "真实种子数据集是公开数据库和文献记录的接入框架；当前不是完整 MOF 数据库。", "info"],
      ["催化数据模板", "用于统一记录催化剂、反应条件、产物指标和证据来源，方便后续对比与复核。", "warn"],
      ["后续数据接入", "真实建模需要结构化实验或文献数据，包括条件、标签、来源和限制。", "info"],
    ]
    : [
      ["Demo Dataset", "Used for workflow demonstration and interaction testing, not as final scientific evidence.", "proxy"],
      ["Real Seed Dataset", "Provides a framework for curated public database and literature records. It is not a complete MOF database.", "info"],
      ["Catalysis Data Template", "Organizes catalyst identity, reaction conditions, product metrics, and evidence sources for later comparison and review.", "warn"],
      ["Future Data Ingestion", "Real modeling requires structured experimental or literature data with conditions, labels, sources, and limitations.", "info"],
    ]

  const scoreCards = zh
    ? [
      ["规则评分模型", "当前模型把描述符、任务适配、证据置信度和权重组合成候选优先级。", "info"],
      ["Eco Score", "用于可持续性优先级比较，不替代完整工业 LCA。", "proxy"],
      ["Performance Score", "用于吸附相关候选排序，不替代严格 GCMC 或 IAST。", "proxy"],
      ["催化潜力评分", "用于催化潜力筛选，不声称准确预测转化率、选择性或 TOF。", "warn"],
      ["分数拆解", "展示单个候选的维度分数组成。", "info"],
      ["权重贡献", "解释权重和归一化描述符如何影响分数。", "info"],
      ["敏感性分析", "检查关键权重变化后候选排序是否稳定。", "info"],
    ]
    : [
      ["Rule-assisted Scoring Model", "Combines descriptors, task fit, evidence confidence, and weights into candidate priority.", "info"],
      ["Eco Score", "Supports sustainability-priority comparison and does not replace full industrial LCA.", "proxy"],
      ["Performance Score", "Supports adsorption-related candidate ranking and does not replace rigorous GCMC or IAST.", "proxy"],
      ["Catalysis Potential Score", "Screens catalysis potential without claiming accurate conversion, selectivity, or TOF prediction.", "warn"],
      ["Score Breakdown", "Shows dimension-level score composition for a candidate.", "info"],
      ["Weight Contribution", "Explains how weights and normalized descriptors affect the score.", "info"],
      ["Sensitivity Analysis", "Checks whether ranking remains stable when key weights change.", "info"],
    ]

  const formulaCards = [
    {
      title: zh ? "表观选择性" : "Apparent selectivity",
      formula: <FormulaLine>S<sub>A/B</sub> = q<sub>A</sub> / q<sub>B</sub></FormulaLine>,
      variables: zh
        ? [["q_A", "组分 A 的吸附量"], ["q_B", "组分 B 的吸附量"]]
        : [["q_A", "uptake of component A"], ["q_B", "uptake of component B"]],
      interpretation: zh ? "用于快速比较两个组分的吸附量比例。" : "Quickly compares uptake ratio between two components.",
      limitation: zh ? "这是简化的表观选择性，不替代严格混合气吸附建模。" : "This is a simplified apparent selectivity and does not replace rigorous mixture adsorption modeling.",
    },
    {
      title: zh ? "Henry 选择性" : "Henry selectivity",
      formula: <FormulaLine>S<sub>H,A/B</sub> = K<sub>H,A</sub> / K<sub>H,B</sub></FormulaLine>,
      variables: zh
        ? [["K_H,A", "组分 A 的 Henry 常数 (mmol g⁻¹ bar⁻¹)"], ["K_H,B", "组分 B 的 Henry 常数 (mmol g⁻¹ bar⁻¹)"]]
        : [["K_H,A", "Henry constant of component A (mmol g⁻¹ bar⁻¹)"], ["K_H,B", "Henry constant of component B (mmol g⁻¹ bar⁻¹)"]],
      interpretation: zh
        ? "Henry 选择性用于比较材料在低压区域对组分 A 相对于组分 B 的初始吸附亲和力。适用于低压或稀释吸附区域。示例：如果 K_H,CO₂ = 2.0 mmol g⁻¹ bar⁻¹，K_H,N₂ = 0.1 mmol g⁻¹ bar⁻¹，则 S_H,CO₂/N₂ = 20。"
        : "Henry selectivity compares the low-pressure adsorption affinity of component A relative to component B. Applies to low-pressure or dilute adsorption regimes. Example: if K_H,CO₂ = 2.0 mmol g⁻¹ bar⁻¹ and K_H,N₂ = 0.1 mmol g⁻¹ bar⁻¹, then S_H,CO₂/N₂ = 20.",
      limitation: zh
        ? "它不替代严格 IAST、穿透实验或完整混合气吸附分析。主要适用于稀释或低压区域。"
        : "It does not replace rigorous IAST, breakthrough experiments, or full mixture adsorption analysis. Useful for dilute or low-pressure regimes only.",
    },
    {
      title: zh ? "IAST 选择性" : "IAST selectivity",
      formula: <FormulaLine>S<sub>A/B</sub> = (x<sub>A</sub> / y<sub>A</sub>) / (x<sub>B</sub> / y<sub>B</sub>)</FormulaLine>,
      variables: zh
        ? [["x_A, x_B", "吸附相摩尔分数"], ["y_A, y_B", "气相摩尔分数"]]
        : [["x_A, x_B", "adsorbed phase mole fractions"], ["y_A, y_B", "gas phase mole fractions"]],
      interpretation: zh ? "用于说明严格混合气选择性计算所需的相组成关系。" : "Describes phase-composition ratios used in rigorous mixture selectivity analysis.",
      limitation: zh ? "当前平台不执行严格 IAST，该公式仅作为方法参考。" : "Current platform does not perform rigorous IAST. This is a formula reference only.",
    },
    {
      title: zh ? "等量吸附热 Qst" : "Isosteric heat Qst",
      formula: <FormulaLine>Q<sub>st</sub> = -R × d(ln P) / d(1/T)</FormulaLine>,
      variables: zh
        ? [["R", "气体常数"], ["P", "压力"], ["T", "温度"]]
        : [["R", "gas constant"], ["P", "pressure"], ["T", "temperature"]],
      interpretation: zh ? "用于解释吸附强度和温度响应。" : "Interprets adsorption strength and temperature response.",
      limitation: zh
        ? "Qst 估算需要可靠的多温度等温线数据。当前 Qst 输出应作为解释性参考，不应视为最终热力学证据。"
        : "Qst estimation requires reliable multi-temperature isotherm data. Current Qst outputs should be treated as interpretive guidance, not final thermodynamic evidence.",
    },
    {
      title: zh ? "催化潜力评分" : "Catalysis Potential Score",
      formula: (
        <FormulaLine>
          Catalysis Potential Score = w<sub>1</sub> × CO<sub>2</sub> Affinity + w<sub>2</sub> × Active Site Potential + w<sub>3</sub> × Pore Accessibility + w<sub>4</sub> × Stability + w<sub>5</sub> × Electronic Property + w<sub>6</sub> × Sustainability + w<sub>7</sub> × Evidence Confidence
        </FormulaLine>
      ),
      variables: zh
        ? [["w₁…w₇", "催化任务规则权重"], ["CO₂ Affinity", "CO₂ 相关亲和力描述符"]]
        : [["w₁…w₇", "catalysis task rule weights"], ["CO₂ Affinity", "CO₂-related affinity descriptor"]],
      interpretation: zh ? "用于催化候选材料优先级筛选。" : "Used for catalysis candidate prioritization.",
      limitation: zh ? "不声称准确预测催化性能，仍需实验验证。" : "It does not claim accurate catalytic performance prediction and still requires experimental validation.",
    },
  ]

  const provenanceCards = zh
    ? [
      ["字段级数据溯源", "字段级数据溯源（Field-level Provenance）说明每个描述符的来源类型、数据库或文献引用、测量条件、证据等级、整理说明和限制。", "info"],
      ["fieldSources", "字段级来源映射，说明某个描述符的来源和整理状态。", "proxy"],
      ["sourceRecords", "来源记录可包含 DOI、URL、测量条件、限制和整理说明。", "info"],
      ["待整理", "缺失来源显示为待整理，不应被理解为已经核实。", "warn"],
    ]
    : [
      ["Field-level Provenance", "Each curated descriptor can be linked to field-level provenance, including source type, database or literature reference, measurement condition, evidence level, curation note, and limitations.", "info"],
      ["fieldSources", "Field-level source mapping that describes where a descriptor comes from and its curation state.", "proxy"],
      ["sourceRecords", "Source records can include DOI, URL, condition, limitations, and curation note.", "info"],
      ["Pending curation", "Pending fields are under review and may change.", "warn"],
    ]

  const limitations = zh
    ? [
      "结果表示候选优先级，不代表最终材料性能；",
      "催化性能高度依赖反应条件；",
      "可持续性评分不替代完整工业 LCA；",
      "吸附相关结果不替代严格 GCMC 或 IAST 分析；",
      "机器学习评估需要带标签的实验或文献数据；",
      "真实种子数据集不是完整 MOF 数据库；",
      "仍需实验验证。",
    ]
    : [
      "Results indicate candidate priority, not final material performance.",
      "Catalytic performance depends strongly on reaction conditions.",
      "Sustainability scores do not replace full industrial LCA.",
      "Adsorption-related results do not replace rigorous GCMC or IAST analysis.",
      "ML evaluation requires labeled experimental or literature data.",
      "Real Seed Dataset is not a complete MOF database.",
      "Experimental validation is required.",
    ]

  const suggestedUse = zh
    ? {
      appropriate: ["早期候选优先级筛选", "描述符整理", "数据来源查看", "科研假设生成", "教学或作品集展示", "合作讨论"],
      notFor: ["最终材料性能结论", "替代实验", "完整 LCA 结论", "替代 GCMC / IAST", "已验证机器学习预测", "工业部署决策"],
    }
    : {
      appropriate: ["Early-stage candidate prioritization", "Descriptor organization", "Data provenance inspection", "Research hypothesis generation", "Teaching or portfolio demonstration", "Collaboration discussion"],
      notFor: ["Final material performance conclusion", "Experimental replacement", "Complete LCA claim", "GCMC / IAST replacement", "Validated ML prediction", "Industrial deployment decision"],
    }

  const benchmarkReferences = zh
    ? [
      {
        name: "UiO-66",
        role: "稳定性参考",
        why: "常见的锆基金属有机框架，经常用于稳定性相关讨论的参照点。",
        strengths: ["常被用于讨论相对较强的热稳定性和化学稳定性", "可作为框架稳健性的参考"],
        limitations: ["性能依赖合成、缺陷、功能化和测试条件", "不是所有应用的通用 benchmark"],
      },
      {
        name: "ZIF-8",
        role: "经典 ZIF 参考",
        why: "广为人知的沸石咪唑酯骨架，常见于 MOF 文献和教学语境。",
        strengths: ["结构家族辨识度高", "常作为熟悉的比较参照"],
        limitations: ["稳定性和性能依赖条件", "仅靠它不足以作为可持续性或生命周期影响 benchmark"],
      },
      {
        name: "MIL-53(Al)",
        role: "柔性框架参考",
        why: "代表性柔性 MOF，常用于讨论 breathing 行为和吸附条件依赖性。",
        strengths: ["有助于解释框架柔性", "可作为吸附行为的语境参考"],
        limitations: ["性能强烈依赖客体分子、活化和测量条件", "不是所有筛选任务的通用标准"],
      },
    ]
    : [
      {
        name: "UiO-66",
        role: "Stability-oriented reference",
        why: "A widely discussed zirconium-based MOF often used as a reference point for stability-related discussions.",
        strengths: ["Often discussed for relatively strong thermal and chemical stability", "Useful reference for framework robustness"],
        limitations: ["Performance depends on synthesis, defects, functionalization, and test conditions", "Not a universal benchmark for all applications"],
      },
      {
        name: "ZIF-8",
        role: "Classical ZIF reference",
        why: "A widely known zeolitic imidazolate framework frequently used in MOF literature and teaching contexts.",
        strengths: ["Well-known structure family", "Commonly used as a familiar comparison point"],
        limitations: ["Stability and performance are condition-dependent", "Not sufficient as a benchmark for sustainability or lifecycle impact alone"],
      },
      {
        name: "MIL-53(Al)",
        role: "Flexible framework reference",
        why: "A representative flexible MOF often discussed in relation to breathing behavior and adsorption-condition dependence.",
        strengths: ["Useful for explaining framework flexibility", "Helpful as a context reference for adsorption behavior"],
        limitations: ["Performance can strongly depend on guest molecules, activation, and measurement conditions", "Not a universal standard for all screening tasks"],
      },
    ]

  const scaleUpFields = zh
    ? [
      "前驱体可获得性",
      "配体成本等级",
      "溶剂风险",
      "合成温度",
      "活化条件",
      "能耗强度说明",
      "放大风险",
    ]
    : [
      "precursor availability",
      "ligand cost class",
      "solvent concern",
      "synthesis temperature",
      "activation condition",
      "energy-intensity notes",
      "scale-up concern",
    ]

  const scoreComponents = zh
    ? [
      ["P", "性能信号", "CO₂ 吸附量、比表面积、孔径、孔体积等性能相关描述符。", ["CO₂ 吸附量", "比表面积", "孔径", "孔体积"]],
      ["S", "可持续性信号", "毒性关注、水稳定性、热稳定性和早期可持续性指标。", ["毒性关注", "水稳定性", "热稳定性", "早期信号"]],
      ["D", "数据完整性", "核心 8 项描述符的整理状态，用于判断字段覆盖和待补充内容。", ["8 项核心描述符", "已整理", "待补充", "需复核"]],
      ["E", "证据可信度", "证据等级、来源覆盖和逐字段溯源。", ["证据等级", "来源覆盖", "逐字段溯源"]],
    ]
    : [
      ["P", "Performance Signal", "CO₂ uptake, surface area, pore size, pore volume, and related performance descriptors.", ["CO₂ uptake", "surface area", "pore size", "pore volume"]],
      ["S", "Sustainability Signal", "Toxicity concern, water stability, thermal stability, and early-stage sustainability indicators.", ["toxicity concern", "water stability", "thermal stability", "early signal"]],
      ["D", "Data Completeness", "Curation status for the core 8 descriptor set, used to track field coverage and pending fields.", ["8 core descriptors", "curated", "pending", "needs review"]],
      ["E", "Evidence Confidence", "Evidence level, source coverage, and field-level provenance.", ["evidence level", "source coverage", "field-level provenance"]],
    ]

  const workflowSteps = zh
    ? [
      ["演示数据 / 真实种子 / 仅字段结构记录", "区分记录来源和公开状态"],
      ["描述符标准化", "统一字段名、单位和条件语境"],
      ["逐字段溯源", "记录来源、条件和整理说明"],
      ["证据等级标注", "标记支持强度和待补充项"],
      ["评分计算", "使用当前规则配置生成优先级"],
      ["优先级解释", "解释排序结构而非最终性能"],
      ["实验验证", "后续外部验证环节"],
    ].map(([title, note]) => ({ title, note }))
    : [
      ["Demo / Real Seed / Schema-only Records", "Separate source mode and public status"],
      ["Descriptor normalization", "Align field names, units, and condition context"],
      ["Field-level provenance", "Track source, condition, and curation note"],
      ["Evidence level assignment", "Mark support strength and pending fields"],
      ["Score calculation", "Apply current rule configuration for priority"],
      ["Priority interpretation", "Explain ranking structure, not final performance"],
      ["Experimental validation", "External validation step after prioritization"],
    ].map(([title, note]) => ({ title, note }))

  const ladderLevels = zh
    ? [
      { level: "高", title: "High / 高", body: "来源清楚，条件语境较完整，支持证据较强。" },
      { level: "中", title: "Medium / 中", body: "有来源，但条件或验证语境不完整。" },
      { level: "低", title: "Low / 低", body: "有数值，但来源或条件语境有限。" },
      { level: "待补充", title: "Pending / 待补充", body: "尚未完成整理。" },
    ]
    : [
      { level: "High", title: "High", body: "Clear source, condition context, and stronger supporting evidence." },
      { level: "Medium", title: "Medium", body: "Source available, but condition or validation context is incomplete." },
      { level: "Low", title: "Low", body: "Value exists, but source or condition context is limited." },
      { level: "Pending", title: "Pending", body: "Not curated yet." },
    ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PageHeader
        title={zh ? "方法与证据" : "Methods & Evidence"}
        subtitle={zh
          ? "可视化评分方法、数据边界和引用方式。"
          : "Visual scoring methodology, data boundaries, and citation."}
        meta={zh ? "总分公式 · 子分数 · 权重配置 · 证据阶梯 · 引用" : "formula · score components · weights · evidence ladder · citation"}
        action={
          <>
            <BasisBadge tone="proxy">{zh ? "候选优先级" : "candidate priority"}</BasisBadge>
            <CopyLinkButton hash="methodology" ariaLabel={zh ? "复制方法与证据链接" : "Copy Methods & Evidence link"} />
          </>
        }
      />

      <Callout tone="info">
        {zh
          ? "页面中的分数表示候选优先级（candidate priority），用于早期筛选和研究假设生成，不代表最终材料性能。"
          : "Scores indicate candidate priority for early-stage screening and research hypothesis generation, not final material performance."}
      </Callout>

      <nav aria-label={zh ? "方法与证据目录" : "Methods & Evidence contents"}
        style={{ display: "flex", gap: 6, flexWrap: "wrap", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px 12px" }}>
        {toc.map(([href, label], index) => (
          <span key={href} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <a href={`#${href}`}
              style={{ color: t.accentText, fontSize: 11, fontWeight: 800, textDecoration: "none" }}>
              {label}
            </a>
            {index < toc.length - 1 && <span style={{ color: t.faint, fontSize: 11 }}>|</span>}
          </span>
        ))}
      </nav>

      <section id="method-score-overview" className="content-card" style={{
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: 16,
        scrollMarginTop: 120,
      }}>
        <span id="method-scoring" style={{ position: "relative", top: -120 }} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <SectionTitle>{zh ? "方法评分仪表盘" : "Methodology Dashboard"}</SectionTitle>
            <p style={{ color: t.subtle, fontSize: 12, lineHeight: 1.55, margin: "6px 0 0", maxWidth: 840 }}>
              {zh
                ? "EcoMOF-AI 使用规则辅助的优先级评分，根据当前可用描述符、可持续性信号、数据完整性和证据可信度整理候选材料记录。"
                : "EcoMOF-AI uses rule-assisted priority scoring to organize candidate records by available descriptors, sustainability signals, data completeness, and evidence confidence."}
            </p>
          </div>
          <BasisBadge tone="proxy">{zh ? "研究原型" : "Research prototype"}</BasisBadge>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "280px minmax(0, 1fr)",
          gap: 14,
          alignItems: "start",
        }}>
          <aside style={{ display: "grid", gap: 10, position: isNarrow ? "static" : "sticky", top: 94 }}>
            <SummaryCard
              title={zh ? "总分结构" : "Total score structure"}
              value={zh ? "候选优先级总分" : "Total Priority Score"}
              badge={zh ? "规则辅助" : "Rule-assisted"}
              t={t}
            >
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>
                {zh ? "性能 + 可持续性 + 完整性 + 证据 − 不确定性" : "Performance + Sustainability + Completeness + Evidence − Uncertainty"}
              </div>
              <BasisBadge tone="proxy">{zh ? "研究原型" : "Research prototype"}</BasisBadge>
            </SummaryCard>

            <SummaryCard
              title={zh ? "核心描述符" : "Core descriptor set"}
              value={zh ? "8 项核心描述符" : "8 core descriptors"}
              t={t}
            >
              <MiniDescriptorGrid zh={zh} t={t} />
            </SummaryCard>

            <SummaryCard
              title={zh ? "证据覆盖" : "Evidence coverage"}
              value={zh ? "证据等级" : "Evidence levels"}
              t={t}
            >
              <MiniEvidenceSegments zh={zh} t={t} />
              <div style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.45 }}>
                {zh ? "高证据等级不等于实验验证完成。" : "High does not mean final experimental validation."}
              </div>
            </SummaryCard>

            <SummaryCard
              title={zh ? "数据工作流" : "Data workflow"}
              value={zh ? "记录 → 评分" : "Records → Score"}
              t={t}
            >
              <MiniPipeline
                steps={zh ? ["记录", "溯源", "证据", "评分"] : ["Records", "Provenance", "Evidence", "Score"]}
                t={t}
              />
            </SummaryCard>

            <SummaryCard
              title={zh ? "使用边界" : "Use boundary"}
              value={zh ? "原型边界" : "Prototype boundary"}
              badge={zh ? "非最终预测" : "not final prediction"}
              t={t}
              action={onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate("disclaimer")}
                  style={{
                    minHeight: 36,
                    padding: "8px 10px",
                    borderRadius: 7,
                    border: `1px solid ${t.border}`,
                    background: t.badgeInfoBg,
                    color: t.accentText,
                    fontSize: 11,
                    fontWeight: 850,
                    cursor: "pointer",
                  }}
                >
                  {zh ? "查看声明" : "Open Disclaimer"}
                </button>
              )}
            >
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>
                {zh ? "优先级参考，不是最终预测。" : "Priority reference, not final prediction."}
              </div>
            </SummaryCard>
          </aside>

          <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
            <DashboardPanel
              id="method-formulas"
              title={zh ? "总分公式" : "Total Score Formula"}
              kicker={zh ? "核心视觉" : "core visual"}
              t={t}
            >
              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, color: t.textStrong, fontSize: 13, fontWeight: 900, lineHeight: 1.6 }}>
                  <span>{zh ? "候选优先级总分" : "Total Priority Score"}</span>
                  <span style={{ color: t.faint }}>=</span>
                  <FormulaTerm symbol="w₁" label={zh ? "性能信号" : "Performance"} tone="info" t={t} />
                  <span style={{ color: t.faint }}>+</span>
                  <FormulaTerm symbol="w₂" label={zh ? "可持续性信号" : "Sustainability"} tone="calc" t={t} />
                  <span style={{ color: t.faint }}>+</span>
                  <FormulaTerm symbol="w₃" label={zh ? "数据完整性" : "Data Completeness"} tone="proxy" t={t} />
                  <span style={{ color: t.faint }}>+</span>
                  <FormulaTerm symbol="w₄" label={zh ? "证据可信度" : "Evidence Confidence"} tone="info" t={t} />
                  <span style={{ color: t.faint }}>−</span>
                  <FormulaTerm symbol="w₅" label={zh ? "不确定性惩罚" : "Uncertainty Penalty"} tone="warn" t={t} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 13 }}>
                  {(zh ? [
                    ["w₁–w₅", "规则权重"],
                    ["性能", "性能相关描述符"],
                    ["完整性", "核心字段整理完整度"],
                    ["不确定性", "缺失、待复核或条件不足"],
                  ] : [
                    ["w₁–w₅", "rule weights"],
                    ["Performance", "performance-related descriptors"],
                    ["Completeness", "core-field curation completeness"],
                    ["Uncertainty", "missing, review-needed, or condition-limited fields"],
                  ]).map(([label, desc]) => (
                    <div key={label} style={{ display: "flex", gap: 8, color: t.muted, fontSize: 11, lineHeight: 1.45 }}>
                      <span style={{ color: t.textStrong, fontFamily: FONT_MONO, fontWeight: 850, minWidth: 92 }}>{label}</span>
                      {desc}
                    </div>
                  ))}
                </div>
                <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 12, borderTop: `1px solid ${t.divider}`, paddingTop: 10 }}>
                  {zh
                    ? "透明评分框架，不是已验证性能预测。未在此处编造具体权重；真实配置见权重条。"
                    : "Transparent scoring scaffold, not validated performance prediction. No concrete weights are invented here; current configuration appears in the weight bars."}
                </div>
              </div>
            </DashboardPanel>

            <DashboardPanel id="score-components" title={zh ? "分数组成图" : "Score Composition"} t={t}>
              <ScoreCompositionGraph zh={zh} isMobile={isMobile} t={t} />
            </DashboardPanel>

            <DashboardPanel
              id="scoring-axes"
              title={zh ? "评分坐标图" : "Scoring Axes"}
              kicker={zh ? "概念可视化" : "conceptual visuals"}
              t={t}
            >
              <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, marginBottom: 10 }}>
                {zh
                  ? "通过坐标图展示数据完整性、证据可信度和不确定性如何影响优先级解释。"
                  : "Visual axes show how data completeness, evidence confidence, and uncertainty affect priority interpretation."}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.25fr) minmax(0, 0.95fr)", gap: 10, alignItems: "stretch" }}>
                <EvidenceCompletenessQuadrant zh={zh} t={t} />
                <div style={{ display: "grid", gap: 10 }}>
                  <ScoreComponentBarChart zh={zh} t={t} />
                  <PriorityInterpretationCurve zh={zh} t={t} />
                </div>
              </div>
            </DashboardPanel>

            <DashboardPanel
              id="weight-configuration"
              title={zh ? "权重配置" : "Weight Configuration"}
              kicker={weightsStatus === "loaded" ? (zh ? "已读取配置" : "configuration loaded") : (zh ? "概念权重" : "conceptual slots")}
              t={t}
            >
              <WeightBars weights={scoringWeights} zh={zh} t={t} />
              <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 10 }}>
                {weightsStatus === "loaded"
                  ? (zh ? "已从 public/data/scoring_weights.json 读取当前配置；本页只展示，不修改权重。" : "Loaded current configuration from public/data/scoring_weights.json; this page visualizes weights without changing them.")
                  : (zh ? "若没有明确权重配置，权重仅作为公式结构因子展示。" : "Weight slots are shown as conceptual factors unless an explicit configuration is available.")}
              </div>
            </DashboardPanel>

            <DashboardPanel title={zh ? "子分数构成" : "Score Components"} t={t}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                {scoreComponents.map(([marker, title, body, tags]) => (
                  <ScoreComponentCard key={title} marker={marker} title={title} body={body} tags={tags} t={t} />
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <DescriptorGrid zh={zh} t={t} />
              </div>
            </DashboardPanel>

            <DashboardPanel id="evidence-level-ladder" title={zh ? "证据等级阶梯" : "Evidence Level Ladder"} t={t}>
              <EvidenceLadder levels={ladderLevels} zh={zh} t={t} />
              <div style={{ marginTop: 10, color: t.faint, fontSize: 11, lineHeight: 1.55 }}>
                {evidenceLevels.length
                  ? (zh ? `已读取当前 evidence 配置：${evidenceLevels.length} 个原始证据类别。` : `Current evidence configuration loaded: ${evidenceLevels.length} raw evidence categories.`)
                  : (zh ? "未读取到 evidence 配置时，阶梯仅展示页面解释结构。" : "If evidence configuration is unavailable, the ladder shows the page-level interpretation structure.")}
              </div>
            </DashboardPanel>

            <DashboardPanel id="method-workflow" title={zh ? "数据与证据工作流" : "Data & Evidence Workflow"} t={t}>
              <WorkflowPipeline steps={workflowSteps} isMobile={isMobile} t={t} />
            </DashboardPanel>

            <DashboardPanel id="method-data" title={zh ? "数据边界" : "Data Boundaries"} t={t}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                {dataCards.map(([title, body, tone]) => <CompactCard key={title} title={title} body={body} tone={tone} t={t} />)}
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 7, flexWrap: "wrap" }}>
                {scaleUpFields.map(item => (
                  <span key={item} style={{ color: t.muted, fontSize: 10, lineHeight: 1.3, border: `1px solid ${t.border}`, borderRadius: 999, padding: "5px 8px", background: t.panel }}>
                    {item}
                  </span>
                ))}
              </div>
              <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 10 }}>
                {zh
                  ? "字段类型用于说明记录结构；完整使用边界集中在声明中心。"
                  : "Record types explain data structure; full use boundaries remain centralized in the Disclaimer Center."}
                {" "}<DisclaimerLink />
              </div>
            </DashboardPanel>

            <DashboardPanel id="method-limitations" title={zh ? "使用边界矩阵" : "Use Boundaries Matrix"} t={t}>
              <UseBoundaryMatrix suggestedUse={suggestedUse} zh={zh} t={t} isMobile={isMobile} />
            </DashboardPanel>
          </div>
        </div>
      </section>

      <MethodSection
        id="method-scoring-details"
        title={zh ? "评分模型" : "Scoring Model"}
        body={zh
          ? "当前是规则评分模型，不是训练完成的真实预测模型。所有分数都表示候选优先级，不表示最终材料性能。"
          : "The current model is rule based, not a trained predictive model. Every score indicates candidate priority, not final material performance."}
        t={t}
      >
        <details style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          <summary style={{ cursor: "pointer", color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
            {zh ? "查看补充评分说明" : "View supplemental scoring notes"}
          </summary>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 10 }}>
          {scoreCards.map(([title, body, tone]) => <CompactCard key={title} title={title} body={body} tone={tone} t={t} />)}
          </div>
        </details>
      </MethodSection>

      <MethodSection
        id="method-formula-reference"
        title={zh ? "公式参考" : "Formula Reference"}
        body={zh
          ? "这些公式用于辅助理解吸附与分离概念，不代表当前原型执行严格 IAST 或热力学建模。"
          : "These formulas support interpretation of adsorption and separation concepts. They are references, not proof that the prototype performs rigorous IAST or thermodynamic modeling."}
        t={t}
      >
        <div style={{ display: "grid", gap: 8 }}>
          {formulaCards.map(card => (
            <FormulaDetails
              key={card.title}
              {...card}
              t={t}
              zh={zh}
            />
          ))}
        </div>
      </MethodSection>

      <MethodSection
        id="method-provenance"
        title={zh ? "证据与溯源" : "Evidence & Provenance"}
        body={zh
          ? "证据追踪用于说明字段来源和整理状态。证据等级（Evidence Level）和待整理状态需要一起解读。"
          : "Evidence tracking clarifies field sources and curation state. Data without verified provenance should not be over-interpreted."}
        t={t}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {provenanceCards.map(([title, body, tone]) => <CompactCard key={title} title={title} body={body} tone={tone} t={t} />)}
        </div>
        <div style={{ marginTop: 12, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
            {zh ? "描述符条件很重要" : "Descriptor Conditions Matter"}
          </div>
          <p style={{ color: t.muted, fontSize: 11, lineHeight: 1.65, margin: "8px 0 0" }}>
            {zh
              ? "CO₂ 吸附量、水稳定性、比表面积、孔体积等 MOF 描述符依赖具体测试或报道条件。整理状态会同时标注数值、单位、必要测试条件、证据等级和逐字段来源记录；缺少条件的字段显示为条件待补充。"
              : "MOF descriptors such as CO₂ uptake, water stability, surface area, and pore volume depend on measurement or reporting conditions. Curation status tracks value, unit, condition when applicable, evidence level, and field-level source records; fields without condition metadata remain condition pending."}
          </p>
        </div>
        <div style={{ marginTop: 12, color: t.muted, fontSize: 11, lineHeight: 1.65, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          {zh
            ? "在 MOF 候选库展开记录后，以及性能优先级和催化实验室的真实种子模式候选卡片中，可通过逐字段溯源查看来源详情。"
            : "Expanded MOF Library records and real-seed candidate cards in Performance / CatalysisLab include field-level source details."}
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={handleViewDataQuality}
            style={{
              marginTop: 12,
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 16px", borderRadius: 7,
              background: t.badgeInfoBg, border: `1px solid ${t.border}`,
              color: t.accentText, fontSize: 12, fontWeight: 800,
              cursor: "pointer", fontFamily: FONT_MONO,
            }}
          >
            <span style={{ fontSize: 14 }}>📊</span>
            {zh ? "查看数据质量图表" : "View Data Quality Dashboard"}
          </button>
        )}
      </MethodSection>

      <MethodSection
        id="method-gassep-conditions"
        title={zh ? "气体分离条件" : "Gas Separation Conditions"}
        body={zh
          ? "气体分离数据高度依赖条件。缺少气体比例、温度、压力、方法和来源语境时，不应直接比较选择性和吸附量。"
          : "Gas separation values are condition-sensitive. Selectivity and uptake should not be compared without gas ratio, temperature, pressure, method, and source context."}
        t={t}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.65, maxWidth: 760 }}>
            {zh
              ? "气体分离模块用于查看带条件语境的气体吸附与分离记录，包括体系、比例、温度、压力、方法、来源状态和等温线可用性。"
              : "GasSep shows gas adsorption and separation records with condition context, including system, ratio, temperature, pressure, method, source status, and isotherm availability."}
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.("gassep")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "8px 12px", borderRadius: 7,
              background: t.badgeInfoBg, border: `1px solid ${t.border}`,
              color: t.accentText, fontSize: 11, fontWeight: 800,
              cursor: "pointer", fontFamily: FONT_MONO,
            }}
          >
            {zh ? "打开气体分离" : "Open GasSep"}
          </button>
        </div>
      </MethodSection>

      <MethodSection
        id="method-catalysis-boundaries"
        title={zh ? "催化数据整理边界" : "Catalysis curation boundaries"}
        body={zh
          ? "催化实验室按产物路径和反应模式组织 CO₂ 转化记录，并区分条件语境、活性/选择性指标、稳定性证据和来源状态。待补充字段仍在复核中，后续可能更新。"
          : "CatalysisLab organizes CO₂ conversion records by product pathway and reaction mode, while separating condition context, activity/selectivity metrics, stability evidence, and source status. Pending fields are under review and may change."}
        t={t}
      >
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, color: t.muted, fontSize: 11, lineHeight: 1.65 }}>
          {zh
            ? "缺少相近条件语境和证据状态时，不应跨路径直接比较指标；例如电催化法拉第效率、光催化 TON/TOF、热催化转化率/收率和环加成产率属于不同反应语境。"
            : "Metrics should not be compared across pathways without matching condition context and evidence status; electrocatalytic Faradaic efficiency, photocatalytic TON/TOF, thermal conversion/yield, and cycloaddition yield describe different reaction contexts."}
        </div>
      </MethodSection>

      <MethodSection
        id="collaboration-data-boundaries"
        title={zh ? "合作数据边界" : "Collaboration data boundaries"}
        body={zh
          ? "EcoMOF-AI 可以整理公开文献记录、合作者保密记录、匿名化演示记录和仅字段结构记录。未发表或保密数据不应在未经明确同意的情况下公开。"
          : "EcoMOF-AI can structure public literature records, collaborator-private records, anonymized demos, and schema-only entries. Private or unpublished data should not be published without explicit permission."}
        t={t}
      >
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, color: t.muted, fontSize: 11, lineHeight: 1.65 }}>
          {zh
            ? "面向未来机器学习的数据记录应先经过字段完整性、条件一致性和证据状态复核。当前静态原型不提供公开上传或后端存储。"
            : "Records intended for future machine learning should first pass field completeness, condition consistency, and evidence review. The current static prototype does not provide public upload or backend storage."}
        </div>
      </MethodSection>

      <MethodSection
        id="experimental-data-normalization"
        title={zh ? "实验数据标准化" : "Experimental data normalization"}
        body={zh
          ? "催化实验表格在复用前应标准化为催化剂记录、反应条件、产物指标和证据记录。"
          : "Experimental catalyst spreadsheets are normalized into catalyst records, reaction conditions, product metrics, and evidence records before reuse."}
        t={t}
      >
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, color: t.muted, fontSize: 11, lineHeight: 1.65 }}>
          {zh
            ? "这样的拆分有助于避免将反应条件、产物标签、保密数值和证据状态混在同一张表中。"
            : "This separation helps avoid mixing reaction conditions, product labels, confidential values, and evidence status in a single table."}
        </div>
      </MethodSection>

      <MethodSection
        id="case-study-templates"
        title={zh ? "案例模板" : "Case study templates"}
        body={zh
          ? "案例模板用于在记录公开或用于建模前，整理催化剂身份、反应条件、产物分布、机理证据和保密状态。仅字段结构案例模板不包含已验证性能数值。"
          : "Case study templates are used to organize catalyst identity, reaction conditions, product distribution, mechanism evidence, and confidentiality status before any record is treated as public or model-ready. Schema-only case templates do not contain validated performance values."}
        t={t}
      />

      <MethodSection
        id="benchmark-references"
        title={zh ? "标杆材料参考" : "Benchmark References"}
        body={zh
          ? "这些标杆材料用于帮助理解 MOF 候选记录的研究语境，并不代表平台已完成严格预测对标，也不代表 EcoMOF-AI 声称候选材料性能优于这些材料。"
          : "These benchmark references provide research context for interpreting MOF candidate records. They are not direct prediction baselines, and EcoMOF-AI does not claim validated performance superiority over these materials."}
        t={t}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          {benchmarkReferences.map(item => (
            <article key={item.name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 880 }}>{item.name}</div>
                <BasisBadge tone="proxy">{item.role}</BasisBadge>
              </div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.65, marginTop: 9 }}>{item.why}</div>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                <div>
                  <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
                    {zh ? "典型优势" : "Typical strengths"}
                  </div>
                  <ul style={{ margin: "5px 0 0", paddingLeft: 16, color: t.muted, fontSize: 11, lineHeight: 1.55 }}>
                    {item.strengths.map(entry => <li key={entry}>{entry}</li>)}
                  </ul>
                </div>
                <div>
                  <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
                    {zh ? "已知限制" : "Known limitations"}
                  </div>
                  <ul style={{ margin: "5px 0 0", paddingLeft: 16, color: t.muted, fontSize: 11, lineHeight: 1.55 }}>
                    {item.limitations.map(entry => <li key={entry}>{entry}</li>)}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <CopyLinkButton hash="benchmark-references" label={zh ? "复制标杆参考链接" : "Copy Benchmark link"} copiedLabel={zh ? "链接已复制" : "Link copied"} ariaLabel={zh ? "复制标杆材料参考链接" : "Copy Benchmark References link"} />
        </div>
      </MethodSection>

      <MethodSection
        id="validation-evidence"
        title={zh ? "验证与证据" : "Validation & Evidence"}
        body={zh
          ? "EcoMOF-AI 是一个早期科研原型，不是已验证的预测工具。本节说明当前的验证状态、已检查的内容和未来计划。"
          : "EcoMOF-AI is an early-stage research prototype, not a validated prediction engine. This section documents the current validation status, what is explicitly checked, and future plans."}
        t={t}
      >
        {evidenceReady ? (
          <div style={{ display: "grid", gap: 12 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 10 }}>
              {zh ? "A. 当前状态" : "A. Current status"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
              {(zh ? [
                ["规则评分模型", "评分由可审计的规则和权重生成，不是训练完成的机器学习模型。"],
                ["描述符完整性追踪", "已整理字段标注证据等级；待整理字段明确标注，不静默遗漏。"],
                ["字段级数据溯源", "每个已整理的描述符可关联来源类型、文献引用、测量条件和整理说明。"],
                ["数据模式分离", "演示数据和真实种子数据明确分离；演示数据不用于科研结论。"],
              ] : [
                ["Rule-assisted scoring model", "Scores are generated by auditable rules and weights, not a trained machine learning model."],
                ["Descriptor completeness tracking", "Curated fields carry evidence levels; pending fields are explicitly labeled, not silently omitted."],
                ["Field-level provenance", "Each curated descriptor can be linked to source type, literature reference, measurement condition, and curation note."],
                ["Data mode separation", "Demo data and real-seed data are explicitly separated; demo data is not presented as scientific evidence."],
              ]).map(([title, body]) => (
                <div key={title} style={{ display: "flex", gap: 9, alignItems: "flex-start", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: "9px 11px" }}>
                  <span style={{ color: t.accentText, fontSize: 13, lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                  <div>
                    <div style={{ color: t.textStrong, fontSize: 11, fontWeight: 820, marginBottom: 3 }}>{title}</div>
                    <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.6 }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 10 }}>
              {zh ? "B. 已检查内容" : "B. What is checked"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 7 }}>
              {(zh ? [
                "描述符字段完整性（值、单位/条件、证据等级、来源记录）",
                "数据模式分离——演示数据不与真实种子数据混用",
                "字段级来源类型一致性（文献、数据库、估算、待整理）",
                "评分公式透明度——所有权重和维度可审计",
                "每个描述符的证据等级标注",
                "整理状态——待整理字段明确标注，不静默遗漏",
              ] : [
                "Descriptor field completeness (value, unit/condition, evidence level, source record)",
                "Data mode separation — demo data is not mixed with real-seed data",
                "Field-level source type consistency (literature, database, estimated, pending)",
                "Scoring formula transparency — all weights and dimensions are auditable",
                "Evidence level tagging per descriptor",
                "Curation state — pending fields are explicitly labeled, not silently omitted",
              ]).map(item => (
                <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: "8px 10px" }}>
                  <span style={{ color: t.accentText, fontSize: 11, lineHeight: 1.6, flexShrink: 0 }}>·</span>
                  <span style={{ color: t.muted, fontSize: 11, lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 10 }}>
              {zh ? "C. 未来验证工作" : "C. Future validation work"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 7 }}>
              {(zh ? [
                "将评分输出与文献报道的筛选结果进行基准对比",
                "将顶级候选材料的排序与 GCMC 模拟结果交叉验证",
                "将 Eco Score 各分项与已发表的 LCA 数据对比",
                "随实验验证数据的获取持续纳入",
                "针对不同任务配置对评分权重进行敏感性分析",
                "对描述符整理框架进行独立评审",
              ] : [
                "Benchmark scoring output against literature-reported screening results",
                "Cross-validate top-ranked candidate rankings with GCMC simulation results",
                "Compare Eco Score components with published LCA data",
                "Integrate experimental validation data as it becomes available",
                "Sensitivity analysis for scoring weights across different task configurations",
                "Independent review of the descriptor curation framework",
              ]).map(item => (
                <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: "8px 10px" }}>
                  <span style={{ color: t.faint, fontSize: 11, lineHeight: 1.6, flexShrink: 0 }}>→</span>
                  <span style={{ color: t.muted, fontSize: 11, lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.warn}`, borderRadius: 8, padding: 12, borderWidth: 1, borderStyle: "solid" }}>
            <div style={{ color: t.warn, fontSize: 11, fontWeight: 850, marginBottom: 6 }}>
              {zh ? "D. 未验证声明" : "D. Non-validation disclaimer"}
            </div>
            <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.7 }}>
              {zh
                ? "EcoMOF-AI 尚未经过同行评审或独立科学验证；评分和排序不应被引用为已验证预测。"
                : "EcoMOF-AI has not undergone peer review or independent scientific validation; scores and rankings should not be cited as validated predictions."}{" "}
              <DisclaimerLink />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <CopyLinkButton hash="validation-evidence" label={zh ? "复制验证与证据链接" : "Copy Validation & Evidence link"} copiedLabel={zh ? "链接已复制" : "Link copied"} ariaLabel={zh ? "复制验证与证据链接" : "Copy Validation & Evidence link"} />
          </div>
        </div>
        ) : (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14, color: t.faint, fontSize: 12 }}>
            {zh ? "验证与证据内容将在页面交互就绪后加载。" : "Validation and evidence content loads after the page interaction layer is ready."}
          </div>
        )}
      </MethodSection>

      <MethodSection
        id="method-disclaimer-center"
        title={zh ? "声明与使用边界" : "Disclaimer Center"}
        body={zh
          ? "查看关于原型状态、数据解读、评分、可持续性信号、催化记录、面向机器学习字段和合作者保密数据的集中说明。"
          : "Review the centralized boundaries for prototype status, data interpretation, scoring, sustainability signals, catalysis records, ML-ready fields, and collaborator-private data."}
        t={t}
      >
        <button
          type="button"
          onClick={() => onNavigate?.("disclaimer")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 12px",
            borderRadius: 7,
            background: t.badgeInfoBg,
            border: `1px solid ${t.border}`,
            color: t.accentText,
            fontSize: 11,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: FONT_MONO,
          }}
        >
          {zh ? "查看声明" : "Open Disclaimer"}
        </button>
      </MethodSection>

      <MethodSection
        id="method-limitations-detail"
        title={zh ? "使用边界" : "Use Boundaries"}
        body={zh
          ? "矩阵用简短方式说明适合用途和不适合用途；完整说明集中在声明中心。"
          : "This matrix summarizes appropriate and inappropriate use; full notes remain centralized in the Disclaimer Center."}
        t={t}
      >
        <UseBoundaryMatrix suggestedUse={suggestedUse} zh={zh} t={t} isMobile={isMobile} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {limitations.slice(0, 3).map(item => (
            <span key={item} style={{ color: t.faint, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, padding: "5px 8px", fontSize: 10.5, lineHeight: 1.3 }}>
              {item.replace(/[；.]$/, "")}
            </span>
          ))}
        </div>
      </MethodSection>

      <MethodSection
        id="method-references"
        title={zh ? "参考与引用" : "References & Citation"}
        body={zh
          ? "引用本项目时请引用仓库和网站；本平台不应被引用为已验证的科学数据库或最终预测工具。"
          : "When referencing this project, cite the repository and website; the platform should not be cited as a validated scientific database or final prediction engine."}
        t={t}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <details open style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <summary style={{ cursor: "pointer", color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
              {zh ? "如何引用 EcoMOF-AI" : "How to cite EcoMOF-AI"}
            </summary>
            <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, margin: "10px 0 0" }}>
              {zh
                ? "EcoMOF-AI 是一个早期科研原型。如果你在展示、作品集评审或非正式科研讨论中引用本项目，请引用项目仓库和网站。本平台不应被引用为已验证的科学数据库或最终预测工具。"
                : "EcoMOF-AI is an early-stage research prototype. If you reference this project in a presentation, portfolio review, or informal research discussion, please cite the project repository and website. The platform should not be cited as a validated scientific database or final prediction engine."}
            </p>
          </details>

          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{zh ? "项目引用" : "Project citation"}</div>
            <div style={{ marginTop: 9, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, padding: 10, color: t.muted, fontSize: 11, lineHeight: 1.6 }}>
              {zh ? PROJECT_CITATION_ZH : PROJECT_CITATION_EN}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              <CopyLinkButton value={zh ? PROJECT_CITATION_ZH : PROJECT_CITATION_EN} label={zh ? "复制引用" : "Copy citation"} copiedLabel={zh ? "引用已复制" : "Citation copied"} ariaLabel={zh ? "复制项目引用" : "Copy project citation"} />
              <CopyLinkButton value={PROJECT_BIBTEX} label={zh ? "复制 BibTeX" : "Copy BibTeX"} copiedLabel={zh ? "BibTeX 已复制" : "BibTeX copied"} ariaLabel={zh ? "复制 BibTeX" : "Copy BibTeX"} />
            </div>
          </div>

          <details style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <summary style={{ cursor: "pointer", color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
              {zh ? "数据与方法参考" : "Data and method references"}
            </summary>
            <p style={{ color: t.faint, fontSize: 11, lineHeight: 1.6, margin: "10px 0" }}>
              {zh
                ? "部分参考来源用于方法与证据说明或未来数据接入规划，不代表当前已完整接入。"
                : "Some references are planned or contextual references, not necessarily fully ingested data sources."}
            </p>
            {evidenceReady ? (
              <>
                {referencesStatus === "loading" && (
                  <Callout tone="info">{zh ? "正在加载参考信息…" : "Loading reference records..."}</Callout>
                )}
                {referencesStatus === "error" && (
                  <Callout tone="warn">
                    {zh
                      ? "数据加载失败。请刷新页面，或检查当前网络是否可以访问 GitHub Pages。"
                      : "Data could not be loaded. Please refresh the page or check network access to GitHub Pages."}
                  </Callout>
                )}
                {referencesStatus === "empty" && (
                  <Callout tone="warn">{zh ? "当前筛选条件下暂无记录。" : "No records are available for the current filters."}</Callout>
                )}
                <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  {references.map(item => (
                    <div key={item.id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10 }}>
                      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 820 }}>{item.title}</div>
                      <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.5, marginTop: 4 }}>{item.category} · {item.type}</div>
                      <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55, marginTop: 6 }}>{item.note}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.6, marginTop: 10 }}>
                {zh ? "参考记录将在页面交互就绪后加载。" : "Reference records load after the page interaction layer is ready."}
              </div>
            )}
          </details>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <CopyLinkButton value="https://linus-he.github.io/ecomof-ai/" label={zh ? "复制项目链接" : "Copy project link"} copiedLabel={zh ? "链接已复制" : "Link copied"} />
            <CopyLinkButton hash="methodology" label={zh ? "复制方法与证据链接" : "Copy Methods & Evidence link"} copiedLabel={zh ? "链接已复制" : "Link copied"} />
            <CopyLinkButton hash="data-quality-provenance" label={zh ? "复制数据质量链接" : "Copy Data Quality link"} copiedLabel={zh ? "链接已复制" : "Link copied"} />
          </div>
        </div>
      </MethodSection>

    </div>
  )
}
