// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { BasisBadge, ChemicalText, CopyLinkButton, fetchDataJson } from "../../../shared"
import { ModulePageHeader } from "../../module/ModuleTop"
import { runOrganicAcidFinalScreening } from "../../../utils/organicAcidFinalScreening"
import { AlMofFrameworkRanking } from "./AlMofFrameworkRanking"
import { BlindBaselinePanel } from "./BlindBaselinePanel"
import { DopantMetalRecommendationMatrix } from "./DopantMetalRecommendationMatrix"
import { ExafsPredictionPanel } from "./ExafsPredictionPanel"
import { ExperimentalValidationRoadmap } from "./ExperimentalValidationRoadmap"
import { LimitationsAndReproducibility } from "./LimitationsAndReproducibility"
import { MethodologyLink, MiniMetric, text } from "./FinalScreeningShared"
import { ReactionConstraintBuilder } from "./ReactionConstraintBuilder"
import { SensitivityAndBaselinePanel } from "./SensitivityAndBaselinePanel"
import { WhyMoWaterfall } from "./WhyMoWaterfall"

function LoadingPanel({ lang, t }) {
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 13, lineHeight: 1.55, padding: 16 }}>
      {text(lang, "正在加载 Organic Acid Final Screening 数据...", "Loading Organic Acid Final Screening data...")}
    </section>
  )
}

function ErrorPanel({ lang, t }) {
  return (
    <section style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.warn, fontSize: 13, lineHeight: 1.55, padding: 16 }}>
      {text(lang, "Organic Acid Final Screening 数据暂时无法加载。", "Organic Acid Final Screening data could not be loaded.")}
    </section>
  )
}

export function OrganicAcidFinalScreening({ lang, t, isMobile, onBack }) {
  const [frameworks, setFrameworks] = useState([])
  const [metals, setMetals] = useState([])
  const [rules, setRules] = useState(null)
  const [status, setStatus] = useState("loading")

  useEffect(() => {
    let active = true
    setStatus("loading")
    Promise.all([
      fetchDataJson("organic_acid_final_screening/al_mof_framework_candidates.json", [], { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/dopant_metal_property_matrix.json", [], { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/organic_acid_screening_rules.json", {}, { throwOnError: true }),
    ])
      .then(([frameworkRows, metalRows, ruleConfig]) => {
        if (!active) return
        setFrameworks(Array.isArray(frameworkRows) ? frameworkRows : [])
        setMetals(Array.isArray(metalRows) ? metalRows : [])
        setRules(ruleConfig || {})
        setStatus("loaded")
      })
      .catch(error => {
        if (!active) return
        console.warn("Organic Acid Final Screening data could not be loaded.", error)
        setFrameworks([])
        setMetals([])
        setRules({})
        setStatus("error")
      })
    return () => { active = false }
  }, [])

  const result = useMemo(() => {
    if (status !== "loaded") return null
    return runOrganicAcidFinalScreening(frameworks, metals, rules || {})
  }, [frameworks, metals, rules, status])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, margin: "0 auto", maxWidth: 1280, minWidth: 0, padding: isMobile ? "0 2px" : 0 }}>
      <ModulePageHeader
        title={text(lang, "Organic Acid Final Screening", "Organic Acid Final Screening")}
        subtitle={text(
          lang,
          "Al-MOF 稳定骨架筛选 + 第二金属推荐；Mo 作为缺陷锚定 / 孔道限域活性位点假设输出，而不是直接检索条件。",
          "Al-MOF stable scaffold mining plus second-metal recommendation; Mo appears as a defect-anchored / pore-confined active-site hypothesis, not a direct retrieval condition."
        )}
        action={
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
            <BasisBadge tone="proxy">demo / seed / literature-derived</BasisBadge>
            <MethodologyLink lang={lang} t={t} />
            <CopyLinkButton hash="catalysis-organic-acid-final-screening" ariaLabel={text(lang, "复制最终筛选链接", "Copy final screening link")} />
            <button
              type="button"
              onClick={onBack}
              style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 34, padding: "7px 11px" }}
            >
              {text(lang, "返回 Catalysis Lab", "Back to Catalysis Lab")}
            </button>
          </div>
        }
      />

      <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, display: "grid", gap: 5, fontSize: 12.5, lineHeight: 1.55, padding: "11px 13px" }}>
        <strong style={{ color: t.textStrong, fontSize: 12.5 }}>
          {text(lang, "数据状态：演示级闭环，不是已验证催化剂预测", "Data status: demonstration loop, not validated catalyst prediction")}
        </strong>
        <ChemicalText value={text(
          lang,
          "页面展示反应约束 -> Al-MOF 骨架筛选 -> 第二金属推荐 -> Why Mo -> 稳健性 -> 盲测基线 -> EXAFS 可证伪预测 -> 实验验证路线。",
          "The page shows reaction constraints -> Al-MOF framework mining -> dopant recommendation -> Why Mo -> robustness -> blind baselines -> EXAFS falsification -> experimental validation roadmap."
        )} />
      </section>

      {status === "loading" ? <LoadingPanel lang={lang} t={t} /> : null}
      {status === "error" ? <ErrorPanel lang={lang} t={t} /> : null}

      {result ? (
        <>
          <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
            <MiniMetric label={text(lang, "Al-MOF candidates", "Al-MOF candidates")} value={frameworks.length} t={t} />
            <MiniMetric label={text(lang, "Metal pool", "Metal pool")} value={metals.length} t={t} />
            <MiniMetric label={text(lang, "Selected scaffold", "Selected scaffold")} value={result.selectedFramework?.displayName} t={t} />
            <MiniMetric label="Mo Top 3" value={`${Math.round((result.sensitivity?.targetMetal?.top3Probability || 0) * 100)}%`} t={t} />
          </div>

          <ReactionConstraintBuilder rules={rules} summary={result.hardGateSummary} lang={lang} t={t} isMobile={isMobile} />
          <AlMofFrameworkRanking frameworks={result.rankedFrameworks} selectedFramework={result.selectedFramework} lang={lang} t={t} isMobile={isMobile} />
          <DopantMetalRecommendationMatrix metals={result.rankedMetals} moRecommendation={result.moRecommendation} selectedFramework={result.selectedFramework} lang={lang} t={t} />
          <WhyMoWaterfall moRecommendation={result.moRecommendation} lang={lang} t={t} isMobile={isMobile} />
          <SensitivityAndBaselinePanel sensitivity={result.sensitivity} moRecommendation={result.moRecommendation} rules={rules} lang={lang} t={t} isMobile={isMobile} />
          <BlindBaselinePanel baselines={result.blindBaselineSummary} lang={lang} t={t} isMobile={isMobile} />
          <ExafsPredictionPanel signature={result.exafsSignature} lang={lang} t={t} isMobile={isMobile} />
          <ExperimentalValidationRoadmap rules={rules} lang={lang} t={t} isMobile={isMobile} />
          <LimitationsAndReproducibility statement={result.reproducibilityStatement} lang={lang} t={t} />
        </>
      ) : null}
    </div>
  )
}
