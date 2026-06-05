// @ts-nocheck
import { useMemo } from "react"
import frameworks from "../../../public/data/organic_acid_final_screening/al_mof_framework_candidates.json"
import metals from "../../../public/data/organic_acid_final_screening/dopant_metal_property_matrix.json"
import evidenceRecords from "../../../public/data/organic_acid_final_screening/organic_acid_evidence_records.json"
import rules from "../../../public/data/organic_acid_final_screening/organic_acid_screening_rules.json"
import { ChemicalText } from "../../shared"
import { runOrganicAcidFinalScreening } from "../../utils/organicAcidFinalScreening"
import { DescriptorEvidenceMatrix } from "./organic-acid-final/DescriptorEvidenceMatrix"
import { DataMappingSchemaValidationPanel } from "./organic-acid-final/DataMappingSchemaValidationPanel"
import { FormulaExplainerCard } from "./organic-acid-final/FormulaExplainerCard"
import { MechanismPathMethodCard } from "./organic-acid-final/MechanismPathMethodCard"
import { MethodologyCitationPanel } from "./organic-acid-final/MethodologyCitationPanel"
import { MethodologyFlowDiagram } from "./organic-acid-final/MethodologyFlowDiagram"
import { MethodologyLimitationsCard } from "./organic-acid-final/MethodologyLimitationsCard"
import { OrganicAcidMethodologyOverview } from "./organic-acid-final/OrganicAcidMethodologyOverview"
import { ExafsFalsificationDiagram, ValidationLoopDiagram } from "./organic-acid-final/ValidationLoopDiagram"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export const ORGANIC_ACID_FINAL_DIRECTORY = {
  id: "methodology-organic-acid-final-screening",
  label: "Organic Acid Final Screening Methodology",
  labelZh: "有机酸最终筛选方法论",
  level: 1,
  display: "有机酸最终筛选方法论",
  children: [
    { id: "methodology-oafs-overview", label: "Method Overview", labelZh: "方法总览" },
    { id: "methodology-oafs-flow", label: "Two-Stage Algorithm Flow", labelZh: "两阶段算法流程" },
    { id: "methodology-oafs-data-mapping", label: "Data Mapping and Schema Validation", labelZh: "数据映射与 Schema Validation" },
    { id: "methodology-oafs-oacs", label: "Stage 1: OACS Framework Mining", labelZh: "Stage 1：OACS 骨架筛选" },
    { id: "methodology-oafs-dmrs", label: "Stage 2: DMRS Dopant Recommendation", labelZh: "Stage 2：DMRS 第二金属推荐" },
    { id: "methodology-oafs-hot-spot", label: "Coupled Descriptor Hot Spot Map", labelZh: "耦合描述符热区图" },
    { id: "methodology-oafs-version-docs-literature", label: "Version Docs and Literature Inspiration", labelZh: "版本文档与文献灵感" },
    { id: "methodology-oafs-robustness", label: "Robustness Audit", labelZh: "稳健性审计" },
    { id: "methodology-oafs-evidence-matrix", label: "Evidence Strength Matrix", labelZh: "证据强度矩阵" },
    { id: "methodology-oafs-exafs", label: "EXAFS-Guided Falsification", labelZh: "EXAFS 引导证伪" },
    { id: "methodology-oafs-validation-loop", label: "Experimental Control Loop", labelZh: "实验控制闭环" },
    { id: "methodology-oafs-limitations", label: "Limitations & Reproducibility", labelZh: "限制与复现" },
  ],
}

function MetricCard({ label, value, t, tone = "info" }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 4, minWidth: 0, padding: 10 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color: tone === "warn" ? t.warn : t.textStrong, fontSize: 18, lineHeight: 1.1 }}><ChemicalText value={value} /></strong>
    </article>
  )
}

function RobustnessAuditMethod({ result, lang, t }) {
  const target = result?.sensitivity?.targetMetal || {}
  const rows = [
    {
      title: text(lang, "Weight perturbation", "Weight perturbation"),
      value: `${result?.sensitivity?.perturbationRange || "+/-20%"} · ${result?.sensitivity?.iterations || 1000} iterations`,
      detail: text(lang, "每轮扰动后重新归一化并重排全金属池。", "Every perturbation is normalized and reranks the full metal pool."),
    },
    {
      title: text(lang, "Full-metal distribution", "Full-metal distribution"),
      value: "Mo / W / V / Fe / Ti / Zr",
      detail: text(lang, "竞品金属保持可见，避免把审计收缩成 Mo-only 结论。", "Competitors remain visible so the audit does not collapse into a Mo-only claim."),
    },
    {
      title: text(lang, "Interpretation rule", "Interpretation rule"),
      value: text(lang, "Mo Top 3 >=85% -> robust high-priority", "Mo Top 3 >=85% -> robust high-priority"),
      detail: text(lang, "Mo Top1 100% -> robust but audit-required。", "Mo Top1 100% -> robust but audit-required."),
    },
  ]

  return (
    <section id="methodology-oafs-robustness" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Robustness Audit</span>
        <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "稳健性审计：从推荐结果到可审计假设", "Robustness Audit: From Recommendation to Auditable Hypothesis")}
        </h3>
      </header>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {rows.map(row => (
          <article key={row.title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, minWidth: 0, padding: 11 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{row.title}</span>
            <strong style={{ color: t.textStrong, fontSize: 14, lineHeight: 1.25 }}><ChemicalText value={row.value} /></strong>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.42 }}><ChemicalText value={row.detail} /></span>
          </article>
        ))}
      </div>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <MetricCard label="Mo Top1" value={`${Math.round((target.top1Probability || 0) * 100)}%`} t={t} tone="warn" />
        <MetricCard label="Mo Top3" value={`${Math.round((target.top3Probability || 0) * 100)}%`} t={t} />
        <MetricCard label="Audit status" value={result?.moRobustnessAudit?.label || "audit required"} t={t} tone="warn" />
      </div>
      <p style={{ color: t.warn, fontSize: 12.5, fontWeight: 900, lineHeight: 1.52, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "Mo Top1 100% 不被解释为最终证明，而是标记为“稳健但需审计”。",
          "Mo Top1 100% is not treated as final proof. It is flagged as robust but audit-required."
        )} />
      </p>
    </section>
  )
}

