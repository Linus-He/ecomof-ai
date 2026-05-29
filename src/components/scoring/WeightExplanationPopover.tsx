// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { FONT_MONO } from "../../constants/theme"
import { toolbarBtn } from "../../utils/styles"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const fmt = (value, digits = 3) => Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "—"
const pct = value => Number.isFinite(Number(value))
  ? `${Math.round(Math.max(0, Math.min(1, Number(value))) * 100)}%`
  : "—"

const DESKTOP_WIDTH = 360
const ESTIMATED_HEIGHT = 430
const EDGE_GAP = 16

function readMetric(map, key) {
  if (!map || !key) return null
  if (Array.isArray(map)) {
    const row = map.find(item => item.key === key || item.descriptor === key)
    return row?.value ?? row?.ratio ?? row?.score ?? null
  }
  return map[key] ?? null
}

function diagnosticValue(diagnostics, key, names) {
  for (const name of names) {
    const value = readMetric(diagnostics?.[name], key)
    if (value !== null && value !== undefined) return value
  }
  for (const name of names) {
    const value = readMetric(diagnostics?.critic?.[name], key)
    if (value !== null && value !== undefined) return value
  }
  return null
}

function getCoverage(model, key) {
  return model?.descriptorCoverage?.rows?.find(row => row.key === key) || null
}

function descriptorFromModel(model, key) {
  return model?.descriptors?.find(descriptor => descriptor.key === key)
    || model?.requestedDescriptors?.find(descriptor => descriptor.key === key)
    || null
}

function useResponsiveDrawer(open, isMobile) {
  const [drawerMode, setDrawerMode] = useState(() => Boolean(isMobile) || (typeof window !== "undefined" && window.innerWidth < 768))
  useEffect(() => {
    if (!open) return undefined
    const updateMode = () => setDrawerMode(Boolean(isMobile) || window.innerWidth < 768)
    updateMode()
    window.addEventListener("resize", updateMode)
    return () => window.removeEventListener("resize", updateMode)
  }, [open, isMobile])
  return drawerMode
}

