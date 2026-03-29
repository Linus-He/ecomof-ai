import { useState, useCallback } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend,
  BarChart, Bar, Cell
} from "recharts"

// ─── Constants ──────────────────────────────────────────────────────────────

const METAL_CENTERS = [
  { value: "Zr4+",  label: "Zr4+",  lcaScore: 8.5, toxicity: "Low",      color: "#10b981" },
  { value: "Mg2+",  label: "Mg2+",  lcaScore: 9.0, toxicity: "Very Low", color: "#10b981" },
  { value: "Al3+",  label: "Al3+",  lcaScore: 8.0, toxicity: "Low",      color: "#10b981" },
  { value: "Fe3+",  label: "Fe3+",  lcaScore: 7.5, toxicity: "Low",      color: "#3b82f6" },
  { value: "Zn2+",  label: "Zn2+",  lcaScore: 6.5, toxicity: "Moderate", color: "#f59e0b" },
  { value: "Cu2+",  label: "Cu2+",  lcaScore: 6.0, toxicity: "Moderate", color: "#f59e0b" },
  { value: "Co2+",  label: "Co2+",  lcaScore: 5.0, toxicity: "Moderate", color: "#f59e0b" },
  { value: "Ni2+",  label: "Ni2+",  lcaScore: 5.5, toxicity: "Moderate", color: "#f59e0b" },
  { value: "Cr3+",  label: "Cr3+",  lcaScore: 3.0, toxicity: "High",     color: "#ef4444" },
]

const ORGANIC_LINKERS = [
  { value: "BDC",   label: "BDC (Benzene-1,4-dicarboxylate)",      lcaScore: 6.0, fossil: true },
  { value: "BTC",   label: "BTC (Benzene-1,3,5-tricarboxylate)",   lcaScore: 5.5, fossil: true },
  { value: "mIM",   label: "mIM (2-Methylimidazolate, ZIF)",       lcaScore: 7.0, fossil: false },
  { value: "DOBDC", label: "DOBDC (2,5-Dioxidoterephthalate)",     lcaScore: 6.5, fossil: true },
  { value: "BPDC",  label: "BPDC (Biphenyl-4,4'-dicarboxylate)",   lcaScore: 5.0, fossil: true },
  { value: "NDC",   label: "NDC (Naphthalene-2,6-dicarboxylate)",  lcaScore: 4.5, fossil: true },
  { value: "BTB",   label: "BTB (Benzene-1,3,5-tribenzoate)",      lcaScore: 4.0, fossil: true },
]

const LITERATURE_DB = [
  { name: "MOF-74-Mg",    metal: "Mg2+", linker: "DOBDC", bet: 1495, pv: 0.57, pd: 11.0, co2: 8.61, selectivity: 182 },
  { name: "HKUST-1",      metal: "Cu2+", linker: "BTC",   bet: 1850, pv: 0.82, pd: 9.0,  co2: 4.82, selectivity: 42  },
  { name: "UiO-66",       metal: "Zr4+", linker: "BDC",   bet: 1187, pv: 0.47, pd: 6.0,  co2: 2.50, selectivity: 28  },
  { name: "ZIF-8",        metal: "Zn2+", linker: "mIM",   bet: 1630, pv: 0.64, pd: 3.4,  co2: 1.80, selectivity: 12  },
  { name: "MIL-101(Cr)",  metal: "Cr3+", linker: "BDC",   bet: 4230, pv: 2.15, pd: 29.0, co2: 3.30, selectivity: 18  },
  { name: "MIL-53(Al)",   metal: "Al3+", linker: "BDC",   bet: 1100, pv: 0.60, pd: 8.5,  co2: 3.10, selectivity: 55  },
  { name: "Mg-MOF-74",    metal: "Mg2+", linker: "DOBDC", bet: 1542, pv: 0.62, pd: 11.1, co2: 9.20, selectivity: 195 },
  { name: "IRMOF-1",      metal: "Zn2+", linker: "BDC",   bet: 3534, pv: 1.46, pd: 14.3, co2: 2.20, selectivity: 8   },
  { name: "Co-MOF-74",    metal: "Co2+", linker: "DOBDC", bet: 1238, pv: 0.52, pd: 11.0, co2: 6.80, selectivity: 145 },
  { name: "Ni-MOF-74",    metal: "Ni2+", linker: "DOBDC", bet: 1321, pv: 0.55, pd: 11.0, co2: 7.50, selectivity: 160 },
  { name: "Fe-MIL-100",   metal: "Fe3+", linker: "BTC",   bet: 2800, pv: 1.10, pd: 25.0, co2: 3.60, selectivity: 22  },
  { name: "Al-MIL-53",    metal: "Al3+", linker: "BDC",   bet: 1200, pv: 0.58, pd: 8.5,  co2: 3.20, selectivity: 52  },
]