function CoupledHotSpotMethod({ result, lang, t }) {
  const mapRows = [
    {
      title: "Scaffold Map",
      titleZh: "Scaffold Map / 骨架热区",
      body: "Scaffold Map evaluates whether an Al-MOF candidate lies in the region where hydrothermal evidence and C1 intermediate accessibility are jointly favorable.",
      bodyZh: "Scaffold Map 评估 Al-MOF 候选是否位于水热证据与 C1 中间体可及性同时较优的区域。",
    },
    {
      title: "Dopant Map",
      titleZh: "Dopant Map / 金属热区",
      body: "Dopant Map evaluates whether a second metal lies in the region where defect anchoring feasibility and active-site value are jointly favorable.",
      bodyZh: "Dopant Map 评估第二金属是否位于缺陷锚定可行性与活性位点价值同时较优的区域。",
    },
    {
      title: "Synergy Map",
      titleZh: "Synergy Map / 协同热区",
      body: "Synergy Map combines the selected Al-MOF scaffold with candidate dopants to visualize the current Mo primary hypothesis and W backup hypothesis.",
      bodyZh: "Synergy Map 将选定 Al-MOF 骨架与候选第二金属组合，可视化当前 Mo 主要假设与 W 备选假设。",
    },
  ]

  return (
    <section id="methodology-oafs-hot-spot" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Coupled Descriptor Hot Spot Map</span>
          <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
            {text(lang, "耦合描述符热区图", "Coupled Descriptor Hot Spot Map")}
          </h3>
        </div>
        <a href="#methodology-version-docs" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.accentText, fontSize: 12, fontWeight: 900, padding: "7px 10px", textDecoration: "none" }}>
          {text(lang, "查看版本文档", "View version docs")}
        </a>
      </header>

      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "本节将 OACS/DMRS 排序工作流转化为耦合描述符设计空间。受几何-电子耦合催化剂设计思想启发，热区图不新增科学结论，而是可视化骨架稳健性与第二金属活性位点价值如何共同定义当前高优先级设计区域。",
          "This section translates the OACS/DMRS ranking workflow into a coupled descriptor design space. Inspired by geometric-electronic coupled catalyst design, the hot spot map does not introduce new scientific claims; it visualizes how scaffold robustness and second-metal active-site value jointly define the current high-priority design region."
        )} />
      </p>

      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "参考工作以几何描述符和电子描述符构建双原子 ORR 催化剂热区图。EcoMOF-AI 借鉴的是这种设计思想，而不是其 ORR 模型本身；在本项目中，耦合坐标轴被改写为骨架稳健性与第二金属活性位点价值。",
          "The reference work constructs a catalytic hot spot map using a geometric descriptor and an electronic descriptor for diatomic ORR catalysts. EcoMOF-AI borrows this design philosophy, but adapts it to organic-acid-oriented MOF screening using scaffold robustness and dopant active-site value as the coupled axes."
        )} />
      </p>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {mapRows.map(row => (
          <article key={row.title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, padding: 11 }}>
            <strong style={{ color: t.textStrong, fontSize: 13.5 }}><ChemicalText value={text(lang, row.titleZh, row.title)} /></strong>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.48 }}><ChemicalText value={text(lang, row.bodyZh, row.body)} /></span>
          </article>
        ))}
      </div>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <MetricCard label="Selected scaffold OACS" value={result?.selectedFramework?.organicAcidScore?.oacs ?? "Pending"} t={t} />
        <MetricCard label="Mo role" value="primary hypothesis" t={t} />
        <MetricCard label="W role" value="backup hypothesis" t={t} />
        <MetricCard label="Hot spot threshold" value={`${result?.hotSpotRegion?.xMin ?? 0.65} / ${result?.hotSpotRegion?.yMin ?? 0.65} / ${result?.hotSpotRegion?.synergyMin ?? 0.6}`} t={t} />
      </div>

      <p style={{ color: t.warn, fontSize: 12.5, fontWeight: 900, lineHeight: 1.52, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "不同于参考工作，当前 EcoMOF-AI 热区图尚未基于 DFT 标注的反应性能数据训练，而是基于演示级 / 代理 OACS-DMRS 描述符。因此它应被理解为假设生成工具，而不是性能预测模型。",
          "Unlike the reference work, the current EcoMOF-AI hot spot map is not trained on DFT-labeled reaction performance. It is based on demo/proxy OACS-DMRS descriptors and should be interpreted as a hypothesis-generation tool."
        )} />
      </p>
    </section>
  )
}

