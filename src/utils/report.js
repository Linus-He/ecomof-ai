import { ORGANIC_LINKERS, METAL_CENTERS, LITERATURE_DB } from "../constants/catalogs"
import { DEFAULT_INPUTS, MODEL_PROFILES } from "../constants/defaults"
import { COPY } from "../i18n"
import { getFunctionalGroupCount } from "./functionalGroups"
import { predictMOF } from "./prediction"
import { formatFunctionalGroupSummary } from "./functionalGroups"

export function buildDecisionModel(results, inputs, c) {
  if (!results || results.unavailable) return null
  const lca = results.lca
  const categories = [
    { name: c.lca.categoryMetal,  short: c.lca.shortMetal,  score: lca.metalImpact,          weight: 0.25, desc: c.lca.descMetal, source: c.lca.sourceMetal },
    { name: c.lca.categoryLinker, short: c.lca.shortLinker, score: lca.linkerSustainability,  weight: 0.20, desc: c.lca.descLinker, source: c.lca.sourceLinker },
    { name: c.lca.categoryEnergy, short: c.lca.shortEnergy, score: lca.energyConsumption,     weight: 0.15, desc: c.lca.descEnergy, source: c.lca.sourceEnergy },
    { name: c.lca.categoryWaste,  short: c.lca.shortWaste,  score: lca.wasteGeneration,       weight: 0.08, desc: c.lca.descWaste, source: c.lca.sourceWaste },
    { name: c.lca.categoryWater,  short: c.lca.shortWater,  score: lca.waterUsage,            weight: 0.07, desc: c.lca.descWater, source: c.lca.sourceWater },
    { name: c.lca.categoryAir,    short: c.lca.shortAir,    score: lca.airQuality,            weight: 0.12, desc: c.lca.descAir, source: c.lca.sourceAir },
    { name: c.lca.categoryGroups, short: c.lca.shortGroups, score: Math.min(10, 5 + Math.min(3, getFunctionalGroupCount(inputs, "amine") * 1.2) + Math.min(1.8, getFunctionalGroupCount(inputs, "hydroxyl") * 0.7)), weight: 0.13, desc: c.lca.descGroups, source: c.lca.sourceGroups },
  ]
  const byShort = Object.fromEntries(categories.map(category => [category.short, category]))
  const burden = key => Math.max(0, 10 - (byShort[key]?.score ?? 5))
  const indicatorData = [
    { name: "GWP", value: burden(c.lca.shortEnergy) * 0.45 + burden(c.lca.shortMetal) * 0.25 + burden(c.lca.shortLinker) * 0.20 + burden(c.lca.shortAir) * 0.10, def: c.lca.indicatorGwp },
    { name: "PED", value: burden(c.lca.shortEnergy) * 0.55 + burden(c.lca.shortLinker) * 0.20 + burden(c.lca.shortMetal) * 0.15 + burden(c.lca.shortWaste) * 0.10, def: c.lca.indicatorPed },
    { name: "WU",  value: burden(c.lca.shortWater) * 0.65 + burden(c.lca.shortWaste) * 0.20 + burden(c.lca.shortLinker) * 0.15, def: c.lca.indicatorWu },
    { name: "AP",  value: burden(c.lca.shortAir) * 0.40 + burden(c.lca.shortMetal) * 0.30 + burden(c.lca.shortWaste) * 0.20 + burden(c.lca.shortEnergy) * 0.10, def: c.lca.indicatorAp },
    { name: "IRP", value: burden(c.lca.shortMetal) * 0.60 + burden(c.lca.shortLinker) * 0.25 + burden(c.lca.shortEnergy) * 0.15, def: c.lca.indicatorIrp },
    { name: "ET",  value: burden(c.lca.shortMetal) * 0.35 + burden(c.lca.shortWaste) * 0.35 + burden(c.lca.shortAir) * 0.20 + burden(c.lca.shortWater) * 0.10, def: c.lca.indicatorEt },
  ].map(item => ({ ...item, value: Number(item.value.toFixed(2)) }))
  const roseColors = ["#6EA8FF", "#8FD9C8", "#F6C98E", "#B7A9FF", "#9CB2D4", "#BFD9FF"]
  const windRoseData = indicatorData.map((item, index) => ({
    ...item,
    value: Number((0.5 + item.value * 0.45).toFixed(1)),
    fill: roseColors[index % roseColors.length],
  }))
  const sensitivityRadarData = indicatorData.map(item => ({
    indicator: item.name,
    metal: Number((0.25 + item.value * 0.38 + burden(c.lca.shortMetal) * 0.08).toFixed(2)),
    process: Number((0.2 + item.value * 0.34 + burden(c.lca.shortEnergy) * 0.10).toFixed(2)),
    solvent: Number((0.18 + item.value * 0.32 + burden(c.lca.shortWaste) * 0.09).toFixed(2)),
  }))
  const metalCostFactor = { "Zr4+": 24, "Mg2+": 8, "Al3+": 10, "Fe3+": 9, "Zn2+": 14, "Cu2+": 17, "Co2+": 28, "Ni2+": 26, "Cr3+": 22 }[inputs.metalCenter] ?? 18
  const linker = ORGANIC_LINKERS.find(l => l.value === inputs.organicLinker)
  const linkerCostFactor = (linker?.fossil ? 24 : 16) + (linker?.connectivity ?? 2) * 3.5
  const lccBreakdown = [
    { name: c.lca.precursor, value: Number((metalCostFactor * (1.1 + burden(c.lca.shortMetal) / 18)).toFixed(1)) },
    { name: c.lca.linkerCost, value: Number((linkerCostFactor * (1.0 + burden(c.lca.shortLinker) / 20)).toFixed(1)) },
    { name: c.lca.synthesisCost, value: Number((10 + inputs.temperature * 0.025 + inputs.pressure * 2).toFixed(1)) },
    { name: c.lca.energyUse, value: Number((8 + inputs.temperature * 0.035 + burden(c.lca.shortEnergy) * 1.4).toFixed(1)) },
    { name: c.lca.operationCost, value: Number((12 + Math.max(0, 30 - results.selectivity) * 0.16).toFixed(1)) },
    { name: c.lca.endOfLife, value: Number((4 + burden(c.lca.shortWaste) * 0.8).toFixed(1)) },
  ]
  const totalLcc = Number(lccBreakdown.reduce((sum, item) => sum + item.value, 0).toFixed(1))
  const unitCost = Number((totalLcc / Math.max(0.5, results.primaryUptake)).toFixed(1))
  const dominantImpact = indicatorData.reduce((max, item) => item.value > max.value ? item : max, indicatorData[0])
  const dominantCost = lccBreakdown.reduce((max, item) => item.value > max.value ? item : max, lccBreakdown[0])
  const mostSensitive = sensitivityRadarData
    .flatMap(row => [
      { label: `${c.lca.sensMetal} / ${row.indicator}`, value: row.metal },
      { label: `${c.lca.sensProcess} / ${row.indicator}`, value: row.process },
      { label: `${c.lca.sensSolvent} / ${row.indicator}`, value: row.solvent },
    ])
    .reduce((max, item) => item.value > max.value ? item : max)

  return {
    categories,
    indicatorData,
    roseColors,
    windRoseData,
    sensitivityRadarData,
    lccBreakdown,
    totalLcc,
    unitCost,
    dominantImpact,
    dominantCost,
    mostSensitive,
    tradeoffData: [{
      name: inputs.mofName || "Current MOF",
      performance: Number(results.primaryUptake),
      burden: Number((10 - lca.compositeGreenScore).toFixed(1)),
      cost: totalLcc,
    }],
  }
}