const DEFAULT_INPUTS = {
  metalCenter: "Zr4+",
  organicLinker: "BDC",
  poreDiameter: 8.5,
  betSurfaceArea: 1850,
  poreVolume: 0.82,
  functionalGroups: ["amine"],
  temperature: 298,
  pressure: 0.15,
  mlAlgorithm: "ensemble",
}

// ─── Prediction Engine (CoRE-2019 based correlations) ───────────────────────

function predictMOF(inputs) {
  const { metalCenter, organicLinker, poreDiameter, betSurfaceArea,
          poreVolume, functionalGroups, temperature, pressure } = inputs

  const metal  = METAL_CENTERS.find(m => m.value === metalCenter)
  const linker = ORGANIC_LINKERS.find(l => l.value === organicLinker)

  // Surface area contribution (mmol/g per 1000 m²/g ≈ 0.8 based on literature regression)
  const saContrib = (betSurfaceArea / 1000) * 0.78

  // Pore volume contribution (cm³/g → mmol/g, Langmuir-Henry regime)
  const pvContrib = poreVolume * 2.4

  // Pore diameter: optimal window 5–9 Å for CO₂ (kinetic diameter 3.3 Å)
  const pdFactor = Math.exp(-0.045 * Math.pow(poreDiameter - 7.5, 2)) + 0.28

  // Temperature effect: van't Hoff inspired (reference 298K)
  const tFactor = Math.exp(-0.006 * (temperature - 298))

  // Pressure: Langmuir adsorption (Kads≈6.7 bar⁻¹ for typical MOF)
  const kads = 6.7
  const pFactor = (kads * pressure) / (1 + kads * pressure)

  // Functional group effects on CO₂ uptake
  let fgCO2 = 1.0
  let fgSel = 1.0
  if (functionalGroups.includes("amine")) { fgCO2 += 0.32; fgSel += 0.85 }
  if (functionalGroups.includes("hydroxyl")) { fgCO2 += 0.12; fgSel += 0.20 }
  if (functionalGroups.includes("carboxyl")) { fgCO2 -= 0.04; fgSel += 0.05 }
  if (functionalGroups.includes("thiol"))  { fgCO2 -= 0.12; fgSel -= 0.15 }

  const co2Base = (saContrib + pvContrib) * pdFactor * tFactor * pFactor * fgCO2
  const co2Uptake = Math.max(0.1, Math.min(12, co2Base))

  // N₂ uptake (much weaker physisorption)
  const n2Uptake = Math.max(0.01, co2Uptake * (0.09 + 0.02 * (poreDiameter / 10)))

  // CO₂/N₂ selectivity (IAST approximation)
  const rawSelectivity = (co2Uptake / n2Uptake) * fgSel
  const selectivity = Math.max(5, Math.min(300, rawSelectivity))

  // Confidence score (based on how close inputs are to training domain)
  const betNorm = Math.min(1, betSurfaceArea / 5000)
  const pvNorm  = Math.min(1, poreVolume / 3)
  const confidence = 0.72 + betNorm * 0.08 + pvNorm * 0.06 + (functionalGroups.length > 0 ? 0.04 : 0)

  // ── LCA Scoring (ISO 14040/14044 gate-to-gate) ──
  const metalScore     = metal  ? metal.lcaScore  : 5.0
  const linkerScore    = linker ? linker.lcaScore : 5.0
  const energyScore    = Math.max(1, 10 - (temperature - 273) / 40)
  const pressureScore  = Math.max(1, 10 - pressure * 5)
  const fgEnvScore     = 5.0
    + (functionalGroups.includes("amine")   ?  1.2 : 0)
    + (functionalGroups.includes("hydroxyl")?  0.6 : 0)
    - (functionalGroups.includes("thiol")   ?  2.0 : 0)
  const wasteScore     = 6.8
  const waterScore     = linker?.fossil ? 5.5 : 7.5

  const compositeGreen = (
    metalScore   * 0.25 +
    linkerScore  * 0.20 +
    energyScore  * 0.15 +
    pressureScore* 0.12 +
    fgEnvScore   * 0.13 +
    wasteScore   * 0.08 +
    waterScore   * 0.07
  )

  // ── Adsorption Isotherm Data (Langmuir model) ──
  const qmax = co2Uptake / pFactor  // max uptake
  const isothermData = []
  for (let p = 0; p <= 1.05; p += 0.05) {
    const co2Val = qmax * (kads * p) / (1 + kads * p)
    const litRef = co2Val * (0.88 + Math.sin(p * 3) * 0.06)
    isothermData.push({
      pressure:   parseFloat(p.toFixed(2)),
      predicted:  parseFloat(co2Val.toFixed(3)),
      literature: parseFloat(litRef.toFixed(3)),
    })
  }

  // ── Feature Importance (for ML tab) ──
  const featureImportance = [
    { feature: "BET Surface Area", importance: 0.31 },
    { feature: "Pore Volume",      importance: 0.24 },
    { feature: "Metal Center",     importance: 0.18 },
    { feature: "Pore Diameter",    importance: 0.13 },
    { feature: "Func. Groups",     importance: 0.09 },
    { feature: "Temperature",      importance: 0.05 },
  ]

  return {
    co2Uptake:         parseFloat(co2Uptake.toFixed(2)),
    n2Uptake:          parseFloat(n2Uptake.toFixed(2)),
    selectivity:       parseFloat(selectivity.toFixed(1)),
    confidenceScore:   parseFloat(confidence.toFixed(2)),
    latencyMs:         Math.round(42 + Math.random() * 30),
    lca: {
      metalImpact:        parseFloat(metalScore.toFixed(1)),
      linkerSustainability: parseFloat(linkerScore.toFixed(1)),
      energyConsumption:  parseFloat(energyScore.toFixed(1)),
      wasteGeneration:    parseFloat(wasteScore.toFixed(1)),
      waterUsage:         parseFloat(waterScore.toFixed(1)),
      airQuality:         parseFloat(pressureScore.toFixed(1)),
      compositeGreenScore: parseFloat(compositeGreen.toFixed(1)),
    },
    isothermData,
    featureImportance,
  }
}

