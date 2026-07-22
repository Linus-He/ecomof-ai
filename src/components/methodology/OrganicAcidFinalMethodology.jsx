// @ts-nocheck
import { Suspense, lazy, useEffect, useMemo, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { fetchDataJson } from "../../services/dataService"
import { MethodologySectionSkeleton } from "./MethodologySkeleton"
import { runOrganicAcidFinalScreening } from "../../utils/organicAcidFinalScreening"
import { DescriptorEvidenceMatrix } from "./organic-acid-final/DescriptorEvidenceMatrix"
import { MechanismPathMethodCard } from "./organic-acid-final/MechanismPathMethodCard"
import { MethodologyCitationPanel } from "./organic-acid-final/MethodologyCitationPanel"
import { MethodologyFlowDiagram } from "./organic-acid-final/MethodologyFlowDiagram"
import { MethodologyLimitationsCard } from "./organic-acid-final/MethodologyLimitationsCard"
import { OrganicAcidMethodologyOverview } from "./organic-acid-final/OrganicAcidMethodologyOverview"
import { ExafsFalsificationDiagram, ValidationLoopDiagram } from "./organic-acid-final/ValidationLoopDiagram"
import { ORGANIC_ACID_FEATURE_GROUPS } from "../../utils/organicAcid/organicAcidFeatureSchema"
import { ORGANIC_ACID_SCORING_WEIGHTS, ORGANIC_ACID_SCORE_EQUATION } from "../../utils/organicAcid/organicAcidScoringWeights"
import { ORGANIC_ACID_TASK_DEFINITION } from "../../utils/organicAcid/organicAcidTaskDefinition"
import { buildAlgorithmShowcaseModel } from "../../utils/organicAcidAlgorithmMethodology"
import { AlgorithmShowcaseSection } from "./organic-acid-final/AlgorithmShowcaseSection"

const DataMappingSchemaValidationPanel = lazy(() =>
  import("./organic-acid-final/DataMappingSchemaValidationPanel").then(module => ({ default: module.DataMappingSchemaValidationPanel })),
)

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function MetricCard({ label, value, t, tone = "info" }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 4, minWidth: 0, padding: 10 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color: tone === "warn" ? t.warn : t.textStrong, fontSize: 18, lineHeight: 1.1 }}><ChemicalText value={value} /></strong>
    </article>
  )
}

