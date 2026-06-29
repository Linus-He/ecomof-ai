// @ts-nocheck
import { useState } from "react"
import { useT, useLang } from "../../contexts"
import { FONT_SANS, FONT_MONO } from "../../constants/theme"
import { MOF_PRESETS, METAL_CENTERS, ORGANIC_LINKERS, GAS_SYSTEMS } from "../../constants/catalogs"
import { DEFAULT_INPUTS } from "../../constants/defaults"
import { findPresetName } from "../../utils/presets"
import { predictMOF } from "../../utils/prediction"
import { toolbarBtn } from "../../utils/styles"
import { gasLabel } from "../../utils/labels"
import { MetricCard } from "../ui/index"

export function BatchModePanel({ inputs, onClose, onApplyToForm }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const [rows, setRows] = useState([])
  const [running, setRunning] = useState(false)

  const addEmpty = () => setRows(r => [...r, {
    ...DEFAULT_INPUTS,
    gasSystem: inputs.gasSystem,
    temperature: inputs.temperature,
    pressure: inputs.pressure,
    mlAlgorithm: inputs.mlAlgorithm,
    id: Date.now() + Math.random(),
    result: null,
  }])

  const addKnownMOFs = () => {
    const seed = Object.entries(MOF_PRESETS).slice(0, 6).map(([name, p]) => ({
      id: Date.now() + Math.random(),
      mofName: name,
      ...DEFAULT_INPUTS, ...p,
      gasSystem: inputs.gasSystem, temperature: inputs.temperature, pressure: inputs.pressure,
      mlAlgorithm: inputs.mlAlgorithm,
      result: null,
    }))
    setRows(r => [...r, ...seed])
  }
  const addAllKnownMOFs = () => {
    const seed = Object.entries(MOF_PRESETS).map(([name, p]) => ({
      id: Date.now() + Math.random(),
      mofName: name,
      ...DEFAULT_INPUTS, ...p,
      gasSystem: inputs.gasSystem, temperature: inputs.temperature, pressure: inputs.pressure,
      mlAlgorithm: inputs.mlAlgorithm,
      result: null,
    }))
    setRows(seed)
  }

  const importCSV = async (file) => {
    const text = await file.text()
    const lines = text.trim().split(/\r?\n/)
    const header = lines[0].split(",").map(s => s.trim().toLowerCase())
    const idx = (k) => header.indexOf(k)
    const parsed = []
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(",").map(s => s.trim())
      const name = cells[idx("name")] || cells[idx("mof")] || ""
      const presetName = findPresetName(name)
      const preset = presetName ? MOF_PRESETS[presetName] : null
      parsed.push({
        id: Date.now() + i + Math.random(),
        mofName: presetName || name,
        metalCenter: cells[idx("metal")] || preset?.metalCenter || "Zr4+",
        organicLinker: cells[idx("linker")] || preset?.organicLinker || "BDC",
        poreDiameter: parseFloat(cells[idx("pd")] ?? cells[idx("porediameter")]) || preset?.poreDiameter || 8.5,
        betSurfaceArea: parseFloat(cells[idx("bet")]) || preset?.betSurfaceArea || 1850,
        poreVolume: parseFloat(cells[idx("pv")] ?? cells[idx("porevolume")]) || preset?.poreVolume || 0.82,
        functionalGroups: preset?.functionalGroups || [],
        temperature: inputs.temperature, pressure: inputs.pressure,
        mlAlgorithm: inputs.mlAlgorithm, gasSystem: inputs.gasSystem,
        result: null,
      })
    }
    setRows(parsed)
  }

  const updateRow = (id, patch) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, ...patch, result: null } : row))
  }

  const applyPresetToRow = (id, rawName) => {
    const presetName = findPresetName(rawName)
    if (!presetName) {
      updateRow(id, { mofName: rawName })
      return
    }
    updateRow(id, { ...MOF_PRESETS[presetName], mofName: presetName })
  }

  const runAll = async () => {
    setRunning(true)
    const updated = rows.map(r => {
      const { result, mofName, id, ...ins } = r
      const out = predictMOF(ins)
      return { ...r, result: out }
    })
    setRows(updated)
    setRunning(false)
  }
  const decisionScore = (row) => {
    if (!row.result || row.result.unavailable) return -Infinity
    return Number((row.result.primaryUptake * 0.35 + Math.log1p(row.result.selectivity) * 0.9 + row.result.lca.compositeGreenScore * 0.45).toFixed(2))
  }
  const sortByDecisionScore = () => {
    setRows(prev => [...prev].sort((a, b) => decisionScore(b) - decisionScore(a)))
  }
  const completedRows = rows.filter(row => row.result && !row.result.unavailable)
  const topRow = completedRows.length ? [...completedRows].sort((a, b) => decisionScore(b) - decisionScore(a))[0] : null
  const avgSelectivity = completedRows.length
    ? Number((completedRows.reduce((sum, row) => sum + Number(row.result.selectivity || 0), 0) / completedRows.length).toFixed(1))
    : "—"

  const exportAll = () => {
    const header = [
      "MOF","Metal","Linker","Gas","Primary (mmol/g)","Secondary (mmol/g)","Selectivity",
      "Qst0 (kJ/mol)","Qst beta source","Applicability status","Applicability warnings",
      "Confidence","Eco Score","Decision score","Anomaly"
    ]
    const lines = [header.join(",")]
    for (const r of rows) {
      if (!r.result || r.result.unavailable) continue
      lines.push([
        r.mofName || "-",
        r.metalCenter, r.organicLinker, r.result.gasSystem,
        r.result.primaryUptake, r.result.secondaryUptake, r.result.selectivity,
        r.result.thermo?.qst0 ?? "",
        r.result.thermo ? "derived_from_predicted_isotherms" : "",
        r.result.applicability?.status ?? "",
        r.result.applicability?.warnings?.map(w => w.code).join("|") ?? "",
        r.result.confidenceScore,
        r.result.lca.compositeGreenScore,
        decisionScore(r),
        r.result.anomaly ? r.result.anomaly.type : "",
      ].join(","))
    }
    const csv = lines.join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = `ecomof_batch_${Date.now()}.csv`
    a.click()
  }

  const cellInputStyle = {
    width: "100%", minWidth: 78, background: t.surface, border: `1px solid ${t.border}`,
    borderRadius: 4, padding: "4px 6px", color: t.text, fontSize: 11,
    fontFamily: FONT_MONO, outline: "none",
  }
  const cellSelectStyle = {
    ...cellInputStyle,
    cursor: "pointer",
    fontFamily: FONT_SANS,
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(2,6,23,0.55)", zIndex: 200,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        marginTop: 60, width: "min(1100px, 96vw)", maxHeight: "85vh", overflow: "auto",
        background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ color: t.accentText, fontSize: 14, fontWeight: 700, letterSpacing: 0 }}>{c.batch.title}</div>
            <div style={{ color: t.faint, fontSize: 11, marginTop: 2 }}>
              {c.batch.subtitle}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.subtle, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <button onClick={addEmpty} style={toolbarBtn(t)}>＋ {c.batch.add}</button>
          <button onClick={addKnownMOFs} style={toolbarBtn(t)}>＋ {c.batch.seed}</button>
          <button onClick={addAllKnownMOFs} style={toolbarBtn(t)}>＋ {lang === "zh" ? "全部预设" : "All presets"}</button>
          <label style={{ ...toolbarBtn(t), cursor: "pointer" }}>
            ⬆ {c.batch.import}
            <input type="file" accept=".csv" style={{ display: "none" }}
              onChange={e => e.target.files[0] && importCSV(e.target.files[0])} />
          </label>
          <button
            onClick={runAll}
            disabled={running || rows.length === 0}
            title={rows.length === 0 ? (lang === "zh" ? "先添加至少一条候选记录。" : "Add at least one candidate first.") : undefined}
            style={{ ...toolbarBtn(t), background: running ? t.border : t.accent, color: "#fff", borderColor: t.accent, cursor: running || rows.length === 0 ? "not-allowed" : "pointer", opacity: rows.length === 0 ? 0.55 : 1 }}
          >
            {running ? c.batch.running : `▶ ${c.batch.run}`}
          </button>
          <button
            onClick={exportAll}
            disabled={rows.every(r => !r.result)}
            title={rows.every(r => !r.result) ? (lang === "zh" ? "运行后才能导出结果。" : "Run candidates before exporting results.") : undefined}
            style={{ ...toolbarBtn(t), cursor: rows.every(r => !r.result) ? "not-allowed" : "pointer", opacity: rows.every(r => !r.result) ? 0.55 : 1 }}
          >↓ {c.batch.export}</button>
          <button
            onClick={sortByDecisionScore}
            disabled={completedRows.length === 0}
            title={completedRows.length === 0 ? (lang === "zh" ? "运行后才能排序。" : "Run candidates before sorting.") : undefined}
            style={{ ...toolbarBtn(t), cursor: completedRows.length === 0 ? "not-allowed" : "pointer", opacity: completedRows.length === 0 ? 0.55 : 1 }}
          >↕ {lang === "zh" ? "按决策分排序" : "Sort by score"}</button>
        </div>
        {completedRows.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 12 }}>
            <MetricCard label={lang === "zh" ? "已完成" : "Completed"} value={completedRows.length} unit={`/ ${rows.length}`} />
            <MetricCard label={lang === "zh" ? "最高候选" : "Top candidate"} value={topRow?.mofName || "—"} unit="" comparison={topRow ? `score ${decisionScore(topRow)}` : ""} />
            <MetricCard label={lang === "zh" ? "平均选择性" : "Average selectivity"} value={avgSelectivity} unit="" />
          </div>
        )}

        {rows.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: t.faint, fontSize: 13 }}>
            {c.batch.empty}
            <code style={{ color: t.accentText, marginLeft: 6 }}>name, metal, linker, bet, pv, pd</code>
          </div>
        ) : (
          <>
          <datalist id="batch-mof-presets">
            {Object.keys(MOF_PRESETS).map(name => <option key={name} value={name} />)}
          </datalist>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: t.surface }}>
                {(lang === "zh"
                  ? ["MOF","金属","连接体","孔径","BET","孔体积","气体","主组分","副组分","选择性","Qst0","评分","标记",""]
                  : ["MOF","Metal","Linker","PD","BET","PV","Gas","Primary","Secondary","Sel","Qst0","Score","Flag",""]
                ).map(h => (
                  <th key={h} style={{ padding: "8px 10px", color: t.subtle, textAlign: "left",
                    borderBottom: `1px solid ${t.border}`, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${t.divider}` }}>
                  <td style={{ padding: "6px 10px", minWidth: 120 }}>
                    <input
                      list="batch-mof-presets"
                      value={r.mofName || ""}
                      placeholder={c.batch.placeholder}
                      onChange={e => updateRow(r.id, { mofName: e.target.value })}
                      onBlur={e => applyPresetToRow(r.id, e.target.value)}
                      style={{ ...cellInputStyle, color: t.accentText }}
                    />
                  </td>
                  <td style={{ padding: "6px 10px", minWidth: 86 }}>
                    <select value={r.metalCenter} onChange={e => updateRow(r.id, { metalCenter: e.target.value })}
                      style={cellSelectStyle}>
                      {METAL_CENTERS.map(m => <option key={m.value} value={m.value}>{m.value}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "6px 10px", minWidth: 104 }}>
                    <select value={r.organicLinker} onChange={e => updateRow(r.id, { organicLinker: e.target.value })}
                      style={cellSelectStyle}>
                      {ORGANIC_LINKERS.map(l => <option key={l.value} value={l.value}>{l.value}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "6px 10px", minWidth: 74 }}>
                    <input type="number" min={3} max={30} step={0.1} value={r.poreDiameter}
                      onChange={e => updateRow(r.id, { poreDiameter: parseFloat(e.target.value) || 3 })}
                      style={cellInputStyle} />
                  </td>
                  <td style={{ padding: "6px 10px", minWidth: 88 }}>
                    <input type="number" min={100} max={7000} step={10} value={r.betSurfaceArea}
                      onChange={e => updateRow(r.id, { betSurfaceArea: parseFloat(e.target.value) || 100 })}
                      style={cellInputStyle} />
                  </td>
                  <td style={{ padding: "6px 10px", minWidth: 78 }}>
                    <input type="number" min={0.1} max={4.5} step={0.01} value={r.poreVolume}
                      onChange={e => updateRow(r.id, { poreVolume: parseFloat(e.target.value) || 0.1 })}
                      style={cellInputStyle} />
                  </td>
                  <td style={{ padding: "6px 10px", minWidth: 104 }}>
                    <select value={r.gasSystem} onChange={e => updateRow(r.id, { gasSystem: e.target.value })}
                      style={cellSelectStyle}>
                      {GAS_SYSTEMS.map(g => <option key={g.id} value={g.id} disabled={g.priority === "unavailable"}>{gasLabel(g.label, lang)}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "6px 10px", fontFamily: FONT_MONO, color: t.success }}>{r.result?.primaryUptake ?? "—"}</td>
                  <td style={{ padding: "6px 10px", fontFamily: FONT_MONO, color: t.muted }}>{r.result?.secondaryUptake ?? "—"}</td>
                  <td style={{ padding: "6px 10px", fontFamily: FONT_MONO, color: t.text }}>{r.result?.selectivity ?? "—"}</td>
                  <td style={{ padding: "6px 10px", fontFamily: FONT_MONO, color: t.accentText }}>{r.result?.thermo?.qst0 ?? "—"}</td>
                  <td style={{ padding: "6px 10px", fontFamily: FONT_MONO, color: t.success }}>{Number.isFinite(decisionScore(r)) ? decisionScore(r) : "—"}</td>
                  <td style={{ padding: "6px 10px", color: t.warn, fontSize: 11 }}>{r.result?.anomaly ? "⚠ inverse" : ""}</td>
                  <td style={{ padding: "6px 10px" }}>
                    <button onClick={() => onApplyToForm(r)}
                      style={{ background: "none", border: `1px solid ${t.border}`, color: t.accentText,
                        fontSize: 10, padding: "2px 8px", borderRadius: 4, cursor: "pointer" }}>
                      {c.batch.use}
                    </button>
                    <button onClick={() => setRows(prev => prev.filter(row => row.id !== r.id))}
                      style={{ marginLeft: 6, background: "none", border: `1px solid ${t.border}`, color: t.danger,
                        fontSize: 10, padding: "2px 8px", borderRadius: 4, cursor: "pointer" }}>
                      {c.batch.del}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </div>
    </div>
  )
}
