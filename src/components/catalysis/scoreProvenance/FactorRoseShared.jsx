import { useMemo, useState } from "react"
import { asArray, cardStyle, EmptyState, fmt, palette, text } from "./shared"

function evidenceForFactor(rows, factorKey) {
  return asArray(rows).filter(row => row.factorKey === factorKey)
}

function detailForRow(row, factorDetails, factorEvidence) {
  const detail = asArray(factorDetails).find(item => item.factorKey === row.factorKey) || row
  return {
    ...row,
    ...detail,
    evidenceRows: evidenceForFactor(factorEvidence, row.factorKey),
  }
}

function boundedValue(value) {
  return Math.max(0, Math.min(1, Number(value) || 0))
}

export function FactorRoseChart({
  rows,
  titleZh,
  titleEn,
  subtitleZh,
  subtitleEn,
  captionZh,
  captionEn,
  centerLabel,
  centerValue,
  lang = "zh",
  testId,
  colorFor,
  outlineRows = [],
  outlineLabel = "",
  factorDetails = [],
  factorEvidence = [],
  selectedFactorKey = "",
  onSelectFactor,
}) {
  const dataRows = asArray(rows)
  const comparisonMap = useMemo(
    () => new Map(asArray(outlineRows).map(row => [row.factorKey, boundedValue(row.value)])),
    [outlineRows],
  )
  const [localSelectedKey, setLocalSelectedKey] = useState("")
  const selectedKey = selectedFactorKey || localSelectedKey
  const selectedRow = useMemo(() => {
    const row = dataRows.find(item => item.factorKey === selectedKey)
    return row ? detailForRow(row, factorDetails, factorEvidence) : null
  }, [dataRows, factorDetails, factorEvidence, selectedKey])

  if (!dataRows.length) {
    return (
      <div data-testid={testId} data-row-count={0} style={cardStyle({ background: palette.bg })}>
        <EmptyState lang={lang} />
      </div>
    )
  }

  const selectFactor = factorKey => {
    const next = selectedKey === factorKey ? "" : factorKey
    setLocalSelectedKey(next)
    onSelectFactor?.(next || "")
  }

  return (
    <div data-testid={testId} data-row-count={dataRows.length} style={cardStyle({ background: palette.bg, gap: 12 })}>
      <div style={{ alignItems: "end", borderBottom: `1px solid ${palette.border}`, display: "grid", gap: 12, gridTemplateColumns: "minmax(0, 1fr) auto", paddingBottom: 10 }}>
        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
          <strong style={{ color: palette.text, fontSize: 13.5 }}>{text(lang, titleZh, titleEn)}</strong>
          <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.5 }}>{text(lang, subtitleZh, subtitleEn)}</span>
        </div>
        <div style={{ borderLeft: `3px solid ${palette.accent}`, display: "grid", gap: 2, minWidth: 72, paddingLeft: 9, textAlign: "right" }}>
          <span style={{ color: palette.faint, fontSize: 9.5, fontWeight: 900 }}>{centerLabel}</span>
          <span style={{ color: palette.text, fontSize: 19, fontWeight: 950 }}>{centerValue}</span>
        </div>
      </div>

      <div data-testid="factor-profile-bars" style={{ display: "grid", gap: 7 }}>
        {dataRows.map((row, index) => {
          const value = boundedValue(row.value)
          const comparisonValue = comparisonMap.get(row.factorKey)
          const active = selectedKey === row.factorKey
          const fill = colorFor?.(row, index) || palette.accent
          return (
            <button
              key={row.factorKey || row.labelZh || index}
              type="button"
              aria-pressed={active}
              aria-label={`${text(lang, row.labelZh, row.labelEn)} ${fmt(value, 3)}`}
              data-testid="factor-rose-node"
              data-factor-key={row.factorKey}
              onClick={() => selectFactor(row.factorKey)}
              onKeyDown={event => {
                if (event.key === "Escape") {
                  setLocalSelectedKey("")
                  onSelectFactor?.("")
                }
              }}
              style={{
                background: active ? palette.surfaceStrong : "transparent",
                border: `1px solid ${active ? palette.accent : "transparent"}`,
                borderRadius: 7,
                cursor: "pointer",
                display: "grid",
                gap: 8,
                gridTemplateColumns: "minmax(0, 1fr) 48px",
                minWidth: 0,
                padding: "8px 9px",
                textAlign: "left",
              }}
            >
              <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                <strong style={{ color: active ? palette.accent : palette.text, fontSize: 11.4, lineHeight: 1.35 }}>{row.labelZh}</strong>
                <span style={{ color: palette.faint, fontSize: 9.8, lineHeight: 1.3 }}>{row.labelEn}</span>
              </span>
              <span style={{ alignSelf: "center", color: fill, fontSize: 11.5, fontWeight: 950, textAlign: "right" }}>{fmt(value, 2)}</span>
              <span style={{ alignSelf: "center", background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 3, display: "block", gridColumn: "1 / -1", height: 12, overflow: "visible", position: "relative" }}>
                <span style={{ background: fill, borderRadius: 2, display: "block", height: "100%", width: `${Math.max(2, value * 100)}%` }} />
                {Number.isFinite(comparisonValue) ? (
                  <span
                    aria-label={`${outlineLabel || text(lang, "对照路线", "Comparison route")} ${fmt(comparisonValue, 3)}`}
                    data-testid="factor-profile-overlay"
                    style={{ background: palette.text, height: 18, left: `calc(${comparisonValue * 100}% - 1px)`, opacity: .72, position: "absolute", top: -4, width: 2 }}
                  />
                ) : null}
              </span>
            </button>
          )
        })}
      </div>

      {comparisonMap.size ? (
        <div style={{ alignItems: "center", color: palette.faint, display: "inline-flex", fontSize: 10.5, fontWeight: 850, gap: 7 }}>
          <span style={{ background: palette.text, display: "inline-block", height: 14, opacity: .72, width: 2 }} />
          {outlineLabel || text(lang, "对照路线位置", "Comparison route marker")}
        </div>
      ) : null}

      <p style={{ borderTop: `1px solid ${palette.border}`, color: palette.muted, fontSize: 11.2, lineHeight: 1.55, margin: 0, paddingTop: 9 }}>
        {text(lang, captionZh, captionEn)}
      </p>

      {selectedRow ? (
        <div data-testid="factor-rose-detail-card" style={cardStyle({ background: palette.surfaceStrong, border: `1px solid ${palette.accent}`, padding: 11 })}>
          <div style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "space-between" }}>
            <strong style={{ color: palette.text, fontSize: 12.2 }}>{text(lang, selectedRow.labelZh, selectedRow.labelEn)}</strong>
            <span style={{ color: palette.accent, fontSize: 12, fontWeight: 950 }}>{fmt(selectedRow.normalizedValue ?? selectedRow.value, 3)}</span>
          </div>
          <span style={{ color: palette.muted, fontSize: 11.3, lineHeight: 1.55 }}>{text(lang, selectedRow.interpretationZh || selectedRow.labelZh, selectedRow.interpretationEn || selectedRow.labelEn)}</span>
          <div style={{ display: "grid", gap: 0, gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))" }}>
            {[
              ["raw", text(lang, "原始值", "Raw"), selectedRow.rawValue],
              ["weight", text(lang, "权重 / 系数", "Weight / factor"), selectedRow.weightOrFactor],
              ["contribution", text(lang, "贡献", "Contribution"), selectedRow.contribution],
              ["grade", text(lang, "数据等级", "Data grade"), selectedRow.dataGrade],
              ["level", text(lang, "水平", "Level"), text(lang, selectedRow.levelTag, selectedRow.levelTagEn)],
            ].map(([key, label, value], index) => (
              <span key={key} style={{ borderLeft: index ? `1px solid ${palette.border}` : "none", color: palette.muted, fontSize: 10.5, lineHeight: 1.4, padding: "5px 8px" }}>
                <strong style={{ color: palette.faint, display: "block", fontSize: 9.5 }}>{label}</strong>
                {typeof value === "number" ? fmt(value, 3) : (value || text(lang, "待核验", "pending"))}
              </span>
            ))}
          </div>
          {selectedRow.evidenceRows.length ? (
            <div style={{ borderTop: `1px solid ${palette.border}`, color: palette.faint, display: "grid", fontSize: 10.6, gap: 4, lineHeight: 1.45, paddingTop: 8 }}>
              {selectedRow.evidenceRows.slice(0, 2).map(row => (
                <span key={row.evidenceId}>{row.citation} · {row.directness} · {row.sameCondition ? text(lang, "同条件", "same condition") : text(lang, "非同条件", "not same condition")}</span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