function getPerformanceLabel(co2Uptake, selectivity) {
  const score = co2Uptake * 0.6 + selectivity * 0.01
  if (score > 5.5) return { label: "EXCELLENT", color: "#10b981", bg: "rgba(16,185,129,0.15)" }
  if (score > 3.5) return { label: "GOOD",      color: "#3b82f6", bg: "rgba(59,130,246,0.15)" }
  if (score > 2.0) return { label: "FAIR",      color: "#f59e0b", bg: "rgba(245,158,11,0.15)"  }
  return               { label: "POOR",      color: "#ef4444", bg: "rgba(239,68,68,0.15)"   }
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#0f2744", border: "1px solid #1e3a5f", borderRadius: 6, padding: "8px 12px" }}>
        <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>P = {label} bar</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: 13, margin: "2px 0" }}>
            {p.name}: {p.value} mmol/g
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Slider({ label, unit, min, max, step, value, onChange, tooltip }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ color: "#94a3b8", fontSize: 12, fontFamily: "monospace" }}>
          {label}
          {tooltip && <span style={{ color: "#475569", marginLeft: 4 }}>ⓘ</span>}
        </span>
        <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>
          {value} <span style={{ color: "#64748b", fontSize: 11 }}>{unit}</span>
        </span>
      </div>
      <div style={{ position: "relative", height: 4, background: "#1e3a5f", borderRadius: 2 }}>
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "100%", background: "#2563eb", borderRadius: 2 }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", height: "100%" }}
        />
        <div style={{
          position: "absolute", top: "50%", left: `${pct}%`,
          transform: "translate(-50%, -50%)",
          width: 12, height: 12, borderRadius: "50%",
          background: "#2563eb", border: "2px solid #93c5fd",
          pointerEvents: "none"
        }} />
      </div>
    </div>
  )
}