function AlgorithmClosureMethod({ result, lang, t }) {
  const algorithm = result?.organicAcidAlgorithm || {}
  const mode = ORGANIC_ACID_SCORING_WEIGHTS[algorithm.scoringMode] || ORGANIC_ACID_SCORING_WEIGHTS.formic_acid_priority
  const featureGroups = Object.entries(ORGANIC_ACID_FEATURE_GROUPS)
  const rows = [
    [text(lang, "任务定义", "Task definition"), `${ORGANIC_ACID_TASK_DEFINITION.taskId} · ${ORGANIC_ACID_TASK_DEFINITION.targetProduct}`],
    [text(lang, "目标函数", "Objective function"), ORGANIC_ACID_SCORE_EQUATION],
    [text(lang, "权重来源", "Weight source"), text(lang, "V2.6 集中配置的白盒 MCDA 权重；不是黑盒 ML。", "V2.6 centralized white-box MCDA weights; not black-box ML.")],
    [text(lang, "风险惩罚", "Risk penalty"), text(lang, "collapseRisk、competingPathwayRisk、ambiguityWarnings、missingCriticalFields、syntheticFixtureFlag、低证据、低溯源、条件不兼容与机制未闭合。", "collapseRisk, competingPathwayRisk, ambiguityWarnings, missingCriticalFields, syntheticFixtureFlag, low evidence, low provenance, low condition compatibility, and unverified mechanism support.")],
    [text(lang, "决策追踪", "Decision trace"), "Candidate Loaded -> Feature Availability Check -> Pathway Fit Calculation -> Evidence Adjustment -> Graph Relevance Calculation -> Structure Suitability Calculation -> Risk Penalty Applied -> Validation Readiness Check -> Final Ranking -> Next Experiment Generated"],
    [text(lang, "算法合理性检查", "Sanity check"), algorithm.sanityCheck?.summaryZh || algorithm.sanityCheck?.summary || "pending"],
    [text(lang, "敏感性分析", "Sensitivity analysis"), algorithm.sensitivitySummary?.explanationZh || algorithm.sensitivitySummary?.explanation || "pending"],
  ]

  return (
    <section id="methodology-oafs-algorithm-closure" data-testid="methodology-oafs-algorithm-closure" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Organic Acid Algorithm Closure</span>
        <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "有机酸算法闭环：白盒多指标决策 + 证据修正 + 图论相关性 + 风险惩罚", "Organic Acid Algorithm Closure: white-box MCDA + evidence adjustment + graph relevance + risk penalty")}
        </h3>
      </header>
      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "V2.6 首次把有机酸模块从展示型面板推进为可运行的候选筛选算法闭环。当前不是黑盒 ML，不报告预测精度；输出是 screening priority / algorithmic suggestion / priority validation candidate，仍需实验验证。",
          "V2.6 turns the Organic Acid module from a display panel into a runnable candidate-screening algorithm loop. It is not black-box ML and reports no prediction accuracy; outputs are screening priorities, algorithmic suggestions, and priority validation candidates that still require experimental validation."
        )} />
      </p>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <MetricCard label={text(lang, "当前模式", "Scoring mode")} value={mode?.labelZh || mode?.label || "formic_acid_priority"} t={t} />
        <MetricCard label={text(lang, "候选数量", "Candidate count")} value={String(algorithm.scoringSummary?.candidateCount ?? 0)} t={t} />
        <MetricCard label={text(lang, "Sanity", "Sanity")} value={algorithm.sanityCheck?.passed ? text(lang, "通过", "passed") : text(lang, "需复核", "review")} t={t} tone={algorithm.sanityCheck?.passed ? "info" : "warn"} />
        <MetricCard label={text(lang, "Top 稳定性", "Top stability")} value={algorithm.sensitivitySummary?.topCandidateStability ? text(lang, "稳定", "stable") : text(lang, "会变化", "changes")} t={t} tone={algorithm.sensitivitySummary?.topCandidateStability ? "info" : "warn"} />
      </div>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        {rows.map(([label, value]) => (
          <article key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, padding: 11 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.7 }}>{label}</strong>
            <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.48, overflowWrap: "anywhere" }}><ChemicalText value={value} /></span>
          </article>
        ))}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <strong style={{ color: t.textStrong, fontSize: 12.7 }}>{text(lang, "输入特征 schema", "Input feature schema")}</strong>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
          {featureGroups.map(([group, fields]) => (
            <article key={group} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 10 }}>
              <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{group}</span>
              <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>{fields.join(", ")}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
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

function SmallRealDatasetMethod({ mappingReport, lang, t }) {
  const report = mappingReport || {}
  const rows = [
    [text(lang, "样例边界", "Sample boundary"), text(lang, "只接入小规模人工整理真实样例，不接入全量 CoRE/QMOF。", "Only a small curated real-example sample is integrated; full CoRE/QMOF is not loaded.")],
    [text(lang, "数据质量门", "Data quality gate"), text(lang, "ready-for-scoring 才可计算 HGCPS；needs-review 与 rejected 保持可审计但不进入最终推荐。", "Only ready-for-scoring records can calculate HGCPS; needs-review and rejected records remain auditable but cannot enter final recommendation.")],
    [text(lang, "字段来源", "Field provenance"), text(lang, "缺失来源显示 Pending provenance，不伪造 DOI、citation 或 license。", "Missing sources are shown as Pending provenance; DOI, citation, and license are not fabricated.")],
    [text(lang, "热区投影", "Hot spot projection"), text(lang, "Curated 点用于验证 mapper、quality gate 和 hot spot role display，不证明催化性能。", "Curated points validate mapper, quality gate, and hot spot role display; they do not prove catalytic performance.")],
  ]

  return (
    <section id="methodology-oafs-small-real-dataset" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Small Real Dataset Integration</span>
        <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "小规模真实样例接入", "Small Real Dataset Integration")}
        </h3>
      </header>
      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "V1.6 引入小规模人工整理真实样例，用于验证数据映射、schema validation、quality gate、fieldSources、筛选入口与 Hot Spot Map 是否能承接真实数据形状；V1.7 保持该边界并增加可审计 trace。",
          "V1.6 introduced curated real examples to validate data mapping, schema validation, quality gate, fieldSources, the screening entry, and Hot Spot Map real-data shapes. V1.7 preserves that boundary and adds auditable trace records."
        )} />
      </p>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <MetricCard label={text(lang, "骨架样例", "Framework records")} value={report.frameworkRecords ?? "Pending"} t={t} />
        <MetricCard label="QMOF descriptors" value={report.qmofDescriptorRecords ?? "Pending"} t={t} />
        <MetricCard label={text(lang, "证据记录", "Evidence records")} value={report.evidenceRecords ?? "Pending"} t={t} />
        <MetricCard label={text(lang, "可评分 / 需复核 / 拒绝", "Ready / review / rejected")} value={`${report.readyForScoring ?? "?"} / ${report.needsReview ?? "?"} / ${report.rejected ?? "?"}`} t={t} tone="warn" />
      </div>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {rows.map(([label, value]) => (
          <article key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, padding: 11 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.7 }}>{label}</strong>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.48 }}><ChemicalText value={value} /></span>
          </article>
        ))}
      </div>
      <p style={{ color: t.warn, fontSize: 12.5, fontWeight: 900, lineHeight: 1.52, margin: 0 }}>
        <ChemicalText value={text(lang, report.boundaryZh || "仅小规模人工整理样例；不是全量数据库筛选。", report.boundary || "Small curated sample only. Not full database screening.")} />
      </p>
    </section>
  )
}

function TraceWorkbenchMethod({ lang, t }) {
  return (
    <section id="methodology-oafs-trace-workbench" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Algorithm Trace Workbench</span>
        <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "算法追踪工作台：可审计计算链", "Algorithm Trace Workbench: Auditable Computation Chain")}
        </h3>
      </header>
      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "V1.7 将筛选入口输出扩展为 runId、step-level trace、candidate decision log、formula weight inspector、evidence trace、candidate flow funnel 和 exportable Markdown / JSON report。它解释当前 demo / mapped fixture / curated sample 如何产生推荐，不证明催化性能。",
          "V1.7 expands the screening-entry output into runId, step-level trace records, candidate decision logs, formula weight inspectors, evidence traces, a candidate flow funnel, and exportable Markdown / JSON reports. It explains how the current demo / mapped fixture / curated sample produces a recommendation; it does not prove catalytic performance."
        )} />
      </p>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {[
          [text(lang, "Trace schema", "Trace schema"), "RunTrace / StepTrace / CandidateDecision / FormulaContribution / EvidenceTrace"],
          [text(lang, "导出", "Export"), "Markdown / JSON"],
          [text(lang, "边界", "Boundary"), "auditability and transparency, not proof"],
        ].map(([label, value]) => (
          <article key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 6, padding: 10 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.8 }}>{label}</strong>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}><ChemicalText value={value} /></span>
          </article>
        ))}
      </div>
    </section>
  )
}

