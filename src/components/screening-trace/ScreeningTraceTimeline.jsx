// @ts-nocheck
import { StatusBadge, text } from "../catalysis/organic-acid-final/FinalScreeningShared"

const STATUS_COPY = {
  completed: { en: "Completed", zh: "已完成", tone: "pass" },
  warning: { en: "Warning", zh: "需注意", tone: "warn" },
  blocked: { en: "Blocked", zh: "阻断", tone: "fail" },
  pending: { en: "Pending", zh: "等待", tone: "proxy" },
}

export function ScreeningTraceTimeline({ trace, lang, t }) {
  const steps = trace?.steps || []
  return (
    <section id="screening-trace-timeline" data-testid="screening-trace-timeline" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "筛选流程追踪", "Screening Trace")}</strong>
        <StatusBadge tone={trace?.isVerifiedScreening ? "pass" : "warn"} t={t}>{trace?.isVerifiedScreening ? text(lang, "经核验筛选", "verified screening") : text(lang, "数据库预览 · 非最终推荐", "database preview · not final recommendation")}</StatusBadge>
      </div>
      <ol style={{ display: "grid", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
        {steps.map((s, i) => {
          const sc = STATUS_COPY[s.status] || STATUS_COPY.pending
          return (
            <li key={s.stepId} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 4, padding: 10, minWidth: 0 }}>
              <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
                <strong style={{ color: t.textStrong, fontSize: 12.4, overflowWrap: "anywhere" }}>{i + 1}. {text(lang, s.titleZh, s.title)}</strong>
                <span style={{ display: "flex", gap: 6 }}>
                  <span style={{ color: t.faint, fontSize: 11 }}>{text(lang, "入", "in")} {s.inputCount} · {text(lang, "出", "out")} {s.outputCount}{s.removedCount ? ` · -${s.removedCount}` : ""}</span>
                  <StatusBadge tone={sc.tone} t={t}>{text(lang, sc.zh, sc.en)}</StatusBadge>
                </span>
              </div>
              <span style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.45, overflowWrap: "anywhere" }}>{text(lang, s.keyMessageZh, s.keyMessage)}</span>
              {s.blockers?.length ? <span style={{ color: t.warn, fontSize: 10.8, fontWeight: 800 }}>{text(lang, "风险", "risks")}: {s.blockers.join(", ")}</span> : null}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default ScreeningTraceTimeline
