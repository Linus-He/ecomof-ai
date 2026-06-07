// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react"
import { CatalystCatSprite } from "./CatalystCatSprite"

const CAT_SIZE = { width: 88, height: 96 }

export const CAT_PROBE_ZONES = {
  "hot-spot-region": {
    label: "Hot spot region",
    labelZh: "设计热区",
    metric: "Scaffold robustness x metal-oxo activity",
    metricZh: "骨架稳健性 x 金属氧活性",
    insight: "This region marks the favorable coupled design area under the current demo/proxy conditions.",
    insightZh: "这里表示当前 demo/proxy 条件下较优的协同设计区域。",
  },
  "mo-primary-hypothesis": {
    label: "Mo primary hypothesis",
    labelZh: "Mo 主假设",
    metric: "OACS x DMRS synergy",
    metricZh: "OACS x DMRS 协同",
    insight: "Mo is the current primary hypothesis, but DFT, EXAFS, and same-condition experiments are still required.",
    insightZh: "Mo 是当前主假设，但仍需要 DFT、EXAFS 和同条件实验验证。",
  },
  "w-backup-hypothesis": {
    label: "W backup hypothesis",
    labelZh: "W 备选假设",
    metric: "Mo-W gap",
    metricZh: "Mo-W gap",
    insight: "W sits near the neighboring hot region and remains a strong backup, not an eliminated candidate.",
    insightZh: "W 位于邻近热区，是强竞争备选，而不是被淘汰候选。",
  },
  "needs-review-region": {
    label: "Needs-review region",
    labelZh: "待复核样例",
    metric: "Data quality gate",
    metricZh: "数据质量门控",
    insight: "Records missing hydrothermal or DOI evidence can remain visible, but cannot enter final recommendation.",
    insightZh: "缺少水热稳定性或 DOI 证据的样例可以显示，但不能进入最终推荐。",
  },
  "rejected-by-hard-gate": {
    label: "Rejected by hard gate",
    labelZh: "硬阈值拦截",
    metric: "Hydrothermal Gate",
    metricZh: "Hydrothermal Gate",
    insight: "When >=150 C hydrothermal evidence is missing, OACS must be forced to 0.",
    insightZh: "缺少 >=150 C 水热证据时，OACS 应强制归零。",
  },
}

export function clampCatPosition(value, min, max) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return min
  return Math.min(Math.max(numeric, min), max)
}

export function catProbeStorageKey(boundaryId) {
  return `ecomof-cat-position-${boundaryId || "hotspot-synergy"}`
}

export function zoneForCatPosition(position = {}, boundary = {}, chartMode = "synergy") {
  const width = Math.max(1, Number(boundary.width) || 1)
  const height = Math.max(1, Number(boundary.height) || 1)
  const normalizedX = clampCatPosition((Number(position.x) + CAT_SIZE.width / 2) / width, 0, 1)
  const normalizedY = clampCatPosition((Number(position.y) + CAT_SIZE.height / 2) / height, 0, 1)

  if (normalizedX < 0.34 && normalizedY > 0.68) return "rejected-by-hard-gate"
  if (normalizedX < 0.54 && normalizedY > 0.48) return "needs-review-region"
  if (chartMode === "synergy" && normalizedX > 0.72 && normalizedY < 0.42) return "mo-primary-hypothesis"
  if (chartMode !== "scaffold" && normalizedX > 0.56 && normalizedX <= 0.74 && normalizedY < 0.52) return "w-backup-hypothesis"
  if (normalizedX > 0.65 && normalizedY < 0.42) return "hot-spot-region"
  return "needs-review-region"
}

function loadPosition(boundaryId) {
  if (typeof window === "undefined") return null
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(catProbeStorageKey(boundaryId)) || "null")
    if (Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y)) return parsed
  } catch {
    return null
  }
  return null
}

function storePosition(boundaryId, point) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(catProbeStorageKey(boundaryId), JSON.stringify(point))
  } catch {
    // Probe remains draggable when sessionStorage is unavailable.
  }
}

function defaultPoint(rect, defaultPosition) {
  const width = Math.max(1, rect?.width || 640)
  const height = Math.max(1, rect?.height || 390)
  if (defaultPosition && typeof defaultPosition === "object") {
    return {
      x: clampCatPosition(defaultPosition.x, 0, Math.max(0, width - CAT_SIZE.width)),
      y: clampCatPosition(defaultPosition.y, 0, Math.max(0, height - CAT_SIZE.height)),
    }
  }
  return {
    x: clampCatPosition(width - 106, 0, Math.max(0, width - CAT_SIZE.width)),
    y: clampCatPosition(height * 0.18, 0, Math.max(0, height - CAT_SIZE.height)),
  }
}

