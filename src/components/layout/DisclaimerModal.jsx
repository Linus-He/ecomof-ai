import { useEffect, useRef } from "react"
import { useT, useLang, useViewport } from "../../contexts"
import { FONT_SANS } from "../../constants/theme"
import { BrandMark } from "../ui"

const DISCLAIMER_SECTIONS = [
  {
    key: "prototype",
    titleEn: "Research prototype status",
    titleZh: "科研原型声明",
    bodyEn: "EcoMOF-AI is an early-stage research prototype. It is not a validated scientific database, final prediction engine, or substitute for experimental verification.",
    bodyZh: "EcoMOF-AI 是一个早期科研原型，不是已验证科学数据库、最终预测工具，也不能替代实验验证。",
    tagsEn: ["early-stage prototype", "not final prediction", "not experimental replacement"],
    tagsZh: ["早期科研原型", "非最终预测", "不替代实验"],
  },
  {
    key: "data",
    titleEn: "Data status",
    titleZh: "数据状态声明",
    bodyEn: "Demo data, real-seed records, schema-only templates, public literature records, and collaborator-private records have different meanings and should not be interpreted as equivalent evidence.",
    bodyZh: "演示数据、真实种子记录、仅字段结构模板、公开文献记录和合作者保密数据具有不同含义，不应被视为同等证据。",
    tagsEn: ["demo data", "real seed", "schema-only", "public literature", "collaborator private"],
    tagsZh: ["演示数据", "真实种子", "仅字段结构", "公开文献", "合作者保密数据"],
  },
  {
    key: "scoring",
    titleEn: "Performance and scoring",
    titleZh: "性能与评分声明",
    bodyEn: "Scores, rankings, and prioritization views are rule-assisted references based on available descriptors and curation status. They are not validated material performance conclusions.",
    bodyZh: "评分、排序和优先级视图是基于当前可用描述符和数据整理状态的规则辅助参考，不代表已验证材料性能结论。",
    tagsEn: ["rule-assisted", "descriptor-based", "curation-aware", "not validated performance"],
    tagsZh: ["规则辅助", "基于描述符", "考虑整理状态", "非已验证性能"],
  },
  {
    key: "sustainability",
    titleEn: "Sustainability / LCA boundary",
    titleZh: "可持续性与 LCA 边界",
    bodyEn: "EcoScreen provides early-stage sustainability signals. It does not constitute a complete lifecycle assessment, techno-economic analysis, or industrial deployment assessment.",
    bodyZh: "EcoScreen 提供早期可持续性信号，不构成完整生命周期评价、技术经济分析或工业部署评估。",
    tagsEn: ["early-stage signal", "not complete LCA", "not TEA", "not deployment decision"],
    tagsZh: ["早期信号", "非完整 LCA", "非 TEA", "非工业决策"],
  },
  {
    key: "catalysis",
    titleEn: "Catalysis and machine learning boundary",
    titleZh: "催化与机器学习边界",
    bodyEn: "CatalysisLab organizes reaction tasks, reaction conditions, product metrics, evidence status, and ML-ready fields. It does not claim validated catalytic performance or a trained predictive model.",
    bodyZh: "CatalysisLab 用于整理反应任务、反应条件、产物指标、证据状态和面向机器学习的字段，不声称已验证催化性能，也不声称已有训练好的预测模型。",
    tagsEn: ["catalysis curation", "ML-ready fields", "not trained model", "not validated catalysis"],
    tagsZh: ["催化数据整理", "面向机器学习的字段", "非已训练模型", "非已验证催化性能"],
  },
  {
    key: "confidential",
    titleEn: "Confidential collaborator data",
    titleZh: "合作者保密数据声明",
    bodyEn: "Private or unpublished collaborator data will not be published without explicit permission. Schema-only templates may show fields without revealing real values, identities, institutions, or unpublished results.",
    bodyZh: "合作者提供的未发表或保密数据不会在未经明确同意的情况下公开。仅字段结构模板可以展示字段，而不展示真实数值、身份信息、机构信息或未发表结果。",
    tagsEn: ["no private values", "explicit permission required", "schema-only display", "no unpublished results"],
    tagsZh: ["不展示私密数值", "需明确授权", "仅字段结构展示", "不公开未发表结果"],
  },
]

function DisclaimerCard({ section, zh, t }) {
  const tags = zh ? section.tagsZh : section.tagsEn
  return (
    <article style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: 13,
      minHeight: 0,
    }}>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, lineHeight: 1.35 }}>
        {zh ? section.titleZh : section.titleEn}
      </div>
      <p style={{ color: t.muted, fontSize: 11, lineHeight: 1.68, margin: "8px 0 0" }}>
        {zh ? section.bodyZh : section.bodyEn}
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {tags.map(tag => (
          <span key={tag} style={{
            color: t.subtle,
            background: t.panel,
            border: `1px solid ${t.border}`,
            borderRadius: 999,
            padding: "4px 7px",
            fontSize: 10,
            fontWeight: 760,
            lineHeight: 1.25,
          }}>
            {tag}
          </span>
        ))}
      </div>
    </article>
  )
}

export function DisclaimerModal({ open, onClose }) {
  const t = useT()
  const { lang } = useLang()
  const { isMobile, isNarrow } = useViewport()
  const zh = lang === "zh"
  const closeBtnRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  useEffect(() => {
    if (open && closeBtnRef.current) closeBtnRef.current.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,23,0.58)",
        zIndex: 250,
        overflowY: "auto",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "48px 12px",
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={zh ? "声明与使用边界 / Disclaimer Center" : "Disclaimer Center"}
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(860px, 96vw)",
          maxHeight: "calc(100vh - 96px)",
          overflowY: "auto",
          background: t.panel,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: isMobile ? "20px 16px" : "26px 30px",
          fontFamily: FONT_SANS,
          boxShadow: t.shadowLg,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <BrandMark size={isMobile ? 28 : 32} radius={8} style={{ boxShadow: t.shadowSm, flexShrink: 0 }} />
            <div>
              <div style={{ color: t.accentText, fontSize: 19, fontWeight: 850, lineHeight: 1.2 }}>
                {zh ? "声明与使用边界 / Disclaimer Center" : "Disclaimer Center"}
              </div>
              <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 4, maxWidth: 680 }}>
                {zh
                  ? "集中说明 EcoMOF-AI 的原型状态、数据解读、评分、可持续性、催化、机器学习和合作数据使用边界。"
                  : "Centralized use boundaries for EcoMOF-AI's prototype status, data interpretation, scoring, sustainability, catalysis, machine learning, and collaborator data."}
              </div>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={zh ? "关闭声明弹窗" : "Close disclaimer dialog"}
            style={{
              background: "none",
              border: "none",
              color: t.subtle,
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
              padding: 4,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(2, minmax(0, 1fr))",
          gap: 10,
        }}>
          {DISCLAIMER_SECTIONS.map(section => (
            <DisclaimerCard key={section.key} section={section} zh={zh} t={t} />
          ))}
        </div>
      </div>
    </div>
  )
}
