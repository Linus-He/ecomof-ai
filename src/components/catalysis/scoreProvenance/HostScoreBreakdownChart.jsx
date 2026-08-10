import { useState } from "react"
import { asArray, cardStyle, EmptyState, fmt, GradeBadge, palette, pct, text } from "./shared"

const GRADE_TONE = { seed: "info", proxy: "warn", curated: "good", inferred: "muted" }

export function HostScoreBreakdownChart({ model, lang = "zh", withTestId = true, testId = "host-score-breakdown-chart" }) {
  const rows = asArray(model?.rows)
  const [openKey, setOpenKey] = useState(null)
  if (!rows.length) {
    return <div data-testid={withTestId ? testId : undefined} data-row-count={0} style={cardStyle({ background: palette.bg })}><EmptyState lang={lang} /></div>
  }
  return (
    <div data-testid={withTestId ? testId : undefined} data-row-count={rows.length} style={cardStyle({ background: palette.bg })}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>
          {text(lang, model.displayNameZh, model.displayNameEn)} · {model.candidateLabel} #{model.rank}
        </strong>
        <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>
          {text(lang, `加权求和 = ${fmt(model.finalValue, 3)}；点击某项查看原始字段。`, `Weighted sum = ${fmt(model.finalValue, 3)}; click a row to see its source field.`)}
        </span>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {rows.map(row => {
          const open = openKey === row.fieldKey
          return (
            <div key={row.fieldKey} style={{ background: palette.surface, border: `1px solid ${open ? palette.accent : palette.border}`, borderRadius: 8 }}>
              <button
                type="button"
                onClick={() => setOpenKey(open ? null : row.fieldKey)}
                title={text(lang, `原始字段 ${row.fieldKey} = ${fmt(row.rawValue, 3)}`, `raw field ${row.fieldKey} = ${fmt(row.rawValue, 3)}`)}
                style={{ background: "transparent", border: "none", cursor: "pointer", display: "grid", gap: 5, padding: 9, textAlign: "left", width: "100%" }}
              >
                <div style={{ alignItems: "center", display: "grid", gap: 8, gridTemplateColumns: "minmax(0,1fr) auto" }}>
                  <span style={{ color: palette.text, fontSize: 11.6, fontWeight: 800 }}>{text(lang, row.labelZh, row.labelEn)}</span>
                  <GradeBadge grade={row.dataGrade} labelZh={row.dataGrade} labelEn={row.dataGrade} tone={GRADE_TONE[row.dataGrade] || "info"} lang={lang} />
                </div>
                <span style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 6, height: 8, overflow: "hidden" }}>
                  <span style={{ background: palette.accent, display: "block", height: "100%", width: pct(row.normalizedValue) }} />
                </span>
                <span style={{ color: palette.muted, fontSize: 10.5 }}>
                  {text(lang, "原始", "raw")} {fmt(row.rawValue, 2)} · {text(lang, "归一化", "norm")} {fmt(row.normalizedValue, 2)} · {text(lang, "权重", "w")} {fmt(row.weightOrFactor, 2)} · {text(lang, "贡献", "contrib")} {fmt(row.contribution, 3)}
                </span>
              </button>
              {open ? (
                <div style={{ borderTop: `1px solid ${palette.border}`, color: palette.muted, display: "grid", fontSize: 11, gap: 4, lineHeight: 1.45, padding: 9 }}>
                  <span>{text(lang, "数据来源", "Source file")}: {row.dataSourceFile} · builder {row.builderFunction}</span>
                  <span style={{ color: palette.faint }}>{row.limitation}</span>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      <p style={{ color: palette.faint, fontSize: 10.5, lineHeight: 1.4, margin: 0 }}>{text(lang, model.headerNoteZh, model.headerNoteEn)}</p>
    </div>
  )
}

export default HostScoreBreakdownChart
