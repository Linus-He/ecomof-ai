import { FONT_MONO } from "../../constants/theme"
import { toolbarBtn } from "../../utils/styles"
import { BasisBadge } from "../ui"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const fmt = (value, digits = 3) => Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "0"
const pct = value => `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`

function getDiagnosticValue(map, key) {
  if (!map) return null
  if (Array.isArray(map)) {
    const item = map.find(row => row.key === key || row.descriptor === key)
    return item?.value ?? item?.ratio ?? item?.score ?? null
  }
  return map[key] ?? null
}

function getCoverage(model, key) {
  return model?.descriptorCoverage?.rows?.find(row => row.key === key) || null
}

export function WeightExplanationPopover({ item, model, descriptorKey, open = true, onClose, t, lang, isMobile }) {
  if (!open) return null
  const key = descriptorKey || item?.key
  const explanation = item || model?.explanations?.weights?.find(row => row.key === key) || {}
  const diagnostics = model?.weightingDiagnostics || {}
  const coverage = getCoverage(model, key)
  const sigma = explanation.contrastIntensity ?? getDiagnosticValue(diagnostics.sigma, key) ?? getDiagnosticValue(diagnostics.contrastIntensity, key)
  const conflictScore = explanation.conflictScore ?? getDiagnosticValue(diagnostics.conflictScore, key)
  const missingRate = explanation.missingRate ?? getDiagnosticValue(diagnostics.missingRateByDescriptor, key) ?? coverage?.missingRate
  const validRatio = getDiagnosticValue(diagnostics.validRatioByDescriptor, key) ?? (coverage ? coverage.availableCount / Math.max(1, coverage.total || coverage.candidateCount || coverage.totalCount || 1) : null)
  const evidenceCoverage = coverage?.evidenceCoverage ?? coverage?.evidenceRate ?? null
  const insufficient = !item || !key || !Number.isFinite(Number(explanation.weight))
  const fallbackText = text(
    lang,
    "当前数据不足，无法生成完整解释；以下为 fallback explanation。",
    "Current data is insufficient for a complete explanation; the following is a fallback explanation."
  )
  const interpretation = explanation.interpretation || text(
    lang,
    "CRITIC 表明该指标在当前候选集中具有较高区分贡献；该结论依赖当前数据覆盖、相关性结构和缺失值处理。",
    "CRITIC suggests this descriptor contributes strongly in the current candidate set; this depends on current data coverage, correlation structure, and missing-value handling."
  )

  return (
    <>
      {onClose && (
        <button
          type="button"
          aria-label="Close weight explanation backdrop"
          onClick={onClose}
          style={{ position: "fixed", inset: 0, zIndex: 41, background: "rgba(0,0,0,0.26)", border: 0 }}
        />
      )}
      <aside style={{
        position: onClose ? "fixed" : "static",
        inset: onClose ? (isMobile ? "auto 0 0 0" : "auto 18px 18px auto") : "auto",
        width: onClose ? (isMobile ? "100%" : 420) : "auto",
        maxHeight: onClose ? "80vh" : "none",
        overflow: "auto",
        zIndex: 42,
        background: t.badgeInfoBg || t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: onClose && isMobile ? "8px 8px 0 0" : 8,
        padding: 13,
        color: t.muted,
        fontSize: 12,
        lineHeight: 1.6,
        boxShadow: onClose ? (t.shadowLg || t.shadowSm) : "none",
        display: "grid",
        gap: 9,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
          <div>
            <div style={{ color: t.textStrong, fontSize: 13.5, fontWeight: 900 }}>
              {(lang === "zh" ? explanation.labelZh : explanation.label) || key || text(lang, "描述符", "Descriptor")}
            </div>
            {key && <div style={{ color: t.faint, fontSize: 10.5, fontFamily: FONT_MONO, marginTop: 3 }}>{key}</div>}
          </div>
          {onClose && <button type="button" onClick={onClose} style={toolbarBtn(t)}>{text(lang, "关闭", "Close")}</button>}
        </div>

        {insufficient && (
          <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, color: t.warn, fontSize: 12, lineHeight: 1.55 }}>
            {fallbackText}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 7 }}>
          {[
            [text(lang, "Weight", "Weight"), fmt(explanation.weight)],
            [text(lang, "Contrast intensity / sigma", "Contrast intensity / sigma"), fmt(sigma)],
            [text(lang, "Conflict score", "Conflict score"), fmt(conflictScore)],
            [text(lang, "Missing rate", "Missing rate"), pct(missingRate)],
            [text(lang, "Valid ratio", "Valid ratio"), validRatio == null ? "—" : pct(validRatio)],
            [text(lang, "Evidence coverage", "Evidence coverage"), evidenceCoverage == null ? "—" : pct(evidenceCoverage)],
          ].map(([label, value]) => (
            <div key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: 8 }}>
              <div style={{ color: t.faint, fontSize: 9.5, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
              <div style={{ color: t.textStrong, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 850, marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <BasisBadge tone="info">{explanation.evidenceStatus || text(lang, "当前证据覆盖", "current evidence coverage")}</BasisBadge>
          {Number(missingRate) > 0.35 && <BasisBadge tone="warn">{text(lang, "缺失率较高", "high missing rate")}</BasisBadge>}
          {model?.weightingDiagnostics?.fallbackUsed && <BasisBadge tone="warn">fallback</BasisBadge>}
        </div>

        <div>{interpretation}</div>
      </aside>
    </>
  )
}