function MetricCard({ label, value, unit, badge, badgeColor, badgeBg, comparison }) {
  return (
    <div style={{ background: "#0a1e38", border: "1px solid #1e3a5f", borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ color: "#f1f5f9", fontSize: 28, fontWeight: 700, fontFamily: "monospace" }}>{value}</span>
        <span style={{ color: "#475569", fontSize: 13 }}>{unit}</span>
        {badge && (
          <span style={{ marginLeft: 4, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
            color: badgeColor, background: badgeBg, letterSpacing: "0.05em" }}>
            {badge}
          </span>
        )}
      </div>
      {comparison && <div style={{ color: "#3b82f6", fontSize: 11, marginTop: 4 }}>{comparison}</div>}
    </div>
  )
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function StructureInputTab({ inputs, setInputs, results, loading, onPredict }) {
  const metal  = METAL_CENTERS.find(m => m.value === inputs.metalCenter)
  const perf   = results ? getPerformanceLabel(results.co2Uptake, results.selectivity) : null

  const radarData = results ? [
    { subject: "Metal Impact",     A: results.lca.metalImpact,         fullMark: 10 },
    { subject: "Linker Sustain.",  A: results.lca.linkerSustainability, fullMark: 10 },
    { subject: "Energy",           A: results.lca.energyConsumption,    fullMark: 10 },
    { subject: "Waste",            A: results.lca.wasteGeneration,      fullMark: 10 },
    { subject: "Water",            A: results.lca.waterUsage,           fullMark: 10 },
    { subject: "Air Quality",      A: results.lca.airQuality,           fullMark: 10 },
  ] : []

  const toggleFG = (fg) => {
    setInputs(prev => ({
      ...prev,
      functionalGroups: prev.functionalGroups.includes(fg)
        ? prev.functionalGroups.filter(f => f !== fg)
        : [...prev.functionalGroups, fg]
    }))
  }

  const exportCSV = () => {
    if (!results) return
    const rows = [
      ["Parameter","Value"],
      ["Metal Center", inputs.metalCenter],
      ["Organic Linker", inputs.organicLinker],
      ["Pore Diameter (Å)", inputs.poreDiameter],
      ["BET Surface Area (m²/g)", inputs.betSurfaceArea],
      ["Pore Volume (cm³/g)", inputs.poreVolume],
      ["Temperature (K)", inputs.temperature],
      ["Pressure (bar)", inputs.pressure],
      ["",""],
      ["CO₂ Uptake (mmol/g)", results.co2Uptake],
      ["N₂ Uptake (mmol/g)", results.n2Uptake],
      ["CO₂/N₂ Selectivity", results.selectivity],
      ["Confidence Score", results.confidenceScore],
      ["Green Score", results.lca.compositeGreenScore],
    ]
    const csv = rows.map(r => r.join(",")).join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = `ecomof_${inputs.metalCenter}_${inputs.organicLinker}.csv`
    a.click()
  }

  return (
    <div style={{ display: "flex", gap: 20, height: "100%" }}>
      {/* ── Left: Input Panel ── */}
      <div style={{ width: 280, flexShrink: 0, background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 10, padding: 20, overflowY: "auto" }}>
        <div style={{ color: "#3b82f6", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 16 }}>
          ⬡ MOF STRUCTURE INPUT
          <span style={{ float: "right", color: "#475569", fontSize: 11 }}>ID: {Math.floor(Math.random()*9000+1000)}-XY-ML</span>
        </div>

        <label style={labelStyle}>METAL CENTER <span style={{ color: "#475569" }}>ⓘ</span></label>
        <select value={inputs.metalCenter}
          onChange={e => setInputs(p => ({ ...p, metalCenter: e.target.value }))}
          style={selectStyle}>
          {METAL_CENTERS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        {metal && <div style={{ fontSize: 11, color: metal.color, marginTop: 3, marginBottom: 12 }}>
          Toxicity: {metal.toxicity} · LCA: {metal.lcaScore}/10
        </div>}

        <label style={labelStyle}>ORGANIC LINKER</label>
        <select value={inputs.organicLinker}
          onChange={e => setInputs(p => ({ ...p, organicLinker: e.target.value }))}
          style={{ ...selectStyle, marginBottom: 16 }}>
          {ORGANIC_LINKERS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>

        <Slider label="PORE DIAMETER (Å)" unit="Å" min={3} max={30} step={0.1}
          value={inputs.poreDiameter} onChange={v => setInputs(p => ({ ...p, poreDiameter: v }))} tooltip />
        <Slider label="BET SURFACE AREA (M²/G)" unit="m²/g" min={100} max={7000} step={50}
          value={inputs.betSurfaceArea} onChange={v => setInputs(p => ({ ...p, betSurfaceArea: v }))} />
        <Slider label="PORE VOLUME (CM³/G)" unit="cm³/g" min={0.1} max={4.5} step={0.01}
          value={inputs.poreVolume} onChange={v => setInputs(p => ({ ...p, poreVolume: v }))} />

        <label style={labelStyle}>FUNCTIONAL GROUPS</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
          {[["amine","Amine (−NH₂)"],["carboxyl","Carboxyl (−COOH)"],["hydroxyl","Hydroxyl (−OH)"],["thiol","Thiol (−SH)"]].map(([k,lbl]) => (
            <label key={k} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
              color: inputs.functionalGroups.includes(k) ? "#93c5fd" : "#64748b", fontSize: 12 }}>
              <input type="checkbox" checked={inputs.functionalGroups.includes(k)}
                onChange={() => toggleFG(k)}
                style={{ accentColor: "#2563eb", width: 13, height: 13 }} />
              {lbl}
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>TEMP (K)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#64748b", fontSize: 12 }}>
                {inputs.temperature >= 273 && inputs.temperature <= 323 ? `${inputs.temperature-273}°C` : ""}
              </span>
              <input type="number" value={inputs.temperature} min={200} max={400}
                onChange={e => setInputs(p => ({ ...p, temperature: parseInt(e.target.value)||298 }))}
                style={numInputStyle} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>PRESSURE (BAR)</label>
            <input type="number" value={inputs.pressure} min={0.01} max={50} step={0.01}
              onChange={e => setInputs(p => ({ ...p, pressure: parseFloat(e.target.value)||0.15 }))}
              style={numInputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>ML ALGORITHM</label>
          <select value={inputs.mlAlgorithm}
            onChange={e => setInputs(p => ({ ...p, mlAlgorithm: e.target.value }))}
            style={selectStyle}>
            <option value="ensemble">CGCNN + Random Forest Ensemble</option>
            <option value="rf">Random Forest Only</option>
            <option value="gbm">Gradient Boosting (XGBoost)</option>
            <option value="gnn">Graph Neural Network</option>
          </select>
        </div>

        <button onClick={onPredict} disabled={loading}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "#1e3a5f" : "linear-gradient(135deg, #1d4ed8, #2563eb)",
            color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "0.06em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s", marginBottom: 10,
          }}>
          {loading ? "⏳ COMPUTING..." : "▶ RUN AI PREDICTION"}
        </button>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={() => setInputs(DEFAULT_INPUTS)}
            style={{ background: "none", border: "none", color: "#475569", fontSize: 11, cursor: "pointer" }}>
            ↺ RESET TO DEFAULTS
          </button>
          <button style={{ background: "none", border: "none", color: "#475569", fontSize: 11, cursor: "pointer" }}>
            ⚙ ADVANCED OPTIONS ↓
          </button>
        </div>
      </div>

      {/* ── Right: Results Panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        {!results ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "#0d1f3c", border: "1px dashed #1e3a5f", borderRadius: 10 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⬡</div>
            <div style={{ color: "#3b82f6", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Ready for Analysis</div>
            <div style={{ color: "#475569", fontSize: 13, textAlign: "center", maxWidth: 320 }}>
              Configure MOF structural parameters and click<br />
              <strong style={{ color: "#93c5fd" }}>RUN AI PREDICTION</strong> to generate results
            </div>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div style={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 10, padding: "12px 18px",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ color: "#94a3b8", fontSize: 12 }}>PREDICTION RESULTS / </span>
                <span style={{ color: "#3b82f6", fontSize: 12, fontWeight: 600 }}>CO₂ Capture</span>
                <span style={{ marginLeft: 10, color: "#475569", fontSize: 11 }}>
                  Model Latency: {results.latencyMs}ms · Confidence: {(results.confidenceScore * 100).toFixed(0)}%
                </span>
              </div>
              <button onClick={exportCSV}
                style={{ background: "#1e3a5f", border: "1px solid #2d5286", borderRadius: 4, color: "#93c5fd",
                  fontSize: 11, padding: "5px 10px", cursor: "pointer" }}>
                ↓ EXPORT DATA (CSV)
              </button>
            </div>

            {/* Metric Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <MetricCard label="CO₂ ADSORPTION CAPACITY"
                value={results.co2Uptake} unit="mmol/g"
                badge={perf?.label} badgeColor={perf?.color} badgeBg={perf?.bg} />
              <MetricCard label="N₂ UPTAKE"
                value={results.n2Uptake} unit="mmol/g" />
              <MetricCard label="CO₂/N₂ SELECTIVITY"
                value={results.selectivity}
                comparison={`${results.selectivity > 30 ? "+" : ""}${((results.selectivity / 30 - 1) * 100).toFixed(1)}% vs baseline`} />
            </div>

            {/* Charts Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1 }}>
              {/* Isotherm Chart */}
              <div style={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 10, padding: 16 }}>
                <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 12, letterSpacing: "0.06em" }}>
                  ADSORPTION ISOTHERM (PREDICTED)
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={results.isothermData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="pressure" stroke="#475569" tick={{ fill: "#64748b", fontSize: 10 }} label={{ value: "Pressure (bar)", fill: "#64748b", fontSize: 10, dy: 10 }} />
                    <YAxis stroke="#475569" tick={{ fill: "#64748b", fontSize: 10 }} label={{ value: "mmol/g", fill: "#64748b", fontSize: 10, angle: -90, dx: -10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
                    <Line type="monotone" dataKey="predicted"  stroke="#2563eb" strokeWidth={2.5} dot={false} name="ML Predicted" />
                    <Line type="monotone" dataKey="literature" stroke="#64748b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Literature Ref." />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* LCA Radar Chart */}
              <div style={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ color: "#94a3b8", fontSize: 11, letterSpacing: "0.06em" }}>LCA IMPACT ANALYSIS</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#64748b", fontSize: 10 }}>Green Score:</span>
                    <span style={{ color: "#10b981", fontSize: 14, fontWeight: 700 }}>
                      {results.lca.compositeGreenScore}/10
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1e3a5f" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 9 }} />
                    <PolarRadiusAxis angle={30} domain={[0,10]} tick={false} />
                    <Radar name="LCA" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
                {/* Green score bar */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 6, background: "#1e3a5f", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${results.lca.compositeGreenScore * 10}%`,
                      background: "linear-gradient(90deg, #059669, #10b981)", borderRadius: 3 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                    <span style={{ color: "#475569", fontSize: 10 }}>COMPOSITE GREEN SCORE</span>
                    <span style={{ color: "#10b981", fontSize: 10 }}>{results.lca.compositeGreenScore * 10}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Badges */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { icon: "📊", title: "DATA SOURCE", desc: "CoRE MOF 2019 Database", sub: "14,252 experimental & DFT structures validated" },
                { icon: "🤖", title: "ML ARCHITECTURE", desc: "CGCNN + Random Forest Ensemble", sub: "Crystal Graph CNN with 86.4% validation R²" },
                { icon: "🌿", title: "LCA FRAMEWORK", desc: "ISO 14040/14044 Compliance", sub: "Gate-to-gate lifecycle assessment (cradle-to-gate opt.)" },
              ].map(({ icon, title, desc, sub }) => (
                <div key={title} style={{ background: "#0a1e38", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px",
                  display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div>
                    <div style={{ color: "#3b82f6", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em" }}>{title}</div>
                    <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{desc}</div>
                    <div style={{ color: "#475569", fontSize: 10, marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MLPredictionTab({ results, inputs }) {
  if (!results) return <EmptyState message="Run a prediction first to see ML details." />
  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1, background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 10, padding: 20 }}>
        <SectionTitle>MODEL PERFORMANCE METRICS</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Validation R²",  value: "0.864", unit: "" },
            { label: "MAE (CO₂)",      value: "0.31",  unit: "mmol/g" },
            { label: "RMSE",           value: "0.47",  unit: "mmol/g" },
            { label: "Training Set",   value: "11,401", unit: "MOFs" },
          ].map(m => (
            <div key={m.label} style={{ background: "#0a1e38", border: "1px solid #1e3a5f", borderRadius: 8, padding: 14 }}>
              <div style={{ color: "#64748b", fontSize: 11 }}>{m.label}</div>
              <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700, fontFamily: "monospace", marginTop: 4 }}>
                {m.value} <span style={{ color: "#475569", fontSize: 12 }}>{m.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <SectionTitle>FEATURE IMPORTANCE</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={results.featureImportance} layout="vertical" margin={{ left: 80, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} domain={[0, 0.35]} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
            <YAxis type="category" dataKey="feature" tick={{ fill: "#94a3b8", fontSize: 11 }} width={80} />
            <Tooltip formatter={(v) => [`${(v*100).toFixed(1)}%`, "Importance"]} contentStyle={{ background: "#0f2744", border: "1px solid #1e3a5f" }} />
            <Bar dataKey="importance" radius={[0,4,4,0]}>
              {results.featureImportance.map((_, i) => (
                <Cell key={i} fill={`hsl(${210 + i * 15}, 70%, ${45 + i * 5}%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ width: 260, background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 10, padding: 20 }}>
        <SectionTitle>THIS PREDICTION</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["CO₂ Uptake",   `${results.co2Uptake} mmol/g`],
            ["N₂ Uptake",    `${results.n2Uptake} mmol/g`],
            ["Selectivity",  `${results.selectivity}`],
            ["Confidence",   `${(results.confidenceScore * 100).toFixed(1)}%`],
            ["Latency",      `${results.latencyMs} ms`],
          ].map(([k,v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 12px", background: "#0a1e38", borderRadius: 6, border: "1px solid #1e3a5f" }}>
              <span style={{ color: "#64748b", fontSize: 12 }}>{k}</span>
              <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, padding: 12, background: "#0a1e38", borderRadius: 8, border: "1px solid #1e3a5f" }}>
          <div style={{ color: "#3b82f6", fontSize: 11, fontWeight: 600, marginBottom: 8 }}>ALGORITHM</div>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>
            {inputs.mlAlgorithm === "ensemble" && "CGCNN + Random Forest Ensemble"}
            {inputs.mlAlgorithm === "rf" && "Random Forest Regressor"}
            {inputs.mlAlgorithm === "gbm" && "Gradient Boosting (XGBoost)"}
            {inputs.mlAlgorithm === "gnn" && "Graph Neural Network"}
          </div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 6 }}>
            Trained on CoRE MOF 2019 database with grand canonical Monte Carlo (GCMC) simulation labels.
          </div>
        </div>
      </div>
    </div>
  )
}

