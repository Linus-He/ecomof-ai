// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { displayValue, formatScore, Panel, StatusBadge, text } from "./FinalScreeningShared"
import { AlgorithmTraceDrawer } from "./AlgorithmTraceDrawer"

function Row({ label, value, t }) {
  return (
    <div style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 3, paddingTop: 7 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color: t.textStrong, fontSize: 12.7, lineHeight: 1.35 }}><ChemicalText value={displayValue(value)} /></strong>
    </div>
  )
}

export function StageSummaryCards({ summary, trace, lang, t, isMobile, onOpenSelectedScaffold }) {
  const stage1 = summary?.stage1 || {}
  const stage2 = summary?.stage2 || {}
  return (
    <Panel
      id="organic-acid-final-stage-summary"
      eyebrow={text(lang, "双阶段摘要", "Two-stage summary")}
      title={text(lang, "Stage Summary Cards", "Stage Summary Cards")}
      t={t}
      actions={<AlgorithmTraceDrawer trace={trace} lang={lang} t={t} compact />}
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 9, padding: 12 }}>
          <header style={{ alignItems: "start", display: "flex", gap: 8, justifyContent: "space-between" }}>
            <strong style={{ color: t.textStrong, fontSize: 15, lineHeight: 1.25 }}>
              <ChemicalText value={lang === "zh" ? stage1.titleZh || stage1.title : stage1.title} />
            </strong>
            <StatusBadge tone="warn" t={t}>{lang === "zh" ? stage1.statusZh || stage1.status : stage1.status}</StatusBadge>
          </header>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <Row label={text(lang, "输入", "Input")} value={lang === "zh" ? stage1.inputZh : stage1.input} t={t} />
            <Row label={text(lang, "硬阈值", "Hard gate")} value={lang === "zh" ? stage1.hardGateZh : stage1.hardGate} t={t} />
            <Row label={text(lang, "通过 / 待复核 / 拦截", "Pass / Review / Fail")} value={stage1.passReviewFail} t={t} />
            <Row label="OACS" value={formatScore(stage1.oacs)} t={t} />
          </div>
          <Row label={text(lang, "选定骨架", "Selected scaffold")} value={stage1.selectedScaffold} t={t} />
          <button
            type="button"
            onClick={onOpenSelectedScaffold}
            style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 8, color: t.accentText, cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 34, padding: "7px 10px" }}
          >
            {text(lang, "查看候选决策", "View candidate decision")}
          </button>
        </article>

        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 9, padding: 12 }}>
          <header style={{ alignItems: "start", display: "flex", gap: 8, justifyContent: "space-between" }}>
            <strong style={{ color: t.textStrong, fontSize: 15, lineHeight: 1.25 }}>
              <ChemicalText value={lang === "zh" ? stage2.titleZh || stage2.title : stage2.title} />
            </strong>
            <StatusBadge tone="warn" t={t}>{lang === "zh" ? stage2.statusZh || stage2.status : stage2.status}</StatusBadge>
          </header>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <Row label={text(lang, "输入", "Input")} value={lang === "zh" ? stage2.inputZh : stage2.input} t={t} />
            <Row label={text(lang, "机制路径", "Mechanism paths")} value={lang === "zh" ? stage2.mechanismPathsZh : stage2.mechanismPaths} t={t} />
            <Row label={text(lang, "Top dopants", "Top dopants")} value={stage2.topDopants} t={t} />
            <Row label="Mo-W gap" value={formatScore(stage2.moWGap)} t={t} />
          </div>
          <Row label={text(lang, "Mo form", "Mo form")} value={stage2.moForm} t={t} />
          <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, color: t.muted, fontSize: 12.2, lineHeight: 1.5, padding: 9 }}>
            <ChemicalText value={text(
              lang,
              "Mo 是 primary hypothesis；W 是强竞争备选金属，而不是被简单排除的候选。",
              "Mo is the primary hypothesis; W remains a strong alternative dopant rather than a rejected candidate."
            )} />
          </div>
        </article>
      </div>
    </Panel>
  )
}