function DatabaseIndexPreviewMethod({ lang, t }) {
  const rows = [
    [
      text(lang, "V2.0-L 第一批候选的人工来源核验", "V2.0-L Manual Source Curation for First Verified Candidates"),
      text(lang, "V2.0-L 对最接近 verified metadata 的 5 个候选（MIL-53(Al)、CAU-10(Al)、MIL-100(Al)、MIL-101(Al)、DUT-4(Al)）做人工来源核验，并合并回 V2.0-K 证据回填，输出 enriched 记录/汇总与第一批候选核验报告。离线核验，因此 DOI/license 保持待补，引用仅到材料层级；由于记录号是人工 fixture 标识，每条都保留 ambiguity 警告，verified_metadata 仍为 0。系统首次出现 source_confirmed / citation_ready 候选（4 个）。source_confirmed / citation_ready / license_confirmed 都不等于 verified_metadata，未消解的 ambiguity 警告始终阻断 verified。不伪造任何字段，不是最终推荐。", "V2.0-L performs manual source verification of the 5 candidates nearest to verified metadata (MIL-53(Al), CAU-10(Al), MIL-100(Al), MIL-101(Al), DUT-4(Al)) and merges them back into the V2.0-K evidence backfill as enriched records/summary and a first verified candidate report. Curated offline, so DOI/license stay pending and citations are material-level; because the record ids are curated fixtures, every record keeps an ambiguity warning and verified_metadata is still 0. The system now has its first source_confirmed / citation_ready candidates (4). source_confirmed / citation_ready / license_confirmed are not verified_metadata, and an unresolved ambiguity warning always blocks verified. Nothing is fabricated and it is not a final recommendation."),
    ],
    [
      text(lang, "人工来源核验边界", "Manual source curation boundary"),
      text(lang, "人工来源核验只记录离线判断，不替代 metadata 门控；找不到 DOI/license/来源时保持 pending/unknown/not_available，绝不伪造。verifiedMetadataEligible 只有在 source/citation/license/provenance 已确认（DOI 已核验或 not_available）且无 ambiguity 警告时才为 true。", "Manual source curation records offline judgement only and does not replace the metadata gate; when DOI/license/source cannot be found they stay pending/unknown/not_available and are never fabricated. verifiedMetadataEligible is true only when source/citation/license/provenance are confirmed (DOI verified or not_available) with no ambiguity warning."),
    ],
    [
      text(lang, "V2.0-K 证据回填与第一批 verified metadata 候选", "V2.0-K Evidence Backfill and First Verified Metadata Candidates"),
      text(lang, "V2.0-K 在 V2.0-I 的 18 条人工整理队列上建立证据回填流程：逐条记录 source/citation/license/DOI/descriptor 溯源状态，新增证据回填汇总、经核验候选报告、证据回填面板与详情抽屉证据区，并把下一步行动与筛选结果面板接入证据回填。不伪造任何字段；verifiedMetadataEligible 只有在 source/citation/license/descriptor 溯源已确认（DOI 已核验或不适用）且通过 metadata gate 时才为 true，因此 verified_metadata 仍为 0，报告诚实显示 no_verified_candidates_yet 并指出最接近经核验的候选。不扩数据库、不训练模型，仍不是最终推荐。", "V2.0-K builds an evidence backfill workflow over the V2.0-I 18-record curation queue: per-candidate source/citation/license/DOI/descriptor-provenance status, an evidence backfill summary, a verified candidate report, an evidence backfill panel, and a detail-drawer evidence section, with the Next Action and Screening Result panels wired to the backfill. Nothing is fabricated; verifiedMetadataEligible is true only when source/citation/license/descriptor provenance are confirmed (DOI verified or not_available) AND the metadata gate passes, so verified_metadata is still 0 and the report honestly shows no_verified_candidates_yet while pointing to the nearest-to-verified candidates. No database expansion, no model training, and still not a final recommendation."),
    ],
    [
      text(lang, "证据回填边界", "Evidence backfill boundary"),
      text(lang, "证据回填只记录人工整理进度，不替代 metadata 门控；source_confirmed / citation_ready / license_confirmed 都不等于 verified_metadata。", "Evidence backfill records manual curation progress only and does not replace the metadata gate; source_confirmed / citation_ready / license_confirmed are not verified_metadata."),
    ],
    [
      text(lang, "V2.0-J 筛选运行体验与结果面板重构", "V2.0-J Screening Run UX and Result Panel Refactor"),
      text(lang, "V2.0-J 不新增算法，而是把筛选器重构为可运行的科研工作台：新增筛选运行台与醒目的“开始筛选审计”按钮、12 步运行过程（含运行中/已完成/需注意/阻断状态）、筛选结果面板（5 组结果 + 通俗结论 + 结果解释）与由汇总驱动的下一步行动面板，并把证据整理与高级审计折叠到次级层级。运行状态机仅读取现有 V2.0-I 汇总，不重算 OACS/DMRS、不执行全量数据库评分、不训练模型；结果仍是仅限预览且不是最终推荐，verified_metadata 仍为 0。", "V2.0-J adds no new algorithm; it refactors the screener into a runnable research workbench: a Screening Run Console with a prominent Run-screening-audit button, a 12-step run progress (running/completed/warning/blocked), a Screening Result Panel (5 result groups + plain-language conclusion + result interpretation), and a summary-driven Next Action panel, with evidence curation and advanced audits collapsed into secondary layers. The run state machine only reads the existing V2.0-I summary; it does not recompute OACS/DMRS, run full database scoring, or train a model; the result stays preview only and not a final recommendation, with verified_metadata still 0."),
    ],
    [
      text(lang, "运行体验边界", "Screening run boundary"),
      text(lang, "运行台只是交互层：点击运行只是把已有审计汇总按步骤呈现，并给出结果解释与下一步行动；它不产生新证据，也不把 preview 结果说成最终推荐。", "The run console is an interaction layer only: clicking run replays the existing audit summary as steps and adds interpretation and next actions; it produces no new evidence and never presents the preview result as a final recommendation."),
    ],
    [
      text(lang, "V2.0-I 人工 metadata 整理与来源链接补全", "V2.0-I Manual Metadata Curation and Source-Link Enrichment"),
      text(lang, "V2.0-I 把 V2.0-H 的 18 条核验队列整理为人工 metadata 流程：curation 状态分层（needs_source_review → source_confirmed → citation_ready → license_pending/confirmed → doi_pending → verified_metadata，或 curation_blocked）与整理进度汇总。找不到 DOI/license/来源时保持待补，绝不伪造；source_confirmed / citation_ready / near_verified 都不等于 verified_metadata。verified_metadata 仍需在真实已确认字段上通过 V2.0-E/V2.0-H 门控，因此当前仍为 0。不扩数据库、不训练模型，仍不是最终推荐。", "V2.0-I turns the V2.0-H 18-item verification queue into a manual metadata workflow with curation tiers (needs_source_review -> source_confirmed -> citation_ready -> license_pending/confirmed -> doi_pending -> verified_metadata, or curation_blocked) and progress summaries. When DOI/license/source cannot be found they stay pending and are never fabricated; source_confirmed / citation_ready / near_verified are not verified_metadata. verified_metadata still requires the V2.0-E/V2.0-H gate to pass on real confirmed fields, so it is still 0. No database expansion, no model training, and still not a final recommendation."),
    ],
    [
      text(lang, "来源链接补全边界", "Source-link enrichment boundary"),
      text(lang, "人工整理只记录进度，不替代 metadata 门控；来源、引用、license 与 DOI 仍需逐条核验。", "Manual curation records progress only and does not replace the metadata gate; source, citation, license, and DOI still require record-level verification."),
    ],
    [
      text(lang, "V2.0-H 小样本验证与敏感性审计", "V2.0-H Small-Sample Validation and Sensitivity Audit"),
      text(lang, "V2.0-H 把 V2.0-G 的 120 条样本推进到可审计验证计划：人工 metadata 核验队列、near_verified 分层（仅优先核验，不等于已核验）、确定性敏感性审计、特征消融审计、机制证据回填（文献支持/描述符推断/弱代理/证据不足）与候选验证路线。受 Han et al. 2024 的 筛选→机制解释→验证 闭环启发，仅作方法类比：不复现 Li-S 模型、不训练 XGBoost、不报告模型精度。不扩数据库、不改 OACS/DMRS，仍不是最终推荐。", "V2.0-H pushes the V2.0-G 120-record sample toward an auditable validation plan: a manual metadata verification queue, a near_verified tier (priority review only, not verified), a deterministic sensitivity audit, a feature ablation audit, mechanism evidence backfill (literature_supported / descriptor_inferred / weak_proxy / insufficient_evidence), and a candidate validation roadmap. Inspired by the screen -> mechanism-explain -> validate loop in Han et al. 2024 as a method analogy only: no Li-S model reproduction, no XGBoost training, no model-precision metrics. No database expansion, no OACS/DMRS change, and still not a final recommendation."),
    ],
    [
      text(lang, "near_verified 分层", "near_verified tier"),
      text(lang, "near_verified 表示来源/描述符溯源基本完整、citation 或来源链接至少有一个可用，但 DOI 或 license 仍待核验的候选；它只能进入优先人工核验队列，仍不可作为最终推荐。", "near_verified marks candidates whose source/descriptor provenance is largely complete with at least a citation or source lead, but whose DOI or license is still pending; it only enters the priority manual-review queue and is still not a final recommendation."),
    ],
    [
      text(lang, "V2.0-G 小规模经核验数据库接入 + 多视角描述符门控", "V2.0-G Small-Scale Verified Database Integration + Multi-View Descriptor Gate"),
      text(lang, "V2.0-G 接入一个有界（<= 200 条）小规模经核验样本，让部分候选从仅限预览推进到 partial_metadata（DOI/license 仍待核验，未伪造）。新增描述符冗余门控（方差/缺失率/Pearson 相关，标记但不删除）、机制代理层（描述符 → CO₂→有机酸机制代理，证据不足返回 null）与算法改进追踪。受 Han et al. 2024（10.1038/s41467-024-52550-9）多视角特征工程启发，仅作方法类比：不复现其 Li-S 模型、不使用 Li-S 目标变量、不训练 XGBoost、不报告模型精度指标。OACS/DMRS 公式未修改。", "V2.0-G integrates a bounded (<= 200 record) small verified sample and advances part of it from preview only to partial_metadata (DOI/license still pending, not fabricated). It adds a descriptor redundancy gate (variance/missingness/Pearson, flag-not-delete), a mechanism proxy layer (descriptors -> CO2->organic-acid proxies, null on insufficient evidence), and an algorithm improvement trace. Inspired by the multi-view feature engineering in Han et al. 2024 (10.1038/s41467-024-52550-9) as a method analogy only: no reproduction of their Li-S model, no Li-S target variables, no XGBoost training, and no model-precision metrics reported. OACS/DMRS formulas are unchanged."),
    ],
    [
      text(lang, "Han et al. 2024 借鉴边界", "Han et al. 2024 adaptation boundary"),
      text(lang, "仅借鉴 limited dataset 下的多视角特征工程、filter/wrapper/embedded 分层特征选择思想、Pearson 冗余过滤与集合/协同描述符思路；不复现 Li-S 电池模型，不使用其数据与目标变量，不训练黑盒 ML，不声称达到其预测性能。", "We borrow only the ideas of multi-view feature engineering under a limited dataset, layered filter/wrapper/embedded selection, Pearson redundancy filtering, and ensemble/synergy descriptors; we do not reproduce the Li-S battery model, do not use its data or target variables, do not train black-box ML, and do not claim its predictive performance."),
    ],
    [
      text(lang, "V2.0-F 后台预计算管线规划", "V2.0-F Background Precompute Pipeline Planning"),
      text(lang, "V2.0-F 规划大规模候选的预计算流程：原始记录 → 归一化 → metadata 门控 → 描述符检查 → OACS/DMRS 试算 → Top-N 预览。V2.0-F 不接入全量数据库，也不是经完整验证的筛选；全量评分仍需在完成来源核验和描述符复算后进行。", "V2.0-F plans precomputation for large candidate sets: raw records -> normalization -> metadata gate -> descriptor check -> OACS/DMRS trial scoring -> Top-N preview. V2.0-F does not integrate the full database and is not full verified screening; full scoring still requires source verification and descriptor recomputation."),
    ],
    [
      text(lang, "预计算检查", "Precompute check"),
      text(lang, "预计算检查只统计 Top-N 预览样本的 metadata 核验状态与描述符完整度；不扩展数据源、不产生最终推荐。", "The precompute check only summarizes metadata verification status and descriptor completeness for Top-N preview candidates; it does not expand data sources or produce final recommendations."),
    ],
    [
      text(lang, "V2.0-E 经核验 metadata 补全流程", "V2.0-E Verified Metadata Enrichment Workflow"),
      text(lang, "V2.0-E 在 V2.0-D 评分边界之上新增 metadata 核验门控：对 DOI、来源链接、license、引用与描述符溯源建模核验状态。缺关键 metadata 的候选只能停留在仅限预览，必须通过 metadata 门控才能进入经核验推荐。V2.0-E 不修改 OACS/DMRS 公式，也不在交互页面内即时执行全量数据库评分。", "V2.0-E adds a metadata verification gate on top of the V2.0-D scoring boundary: it models verification status for DOI, source link, license, citation, and descriptor provenance. Candidates missing key metadata stay preview only and must pass the metadata gate before becoming eligible for verified recommendation. V2.0-E does not modify OACS/DMRS formulas and does not run immediate full-database scoring inside the interactive page."),
    ],
    [
      text(lang, "Metadata 核验门控", "Metadata verification gate"),
      text(lang, "门控将候选分为 metadata 已核验 / 部分完整 / 仅限预览 / 暂不可用，并给出阻断原因与提示；只有 metadata 已核验的候选 verifiedRecommendationEligible 为真。本轮只做状态建模与门控，不进行联网 DOI 核验。", "The gate classifies candidates as verified / partial / preview-only / blocked metadata with blocking reasons and warnings; only verified-metadata candidates are verifiedRecommendationEligible. This release models status and gating only and does not run live DOI verification."),
    ],
    [
      text(lang, "验证审计", "Validation audit"),
      text(lang, "新增独立验证审计，覆盖关键计算、页面构建和视觉检查，避免只依赖本地人工查看。", "Adds an independent validation audit covering key calculations, page build readiness, and visual checks so review is not local-only."),
    ],
    [
      text(lang, "V2.0-D 大规模评分边界", "V2.0-D Large-Scale Scoring Boundary"),
      text(lang, "V2.0-D 在 V2.0-C 工作台上明确大规模评分边界：只对当前审阅范围或用户主动选择的小批量候选做试算。", "V2.0-D clarifies the large-scale scoring boundary on top of the V2.0-C workbench: trial scoring is limited to the current review scope or user-selected small batches."),
    ],
    [
      text(lang, "为什么不直接给出全库最终排序", "Why the full database is not ranked as a final result"),
      text(lang, "CoRE/QMOF 级别数据库规模较大，全库最终排序需要完整来源核验、描述符复算、方法审计和实验/文献验证；当前界面只提供可审阅的候选预览。", "CoRE/QMOF-scale databases are large, and final full-database ranking requires source verification, descriptor recomputation, method audit, and experimental/literature validation; the current interface provides reviewable candidate previews only."),
    ],
    [
      text(lang, "已加载范围试算", "Loaded-scope trial scoring"),
      text(lang, "已加载范围试算只使用当前可见候选，用于检查候选是否满足基础门控；不输出最终验证推荐。", "Loaded-scope trial scoring uses only currently visible candidates to check basic eligibility gates; it does not produce final verified recommendations."),
    ],
    [
      text(lang, "数据摘要", "Data summaries"),
      text(lang, "界面展示数据摘要、CoRE/QMOF 统计、描述符可用性与来源覆盖率。", "The interface shows data summaries, CoRE/QMOF statistics, descriptor availability, and provenance coverage."),
    ],
    [
      "Top-N preview",
      text(lang, "预计算候选只作为 Top-N 预览展示，不是最终验证推荐。", "Precomputed candidates are shown as Top-N preview only, not final verified recommendations."),
    ],
    [
      text(lang, "候选分批审阅", "Candidate batch review"),
      text(lang, "筛选、搜索、排序和分页只作用于当前审阅批次，不把局部预览解释为全库最终结论。", "Filtering, search, sorting, and pagination apply only to the current review batch and do not turn a local preview into a final full-database conclusion."),
    ],
    [
      text(lang, "候选详情", "Candidate details"),
      text(lang, "候选详情展示描述符检查、来源检查、证据边界和缺失证据提示；缺失 DOI/citation/license 显示为证据待核验。", "Candidate details show descriptor checks, provenance checks, evidence boundaries, and missing-evidence warnings; missing DOI/citation/license is shown as evidence pending."),
    ],
    [
      text(lang, "为什么不展示全库最终结论", "Why the full-database conclusion is not shown"),
      text(lang, "当前界面保持数据摘要、Top-N 预览、候选批次与候选详情的审阅边界，不把未完整核验的数据扩展为最终全库评分。", "The current interface keeps the review boundary at data summaries, Top-N previews, candidate batches, and candidate details; it does not turn incompletely verified data into final full-database scoring."),
    ],
    [
      "Top-N preview vs full verified screening",
      text(lang, "Top-N 预览是离线预计算索引预览，用于解释候选进入预览的原因；经完整验证的全量数据库筛选仍需要完整来源核验、描述符复算、HGCPS 公式审计和实验/文献验证。", "Top-N preview is an offline precomputed index preview used to explain why a candidate appears in the preview; full verified database screening still requires source verification, descriptor recomputation, HGCPS formula audit, and experimental/literature validation."),
    ],
    [
      "Candidate Compare boundary",
      text(lang, "候选对比最多对比 3 个已加载候选，字段来自当前预览/索引数据；对比仅基于当前已加载的预览/索引数据。", "Candidate Compare compares up to 3 loaded candidates, with fields from the current preview/index data; comparison is based on currently loaded preview/index data only."),
    ],
    [
      text(lang, "评分审计追踪", "Scoring Audit Trace"),
      text(lang, "审计追踪记录运行范围、输入记录数、已评分数、跳过数、跳过原因、公式版本、边界与非最终状态，用于复核而不是最终推荐。", "The audit trace records scoring scope, input count, scored count, skipped count, skipped reasons, formula version, boundary, and not-final status for reviewability, not final recommendation."),
    ],
  ]
  return (
    <section id="methodology-oafs-database-index-preview" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Database Index Preview</span>
        <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "数据库索引预览：V2.0-L 第一批候选的人工来源核验", "Database Index Preview: V2.0-L Manual Source Curation for First Verified Candidates")}
        </h3>
      </header>
      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "V2.0-L 在 V2.0-K 之上对最接近 verified metadata 的 5 个候选做人工来源核验，并合并回证据回填，输出 enriched 记录/汇总与第一批候选核验报告。浏览器仍只加载 manifest 摘要、预计算候选预览、选定索引分片和按需详情记录；离线核验使 DOI/license 保持待补，引用为材料层级，每条保留 ambiguity 警告，verified_metadata 仍为 0；系统首次出现 source_confirmed / citation_ready 候选；不扩数据库、不训练模型。",
          "V2.0-L performs manual source verification of the 5 candidates nearest to verified metadata on top of V2.0-K and merges them into the evidence backfill as enriched records/summary and a first verified candidate report. The browser still loads only manifest summaries, precomputed candidate previews, selected index parts, and detail records on demand; offline curation keeps DOI/license pending, citations are material-level, every record keeps an ambiguity warning, and verified_metadata is still 0; the system now has its first source_confirmed / citation_ready candidates; no database expansion and no model trained."
        )} />
      </p>
      <details style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px 12px" }}>
        <summary style={{ color: t.accentText, cursor: "pointer", fontSize: 12.5, fontWeight: 900 }}>
          {text(lang, `历史变更沿革（${rows.length} 条，V2.0 阶段；默认折叠）`, `Historical change log (${rows.length} entries, V2.0 stage; collapsed by default)`)}
        </summary>
        <p style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 11.8, lineHeight: 1.5, margin: "10px 0 0", padding: "8px 10px" }}>
          {text(lang, "以下为历史沿革，保留当年原文（部分版本使用 OACS/DMRS 等旧术语）；当前算法为 HGCPS 加权几何均值（8 因子），见上方算法展示。", "The entries below are historical and keep their original wording (some versions used legacy terms such as OACS/DMRS); the current algorithm is HGCPS — a weighted geometric mean over 8 factors (see the Algorithm Showcase above).")}
        </p>
        <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 10 }}>
          {rows.map(([label, value]) => (
            <article key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, padding: 11 }}>
              <strong style={{ color: t.textStrong, fontSize: 12.7 }}>{label}</strong>
              <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.48 }}><ChemicalText value={value} /></span>
            </article>
          ))}
        </div>
      </details>
      <p style={{ color: t.warn, fontSize: 12.5, fontWeight: 900, lineHeight: 1.52, margin: 0 }}>
        <ChemicalText value={text(lang, "V2.0-L 仍然不是经完整验证的全量数据库筛选；它做人工来源核验并产生第一批 source_confirmed / citation_ready 候选，但每条都保留 ambiguity 警告且 license/DOI 待补，因此 verified_metadata 仍为 0，未训练任何模型，OACS/DMRS 公式未在 V2.0-L 中修改。经完整验证的全量筛选仍需联网消歧、DOI/license 确认、描述符复算、公式审计与实验/文献验证。", "V2.0-L remains a manual source curation step, not full verified database screening; it yields the first source_confirmed / citation_ready candidates but every record keeps an ambiguity warning with license/DOI pending, so verified_metadata is still 0, no model is trained, and OACS/DMRS formulas are unchanged in V2.0-L. Full verified screening still requires online disambiguation, DOI/license confirmation, descriptor recomputation, formula audit, and experimental/literature validation.")} />
      </p>
    </section>
  )
}

