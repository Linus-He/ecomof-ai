// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowDown,
  ArrowRight,
  Crosshair,
  Minus,
  Plus,
  X,
} from "@phosphor-icons/react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import gasRecords from "../../../public/data/gas_adsorption_records_v2.json"
import atlasCatalysis from "../../assets/home-map/atlas-catalysis.jpg"
import atlasEvidence from "../../assets/home-map/atlas-validation.jpg"
import atlasGas from "../../assets/home-map/atlas-gassep.jpg"
import atlasLifecycle from "../../assets/home-map/atlas-ecoscreen.jpg"
import atlasStructureLibrary from "../../assets/home-map/atlas-library.jpg"
import microCatalysis from "../../assets/home-map/safe-catalysis-pathway.jpg"
import microEvidence from "../../assets/home-map/safe-evidence-validation.jpg"
import microGas from "../../assets/home-map/safe-gas-isotherm.jpg"
import microLifecycle from "../../assets/home-map/safe-lifecycle-pareto.jpg"
import microStructure from "../../assets/home-map/safe-structure-library.jpg"
import glucoseArtwork from "../../assets/molecules/glucose.svg"
import glycolicArtwork from "../../assets/molecules/glycolic-acid.svg"
import lacticArtwork from "../../assets/molecules/lactic-acid.svg"
import pyruvicArtwork from "../../assets/molecules/pyruvic-acid.svg"

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const lerp = (from, to, progress) => from + (to - from) * progress
const easeInOutCubic = value => value < 0.5
  ? 4 * value * value * value
  : 1 - Math.pow(-2 * value + 2, 3) / 2
const easeOutCubic = value => 1 - Math.pow(1 - value, 3)

const numberText = value => {
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString() : "Not available"
}

const WORLDS = {
  desktop: { width: 1440, height: 920 },
  mobile: { width: 720, height: 1180 },
}

const CLUSTER_POSITIONS = {
  ecoscreen: { desktop: [315, 285], mobile: [190, 445] },
  library: { desktop: [735, 240], mobile: [340, 225] },
  gassep: { desktop: [1110, 310], mobile: [525, 420] },
  organic: { desktop: [420, 650], mobile: [230, 775] },
  validation: { desktop: [970, 650], mobile: [490, 990] },
}

const NODE_POSITIONS = {
  core: { desktop: [555, 105], mobile: [165, 92] },
  fair: { desktop: [710, 80], mobile: [355, 70] },
  alias: { desktop: [865, 125], mobile: [535, 140] },
  identity: { desktop: [930, 215], mobile: [550, 245] },
  structure: { desktop: [625, 350], mobile: [165, 285] },
  missing: { desktop: [790, 365], mobile: [345, 340] },
  lca: { desktop: [105, 205], mobile: [575, 555] },
  cost: { desktop: [165, 440], mobile: [545, 655] },
  pareto: { desktop: [410, 140], mobile: [150, 505] },
  region: { desktop: [350, 420], mobile: [385, 545] },
  solvent: { desktop: [500, 270], mobile: [205, 385] },
  co2: { desktop: [1265, 155], mobile: [610, 300] },
  isotherm: { desktop: [1285, 430], mobile: [625, 455] },
  iast: { desktop: [1030, 125], mobile: [490, 285] },
  henry: { desktop: [1185, 515], mobile: [610, 535] },
  qst: { desktop: [1010, 430], mobile: [440, 510] },
  mixture: { desktop: [1215, 300], mobile: [595, 375] },
  glucose: { desktop: [110, 675], mobile: [115, 720] },
  pyruvate: { desktop: [270, 790], mobile: [155, 895] },
  lactic: { desktop: [555, 785], mobile: [365, 900] },
  glycolic: { desktop: [605, 600], mobile: [520, 735] },
  guest: { desktop: [365, 510], mobile: [145, 630] },
  labels: { desktop: [775, 810], mobile: [245, 1060] },
  benchmark: { desktop: [1130, 810], mobile: [565, 1100] },
  sensitivity: { desktop: [1230, 650], mobile: [605, 925] },
  evidence: { desktop: [820, 510], mobile: [300, 930] },
  uncertainty: { desktop: [915, 785], mobile: [415, 1100] },
  external: { desktop: [1060, 555], mobile: [545, 850] },
}

// Visual safety guardrail: keep map art light and sparse; never use pore closeups,
// dense dot fields, clustered voids, or deep-sea palettes in this registry.
const CLUSTER_ART = {
  ecoscreen: atlasLifecycle,
  library: atlasStructureLibrary,
  gassep: atlasGas,
  organic: atlasCatalysis,
  validation: atlasEvidence,
}

const ART = {
  core: microStructure,
  fair: atlasStructureLibrary,
  alias: atlasStructureLibrary,
  identity: atlasEvidence,
  structure: microStructure,
  missing: microEvidence,
  lca: atlasLifecycle,
  cost: microLifecycle,
  pareto: microLifecycle,
  region: atlasLifecycle,
  solvent: microCatalysis,
  co2: atlasGas,
  isotherm: microGas,
  iast: atlasEvidence,
  henry: atlasGas,
  qst: microEvidence,
  mixture: microCatalysis,
  glucose: glucoseArtwork,
  pyruvate: pyruvicArtwork,
  lactic: lacticArtwork,
  glycolic: glycolicArtwork,
  guest: atlasCatalysis,
  labels: atlasEvidence,
  benchmark: microEvidence,
  sensitivity: microLifecycle,
  evidence: atlasStructureLibrary,
  uncertainty: atlasEvidence,
  external: microStructure,
}

const MOLECULE_ART_IDS = new Set(["glucose", "pyruvate", "lactic", "glycolic"])
const VISIBLE_NODE_IDS = new Set([
  "core",
  "fair",
  "identity",
  "missing",
  "lca",
  "pareto",
  "isotherm",
  "iast",
  "glucose",
  "pyruvate",
  "lactic",
  "glycolic",
  "guest",
  "labels",
  "benchmark",
  "sensitivity",
  "evidence",
])

