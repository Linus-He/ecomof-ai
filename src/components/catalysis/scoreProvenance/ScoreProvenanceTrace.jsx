import { asArray, fmt, GradeBadgeRow, palette, text } from "./shared"
import { ScoreSourceTable } from "./ScoreSourceTable"

const GRADE_META = {
  seed: { labelZh: "种子数据", labelEn: "Seed", tone: "info" },
  proxy: { labelZh: "代理数据", labelEn: "Proxy", tone: "warn" },
  curated: { labelZh: "人工整理", labelEn: "Curated", tone: "good" },
  inferred: { labelZh: "推断数据", labelEn: "Inferred", tone: "muted" },
}

function badgesFor(provenance) {
  const grades = [provenance.dataGrade, ...asArray(provenance.rows).map(row => row.dataGrade)]
  const unique = []
  for (const grade of grades) {
    if (GRADE_META[grade] && !unique.includes(grade)) unique.push(grade)
  }
  return unique.map(grade => ({ grade, ...GRADE_META[grade] }))
}

export function ScoreProvenanceTrace({ provenance, scoreSourceTable, lang = "zh", withTestId = true, openTable = false }) {
  if (!provenance) return null
  return (
    <section data-testid={withTestId ? "score-provenance-trace" : undefined} style={{ background: palette.surfaceStrong, border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 9, padding: 11 }}>
      <div style={{ display: "grid", gap: 3 }}>
        <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "得分来源追踪链", "Score Provenance Trace")}</strong>
        <span style={{ color: palette.accent, fontSize: 12, fontWeight: 900 }}>
          {text(lang, provenance.displayNameZh, provenance.displayNameEn)} = {fmt(provenance.finalValue, 3)} · #{provenance.rank} · {provenance.candidateLabel}
        </span>
        <span style={{ color: palette.muted, fontSize: 11, lineHeight: 1.45 }}>{text(lang, provenance.headerNoteZh, provenance.headerNoteEn)}</span>
      </div>
      <GradeBadgeRow badges={badgesFor(provenance)} lang={lang} />
      <ScoreSourceTable model={scoreSourceTable} lang={lang} open={openTable} />
    </section>
  )
}

export default ScoreProvenanceTrace