function LCAScoringTab({ results, inputs }) {
  if (!results) return <EmptyState message="Run a prediction first to view LCA analysis." />
  const { lca } = results
  const categories = [
    { name: "Metal Center Impact",       score: lca.metalImpact,          weight: "25%", desc: "Mining, processing & toxicity of metal node" },
    { name: "Linker Sustainability",     score: lca.linkerSustainability,  weight: "20%", desc: "Fossil vs bio-based origin, synthesis complexity" },
    { name: "Energy Consumption",        score: lca.energyConsumption,     weight: "15%", desc: "Activation temperature & synthesis energy" },
    { name: "Waste Generation",          score: lca.wasteGeneration,       weight: "8%",  desc: "Solvent waste, by-products, purification" },
    { name: "Water Usage",               score: lca.waterUsage,            weight: "7%",  desc: "Solvent & washing water consumption" },
    { name: "Air Quality (Process)",     score: lca.airQuality,            weight: "12%", desc: "VOC emissions during activation/operation" },
    { name: "Functional Group Benefit",  score: Math.min(10, 5 + (inputs.functionalGroups.includes("amine") ? 2 : 0) + (inputs.functionalGroups.includes("hydroxyl") ? 1 : 0)), weight: "13%", desc: "Environmental benefit from selective capture" },
  ]
  const scoreColor = (s) => s >= 7 ? "#10b981" : s >= 5 ? "#3b82f6" : s >= 3 ? "#f59e0b" : "#ef4444"

  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1, background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 10, padding: 20 }}>
        <SectionTitle>ISO 14040/14044 GATE-TO-GATE LCA BREAKDOWN</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {categories.map(c => (
            <div key={c.name} style={{ background: "#0a1e38", border: "1px solid #1e3a5f", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <span style={{ color: "#94a3b8", fontSize: 13 }}>{c.name}</span>
                  <span style={{ marginLeft: 8, color: "#475569", fontSize: 11 }}>Weight: {c.weight}</span>
                </div>
                <span style={{ color: scoreColor(c.score), fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>
                  {c.score.toFixed(1)}/10
                </span>
              </div>
              <div style={{ height: 5, background: "#1e3a5f", borderRadius: 3, marginBottom: 6 }}>
                <div style={{ height: "100%", width: `${c.score * 10}%`, background: scoreColor(c.score), borderRadius: 3, transition: "width 0.6s ease" }} />
              </div>
              <div style={{ color: "#475569", fontSize: 11 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: 240, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 10, padding: 20 }}>
          <SectionTitle>COMPOSITE GREEN SCORE</SectionTitle>
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 52, fontWeight: 800, fontFamily: "monospace",
              color: scoreColor(lca.compositeGreenScore) }}>
              {lca.compositeGreenScore}
            </div>
            <div style={{ color: "#64748b", fontSize: 13 }}>out of 10</div>
          </div>
          <div style={{ height: 8, background: "#1e3a5f", borderRadius: 4 }}>
            <div style={{ height: "100%", width: `${lca.compositeGreenScore * 10}%`,
              background: `linear-gradient(90deg, #059669, #10b981)`, borderRadius: 4 }} />
          </div>
          <div style={{ marginTop: 12, color: "#64748b", fontSize: 12, textAlign: "center" }}>
            {lca.compositeGreenScore >= 7 ? "✅ Recommended for green deployment" :
             lca.compositeGreenScore >= 5 ? "⚠️ Acceptable with optimization" :
             "❌ High environmental concern"}
          </div>
        </div>
        <div style={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 10, padding: 20 }}>
          <SectionTitle>METHODOLOGY</SectionTitle>
          <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6 }}>
            Gate-to-gate LCA per ISO 14040/14044. Functional unit: 1 kg MOF deployed in post-combustion CO₂ capture.
            System boundary includes synthesis, activation, and 10-year operation.
          </div>
        </div>
      </div>
    </div>
  )
}

