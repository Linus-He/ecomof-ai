// @ts-nocheck
import { useState } from "react"
import { ChemicalText } from "../../shared"

const steps = [
  {
    id: "raw",
    titleZh: "原始反应记录",
    titleEn: "Raw reaction record",
    summaryZh: "保留文献表、Excel、实验笔记或 seed 数据中的原始条件和产物字段。",
    summaryEn: "Keeps source conditions and product fields from literature, spreadsheets, notes, or seed records.",
    fieldsZh: ["催化剂", "反应物 / 产物", "温度 / 压力", "转化率 / 选择性"],
    fieldsEn: ["catalyst", "reactants / products", "temperature / pressure", "conversion / selectivity"],
    detailZh: "原始记录不直接进入排序；同一实验中多个产物、单位和报告基准需要先保留来源并等待结构化。",
    detailEn: "Raw records do not enter ranking directly; mixed products, units, and reporting bases are retained before structuring.",
  },
  {
    id: "long-format",
    titleZh: "长表标准化",
    titleEn: "Long-format normalization",
    summaryZh: "把一条多产物实验拆成多个 product-level records，便于逐路径比较。",
    summaryEn: "Splits one multi-product run into product-level records for pathway comparison.",
    fieldsZh: ["Run 001 -> formate", "Run 001 -> acetate", "Run 001 -> lactate"],
    fieldsEn: ["Run 001 -> formate", "Run 001 -> acetate", "Run 001 -> lactate"],
    detailZh: "示例：CO₂ + biomass-derived substrate -> formate / acetate / lactate，会拆成三条可追踪记录。",
    detailEn: "Example: CO₂ + biomass-derived substrate -> formate / acetate / lactate becomes three traceable records.",
  },
  {
    id: "comparability",
    titleZh: "可比性检查",
    titleEn: "Comparability checks",
    summaryZh: "检查产物基准、碳基准、相态、单位、温度、压力、时间和报告基准是否一致。",
    summaryEn: "Checks product basis, carbon basis, phase, unit, temperature, pressure, time, and reporting basis.",
    fieldsZh: ["Comparable", "Partially comparable", "Not directly comparable", "Unknown"],
    fieldsEn: ["Comparable", "Partially comparable", "Not directly comparable", "Unknown"],
    detailZh: "检查结果会影响 evidence readiness；不可直接比较的记录仍可保留，但不应和高质量记录同层解读。",
    detailEn: "Checks affect evidence readiness; weakly comparable records remain visible but should not be read as equal evidence.",
  },
  {
    id: "evidence-ready",
    titleZh: "证据就绪记录",
    titleEn: "Evidence-ready record",
    summaryZh: "输出路径标签、证据等级、覆盖率、可比性分数、缺失字段和验证状态。",
    summaryEn: "Outputs pathway tag, evidence level, coverage, comparability score, missing fields, and validation status.",
    fieldsZh: ["reaction fingerprint", "pathway tag", "data coverage", "validation status"],
    fieldsEn: ["reaction fingerprint", "pathway tag", "data coverage", "validation status"],
    detailZh: "只有完成整理和标注的记录才用于路径评分或候选物优先级判断。",
    detailEn: "Only harmonized and annotated records should enter pathway scoring or candidate prioritization.",
  },
]

function StepCard({ step, active, onClick, lang, t }) {
  const zh = lang === "zh"
  return (
    <article style={{ background: active ? t.bg : t.surface, border: `1px solid ${active ? t.accent : t.border}`, borderRadius: 10, display: "grid", gap: 8, minWidth: 0, padding: 12 }}>
      <button
        type="button"
        onClick={onClick}
        style={{ background: "transparent", border: "none", color: t.textStrong, cursor: "pointer", display: "grid", gap: 5, padding: 0, textAlign: "left" }}
      >
        <div style={{ color: active ? t.accent : t.textStrong, fontSize: 13, fontWeight: 930, lineHeight: 1.25 }}>{zh ? step.titleZh : step.titleEn}</div>
        <div style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.5 }}><ChemicalText value={zh ? step.summaryZh : step.summaryEn} /></div>
      </button>
      <div style={{ color: t.textStrong, display: "grid", fontSize: 11.5, gap: 4, lineHeight: 1.4 }}>
        {(zh ? step.fieldsZh : step.fieldsEn).map(field => <div key={field}>- <ChemicalText value={field} /></div>)}
      </div>
      <details style={{ color: t.faint, fontSize: 11.3, lineHeight: 1.5 }}>
        <summary style={{ color: t.accentText, cursor: "pointer", fontWeight: 800 }}>{zh ? "展开字段映射" : "Field mapping"}</summary>
        <div style={{ marginTop: 6 }}><ChemicalText value={zh ? step.detailZh : step.detailEn} /></div>
      </details>
    </article>
  )
}

export function DataHarmonizationWorkflow({ lang, t, isMobile }) {
  const [activeId, setActiveId] = useState("raw")
  const zh = lang === "zh"

  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 14 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.18, textTransform: "uppercase" }}>{zh ? "数据流程" : "Data workflow"}</div>
        <h2 style={{ color: t.textStrong, fontSize: 20, fontWeight: 930, lineHeight: 1.2, margin: 0 }}>
          {zh ? "数据整理与可比性评估流程" : "Data Harmonization & Comparability Workflow"}
        </h2>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55, margin: 0, maxWidth: 960 }}>
          {zh
            ? "催化数据常混合多个产物、单位和报告基准；该流程把原始记录转成可比较、可追踪证据等级的路径数据。"
            : "Catalysis records often mix products, units, and reporting bases; this workflow turns them into comparable, evidence-ready pathway entries."}
        </p>
      </div>

      <div style={{ alignItems: "stretch", display: "grid", gap: isMobile ? 9 : 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
        {steps.map((step, index) => (
          <div key={step.id} style={{ display: "grid", gap: isMobile || index === steps.length - 1 ? 0 : 8, gridTemplateColumns: isMobile || index === steps.length - 1 ? "1fr" : "minmax(0, 1fr) 14px" }}>
            <StepCard step={step} active={activeId === step.id} onClick={() => setActiveId(step.id)} lang={lang} t={t} />
            {!isMobile && index < steps.length - 1 ? <div style={{ alignItems: "center", color: t.faint, display: "flex", justifyContent: "center" }}>→</div> : null}
          </div>
        ))}
      </div>
    </section>
  )
}
