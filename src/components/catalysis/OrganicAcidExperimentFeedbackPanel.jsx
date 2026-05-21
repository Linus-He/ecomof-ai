import { useEffect, useState } from "react"
import { FONT_MONO } from "../../constants/theme"
import { useLang, useT, useViewport } from "../../contexts"
import { getOrganicAcidExperimentRecords } from "../../services/dataService"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function safeText(value, fallback = "pending") {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "number" && !Number.isFinite(value)) return fallback
  return String(value)
}

function InfoCard({ title, body, t, tone = "normal" }) {
  const warning = tone === "warning"
  return (
    <article style={{ background: warning ? t.badgeWarnBg : t.surface, border: `1px solid ${warning ? t.warn : t.border}`, borderRadius: 8, minWidth: 0, padding: 11 }}>
      <div style={{ color: warning ? t.badgeWarnText : t.textStrong, fontSize: 12.5, fontWeight: 900, lineHeight: 1.35 }}>{title}</div>
      <div style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.6, marginTop: 6 }}>{body}</div>
    </article>
  )
}

function RecordPreview({ record, t }) {
  const provenance = record?.provenance || {}
  const conditions = record?.reactionConditions || {}
  const products = record?.productDistribution || {}
  const stability = record?.postReactionStability || {}
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, minWidth: 0, padding: 11 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{safeText(record?.recordId)}</strong>
        <span style={{ color: t.faint, fontFamily: FONT_MONO, fontSize: 11 }}>{safeText(record?.experimentStatus)}</span>
      </div>
      <div style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.55 }}>
        MOF: {safeText(record?.mofName)} · system: {safeText(record?.reactionSystem)} · solvent: {safeText(conditions.solvent)}
      </div>
      <div style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.55 }}>
        Formic acid: {safeText(products.formicAcidYield)} · lactic acid: {safeText(products.lacticAcidYield)} · carbon balance: {safeText(products.carbonBalance)}
      </div>
      <div style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.55 }}>
        PXRD: {safeText(stability.pxrd)} · FTIR: {safeText(stability.ftir)} · ICP: {safeText(stability.icp)}
      </div>
      <div style={{ borderTop: `1px solid ${t.border}`, color: t.faint, fontSize: 10.8, lineHeight: 1.55, paddingTop: 7 }}>
        source: {safeText(provenance.source)} · date: {safeText(provenance.date)} · operator: {safeText(provenance.operator)} · rawDataFile: {safeText(provenance.rawDataFile)}
      </div>
    </article>
  )
}

export function OrganicAcidExperimentFeedbackPanel({ records: providedRecords, lang: forcedLang, t: tone, isMobile: forcedMobile }) {
  const theme = useT()
  const { lang: contextLang } = useLang()
  const viewport = useViewport()
  const t = tone || theme
  const lang = forcedLang || contextLang
  const isMobile = forcedMobile ?? viewport.isMobile
  const [records, setRecords] = useState(Array.isArray(providedRecords) ? providedRecords : [])

  useEffect(() => {
    if (Array.isArray(providedRecords)) return
    let live = true
    getOrganicAcidExperimentRecords().then(rows => {
      if (live) setRecords(Array.isArray(rows) ? rows : [])
    })
    return () => {
      live = false
    }
  }, [providedRecords])

  const updateRows = [
    [
      text(lang, "甲酸比例提高", "Formic-acid fraction increases"),
      text(lang, "提升 formic-acid-oriented evidence confidence，更新 pathwayPriorityScore，并将相关路径节点标记为 experiment-supported。", "Increase formic-acid-oriented evidence confidence, update pathwayPriorityScore, and mark related pathway nodes as experiment-supported."),
    ],
    [
      text(lang, "竞争产物增加", "Competing products increase"),
      text(lang, "降低 formic acid pathway priority，并标记 competing pathway risk。", "Reduce formic acid pathway priority and mark competing pathway risk."),
    ],
    [
      text(lang, "反应后结构坍塌", "Post-reaction structure degrades"),
      text(lang, "降低 structureFeasibility，并增加 instability penalty。", "Reduce structureFeasibility and add an instability penalty."),
    ],
    [
      text(lang, "HCO₃⁻ 响应明显", "HCO₃⁻ response is observed"),
      text(lang, "增强 HCO₃⁻ / HCOO⁻ interaction hypothesis，并提高相关边的 evidence confidence。", "Strengthen the HCO₃⁻ / HCOO⁻ interaction hypothesis and increase evidence confidence for related edges."),
    ],
    [
      text(lang, "无明显变化", "No measurable change"),
      text(lang, "保持 pending / low confidence，不强行解释。", "Keep pending / low confidence and do not force an explanation."),
    ],
  ]

  return (
    <section id="organic-acid-experiment-feedback" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 13, minWidth: 0, padding: 14, scrollMarginTop: 118 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Experimental Feedback Schema</div>
        <h2 style={{ color: t.textStrong, fontSize: isMobile ? 20 : 23, lineHeight: 1.16, margin: 0, fontWeight: 940 }}>
          {text(lang, "待回填实验数据结构", "Organic Acid Experimental Feedback Schema")}
        </h2>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, margin: 0, maxWidth: 920 }}>
          {text(
            lang,
            "该模块用于后续接入合作实验数据，包括反应条件、产物分布、反应后 MOF 稳定性、HCO₃⁻ 浓度响应、HCOO⁻ / 甲酸盐相关证据和证据可信度。当前状态：等待合作实验数据回填。",
            "This module is prepared for collaboration experiment data: reaction conditions, product distribution, post-reaction MOF stability, HCO₃⁻ response, HCOO⁻/formate evidence, and evidence confidence. Current status: pending collaboration experiment data."
          )}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 9 }}>
        <InfoCard t={t} title="What this will capture" body="Reaction conditions · product distribution · post-reaction MOF stability · HCO₃⁻ response · HCOO⁻/formate evidence · evidence confidence" />
        <InfoCard t={t} title="Current status" body="Pending collaboration experiment data. The records below are schema placeholders and do not represent completed experiments." tone="warning" />
        <InfoCard t={t} title="Data boundary" body="Experimental feedback can update prioritization only after provenance, raw data reference, and evidence confidence are curated." />
      </div>

      <div style={{ display: "grid", gap: 9 }}>
        <h3 style={{ color: t.textStrong, fontSize: 15, margin: 0 }}>{text(lang, "实验记录预览", "Experiment Record Preview")}</h3>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 9 }}>
          {(records.length ? records : [{ recordId: "pending" }]).map(record => <RecordPreview key={safeText(record.recordId)} record={record} t={t} />)}
        </div>
      </div>

      <div style={{ display: "grid", gap: 9 }}>
        <h3 style={{ color: t.textStrong, fontSize: 15, margin: 0 }}>{text(lang, "实验反馈如何更新候选优先级", "How Experimental Feedback Updates Candidate Prioritization")}</h3>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))", gap: 9 }}>
          {updateRows.map(([title, body], index) => (
            <InfoCard key={title} t={t} title={`${index + 1}. ${title}`} body={body} tone={index === 4 ? "warning" : "normal"} />
          ))}
        </div>
      </div>
    </section>
  )
}
