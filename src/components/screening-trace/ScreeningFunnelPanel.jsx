// @ts-nocheck
import { StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"

const FILTER_COPY = {
  hard: { en: "hard filter", zh: "硬筛" },
  soft: { en: "soft adjustment", zh: "软调整" },
  annotation_only: { en: "annotation only", zh: "仅标注" },
}

export function ScreeningFunnelPanel({ trace, lang, t }) {
  const funnel = trace?.funnel || []
  const max = Math.max(1, ...funnel.map(s => Number(s.inputCount) || 0))
  return (
    <section id="screening-funnel-panel" data-testid="screening-funnel-panel" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "筛选漏斗", "Screening Funnel")}</strong>
      {!funnel.length ? <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "候选数据读取后将显示筛选漏斗。", "The screening funnel will appear after candidate data loads.")}</span> : null}
      <div style={{ display: "grid", gap: 7 }}>
        {funnel.map(stage => {
          const fc = FILTER_COPY[stage.filterType] || FILTER_COPY.annotation_only
          const width = Math.max(6, Math.round((Number(stage.outputCount) || 0) / max * 100))
          return (
            <div key={stage.stageId} style={{ display: "grid", gap: 3 }}>
              <div style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
                <span style={{ color: t.textStrong, fontSize: 12, fontWeight: 800, overflowWrap: "anywhere" }}>{text(lang, stage.stageNameZh, stage.stageName)}</span>
                <span style={{ color: t.muted, fontSize: 11 }}>{stage.inputCount} → {stage.outputCount}{stage.removedCount ? ` (−${stage.removedCount})` : ""} · <StatusPill tone={stage.filterType === "hard" ? "warn" : stage.filterType === "soft" ? "proxy" : "info"} t={t}>{text(lang, fc.zh, fc.en)}</StatusPill></span>
              </div>
              <div style={{ background: t.panel, borderRadius: 6, height: 10, overflow: "hidden" }}>
                <div style={{ background: t.accent, height: "100%", width: `${width}%` }} />
              </div>
              {stage.removedCount ? <span style={{ color: t.faint, fontSize: 10.6 }}>{text(lang, "减少原因", "removal reason")}: {(stage.removalReasons || []).join(", ")}</span> : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default ScreeningFunnelPanel
