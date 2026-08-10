// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"
import { text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { formatCount } from "../../utils/databaseIndex/databaseIndexFormatters"

const STEP_STATUS_COPY = {
  pending: { en: "Pending", zh: "等待" },
  running: { en: "Running", zh: "运行中" },
  completed: { en: "Completed", zh: "已完成" },
  warning: { en: "Warning", zh: "需注意" },
  blocked: { en: "Blocked", zh: "阻断" },
  skipped: { en: "Skipped", zh: "已跳过" },
}

function statusColors(status, t) {
  if (status === "completed") return { fg: t.good || "#15803d", bg: t.badgeGoodBg || "#dcfce7" }
  if (status === "running") return { fg: t.accentText || "#1d4ed8", bg: t.badgeInfoBg || "#dbeafe" }
  if (status === "warning") return { fg: t.warn || "#b45309", bg: t.badgeWarnBg || "#fef3c7" }
  if (status === "blocked") return { fg: t.bad || "#b91c1c", bg: t.badgeBadBg || "#fee2e2" }
  if (status === "skipped") return { fg: t.faint || "#94a3b8", bg: t.surface }
  return { fg: t.faint || "#94a3b8", bg: t.surface }
}

export function ScreeningRunStepper({ steps = [], activeIndex = -1, lang, t }) {
  return (
    <ol data-testid="screening-run-stepper" style={{ display: "grid", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
      {steps.map((step, index) => {
        const colors = statusColors(step.status, t)
        const isActive = index === activeIndex || step.status === "running"
        return (
          <li key={step.id} style={{ background: t.panel, border: `1px solid ${isActive ? colors.fg : t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 10 }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
              <strong style={{ color: t.textStrong, fontSize: 12.6 }}>{index + 1}. {text(lang, step.titleZh, step.title)}</strong>
              <span style={{ alignItems: "center", display: "flex", gap: 8 }}>
                <span style={{ color: t.muted, fontSize: 11 }}>{text(lang, "输入", "in")} {formatCount(step.inputCount)} · {text(lang, "输出", "out")} {formatCount(step.outputCount)}</span>
                <span style={{ background: colors.bg, borderRadius: 6, color: colors.fg, fontSize: 10.5, fontWeight: 900, padding: "3px 9px" }}>
                  {text(lang, STEP_STATUS_COPY[step.status]?.zh || step.status, STEP_STATUS_COPY[step.status]?.en || step.status)}
                </span>
              </span>
            </div>
            <span style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.4 }}><ChemicalText value={text(lang, step.descriptionZh, step.description)} /></span>
            {step.status === "warning" && (step.warning || step.warningZh) ? (
              <span style={{ color: t.warn, fontSize: 11, fontWeight: 800 }}><ChemicalText value={text(lang, step.warningZh || step.warning, step.warning || step.warningZh)} /></span>
            ) : null}
            {step.status === "blocked" && (step.blocker || step.blockerZh) ? (
              <span style={{ color: t.bad || "#b91c1c", fontSize: 11, fontWeight: 800 }}><ChemicalText value={text(lang, step.blockerZh || step.blocker, step.blocker || step.blockerZh)} /></span>
            ) : null}
            <span style={{ color: t.faint, fontSize: 10.6, lineHeight: 1.4 }}><ChemicalText value={text(lang, step.boundaryZh, step.boundary)} /></span>
          </li>
        )
      })}
    </ol>
  )
}

export default ScreeningRunStepper
