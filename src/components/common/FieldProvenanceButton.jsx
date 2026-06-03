// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

function viewportSize() {
  return {
    width: typeof window !== "undefined" ? window.innerWidth : 1440,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  }
}

function rectIsVisible(rect, viewportWidth, viewportHeight) {
  if (!rect) return false
  return rect.bottom >= 0 && rect.top <= viewportHeight && rect.right >= 0 && rect.left <= viewportWidth
}

export function computeFieldProvenancePanelStyle({
  anchorRect,
  isMobile = false,
  viewportWidth,
  viewportHeight,
  width = 380,
  maxHeight = 480,
  zIndex = 2200,
} = {}) {
  const fallback = viewportSize()
  const vw = viewportWidth || fallback.width
  const vh = viewportHeight || fallback.height

  if (isMobile || vw < 620) {
    return {
      position: "fixed",
      left: 0,
      right: 0,
      bottom: 0,
      top: "auto",
      width: "auto",
      maxHeight: "72vh",
      borderRadius: "14px 14px 0 0",
      zIndex,
      overflowY: "auto",
    }
  }

  const panelWidth = Math.min(width, Math.max(260, vw - 32))
  const belowSpace = Math.max(0, vh - (anchorRect?.bottom ?? 0) - 16)
  const aboveSpace = Math.max(0, (anchorRect?.top ?? 0) - 16)
  const placeAbove = belowSpace < 260 && aboveSpace > belowSpace
  const availableSpace = placeAbove ? aboveSpace : belowSpace
  const panelMaxHeight = Math.min(maxHeight, Math.max(220, availableSpace - 8))
  let top = placeAbove
    ? (anchorRect?.top ?? 0) - panelMaxHeight - 8
    : (anchorRect?.bottom ?? 0) + 8
  let left = (anchorRect?.left ?? 16)

  if (left + panelWidth > vw - 16) left = vw - panelWidth - 16
  if (left < 16) left = 16
  if (top + panelMaxHeight > vh - 16) top = vh - panelMaxHeight - 16
  if (top < 16) top = 16

  return {
    position: "fixed",
    top,
    left,
    width: panelWidth,
    maxHeight: panelMaxHeight,
    borderRadius: 12,
    zIndex,
    overflowY: "auto",
  }
}

export function AnchoredFieldProvenancePanel({
  open,
  anchorRef,
  isMobile = false,
  onClose,
  children,
  ariaLabel = "Field-level provenance",
  role = "dialog",
  style,
  width = 380,
  maxHeight = 480,
  zIndex = 2200,
  panelRef,
  testId = "field-provenance-popover",
}) {
  const localPanelRef = useRef(null)
  const activePanelRef = panelRef || localPanelRef
  const [panelStyle, setPanelStyle] = useState(null)

  const updatePosition = useCallback(() => {
    const anchor = anchorRef?.current
    if (!anchor) {
      onClose?.()
      return
    }

    const rect = anchor.getBoundingClientRect()
    const viewport = viewportSize()
    if (!rectIsVisible(rect, viewport.width, viewport.height)) {
      onClose?.()
      return
    }

    setPanelStyle(computeFieldProvenancePanelStyle({
      anchorRect: rect,
      isMobile,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      width,
      maxHeight,
      zIndex,
    }))
  }, [anchorRef, isMobile, maxHeight, onClose, width, zIndex])

  useEffect(() => {
    if (!open) return undefined
    updatePosition()

    const handleKey = event => {
      if (event.key === "Escape") onClose?.()
    }
    const handlePointer = event => {
      const anchor = anchorRef?.current
      const panel = activePanelRef?.current
      if (anchor?.contains(event.target) || panel?.contains(event.target)) return
      onClose?.()
    }

    window.addEventListener("keydown", handleKey)
    document.addEventListener("pointerdown", handlePointer, true)
    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("resize", updatePosition)
    return () => {
      window.removeEventListener("keydown", handleKey)
      document.removeEventListener("pointerdown", handlePointer, true)
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [activePanelRef, anchorRef, onClose, open, updatePosition])

  if (!open || typeof document === "undefined" || !panelStyle) return null

  return createPortal(
    <div
      ref={activePanelRef}
      role={role}
      aria-label={ariaLabel}
      data-testid={testId}
      style={{ ...panelStyle, ...style }}
      onClick={event => event.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  )
}
