// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import quickHull from "quickhull3d/dist/quickhull3d.js"
import {
  ArrowsClockwise,
  Atom,
  Camera,
  CheckCircle,
  CloudArrowDown,
  CopySimple,
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
import {
  downloadCsdMofCif,
  scheduleCsdMofPreload,
} from "../../services/dataService"
import {
  publicMofDisplayName,
  searchCsdMofCatalog,
} from "../../utils/csdMofSearch.mjs"
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
const SIDEBAR_MIN_WIDTH = 280
const SIDEBAR_DEFAULT_WIDTH = 336
const SIDEBAR_MAX_WIDTH = 520
const EMPTY_METADATA_VALUES = new Set(["", "-", "—", "n/a", "na", "none", "null", "pending", "unknown"])

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function hasDisplayValue(value) {
  return !EMPTY_METADATA_VALUES.has(String(value ?? "").trim().toLowerCase())
}

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

function SourceRow({ label, children, wide = false }) {
  return (
    <div className={`mof-structure-source-row ${wide ? "is-wide" : ""}`.trim()}>
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
  const layoutRef = useRef(null)
  const resizeStateRef = useRef(null)
  const inputRef = useRef(null)
  const viewerRef = useRef(null)
  const modelRef = useRef(null)
  const polyhedraRef = useRef([])
  const initialViewRef = useRef(null)
  const remoteRequestRef = useRef(null)
  const defaultCatalogRecordRef = useRef(false)
  const [cifText, setCifText] = useState("")
  const [viewerStatus, setViewerStatus] = useState("idle")
  const [viewerPhase, setViewerPhase] = useState("idle")
  const [viewerIssue, setViewerIssue] = useState(null)
  const [copyStatus, setCopyStatus] = useState("idle")
  const [fileMeta, setFileMeta] = useState(null)
  const [catalogQuery, setCatalogQuery] = useState("")
  const [activeCsdRecord, setActiveCsdRecord] = useState(null)
  const [activeIdentityRecord, setActiveIdentityRecord] = useState(null)
  const [viewMode, setViewMode] = useState("cell")
  const [polyhedraMode, setPolyhedraMode] = useState("translucent")
  const [depth, setDepth] = useState(6)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH)
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)
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
  const identityRecords = Array.isArray(publicCatalog?.identityRecords) ? publicCatalog.identityRecords : []
  const publicRecordCount = Number(publicCatalog?.summary?.total || publicRecords.length)
  const namedRecordCount = Number(publicCatalog?.summary?.namedTotal || publicRecordCount)
  const literatureNamedCount = Number(
    publicCatalog?.summary?.literatureNamed
    ?? publicRecords.filter(record => record.displayNameKind === "verified-literature-common-name").length,
  )
  const refcodeNamedCount = Math.max(0, namedRecordCount - literatureNamedCount)
  const publicCatalogReady = catalogStatus === "ready" && publicRecords.length > 0
  const publicCatalogMatches = useMemo(() => {
    if (!publicRecords.length) return []
    return searchCsdMofCatalog(publicRecords, identityRecords, catalogQuery, {
      activeRefcode: activeCsdRecord?.refcode,
      limit: catalogQuery.trim() ? 10 : 6,
    })
  }, [activeCsdRecord, catalogQuery, identityRecords, publicRecords])

  const activeVariantRecords = useMemo(() => {
    if (!activeCsdRecord?.commonName) return activeCsdRecord ? [activeCsdRecord] : []
    return publicRecords
      .filter(record => record.commonName === activeCsdRecord.commonName)
      .sort((a, b) => {
        if (a.refcode === activeCsdRecord.preferredAliasRefcode) return -1
        if (b.refcode === activeCsdRecord.preferredAliasRefcode) return 1
        return String(a.refcode).localeCompare(String(b.refcode))
      })
  }, [activeCsdRecord, publicRecords])

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
    setViewerPhase("parsing")
    setViewerIssue(null)

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
        if (!Array.isArray(atoms) || !atoms.length) {
          throw new Error(text(lang, "CIF 中没有可显示的原子坐标。", "No displayable atom coordinates were found in the CIF."))
        }
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
        setViewerPhase("ready")
        viewer.render()
        window.setTimeout(() => {
          if (!cancelled) renderPolyhedra(polyhedraMode)
        }, 0)
      } catch (error) {
        if (cancelled) return
        setViewerStatus("error")
        setViewerPhase("parse-error")
        setViewerIssue({
          kind: "parse",
          message: text(
            lang,
            `CIF 已下载，但三维解析失败：${error instanceof Error ? error.message : String(error)}`,
            `The CIF was downloaded, but 3D parsing failed: ${error instanceof Error ? error.message : String(error)}`,
          ),
        })
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [cifText, lang, t, renderPolyhedra])

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

  const loadPublicRecord = useCallback(async (record, options = {}) => {
    if (!record?.cifUrl) return
    remoteRequestRef.current?.abort()
    const controller = new AbortController()
    remoteRequestRef.current = controller
    setActiveIdentityRecord(null)
    setActiveCsdRecord(record)
    setCatalogQuery(record.refcode || "")
    setSelectedAtom(null)
    setIsSpinning(false)
    setCifText("")
    setFileMeta(null)
    setViewerIssue(null)
    setCopyStatus("idle")
    setViewerStatus("loading")
    setViewerPhase("downloading")
    try {
      const result = await downloadCsdMofCif(record, {
        baseUrl: publicCatalog?.publicBaseUrl,
        forceRefresh: Boolean(options.forceRefresh),
        retries: 2,
        signal: controller.signal,
        timeoutMs: 12000,
      })
      const source = result.text
      if (!/(?:^|\n)\s*data_/i.test(source) || !/_atom_site_/i.test(source)) {
        setActiveCsdRecord(result.record)
        setFileMeta({
          name: result.record.file,
          size: result.bytes,
          sourceType: "csd-public",
          cacheState: result.source,
          url: result.record.cifUrl,
          loadedAt: new Date().toISOString(),
        })
        setViewerStatus("error")
        setViewerPhase("parse-error")
        setViewerIssue({
          kind: "parse",
          message: text(
            lang,
            "CIF 已下载，但缺少 data_ 数据块或 atom_site 原子坐标，无法交给三维解析器。",
            "The CIF was downloaded, but it lacks a data_ block or atom_site coordinates required by the 3D parser.",
          ),
        })
        return
      }
      if (controller.signal.aborted) return
      setActiveCsdRecord(result.record)
      setFileMeta({
        name: result.record.file,
        size: result.bytes,
        sourceType: "csd-public",
        cacheState: result.source,
        attempts: result.attempts,
        url: result.record.cifUrl,
        loadedAt: new Date().toISOString(),
      })
      setViewerPhase("parsing")
      setCifText(source)
    } catch (error) {
      if (controller.signal.aborted || error?.kind === "aborted") return
      setViewerStatus("error")
      setViewerPhase("download-error")
      const reason = error?.kind === "timeout"
        ? text(lang, "请求在 12 秒内未完成，系统已自动重试 2 次。", "The request did not finish within 12 seconds and was retried twice.")
        : error?.kind === "http"
          ? text(lang, `数据站返回 HTTP ${error.status || "错误"}。`, `The data site returned HTTP ${error.status || "error"}.`)
          : text(lang, "浏览器未能连接公共数据站，可能是当前网络、跨境链路或数据站暂时不可达。", "The browser could not reach the public data site; the current network, cross-border route, or data host may be unavailable.")
      setViewerIssue({
        kind: "download",
        code: error?.kind || "network",
        message: text(
          lang,
          `${record.refcode} 的 CIF 尚未下载成功。${reason}`,
          `The CIF for ${record.refcode} could not be downloaded. ${reason}`,
        ),
      })
      console.warn("CSD public CIF could not be loaded.", error)
    }
  }, [lang, publicCatalog?.publicBaseUrl])

  const showIdentityRecord = useCallback(record => {
    if (!record || record.recordType !== "identity-only") return
    remoteRequestRef.current?.abort()
    viewerRef.current?.spin(false)
    viewerRef.current?.removeAllModels()
    viewerRef.current?.removeAllShapes()
    viewerRef.current?.render()
    modelRef.current = null
    polyhedraRef.current = []
    setActiveCsdRecord(null)
    setActiveIdentityRecord(record)
    setCatalogQuery(record.commonName || "")
    setCifText("")
    setFileMeta(null)
    setSelectedAtom(null)
    setIsSpinning(false)
    setViewerIssue(null)
    setCopyStatus("idle")
    setViewerStatus("idle")
    setViewerPhase("identity-only")
    setStats({ atomCount: 0, metalCount: 0, polyhedraCount: 0, elements: {} })
  }, [])

  useEffect(() => {
    if (defaultCatalogRecordRef.current || !publicCatalogReady) return
    const defaultRecord = publicRecords.find(record => record.refcode === "ABADUG") || publicRecords[0]
    if (!defaultRecord) return
    defaultCatalogRecordRef.current = true
    void loadPublicRecord(defaultRecord)
  }, [loadPublicRecord, publicCatalogReady, publicRecords])

  useEffect(() => {
    if (!publicCatalogReady) return
    scheduleCsdMofPreload(publicCatalog)
  }, [publicCatalog, publicCatalogReady])

  const handleFile = async event => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      setViewerStatus("error")
      setViewerPhase("parse-error")
      setViewerIssue({
        kind: "parse",
        message: text(lang, "本地 CIF 超过 15 MB，浏览器预览暂不解析。", "The local CIF exceeds the 15 MB browser-preview limit."),
      })
      return
    }
    const source = await file.text()
    if (!/(?:^|\n)\s*data_/i.test(source) || !/_atom_site_/i.test(source)) {
      setViewerStatus("error")
      setViewerPhase("parse-error")
      setViewerIssue({
        kind: "parse",
        message: text(lang, "本地 CIF 缺少 data_ 数据块或 atom_site 原子坐标。", "The local CIF lacks a data_ block or atom_site coordinates."),
      })
      return
    }
    setSelectedAtom(null)
    setIsSpinning(false)
    remoteRequestRef.current?.abort()
    setActiveCsdRecord(null)
    setActiveIdentityRecord(null)
    setViewerIssue(null)
    setCopyStatus("idle")
    setViewerPhase("parsing")
    setFileMeta({
      name: file.name,
      size: file.size,
      sourceType: "user-local",
      loadedAt: new Date().toISOString(),
    })
    setCifText(source)
    event.target.value = ""
  }

  const copyActiveCifUrl = async () => {
    const url = activeCsdRecord?.cifUrl || fileMeta?.url
    if (!url) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const input = document.createElement("textarea")
        input.value = url
        input.style.position = "fixed"
        input.style.opacity = "0"
        document.body.appendChild(input)
        input.select()
        document.execCommand("copy")
        input.remove()
      }
      setCopyStatus("copied")
    } catch {
      setCopyStatus("failed")
    }
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

  const clampSidebarWidth = useCallback(nextWidth => {
    const layoutWidth = layoutRef.current?.getBoundingClientRect().width || 1200
    const responsiveMax = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, layoutWidth - 560))
    return Math.max(SIDEBAR_MIN_WIDTH, Math.min(responsiveMax, Math.round(nextWidth)))
  }, [])

  const handleSidebarResizePointerDown = event => {
    if (isMobile) return
    resizeStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: sidebarWidth,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setIsResizingSidebar(true)
    event.preventDefault()
  }

  const handleSidebarResizePointerMove = event => {
    const state = resizeStateRef.current
    if (!state || state.pointerId !== event.pointerId) return
    setSidebarWidth(clampSidebarWidth(state.startWidth + event.clientX - state.startX))
  }

  const handleSidebarResizePointerUp = event => {
    const state = resizeStateRef.current
    if (!state || state.pointerId !== event.pointerId) return
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    resizeStateRef.current = null
    setIsResizingSidebar(false)
  }

  const handleSidebarResizeKeyDown = event => {
    const direction = event.key === "ArrowRight"
      ? 1
      : event.key === "ArrowLeft"
        ? -1
        : 0
    if (event.key === "Home") {
      event.preventDefault()
      setSidebarWidth(SIDEBAR_MIN_WIDTH)
      return
    }
    if (event.key === "End") {
      event.preventDefault()
      setSidebarWidth(clampSidebarWidth(SIDEBAR_MAX_WIDTH))
      return
    }
    if (!direction) return
    event.preventDefault()
    setSidebarWidth(current => clampSidebarWidth(current + direction * 16))
  }

  useEffect(() => {
    if (!viewerRef.current) return
    const frame = window.requestAnimationFrame(() => {
      viewerRef.current?.resize()
      viewerRef.current?.render()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [sidebarWidth])

  const isPublicCsdFile = fileMeta?.sourceType === "csd-public" && activeCsdRecord
  const metadataRecord = activeIdentityRecord || activeCsdRecord
  const isIdentityOnly = Boolean(activeIdentityRecord)
  const sourceLabel = isIdentityOnly
    ? text(lang, "MOF 常用名登记表", "MOF common-name registry")
    : fileMeta?.sourceType === "user-local"
    ? text(lang, "本地临时 CIF", "Local temporary CIF")
    : isPublicCsdFile
      ? publicCatalog?.dataset?.name || "CSD MOF Collection (Non-Commercial)"
      : pilotRecord?.sourceDatabase || "CSD MOF Collection"
  const materialLabel = isIdentityOnly
    ? metadataRecord?.commonName
    : publicMofDisplayName(metadataRecord)
      || item?.displayName
      || item?.name
      || text(lang, "未命名 MOF", "Unnamed MOF")
  const linkerName = hasDisplayValue(metadataRecord?.linkerIdentity?.name)
    ? metadataRecord.linkerIdentity.name
    : !isIdentityOnly && hasDisplayValue(item?.linker)
      ? item.linker
      : null
  const topology = hasDisplayValue(metadataRecord?.topology)
    ? metadataRecord.topology
    : !isIdentityOnly && hasDisplayValue(item?.topology)
      ? item.topology
      : null
  const qualityFlags = activeCsdRecord
    ? [
        activeCsdRecord.charged ? text(lang, "带电框架", "charged") : null,
        activeCsdRecord.hydrogenAdded ? text(lang, "已补氢", "H added") : null,
        activeCsdRecord.unreliableChemistry ? text(lang, "化学可靠性警告", "chemistry warning") : null,
      ].filter(Boolean)
    : []
  const unavailableCrystalFields = activeCsdRecord
    ? [
        !activeCsdRecord.originalCrystalSystem ? text(lang, "晶系", "crystal system") : null,
        !Number.isFinite(activeCsdRecord.voidPercent) ? text(lang, "孔隙率", "void space") : null,
        !linkerName ? text(lang, "连接体", "linker") : null,
        !topology ? text(lang, "拓扑", "topology") : null,
      ].filter(Boolean)
    : []
  const activeCcdcUrl = metadataRecord?.ccdcNumber
    ? `https://www.ccdc.cam.ac.uk/structures/Search?Ccdcid=${metadataRecord.ccdcNumber}&DatabaseToSearch=Published`
    : null

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
                ? text(lang, `${publicRecordCount.toLocaleString()} 条 CSD 结构记录`, `${publicRecordCount.toLocaleString()} CSD structure records`)
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
                  ? text(
                    lang,
                    `轻量索引已就绪（${publicCatalog?.cacheState === "indexeddb" || publicCatalog?.cacheState === "stale-indexeddb" ? "来自本机缓存" : "已写入本机缓存"}）；${literatureNamedCount.toLocaleString()} 条使用已核验文献名，其余 ${refcodeNamedCount.toLocaleString()} 条按专业 CSD Refcode 展示，内部 ID 不再作为材料名称。`,
                    `The lightweight index is ready (${publicCatalog?.cacheState === "indexeddb" || publicCatalog?.cacheState === "stale-indexeddb" ? "from local cache" : "saved to local cache"}); ${literatureNamedCount.toLocaleString()} use verified literature names and the remaining ${refcodeNamedCount.toLocaleString()} use professional CSD Refcodes. Internal IDs are no longer exposed as material names.`,
                  )
                : text(lang, "公共目录暂不可用，本地 CIF 查看仍可使用。", "The public catalog is unavailable; local CIF viewing remains available.")}
          </span>
        </div>
        <label className="mof-structure-search-field">
          <span>
            {text(
              lang,
              `检索 ${namedRecordCount.toLocaleString()} 个名称与结构`,
              `Search ${namedRecordCount.toLocaleString()} names and structures`,
            )}
          </span>
          <div>
            <MagnifyingGlass aria-hidden="true" size={17} weight="bold" />
            <input
              type="search"
              value={catalogQuery}
              onChange={event => setCatalogQuery(event.target.value)}
              placeholder={text(lang, "例如 UiO-66、NTU-68、Al(L2)、RUBTAK", "e.g. UiO-66, NTU-68, Al(L2), RUBTAK")}
              disabled={!publicCatalogReady}
            />
          </div>
        </label>
        <div className="mof-structure-search-results" role="group" aria-label={text(lang, "结构检索结果", "Structure search results")}>
          {publicCatalogMatches.map(record => {
            const identityOnly = record.recordType === "identity-only"
            const structureFamily = record.recordType === "structure-family"
            const selectedRecord = record.preferredRecord || record
            const active = identityOnly
              ? activeIdentityRecord?.identityId === record.identityId
              : record.variants?.some(variant => activeCsdRecord?.refcode === variant.refcode)
            return (
              <button
                className={`${active ? "is-active" : ""} ${identityOnly ? "is-identity-only" : ""} ${structureFamily ? "is-structure-family" : ""}`.trim()}
                key={record.resultKey || record.refcode || record.identityId}
                type="button"
                onClick={() => identityOnly ? showIdentityRecord(record) : loadPublicRecord(selectedRecord)}
                aria-pressed={active}
              >
                <span>
                  <strong>{record.publicDisplayName || publicMofDisplayName(record)}</strong>
                  <small>
                    {identityOnly
                      ? record.externalCsdRefcodes?.length
                        ? text(
                          lang,
                          `CSD 主库 ${record.externalCsdRefcodes.join(" / ")} · 当前公开子集未收录`,
                          `CSD ${record.externalCsdRefcodes.join(" / ")} · absent from the current public subset`,
                        )
                        : text(lang, "命名已收录 · CSD 沉积待核验", "Name catalogued · CSD deposition pending")
                      : structureFamily
                        ? text(
                          lang,
                          `${record.variantCount} 个 CSD 结构变体 · ${record.variants.map(variant => variant.refcode).join(" / ")}`,
                          `${record.variantCount} CSD structure variants · ${record.variants.map(variant => variant.refcode).join(" / ")}`,
                        )
                      : `CSD ${record.refcode} · ${record.formula || text(lang, "分子式待整理", "formula pending")}`}
                  </small>
                  <span className="mof-structure-result-identity">
                    {[
                      identityOnly
                        ? text(lang, "名称档案", "identity record")
                        : record.commonName
                          ? text(lang, "文献常用名", "literature name")
                          : text(lang, "CSD Refcode", "CSD Refcode"),
                      record.mofClass,
                      record.mofFamily,
                      record.firstReportedYear,
                    ].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span>
                  {identityOnly
                    ? record.externalCsdRefcodes?.length
                      ? text(lang, "主库", "CSD")
                      : text(lang, "档案", "identity")
                    : record.metalElements?.join(" · ") || "—"}
                  {identityOnly
                    ? <Info aria-hidden="true" size={15} weight="bold" />
                    : <CloudArrowDown aria-hidden="true" size={15} weight="bold" />}
                </span>
              </button>
            )
          })}
          {publicCatalogReady && catalogQuery && !publicCatalogMatches.length ? (
            <div className="mof-structure-search-empty">{text(lang, "未找到匹配的 CSD Refcode、常用名、分子式或金属元素。", "No matching CSD Refcode, common name, formula, or metal element.")}</div>
          ) : null}
        </div>
      </section>

      <div
        ref={layoutRef}
        className={`mof-structure-layout ${isResizingSidebar ? "is-resizing" : ""}`}
        style={{ "--mof-sidebar-width": `${sidebarWidth}px` }}
      >
        <aside className="mof-structure-sidebar" aria-label={text(lang, "结构属性与来源", "Structure attributes and source")}>
          <div className="mof-structure-sidebar-title">
            <Database aria-hidden="true" size={18} weight="duotone" />
            <span>{text(lang, "属性与来源", "Attributes & source")}</span>
          </div>
          <div className="mof-structure-material-heading">
            <div className="mof-structure-material-name">{materialLabel}</div>
            <div className="mof-structure-material-meta">
              {activeCsdRecord?.refcode ? <span>CSD {activeCsdRecord.refcode}</span> : null}
              {isIdentityOnly && metadataRecord?.externalCsdRefcodes?.length ? (
                <span>CSD {metadataRecord.externalCsdRefcodes.join(" / ")}</span>
              ) : null}
              {metadataRecord?.mofClass ? <span>{metadataRecord.mofClass}</span> : null}
            </div>
          </div>

          <section className="mof-structure-sidebar-card">
            <h3>{text(lang, "结构身份", "Structure identity")}</h3>
            <div className="mof-structure-source-list">
              <SourceRow label={text(lang, "名称类型", "Name type")}>
                {isIdentityOnly
                  ? text(lang, "文献名称档案", "literature identity record")
                  : metadataRecord?.commonName
                    ? text(lang, "已核验文献常用名", "verified literature common name")
                    : text(lang, "CSD Refcode", "CSD Refcode")}
              </SourceRow>
              <SourceRow label="CSD Refcode">
                {isIdentityOnly
                  ? metadataRecord?.externalCsdRefcodes?.join(" / ") || text(lang, "尚未定位", "not yet located")
                  : activeCsdRecord?.refcode || pilotRecord?.csdRefcode || text(lang, "尚未定位", "not yet located")}
              </SourceRow>
              {metadataRecord?.commonName ? (
                <SourceRow label={text(lang, "文献常用名", "Literature name")}>{metadataRecord.commonName}</SourceRow>
              ) : null}
              {metadataRecord?.searchAliases?.length ? (
                <SourceRow label={text(lang, "检索别名", "Search aliases")} wide>
                  {[...new Set(metadataRecord.searchAliases)]
                    .filter(alias => alias !== metadataRecord.commonName)
                    .join(" · ") || text(lang, "无额外别名", "no additional aliases")}
                </SourceRow>
              ) : null}
              {activeVariantRecords.length > 1 ? (
                <SourceRow label={text(lang, "结构变体", "Structure variant")} wide>
                  <select
                    className="mof-structure-variant-select"
                    value={activeCsdRecord?.refcode || ""}
                    onChange={event => {
                      const next = activeVariantRecords.find(record => record.refcode === event.target.value)
                      if (next) void loadPublicRecord(next)
                    }}
                    aria-label={text(lang, "选择 CSD 结构变体", "Choose CSD structure variant")}
                  >
                    {activeVariantRecords.map(record => (
                      <option key={record.refcode} value={record.refcode}>
                        {record.refcode}{record.refcode === record.preferredAliasRefcode ? text(lang, "（首选）", " (preferred)") : ""}
                      </option>
                    ))}
                  </select>
                </SourceRow>
              ) : null}
              {metadataRecord?.identityStatus ? (
                <SourceRow label={text(lang, "名称核验", "Identity verification")} wide>
                  {metadataRecord.identityStatus === "verified-curated"
                    ? text(lang, "人工核验 · 有来源", "curated · sourced")
                    : metadataRecord?.externalCsdRefcodes?.length
                      ? text(lang, "名称、CCDC 与主库 Refcode 已核验", "name, CCDC, and primary CSD Refcode verified")
                      : metadataRecord.identityStatus === "verified-name-structure-unmapped"
                        ? text(lang, "名称与论文已核验 · CSD 沉积待核验", "name and paper verified · CSD deposition pending")
                        : text(lang, "目录名称已收录 · CSD 沉积待核验", "catalog name captured · CSD deposition pending")}
                </SourceRow>
              ) : null}
              {isIdentityOnly && metadataRecord?.structureMappingStatus ? (
                <SourceRow label={text(lang, "结构边界", "Structure boundary")} wide>
                  {lang === "zh" && metadataRecord.externalCsdRefcodes?.length
                    ? `主 CSD 已定位为 ${metadataRecord.externalCsdRefcodes.join(" / ")}，但当前 15,906 条公开子集未收录；不以相似结构替代。`
                    : lang === "zh"
                      ? "论文名称已核验；当前仍无可公开接入的 CSD 结构，不以相似结构替代。"
                      : metadataRecord.structureMappingStatus}
                </SourceRow>
              ) : null}
            </div>
          </section>

          <section className="mof-structure-sidebar-card">
            <h3>{text(lang, "组成与晶体", "Composition & crystal")}</h3>
            <div className="mof-structure-source-list">
              {metadataRecord?.mofClass ? (
                <SourceRow label={text(lang, "金属类别", "Metal class")}>{metadataRecord.mofClass}</SourceRow>
              ) : null}
              {metadataRecord?.mofFamily ? (
                <SourceRow label={text(lang, "配体家族", "Linker family")}>{metadataRecord.mofFamily}</SourceRow>
              ) : null}
              {Number.isFinite(metadataRecord?.firstReportedYear) ? (
                <SourceRow label={text(lang, "首次报道", "First reported")}>{metadataRecord.firstReportedYear}</SourceRow>
              ) : null}
              {!isIdentityOnly && activeCsdRecord?.formula ? (
                <SourceRow label={text(lang, "分子式", "Formula")} wide>{activeCsdRecord.formula}</SourceRow>
              ) : null}
              {!isIdentityOnly && activeCsdRecord?.originalCrystalSystem ? (
                <SourceRow label={text(lang, "原始晶系", "Crystal system")}>{activeCsdRecord.originalCrystalSystem}</SourceRow>
              ) : null}
              {!isIdentityOnly && Number.isFinite(activeCsdRecord?.voidPercent) ? (
                <SourceRow label={text(lang, "孔隙率", "Void space")}>{activeCsdRecord.voidPercent}%</SourceRow>
              ) : null}
              {!isIdentityOnly && (activeCsdRecord?.metalElements?.length || item?.metalNode || item?.metal) ? (
                <SourceRow label={text(lang, "金属元素", "Metal elements")}>
                  {activeCsdRecord?.metalElements?.join(", ") || item?.metalNode || item?.metal}
                </SourceRow>
              ) : null}
              {linkerName ? (
                <SourceRow label={text(lang, "连接体", "Linker")} wide>
                  {linkerName}
                </SourceRow>
              ) : null}
              {metadataRecord?.linkerIdentity?.abbreviation ? (
                <SourceRow label={text(lang, "连接体缩写", "Linker abbreviation")}>{metadataRecord.linkerIdentity.abbreviation}</SourceRow>
              ) : null}
              {metadataRecord?.metalCluster ? (
                <SourceRow label={text(lang, "金属簇", "Metal cluster")} wide>{metadataRecord.metalCluster}</SourceRow>
              ) : null}
              {topology ? (
                <SourceRow label={text(lang, "拓扑", "Topology")}>{topology}</SourceRow>
              ) : null}
              {!isIdentityOnly && activeCsdRecord ? (
                <SourceRow label={text(lang, "质量标记", "Quality flags")}>
                  {qualityFlags.length ? qualityFlags.join(" · ") : text(lang, "无目录警告", "no catalog warning")}
                </SourceRow>
              ) : null}
            </div>
            {unavailableCrystalFields.length ? (
              <p className="mof-structure-unavailable-note">
                {text(lang, "当前轻量索引未提供：", "Not supplied by the current lightweight index: ")}
                {unavailableCrystalFields.join("、")}
              </p>
            ) : null}
          </section>

          <section className="mof-structure-sidebar-card">
            <h3>{text(lang, "来源与许可", "Source & license")}</h3>
            <div className="mof-structure-source-list">
              <SourceRow label={text(lang, "结构来源", "Structure source")} wide>{sourceLabel}</SourceRow>
              <SourceRow label={text(lang, "接入状态", "Ingestion status")} wide>
                {isIdentityOnly
                  ? metadataRecord?.externalCsdRefcodes?.length
                    ? text(lang, "主库已定位 · 公开子集缺结构", "primary CSD located · absent from public subset")
                    : text(lang, "名称已接入 · 结构沉积待核验", "name catalogued · structure deposition pending")
                  : fileMeta?.sourceType === "user-local"
                    ? text(lang, "本地已加载", "loaded locally")
                    : isPublicCsdFile
                      ? text(lang, "公共 CIF 已加载", "public CIF loaded")
                      : activeCsdRecord && viewerStatus === "loading"
                        ? text(lang, "正在下载公共 CIF", "downloading public CIF")
                        : sourceStatus === "filename-only"
                          ? text(lang, "仅有 CIF 文件名", "CIF filename only")
                          : text(lang, "等待 CSD 文件", "awaiting CSD file")}
              </SourceRow>
              <SourceRow label={text(lang, "许可证", "License")} wide>
                {isIdentityOnly
                  ? text(lang, "未加载 CIF · 结构许可不适用", "no CIF loaded · structure license not applicable")
                  : fileMeta?.sourceType === "user-local"
                    ? text(lang, "由用户自行确认", "user-confirmed")
                    : publicCatalog?.dataset?.license?.spdx || pilotManifest?.license?.spdx || "CC-BY-NC-SA-4.0"}
              </SourceRow>
              {fileMeta?.sourceType === "csd-public" ? (
                <SourceRow label={text(lang, "文件读取", "File read")}>
                  {fileMeta.cacheState === "indexeddb"
                    ? text(lang, "本机缓存", "local cache")
                    : text(lang, `网络下载${fileMeta.attempts > 1 ? ` · ${fileMeta.attempts} 次尝试` : ""}`, `network download${fileMeta.attempts > 1 ? ` · ${fileMeta.attempts} attempts` : ""}`)}
                </SourceRow>
              ) : null}
              {metadataRecord?.associatedPaper?.url ? (
                <SourceRow label={text(lang, "关联论文", "Associated paper")} wide>
                  <a href={metadataRecord.associatedPaper.url} target="_blank" rel="noreferrer">
                    DOI {metadataRecord.associatedPaper.doi}
                  </a>
                </SourceRow>
              ) : null}
              {activeCcdcUrl ? (
                <SourceRow label="CCDC">
                  <a href={activeCcdcUrl} target="_blank" rel="noreferrer">
                    {metadataRecord.ccdcNumber}
                  </a>
                </SourceRow>
              ) : null}
            </div>
          </section>

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
            {metadataRecord?.identityPage ? (
              <a className="mof-structure-source-link" href={metadataRecord.identityPage} target="_blank" rel="noreferrer">
                <LinkSimple aria-hidden="true" size={16} weight="bold" />
                {text(lang, "命名属性参考页", "Identity attributes reference")}
              </a>
            ) : null}
          </div>
        </aside>

        <div
          className="mof-structure-sidebar-resizer"
          role="separator"
          aria-label={text(lang, "调整属性边栏宽度", "Resize attributes sidebar")}
          aria-orientation="vertical"
          aria-valuemin={SIDEBAR_MIN_WIDTH}
          aria-valuemax={SIDEBAR_MAX_WIDTH}
          aria-valuenow={sidebarWidth}
          tabIndex={0}
          onDoubleClick={() => setSidebarWidth(SIDEBAR_DEFAULT_WIDTH)}
          onKeyDown={handleSidebarResizeKeyDown}
          onPointerDown={handleSidebarResizePointerDown}
          onPointerMove={handleSidebarResizePointerMove}
          onPointerUp={handleSidebarResizePointerUp}
          onPointerCancel={handleSidebarResizePointerUp}
          title={text(lang, "拖动调整宽度；双击复位", "Drag to resize; double-click to reset")}
        />

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
                    <strong>
                      {viewerPhase === "downloading"
                        ? text(lang, "正在下载 CIF（失败将自动重试）", "Downloading CIF (failures retry automatically)")
                        : text(lang, "正在解析 CIF 与配位环境", "Parsing CIF and coordination environments")}
                    </strong>
                    <span>
                      {viewerPhase === "downloading"
                        ? text(lang, "单次等待上限 12 秒，最多进行 3 次请求；已打开的结构会缓存在本机。", "Each attempt is limited to 12 seconds, with up to 3 requests; opened structures are cached locally.")
                        : text(lang, "原子、晶胞和多面体都在浏览器本地生成。", "Atoms, unit cell, and polyhedra are generated locally in your browser.")}
                    </span>
                  </>
                ) : viewerStatus === "error" ? (
                  <>
                    <WarningCircle aria-hidden="true" size={40} weight="duotone" />
                    <strong>
                      {viewerIssue?.kind === "download"
                        ? text(lang, "网络下载失败", "Network download failed")
                        : text(lang, "CIF 解析失败", "CIF parsing failed")}
                    </strong>
                    <span>{viewerIssue?.message || text(lang, "请检查 CIF 格式。", "Check the CIF format.")}</span>
                    <div className="mof-structure-empty-actions">
                      {activeCsdRecord ? (
                        <button type="button" onClick={() => loadPublicRecord(activeCsdRecord, { forceRefresh: true })}>
                          <CloudArrowDown aria-hidden="true" size={16} weight="bold" />
                          {text(lang, "重新下载", "Download again")}
                        </button>
                      ) : null}
                      {activeCsdRecord?.cifUrl ? (
                        <button className="mof-structure-secondary-action" type="button" onClick={copyActiveCifUrl}>
                          <CopySimple aria-hidden="true" size={16} weight="bold" />
                          {copyStatus === "copied"
                            ? text(lang, "地址已复制", "URL copied")
                            : copyStatus === "failed"
                              ? text(lang, "复制失败", "Copy failed")
                              : text(lang, "复制 CIF 地址", "Copy CIF URL")}
                        </button>
                      ) : null}
                      <button type="button" onClick={() => inputRef.current?.click()}>
                        <UploadSimple aria-hidden="true" size={16} weight="bold" />
                        {text(lang, "载入本地 CIF", "Load local CIF")}
                      </button>
                    </div>
                    {copyStatus !== "idle" ? (
                      <span className="mof-structure-copy-status" role="status">
                        {copyStatus === "copied"
                          ? text(lang, "可将地址粘贴到浏览器或下载工具中。", "Paste the URL into a browser or download tool.")
                          : text(lang, "浏览器未授予剪贴板权限，请从属性区打开公共数据链接。", "Clipboard permission was not granted; use the public-data link in the attributes panel.")}
                      </span>
                    ) : null}
                  </>
                ) : activeIdentityRecord ? (
                  <>
                    <Info aria-hidden="true" size={42} weight="duotone" />
                    <strong>
                      {activeIdentityRecord.externalCsdRefcodes?.length
                        ? text(lang, "CSD 主库已定位，公开子集未收录", "Located in primary CSD; absent from public subset")
                        : text(lang, "名称已接入，结构沉积待核验", "Name catalogued; structure deposition pending")}
                    </strong>
                    <span>
                      {activeIdentityRecord.externalCsdRefcodes?.length
                        ? text(
                          lang,
                          `${activeIdentityRecord.commonName} 已核验为 CCDC ${activeIdentityRecord.ccdcNumber || "记录"} / CSD ${activeIdentityRecord.externalCsdRefcodes.join(" / ")}，但该结构不在当前 15,906 条可公开部署的 MOF 子集中，因此不能自动加载；不会用相似结构替代。`,
                          `${activeIdentityRecord.commonName} is verified as CCDC ${activeIdentityRecord.ccdcNumber || "record"} / CSD ${activeIdentityRecord.externalCsdRefcodes.join(" / ")}, but it is not present in the 15,906-record MOF subset licensed for this deployment. No substitute structure is loaded.`,
                        )
                        : text(
                          lang,
                          `${activeIdentityRecord.commonName} 的名称与论文已进入检索；当前论文公开记录中尚未找到可由 CCDC 直接接入的沉积号，因此不会载入相似分子式或替代结构。`,
                          `${activeIdentityRecord.commonName} is searchable with its paper identity. No CCDC deposition that can be ingested directly has been verified in the current public paper record, so a similar formula or substitute structure will not be loaded.`,
                        )}
                    </span>
                    <div className="mof-structure-identity-actions">
                      {activeIdentityRecord.ccdcNumber ? (
                        <a href={`https://www.ccdc.cam.ac.uk/structures/Search?Ccdcid=${activeIdentityRecord.ccdcNumber}&DatabaseToSearch=Published`} target="_blank" rel="noreferrer">
                          <LinkSimple aria-hidden="true" size={16} weight="bold" />
                          {text(lang, "在 CCDC 打开", "Open in CCDC")}
                        </a>
                      ) : null}
                      {activeIdentityRecord.identityPage ? (
                        <a href={activeIdentityRecord.identityPage} target="_blank" rel="noreferrer">
                          <LinkSimple aria-hidden="true" size={16} weight="bold" />
                          {text(lang, "查看命名来源", "View identity source")}
                        </a>
                      ) : null}
                      {activeIdentityRecord.associatedPaper?.url ? (
                        <a href={activeIdentityRecord.associatedPaper.url} target="_blank" rel="noreferrer">
                          <LinkSimple aria-hidden="true" size={16} weight="bold" />
                          {text(lang, "查看关联论文", "View associated paper")}
                        </a>
                      ) : null}
                      {activeIdentityRecord.supplementaryMaterial?.url ? (
                        <a href={activeIdentityRecord.supplementaryMaterial.url} target="_blank" rel="noreferrer">
                          <LinkSimple aria-hidden="true" size={16} weight="bold" />
                          {text(lang, "查看补充材料", "View supporting information")}
                        </a>
                      ) : null}
                      <button type="button" onClick={() => inputRef.current?.click()}>
                        <UploadSimple aria-hidden="true" size={16} weight="bold" />
                        {text(lang, "载入本地 CIF", "Load local CIF")}
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
                    : isIdentityOnly
                      ? text(lang, "名称档案与结构文件分层管理；Refcode 未核验前不推断三维结构。", "Naming records and structure files are managed separately; no 3D structure is inferred before Refcode verification.")
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
