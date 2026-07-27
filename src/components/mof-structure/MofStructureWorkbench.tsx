// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import quickHull from "quickhull3d/dist/quickhull3d.js"
import {
  ArrowsClockwise,
  Atom,
  Camera,
  CheckCircle,
  CloudArrowDown,
  Cube,
  CubeTransparent,
  Database,
  Eye,
  EyeSlash,
  Info,
  LinkSimple,
  MagnifyingGlass,
  Pause,
  Play,
  ShieldCheck,
  Stack,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react"
import "./MofStructureWorkbench.css"

const METAL_ELEMENTS = new Set([
  "Ac", "Ag", "Al", "Am", "Au", "Ba", "Be", "Bi", "Bk", "Ca", "Cd", "Ce", "Cf",
  "Cm", "Co", "Cr", "Cs", "Cu", "Dy", "Er", "Eu", "Fe", "Fm", "Fr", "Ga", "Gd",
  "Hf", "Hg", "Ho", "In", "Ir", "K", "La", "Li", "Lu", "Md", "Mg", "Mn", "Mo",
  "Na", "Nb", "Nd", "Ni", "Np", "Os", "Pa", "Pb", "Pd", "Pm", "Po", "Pr", "Pt",
  "Pu", "Ra", "Rb", "Re", "Rh", "Ru", "Sc", "Sm", "Sn", "Sr", "Ta", "Tb", "Tc",
  "Th", "Ti", "Tl", "Tm", "U", "V", "W", "Y", "Yb", "Zn", "Zr",
])
const DONOR_ELEMENTS = new Set(["O", "N", "S", "F", "Cl", "Br", "I"])
const METAL_COLORS = {
  Al: "#8a98a8",
  Co: "#3f66c7",
  Cr: "#668d49",
  Cu: "#1f9a97",
  Fe: "#b45d37",
  Hf: "#478f9f",
  Mg: "#6eaa5c",
  Ni: "#4d9a6a",
  Zn: "#7890b8",
  Zr: "#38a7a5",
}

const CUTOFFS = {
  Al: 2.65,
  Co: 2.7,
  Cr: 2.8,
  Cu: 2.75,
  Fe: 2.8,
  Hf: 3.05,
  Mg: 2.85,
  Ni: 2.65,
  Zn: 2.8,
  Zr: 3.1,
}

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function normalizeElement(value) {
  const raw = String(value || "").replace(/[^A-Za-z]/g, "")
  if (!raw) return ""
  return `${raw[0].toUpperCase()}${raw.slice(1).toLowerCase()}`
}

function finiteCoordinate(atom) {
  return Number.isFinite(Number(atom?.x)) && Number.isFinite(Number(atom?.y)) && Number.isFinite(Number(atom?.z))
}

function distanceBetween(a, b) {
  const dx = Number(a.x) - Number(b.x)
  const dy = Number(a.y) - Number(b.y)
  const dz = Number(a.z) - Number(b.z)
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function cifNumber(source, field) {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = String(source || "").match(new RegExp(`^\\s*${escaped}\\s+([^\\s#]+)`, "im"))
  const normalized = String(match?.[1] || "").replace(/^['"]|['"]$/g, "").replace(/\([^)]*\)$/, "")
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

export function parseCifCellVectors(source) {
  const a = cifNumber(source, "_cell_length_a")
  const b = cifNumber(source, "_cell_length_b")
  const c = cifNumber(source, "_cell_length_c")
  const alpha = cifNumber(source, "_cell_angle_alpha")
  const beta = cifNumber(source, "_cell_angle_beta")
  const gamma = cifNumber(source, "_cell_angle_gamma")
  if (![a, b, c, alpha, beta, gamma].every(Number.isFinite)) return null

  const radians = degrees => degrees * Math.PI / 180
  const cosAlpha = Math.cos(radians(alpha))
  const cosBeta = Math.cos(radians(beta))
  const cosGamma = Math.cos(radians(gamma))
  const sinGamma = Math.sin(radians(gamma))
  if (Math.abs(sinGamma) < 1e-8) return null
  const cx = c * cosBeta
  const cy = c * (cosAlpha - cosBeta * cosGamma) / sinGamma
  const czSquared = c * c - cx * cx - cy * cy
  if (czSquared <= 0) return null
  return {
    a: [a, 0, 0],
    b: [b * cosGamma, b * sinGamma, 0],
    c: [cx, cy, Math.sqrt(czSquared)],
  }
}

function nearestPeriodicImage(center, atom, cellVectors) {
  if (!cellVectors) return { atom, distance: distanceBetween(center, atom) }
  let nearest = { atom, distance: distanceBetween(center, atom) }
  for (let aShift = -1; aShift <= 1; aShift += 1) {
    for (let bShift = -1; bShift <= 1; bShift += 1) {
      for (let cShift = -1; cShift <= 1; cShift += 1) {
        const shifted = {
          ...atom,
          x: Number(atom.x) + aShift * cellVectors.a[0] + bShift * cellVectors.b[0] + cShift * cellVectors.c[0],
          y: Number(atom.y) + aShift * cellVectors.a[1] + bShift * cellVectors.b[1] + cShift * cellVectors.c[1],
          z: Number(atom.z) + aShift * cellVectors.a[2] + bShift * cellVectors.b[2] + cShift * cellVectors.c[2],
          _periodicShift: [aShift, bShift, cShift],
        }
        const distance = distanceBetween(center, shifted)
        if (distance < nearest.distance) nearest = { atom: shifted, distance }
      }
    }
  }
  return nearest
}

export function deriveCoordinationPolyhedra(atoms = [], options = {}) {
  const validAtoms = atoms
    .filter(finiteCoordinate)
    .map((atom, position) => ({
      ...atom,
      _position: position,
      _index: Number.isFinite(Number(atom.index)) ? Number(atom.index) : position,
      _element: normalizeElement(atom.elem || atom.atom),
    }))
  const byIndex = new Map(validAtoms.map(atom => [atom._index, atom]))
  const maxCenters = Number(options.maxCenters || 64)
  const centers = validAtoms.filter(atom => METAL_ELEMENTS.has(atom._element)).slice(0, maxCenters)

  return centers.flatMap(center => {
    const cutoff = Number(options.cutoff || CUTOFFS[center._element] || 2.85)
    const bondedIndices = new Set(
      Array.isArray(center.bonds)
        ? center.bonds.map(index => Number(index))
        : [],
    )
    const candidates = validAtoms
      .filter(atom => atom._index !== center._index && DONOR_ELEMENTS.has(atom._element))
      .map(atom => nearestPeriodicImage(center, atom, options.cellVectors))
      .filter(candidate => candidate.distance >= 1.25 && candidate.distance <= cutoff)
      .sort((a, b) => {
        const aBonded = bondedIndices.has(a.atom._index) ? -1 : 0
        const bBonded = bondedIndices.has(b.atom._index) ? -1 : 0
        return aBonded - bBonded || a.distance - b.distance
      })

    const seen = new Set()
    const neighbors = candidates
      .filter(candidate => {
        const coordinateKey = [
          Math.round(Number(candidate.atom.x) * 20),
          Math.round(Number(candidate.atom.y) * 20),
          Math.round(Number(candidate.atom.z) * 20),
        ].join(":")
        if (seen.has(coordinateKey)) return false
        seen.add(coordinateKey)
        return true
      })
      .slice(0, 12)

    if (neighbors.length < 4) return []
    const pointArrays = neighbors.map(({ atom }) => [Number(atom.x), Number(atom.y), Number(atom.z)])
    let faces = []
    try {
      faces = quickHull(pointArrays)
    } catch {
      return []
    }
    if (!Array.isArray(faces) || !faces.length) return []
    return [{
      center,
      element: center._element,
      neighbors: neighbors.map(candidate => candidate.atom),
      distances: neighbors.map(candidate => candidate.distance),
      vertices: pointArrays.map(([x, y, z]) => ({ x, y, z })),
      faces,
    }]
  })
}

export function summarizeStructureAtoms(atoms = [], polyhedra = []) {
  const elements = atoms.reduce((counts, atom) => {
    const element = normalizeElement(atom?.elem || atom?.atom)
    if (element) counts[element] = (counts[element] || 0) + 1
    return counts
  }, {})
  return {
    atomCount: atoms.length,
    metalCount: atoms.filter(atom => METAL_ELEMENTS.has(normalizeElement(atom?.elem || atom?.atom))).length,
    polyhedraCount: polyhedra.length,
    elements,
  }
}

function makeViewerStyle(t) {
  return {
    backgroundColor: t.surface === "#111820" ? "#0c141d" : "#f8fbfd",
    antialias: true,
  }
}

function atomStyle() {
  return {
    stick: { radius: 0.115, colorscheme: "Jmol" },
    sphere: { scale: 0.24, colorscheme: "Jmol" },
  }
}

function clusterStyle() {
  return {
    stick: { radius: 0.15, colorscheme: "Jmol" },
    sphere: { scale: 0.31, colorscheme: "Jmol" },
  }
}

function structureSourceStatus(item, pilotRecord) {
  if (pilotRecord?.viewerStatus === "ready") return "ready"
  if (item?.cifUrl || item?.structure?.cifUrl) return "remote-pending-license-check"
  if (item?.cifFile || item?.structure?.cifFile) return "filename-only"
  return "unmatched"
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—"
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function SourceRow({ label, children }) {
  return (
    <div className="mof-structure-source-row">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  )
}

function CompactPill({ tone = "neutral", icon: Icon, children }) {
  return (
    <span className={`mof-structure-pill mof-structure-pill--${tone}`}>
      {Icon ? <Icon aria-hidden="true" size={14} weight="bold" /> : null}
      {children}
    </span>
  )
}

export function MofStructureWorkbench({ item, pilotManifest, publicCatalog, catalogStatus = "loading", lang, t, isMobile }) {
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const viewerRef = useRef(null)
  const modelRef = useRef(null)
  const polyhedraRef = useRef([])
  const initialViewRef = useRef(null)
  const remoteRequestRef = useRef(null)
  const defaultCatalogRecordRef = useRef(false)
  const [cifText, setCifText] = useState("")
  const [viewerStatus, setViewerStatus] = useState("idle")
  const [viewerError, setViewerError] = useState("")
  const [fileMeta, setFileMeta] = useState(null)
  const [catalogQuery, setCatalogQuery] = useState("")
  const [activeCsdRecord, setActiveCsdRecord] = useState(null)
  const [viewMode, setViewMode] = useState("cell")
  const [polyhedraMode, setPolyhedraMode] = useState("translucent")
  const [depth, setDepth] = useState(6)
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedAtom, setSelectedAtom] = useState(null)
  const [stats, setStats] = useState({ atomCount: 0, metalCount: 0, polyhedraCount: 0, elements: {} })

  const pilotRecords = Array.isArray(pilotManifest?.records) ? pilotManifest.records : []
  const pilotRecord = useMemo(() => {
    const values = [item?.id, item?.name, item?.displayName, item?.rawName]
      .filter(Boolean)
      .map(value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ""))
    return pilotRecords.find(record => {
      const recordValues = [record.canonicalId, record.displayName, ...(record.aliases || [])]
        .filter(Boolean)
        .map(value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ""))
      return values.some(value => recordValues.includes(value))
    }) || null
  }, [item, pilotRecords])
  const sourceStatus = structureSourceStatus(item, pilotRecord)
  const readyPilotCount = pilotRecords.filter(record => record.viewerStatus === "ready").length
  const hasCuratedScenes = Boolean(pilotRecord?.scenes?.cluster || pilotRecord?.scenes?.pore1 || pilotRecord?.scenes?.topology)
  const publicRecords = Array.isArray(publicCatalog?.structures) ? publicCatalog.structures : []
  const publicRecordCount = Number(publicCatalog?.summary?.total || publicRecords.length)
  const publicCatalogReady = catalogStatus === "ready" && publicRecords.length > 0
  const publicCatalogMatches = useMemo(() => {
    if (!publicRecords.length) return []
    const query = catalogQuery.trim().toUpperCase()
    if (!query) {
      const featured = activeCsdRecord
        ? [activeCsdRecord, ...publicRecords.filter(record => record.refcode !== activeCsdRecord.refcode)]
        : publicRecords
      return featured.slice(0, 6)
    }
    return publicRecords
      .filter(record => {
        const refcode = String(record.refcode || "").toUpperCase()
        const formula = String(record.formula || "").toUpperCase()
        const metals = Array.isArray(record.metalElements) ? record.metalElements.join(" ").toUpperCase() : ""
        return refcode.includes(query) || formula.includes(query) || metals.split(/\s+/).includes(query)
      })
      .sort((a, b) => {
        const aExact = String(a.refcode || "").toUpperCase() === query ? -2 : String(a.refcode || "").toUpperCase().startsWith(query) ? -1 : 0
        const bExact = String(b.refcode || "").toUpperCase() === query ? -2 : String(b.refcode || "").toUpperCase().startsWith(query) ? -1 : 0
        return aExact - bExact || String(a.refcode).localeCompare(String(b.refcode))
      })
      .slice(0, 8)
  }, [activeCsdRecord, catalogQuery, publicRecords])

  const applyRepresentation = useCallback((mode = "cell") => {
    const viewer = viewerRef.current
    const model = modelRef.current
    if (!viewer || !model) return
    viewer.setStyle({}, {})
    if (mode === "cluster" && polyhedraRef.current.length) {
      const indices = [...new Set(polyhedraRef.current.flatMap(polyhedron => [
        polyhedron.center._index,
        ...polyhedron.neighbors.map(atom => atom._index),
      ]))]
      viewer.setStyle({ model, index: indices }, clusterStyle())
      viewer.zoomTo({ model, index: indices }, 240)
    } else {
      viewer.setStyle({ model }, atomStyle())
      viewer.zoomTo({ model }, 240)
    }
    viewer.render()
  }, [])

  const renderPolyhedra = useCallback((mode = "translucent") => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.removeAllShapes()
    if (mode !== "off") {
      const opacity = mode === "opaque" ? 0.78 : 0.28
      polyhedraRef.current.forEach(polyhedron => {
        const color = METAL_COLORS[polyhedron.element] || "#4a9aa4"
        const faceArr = polyhedron.faces.flatMap(face => face)
        viewer.addCustom({
          vertexArr: polyhedron.vertices,
          faceArr,
          color,
          opacity,
        })
        viewer.addCustom({
          vertexArr: polyhedron.vertices,
          faceArr,
          color: "#1d5860",
          opacity: Math.min(0.9, opacity + 0.26),
          wireframe: true,
        })
      })
    }
    viewer.render()
  }, [])

  useEffect(() => {
    if (!cifText || !containerRef.current) return
    let cancelled = false
    setViewerStatus("loading")
    setViewerError("")

    const load = async () => {
      try {
        const imported = await import("3dmol")
        if (cancelled || !containerRef.current) return
        const threeDmol = imported.default || imported
        if (!viewerRef.current) {
          viewerRef.current = threeDmol.createViewer(containerRef.current, makeViewerStyle(t))
        } else {
          viewerRef.current.removeAllModels()
          viewerRef.current.removeAllShapes()
          viewerRef.current.removeAllLabels()
        }
        const viewer = viewerRef.current
        const model = viewer.addModel(cifText, "cif")
        modelRef.current = model
        viewer.setStyle({ model }, atomStyle())
        viewer.addUnitCell(model, {
          box: { color: t.accent },
          alabel: "a",
          blabel: "b",
          clabel: "c",
          alabelstyle: { fontColor: t.textStrong, backgroundOpacity: 0, inFront: true, fontSize: 13 },
          blabelstyle: { fontColor: t.textStrong, backgroundOpacity: 0, inFront: true, fontSize: 13 },
          clabelstyle: { fontColor: t.textStrong, backgroundOpacity: 0, inFront: true, fontSize: 13 },
        })
        viewer.zoomTo({ model })
        const atoms = viewer.selectedAtoms({ model })
        const polyhedra = deriveCoordinationPolyhedra(atoms, {
          cellVectors: parseCifCellVectors(cifText),
        })
        polyhedraRef.current = polyhedra
        setStats(summarizeStructureAtoms(atoms, polyhedra))
        viewer.setClickable({ model }, true, atom => {
          setSelectedAtom({
            element: normalizeElement(atom.elem || atom.atom),
            atom: atom.atom || atom.elem,
            index: atom.index,
            x: Number(atom.x),
            y: Number(atom.y),
            z: Number(atom.z),
          })
        })
        initialViewRef.current = viewer.getView()
        setViewMode("cell")
        setViewerStatus("ready")
        viewer.render()
        window.setTimeout(() => {
          if (!cancelled) renderPolyhedra(polyhedraMode)
        }, 0)
      } catch (error) {
        if (cancelled) return
        setViewerStatus("error")
        setViewerError(error instanceof Error ? error.message : String(error))
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [cifText, t, renderPolyhedra])

  useEffect(() => {
    if (viewerStatus !== "ready") return
    renderPolyhedra(polyhedraMode)
  }, [polyhedraMode, renderPolyhedra, viewerStatus])

  useEffect(() => {
    if (viewerStatus !== "ready") return
    const viewer = viewerRef.current
    if (!viewer) return
    const near = -8 - depth * 5
    const far = 14 + depth * 13
    viewer.setSlab(near, far)
    viewer.render()
  }, [depth, viewerStatus])

  useEffect(() => {
    if (viewerStatus !== "ready") return
    applyRepresentation(viewMode)
    renderPolyhedra(polyhedraMode)
  }, [applyRepresentation, renderPolyhedra, polyhedraMode, viewMode, viewerStatus])

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => {
      viewerRef.current?.resize()
      viewerRef.current?.render()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => () => {
    remoteRequestRef.current?.abort()
    viewerRef.current?.spin(false)
    viewerRef.current?.removeAllModels()
    viewerRef.current = null
  }, [])

  const loadPublicRecord = useCallback(async record => {
    if (!record?.cifUrl) return
    remoteRequestRef.current?.abort()
    const controller = new AbortController()
    remoteRequestRef.current = controller
    setActiveCsdRecord(record)
    setCatalogQuery(record.refcode || "")
    setSelectedAtom(null)
    setIsSpinning(false)
    setCifText("")
    setFileMeta(null)
    setViewerError("")
    setViewerStatus("loading")
    try {
      const response = await fetch(record.cifUrl, { mode: "cors", signal: controller.signal })
      if (!response.ok) throw new Error(`CIF request failed: ${response.status}`)
      const source = await response.text()
      if (!/(?:^|\n)\s*data_/i.test(source) || !/_atom_site_/i.test(source)) {
        throw new Error(text(lang, "远程文件缺少 CIF data_ block 或 atom_site 坐标。", "The remote file lacks a CIF data block or atom-site coordinates."))
      }
      if (controller.signal.aborted) return
      const responseBytes = Number(response.headers.get("content-length"))
      setFileMeta({
        name: record.file,
        size: Number.isFinite(responseBytes) && responseBytes > 0 ? responseBytes : record.bytes,
        sourceType: "csd-public",
        url: record.cifUrl,
        loadedAt: new Date().toISOString(),
      })
      setCifText(source)
    } catch (error) {
      if (controller.signal.aborted) return
      setViewerStatus("error")
      setViewerError(
        text(
          lang,
          `无法从公共数据站加载 ${record.refcode}。请稍后重试，或载入本地 CIF。`,
          `Could not load ${record.refcode} from the public data site. Retry later or load a local CIF.`,
        ),
      )
      console.warn("CSD public CIF could not be loaded.", error)
    }
  }, [lang])

  useEffect(() => {
    if (defaultCatalogRecordRef.current || !publicCatalogReady) return
    const defaultRecord = publicRecords.find(record => record.refcode === "ABADUG") || publicRecords[0]
    if (!defaultRecord) return
    defaultCatalogRecordRef.current = true
    void loadPublicRecord(defaultRecord)
  }, [loadPublicRecord, publicCatalogReady, publicRecords])

  const handleFile = async event => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      setViewerStatus("error")
      setViewerError(text(lang, "CIF 超过 15 MB，本地预览暂不加载。", "The CIF exceeds the 15 MB local-preview limit."))
      return
    }
    const source = await file.text()
    if (!/(?:^|\n)\s*data_/i.test(source) || !/_atom_site_/i.test(source)) {
      setViewerStatus("error")
      setViewerError(text(lang, "文件缺少 CIF data_ block 或 atom_site 坐标。", "The file does not contain a CIF data block or atom-site coordinates."))
      return
    }
    setSelectedAtom(null)
    setIsSpinning(false)
    remoteRequestRef.current?.abort()
    setActiveCsdRecord(null)
    setFileMeta({
      name: file.name,
      size: file.size,
      sourceType: "user-local",
      loadedAt: new Date().toISOString(),
    })
    setCifText(source)
    event.target.value = ""
  }

  const handleReset = () => {
    const viewer = viewerRef.current
    if (!viewer) return
    if (initialViewRef.current) viewer.setView(initialViewRef.current)
    else viewer.zoomTo()
    viewer.render()
  }

  const toggleSpin = () => {
    const viewer = viewerRef.current
    if (!viewer) return
    const next = !isSpinning
    viewer.spin(next ? "y" : false, 0.65)
    setIsSpinning(next)
  }

  const downloadImage = () => {
    const viewer = viewerRef.current
    if (!viewer || viewerStatus !== "ready") return
    const link = document.createElement("a")
    link.href = viewer.pngURI()
    link.download = `${String(fileMeta?.name || item?.name || "mof-structure").replace(/\.cif$/i, "")}-ecomof-view.png`
    link.click()
  }

  const handleDepthKeyDown = event => {
    const direction = event.key === "ArrowRight" || event.key === "ArrowUp"
      ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowDown"
        ? -1
        : 0
    if (!direction) return
    event.preventDefault()
    setDepth(current => Math.max(1, Math.min(10, current + direction)))
  }

  const isPublicCsdFile = fileMeta?.sourceType === "csd-public" && activeCsdRecord
  const sourceLabel = fileMeta?.sourceType === "user-local"
    ? text(lang, "本地临时 CIF", "Local temporary CIF")
    : isPublicCsdFile
      ? publicCatalog?.dataset?.name || "CSD MOF Collection (Non-Commercial)"
      : pilotRecord?.sourceDatabase || "CSD MOF Collection"
  const materialLabel = activeCsdRecord?.refcode || item?.displayName || item?.name || text(lang, "未命名 MOF", "Unnamed MOF")
  const qualityFlags = activeCsdRecord
    ? [
        activeCsdRecord.charged ? text(lang, "带电框架", "charged") : null,
        activeCsdRecord.hydrogenAdded ? text(lang, "已补氢", "H added") : null,
        activeCsdRecord.unreliableChemistry ? text(lang, "化学可靠性警告", "chemistry warning") : null,
      ].filter(Boolean)
    : []

  return (
    <section
      className="mof-structure-workbench"
      data-testid="mof-structure-workbench"
      style={{
        "--mof-sw-bg": t.panel,
        "--mof-sw-surface": t.surface,
        "--mof-sw-border": t.border,
        "--mof-sw-border-strong": t.borderStrong || t.border,
        "--mof-sw-text": t.text,
        "--mof-sw-text-strong": t.textStrong,
        "--mof-sw-muted": t.muted,
        "--mof-sw-faint": t.faint,
        "--mof-sw-accent": t.accent,
        "--mof-sw-accent-soft": t.accentSoft,
        "--mof-sw-accent-text": t.accentText,
        "--mof-sw-success": t.success,
        "--mof-sw-warn": t.warn,
        "--mof-sw-danger": t.danger,
        "--mof-sw-shadow": t.shadowMd,
      }}
    >
      <header className="mof-structure-header">
        <div className="mof-structure-heading">
          <div className="mof-structure-eyebrow">
            <Atom aria-hidden="true" size={16} weight="duotone" />
            {text(lang, "结构图谱 · CSD 接入门", "Structure atlas · CSD ingestion gate")}
          </div>
          <h2>{text(lang, "晶体结构与配位多面体", "Crystal structure and coordination polyhedra")}</h2>
          <p>
            {text(
              lang,
              "结构、片段和多面体与来源许可绑定；没有可核验 CIF 时保持空态，不生成替代结构。",
              "Structures, fragments, and polyhedra remain bound to source licensing. No substitute structure is generated when a verified CIF is unavailable."
            )}
          </p>
        </div>
        <div className="mof-structure-header-actions">
          <CompactPill tone={publicCatalogReady || fileMeta ? "good" : "warn"} icon={publicCatalogReady || fileMeta ? CheckCircle : ShieldCheck}>
            {fileMeta?.sourceType === "user-local"
              ? text(lang, "仅本地会话", "Local session only")
              : publicCatalogReady
                ? text(lang, `CSD 公共结构 ${publicRecordCount.toLocaleString()}`, `${publicRecordCount.toLocaleString()} public CSD structures`)
                : text(lang, `CSD 试点 ${readyPilotCount}/${pilotRecords.length || 10}`, `CSD pilot ${readyPilotCount}/${pilotRecords.length || 10}`)}
          </CompactPill>
          <input ref={inputRef} className="mof-structure-file-input" data-testid="mof-structure-file-input" type="file" accept=".cif,text/plain,chemical/x-cif" onChange={handleFile} />
          <button className="mof-structure-primary-button" data-testid="mof-structure-upload-button" type="button" onClick={() => inputRef.current?.click()}>
            <UploadSimple aria-hidden="true" size={17} weight="bold" />
            {text(lang, "载入本地 CIF", "Load local CIF")}
          </button>
        </div>
      </header>

      <section className="mof-structure-catalog" aria-label={text(lang, "CSD MOF 公共结构检索", "CSD MOF public structure search")}>
        <div className="mof-structure-catalog-copy">
          <div>
            <CloudArrowDown aria-hidden="true" size={18} weight="duotone" />
            <strong>{text(lang, "CSD MOF 公共目录", "CSD MOF public catalog")}</strong>
          </div>
          <span>
            {catalogStatus === "loading"
              ? text(lang, "正在连接结构索引…", "Connecting to the structure index…")
              : publicCatalogReady
                ? text(lang, "按 Refcode、分子式或金属元素检索；仅在选中时下载一个 CIF。", "Search by Refcode, formula, or metal; one CIF is downloaded only when selected.")
                : text(lang, "公共目录暂不可用，本地 CIF 查看仍可使用。", "The public catalog is unavailable; local CIF viewing remains available.")}
          </span>
        </div>
        <label className="mof-structure-search-field">
          <span>{text(lang, "检索 15,906 个结构", "Search 15,906 structures")}</span>
          <div>
            <MagnifyingGlass aria-hidden="true" size={17} weight="bold" />
            <input
              type="search"
              value={catalogQuery}
              onChange={event => setCatalogQuery(event.target.value)}
              placeholder={text(lang, "例如 ABADUG、Zn、(C153…)", "e.g. ABADUG, Zn, (C153…)")}
              disabled={!publicCatalogReady}
            />
          </div>
        </label>
        <div className="mof-structure-search-results" role="group" aria-label={text(lang, "结构检索结果", "Structure search results")}>
          {publicCatalogMatches.map(record => (
            <button
              className={activeCsdRecord?.refcode === record.refcode ? "is-active" : ""}
              key={record.refcode}
              type="button"
              onClick={() => loadPublicRecord(record)}
              aria-pressed={activeCsdRecord?.refcode === record.refcode}
            >
              <span>
                <strong>{record.refcode}</strong>
                <small>{record.formula || text(lang, "分子式待整理", "formula pending")}</small>
              </span>
              <span>
                {record.metalElements?.join(" · ") || "—"}
                <CloudArrowDown aria-hidden="true" size={15} weight="bold" />
              </span>
            </button>
          ))}
          {publicCatalogReady && catalogQuery && !publicCatalogMatches.length ? (
            <div className="mof-structure-search-empty">{text(lang, "未找到匹配的 CSD Refcode、分子式或金属元素。", "No matching CSD Refcode, formula, or metal element.")}</div>
          ) : null}
        </div>
      </section>

      <div className="mof-structure-layout">
        <aside className="mof-structure-sidebar" aria-label={text(lang, "结构属性与来源", "Structure attributes and source")}>
          <div className="mof-structure-sidebar-title">
            <Database aria-hidden="true" size={18} weight="duotone" />
            <span>{text(lang, "属性与来源", "Attributes & source")}</span>
          </div>
          <div className="mof-structure-material-name">{materialLabel}</div>
          <div className="mof-structure-source-list">
            <SourceRow label={text(lang, "结构来源", "Structure source")}>{sourceLabel}</SourceRow>
            <SourceRow label={text(lang, "接入状态", "Ingestion status")}>
              {fileMeta?.sourceType === "user-local"
                ? text(lang, "本地已加载", "loaded locally")
                : isPublicCsdFile
                  ? text(lang, "公共 CIF 已加载", "public CIF loaded")
                  : activeCsdRecord && viewerStatus === "loading"
                    ? text(lang, "正在下载公共 CIF", "downloading public CIF")
                : sourceStatus === "filename-only"
                  ? text(lang, "仅有 CIF 文件名", "CIF filename only")
                  : text(lang, "等待 CSD 文件", "awaiting CSD file")}
            </SourceRow>
            <SourceRow label="CSD Refcode">{activeCsdRecord?.refcode || pilotRecord?.csdRefcode || "pending"}</SourceRow>
            <SourceRow label={text(lang, "分子式", "Formula")}>{activeCsdRecord?.formula || "pending"}</SourceRow>
            <SourceRow label={text(lang, "原始晶系", "Original crystal system")}>{activeCsdRecord?.originalCrystalSystem || "pending"}</SourceRow>
            <SourceRow label={text(lang, "孔隙率", "Void space")}>
              {Number.isFinite(activeCsdRecord?.voidPercent) ? `${activeCsdRecord.voidPercent}%` : "pending"}
            </SourceRow>
            <SourceRow label={text(lang, "许可证", "License")}>
              {fileMeta?.sourceType === "user-local"
                ? text(lang, "由用户自行确认", "user-confirmed")
                : publicCatalog?.dataset?.license?.spdx || pilotManifest?.license?.spdx || "CC-BY-NC-SA-4.0"}
            </SourceRow>
            <SourceRow label={text(lang, "金属元素", "Metal elements")}>{activeCsdRecord?.metalElements?.join(", ") || item?.metalNode || item?.metal || "pending"}</SourceRow>
            <SourceRow label={text(lang, "质量标记", "Quality flags")}>
              {qualityFlags.length ? qualityFlags.join(" · ") : activeCsdRecord ? text(lang, "无目录警告", "no catalog warning") : "pending"}
            </SourceRow>
            <SourceRow label={text(lang, "拓扑 / 连接体", "Topology / linker")}>
              {activeCsdRecord ? text(lang, "该集合未提供", "not provided by collection") : item?.topology || item?.linker || "pending"}
            </SourceRow>
          </div>

          <div className="mof-structure-method-card">
            <div>
              <CubeTransparent aria-hidden="true" size={18} weight="duotone" />
              <strong>{text(lang, "自动配位多面体", "Automatic coordination polyhedra")}</strong>
            </div>
            <p>
              {text(
                lang,
                "先以晶胞最小镜像重建跨周期边界的金属—供体近邻，再按距离阈值识别 O/N/S/卤素并对真实坐标执行三维凸包。它是派生显示，不是 CSD 原始字段。",
                "Metal–donor neighbors crossing periodic boundaries are first reconstructed with the unit-cell minimum image; O/N/S/halogen neighbors are then selected by distance and wrapped in a 3D convex hull. This is derived visualization, not a native CSD field."
              )}
            </p>
          </div>

          <div className="mof-structure-source-links">
            <a className="mof-structure-source-link" href={publicCatalog?.publicBaseUrl || "https://linus-he.github.io/ecomof-csd-mof-data/"} target="_blank" rel="noreferrer">
              <LinkSimple aria-hidden="true" size={16} weight="bold" />
              {text(lang, "公共数据与校验值", "Public data & checksums")}
            </a>
            <a className="mof-structure-source-link" href="https://www.ccdc.cam.ac.uk/support-and-resources/downloads?Legacy=False" target="_blank" rel="noreferrer">
              <LinkSimple aria-hidden="true" size={16} weight="bold" />
              {text(lang, "CCDC 原始下载页", "CCDC source download")}
            </a>
          </div>
        </aside>

        <div className="mof-structure-stage">
          <div className="mof-structure-controls">
            <label>
              <span>{text(lang, "结构片段", "Fragment")}</span>
              <select value={viewMode} onChange={event => setViewMode(event.target.value)} disabled={viewerStatus !== "ready"}>
                <option value="cell">{text(lang, "完整晶胞", "Full unit cell")}</option>
                <option value="cluster">{text(lang, "自动配位簇", "Auto coordination cluster")}</option>
                <option value="pore" disabled={!hasCuratedScenes}>{text(lang, "主孔道（待整理）", "Primary pore (pending)")}</option>
                <option value="topology" disabled={!hasCuratedScenes}>{text(lang, "拓扑骨架（待整理）", "Topology net (pending)")}</option>
              </select>
            </label>
            <label>
              <span>{text(lang, "多面体", "Polyhedra")}</span>
              <select value={polyhedraMode} onChange={event => setPolyhedraMode(event.target.value)} disabled={viewerStatus !== "ready"}>
                <option value="opaque">{text(lang, "不透明", "Opaque")}</option>
                <option value="translucent">{text(lang, "半透明", "Translucent")}</option>
                <option value="off">{text(lang, "关闭", "Off")}</option>
              </select>
            </label>
            <label className="mof-structure-depth-control">
              <span>
                {text(lang, "景深范围", "Depth range")}
                <output htmlFor="mof-structure-depth">{depth}/10</output>
              </span>
              <input
                id="mof-structure-depth"
                type="range"
                min="1"
                max="10"
                step="1"
                value={depth}
                onChange={event => setDepth(Number(event.target.value))}
                onKeyDown={handleDepthKeyDown}
                disabled={viewerStatus !== "ready"}
                aria-label={text(lang, "调整结构景深范围", "Adjust structure depth range")}
              />
            </label>
          </div>

          <div className={`mof-structure-canvas-shell ${viewerStatus === "ready" ? "is-ready" : ""}`}>
            <div ref={containerRef} className="mof-structure-canvas" aria-label={text(lang, "MOF 三维结构画布", "MOF 3D structure canvas")} />

            {viewerStatus !== "ready" ? (
              <div className="mof-structure-empty-state">
                {viewerStatus === "loading" ? (
                  <>
                    <ArrowsClockwise className="mof-structure-loading-icon" aria-hidden="true" size={38} weight="duotone" />
                    <strong>{text(lang, "正在解析 CIF 与配位环境", "Parsing CIF and coordination environments")}</strong>
                    <span>{text(lang, "原子、晶胞和多面体都在浏览器本地生成。", "Atoms, unit cell, and polyhedra are generated locally in your browser.")}</span>
                  </>
                ) : viewerStatus === "error" ? (
                  <>
                    <WarningCircle aria-hidden="true" size={40} weight="duotone" />
                    <strong>{text(lang, "结构无法加载", "Structure could not be loaded")}</strong>
                    <span>{viewerError || text(lang, "请检查 CIF 格式。", "Check the CIF format.")}</span>
                    <div className="mof-structure-empty-actions">
                      {activeCsdRecord ? (
                        <button type="button" onClick={() => loadPublicRecord(activeCsdRecord)}>
                          <CloudArrowDown aria-hidden="true" size={16} weight="bold" />
                          {text(lang, "重试公共结构", "Retry public structure")}
                        </button>
                      ) : null}
                      <button type="button" onClick={() => inputRef.current?.click()}>
                        <UploadSimple aria-hidden="true" size={16} weight="bold" />
                        {text(lang, "选择其他 CIF", "Choose another CIF")}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Cube aria-hidden="true" size={44} weight="duotone" />
                    <strong>{text(lang, "等待已授权的结构文件", "Awaiting an authorized structure file")}</strong>
                    <span>
                      {text(
                        lang,
                        "可从上方公共目录选择结构，或载入本地 CIF；本地文件不会上传。",
                        "Choose a structure from the public catalog above, or load a local CIF; local files are never uploaded."
                      )}
                    </span>
                    <button type="button" onClick={() => inputRef.current?.click()}>
                      <UploadSimple aria-hidden="true" size={16} weight="bold" />
                      {text(lang, "载入本地 CIF", "Load local CIF")}
                    </button>
                  </>
                )}
              </div>
            ) : null}

            {viewerStatus === "ready" ? (
              <>
                <div className="mof-structure-stats" aria-label={text(lang, "结构统计", "Structure statistics")}>
                  <CompactPill icon={Atom}>{stats.atomCount} {text(lang, "原子", "atoms")}</CompactPill>
                  <CompactPill icon={Stack}>{stats.metalCount} {text(lang, "金属中心", "metal centers")}</CompactPill>
                  <CompactPill tone={stats.polyhedraCount ? "good" : "warn"} icon={CubeTransparent}>
                    {stats.polyhedraCount} {text(lang, "多面体", "polyhedra")}
                  </CompactPill>
                </div>
                <div className="mof-structure-toolbar" role="toolbar" aria-label={text(lang, "结构查看工具", "Structure viewer tools")}>
                  <button type="button" onClick={handleReset} title={text(lang, "重置视角", "Reset view")}>
                    <ArrowsClockwise aria-hidden="true" size={18} weight="bold" />
                    <span>{text(lang, "重置", "Reset")}</span>
                  </button>
                  <button type="button" onClick={toggleSpin} aria-pressed={isSpinning} title={text(lang, "自动旋转", "Auto rotate")}>
                    {isSpinning ? <Pause aria-hidden="true" size={18} weight="fill" /> : <Play aria-hidden="true" size={18} weight="fill" />}
                    <span>{isSpinning ? text(lang, "暂停", "Pause") : text(lang, "旋转", "Spin")}</span>
                  </button>
                  <button type="button" onClick={downloadImage} title={text(lang, "导出 PNG", "Export PNG")}>
                    <Camera aria-hidden="true" size={18} weight="bold" />
                    <span>PNG</span>
                  </button>
                </div>
              </>
            ) : null}
          </div>

          <footer className="mof-structure-footer">
            <div>
              {fileMeta ? <CheckCircle aria-hidden="true" size={17} weight="fill" /> : <Info aria-hidden="true" size={17} weight="fill" />}
              <span>
                {fileMeta?.sourceType === "user-local"
                  ? `${fileMeta.name} · ${formatFileSize(fileMeta.size)} · ${text(lang, "未上传", "not uploaded")}`
                  : isPublicCsdFile
                    ? `${activeCsdRecord.refcode} · ${formatFileSize(fileMeta.size)} · CSD v601 · CC BY-NC-SA 4.0`
                    : text(lang, "公共非商业研究数据按需加载；原始 CIF 内容不作修改。", "Public non-commercial research data loads on demand; original CIF content is unchanged.")}
              </span>
            </div>
            {selectedAtom ? (
              <div className="mof-structure-selection">
                <Eye aria-hidden="true" size={16} weight="bold" />
                <span>
                  {selectedAtom.element || selectedAtom.atom} #{selectedAtom.index ?? "—"} ·
                  {" "}{selectedAtom.x.toFixed(2)}, {selectedAtom.y.toFixed(2)}, {selectedAtom.z.toFixed(2)} Å
                </span>
              </div>
            ) : (
              <div className="mof-structure-selection">
                <EyeSlash aria-hidden="true" size={16} weight="bold" />
                <span>{text(lang, "点击原子查看坐标", "Click an atom to inspect coordinates")}</span>
              </div>
            )}
          </footer>
        </div>
      </div>
    </section>
  )
}
