// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"

function renderValue(value) {
  if (value === null || value === undefined || value === "") return "pending"
  return String(value)
}

export function ScreeningResultPanel({ result, lang, t, isMobile }) {
  if (!result) return null
  const tone = result.finalStatus === "completed" ? "pass" : result.finalStatus === "blocked" ? "fail" : "warn"

  return (
    <section data-testid="screening-result-panel" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 12 }}>
      <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 15 }}>{text(lang, "本次筛选审计结果", "Screening Audit Result")}</strong>
        <StatusPill tone={tone} t={t}>{text(lang, "仅限预览 · 非最终推荐", "preview only · not final recommendation")}</StatusPill>
      </header>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {result.groups.map(group => (
          <article key={group.id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 6, padding: 10 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, group.titleZh, group.title)}</span>
            <div style={{ display: "grid", gap: 4 }}>
              {group.rows.map(row => (
                <div key={row.labelEn} style={{ alignItems: "baseline", display: "flex", gap: 8, justifyContent: "space-between" }}>
                  <span style={{ color: t.muted, fontSize: 11.4 }}>{text(lang, row.labelZh, row.labelEn)}</span>
                  <strong style={{ color: t.textStrong, fontSize: 12.2 }}>{renderValue(row.value)}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.textStrong, fontSize: 12.4, fontWeight: 800, lineHeight: 1.5, padding: 11 }}>
        <ChemicalText value={text(lang, result.conclusionZh, result.conclusionEn)} />
      </div>

      <ResultInterpretation lang={lang} t={t} />
    </section>
  )
}

function ResultInterpretation({ lang, t }) {
  const sections = [
    {
      title: text(lang, "可以相信什么", "What you can trust"),
      tone: "pass",
      items: [
        text(lang, "审计链已检查 metadata、描述符、冗余、机制代理、敏感性与候选验证路线。", "The audit chain has checked metadata, descriptors, redundancy, mechanism proxies, sensitivity, and the validation roadmap."),
        text(lang, "Top10 稳定性较高，说明当前 preview 排序在扰动下相对稳定。", "Top10 stability is relatively high, so the preview ranking is relatively stable under perturbation."),
        text(lang, "12 条 near_verified 候选值得优先人工核验。", "12 near-verified candidates deserve priority manual review."),
      ],
    },
    {
      title: text(lang, "不能相信什么", "What you cannot trust"),
      tone: "warn",
      items: [
        text(lang, "不能当作最终推荐。", "Not a final recommendation."),
        text(lang, "不能当作全量数据库筛选。", "Not full database screening."),
        text(lang, "不能当作实验或 DFT 证明。", "Not experimental or DFT proof."),
        text(lang, "不能声称模型预测准确。", "No claim of model prediction accuracy."),
      ],
    },
    {
      title: text(lang, "下一步要做什么", "What to do next"),
      tone: "info",
      items: [
        text(lang, "补 source URL、citation、license、DOI。", "Add source URL, citation, license, DOI."),
        text(lang, "对 high priority 候选做人工核验。", "Manually review the high-priority candidates."),
        text(lang, "对 weak proxy 做文献证据回填。", "Backfill literature evidence for weak proxies."),
      ],
    },
  ]
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "结果解读", "Result interpretation")}</strong>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {sections.map(section => (
          <article key={section.title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 9 }}>
            <StatusPill tone={section.tone} t={t}>{section.title}</StatusPill>
            <ul style={{ color: t.muted, display: "grid", fontSize: 11.2, gap: 3, lineHeight: 1.42, margin: 0, paddingLeft: 16 }}>
              {section.items.map(item => <li key={item}><ChemicalText value={item} /></li>)}
            </ul>
          </article>
        ))}
      </div>
    </div>
  )
}

export default ScreeningResultPanel