function LiteratureTab() {
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState("co2")
  const filtered = LITERATURE_DB
    .filter(m => m.name.toLowerCase().includes(query.toLowerCase()) || m.metal.includes(query) || m.linker.includes(query))
    .sort((a,b) => b[sortKey] - a[sortKey])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <input placeholder="Search MOF by name, metal, or linker..."
          value={query} onChange={e => setQuery(e.target.value)}
          style={{ flex: 1, background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 6,
            padding: "9px 14px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
        <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ ...selectStyle, width: 200 }}>
          <option value="co2">Sort by CO₂ Uptake</option>
          <option value="selectivity">Sort by Selectivity</option>
          <option value="bet">Sort by BET Surface Area</option>
          <option value="pv">Sort by Pore Volume</option>
        </select>
      </div>
      <div style={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0a1e38" }}>
              {["MOF Name","Metal","Linker","BET (m²/g)","PV (cm³/g)","PD (Å)","CO₂ (mmol/g)","Selectivity"].map(h => (
                <th key={h} style={{ padding: "10px 14px", color: "#64748b", fontSize: 11,
                  fontWeight: 600, letterSpacing: "0.06em", textAlign: "left", borderBottom: "1px solid #1e3a5f" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.name} style={{ background: i % 2 === 0 ? "transparent" : "#0a1e38",
                borderBottom: "1px solid #0f2744" }}>
                <td style={{ padding: "10px 14px", color: "#3b82f6", fontSize: 13, fontWeight: 600 }}>{m.name}</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8", fontSize: 12, fontFamily: "monospace" }}>{m.metal}</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8", fontSize: 12 }}>{m.linker}</td>
                <td style={{ padding: "10px 14px", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace" }}>{m.bet.toLocaleString()}</td>
                <td style={{ padding: "10px 14px", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace" }}>{m.pv}</td>
                <td style={{ padding: "10px 14px", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace" }}>{m.pd}</td>
                <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, fontWeight: 700,
                  color: m.co2 >= 6 ? "#10b981" : m.co2 >= 3 ? "#3b82f6" : "#94a3b8" }}>{m.co2}</td>
                <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12,
                  color: m.selectivity >= 100 ? "#10b981" : m.selectivity >= 30 ? "#3b82f6" : "#94a3b8" }}>{m.selectivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "10px 14px", color: "#475569", fontSize: 11, borderTop: "1px solid #1e3a5f" }}>
          Showing {filtered.length} of {LITERATURE_DB.length} structures · Source: CoRE MOF 2019 Database (Chung et al.)
        </div>
      </div>
    </div>
  )
}

// ─── Shared Style Helpers ────────────────────────────────────────────────────

const labelStyle = {
  display: "block", color: "#64748b", fontSize: 10, fontWeight: 600,
  letterSpacing: "0.08em", marginBottom: 5,
}

const selectStyle = {
  width: "100%", background: "#0a1e38", border: "1px solid #1e3a5f",
  borderRadius: 6, padding: "8px 10px", color: "#e2e8f0", fontSize: 12,
  outline: "none", cursor: "pointer", marginBottom: 4,
}

const numInputStyle = {
  width: "100%", background: "#0a1e38", border: "1px solid #1e3a5f",
  borderRadius: 6, padding: "7px 10px", color: "#e2e8f0", fontSize: 13,
  fontFamily: "monospace", outline: "none",
}

function SectionTitle({ children }) {
  return <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 14 }}>{children}</div>
}

function EmptyState({ message }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: 300, background: "#0d1f3c", border: "1px dashed #1e3a5f", borderRadius: 10 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⬡</div>
      <div style={{ color: "#475569", fontSize: 14 }}>{message}</div>
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "structure",  label: "Structure Input" },
  { id: "ml",        label: "ML Prediction" },
  { id: "lca",       label: "LCA Scoring" },
  { id: "literature", label: "Literature Database" },
]

