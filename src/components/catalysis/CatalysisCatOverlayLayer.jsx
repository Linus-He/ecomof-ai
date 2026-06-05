// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react"
import { CatalystCatSprite } from "./CatalystCatSprite"

const CAT_OVERLAY_STORAGE_KEY = "ecomof-catalysis-cat-overlay-point"

export const CAT_ZONE_CONFIG = {
  "run-launcher": {
    label: "Run Launcher",
    labelZh: "运行启动器",
    metric: "data mode / quality-gated run trace",
    metricZh: "数据模式 / 带质量门运行追踪",
    insight: "Curated mode validates mapper, quality gates, evidence links, and hot spot projection without full database screening.",
    insightZh: "Curated 模式验证 mapper、quality gate、证据挂接和热区投影，不做全量数据库筛选。",
  },
  "hydrothermal-gate": {
    label: "Hydrothermal Gate",
    labelZh: "水热门槛",
    metric: ">=150 C water stability + post-treatment PXRD",
    metricZh: ">=150 C 水稳定性 + 处理后 PXRD",
    insight: "High surface area cannot override a missing or failed hydrothermal gate.",
    insightZh: "高比表面积不能抵消缺失或失败的水热门槛。",
  },
  "oacs-ranking": {
    label: "OACS Ranking",
    labelZh: "OACS 骨架排序",
    metric: "eligible Al-MOF scaffold score",
    metricZh: "合格 Al-MOF 骨架分数",
    insight: "Needs-review records stay auditable but cannot enter the final recommendation.",
    insightZh: "需复核记录保持可审计，但不能进入最终推荐。",
  },
  "dmrs-recommendation": {
    label: "Dopant Recommendation",
    labelZh: "第二金属推荐",
    metric: "DMRS / Mo-W-V-Ti-Zr-Fe comparison",
    metricZh: "DMRS / Mo-W-V-Ti-Zr-Fe 对比",
    insight: "Mo remains a primary hypothesis, not proven optimal. W and other competitors stay visible.",
    insightZh: "Mo 仍是主要假设，不是已证明最优；W 与其他竞品保持可见。",
  },
  "hot-spot-map": {
    label: "Hot Spot Map",
    labelZh: "热区图",
    metric: "hydrothermal evidence x C1 accessibility",
    metricZh: "水热证据 x C1 中间体可及性",
    insight: "Curated real examples are projected with ready, needs-review, and rejected roles.",
    insightZh: "人工整理真实样例以 ready、needs-review、rejected 角色投影。",
  },
  exafs: {
    label: "EXAFS",
    labelZh: "EXAFS",
    metric: "falsifiable Mo-oxo anchoring signature",
    metricZh: "可证伪 Mo-oxo 锚定特征",
    insight: "EXAFS is a validation plan, not completed evidence of Mo performance.",
    insightZh: "EXAFS 是验证计划，不是 Mo 性能已验证证据。",
  },
}

function clamp(value, min, max) {
  const number = Number(value)
  if (!Number.isFinite(number)) return min
  return Math.max(min, Math.min(max, number))
}

function loadStoredPoint() {
  if (typeof window === "undefined") return null
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(CAT_OVERLAY_STORAGE_KEY) || "null")
    if (Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y)) return parsed
  } catch {
    return null
  }
  return null
}

function storePoint(point) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(CAT_OVERLAY_STORAGE_KEY, JSON.stringify(point))
  } catch {
    // Drag still works when storage is unavailable.
  }
}

function nearestZone(workspace, clientX, clientY) {
  if (!workspace || typeof document === "undefined") return null
  const zones = Array.from(workspace.querySelectorAll("[data-cat-zone]"))
    .map(node => {
      const zoneId = node.getAttribute("data-cat-zone")
      const config = CAT_ZONE_CONFIG[zoneId]
      if (!config) return null
      const rect = node.getBoundingClientRect()
      const inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const distance = Math.hypot(clientX - centerX, clientY - centerY)
      return { id: zoneId, ...config, inside, distance }
    })
    .filter(Boolean)
  return zones.find(zone => zone.inside) || zones.sort((a, b) => a.distance - b.distance)[0] || null
}

function fallbackZone() {
  return { id: "hot-spot-map", ...CAT_ZONE_CONFIG["hot-spot-map"] }
}

