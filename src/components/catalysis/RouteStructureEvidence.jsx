import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { organicAcidPalette as palette, ORGANIC_ACID_FONT } from "./FormulaInline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function dataUrl(filePath = "") {
  const base = import.meta.env.BASE_URL || "/"
  const normalizedBase = base.endsWith("/") ? base : `${base}/`
  return `${normalizedBase}${String(filePath).replace(/^\/+/, "")}`
}

function routeStructures(route = {}) {
  const rows = Array.isArray(route.participatingMofs)
    ? route.participatingMofs
    : Array.isArray(route.computationCohort?.displayedStructures)
      ? route.computationCohort.displayedStructures
      : []
  const seen = new Set()
  return rows.filter(row => {
    const id = row.id || `${row.csdRefcode}-${row.structureVariant}`
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export function RouteStructureEvidence({ route, lang = "zh", onViewHostStructure, compact = false }) {
  const structures = routeStructures(route)
  const availability = route?.structureAvailability || {}
  const pristineRoute = availability.status === "experimental-pristine-host-cif"
  const count = Number(route?.participatingMofCount ?? route?.computationCohort?.computationRecordCount ?? structures.length)
  if (!count && !structures.length) return null

  return (
    <section
      data-testid={`route-structure-evidence-${route?.routeId || "route"}`}
      style={{
        background: palette.surfaceStrong,
        border: `1px solid ${palette.border}`,
        borderRadius: 9,
        display: "grid",
        gap: 8,
        padding: compact ? 8 : 10,
      }}
    >
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "space-between" }}>
        <strong style={{ color: palette.text, fontSize: compact ? 10.7 : 12 }}>
          {text(lang, `实际计算结构 · ${count} 条 CR`, `Actual calculation structures · ${count} CR records`)}
        </strong>
        <span style={{
          background: pristineRoute ? palette.positiveSoft : palette.riskSoft,
          border: `1px solid ${pristineRoute ? palette.positive : palette.risk}`,
          borderRadius: 999,
          color: pristineRoute ? palette.positive : palette.risk,
          fontSize: 9.7,
          fontWeight: 900,
          padding: "3px 7px",
        }}>
          {text(
            lang,
            availability.labelZh || "假设路线，无对应 3D 晶体结构",
            availability.labelEn || "Hypothetical route; no corresponding 3D crystal structure",
          )}
        </span>
      </div>
      <p style={{ color: palette.muted, fontSize: compact ? 9.5 : 10.8, lineHeight: 1.5, margin: 0 }}>
        {text(
          lang,
          availability.hostStructureDisclosureZh || "下列 3D 是参与结构因子计算的未改性 CoRE 主体 CIF，不代表客体金属改性产物。",
          availability.hostStructureDisclosureEn || "The host CIFs below are unmodified CoRE structures used for structural-factor calculation; they do not represent the guest-metal-modified product.",
        )}
      </p>
      <div style={{ display: "grid", gap: 6 }}>
        {structures.map(structure => (
          <div
            key={structure.id || `${structure.csdRefcode}-${structure.structureVariant}`}
            style={{
              alignItems: "center",
              background: palette.bg,
              border: `1px solid ${palette.border}`,
              borderRadius: 8,
              display: "grid",
              gap: 8,
              gridTemplateColumns: "minmax(0, 1fr) auto",
              padding: compact ? "6px 7px" : "7px 8px",
            }}
          >
            <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
              <strong style={{ color: palette.text, fontSize: compact ? 10 : 11.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {structure.displayName || structure.csdRefcode || structure.coreId}
              </strong>
              <span style={{ color: palette.faint, fontSize: compact ? 8.8 : 9.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                CSD {structure.csdRefcode || "pending"} · {structure.structureVariant || "variant pending"} · CoRE {structure.coreId || "pending"}
              </span>
            </div>
            <button
              type="button"
              disabled={!structure.bundledCifPath}
              onClick={() => onViewHostStructure?.(structure, route)}
              style={{
                background: structure.bundledCifPath ? palette.accent : palette.surface,
                border: `1px solid ${structure.bundledCifPath ? palette.accent : palette.border}`,
                borderRadius: 7,
                color: structure.bundledCifPath ? "#fff" : palette.faint,
                cursor: structure.bundledCifPath ? "pointer" : "not-allowed",
                fontFamily: ORGANIC_ACID_FONT,
                fontSize: compact ? 9.4 : 10.4,
                fontWeight: 900,
                padding: compact ? "5px 7px" : "6px 9px",
              }}
            >
              {text(lang, "查看主体 3D", "View host 3D")}
            </button>
          </div>
        ))}
      </div>
      {count > structures.length ? (
        <span style={{ color: palette.faint, fontSize: compact ? 9 : 10.2, lineHeight: 1.4 }}>
          {text(
            lang,
            `当前列出 ${structures.length} 条可核验主体结构；同家族其余 ${count - structures.length} 条真实 CR 记录也参与家族聚合计算。`,
            `${structures.length} verifiable host structures are listed; the remaining ${count - structures.length} real CR records in the family also contribute to the family aggregate.`,
          )}
        </span>
      ) : null}
    </section>
  )
}

export function RouteHostStructureModal({ selection, lang = "zh", onClose }) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const [status, setStatus] = useState("loading")
  const [issue, setIssue] = useState("")
  const structure = selection?.structure
  const route = selection?.route
  const pristineRoute = route?.structureAvailability?.status === "experimental-pristine-host-cif"

  useEffect(() => {
    if (!structure?.bundledCifPath || !containerRef.current) return undefined
    const controller = new AbortController()
    let cancelled = false
    setStatus("loading")
    setIssue("")

    const load = async () => {
      try {
        const response = await fetch(dataUrl(structure.bundledCifPath), { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const cifText = await response.text()
        if (!/(?:^|\n)\s*data_/i.test(cifText) || !/_atom_site_/i.test(cifText)) {
          throw new Error(text(lang, "CIF 缺少可解析的原子坐标。", "The CIF has no parseable atom coordinates."))
        }
        const imported = await import("3dmol")
        if (cancelled || !containerRef.current) return
        const threeDmol = imported.default || imported
        const viewer = threeDmol.createViewer(containerRef.current, {
          antialias: true,
          backgroundColor: "#f8fbfd",
        })
        viewerRef.current = viewer
        const model = viewer.addModel(cifText, "cif")
        viewer.setStyle({ model }, {
          stick: { radius: 0.12, colorscheme: "Jmol" },
          sphere: { scale: 0.25, colorscheme: "Jmol" },
        })
        viewer.addUnitCell(model, {
          box: { color: "#2f7f8c" },
          alabel: "a",
          blabel: "b",
          clabel: "c",
          alabelstyle: { fontColor: "#14252b", backgroundOpacity: 0, inFront: true, fontSize: 12 },
          blabelstyle: { fontColor: "#14252b", backgroundOpacity: 0, inFront: true, fontSize: 12 },
          clabelstyle: { fontColor: "#14252b", backgroundOpacity: 0, inFront: true, fontSize: 12 },
        })
        viewer.zoomTo({ model })
        viewer.render()
        setStatus("ready")
      } catch (error) {
        if (cancelled || controller.signal.aborted) return
        setStatus("error")
        setIssue(error instanceof Error ? error.message : String(error))
      }
    }
    void load()
    return () => {
      cancelled = true
      controller.abort()
      viewerRef.current?.removeAllModels()
      viewerRef.current?.removeAllShapes()
      viewerRef.current = null
    }
  }, [lang, structure])

  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key === "Escape") onClose?.()
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [onClose])

  if (!structure) return null
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={text(lang, "参与计算的主体 MOF 三维结构", "3D host MOF used in calculation")}
      data-testid="route-host-structure-modal"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose?.()
      }}
      style={{
        alignItems: "center",
        background: "rgba(10, 25, 33, 0.72)",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        padding: 18,
        position: "fixed",
        zIndex: 1800,
      }}
    >
      <section style={{ background: "#fff", border: "1px solid #bfd0d6", borderRadius: 14, boxShadow: "0 30px 90px rgba(5, 22, 30, .34)", display: "grid", gap: 12, maxHeight: "92vh", maxWidth: 1040, overflow: "auto", padding: 14, width: "min(1040px, 96vw)" }}>
        <header style={{ alignItems: "start", display: "flex", gap: 12, justifyContent: "space-between" }}>
          <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
            <span style={{ color: "#2f7f8c", fontSize: 10.5, fontWeight: 950, letterSpacing: ".08em", textTransform: "uppercase" }}>
              {pristineRoute
                ? text(lang, "CoRE 未改性主体对照结构", "CoRE pristine-host control structure")
                : text(lang, "CoRE 主体计算结构 · 非改性产物", "CoRE host calculation structure · not modified product")}
            </span>
            <h2 style={{ color: "#13242b", fontFamily: ORGANIC_ACID_FONT, fontSize: 20, lineHeight: 1.2, margin: 0 }}>
              {structure.displayName || structure.csdRefcode}
            </h2>
            <span style={{ color: "#657b84", fontSize: 11.5 }}>
              CSD {structure.csdRefcode || "pending"} · {structure.structureVariant || "variant pending"} · CoRE {structure.coreId || "pending"}
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ background: "#f3f7f8", border: "1px solid #bfd0d6", borderRadius: 8, color: "#243c45", cursor: "pointer", fontSize: 18, height: 34, width: 34 }}>×</button>
        </header>
        <div style={{
          background: pristineRoute ? "#eef9f2" : "#fff4ec",
          border: `1px solid ${pristineRoute ? "#3f8c5b" : "#c9602f"}`,
          borderRadius: 9,
          color: pristineRoute ? "#27623c" : "#8a3b1d",
          fontSize: 12,
          fontWeight: 800,
          lineHeight: 1.55,
          padding: "9px 11px",
        }}>
          {text(
            lang,
            pristineRoute
              ? `这是 ${route?.hostMof || "主体 MOF"} 未改性对照路线中参与 HGCPS 结构因子计算的真实主体 CIF。`
              : `这是 ${route?.hostMof || "主体 MOF"} 家族参与 HGCPS 结构因子计算的主体 CIF。${route?.guestMetal || "客体金属"} 改性尚无经验证的实验 CIF，因此本窗口不代表“${route?.hostMof || "主体"} + ${route?.guestMetal || "客体"}”改性晶体结构。`,
            pristineRoute
              ? `This is a real host CIF used in the ${route?.hostMof || "host MOF"} pristine-control HGCPS structural-factor calculation.`
              : `This is a host CIF used in the ${route?.hostMof || "host MOF"} HGCPS structural-factor calculation. No validated experimental CIF is mapped for the ${route?.guestMetal || "guest-metal"} modification, so this view does not represent the “${route?.hostMof || "host"} + ${route?.guestMetal || "guest"}” modified crystal structure.`,
          )}
        </div>
        <div ref={containerRef} style={{ background: "#f8fbfd", border: "1px solid #d7e2e6", borderRadius: 10, height: "min(62vh, 620px)", minHeight: 380, overflow: "hidden", position: "relative" }}>
          {status === "loading" ? <div style={{ color: "#657b84", inset: 0, padding: 24, position: "absolute" }}>{text(lang, "正在载入并解析 CIF…", "Loading and parsing CIF…")}</div> : null}
          {status === "error" ? <div style={{ color: "#a24324", inset: 0, padding: 24, position: "absolute" }}>{text(lang, `三维解析失败：${issue}`, `3D parsing failed: ${issue}`)}</div> : null}
        </div>
      </section>
    </div>,
    document.body,
  )
}
