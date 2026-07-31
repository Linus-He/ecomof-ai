// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { CheckCircle, Database, Function, ShieldWarning } from "@phosphor-icons/react"
import { BlockFormula, fetchDataJson } from "../../shared"
import { MethodInteractiveWorkbench } from "./MethodInteractiveWorkbench"

const text = (lang, zh, en) => lang === "zh" ? zh : en

const FACTOR_LABELS = {
  hostStability: ["主体稳定性", "Host stability"],
  hostPathwaySupport: ["主体路径支持", "Host pathway support"],
  guestActivityCompensation: ["客体活性补偿", "Guest activity compensation"],
  complementarity: ["主客体互补性", "Host-guest complementarity"],
  evidence: ["证据置信度", "Evidence confidence"],
  riskRetentionFactor: ["风险保留系数", "Risk retention"],
  synthesizability: ["合成条件可达性", "Synthesis-condition accessibility"],
  economics: ["经济性代理", "Economics proxy"],
}

function StatusRow({ label, value, note, t }) {
  return (
    <div style={{ borderBottom: `1px solid ${t.border}`, display: "grid", gap: 4, padding: "10px 0" }}>
      <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900 }}>{label}</span>
      <strong style={{ color: t.textStrong, fontSize: 13 }}>{value}</strong>
      {note ? <span style={{ color: t.muted, fontSize: 10.7, lineHeight: 1.5 }}>{note}</span> : null}
    </div>
  )
}