export function CatalysisCatOverlayLayer({ workspaceRef, lang, t, isMobile }) {
  const zh = lang === "zh"
  const handleRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [point, setPoint] = useState(() => loadStoredPoint() || { x: isMobile ? 18 : 44, y: 118 })
  const [zone, setZone] = useState(fallbackZone)

  const clampedPoint = useMemo(() => {
    const rect = workspaceRef?.current?.getBoundingClientRect?.()
    const maxX = Math.max(20, (rect?.width || 360) - 124)
    const maxY = Math.max(20, (workspaceRef?.current?.scrollHeight || rect?.height || 640) - 132)
    return {
      x: clamp(point.x, 16, maxX),
      y: clamp(point.y, 16, maxY),
    }
  }, [point, workspaceRef])

  useEffect(() => {
    const workspace = workspaceRef?.current
    if (!workspace) return
    const rect = workspace.getBoundingClientRect()
    const nextZone = nearestZone(workspace, rect.left + clampedPoint.x + 54, rect.top + clampedPoint.y + 62) || fallbackZone()
    setZone(nextZone)
  }, [clampedPoint.x, clampedPoint.y, workspaceRef])

  const pointFromEvent = event => {
    const rect = workspaceRef?.current?.getBoundingClientRect?.()
    if (!rect) return clampedPoint
    return {
      x: event.clientX - rect.left - 54,
      y: event.clientY - rect.top - 62,
    }
  }

  const commitPoint = (event, persist = false) => {
    const rect = workspaceRef?.current?.getBoundingClientRect?.()
    const raw = pointFromEvent(event)
    const next = {
      x: clamp(raw.x, 16, Math.max(20, (rect?.width || 360) - 124)),
      y: clamp(raw.y, 16, Math.max(20, (workspaceRef?.current?.scrollHeight || rect?.height || 640) - 132)),
    }
    setPoint(next)
    const nextZone = nearestZone(workspaceRef?.current, event.clientX, event.clientY) || zone || fallbackZone()
    setZone(nextZone)
    if (persist) storePoint(next)
  }

  const onPointerDown = event => {
    event.preventDefault()
    event.stopPropagation()
    handleRef.current?.setPointerCapture?.(event.pointerId)
    setDragging(true)
    commitPoint(event)
  }

  const onPointerMove = event => {
    if (!dragging) return
    event.preventDefault()
    event.stopPropagation()
    commitPoint(event)
  }

  const onPointerUp = event => {
    if (!dragging) return
    event.preventDefault()
    event.stopPropagation()
    handleRef.current?.releasePointerCapture?.(event.pointerId)
    commitPoint(event, true)
    setDragging(false)
  }

  const bubbleLeft = clamp(clampedPoint.x + 108, 10, Math.max(10, (workspaceRef?.current?.clientWidth || 380) - 300))
  const bubbleTop = Math.max(12, clampedPoint.y - 4)

  return (
    <div
      aria-hidden={false}
      className="catalysis-cat-overlay-layer"
      style={{ inset: 0, overflow: "visible", pointerEvents: "none", position: "absolute", zIndex: 60 }}
    >
      <div
        className="catalysis-cat-overlay-bubble"
        style={{
          background: t.badgeInfoBg,
          border: `1px solid ${t.accent}`,
          borderRadius: 10,
          boxShadow: "0 18px 36px rgba(15, 23, 42, 0.12)",
          color: t.textStrong,
          display: "grid",
          gap: 4,
          left: bubbleLeft,
          lineHeight: 1.35,
          maxWidth: 286,
          padding: 10,
          pointerEvents: "none",
          position: "absolute",
          top: bubbleTop,
          zIndex: 61,
        }}
      >
        <strong style={{ fontSize: 12.5 }}>{zh ? zone.labelZh : zone.label}</strong>
        <span style={{ color: t.muted, fontSize: 11.6 }}>{zh ? zone.metricZh : zone.metric}</span>
        <span style={{ color: t.muted, fontSize: 11.4 }}>{zh ? zone.insightZh : zone.insight}</span>
      </div>
      <div
        ref={handleRef}
        aria-label={zh ? "拖拽催化小猫" : "Drag catalyst cat"}
        className="catalysis-cat-overlay-handle"
        data-testid="catalysis-cat-overlay-handle"
        data-cat-zone-active={zone.id}
        data-dragging={dragging ? "true" : "false"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        tabIndex={0}
        style={{
          cursor: dragging ? "grabbing" : "grab",
          height: 124,
          left: clampedPoint.x,
          outline: "none",
          pointerEvents: "auto",
          position: "absolute",
          top: clampedPoint.y,
          touchAction: "none",
          userSelect: "none",
          width: 116,
          zIndex: 62,
        }}
      >
        <svg viewBox="0 0 130 150" width="116" height="124" aria-hidden="true" style={{ display: "block", filter: "drop-shadow(0 12px 18px rgba(15, 23, 42, 0.18))" }}>
          <CatalystCatSprite mood={dragging ? "stars" : "happy"} x={70} y={96} dragging={dragging} reducedMotion />
        </svg>
      </div>
    </div>
  )
}