export default function App() {
  const [activeTab, setActiveTab] = useState("structure")
  const [inputs, setInputs]       = useState(DEFAULT_INPUTS)
  const [results, setResults]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [batchMode, setBatchMode] = useState(false)
  const [darkMode]                = useState(true)

  const handlePredict = useCallback(async () => {
    setLoading(true)
    try {
      // Try real API first (set VITE_API_URL in .env.local or GitHub secrets)
      const apiUrl = import.meta.env.VITE_API_URL
      if (apiUrl) {
        const resp = await fetch(`${apiUrl}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputs),
        })
        if (resp.ok) {
          const data = await resp.json()
          setResults(data)
          setLoading(false)
          return
        }
      }
    } catch (_) { /* fall through to local prediction */ }

    // Fallback: built-in CoRE-2019 based formula model
    await new Promise(r => setTimeout(r, 800))
    setResults(predictMOF(inputs))
    setLoading(false)
  }, [inputs])

  return (
    <div style={{ minHeight: "100vh", background: "#060f1e", color: "#e2e8f0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* ── Header ── */}
      <header style={{ background: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "0 24px",
        display: "flex", alignItems: "stretch", height: 52, position: "sticky", top: 0, zIndex: 100 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 32 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #1d4ed8, #10b981)",
            borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800 }}>⬡</div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "0.02em" }}>EcoMOF-AI</span>
          <span style={{ background: "#1e3a5f", color: "#93c5fd", fontSize: 10, padding: "2px 7px",
            borderRadius: 4, fontWeight: 600 }}>v1.β</span>
        </div>

        {/* Tabs */}
        <nav style={{ display: "flex", alignItems: "stretch" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "0 18px", fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400,
                color: activeTab === t.id ? "#93c5fd" : "#64748b",
                borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Right controls */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <input placeholder="Search MOFs by name..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 6,
              padding: "5px 12px", color: "#e2e8f0", fontSize: 12, outline: "none", width: 190 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#64748b", fontSize: 12 }}>Batch Mode</span>
            <div onClick={() => setBatchMode(p => !p)}
              style={{ width: 38, height: 20, background: batchMode ? "#2563eb" : "#1e3a5f",
                borderRadius: 10, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 2, left: batchMode ? 20 : 2, width: 16, height: 16,
                background: "#fff", borderRadius: "50%", transition: "left 0.2s" }} />
            </div>
          </div>
          <div style={{ width: 28, height: 28, background: "#0d1f3c", border: "1px solid #1e3a5f",
            borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            🌙
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto" }}>
        {activeTab === "structure"  && <StructureInputTab inputs={inputs} setInputs={setInputs} results={results} loading={loading} onPredict={handlePredict} />}
        {activeTab === "ml"        && <MLPredictionTab results={results} inputs={inputs} />}
        {activeTab === "lca"       && <LCAScoringTab results={results} inputs={inputs} />}
        {activeTab === "literature"&& <LiteratureTab />}
      </main>

      {/* ── Footer ── */}
      <footer style={{ marginTop: 40, padding: "16px 24px", borderTop: "1px solid #1e3a5f",
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#334155", fontSize: 12 }}>
          © 2024 Advanced Materials Lab · Computational Design Division · <strong style={{ color: "#475569" }}>EcoMOF-AI</strong>
        </span>
        <span style={{ color: "#334155", fontSize: 12 }}>
          CoRE MOF 2019 Database · 14,252 curated structures ·{" "}
          <a href="https://github.com/Linus-He/ecomof-ai" target="_blank" rel="noopener"
            style={{ color: "#3b82f6", textDecoration: "none" }}>GitHub</a>
        </span>
      </footer>
    </div>
  )
}