function VersionDocsLiteratureMethod({ lang, t }) {
  return (
    <section id="methodology-oafs-version-docs-literature" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 11, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Version Docs and Literature Inspiration</span>
          <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
            {text(lang, "版本文档与文献灵感来源", "Version Docs and Literature Inspiration")}
          </h3>
        </div>
        <a href="#methodology-version-docs" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.accentText, fontSize: 12, fontWeight: 900, padding: "7px 10px", textDecoration: "none" }}>
          {text(lang, "查看版本文档", "View version docs")}
        </a>
      </header>
      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "版本文档不仅记录功能更新，也记录每一版设计背后的文献灵感来源。文献条目用于说明概念影响和迁移边界，不表示 EcoMOF-AI 已复现原论文中的计算或实验结果。",
          "Version Docs records not only functional updates, but also the literature inspirations behind each design decision. Literature entries are used to document conceptual influence and adaptation boundaries, not to claim that EcoMOF-AI has reproduced the original paper's computational or experimental results."
        )} />
      </p>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {[
          [text(lang, "已核验来源", "Verified source"), "Nature Communications 2025 hot spot map paper"],
          [text(lang, "待补元数据", "Pending metadata"), "Previous ML/MOF screening and provenance references"],
          [text(lang, "迁移边界", "Adaptation boundary"), "Conceptual inspiration only; no DFT / ML / experimental reproduction claim"],
        ].map(([label, value]) => (
          <article key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 6, padding: 10 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
            <strong style={{ color: t.textStrong, fontSize: 12.8, lineHeight: 1.35 }}><ChemicalText value={value} /></strong>
          </article>
        ))}
      </div>
    </section>
  )
}

export function OrganicAcidFinalMethodology({ lang, t }) {
  const result = useMemo(() => runOrganicAcidFinalScreening(frameworks, metals, rules, evidenceRecords), [])
  const oacsCard = result.formulaCards.find(card => card.id === "oacs")
  const dmrsCard = result.formulaCards.find(card => card.id === "dmrs")

  return (
    <details id="methodology-organic-acid-final-screening" open style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 14, scrollMarginTop: 118 }}>
      <summary style={{ color: t.textStrong, cursor: "pointer", fontSize: 22, fontWeight: 940, lineHeight: 1.15 }}>
        {text(lang, "有机酸最终筛选方法论", "Organic Acid Final Screening Methodology")}
      </summary>
      <div style={{ display: "grid", gap: 14, marginTop: 13 }}>
        <div style={{ alignItems: "center", background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "space-between", padding: 11 }}>
          <span style={{ color: t.muted, fontSize: 12.4, lineHeight: 1.45 }}>
            {text(lang, "查看 V1.0–V1.5 的版本演进、文献灵感来源与后续 roadmap。", "Review the V1.0-V1.5 version history, literature inspirations, and future roadmap.")}
          </span>
          <a href="#methodology-version-docs" style={{ background: t.surface, border: `1px solid ${t.accentText || t.accent}`, borderRadius: 8, color: t.accentText, fontSize: 12, fontWeight: 900, padding: "7px 10px", textDecoration: "none" }}>
            {text(lang, "查看版本文档", "View version docs")}
          </a>
        </div>
        <OrganicAcidMethodologyOverview lang={lang} t={t} coverage={result.evidenceCoverage} />
        <MethodologyFlowDiagram flow={result.methodologyFlowData} lang={lang} t={t} />
        <DataMappingSchemaValidationPanel lang={lang} t={t} />
        <FormulaExplainerCard card={oacsCard} lang={lang} t={t} />
        <FormulaExplainerCard card={dmrsCard} lang={lang} t={t} />
        <MechanismPathMethodCard lang={lang} t={t} />
        <CoupledHotSpotMethod result={result} lang={lang} t={t} />
        <VersionDocsLiteratureMethod lang={lang} t={t} />
        <RobustnessAuditMethod result={result} lang={lang} t={t} />
        <DescriptorEvidenceMatrix rows={result.evidenceStrengthMatrix} coverage={result.evidenceCoverage} lang={lang} t={t} />
        <ExafsFalsificationDiagram signature={result.exafsSignature} lang={lang} t={t} />
        <ValidationLoopDiagram validation={result.validationLoopData} lang={lang} t={t} />
        <MethodologyLimitationsCard lang={lang} t={t} />
        <MethodologyCitationPanel coverage={result.evidenceCoverage} lang={lang} t={t} />
      </div>
    </details>
  )
}
