// @ts-nocheck
import { useState } from "react"
import { ChemicalText } from "../../../shared"
import { Panel, StatusBadge, text } from "./FinalScreeningShared"

function toneFor(status) {
  if (status === "completed") return "pass"
  if (status === "warning") return "warn"
  if (status === "blocked") return "fail"
  return "info"
}

export function ScreeningFunnelChart({ data, lang, t, isMobile, onOpenSelectedScaffold, onJumpToMoW }) {
  const [activeId, setActiveId] = useState(null)
  const rows = data || []
  const maxCount = Math.max(1, ...rows.map(row => Number(row.count) || 0))
  const active = rows.find(row => row.id === activeId)

  const handleRow = row => {
    setActiveId(prev => prev === row.id ? null : row.id)
    if (row.action === "openCandidateDecisionDrawer") onOpenSelectedScaffold?.()
    if (row.action === "jumpToMoW") onJumpToMoW?.()
  }

  return (
    <Panel
      id="organic-acid-final-screening-funnel"
      eyebrow={text(lang, "筛选漏斗", "Screening funnel")}
      title={text(lang, "Screening Funnel Chart", "Screening Funnel Chart")}
      t={t}
      actions={<StatusBadge tone="info" t={t}>No direct Al/Mo retrieval</StatusBadge>}
    >
      <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.55, padding: 11 }}>
        <ChemicalText value={text(
          lang,
          "本流程不直接检索 Al/Mo 双金属 MOF。先筛选水热稳定 Al-MOF 骨架，再进行第二金属 DMRS 推荐。",
          "No direct Al/Mo retrieval is used. The workflow first screens hydrothermally stable Al-MOF scaffolds, then runs the second-metal DMRS recommendation."
        )} />
      </div>

      <div style={{ display: "grid", gap: 9 }}>
        {rows.map((row, index) => {
          const width = `${Math.max(12, ((Number(row.count) || 0) / maxCount) * 100)}%`
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => handleRow(row)}
              style={{
                background: activeId === row.id ? t.badgeInfoBg : t.surface,
                border: `1px solid ${activeId === row.id ? t.accent : t.border}`,
                borderRadius: 9,
                color: t.textStrong,
                cursor: "pointer",
                display: "grid",
                gap: 7,
                padding: 10,
                textAlign: "left",
              }}
            >
              <div style={{ alignItems: "center", display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "190px minmax(0, 1fr) 70px auto" }}>
                <strong style={{ color: t.textStrong, fontSize: 12.5 }}>
                  <ChemicalText value={`${index + 1}. ${lang === "zh" ? row.labelZh || row.label : row.label}`} />
                </strong>
                <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, height: 24, minWidth: 0, overflow: "hidden" }}>
                  <div style={{ background: row.status === "warning" ? t.warn : t.accent, height: "100%", opacity: 0.78, width }} />
                </div>
                <strong style={{ color: t.textStrong, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{row.count}</strong>
                <StatusBadge tone={toneFor(row.status)} t={t}>{row.status}</StatusBadge>
              </div>
              {row.reviewCount || row.failCount ? (
                <span style={{ color: t.warn, fontSize: 11.8, lineHeight: 1.4 }}>
                  {text(lang, `待复核 ${row.reviewCount || 0} / 拦截 ${row.failCount || 0}`, `Needs review ${row.reviewCount || 0} / fail ${row.failCount || 0}`)}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {active ? (
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12.4, lineHeight: 1.55, padding: 11 }}>
          <ChemicalText value={lang === "zh" ? active.descriptionZh || active.description : active.description} />
        </div>
      ) : null}
    </Panel>
  )
}