export function CurrentOrganicAcidMethodology({ lang, t }) {
  const [showcase, setShowcase] = useState(null)
  const [spec, setSpec] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([
      fetchDataJson("organic_acid_methodology_showcase_v3_9_10.json", null),
      fetchDataJson("organic_acid_scoring_spec_v3.json", null),
    ]).then(([nextShowcase, nextSpec]) => {
      if (!active) return
      setShowcase(nextShowcase)
      setSpec(nextSpec)
    })
    return () => { active = false }
  }, [])

  const route = showcase?.currentTopRoute
  const factors = useMemo(() => Object.entries(route?.factors || {}), [route])
  const weights = useMemo(() => new Map(spec?.routeScoreWeights || []), [spec])
  const stages = [
    [text(lang, "数据接入", "Data intake"), text(lang, "CoRE 稳定性与结构描述符、FAIR‑MOFs 合成条件、文献／金标准、透明成本表。", "CoRE stability and structure descriptors, FAIR-MOFs synthesis conditions, literature/gold records, and a transparent cost table.")],
    [text(lang, "身份与条件核验", "Identity and condition checks"), text(lang, "结构级连接只接受精确或基础 CSD Refcode；同一 DOI 只说明同文献，不证明同一结构。", "Structure-level links require exact or base CSD Refcodes; a shared DOI indicates an article, not structure identity.")],
    [text(lang, "丰度中性校正", "Abundance-neutral correction"), text(lang, "原始家族条数不得进入得分；条数仅用于经验贝叶斯收缩强度、证据置信度和不确定性。", "Raw family counts cannot enter the score; counts are used only for empirical-Bayes shrinkage, evidence confidence, and uncertainty.")],
    [text(lang, "八因子计算", "Eight-factor calculation"), text(lang, "固定权重、固定零值下限，按加权几何平均聚合；弱项持续作为瓶颈。", "Fixed weights and a fixed zero floor feed a weighted geometric mean, preserving weak factors as bottlenecks.")],
    [text(lang, "审计与解释", "Audit and explanation"), text(lang, "执行重复行不变性、评分规则未变更、描述符消融、排名敏感性与小样本统计功效审查。", "Run duplicate-row invariance, scoring-mutation, descriptor-ablation, ranking-sensitivity, and small-sample power audits.")],
  ]

  return (
    <section id="methodology-organic-acid-final" data-testid="current-organic-acid-methodology" style={{ display: "grid", gap: 14, scrollMarginTop: 118 }}>
      <article id="methodology-oafs-current-formula" style={{ background: t.panel, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
        <header style={{ display: "grid", gap: 6 }}>
          <div style={{ alignItems: "center", color: t.accentText, display: "flex", fontSize: 10.5, fontWeight: 900, gap: 7, textTransform: "uppercase" }}>
            <Function aria-hidden="true" size={17} weight="duotone" />
            {text(lang, "当前正式方法 · V3.9.10", "Current formal method · V3.9.10")}
          </div>
          <h2 style={{ color: t.textStrong, fontSize: 23, lineHeight: 1.18, margin: 0 }}>
            {text(lang, "有机酸主客体互补路径筛选方法", "Organic-acid host–guest complementary pathway screening")}
          </h2>
          <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.68, margin: 0 }}>
            {text(
              lang,
              "当前实现采用可复核的确定性规则评分，不进行模型训练或推理。本页仅保留 V3.9.10 的现行因子、公式和审计边界，已替换的旧版分层称谓与代理公式不再展示。",
              "The current implementation is a reviewable, deterministic white-box score with no model training or inference. Only active V3.9.10 factors, formulas, and audit boundaries remain; superseded tier terminology and proxy formulas are excluded.",
            )}
          </p>
        </header>
        <div style={{ alignItems: "stretch", display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 13 }}>
            <BlockFormula
              math="\mathrm{HGCPS}=\prod_{k=1}^{8}\max(f_k,0.001)^{w_k},\quad \sum_{k=1}^{8}w_k=1"
              fallback="HGCPS = Π max(f_k, 0.001)^w_k; Σw_k = 1"
            />
            <p style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.65, margin: 0 }}>
              {text(lang, "八个因子均在 0–1 范围。加权几何平均不允许高分项完全掩盖低分项；0.001 只用于数值稳定，不代表补造证据。", "All eight factors are bounded to 0–1. The weighted geometric mean prevents strong factors from fully hiding weak ones; 0.001 is only a numerical floor, not fabricated evidence.")}
            </p>
          </div>
          <MethodInteractiveWorkbench groupId="organic-current-hgcps" lang={lang} t={t} />
        </div>
      </article>

      <article id="methodology-oafs-current-factors" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 15, scrollMarginTop: 118 }}>
        <header style={{ display: "grid", gap: 4 }}>
          <div style={{ alignItems: "center", color: t.accentText, display: "flex", fontSize: 10.5, fontWeight: 900, gap: 7, textTransform: "uppercase" }}>
            <Database aria-hidden="true" size={17} weight="duotone" />
            {text(lang, "动态读取当前审计产物", "Live current audit artifact")}
          </div>
          <h3 style={{ color: t.textStrong, fontSize: 18, margin: 0 }}>{text(lang, "八因子、权重与来源职责", "Eight factors, locked weights, and source responsibilities")}</h3>
        </header>
        {factors.length ? (
          <div style={{ display: "grid", gap: "0 14px", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
            {factors.map(([key, value]) => {
              const provenanceKey = ({
                hostStability: "hostStabilityScore",
                hostPathwaySupport: "hostPathwaySupportScore",
                guestActivityCompensation: "guestActivityCompensationScore",
                complementarity: "hostGuestComplementarityScore",
                evidence: "evidenceConfidenceScore",
                riskRetentionFactor: "riskPenalty",
                synthesizability: "synthesizabilityScore",
                economics: "economicScore",
              })[key]
              const provenance = route?.provenance?.[provenanceKey] || {}
              return (
                <StatusRow
                  key={key}
                  label={text(lang, FACTOR_LABELS[key]?.[0] || key, FACTOR_LABELS[key]?.[1] || key)}
                  value={`${Number(value).toFixed(3)} · w=${Number(weights.get(provenanceKey) || weights.get(key) || 0).toFixed(2)}`}
                  note={`${provenance.derivationLevel || text(lang, "派生层级待读取", "derivation pending")} · n=${provenance.nRecords ?? "—"}`}
                  t={t}
                />
              )
            })}
          </div>
        ) : <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "正在读取当前 V3.9.10 审计产物…", "Loading the current V3.9.10 audit artifact…")}</span>}
        {route ? (
          <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 9, color: t.muted, fontSize: 11.5, lineHeight: 1.6, padding: 11 }}>
            <strong style={{ color: t.textStrong }}>{text(lang, "动态示例：", "Artifact-derived example: ")}</strong>
            {route.routeName} · HGCPS {route.finalHGCPS} · {text(lang, "名次", "rank")} {route.ranking}。
            {text(lang, " 该行直接读取生成产物，仅解释一次固定规则运行，不构成实验性能结论。", " This row is read from the generated artifact and explains one locked-rule run; it is not an experimental performance conclusion.")}
          </div>
        ) : null}
      </article>

      <article id="methodology-oafs-current-implementation" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 11, padding: 15, scrollMarginTop: 118 }}>
        <h3 style={{ color: t.textStrong, fontSize: 18, margin: 0 }}>{text(lang, "完整执行过程与功能实现逻辑", "Complete process and function implementation")}</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {stages.map(([title, detail], index) => (
            <div key={title} style={{ alignItems: "start", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 9, gridTemplateColumns: "28px minmax(0,1fr)", padding: 10 }}>
              <span style={{ alignItems: "center", background: t.badgeInfoBg, borderRadius: 999, color: t.accentText, display: "inline-flex", fontSize: 11, fontWeight: 900, height: 25, justifyContent: "center", width: 25 }}>{index + 1}</span>
              <span style={{ display: "grid", gap: 3 }}>
                <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{title}</strong>
                <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>{detail}</span>
              </span>
            </div>
          ))}
        </div>
      </article>

      <article id="methodology-oafs-current-limitations" style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 12, display: "grid", gap: 9, padding: 14, scrollMarginTop: 118 }}>
        <strong style={{ alignItems: "center", color: t.warn, display: "flex", fontSize: 13, gap: 7 }}>
          <ShieldWarning aria-hidden="true" size={18} weight="duotone" />
          {text(lang, "必须保留的限制与验证责任", "Required limitations and validation responsibilities")}
        </strong>
        {[
          text(lang, "FAIR‑MOFs 提供成功合成条件记录，但没有统一失败集或产率；因此“可合成性”只表示条件可达性代理，不是成功概率。", "FAIR-MOFs provides successful synthesis-condition records but no harmonized failure set or yield, so synthesizability is a condition-accessibility proxy, not a success probability."),
          text(lang, "族级描述符与反应表现的相关性样本仅约 10 个家族，统计功效很低；相关方向只作提示，不能确认因果。", "Family-level descriptor correlations use roughly ten families and have very low power; their direction is indicative and not causal."),
          text(lang, "客体活性等字段仍可能处于 fallback；界面必须显示派生层级、记录数、原始引用和缺失原因。", "Guest-activity fields may remain fallback values; the UI must expose derivation level, record count, source citations, and missing reasons."),
          text(lang, "候选排序用于实验与数据补全优先级，不替代合成验证、催化评价、毒理或工程安全审查。", "Candidate ordering prioritizes experiments and data completion; it does not replace synthesis validation, catalytic evaluation, toxicology, or engineering safety review."),
        ].map(item => (
          <span key={item} style={{ alignItems: "flex-start", color: t.muted, display: "flex", fontSize: 11.7, gap: 7, lineHeight: 1.58 }}>
            <CheckCircle aria-hidden="true" color={t.warn} size={15} style={{ flex: "0 0 auto", marginTop: 2 }} weight="duotone" />
            {item}
          </span>
        ))}
        <a href="https://zenodo.org/records/13254307" target="_blank" rel="noreferrer" style={{ color: t.accentText, fontSize: 11.5, fontWeight: 850 }}>
          {text(lang, "FAIR‑MOFs 原始数据与 CC BY 4.0 许可", "FAIR-MOFs source data and CC BY 4.0 licence")}
        </a>
      </article>
    </section>
  )
}