const REPRESENTATIVE_GAS_RECORD = gasRecords.find(record => (
  record.dataGrade === "computed-IAST"
  && record.gasPair === "CO2/CH4"
  && record.condition?.temperatureK === 298
  && record.isotherm?.length >= 8
  && record.secondaryIsotherm?.length >= 8
)) || gasRecords.find(record => record.secondaryIsotherm?.length >= 3)

const CONTINUATION_TARGETS = {
  ecoscreen: "home-research-gateway",
  library: "home-data-foundation",
  gassep: "home-gas-performance",
  organic: "home-research-gateway",
  validation: "home-algorithm-validation",
}

function GasIsothermPreview({ zh }) {
  const record = REPRESENTATIVE_GAS_RECORD
  const primary = Array.isArray(record?.isotherm) ? record.isotherm : []
  const secondary = Array.isArray(record?.secondaryIsotherm) ? record.secondaryIsotherm : []
  const points = [
    ...primary.map(point => ({ pressureBar: point.pressureBar, primary: point.uptake })),
    ...secondary.map(point => ({ pressureBar: point.pressureBar, secondary: point.uptake })),
  ].sort((a, b) => a.pressureBar - b.pressureBar)
  const source = record?.fieldSources?.iaSTSelectivity || record?.fieldSources?.selectivity || {}
  const primaryGas = record?.primaryGas || "CO2"
  const secondaryGas = record?.secondaryGas || "CH4"

  return (
    <div className="home-map-gas-preview">
      <header>
        <div>
          <span>{zh ? "来源配对纯组分等温线" : "SOURCE-PAIRED PURE-COMPONENT ISOTHERMS"}</span>
          <strong>{record?.rawName || record?.displayName || "MOF"} · {record?.gasPair || `${primaryGas}/${secondaryGas}`}</strong>
        </div>
        <small>{record?.condition?.temperatureK || "—"} K</small>
      </header>
      <div className="home-map-gas-chart" role="img" aria-label={zh ? `${primaryGas} 与 ${secondaryGas} 配对纯组分吸附等温线` : `Paired ${primaryGas} and ${secondaryGas} pure-component adsorption isotherms`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 10, bottom: 2, left: -12 }}>
            <CartesianGrid stroke="#dedcd1" strokeDasharray="2 4" vertical={false} />
            <XAxis
              type="number"
              dataKey="pressureBar"
              domain={["dataMin", "dataMax"]}
              tick={{ fill: "#77746d", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#bdb9ae" }}
              tickFormatter={value => Number(value) < 10 ? Number(value).toFixed(1) : Number(value).toFixed(0)}
              label={{ value: zh ? "压力 / bar" : "Pressure / bar", position: "insideBottomRight", offset: -2, fill: "#77746d", fontSize: 10 }}
            />
            <YAxis
              tick={{ fill: "#77746d", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              label={{ value: zh ? "吸附量 / mmol g⁻¹" : "Uptake / mmol g⁻¹", angle: -90, position: "insideLeft", fill: "#77746d", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{ background: "#faf9f5", border: "1px solid #c6c4ba", borderRadius: 4, fontSize: 11 }}
              labelFormatter={value => `${Number(value).toFixed(2)} bar`}
              formatter={(value, name) => [`${Number(value).toFixed(3)} mmol/g`, name]}
            />
            <Legend wrapperStyle={{ fontSize: 10, color: "#5f5d57" }} />
            <Line type="monotone" dataKey="primary" name={primaryGas} connectNulls stroke="#d97757" strokeWidth={2.4} dot={{ r: 2.2, fill: "#d97757" }} activeDot={{ r: 4 }} isAnimationActive />
            <Line type="monotone" dataKey="secondary" name={secondaryGas} connectNulls stroke="#788c5d" strokeWidth={2.4} dot={{ r: 2.2, fill: "#788c5d" }} activeDot={{ r: 4 }} isAnimationActive />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <dl className="home-map-gas-facts">
        <div>
          <dt>{zh ? "数据等级" : "DATA GRADE"}</dt>
          <dd>{record?.dataGrade || "—"}</dd>
        </div>
        <div>
          <dt>{zh ? "来源点" : "SOURCE POINTS"}</dt>
          <dd>{primary.length} + {secondary.length}</dd>
        </div>
        <div>
          <dt>{zh ? "情景 IAST" : "SCENARIO IAST"}</dt>
          <dd>{Number.isFinite(Number(record?.metrics?.iaSTSelectivity)) ? Number(record.metrics.iaSTSelectivity).toFixed(2) : (zh ? "条件不足" : "Unavailable")}</dd>
        </div>
        <div>
          <dt>DOI</dt>
          <dd>{source.doi || "—"}</dd>
        </div>
      </dl>
    </div>
  )
}

function BranchEvidencePreview({ cluster, selected, summary, gasParetoCount, zh }) {
  if (cluster.id === "gassep") return <GasIsothermPreview zh={zh} />

  const branchFacts = {
    ecoscreen: [
      [zh ? "决策变量" : "DECISION VARIABLES", "LCA · LCC · task performance"],
      [zh ? "筛选方式" : "SCREENING", zh ? "非支配前沿" : "Non-dominated frontier"],
      [zh ? "边界" : "BOUNDARY", zh ? "功能单位与地区情景" : "Functional unit and regional scenario"],
    ],
    library: [
      [zh ? "平台记录" : "PLATFORM RECORDS", numberText(summary?.totalRecords)],
      ["CoRE MOF 2024 CR", numberText(summary?.coreMofRecords)],
      ["FAIR-MOFs", numberText(summary?.fairMofsRecords)],
    ],
    organic: [
      [zh ? "解释对象" : "EXPLANATION TARGET", zh ? "主客体催化路径" : "Host-guest catalytic pathway"],
      [zh ? "评分形式" : "SCORING FORM", "HGCPS · weighted geometric mean"],
      [zh ? "证据边界" : "EVIDENCE BOUNDARY", zh ? "路径、权重与不确定度并列" : "Path, weights, and uncertainty together"],
    ],
    validation: [
      [zh ? "实验标签" : "EXPERIMENTAL LABELS", numberText(summary?.experimentalLabelCount)],
      ["Benchmark", numberText(summary?.benchmarkEligibleCount)],
      [zh ? "当前信号" : "CURRENT SIGNAL", `${numberText(gasParetoCount)} ${zh ? "个分离前沿点" : "separation frontier points"}`],
    ],
  }
  const facts = branchFacts[cluster.id] || []

  return (
    <div className="home-map-branch-preview">
      <div className="home-map-branch-art">
        <img src={CLUSTER_ART[cluster.id]} alt="" aria-hidden="true" />
      </div>
      <div className="home-map-branch-copy">
        <span>{cluster.metric}</span>
        <h3>{selected?.title || cluster.title}</h3>
        <p>{selected?.detail || selected?.body || cluster.detail}</p>
        <dl>
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

export function ScientificDiscoveryMap({
  t,
  lang,
  summary,
  gasParetoCount,
  isMobile,
  viewportWidth,
  reducedMotion,
  onNavigate,
  onBranchChange,
  onContinueResearch,
}) {
  const zh = lang === "zh"
  const measuredWidth = Number(viewportWidth) || (typeof window === "undefined" ? 1440 : window.innerWidth)
  const measuredHeight = typeof window === "undefined" ? 900 : window.innerHeight
  const mobileAtlas = isMobile || (measuredWidth < 900 && measuredHeight >= measuredWidth)
  const compactAtlas = !mobileAtlas && measuredWidth < 1200
  const layoutMode = mobileAtlas ? "mobile" : compactAtlas ? "compact" : "desktop"
  const world = WORLDS[mobileAtlas ? "mobile" : "desktop"]
  const [mapSize, setMapSize] = useState({ width: measuredWidth, height: measuredHeight })
  const mapInset = mobileAtlas || compactAtlas ? 24 : 0
  const fitScale = Math.min(
    Math.max(1, mapSize.width - mapInset) / world.width,
    Math.max(1, mapSize.height - mapInset) / world.height,
  )
  const defaultScale = clamp(fitScale, mobileAtlas || compactAtlas ? 0.48 : 0.64, mobileAtlas ? 0.96 : 1)
  const minScale = mobileAtlas ? 0.46 : compactAtlas ? 0.46 : 0.62
  const maxScale = mobileAtlas ? 0.96 : compactAtlas ? 1.08 : 1.42
  const [view, setView] = useState({ x: 0, y: 0, scale: defaultScale })
  const [bloomProgress, setBloomProgress] = useState(reducedMotion ? 1 : 0)
  const [dragging, setDragging] = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const [expansionPhase, setExpansionPhase] = useState("idle")
  const [expansionOrigin, setExpansionOrigin] = useState({ x: 0, y: 0 })
  const bloomTargetRef = useRef(reducedMotion ? 1 : 0)
  const bloomProgressRef = useRef(reducedMotion ? 1 : 0)
  const dragRef = useRef(null)
  const closeRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined
    const syncMapSize = () => {
      const rect = map.getBoundingClientRect()
      setMapSize(current => (
        Math.abs(current.width - rect.width) < 0.5 && Math.abs(current.height - rect.height) < 0.5
          ? current
          : { width: rect.width, height: rect.height }
      ))
    }
    syncMapSize()
    if (typeof ResizeObserver === "undefined") return undefined
    const observer = new ResizeObserver(syncMapSize)
    observer.observe(map)
    return () => observer.disconnect()
  }, [layoutMode])

  useEffect(() => {
    setView({ x: 0, y: 0, scale: defaultScale })
  }, [defaultScale, layoutMode])

  useEffect(() => {
    if (reducedMotion) {
      bloomTargetRef.current = 1
      bloomProgressRef.current = 1
      setBloomProgress(1)
      return undefined
    }

    let frame = 0
    let previous = performance.now()
    const tick = now => {
      const elapsed = Math.min(now - previous, 64)
      previous = now
      const current = bloomProgressRef.current
      const target = bloomTargetRef.current
      if (Math.abs(target - current) > 0.0001) {
        const step = elapsed / 2600
        const next = target > current
          ? Math.min(target, current + step)
          : Math.max(target, current - step)
        bloomProgressRef.current = next
        setBloomProgress(next)
      }
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [reducedMotion])

  useEffect(() => {
    if (!selectedId) return undefined
    const onKeyDown = event => {
      if (event.key === "Escape") closeSelection()
    }
    window.addEventListener("keydown", onKeyDown)
    window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }))
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedId, reducedMotion])

  useEffect(() => {
    const onKeyDown = event => {
      if (["ArrowDown", "PageDown", " "].includes(event.key) && bloomProgressRef.current < 0.985) {
        bloomTargetRef.current = 1
      }
      if (["ArrowUp", "PageUp", "Home"].includes(event.key) && window.scrollY === 0 && bloomProgressRef.current > 0.015) {
        bloomTargetRef.current = 0
        setSelectedId("")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const clusters = useMemo(() => [
    {
      id: "ecoscreen",
      shortTitle: zh ? "可持续性评价" : "Sustainability",
      title: zh ? "怎样筛选更可持续的 MOF？" : "Which MOFs are more sustainable?",
      description: zh ? "把环境影响、成本与任务性能放进同一决策边界。" : "Balance environmental impact, cost, and task performance in one decision boundary.",
      detail: zh ? "EcoScreen 使用透明的 LCA / LCC 清单与情景假设比较候选材料，并保留功能单位、地区基线和缺失数据边界。" : "EcoScreen compares candidates with transparent LCA/LCC inventories and scenario assumptions while retaining functional-unit, regional-baseline, and missing-data boundaries.",
      metric: zh ? "LCA / LCC 多目标筛选" : "Multi-objective LCA / LCC screening",
      source: zh ? "来源：生命周期清单、地区基线、工艺情景" : "Sources: life-cycle inventory, regional baselines, process scenarios",
      hash: "ecoscreen",
      target: "ecoscreen",
      tone: "sage",
    },
    {
      id: "library",
      shortTitle: zh ? "库与来源" : "Library & provenance",
      title: zh ? "结构与证据从哪里来？" : "Where do structures and evidence come from?",
      description: zh ? "在字段级来源、结构身份与数据完整度之间建立连接。" : "Connect field-level provenance, structural identity, and data completeness.",
      detail: zh ? "MOF库统一检索结构、孔道、气体吸附与催化关联；每个字段保留来源、缺失状态与可核查入口。" : "MOF Library joins structures, pore properties, gas adsorption, and catalysis links while preserving source, missingness, and verification entry points for every field.",
      metric: `${numberText(summary?.totalRecords)} ${zh ? "条平台记录" : "platform records"}`,
      source: zh ? "来源：CoRE MOF 2024 CR、FAIR-MOFs 与字段级注册表" : "Sources: CoRE MOF 2024 CR, FAIR-MOFs, and field registries",
      hash: "library",
      target: "mofLibrary",
      tone: "cobalt",
    },
    {
      id: "gassep",
      shortTitle: zh ? "气体分离" : "Gas separation",
      title: zh ? "哪种材料更适合气体分离？" : "Which material is better suited to gas separation?",
      description: zh ? "共同检查等温线、IAST 选择性、工作容量与条件边界。" : "Inspect isotherms, IAST selectivity, working capacity, and condition boundaries together.",
      detail: zh ? "GasSep 将真实等温线、气体组成、温度、压力和配对纯组分条件并列呈现；数据不足时不生成越界的 IAST 或 Qst 结论。" : "GasSep presents real isotherms, gas composition, temperature, pressure, and paired pure-component conditions together, withholding IAST or Qst conclusions when eligibility is unmet.",
      metric: `${numberText(summary?.gasAdsorptionRecords)} ${zh ? "条吸附记录" : "adsorption records"}`,
      source: zh ? "来源：ISODB / NIST 与可追溯文献记录" : "Sources: ISODB / NIST and traceable literature records",
      hash: "gassep",
      target: "gassep",
      tone: "teal",
    },
    {
      id: "organic",
      shortTitle: zh ? "催化性能" : "Catalytic performance",
      title: zh ? "如何解释催化路径？" : "How can a catalytic pathway be explained?",
      description: zh ? "让主客体匹配、竞争路径、权重与不确定度保持可见。" : "Keep host-guest matching, competing routes, weights, and uncertainty visible.",
      detail: zh ? "Organic Acid 工作区把反应网络、MOF 主体、客体金属与 HGCPS 贡献连接成可审计路径，排名只在证据与实验条件范围内解释。" : "Organic Acid links reaction networks, host MOFs, guest metals, and HGCPS contributions into an auditable path, interpreting rankings only within evidence and experimental-condition limits.",
      metric: zh ? "主客体路径 + HGCPS" : "Host-guest pathway + HGCPS",
      source: zh ? "来源：反应规则、文献证据与实验激活记录" : "Sources: reaction rules, literature evidence, and experimental-activation records",
      hash: "catalysis-organic-acid",
      target: "catalysisLab",
      tone: "coral",
    },
    {
      id: "validation",
      shortTitle: zh ? "可信验证" : "Trustworthy validation",
      title: zh ? "结果是否足够可信？" : "Are the results trustworthy enough?",
      description: zh ? "用证据门控、敏感性、实验标签与 Benchmark 限定结论。" : "Bound conclusions with evidence gates, sensitivity, labels, and benchmarks.",
      detail: zh ? "验证中心集中展示规则分数、证据修正、参数扰动、实验标签和外部测试；缺失验证不会被包装成确定性。" : "The validation center combines rule scores, evidence adjustment, parameter perturbation, experimental labels, and external tests without presenting missing validation as certainty.",
      metric: `${numberText(summary?.experimentalLabelCount)} ${zh ? "条实验标签" : "experimental labels"}`,
      source: zh ? "来源：实验标签、Benchmark 与模型稳健性报告" : "Sources: experimental labels, benchmarks, and robustness reports",
      hash: "methodology-algorithm-validation",
      target: "about",
      tone: "violet",
    },
  ], [summary, zh])

  const nodes = useMemo(() => [
    { id: "core", cluster: "library", title: "CoRE MOF 2024 CR", body: zh ? `${numberText(summary?.coreMofRecords)} 条逐结构记录，提供晶体身份与几何描述符。` : `${numberText(summary?.coreMofRecords)} row-level structures with crystal identity and geometric descriptors.`, source: "CoRE MOF 2024 CR", tone: "cobalt" },
    { id: "fair", cluster: "library", title: "FAIR-MOFs", body: zh ? `${numberText(summary?.fairMofsRecords)} 条开放记录，连接合成条件、DOI 与物化性质。` : `${numberText(summary?.fairMofsRecords)} open records linking synthesis conditions, DOI, and physicochemical properties.`, source: "FAIR-MOFs", tone: "teal" },
    { id: "alias", cluster: "library", title: zh ? "别名与 CSD refcode" : "Aliases and CSD refcodes", body: zh ? "别名、CSD refcode 与内部身份键共同降低重复和错配风险。" : "Aliases, CSD refcodes, and internal identity keys reduce duplicate and mismatch risk.", source: zh ? "结构身份注册表" : "Structure identity registry", tone: "violet" },
    { id: "identity", cluster: "library", title: zh ? "结构身份解析" : "Structure identity resolution", body: zh ? "结构来源、清洗版本与父级记录保持可追溯。" : "Structure source, cleaning version, and parent record remain traceable.", source: zh ? "MOF identity registry" : "MOF identity registry", tone: "teal" },
    { id: "structure", cluster: "library", title: zh ? "描述符空间" : "Descriptor space", body: zh ? "孔径、比表面、空隙率和元素组成用于检索与任务筛选。" : "Pore size, surface area, void fraction, and elemental composition support search and task screening.", source: zh ? "物化性质索引" : "Physicochemical property index", tone: "cobalt" },
    { id: "missing", cluster: "library", title: zh ? "字段缺失状态" : "Field missingness", body: zh ? "缺失值、不可得值和未核查值分开登记，不用零值替代。" : "Missing, unavailable, and unverified values remain distinct rather than being replaced by zero.", source: zh ? "字段级来源注册表" : "Field-level provenance registry", tone: "violet" },
    { id: "lca", cluster: "ecoscreen", title: zh ? "生命周期影响" : "Life-cycle impact", body: zh ? "材料、溶剂、能源、回收与循环共同进入功能单位。" : "Materials, solvents, energy, recovery, and cycling share one functional unit.", source: zh ? "LCA inventory" : "LCA inventory", tone: "sage" },
    { id: "cost", cluster: "ecoscreen", title: zh ? "成本与供应" : "Cost and supply", body: zh ? "前驱体价格、用量和回收假设用于构建可检查的成本边界。" : "Precursor price, quantity, and recovery assumptions define an inspectable cost boundary.", source: zh ? "金属前驱体成本表" : "Metal precursor cost table", tone: "coral" },
    { id: "pareto", cluster: "ecoscreen", title: zh ? "非支配前沿" : "Non-dominated frontier", body: zh ? "保留环境、成本与性能之间的真实权衡，不制造单一总冠军。" : "Preserves real impact, cost, and performance trade-offs without inventing one universal winner.", source: zh ? "多目标筛选结果" : "Multi-objective screening output", tone: "cobalt" },
    { id: "region", cluster: "ecoscreen", title: zh ? "地区情景" : "Regional scenarios", body: zh ? "电力结构、运输和水资源基线随地区情景切换。" : "Power mix, transport, and water baselines change with regional scenarios.", source: zh ? "地区基线数据库" : "Regional baseline database", tone: "sage" },
    { id: "solvent", cluster: "ecoscreen", title: zh ? "溶剂与回收" : "Solvent and recovery", body: zh ? "溶剂消耗、替代与回收率显式进入清单，不被隐藏在总分中。" : "Solvent use, substitution, and recovery rates enter the inventory explicitly.", source: zh ? "工艺情景清单" : "Process scenario inventory", tone: "coral" },
    { id: "co2", cluster: "gassep", title: "CO₂ / N₂", body: zh ? "按气体组成、温度与压力检查分离任务的适用条件。" : "Inspect task eligibility by gas composition, temperature, and pressure.", source: zh ? "气体系统注册表" : "Gas-system registry", tone: "teal" },
    { id: "isotherm", cluster: "gassep", title: zh ? "配对纯组分等温线" : "Paired pure-component isotherms", body: zh ? "只有同材料、同温度且压力覆盖可比时，才进入 IAST 拟合。" : "IAST fitting requires the same material, temperature, and comparable pressure coverage.", source: zh ? "等温线与采集报告" : "Isotherms and collection report", tone: "cobalt" },
    { id: "iast", cluster: "gassep", title: `IAST · ${numberText(gasParetoCount)}`, body: zh ? "computed、source-reported 与 proxy 选择性保持分层。" : "Computed, source-reported, and proxy selectivity remain distinct.", source: zh ? "GasSep 热力学计算层" : "GasSep thermodynamic computation layer", tone: "violet" },
    { id: "henry", cluster: "gassep", title: zh ? "Henry 亲和力" : "Henry affinity", body: zh ? "低压斜率只在覆盖低压区且拟合稳定时报告。" : "Low-pressure slopes are reported only with adequate low-pressure coverage and stable fits.", source: zh ? "等温线拟合记录" : "Isotherm fit records", tone: "sage" },
    { id: "qst", cluster: "gassep", title: "Qst", body: zh ? "等量吸附热需要多温度、可比较的等温线；否则明确标记不可计算。" : "Isosteric heat requires comparable multi-temperature isotherms; otherwise it is marked unavailable.", source: zh ? "GasSep 热力学条件门" : "GasSep thermodynamic eligibility gate", tone: "coral" },
    { id: "mixture", cluster: "gassep", title: zh ? "混合物边界" : "Mixture boundary", body: zh ? "组成、压力窗口与吸附相模型共同限定混合物结论。" : "Composition, pressure window, and adsorbed-phase model jointly bound mixture conclusions.", source: zh ? "气体任务条件注册表" : "Gas task-condition registry", tone: "teal" },
    { id: "glucose", cluster: "organic", title: zh ? "葡萄糖入口" : "Glucose entry", body: zh ? "反应网络从糖类与含碳中间体出发，追踪竞争有机酸路径。" : "The reaction network starts from sugars and carbon-containing intermediates and tracks competing organic-acid routes.", source: zh ? "反应路径数据" : "Reaction pathway data", tone: "sage" },
    { id: "pyruvate", cluster: "organic", title: zh ? "丙酮酸路径" : "Pyruvic-acid path", body: zh ? "中间体节点用于连接反应规则、证据和 MOF influence hypothesis。" : "Intermediate nodes connect reaction rules, evidence, and MOF influence hypotheses.", source: zh ? "有机酸路径图" : "Organic-acid pathway graph", tone: "coral" },
    { id: "lactic", cluster: "organic", title: zh ? "乳酸竞争路径" : "Lactic-acid competing path", body: zh ? "竞争产物不会被隐藏，而是与目标路径并列比较。" : "Competing products remain visible and are compared alongside the target route.", source: zh ? "有机酸文献数据集" : "Organic-acid literature dataset", tone: "violet" },
    { id: "glycolic", cluster: "organic", title: zh ? "乙醇酸支路" : "Glycolic-acid branch", body: zh ? "支路证据、缺失字段和不确定度共同影响路径解释。" : "Branch evidence, missing fields, and uncertainty jointly shape pathway interpretation.", source: zh ? "反应证据图" : "Reaction evidence graph", tone: "teal" },
    { id: "guest", cluster: "organic", title: zh ? "主客体匹配" : "Host-guest matching", body: zh ? "主体孔腔、客体金属和反应步骤分开计分并保留贡献项。" : "Host cavity, guest metal, and reaction step are scored separately with visible contributions.", source: zh ? "HGCPS 分解记录" : "HGCPS decomposition record", tone: "cobalt" },
    { id: "labels", cluster: "validation", title: zh ? "实验标签" : "Experimental labels", body: zh ? `${numberText(summary?.experimentalLabelCount)} 条标签用于外部误差和适用域检查。` : `${numberText(summary?.experimentalLabelCount)} labels support external-error and applicability-domain checks.`, source: zh ? "实验标签数据集" : "Experimental-label dataset", tone: "coral" },
    { id: "benchmark", cluster: "validation", title: "Benchmark", body: zh ? `${numberText(summary?.benchmarkEligibleCount)} 条记录满足当前字段门槛。` : `${numberText(summary?.benchmarkEligibleCount)} records meet the current field gate.`, source: zh ? "Benchmark 数据集" : "Benchmark dataset", tone: "cobalt" },
    { id: "sensitivity", cluster: "validation", title: zh ? "参数扰动" : "Parameter perturbation", body: zh ? "用权重扰动和排名变化识别不稳定候选。" : "Weight perturbation and rank movement reveal unstable candidates.", source: zh ? "模型稳健性报告" : "Model robustness report", tone: "violet" },
    { id: "evidence", cluster: "validation", title: zh ? "证据门控" : "Evidence gate", body: zh ? "来源等级、字段完整度和验证状态共同限定结论强度。" : "Source grade, field completeness, and validation status jointly bound conclusion strength.", source: zh ? "证据等级与来源注册表" : "Evidence levels and source registry", tone: "sage" },
    { id: "uncertainty", cluster: "validation", title: zh ? "不确定度传播" : "Uncertainty propagation", body: zh ? "输入范围、权重扰动和输出区间共同呈现，而不是压成单点。" : "Input ranges, weight perturbations, and output intervals remain visible rather than collapsing to one point.", source: zh ? "不确定度与稳健性报告" : "Uncertainty and robustness report", tone: "violet" },
    { id: "external", cluster: "validation", title: zh ? "外部验证" : "External validation", body: zh ? "外部标签和独立测试只在定义一致时进入性能比较。" : "External labels and independent tests enter performance comparison only when definitions align.", source: zh ? "外部测试注册表" : "External test registry", tone: "teal" },
  ], [gasParetoCount, summary, zh])

  const visibleNodes = useMemo(() => nodes.filter(node => VISIBLE_NODE_IDS.has(node.id)), [nodes])
  const clusterById = useMemo(() => Object.fromEntries(clusters.map(cluster => [cluster.id, cluster])), [clusters])
  const selected = nodes.find(node => node.id === selectedId) || clusters.find(cluster => cluster.id === selectedId) || null
  const selectedCluster = selected?.cluster ? clusterById[selected.cluster] : selected
  const bloomDone = bloomProgress > 0.985
  const wordProgress = easeInOutCubic(clamp((bloomProgress - 0.06) / 0.56, 0, 1))
  const cameraProgress = easeInOutCubic(clamp(bloomProgress / 0.9, 0, 1))
  const clusterProgress = easeOutCubic(clamp((bloomProgress - 0.42) / 0.2, 0, 1))
  const lineProgress = easeInOutCubic(clamp((bloomProgress - 0.58) / 0.42, 0, 1))
  const introScale = 1
  const cameraScale = lerp(introScale, view.scale, cameraProgress)

  const positionFor = item => {
    const table = item.cluster ? NODE_POSITIONS : CLUSTER_POSITIONS
    const position = table[item.id]?.[mobileAtlas ? "mobile" : "desktop"] || [0, 0]
    return { x: position[0], y: position[1] }
  }

  const nodeAppearProgress = (node, index) => {
    const position = positionFor(node)
    const centerX = world.width / 2
    const centerY = world.height / 2
    const distance = Math.hypot(position.x - centerX, position.y - centerY)
    const maxDistance = Math.hypot(centerX, centerY)
    const appearStart = 0.38 + 0.27 * (distance / maxDistance) + (index % 4) * 0.008
    return easeOutCubic(clamp((bloomProgress - appearStart) / 0.22, 0, 1))
  }

  const startBloom = () => {
    bloomTargetRef.current = 1
  }

  const replayBloom = () => {
    setSelectedId("")
    setExpansionPhase("idle")
    setView({ x: 0, y: 0, scale: defaultScale })
    bloomTargetRef.current = reducedMotion ? 1 : 0
  }

  const openSelection = (id, event) => {
    const mapRect = mapRef.current?.getBoundingClientRect()
    const sourceRect = event?.currentTarget?.getBoundingClientRect?.()
    if (mapRect && sourceRect) {
      setExpansionOrigin({
        x: sourceRect.left + sourceRect.width / 2 - (mapRect.left + mapRect.width / 2),
        y: sourceRect.top + sourceRect.height / 2 - (mapRect.top + mapRect.height / 2),
      })
    } else {
      setExpansionOrigin({ x: 0, y: 0 })
    }
    const next = nodes.find(node => node.id === id) || clusters.find(cluster => cluster.id === id)
    const branchId = next?.cluster || next?.id
    setSelectedId(id)
    setExpansionPhase("open")
    onBranchChange?.(branchId)
  }

  function closeSelection() {
    if (!selectedId) return
    if (reducedMotion) {
      setSelectedId("")
      setExpansionPhase("idle")
      return
    }
    setExpansionPhase("closing")
    window.setTimeout(() => {
      setSelectedId("")
      setExpansionPhase("idle")
    }, 460)
  }

  const zoomBy = factor => {
    if (!bloomDone) return
    setView(current => ({ ...current, scale: clamp(current.scale * factor, minScale, maxScale) }))
  }

  const onWheel = event => {
    if (!bloomDone) {
      if (event.deltaY > 0) {
        event.preventDefault()
        startBloom()
      }
      return
    }

    if (event.deltaY < 0 && window.scrollY <= 4) {
      event.preventDefault()
      setSelectedId("")
      setExpansionPhase("idle")
      bloomTargetRef.current = reducedMotion ? 1 : 0
      return
    }

    if (event.deltaY > 0) {
      event.preventDefault()
      window.scrollBy({ top: event.deltaY, behavior: "auto" })
    }
  }

  const onPointerDown = event => {
    if (!bloomDone || selected || event.button !== 0 || view.scale <= minScale + 0.001) return
    if (event.target.closest?.("button")) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: view.x,
      y: view.y,
    }
    setDragging(true)
  }

  const onPointerMove = event => {
    const origin = dragRef.current
    if (!origin || origin.pointerId !== event.pointerId) return
    const maxX = mobileAtlas ? 150 : compactAtlas ? 180 : 290
    const maxY = mobileAtlas ? 190 : 180
    setView(current => ({
      ...current,
      x: clamp(origin.x + event.clientX - origin.startX, -maxX, maxX),
      y: clamp(origin.y + event.clientY - origin.startY, -maxY, maxY),
    }))
  }

  const endPointer = event => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setDragging(false)
  }

  const enterSelected = () => {
    if (!selectedCluster) return
    onNavigate?.(selectedCluster.hash, selectedCluster.target)
  }

  const continueSelected = () => {
    if (!selectedCluster) return
    const branchId = selectedCluster.id
    const targetId = CONTINUATION_TARGETS[branchId]
    if (reducedMotion) {
      setSelectedId("")
      setExpansionPhase("idle")
      onContinueResearch?.(branchId, targetId)
      return
    }
    setExpansionPhase("closing")
    window.setTimeout(() => {
      setSelectedId("")
      setExpansionPhase("idle")
      onContinueResearch?.(branchId, targetId)
    }, 460)
  }

  const wordLayout = mobileAtlas
    ? {
        first: { from: [195, 510], to: [36, 64] },
        second: { from: [345, 510], to: [285, 600] },
      }
    : compactAtlas
      ? {
          first: { from: [410, 295], to: [60, 54] },
          second: { from: [650, 295], to: [950, 450] },
        }
    : {
        first: { from: [410, 295], to: [42, 46] },
        second: { from: [650, 295], to: [905, 520] },
      }

  const wordStyle = layout => ({
    left: lerp(layout.from[0], layout.to[0], wordProgress),
    top: lerp(layout.from[1], layout.to[1], wordProgress),
    transform: `scale(${lerp(mobileAtlas ? 0.72 : compactAtlas ? 0.9 : 1, mobileAtlas ? 1.45 : compactAtlas ? 1.05 : 1.35, wordProgress)})`,
  })

  return (
    <div
      ref={mapRef}
      data-testid="home-scientific-atlas"
      className="home-discovery-map"
      data-mobile={mobileAtlas ? "true" : "false"}
      data-layout={layoutMode}
      data-bloomed={bloomDone ? "true" : "false"}
      data-dragging={dragging ? "true" : "false"}
      data-inspecting={selected ? "true" : "false"}
      data-expansion-phase={expansionPhase}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      style={{
        "--map-bg": t?.bg || "#ffffff",
        "--map-surface": t?.panel || "#ffffff",
        "--map-text": t?.textStrong || "#141413",
        "--map-muted": t?.muted || "#73726c",
        "--map-faint": t?.faint || "#9c9a92",
        "--map-border": t?.border || "#dedcd1",
        "--map-border-strong": t?.borderStrong || "#c6c4ba",
        "--map-accent": t?.accent || "#d97757",
        "--map-shadow": t?.shadowMd,
      }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      <div className="home-map-viewport" aria-label={zh ? "交互式材料研究地图" : "Interactive materials research map"}>
        <div
          data-testid="home-discovery-map-stage"
          className="home-map-stage"
          style={{
            width: world.width,
            height: world.height,
            transform: `translate3d(calc(-50% + ${lerp(0, view.x, cameraProgress)}px), calc(-50% + ${lerp(0, view.y, cameraProgress)}px), 0) scale(${cameraScale})`,
          }}
        >
          <svg
            className="home-map-connections"
            viewBox={`0 0 ${world.width} ${world.height}`}
            aria-hidden="true"
            preserveAspectRatio="none"
          >
            {visibleNodes.map(node => {
              const from = positionFor(node)
              const to = positionFor(clusterById[node.cluster])
              return (
                <line
                  key={node.id}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  pathLength="1"
                  style={{ opacity: lineProgress * 0.34, strokeDashoffset: 1 - lineProgress }}
                />
              )
            })}
          </svg>

          <h1 className="home-map-wordmark" aria-label="EcoMOF-AI">
            <span className="home-map-word home-map-word-first" style={wordStyle(wordLayout.first)}>
              <span className="home-map-word-inner">Keep</span>
            </span>
            <span className="home-map-word home-map-word-second" style={wordStyle(wordLayout.second)}>
              <span className="home-map-word-inner">testing.</span>
            </span>
          </h1>

          {clusters.map(cluster => {
            const position = positionFor(cluster)
            return (
              <button
                key={cluster.id}
                type="button"
                className="home-map-cluster"
                data-cluster-id={cluster.id}
                data-tone={cluster.tone}
                style={{ left: position.x, top: position.y, opacity: clusterProgress }}
                onPointerDown={event => event.stopPropagation()}
                onClick={event => openSelection(cluster.id, event)}
                aria-label={`${cluster.title} · ${cluster.description}`}
                tabIndex={bloomDone ? 0 : -1}
              >
                <span className="home-map-cluster-mark" data-art-kind="editorial">
                  <img src={CLUSTER_ART[cluster.id]} alt="" aria-hidden="true" />
                </span>
                <span className="home-map-cluster-title" role="heading" aria-level={2}>{cluster.title}</span>
                <span className="home-map-cluster-description">{cluster.description}</span>
              </button>
            )
          })}

          {visibleNodes.map((node, index) => {
            const position = positionFor(node)
            const appear = nodeAppearProgress(node, index)
            const ratio = index % 5 === 0 ? "wide" : index % 7 === 0 ? "tall" : "square"
            return (
              <span
                key={node.id}
                className="home-map-node-anchor"
                style={{
                  left: position.x,
                  top: position.y,
                  opacity: appear,
                  "--node-scale": 0.72 + 0.28 * appear,
                }}
              >
                <button
                  type="button"
                  className="home-map-node"
                  data-node-id={node.id}
                  data-tone={node.tone}
                  data-ratio={ratio}
                  data-art-kind={MOLECULE_ART_IDS.has(node.id) ? "molecule" : "editorial"}
                  aria-label={node.title}
                  title={node.title}
                  style={{
                    "--node-delay": `${(index % 9) * -0.61}s`,
                    "--node-duration": `${6.6 + (index % 5) * 0.7}s`,
                    "--node-drift-x": `${index % 2 === 0 ? 8 : -7}px`,
                    "--node-drift-y": `${index % 3 === 0 ? -9 : 7}px`,
                  }}
                  onPointerDown={event => event.stopPropagation()}
                  onClick={event => openSelection(node.id, event)}
                  tabIndex={bloomDone ? 0 : -1}
                >
                  <img src={ART[node.id]} alt="" aria-hidden="true" />
                </button>
              </span>
            )
          })}
        </div>

        <div
          className="home-map-intro"
          style={{
            opacity: 1 - clamp(bloomProgress / 0.12, 0, 1),
            visibility: bloomProgress > 0.115 ? "hidden" : "visible",
          }}
        >
          <p>{zh ? "材料研究中的困难问题，需要透明、可追溯且能够继续验证的答案。让结构、来源、任务条件与证据在同一张图谱中展开。" : "Hard questions in materials research deserve transparent, traceable, and testable answers. Let structures, sources, task conditions, and evidence unfold in one atlas."}</p>
          <button type="button" onClick={startBloom}>
            <span>{zh ? "展开研究图谱" : "Open the research atlas"}</span>
            <ArrowRight aria-hidden="true" size={16} weight="bold" />
          </button>
        </div>

        <button
          type="button"
          className="home-map-scroll-hint"
          onClick={startBloom}
          style={{ opacity: 1 - clamp(bloomProgress / 0.08, 0, 1), visibility: bloomProgress > 0.075 ? "hidden" : "visible" }}
        >
          <span>{zh ? "滚动展开" : "Scroll"}</span>
          <ArrowDown aria-hidden="true" size={15} weight="bold" />
        </button>

        <p className="home-map-click-hint" data-visible={bloomDone ? "true" : "false"}>{zh ? "点击图像查看证据" : "Click an image to inspect evidence"}</p>
        <div className="home-map-controls" data-visible={bloomDone ? "true" : "false"} role="group" aria-label={zh ? "地图视图控制" : "Map view controls"} onPointerDown={event => event.stopPropagation()}>
          <span>{zh ? "缩放" : "Zoom"}</span>
          <button type="button" onClick={() => zoomBy(1.25)} aria-label={zh ? "放大地图" : "Zoom in"} title={zh ? "放大" : "Zoom in"} disabled={!bloomDone || view.scale >= maxScale - 0.001}>
            <Plus aria-hidden="true" size={18} weight="bold" />
          </button>
          <button type="button" onClick={() => zoomBy(0.8)} aria-label={zh ? "缩小地图" : "Zoom out"} title={zh ? "缩小" : "Zoom out"} disabled={!bloomDone || view.scale <= minScale + 0.001}>
            <Minus aria-hidden="true" size={18} weight="bold" />
          </button>
          <button type="button" onClick={replayBloom} aria-label={zh ? "重播展开动画" : "Replay expansion"} title={zh ? "重播" : "Replay"} disabled={!bloomDone}>
            <Crosshair aria-hidden="true" size={18} weight="bold" />
          </button>
        </div>
      </div>

      {selected && selectedCluster ? (
        <div className="home-map-expansion-layer" onPointerDown={event => event.stopPropagation()}>
          <section
            className="home-map-expansion"
            data-phase={expansionPhase}
            data-branch={selectedCluster.id}
            role="region"
            aria-labelledby="home-map-expansion-title"
            style={{
              "--expand-origin-x": `${expansionOrigin.x}px`,
              "--expand-origin-y": `${expansionOrigin.y}px`,
            }}
          >
            <header className="home-map-expansion-header">
              <div>
                <span>{zh ? "研究分支 / 证据预览" : "RESEARCH BRANCH / EVIDENCE PREVIEW"}</span>
                <h2 id="home-map-expansion-title">{selectedCluster.title}</h2>
              </div>
              <button ref={closeRef} type="button" className="home-map-expansion-close" onClick={closeSelection} aria-label={zh ? "收起研究分支" : "Collapse research branch"} title={zh ? "收起" : "Collapse"}>
                <X aria-hidden="true" size={18} weight="bold" />
              </button>
            </header>
            <BranchEvidencePreview
              cluster={selectedCluster}
              selected={selected}
              summary={summary}
              gasParetoCount={gasParetoCount}
              zh={zh}
            />
            <footer className="home-map-expansion-footer">
              <p>
                <span>{zh ? "来源" : "SOURCE"}</span>
                <strong>{selected.source || selectedCluster.source}</strong>
              </p>
              <div>
                <button type="button" className="home-map-expansion-secondary" onClick={continueSelected}>
                  <span>{zh ? "沿本页继续阅读" : "Continue on this page"}</span>
                  <ArrowDown aria-hidden="true" size={17} weight="bold" />
                </button>
                <button type="button" className="home-map-expansion-primary" onClick={enterSelected}>
                  <span>{zh ? "进入完整工作区" : "Open full workspace"}</span>
                  <ArrowRight aria-hidden="true" size={17} weight="bold" />
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  )
}