export function WeightExplanationPopover({
  item,
  model,
  descriptorKey,
  open = true,
  anchorRef,
  onClose,
  t,
  lang,
  isMobile,
}) {
  const [position, setPosition] = useState({ top: EDGE_GAP, left: EDGE_GAP, width: DESKTOP_WIDTH })
  const drawerMode = useResponsiveDrawer(open, isMobile)
  const key = descriptorKey || item?.key
  const explanation = item || model?.explanations?.weights?.find(row => row.key === key) || {}
  const descriptor = descriptorFromModel(model, key)
  const diagnostics = model?.weightingDiagnostics || {}
  const coverage = getCoverage(model, key)
  const weight = explanation.weight ?? model?.weights?.[key]
  const sigma = explanation.contrastIntensity ?? diagnosticValue(diagnostics, key, ["sigma", "contrastIntensity"])
  const conflictScore = explanation.conflictScore ?? diagnosticValue(diagnostics, key, ["conflictScore"])
  const missingRate = explanation.missingRate ?? diagnosticValue(diagnostics, key, ["missingRateByDescriptor"]) ?? coverage?.missingRate
  const validRatio = diagnosticValue(diagnostics, key, ["validRatioByDescriptor"]) ?? (coverage ? coverage.availableCount / Math.max(1, coverage.total || coverage.candidateCount || coverage.totalCount || 1) : null)
  const evidenceCoverage = coverage?.evidenceCoverage ?? coverage?.evidenceRate ?? null
  const insufficient = !key || !model || !Number.isFinite(Number(weight))
  const label = (lang === "zh" ? (explanation.labelZh || descriptor?.labelZh) : (explanation.label || descriptor?.label)) || key || text(lang, "描述符", "Descriptor")
  const subtitle = key ? `${label} / ${key}` : label
  const fallbackText = text(
    lang,
    "当前数据不足，无法生成完整权重解释。以下信息来自可用的评分诊断结果。",
    "Current data is insufficient for a complete weight rationale. The information below is based on available scoring diagnostics."
  )
  const interpretation = text(
    lang,
    "CRITIC 表明该指标在当前候选集中具有较高区分贡献；该结论依赖当前数据覆盖、相关性结构和缺失值处理。",
    "CRITIC suggests this descriptor contributes strongly in the current candidate set; this depends on current data coverage, correlation structure, and missing-value handling."
  )

  const updatePosition = useCallback(() => {
    if (drawerMode || typeof window === "undefined") return
    const width = Math.min(DESKTOP_WIDTH, Math.max(280, window.innerWidth - EDGE_GAP * 2))
    const rect = anchorRef?.current?.getBoundingClientRect()
    let left = rect ? rect.left : window.innerWidth - width - EDGE_GAP
    let top = rect ? rect.bottom + 8 : EDGE_GAP

    if (left + width > window.innerWidth - EDGE_GAP) {
      left = window.innerWidth - width - EDGE_GAP
    }
    if (left < EDGE_GAP) left = EDGE_GAP
    if (top + ESTIMATED_HEIGHT > window.innerHeight - EDGE_GAP && rect) {
      top = rect.top - ESTIMATED_HEIGHT - 8
    }
    if (top < EDGE_GAP) top = EDGE_GAP
    setPosition({ top, left, width })
  }, [anchorRef, drawerMode])

  useEffect(() => {
    if (!open) return undefined
    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open || !onClose) return undefined
    const onKeyDown = event => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  const metrics = useMemo(() => ([
    {
      label: text(lang, "权重", "Weight"),
      value: fmt(weight),
      note: text(lang, "当前评分模型分配给该描述符的相对权重。", "Relative weight assigned to this descriptor in the current scoring model."),
    },
    {
      label: text(lang, "区分度", "Contrast intensity"),
      value: fmt(sigma),
      note: text(lang, "该指标在当前候选集中的差异程度。", "Variation of this descriptor within the current candidate set."),
    },
    {
      label: text(lang, "冲突度", "Conflict score"),
      value: fmt(conflictScore),
      note: text(lang, "该指标与其他描述符的非冗余程度。", "Non-redundancy of this descriptor against other descriptors."),
    },
    {
      label: text(lang, "缺失率", "Missing rate"),
      value: pct(missingRate),
      note: text(lang, "当前候选集中该描述符缺失的比例。", "Share of current candidates missing this descriptor."),
    },
    {
      label: text(lang, "证据覆盖", "Evidence coverage"),
      value: pct(evidenceCoverage),
      note: text(lang, "具有字段级证据或来源记录的覆盖比例。", "Coverage with field-level evidence or source records."),
    },
  ]), [conflictScore, evidenceCoverage, lang, missingRate, sigma, weight])

  if (!open || typeof document === "undefined") return null

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 9998,
    background: drawerMode ? "rgba(15,23,42,0.38)" : "transparent",
    border: 0,
    padding: 0,
    cursor: "default",
  }

  const panelStyle = drawerMode
    ? {
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: "80vh",
        overflowY: "auto",
        overflowX: "hidden",
        borderRadius: "20px 20px 0 0",
        zIndex: 9999,
      }
    : {
        position: "fixed",
        top: position.top,
        left: position.left,
        width: position.width,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "min(72vh, 560px)",
        overflowY: "auto",
        overflowX: "hidden",
        borderRadius: 16,
        zIndex: 9999,
      }

  const content = (
    <>
      {onClose && <button type="button" aria-label={text(lang, "关闭权重解释", "Close weight rationale")} onClick={onClose} style={overlayStyle} />}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="weight-rationale-title"
        style={{
          ...panelStyle,
          background: t.panel,
          border: `1px solid ${t.borderStrong || t.border}`,
          boxShadow: t.shadowLg || "0 18px 44px rgba(15,23,42,0.20)",
          padding: 16,
          color: t.muted,
          fontSize: 12,
          lineHeight: 1.55,
          display: "grid",
          gap: 12,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <h3 id="weight-rationale-title" style={{ margin: 0, color: t.textStrong, fontSize: 15, lineHeight: 1.25, fontWeight: 920 }}>
              {text(lang, "权重解释", "Weight rationale")}
            </h3>
            <div style={{ color: t.faint, fontSize: 11, fontFamily: FONT_MONO, lineHeight: 1.45, marginTop: 4, overflowWrap: "anywhere" }}>
              {subtitle}
            </div>
          </div>
          {onClose && <button type="button" onClick={onClose} style={{ ...toolbarBtn(t), padding: "6px 9px", fontSize: 11 }}>{text(lang, "关闭", "Close")}</button>}
        </div>

        {insufficient && (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 10, color: t.warn, fontSize: 11.5, lineHeight: 1.55 }}>
            {fallbackText}
          </div>
        )}

        <div style={{ display: "grid", gap: 7 }}>
          {metrics.map(metric => (
            <div key={metric.label} style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: "4px 12px",
              alignItems: "baseline",
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 10,
              padding: "9px 10px",
            }}>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{metric.label}</div>
              <div style={{ color: t.textStrong, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 850 }}>{metric.value}</div>
              <div style={{ gridColumn: "1 / -1", color: t.faint, fontSize: 10.5, lineHeight: 1.45 }}>{metric.note}</div>
            </div>
          ))}
        </div>

        {validRatio !== null && validRatio !== undefined && (
          <div style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.45 }}>
            {text(lang, "有效数据比例", "Valid data ratio")}: <span style={{ color: t.textStrong, fontFamily: FONT_MONO }}>{pct(validRatio)}</span>
          </div>
        )}

        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 11, color: t.muted, fontSize: 11.5, lineHeight: 1.6 }}>
          <strong style={{ color: t.textStrong }}>{text(lang, "Interpretation", "Interpretation")}: </strong>
          {interpretation}
        </div>
      </aside>
    </>
  )

  return createPortal(content, document.body)
}