function LazyMethodologyDetails({ id, title, titleZh, summary, summaryZh, defaultOpen = false, lang, t, children }) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return defaultOpen
    const hash = String(window.location.hash || "").replace(/^#/, "")
    return defaultOpen || hash === id
  })
  const [loaded, setLoaded] = useState(open)
  const handleToggle = event => {
    const nextOpen = event.currentTarget.open
    setOpen(nextOpen)
    if (nextOpen) setLoaded(true)
  }
  useEffect(() => {
    if (typeof window === "undefined") return undefined
    const onHash = () => {
      const hash = String(window.location.hash || "").replace(/^#/, "")
      if (hash === id) {
        setOpen(true)
        setLoaded(true)
        window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80)
      }
    }
    onHash()
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [id])
  return (
    <details id={id} open={open} onToggle={handleToggle} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 12, scrollMarginTop: 118 }}>
      <summary style={{ color: t.textStrong, cursor: "pointer", fontSize: 15, fontWeight: 940, lineHeight: 1.25 }}>
        {text(lang, titleZh, title)}
        <span style={{ color: t.muted, display: "block", fontSize: 12, fontWeight: 650, lineHeight: 1.45, marginTop: 4 }}>
          <ChemicalText value={text(lang, summaryZh, summary)} />
        </span>
      </summary>
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {loaded ? children : <MethodologySectionSkeleton lang={lang} t={t} title={title} titleZh={titleZh} />}
      </div>
    </details>
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
      body: "Synergy Map combines the current top-route host with candidate guest metals to visualize the data-derived Mo primary hypothesis and W backup hypothesis (no preset winner).",
      bodyZh: "Synergy Map 将当前 top route 的主体与候选客体金属组合，可视化由数据派生的 Mo 主要假设与 W 备选假设（不预设赢家）。",
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
        <a href="#methodology-knowledge-base" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.accentText, fontSize: 12, fontWeight: 900, padding: "7px 10px", textDecoration: "none" }}>
          {text(lang, "打开知识库", "Open Knowledge Base")}
        </a>
      </header>

      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "本节将 HGCPS 主客体路线评分工作流转化为耦合描述符设计空间。受几何-电子耦合催化剂设计思想启发，热区图不新增科学结论，而是可视化主体稳健性与客体金属活性位点价值如何共同定义当前高优先级设计区域。",
          "This section translates the HGCPS host-guest route-scoring workflow into a coupled descriptor design space. Inspired by geometric-electronic coupled catalyst design, the hot spot map does not introduce new scientific claims; it visualizes how host robustness and guest-metal active-site value jointly define the current high-priority design region."
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
        <MetricCard label="Host structural proxy (legacy)" value={result?.selectedFramework?.organicAcidScore?.oacs ?? "Pending"} t={t} />
        <MetricCard label="Mo role" value="primary hypothesis" t={t} />
        <MetricCard label="W role" value="backup hypothesis" t={t} />
        <MetricCard label="Hot spot threshold" value={`${result?.hotSpotRegion?.xMin ?? 0.65} / ${result?.hotSpotRegion?.yMin ?? 0.65} / ${result?.hotSpotRegion?.synergyMin ?? 0.6}`} t={t} />
      </div>

      <p style={{ color: t.warn, fontSize: 12.5, fontWeight: 900, lineHeight: 1.52, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "本热区图是一个假设生成视图，使用历史结构代理描述符（已被数据驱动的 HGCPS 路线评分取代，见“算法”一节），尚未基于 DFT 标注的反应性能数据训练。因此它应被理解为假设生成工具，而不是性能预测模型。",
          "This hot spot map is a hypothesis-generation view built on legacy structural proxy descriptors (superseded by the data-derived HGCPS route scoring in the Algorithm section) and is not trained on DFT-labeled reaction performance. It should be read as a hypothesis-generation tool, not a performance-prediction model."
        )} />
      </p>
    </section>
  )
}