export function CatalysisCatProbe({ boundaryId = "hotspot-synergy", chartMode = "synergy", defaultPosition = "top-right", lang, t, children }) {
  const zh = lang === "zh"
  const boundaryRef = useRef(null)
  const handleRef = useRef(null)
  const dragOffsetRef = useRef({ x: CAT_SIZE.width / 2, y: CAT_SIZE.height / 2 })
  const [dragging, setDragging] = useState(false)
  const [boundarySize, setBoundarySize] = useState({ width: 640, height: 390 })
  const [position, setPosition] = useState(() => loadPosition(boundaryId) || { x: 534, y: 70 })

  const clampPoint = point => {
    const rect = boundaryRef.current?.getBoundingClientRect?.() || boundarySize
    return {
      x: clampCatPosition(point.x, 0, Math.max(0, (rect.width || boundarySize.width) - CAT_SIZE.width)),
      y: clampCatPosition(point.y, 0, Math.max(0, (rect.height || boundarySize.height) - CAT_SIZE.height)),
    }
  }

  useEffect(() => {
    const boundary = boundaryRef.current
    if (!boundary) return undefined
    const sync = () => {
      const rect = boundary.getBoundingClientRect()
      const size = { width: Math.max(1, rect.width || 640), height: Math.max(1, rect.height || 390) }
      setBoundarySize(size)
      setPosition(current => clampPoint(loadPosition(boundaryId) || (current?.x === 534 && current?.y === 70 ? defaultPoint(size, defaultPosition) : current)))
    }
    sync()
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(sync)
      observer.observe(boundary)
      return () => observer.disconnect()
    }
    window.addEventListener("resize", sync)
    return () => window.removeEventListener("resize", sync)
  }, [boundaryId, defaultPosition])

  useEffect(() => {
    setPosition(loadPosition(boundaryId) || defaultPoint(boundarySize, defaultPosition))
  }, [boundaryId, chartMode])

  useEffect(() => {
    if (typeof document === "undefined" || !dragging) return undefined
    document.body.classList.add("cat-dragging")
    return () => document.body.classList.remove("cat-dragging")
  }, [dragging])

  const zoneId = useMemo(() => zoneForCatPosition(position, boundarySize, chartMode), [position, boundarySize, chartMode])
  const zone = CAT_PROBE_ZONES[zoneId] || CAT_PROBE_ZONES["hot-spot-region"]

  const pointFromEvent = event => {
    const rect = boundaryRef.current?.getBoundingClientRect?.()
    if (!rect) return position
    return clampPoint({
      x: event.clientX - rect.left - dragOffsetRef.current.x,
      y: event.clientY - rect.top - dragOffsetRef.current.y,
    })
  }

  const onPointerDown = event => {
    event.preventDefault()
    event.stopPropagation()
    const handleRect = handleRef.current?.getBoundingClientRect?.()
    dragOffsetRef.current = handleRect
      ? { x: event.clientX - handleRect.left, y: event.clientY - handleRect.top }
      : { x: CAT_SIZE.width / 2, y: CAT_SIZE.height / 2 }
    handleRef.current?.setPointerCapture?.(event.pointerId)
    setDragging(true)
  }

  const onPointerMove = event => {
    if (!dragging) return
    event.preventDefault()
    event.stopPropagation()
    setPosition(pointFromEvent(event))
  }

  const onPointerUp = event => {
    if (!dragging) return
    event.preventDefault()
    event.stopPropagation()
    const next = pointFromEvent(event)
    setPosition(next)
    storePosition(boundaryId, next)
    handleRef.current?.releasePointerCapture?.(event.pointerId)
    setDragging(false)
  }

  const bubbleLeft = clampCatPosition(position.x + CAT_SIZE.width + 6, 8, Math.max(8, boundarySize.width - 258))
  const bubbleTop = clampCatPosition(position.y + 2, 8, Math.max(8, boundarySize.height - 118))

  return (
    <div
      ref={boundaryRef}
      className="cat-probe-boundary hotspot-chart-shell"
      data-cat-boundary={boundaryId}
      data-cat-chart-mode={chartMode}
      style={{ borderRadius: 10, minWidth: 0, overflow: "hidden", position: "relative" }}
    >
      {children}
      <div
        className="catalysis-cat-probe-insight"
        style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 9, boxShadow: "0 12px 28px rgba(15, 23, 42, 0.14)", color: t.textStrong, display: "grid", gap: 3, left: bubbleLeft, lineHeight: 1.35, maxWidth: 250, padding: 9, pointerEvents: "none", position: "absolute", top: bubbleTop, zIndex: 31 }}
      >
        <strong style={{ fontSize: 12.1 }}>{zh ? zone.labelZh : zone.label}</strong>
        <span style={{ color: t.muted, fontSize: 11.2 }}>{zh ? zone.metricZh : zone.metric}</span>
        <span style={{ color: t.muted, fontSize: 11.1 }}>{zh ? zone.insightZh : zone.insight}</span>
      </div>
      <div
        ref={handleRef}
        aria-label={zh ? "图表内催化小猫探针" : "Chart-scoped catalysis cat probe"}
        className={`catalysis-cat-probe${dragging ? " is-dragging" : ""}`}
        data-testid="catalysis-cat-probe"
        data-cat-zone-active={zoneId}
        data-cat-boundary-id={boundaryId}
        data-cat-chart-mode={chartMode}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="button"
        tabIndex={0}
        style={{ height: CAT_SIZE.height, left: position.x, top: position.y, width: CAT_SIZE.width }}
      >
        <svg viewBox="0 0 130 150" width={CAT_SIZE.width} height={CAT_SIZE.height} aria-hidden="true" style={{ display: "block", filter: "drop-shadow(0 10px 16px rgba(15, 23, 42, 0.18))" }}>
          <CatalystCatSprite mood={dragging ? "stars" : "happy"} x={70} y={96} dragging={dragging} reducedMotion />
        </svg>
      </div>
    </div>
  )
}