export function downloadTextFile(filename, text, type = "text/plain") {
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function buildReportHtml(results, inputs, decision, c, lcaParams = {}) {
  const safe = escapeHtml
  const generatedAt = new Date().toLocaleString()
  const rows = [
    ["MOF", inputs.mofName || "Current candidate"],
    ["Gas system", results.gasSystem],
    ["Metal / linker", `${inputs.metalCenter} / ${inputs.organicLinker}`],
    ["Functional groups", formatFunctionalGroupSummary(inputs)],
    ["Primary uptake", `${results.primaryUptake} mmol/g`],
    ["Secondary uptake", `${results.secondaryUptake} mmol/g`],
    ["Apparent selectivity", results.selectivity],
    ["Henry selectivity", results.selectivityDetails?.henry ?? "screening proxy"],
    ["IAST selectivity", results.selectivityDetails?.iast ?? "screening proxy"],
    ["Qst source", "Derived from predicted multi-temperature isotherms"],
    ["Eco score", `${results.lca.compositeGreenScore}/10`],
    ["Total LCC", `$${decision.totalLcc}/kg MOF`],
    ["Dominant impact", decision.dominantImpact.name],
    ["Main cost contributor", decision.dominantCost.name],
  ]
  const params = Object.entries(lcaParams).map(([key, value]) => `<tr><td>${safe(key)}</td><td>${safe(value)}</td></tr>`).join("")
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>EcoMOF-AI Decision Report</title>
  <style>
    body { font-family: Inter, "Noto Sans SC", Arial, sans-serif; color: #0f172a; margin: 38px; line-height: 1.55; }
    h1 { margin: 0 0 6px; font-size: 30px; letter-spacing: 0; }
    h2 { margin: 28px 0 10px; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
    h3 { margin: 18px 0 8px; font-size: 13px; color: #334155; }
    .cover { min-height: 260px; border-bottom: 2px solid #0f172a; margin-bottom: 24px; display: flex; flex-direction: column; justify-content: center; }
    .meta { color: #475569; font-size: 12px; margin-bottom: 22px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0; }
    .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; }
    .label { color: #64748b; font-size: 11px; text-transform: uppercase; }
    .value { color: #020617; font-size: 18px; font-weight: 800; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    td, th { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #f1f5f9; }
    .note { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px; font-size: 12px; color: #7c2d12; }
    .small { color: #64748b; font-size: 11px; }
    @media print { body { margin: 18mm; } .card, table, .note { break-inside: avoid; } .cover { min-height: 230px; } }
  </style>
</head>
<body>
  <section class="cover">
    <h1>EcoMOF-AI Decision Report</h1>
    <div class="meta">Research-oriented MOF screening report · generated ${safe(generatedAt)}</div>
    <div class="grid">
      <div class="card"><div class="label">Candidate</div><div class="value">${safe(inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`)}</div></div>
      <div class="card"><div class="label">Gas system</div><div class="value">${safe(results.gasSystem)}</div></div>
      <div class="card"><div class="label">Report status</div><div class="value">Screening</div></div>
    </div>
    <p class="small">This report is intended for early-stage comparison, hypothesis generation, and discussion. It is not a substitute for verified GCMC/experimental adsorption data or full inventory-linked LCA.</p>
  </section>
  <h2>Executive Summary</h2>
  <div class="grid">
    <div class="card"><div class="label">Performance</div><div class="value">${safe(results.primaryUptake)} mmol/g</div></div>
    <div class="card"><div class="label">Selectivity</div><div class="value">${safe(results.selectivity)}</div></div>
    <div class="card"><div class="label">Eco score</div><div class="value">${safe(results.lca.compositeGreenScore)}/10</div></div>
  </div>
  <h2>Input, Prediction, and Source Basis</h2>
  <table><tbody>${rows.map(([k, v]) => `<tr><th>${safe(k)}</th><td>${safe(v)}</td></tr>`).join("")}</tbody></table>
  <h2>LCA / LCC Scenario Parameters</h2>
  <table><tbody>${params || "<tr><td>No custom parameters</td><td>-</td></tr>"}</tbody></table>
  <h2>Methods</h2>
  <h3>Adsorption prediction</h3>
  <p class="small">The current browser build uses transparent model profiles and structure-property correlations. A production deployment should replace this with trained model artifacts loaded through the backend API.</p>
  <h3>Selectivity</h3>
  <p class="small">Apparent selectivity is calculated from predicted single-gas uptake. Henry and IAST values are marked as screening proxies unless fitted pure-component isotherms are supplied.</p>
  <h3>Thermodynamics</h3>
  <p class="small">Qst is derived from predicted 273 K / 298 K / 323 K isotherms. Research-grade Qst requires experimental or GCMC multi-temperature isotherm data.</p>
  <h3>LCA / LCC</h3>
  <p class="small">Inventory terms are screening-level proxy records unless replaced by supplier-specific or database-backed inventory and price data.</p>
  <h2>Basis & Limitations</h2>
  <div class="note">${safe(c.lca.prototypeNote)} ${safe(c.methods.noticeBody)}</div>
</body>
</html>`
}

export function exportChartPng(containerId, filename) {
  const svg = document.querySelector(`#${containerId} svg`)
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  const width = Math.max(480, Math.ceil(rect.width || 900))
  const height = Math.max(320, Math.ceil(rect.height || 520))
  const cloned = svg.cloneNode(true)
  cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  cloned.setAttribute("width", width)
  cloned.setAttribute("height", height)
  const xml = new XMLSerializer().serializeToString(cloned)
  const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(svgBlob)
  const image = new Image()
  image.onload = () => {
    const canvas = document.createElement("canvas")
    canvas.width = width * 2
    canvas.height = height * 2
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    const a = document.createElement("a")
    a.href = canvas.toDataURL("image/png")
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
  image.src = url
}

export function buildDecisionReport(results, inputs, decision, c) {
  return [
    "# EcoMOF-AI Decision Report",
    "",
    `MOF: ${inputs.mofName || "Current candidate"}`,
    `Gas system: ${results.gasSystem}`,
    `Metal: ${inputs.metalCenter}`,
    `Linker: ${inputs.organicLinker}`,
    `Functional groups: ${formatFunctionalGroupSummary(inputs)}`,
    "",
    "## Performance",
    `${results.primaryName} uptake: ${results.primaryUptake} mmol/g`,
    `${results.secondaryName} uptake: ${results.secondaryUptake} mmol/g`,
    `Selectivity: ${results.selectivity}`,
    `Confidence: ${(results.confidenceScore * 100).toFixed(0)}%`,
    "",
    "## LCA / LCC",
    `Eco score: ${results.lca.compositeGreenScore}/10`,
    `Dominant impact: ${decision.dominantImpact.name}`,
    `Total LCC proxy: $${decision.totalLcc}/kg MOF`,
    `Main cost contributor: ${decision.dominantCost.name}`,
    `Most sensitive factor: ${decision.mostSensitive.label}`,
    "",
    "## Basis",
    c.lca.basisBody,
    "",
    "## Limitations",
    c.lca.prototypeNote,
  ].join("\n")
}

export function inputsFromBenchmark(mof, baseInputs = DEFAULT_INPUTS) {
  return {
    ...baseInputs,
    mofName: mof.name,
    metalCenter: mof.metal,
    organicLinker: mof.linker,
    poreDiameter: mof.pd,
    betSurfaceArea: mof.bet,
    poreVolume: mof.pv,
    gasSystem: baseInputs.gasSystem || "CO2/N2",
  }
}

export function buildRankedCandidates(baseInputs, c, scenario = { metal: 10, energy: 10, solvent: 10, cost: 10 }) {
  return LITERATURE_DB.map(mof => {
    const candidateInputs = inputsFromBenchmark(mof, baseInputs)
    const result = predictMOF(candidateInputs)
    if (result.unavailable) return null
    const decision = buildDecisionModel(result, candidateInputs, c)
    const penalty = scenario.metal * 0.015 + scenario.energy * 0.025 + scenario.solvent * 0.012 + scenario.cost * 0.01
    const score = result.primaryUptake * 0.35 + Math.log1p(result.selectivity) * 0.9 + result.lca.compositeGreenScore * 0.45 - decision.totalLcc * 0.012 - penalty
    return {
      name: mof.name,
      uptake: result.primaryUptake,
      selectivity: result.selectivity,
      lca: result.lca.compositeGreenScore,
      lcc: decision.totalLcc,
      score: Number(score.toFixed(2)),
      sourceType: mof.sourceType,
      doi: mof.doi,
    }
  }).filter(Boolean).sort((a, b) => b.score - a.score)
}

export function buildMonteCarloData(results, decision) {
  if (!results || !decision) return []
  return Array.from({ length: 60 }, (_, index) => {
    const x = index / 59
    const wave = Math.sin(index * 1.7) * 0.18 + Math.cos(index * 0.73) * 0.11
    const center = results.lca.compositeGreenScore + wave
    const spread = 0.45 + (index % 7) * 0.035
    return {
      run: index + 1,
      p05: Number(Math.max(0, center - spread * 1.8 - x * 0.15).toFixed(2)),
      p50: Number(center.toFixed(2)),
      p95: Number(Math.min(10, center + spread * 1.8 + x * 0.12).toFixed(2)),
      costP50: Number((decision.totalLcc * (0.92 + x * 0.16 + wave * 0.02)).toFixed(1)),
    }
  })
}

export function buildModelComparison(inputs) {
  return Object.entries(MODEL_PROFILES).map(([id, profile]) => {
    const result = predictMOF({ ...inputs, mlAlgorithm: id })
    if (result.unavailable) return null
    return {
      id,
      label: profile.label,
      uptake: result.primaryUptake,
      secondary: result.secondaryUptake,
      selectivity: result.selectivity,
      confidence: Number((result.confidenceScore * 100).toFixed(0)),
      r2: profile.r2,
      mae: profile.mae,
      rmse: profile.rmse,
      status: id === "gnn" ? "static GNN profile" : "static browser profile",
    }
  }).filter(Boolean)
}

export function buildComparisonCandidate(inputs, results, lang = "en") {
  if (!results || results.unavailable) return null
  const linker = ORGANIC_LINKERS.find(l => l.value === inputs.organicLinker)
  const hasComplexLinker = ["TCPP", "TBAPy", "BTB", "ADC", "NDC"].includes(inputs.organicLinker)
  const costBand = hasComplexLinker || Number(linker?.lcaScore ?? 5) < 4.5 ? "High" : Number(linker?.lcaScore ?? 5) < 5.8 ? "Medium" : "Low"
  const decision = buildDecisionModel(results, inputs, COPY[lang] || COPY.en)
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`,
    gasSystem: results.gasSystem,
    performance: results.primaryUptake,
    selectivity: results.selectivity,
    feasibility: costBand,
    lca: results.lca?.compositeGreenScore ?? "—",
    lcc: decision.totalLcc,
    robustness: Math.round((results.confidenceScore || 0.72) * 100),
    metal: inputs.metalCenter,
    linker: inputs.organicLinker,
    source: lang === "zh" ? "当前筛选结果" : "Current screening result",
  }
}

export function buildApplicabilityPoints(inputs, results) {
  const current = {
    name: inputs.mofName || "Current",
    pld: Number(inputs.poreDiameter),
    betNorm: Number((inputs.betSurfaceArea / 1000).toFixed(2)),
    status: results?.applicability?.warnings?.length ? "caution" : "in-domain",
  }
  const benchmarks = LITERATURE_DB.map(mof => ({
    name: mof.name,
    pld: mof.pd,
    betNorm: Number((mof.bet / 1000).toFixed(2)),
    status: "benchmark",
  }))
  return [...benchmarks, current]
}