function KnowledgeBaseMethod({ lang, t }) {
  return (
    <section id="methodology-oafs-knowledge-base" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 11, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Knowledge Base</span>
          <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
            {text(lang, "知识库：版本、文献与证据边界", "Knowledge Base: Versions, Literature, and Evidence Boundaries")}
          </h3>
        </div>
        <a href="#methodology-knowledge-base" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.accentText, fontSize: 12, fontWeight: 900, padding: "7px 10px", textDecoration: "none" }}>
          {text(lang, "打开知识库", "Open Knowledge Base")}
        </a>
      </header>
      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "知识库记录每一项工作流设计背后的文献灵感来源，包括哪些思想被迁移、哪些结论没有被直接转用，以及哪些证据仍处于待核状态。",
          "The Knowledge Base records the literature inspirations behind each workflow decision, including which ideas were adapted, which claims were not transferred, and which evidence remains pending."
        )} />
      </p>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {[
          [text(lang, "已核验来源", "Verified source"), "Nature Communications 2025 hot spot map paper"],
          [text(lang, "文献库", "Literature Library"), "5 unique records from 6 uploaded files"],
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
  const [data, setData] = useState({
    frameworks: [],
    metals: [],
    rules: {},
    evidenceRecords: [],
    mappingReport: null,
    scoringSpecV1: {},
    scoringSpecV2: {},
    methodologyShowcase: {},
    priceTable: {},
  })
  const [status, setStatus] = useState("loading")

  useEffect(() => {
    let active = true
    setStatus("loading")
    Promise.all([
      fetchDataJson("organic_acid_final_screening/al_mof_framework_candidates.json", [], { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/dopant_metal_property_matrix.json", [], { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/organic_acid_screening_rules.json", {}, { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/organic_acid_evidence_records.json", [], { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/curated_real_examples/real_data_mapping_report.json", {}, { throwOnError: true }),
      fetchDataJson("organic_acid_scoring_spec_v1.json", {}, { throwOnError: true }),
      fetchDataJson("organic_acid_scoring_spec_v2.json", {}, { throwOnError: true }),
      fetchDataJson("organic_acid_methodology_showcase_v3_9_8.json", {}, { throwOnError: true }),
      fetchDataJson("metal_precursor_cost_table.json", {}, { throwOnError: true }),
    ]).then(([frameworkRows, metalRows, ruleConfig, evidenceRows, mappingReport, scoringSpecV1, scoringSpecV2, methodologyShowcase, priceTable]) => {
      if (!active) return
      setData({
        frameworks: Array.isArray(frameworkRows) ? frameworkRows : [],
        metals: Array.isArray(metalRows) ? metalRows : [],
        rules: ruleConfig || {},
        evidenceRecords: Array.isArray(evidenceRows) ? evidenceRows : [],
        mappingReport: mappingReport || {},
        scoringSpecV1: scoringSpecV1 || {},
        scoringSpecV2: scoringSpecV2 || {},
        methodologyShowcase: methodologyShowcase || {},
        priceTable: priceTable || {},
      })
      setStatus("loaded")
    }).catch(error => {
      if (!active) return
      console.warn("Organic Acid methodology data could not be loaded.", error)
      setData({ frameworks: [], metals: [], rules: {}, evidenceRecords: [], mappingReport: null, scoringSpecV1: {}, scoringSpecV2: {}, methodologyShowcase: {}, priceTable: {} })
      setStatus("error")
    })
    return () => { active = false }
  }, [])

  const result = useMemo(() => {
    if (status !== "loaded") return null
    return runOrganicAcidFinalScreening(data.frameworks, data.metals, data.rules, data.evidenceRecords)
  }, [data, status])
  const algorithmShowcase = useMemo(() => buildAlgorithmShowcaseModel({
    scoringSpecV1: data.scoringSpecV1,
    scoringSpecV2: data.scoringSpecV2,
    showcaseArtifact: data.methodologyShowcase,
    priceTable: data.priceTable,
  }), [data.methodologyShowcase, data.priceTable, data.scoringSpecV1, data.scoringSpecV2])

  if (status === "loading") return <MethodologySectionSkeleton lang={lang} t={t} title="Organic Acid Final Screening Methodology" titleZh="有机酸最终筛选方法论" />
  if (status === "error" || !result) {
    return (
      <section id="methodology-organic-acid-final-screening" style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 12, color: t.muted, display: "grid", gap: 8, padding: 14, scrollMarginTop: 118 }}>
        <strong style={{ color: t.warn }}>{text(lang, "有机酸方法论数据加载失败", "Organic Acid methodology data failed to load")}</strong>
        <span>{text(lang, "请稍后重试；Methods 其他章节不受影响。", "Please retry later; other Methods sections remain available.")}</span>
      </section>
    )
  }

  return (
    <details id="methodology-organic-acid-final-screening" open style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 14, scrollMarginTop: 118 }}>
      <summary style={{ color: t.textStrong, cursor: "pointer", fontSize: 22, fontWeight: 940, lineHeight: 1.15 }}>
        {text(lang, "有机酸最终筛选方法论", "Organic Acid Final Screening Methodology")}
      </summary>
      <div style={{ display: "grid", gap: 14, marginTop: 13 }}>
        <div style={{ alignItems: "center", background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "space-between", padding: 11 }}>
          <span style={{ color: t.muted, fontSize: 12.4, lineHeight: 1.45 }}>
            {text(lang, "打开知识库，查看 V1.0–V2.0-B 的版本演进、文献灵感来源、方法迁移边界与后续 roadmap。", "Open the Knowledge Base to review V1.0-V2.0-B version history, literature inspirations, method adaptation boundaries, and future roadmap.")}
          </span>
          <a href="#methodology-knowledge-base" style={{ background: t.surface, border: `1px solid ${t.accentText || t.accent}`, borderRadius: 8, color: t.accentText, fontSize: 12, fontWeight: 900, padding: "7px 10px", textDecoration: "none" }}>
            {text(lang, "打开知识库", "Open Knowledge Base")}
          </a>
        </div>
        <OrganicAcidMethodologyOverview lang={lang} t={t} coverage={result.evidenceCoverage} />
        <MethodologyFlowDiagram flow={result.methodologyFlowData} lang={lang} t={t} />
        <AlgorithmShowcaseSection model={algorithmShowcase} lang={lang} t={t} />
        <AlgorithmClosureMethod result={result} lang={lang} t={t} />
        <LazyMethodologyDetails id="methodology-oafs-data-mapping" title="Data Mapping and Format Validation" titleZh="数据映射与格式校验" summary="Data mapping, format checks, and quality gates." summaryZh="数据映射、格式校验与质量门控。" lang={lang} t={t}>
          <Suspense fallback={<MethodologySectionSkeleton lang={lang} t={t} title="Data Mapping and Format Validation" titleZh="数据映射与格式校验" />}>
            <DataMappingSchemaValidationPanel lang={lang} t={t} />
          </Suspense>
        </LazyMethodologyDetails>
        <LazyMethodologyDetails id="methodology-oafs-small-real-dataset" title="Small Real Dataset Integration" titleZh="小规模真实样例接入" summary="Small curated sample, quality gate, field provenance, and hot spot projection." summaryZh="小规模样例、质量门、字段来源与热区投影。" lang={lang} t={t}>
          <SmallRealDatasetMethod mappingReport={data.mappingReport} lang={lang} t={t} />
        </LazyMethodologyDetails>
        <TraceWorkbenchMethod lang={lang} t={t} />
        <LazyMethodologyDetails id="methodology-oafs-database-index-preview" title="Database Index Preview" titleZh="数据库索引预览" summary="V2.0-L reviews the 5 candidates nearest to verified metadata and marks the first source_confirmed / citation_ready candidates; DOI/license gaps and ambiguity warnings still block verified metadata." summaryZh="V2.0-L 对最接近 verified metadata 的 5 个候选做人工来源核验，首次产生 source_confirmed / citation_ready 候选；DOI/license 缺口和 ambiguity 警告仍会阻断 verified metadata。" lang={lang} t={t}>
          <DatabaseIndexPreviewMethod lang={lang} t={t} />
        </LazyMethodologyDetails>
        <MechanismPathMethodCard lang={lang} t={t} />
        <LazyMethodologyDetails id="methodology-oafs-hot-spot" title="Coupled Descriptor Hot Spot Map" titleZh="耦合描述符热区图" summary="Shows where coupled descriptors concentrate and which evidence supports the pattern." summaryZh="查看耦合描述符的集中区域及其证据支撑。" lang={lang} t={t}>
          <CoupledHotSpotMethod result={result} lang={lang} t={t} />
        </LazyMethodologyDetails>
        <KnowledgeBaseMethod lang={lang} t={t} />
        <LazyMethodologyDetails id="methodology-oafs-robustness" title="Robustness Audit" titleZh="稳健性审计" summary="Weight perturbation and Mo audit interpretation." summaryZh="权重扰动与 Mo 审计解释。" lang={lang} t={t}>
          <RobustnessAuditMethod result={result} lang={lang} t={t} />
        </LazyMethodologyDetails>
        <LazyMethodologyDetails id="methodology-oafs-evidence-matrix" title="Evidence Strength Matrix" titleZh="证据强度矩阵" summary="Compares evidence strength across descriptors and pathway steps." summaryZh="比较不同描述符与路径步骤的证据强度。" lang={lang} t={t}>
          <DescriptorEvidenceMatrix rows={result.evidenceStrengthMatrix} coverage={result.evidenceCoverage} lang={lang} t={t} />
        </LazyMethodologyDetails>
        <ExafsFalsificationDiagram signature={result.exafsSignature} lang={lang} t={t} />
        <ValidationLoopDiagram validation={result.validationLoopData} lang={lang} t={t} />
        <MethodologyLimitationsCard lang={lang} t={t} />
        <MethodologyCitationPanel coverage={result.evidenceCoverage} lang={lang} t={t} />
      </div>
    </details>
  )
}
