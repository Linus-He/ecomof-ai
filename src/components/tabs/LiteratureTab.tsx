// @ts-nocheck
import { useState, useMemo, useEffect } from "react"
import { ScatterChart, Scatter, ZAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import {
  useT, useLang, useViewport,
  FONT_MONO, LITERATURE_DB,
  zhText, toolbarBtn,
  fetchDataJson, downloadTextFile, buildDatabaseRecords,
  BasisBadge, PageHeader, Callout,
} from "../../shared"

export function LiteratureTab({ results, inputs }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow } = useViewport()
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState("co2")
  const [structureRows, setStructureRows] = useState([])
  const [labelRows, setLabelRows] = useState([])
  const [inventoryRows, setInventoryRows] = useState([])
  const [dataStatus, setDataStatus] = useState("loading")
  useEffect(() => {
    let active = true
    Promise.all([
      fetchDataJson("mof_structures.json"),
      fetchDataJson("adsorption_labels.json"),
      fetchDataJson("lca_inventory.json"),
    ]).then(([structures, labels, inventory]) => {
      if (!active) return
      setStructureRows(structures); setLabelRows(labels); setInventoryRows(inventory); setDataStatus("loaded")
    }).catch(() => { if (active) setDataStatus("fallback") })
    return () => { active = false }
  }, [])
  const databaseRecords = useMemo(() => {
    const loaded = buildDatabaseRecords(structureRows, labelRows)
    return loaded.length ? loaded : LITERATURE_DB
  }, [structureRows, labelRows])
  const filtered = databaseRecords
    .filter(m => m.name.toLowerCase().includes(query.toLowerCase()) || m.metal.includes(query) || m.linker.includes(query))
    .sort((a, b) => Number(b[sortKey] || 0) - Number(a[sortKey] || 0))
  const bestCo2 = databaseRecords.reduce((best, item) => item.co2 > best.co2 ? item : best, databaseRecords[0])
  const bestSelectivity = databaseRecords.reduce((best, item) => item.selectivity > best.selectivity ? item : best, databaseRecords[0])
  const compareItems = results && !results.unavailable
    ? [
        { name: inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`, uptake: results.primaryUptake, selectivity: results.selectivity, lca: results.lca.compositeGreenScore, sourceType: c.common.basisModelPredicted },
        ...databaseRecords.slice(0, 7).map(item => ({ name: item.name, uptake: item.co2, selectivity: item.selectivity, lca: Number((5 + Math.min(4, item.selectivity / 55)).toFixed(1)), sourceType: item.sourceType })),
      ]
    : []
  const exportDatabaseCsv = () => {
    const header = ["MOF", "Metal", "Linker", "Topology", "PLD", "LCD", "BET", "PV", "CO2", "Selectivity", "Structure source", "Label source", "Quality"]
    const rows = filtered.map(m => [m.name, m.metal, m.linker, m.topology || "", m.pd, m.lcd || "", m.bet || "", m.pv || "", m.co2, m.selectivity, m.sourceDatabase || "local seed", m.sourceType || "", m.qualityFlag || "screening_seed"])
    downloadTextFile("ecomof_database_filtered.csv", [header, ...rows].map(row => row.join(",")).join("\n"), "text/csv")
  }
  const exportCompareCsv = () => {
    const header = ["MOF", "Uptake", "Selectivity", "LCA score", "Source"]
    const rows = compareItems.map(item => [item.name, item.uptake, item.selectivity, item.lca, item.sourceType])
    downloadTextFile("ecomof_compare_dashboard.csv", [header, ...rows].map(row => row.join(",")).join("\n"), "text/csv")
  }
  const selectStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, padding: "9px 14px", color: t.text, fontSize: 13, outline: "none", cursor: "pointer" }
  const sortOptions = lang === "zh"
    ? [["co2", "按 CO₂ 吸附量排序"], ["selectivity", "按选择性排序"], ["bet", "按 BET 比表面积排序"], ["pv", "按孔体积排序"]]
    : [["co2", "Sort by CO₂ Uptake"], ["selectivity", "Sort by Selectivity"], ["bet", "Sort by BET Surface Area"], ["pv", "Sort by Pore Volume"]]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader
        title={lang === "zh" ? "数据库" : "Database"}
        subtitle={lang === "zh" ? "以 benchmark 和 reference browser 的方式浏览材料；重点看材料为什么值得对照，而不是先进入密集数据表。" : "Browse materials as a benchmark and reference browser; the first view emphasizes why each case matters instead of starting from a dense backend table."}
        action={<BasisBadge tone={dataStatus === "loaded" ? "calc" : "proxy"}>{zhText(lang, dataStatus)}</BasisBadge>}
      />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
        <input placeholder={c.literature.search} value={query} onChange={e => setQuery(e.target.value)} style={{ flex: "1 1 280px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "10px 14px", color: t.text, fontSize: 13, outline: "none" }} />
        <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ ...selectStyle, width: 210, background: t.surface }}>
          {sortOptions.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
        </select>
        <button type="button" onClick={exportDatabaseCsv} style={toolbarBtn(t)}>↓ CSV</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1.25fr 0.75fr", gap: 14, alignItems: "stretch" }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20, minHeight: 230 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ color: t.textStrong, fontSize: 24, fontWeight: 800 }}>{filtered[0]?.name || "UiO-66"}</div>
              <div style={{ color: t.muted, fontSize: 13, lineHeight: 1.65, marginTop: 8, maxWidth: 620 }}>{lang === "zh" ? "重点基准用于快速建立解释参照：结构稳定性、孔结构、选择性趋势和公开标签覆盖都比普通候选更适合作为对照。" : "The featured benchmark provides an interpretation anchor for stability, pore structure, selectivity trends, and public-label coverage."}</div>
            </div>
            <BasisBadge tone="info">{zhText(lang, filtered[0]?.sourceType || "benchmark-backed")}</BasisBadge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            {[["PLD/LCD", `${filtered[0]?.pd ?? "—"} / ${filtered[0]?.lcd ?? "—"} Å`], ["BET/PV", `${Number(filtered[0]?.bet || 0).toLocaleString()} / ${filtered[0]?.pv ?? "—"}`], [lang === "zh" ? "CO₂ 吸附量" : "CO₂ uptake", filtered[0]?.co2 ?? "—"], [lang === "zh" ? "选择性" : "Selectivity", filtered[0]?.selectivity ?? "—"]].map(([label, value]) => (
              <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
                <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</div>
                <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 800, marginTop: 6 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>{lang === "zh" ? "筛选类别" : "Filter categories"}</div>
          <div style={{ display: "grid", gap: 9 }}>
            {[
              [lang === "zh" ? "基准支持" : "Benchmark-backed", filtered.filter(item => item.qualityFlag || item.sourceType).length],
              [lang === "zh" ? "开放金属位点" : "Open metal site", filtered.filter(item => item.oms).length],
              [lang === "zh" ? "高选择性" : "High selectivity", filtered.filter(item => Number(item.selectivity) >= 30).length],
              [lang === "zh" ? "结构记录" : "Structure records", structureRows.length || databaseRecords.length],
            ].map(([label, count]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 10, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px" }}>
                <span style={{ color: t.muted, fontSize: 12 }}>{label}</span>
                <strong style={{ color: t.accentText, fontSize: 12 }}>{count}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        {filtered.slice(0, 8).map(item => (
          <div key={item.name} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 800 }}>{item.name}</div>
              <BasisBadge tone="info">{zhText(lang, item.sourceDatabase || "seed")}</BasisBadge>
            </div>
            <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>{item.oms ? (lang === "zh" ? "具有吸附相关性的开放金属位点基准。" : "Open metal site benchmark with adsorption relevance.") : (lang === "zh" ? "用于结构-性能比较的参考材料。" : "Reference material for structure-performance comparison.")}</div>
            <div style={{ color: t.faint, fontSize: 10, marginTop: 9 }}>{zhText(lang, item.qualityFlag || item.sourceType || "screening_seed")}</div>
          </div>
        ))}
      </div>
      <Callout tone="info"><strong>{c.literature.roadmapTitle}</strong> {c.literature.roadmapBody}</Callout>
      {compareItems.length > 0 && (
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
            <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800 }}>{lang === "zh" ? "多 MOF 比较看板" : "Multi-MOF compare dashboard"}</div>
            <button type="button" onClick={exportCompareCsv} style={{ ...toolbarBtn(t), padding: "4px 9px", fontSize: 11 }}>↓ {lang === "zh" ? "比较 CSV" : "Compare CSV"}</button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 18, right: 24, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis type="number" dataKey="uptake" tick={{ fill: t.subtle, fontSize: 10 }} label={{ value: lang === "zh" ? "CO₂ 吸附量" : "CO₂ uptake", fill: t.subtle, fontSize: 10, dy: 16 }} />
              <YAxis type="number" dataKey="selectivity" tick={{ fill: t.subtle, fontSize: 10 }} label={{ value: lang === "zh" ? "选择性" : "Selectivity", fill: t.subtle, fontSize: 10, angle: -90, dx: -10 }} />
              <ZAxis type="number" dataKey="lca" range={[90, 540]} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <Scatter data={compareItems.slice(1)} fill={t.accent} name={c.common.benchmarkSet} />
              <Scatter data={compareItems.slice(0, 1)} fill={t.accentStrong} name={c.common.currentCandidate} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: 12, borderBottom: `1px solid ${t.border}` }}>
          <input placeholder={c.literature.search} value={query} onChange={e => setQuery(e.target.value)} style={{ flex: "1 1 260px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "9px 14px", color: t.text, fontSize: 13, outline: "none" }} />
          <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ ...selectStyle, width: 200 }}>
            {sortOptions.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
          <button type="button" onClick={exportDatabaseCsv} style={toolbarBtn(t)}>↓ CSV</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 1040, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: t.surface }}>
                {(lang === "zh" ? ["MOF 名称","金属","连接体","拓扑","PLD/LCD (Å)","BET/孔体积","CO₂","选择性","结构来源","标签来源","质量"] : ["MOF Name","Metal","Linker","Topology","PLD/LCD (Å)","BET/PV","CO₂","Selectivity","Structure source","Label source","Quality"]).map(h => (
                  <th key={h} style={{ padding: "10px 14px", color: t.subtle, fontSize: 11, fontWeight: 600, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.name} style={{ background: i % 2 === 0 ? "transparent" : t.surface, borderBottom: `1px solid ${t.divider}` }}>
                  <td style={{ padding: "10px 14px", color: t.accentText, fontSize: 13, fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: "10px 14px", color: t.muted, fontSize: 12, fontFamily: "monospace" }}>{m.metal}</td>
                  <td style={{ padding: "10px 14px", color: t.muted, fontSize: 12 }}>{m.linker}</td>
                  <td style={{ padding: "10px 14px", color: t.muted, fontSize: 12 }}>{m.topology || "—"}{m.oms ? ` · OMS` : ""}</td>
                  <td style={{ padding: "10px 14px", color: t.text, fontSize: 12, fontFamily: "monospace" }}>{m.pd}/{m.lcd || "—"}</td>
                  <td style={{ padding: "10px 14px", color: t.text, fontSize: 12, fontFamily: "monospace" }}>{Number(m.bet || 0).toLocaleString()} / {m.pv}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: m.co2 >= 6 ? t.success : m.co2 >= 3 ? t.accent : t.muted }}>{m.co2}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: m.selectivity >= 100 ? t.success : m.selectivity >= 30 ? t.accent : t.muted }}>{m.selectivity}</td>
                  <td style={{ padding: "10px 14px", color: t.subtle, fontSize: 11 }}><strong style={{ color: t.text }}>{zhText(lang, m.sourceDatabase || "local seed")}</strong><br />{zhText(lang, m.descriptorMethod || m.sourceType)}</td>
                  <td style={{ padding: "10px 14px", color: t.subtle, fontSize: 11 }}><strong style={{ color: t.text }}>{zhText(lang, m.sourceType)}</strong><br />{m.doi}</td>
                  <td style={{ padding: "10px 14px", color: t.warn, fontSize: 11 }}>{zhText(lang, m.qualityFlag || "screening_seed")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 14px", color: t.faint, fontSize: 11, borderTop: `1px solid ${t.border}` }}>
          {c.literature.showing} {filtered.length} / {databaseRecords.length} · {dataStatus === "loaded" ? zhText(lang, "public/data JSON + schema CSV") : c.literature.source}
        </div>
      </div>
    </div>
  )
}
