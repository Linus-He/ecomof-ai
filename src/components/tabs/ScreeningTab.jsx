import { useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import {
  useT, useLang, useViewport,
  FONT_SANS, FONT_MONO,
  METAL_CENTERS, ORGANIC_LINKERS, FUNCTIONAL_GROUPS, GAS_SYSTEMS, AROMATIC_SUBSTITUTION_POSITIONS,
  MODEL_PROFILES, DEFAULT_INPUTS,
  normalizeFunctionalGroupDetails, getFunctionalGroupEntries, defaultGroupPositions, formatFunctionalGroupSummary,
  getGasSystem, getPerformanceLabel,
  parseCifText, zhText, toolbarBtn,
  CustomTooltip, MetricCard, BasisBadge, PageHeader, SectionTitle, EmptyState,
  StageStrip, StickySummaryBar, ResultLayer, HowToRead, InfoTip, NextStepCTA,
  ProvenanceGrid, ResultProvenanceDrawer, Callout, LinkerSubstitutionPreview, NumericField,
} from "../../shared"

export function ScreeningTab({ inputs, setInputs, results, loading, onPredict, onSaveRun, apiUrl, setApiUrl, apiStatus, onCheckApi, setActiveTab, onLoadBenchmark, onAddComparison }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [cifInfo, setCifInfo] = useState(null)
  const metal  = METAL_CENTERS.find(m => m.value === inputs.metalCenter)
  const linker = ORGANIC_LINKERS.find(l => l.value === inputs.organicLinker)
  const gas    = getGasSystem(inputs.gasSystem)
  const perf   = results && !results.unavailable ? getPerformanceLabel(results.primaryUptake, results.selectivity) : null

  const radarData = results && !results.unavailable ? [
    { subject: c.tabs.lca,          A: results.lca.metalImpact,         fullMark: 10 },
    { subject: c.structure.organicLinker, A: results.lca.linkerSustainability, fullMark: 10 },
    { subject: "Energy",           A: results.lca.energyConsumption,    fullMark: 10 },
    { subject: "Waste",            A: results.lca.wasteGeneration,      fullMark: 10 },
    { subject: "Water",            A: results.lca.waterUsage,           fullMark: 10 },
    { subject: "Air",              A: results.lca.airQuality,           fullMark: 10 },
  ] : []

  const toggleFG = (fg) => {
    setInputs(prev => ({
      ...prev,
      functionalGroups: prev.functionalGroups.includes(fg)
        ? prev.functionalGroups.filter(f => f !== fg)
        : [...prev.functionalGroups, fg],
      functionalGroupDetails: prev.functionalGroups.includes(fg)
        ? Object.fromEntries(Object.entries(prev.functionalGroupDetails || {}).filter(([key]) => key !== fg))
        : {
            ...(prev.functionalGroupDetails || {}),
            [fg]: (prev.functionalGroupDetails || {})[fg] || { count: 1, positions: ["2"] },
          }
    }))
  }

  const updateFGDetail = (fg, detailPatch) => {
    setInputs(prev => {
      const current = normalizeFunctionalGroupDetails(prev)[fg] || { count: 1, positions: ["2"] }
      const merged = { ...current, ...detailPatch }
      const count = Math.max(0, Math.min(4, merged.count === 0 ? 0 : Number(merged.count) || 1))
      let positions = count > 0 && Array.isArray(merged.positions)
        ? merged.positions.filter(pos => AROMATIC_SUBSTITUTION_POSITIONS.includes(String(pos))).slice(0, count)
        : []
      if (positions.length > count) positions = positions.slice(0, count)
      if (count > 0 && !positions.length) positions = defaultGroupPositions(count)
      return {
        ...prev,
        functionalGroupDetails: {
          ...(prev.functionalGroupDetails || {}),
          [fg]: { count, positions },
        },
      }
    })
  }

  const toggleFGPosition = (fg, pos) => {
    const current = normalizeFunctionalGroupDetails(inputs)[fg] || { count: 1, positions: ["2"] }
    if (current.count === 0) {
      updateFGDetail(fg, { count: 1, positions: [pos] })
      return
    }
    const exists = current.positions.includes(pos)
    let positions = exists
      ? current.positions.filter(item => item !== pos)
      : [...current.positions, pos]
    if (positions.length > current.count) positions = positions.slice(positions.length - current.count)
    if (!positions.length) positions = [pos]
    updateFGDetail(fg, { positions })
  }

  const handleCifUpload = async (file) => {
    if (!file) return
    const text = await file.text()
    const parsed = parseCifText(text, file.name)
    const next = { mofName: parsed.name || file.name.replace(/\.cif$/i, "") }
    for (const [key, value] of Object.entries(parsed.descriptors)) {
      if (Number.isFinite(value)) next[key] = value
    }
    setInputs(prev => ({ ...prev, ...next }))
    setCifInfo({ fileName: file.name, ...parsed })
  }

  const exportCSV = () => {
    if (!results || results.unavailable) return
    const rows = [
      ["Parameter","Value"],
      ["Gas System", results.gasSystem],
      ["Metal Center", inputs.metalCenter],
      ["Organic Linker", inputs.organicLinker],
      ["Functional Groups", formatFunctionalGroupSummary(inputs, lang)],
      ["Pore Diameter (Å)", inputs.poreDiameter],
      ["BET Surface Area (m²/g)", inputs.betSurfaceArea],
      ["Pore Volume (cm³/g)", inputs.poreVolume],
      ["Temperature (K)", inputs.temperature],
      ["Pressure (bar)", inputs.pressure],
      ["",""],
      [`${results.primaryName} Uptake (mmol/g)`, results.primaryUptake],
      [`${results.secondaryName} Uptake (mmol/g)`, results.secondaryUptake],
      [`Selectivity ${results.primaryName}/${results.secondaryName}`, results.selectivity],
      ["Qst at zero-coverage (kJ/mol)", results.thermo?.qst0 ?? "—"],
      ["Confidence Score", results.confidenceScore],
      ["Eco Score", results.lca.compositeGreenScore],
    ]
    const csv = rows.map(r => r.join(",")).join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = `ecomof_${inputs.metalCenter}_${inputs.organicLinker}_${results.gasSystem.replace("/","-")}.csv`
    a.click()
  }

  const labelStyle = { display: "block", color: t.subtle, fontSize: 11, fontWeight: 700, letterSpacing: 0, marginBottom: 6 }
  const selectStyle = { width: "100%", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 10px", color: t.text, fontSize: 12, outline: "none", cursor: "pointer", marginBottom: 4 }
  const numInputStyle = { width: "100%", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "7px 10px", color: t.text, fontSize: 13, fontFamily: FONT_MONO, outline: "none" }
  const hasUsableResults = results && !results.unavailable
  const functionalGroupDetails = normalizeFunctionalGroupDetails(inputs)
  const decisionTips = hasUsableResults
    ? (lang === "zh" ? [
        ["为什么是这个结果", `${results.primaryName} uptake 主要由 BET、孔体积、孔径匹配、${inputs.organicLinker} 连接体和官能团数量/位置共同影响。选择性仍是 screening proxy，不是严格混合气 IAST。`],
        ["可信度", `当前置信度 ${(results.confidenceScore * 100).toFixed(0)}%。${results.applicability?.warnings?.length ? "输入已有适用域警告，建议补真实等温线或 GCMC 标签。" : "输入位于基准范围附近，可用于早期候选比较。"}`],
        ["下一步", "先看解释/Qst 判断吸附原因，再进入可行性页检查粗略成本、可得性和供应边界。LCA/LCC 只用于入围候选之后的比较。"],
      ] : [
        ["Why this result", `${results.primaryName} uptake is driven by BET, pore volume, pore matching, the ${inputs.organicLinker} linker, and functional-group count/position. Selectivity remains a screening proxy, not rigorous mixture IAST.`],
        ["Confidence", `Current confidence is ${(results.confidenceScore * 100).toFixed(0)}%. ${results.applicability?.warnings?.length ? "Applicability warnings are present; add real isotherm or GCMC labels before strong claims." : "The input is close to benchmark ranges and is usable for early comparison."}`],
        ["Next steps", "Use Interpretation/Qst to inspect the mechanism, then Feasibility for coarse cost, availability, and supply boundaries. LCA/LCC comes after shortlist formation."],
      ])
    : (lang === "zh" ? [
        ["工作流", "左侧输入材料、气体体系和条件；点击运行后中间显示吸附结果，右侧显示解释、置信度和下一步。"],
        ["推荐起点", "可以在顶部搜索 UiO-66、HKUST-1、ZIF-8、MOF-5 等常见 MOF，参数会自动填入。"],
        ["结果口径", "当前网页是筛选级工具；带有 beta/proxy/basis 标记的结果不能直接当作论文级证据。"],
      ] : [
        ["Workflow", "Enter material, gas pair, and conditions on the left; results appear in the center, with interpretation and next steps on the right."],
        ["Recommended start", "Search UiO-66, HKUST-1, ZIF-8, MOF-5, and other common MOFs from the top bar to auto-fill parameters."],
        ["Result status", "This is a screening-level tool; beta/proxy/basis-marked outputs are not publication-grade evidence by themselves."],
      ])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader
        title={lang === "zh" ? "Stage 1 — 科学筛选" : "Stage 1 — Scientific Screening"}
        subtitle={lang === "zh"
          ? "用性能、化学线索和筛选置信度作为早期主要过滤器。"
          : "Use performance, chemistry, and screening confidence as the primary early-stage filter."}
        meta={`${inputs.mofName || inputs.metalCenter} · ${inputs.gasSystem} · ${inputs.temperature} K · ${inputs.pressure} bar`}
        action={<BasisBadge tone={apiStatus?.ok ? "calc" : "proxy"}>{apiStatus?.ok ? "backend connected" : "screening prototype"}</BasisBadge>}
      />
      <StageStrip current="screening" onNavigate={setActiveTab} />
      <StickySummaryBar
        inputs={inputs}
        results={results}
        stage={lang === "zh" ? "第 1 阶段" : "Stage 1"}
        onAddComparison={onAddComparison}
        canAddComparison={hasUsableResults}
      />
    <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(250px, 0.24fr) minmax(0, 0.52fr) minmax(250px, 0.24fr)", gap: 20, height: "100%", alignItems: "start" }}>
      {/* ── Left: Input Panel ── */}
      <div style={{ width: isNarrow ? "100%" : 315, flexShrink: 0, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20, overflowY: "auto" }}>
        <div style={{ color: t.accentText, fontSize: 13, fontWeight: 700, letterSpacing: 0, marginBottom: 16 }}>
          ⬡ {c.structure.inputTitle}
        </div>

        <label style={labelStyle}>{c.structure.gasSystem}</label>
        <select value={inputs.gasSystem}
          onChange={e => setInputs(p => ({ ...p, gasSystem: e.target.value }))}
          style={{ ...selectStyle, marginBottom: 10 }}>
          {GAS_SYSTEMS.map(g => (
            <option key={g.id} value={g.id} disabled={g.priority === "unavailable"}>
              {g.label}
            </option>
          ))}
        </select>
        <div style={{ fontSize: 10, color: gas.priority === "beta" ? t.warn : t.faint, marginBottom: 12 }}>
          {gas.priority === "beta" ? "⚠ " : "· "}{zhText(lang, gas.dataNote)}
        </div>

        <label style={labelStyle}>{c.structure.metalCenter}</label>
        <select value={inputs.metalCenter}
          onChange={e => setInputs(p => ({ ...p, metalCenter: e.target.value }))}
          style={selectStyle}>
          {METAL_CENTERS.map(m => <option key={m.value} value={m.value}>{m.label}{m.oms ? " · OMS" : ""}</option>)}
        </select>
        {metal && <div style={{ fontSize: 11, color: metal.color, marginTop: 3, marginBottom: 12 }}>
          {c.structure.toxicity}: {zhText(lang, metal.toxicity)} · {c.structure.lca}: {metal.lcaScore}/10 {metal.oms && `· ${c.structure.oms}`}
        </div>}

        <label style={labelStyle}>{c.structure.organicLinker}</label>
        <select value={inputs.organicLinker}
          onChange={e => setInputs(p => ({ ...p, organicLinker: e.target.value }))}
          style={{ ...selectStyle, marginBottom: 4 }}>
          {ORGANIC_LINKERS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        {linker && (
          <div style={{ fontSize: 10, color: t.faint, marginBottom: 14, lineHeight: 1.5 }}>
            {zhText(lang, linker.category)} · {linker.connectivity}-{c.structure.connected} · {c.structure.position} {linker.positions}
          </div>
        )}

        <NumericField label={`${c.numeric.poreDiameter} (Å)`} unit="Å" min={3} max={30} step={0.1}
          value={inputs.poreDiameter} onChange={v => setInputs(p => ({ ...p, poreDiameter: v }))}
          helper={lang === "zh" ? "孔径影响尺寸筛分和扩散；先用基准范围，再用真实结构描述符替换。" : "Pore size affects sieving and diffusion; start with benchmark ranges, then replace with real descriptors."} />
        <NumericField label={`${c.numeric.bet} (m²/g)`} unit="m²/g" min={100} max={7000} step={10}
          value={inputs.betSurfaceArea} onChange={v => setInputs(p => ({ ...p, betSurfaceArea: v }))}
          helper={lang === "zh" ? "BET 是容量相关描述符；实验、GCMC 或数据库来源应分开记录。" : "BET is a capacity-related descriptor; keep experimental, GCMC, and database sources distinct."} />
        <NumericField label={`${c.numeric.poreVolume} (cm³/g)`} unit="cm³/g" min={0.1} max={4.5} step={0.01}
          value={inputs.poreVolume} onChange={v => setInputs(p => ({ ...p, poreVolume: v }))}
          helper={lang === "zh" ? "孔体积影响高压容量；不要单独用它判断选择性。" : "Pore volume affects higher-pressure capacity; do not use it alone to judge selectivity."} />

        <label style={labelStyle}>{c.structure.functionalGroups}</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
          {FUNCTIONAL_GROUPS.map(fg => (
            <label key={fg.value} title={zhText(lang, fg.category)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
              color: inputs.functionalGroups.includes(fg.value) ? t.accentSoft : t.subtle, fontSize: 11 }}>
              <input type="checkbox" checked={inputs.functionalGroups.includes(fg.value)}
                onChange={() => toggleFG(fg.value)}
                style={{ accentColor: t.accent, width: 13, height: 13 }} />
              {fg.label}
            </label>
          ))}
        </div>
        <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
          {getFunctionalGroupEntries(inputs).map(({ value, meta, detail }) => (
            <div key={value} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800 }}>{meta.label}</div>
                  <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.4 }}>{zhText(lang, meta.category)}</div>
                </div>
                <BasisBadge tone="user">{lang === "zh" ? "用户定义" : "user-defined"}</BasisBadge>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "86px minmax(0, 1fr)", gap: 9, alignItems: "center" }}>
                <div>
                  <label style={{ ...labelStyle, marginBottom: 4 }}>{lang === "zh" ? "数量" : "Count"}</label>
                  <select
                    value={detail.count}
                    onChange={e => {
                      const count = Math.max(0, Math.min(4, parseInt(e.target.value, 10) || 0))
                      updateFGDetail(value, {
                        count,
                        positions: count === 0 ? [] : detail.positions.length >= count ? detail.positions.slice(0, count) : defaultGroupPositions(count),
                      })
                    }}
                    style={{ ...selectStyle, padding: "6px 8px", fontSize: 12 }}
                  >
                    {[
                      [0, lang === "zh" ? "0 / 无效" : "0 / none"],
                      [1, lang === "zh" ? "1 / 单取代" : "1 / mono"],
                      [2, lang === "zh" ? "2 / 双取代" : "2 / di"],
                      [3, lang === "zh" ? "3 / 三取代" : "3 / tri"],
                      [4, lang === "zh" ? "4 / 四取代" : "4 / tetra"],
                    ].map(([count, label]) => <option key={count} value={count}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ ...labelStyle, marginBottom: 4 }}>
                    {lang === "zh" ? "芳环取代位置" : "Aromatic positions"}
                  </label>
                  <select
                    value={detail.count === 1 && detail.positions.join(",") === "2" ? "mono-2" : detail.count === 2 && detail.positions.join(",") === "2,5" ? "di-2,5" : detail.count === 2 && detail.positions.join(",") === "2,3" ? "di-2,3" : "custom"}
                    onChange={e => {
                      const pattern = e.target.value
                      if (pattern === "mono-2") updateFGDetail(value, { count: 1, positions: ["2"] })
                      if (pattern === "di-2,5") updateFGDetail(value, { count: 2, positions: ["2", "5"] })
                      if (pattern === "di-2,3") updateFGDetail(value, { count: 2, positions: ["2", "3"] })
                    }}
                    style={{ ...selectStyle, padding: "6px 8px", fontSize: 12, marginBottom: 6 }}
                  >
                    <option value="mono-2">mono-2</option>
                    <option value="di-2,5">di-2,5</option>
                    <option value="di-2,3">di-2,3</option>
                    <option value="custom">{lang === "zh" ? "自定义 / 实验性" : "custom / experimental"}</option>
                  </select>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {AROMATIC_SUBSTITUTION_POSITIONS.map(pos => {
                      const active = (functionalGroupDetails[value]?.positions || []).includes(pos)
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => toggleFGPosition(value, pos)}
                          style={{
                            minWidth: 30,
                            height: 26,
                            borderRadius: 6,
                            border: `1px solid ${active ? t.accent : t.border}`,
                            background: active ? t.badgeInfoBg : t.panel,
                            color: active ? t.accentText : t.subtle,
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                            fontFamily: FONT_MONO,
                          }}
                        >
                          {pos}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.4, marginTop: 5 }}>
                    {lang === "zh"
                      ? `当前：${detail.positions.length ? detail.positions.join(", ") : "无"}；最多按数量选择 ${detail.count} 个位置。`
                      : `Current: ${detail.positions.length ? detail.positions.join(", ") : "none"}; up to ${detail.count} selected positions.`}
                  </div>
                </div>
              </div>
              <div style={{ color: t.warn, fontSize: 10, lineHeight: 1.45, marginTop: 8 }}>
                {lang === "zh"
                  ? "取代数量目前作为筛选级结构修饰符处理；位置标注目前只支持少数基准连接体模式，仍属实验性。"
                  : "Substituent count is currently treated as a screening-level structural modifier. Positional annotation is currently supported only for selected benchmark linker patterns and remains experimental."}
              </div>
            </div>
          ))}
          {!getFunctionalGroupEntries(inputs).length && (
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45, background: t.surface, border: `1px dashed ${t.border}`, borderRadius: 8, padding: 10 }}>
              {lang === "zh"
                ? "选择一个官能团后，可设置数量并标注 2/3/5/6 号取代位置。"
                : "Select a functional group to set count and mark 2/3/5/6 substitution positions."}
            </div>
          )}
        </div>

        <LinkerSubstitutionPreview inputs={inputs} linker={linker} />

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{c.structure.temperature}</label>
            <input type="number" value={inputs.temperature} min={200} max={400}
              onChange={e => setInputs(p => ({ ...p, temperature: parseInt(e.target.value)||298 }))}
              style={numInputStyle} />
            <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.4, marginTop: 4 }}>
              {lang === "zh" ? "默认 298 K；温度会改变等温线与 Qst 解释。" : "Default 298 K; temperature changes isotherm and Qst interpretation."}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{c.structure.pressure}</label>
            <input type="number" value={inputs.pressure} min={0.01} max={50} step={0.01}
              onChange={e => setInputs(p => ({ ...p, pressure: parseFloat(e.target.value)||0.15 }))}
              style={numInputStyle} />
            <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.4, marginTop: 4 }}>
              {lang === "zh" ? "默认 0.15 bar，适合燃烧后 CO2 筛选情景。" : "Default 0.15 bar for post-combustion CO2 screening context."}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{c.structure.mlAlgorithm}</label>
          <select value={inputs.mlAlgorithm}
            onChange={e => setInputs(p => ({ ...p, mlAlgorithm: e.target.value }))}
            style={selectStyle}>
            <option value="ensemble">{lang === "zh" ? "集成基线（稳定默认）" : "Ensemble baseline (stable default)"}</option>
            <option value="rf">{lang === "zh" ? "Random Forest（原型配置）" : "Random Forest (prototype profile)"}</option>
            <option value="gbm">{lang === "zh" ? "Gradient Boosting（实验配置）" : "Gradient Boosting (experimental profile)"}</option>
            <option value="gnn">{lang === "zh" ? "Graph Neural Network（Coming soon 脚手架）" : "Graph Neural Network (coming-soon scaffold)"}</option>
          </select>
          <div style={{ fontSize: 10, color: t.warn, marginTop: 4, lineHeight: 1.5 }}>
            {c.structure.algoNote}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            <BasisBadge tone={inputs.mlAlgorithm === "ensemble" ? "calc" : "proxy"}>
              {(MODEL_PROFILES[inputs.mlAlgorithm] || MODEL_PROFILES.ensemble).status}
            </BasisBadge>
            <span style={{ color: t.faint, fontSize: 10, lineHeight: 1.7 }}>
              {lang === "zh"
                ? "切换算法目前改变浏览器端预测 profile；未完成独立重训验证的选项不会作为等价生产模型展示。"
                : "Switching currently changes the browser-side prediction profile; options without independent retraining are not presented as equivalent production models."}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ color: t.textStrong, fontSize: 12, fontWeight: 800 }}>
              {lang === "zh" ? "后端预测连接" : "Backend prediction"}
            </span>
            <BasisBadge tone={apiStatus?.ok ? "calc" : "proxy"}>
              {apiStatus?.ok ? zhText(lang, "API connected") : zhText(lang, "static fallback")}
            </BasisBadge>
          </div>
          <input
            value={apiUrl}
            onChange={e => setApiUrl(e.target.value.trim())}
            placeholder="http://127.0.0.1:8000"
            style={{ ...numInputStyle, fontSize: 11, fontFamily: FONT_MONO, marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" onClick={onCheckApi} style={{ ...toolbarBtn(t), padding: "5px 8px", fontSize: 11 }}>
              {lang === "zh" ? "检查 API" : "Check API"}
            </button>
            <span style={{ color: apiStatus?.ok ? t.success : apiStatus?.checked ? t.warn : t.faint, fontSize: 10, lineHeight: 1.45 }}>
              {apiStatus?.message
                ? zhText(lang, apiStatus.message)
                : lang === "zh" ? "填写本地 FastAPI 地址前，将使用浏览器端模型。" : "Browser model is used until a local FastAPI URL is provided."}
            </span>
          </div>
          {apiStatus?.manifest && (
            <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.45, marginTop: 7 }}>
              {lang === "zh" ? "清单" : "manifest"}: {apiStatus.manifest.origin || "—"} · {lang === "zh" ? "行数" : "rows"} {apiStatus.manifest.rows ?? "—"}
            </div>
          )}
        </div>

        <button onClick={onPredict} disabled={loading || gas.priority === "unavailable"}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 6, border: "none",
            cursor: (loading || gas.priority === "unavailable") ? "not-allowed" : "pointer",
            background: (loading || gas.priority === "unavailable") ? t.border : `linear-gradient(135deg, ${t.accentStrong}, ${t.accent})`,
            color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "0.06em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s", marginBottom: 10,
          }}>
          {loading ? `⏳ ${c.structure.computing}` :
           gas.priority === "unavailable" ? c.structure.unsupported : `▶ ${c.structure.run}`}
        </button>

        <button onClick={() => setInputs({ ...DEFAULT_INPUTS })}
          style={{ background: "none", border: "none", color: t.faint, fontSize: 11, cursor: "pointer" }}>
          ↺ {c.structure.reset}
        </button>

        <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${t.divider}` }}>
          <label style={labelStyle}>{c.structure.cifUpload}</label>
          <label style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "9px 10px", borderRadius: 6,
            border: `1px dashed ${t.borderStrong}`, background: t.surface,
            color: t.accentSoft, fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            ⬆ {c.structure.cifButton}
            <input type="file" accept=".cif,.txt" style={{ display: "none" }}
              onChange={e => handleCifUpload(e.target.files?.[0])} />
          </label>
          {cifInfo && (
            <div style={{ marginTop: 10, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
              <div style={{ color: t.success, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                {c.structure.cifParsed}: {cifInfo.fileName}
              </div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>
                {lang === "zh" ? "数据" : "data"}: {cifInfo.name || "—"}<br />
                {lang === "zh" ? "晶胞" : "cell"}: {[cifInfo.cell.a, cifInfo.cell.b, cifInfo.cell.c].filter(Number.isFinite).join(" / ") || "—"} Å
              </div>
              <div style={{ color: Object.keys(cifInfo.descriptors).length ? t.success : t.warn, fontSize: 10, lineHeight: 1.5, marginTop: 6 }}>
                {Object.keys(cifInfo.descriptors).length ? c.structure.cifApplied : c.structure.cifNoDescriptors}
              </div>
              <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.5, marginTop: 6 }}>
                {c.structure.cifDescriptorWorkflow}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Center: Results Panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        {!results ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: t.panel, border: `1px dashed ${t.border}`, borderRadius: 10, minHeight: 400 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⬡</div>
            <div style={{ color: t.accentText, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{c.structure.readyTitle}</div>
            <div style={{ color: t.faint, fontSize: 13, textAlign: "center", maxWidth: 360 }}>
              {c.structure.readyBody}<br />
              <strong style={{ color: t.accentSoft }}>{c.structure.run}</strong>.
            </div>
            <button type="button" onClick={() => onLoadBenchmark?.("UiO-66")}
              style={{ ...toolbarBtn(t), marginTop: 16, background: t.accent, borderColor: t.accent, color: "#fff", padding: "9px 13px" }}>
              {lang === "zh" ? "载入 UiO-66 基准示例" : "Load UiO-66 benchmark example"}
            </button>
            <div style={{ color: t.faint, fontSize: 10, marginTop: 8 }}>
              {lang === "zh" ? "这是基准示例，不是用户提交的新设计。" : "Benchmark example, not a user-submitted design."}
            </div>
          </div>
        ) : results.unavailable ? (
          <Callout tone="warn">
            <strong>{c.structure.gasUnavailable}</strong> {results.message}
          </Callout>
        ) : (
          <>
            {/* Results Header */}
            <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 18px",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ color: t.muted, fontSize: 12 }}>{c.structure.resultTitle} / </span>
                <span style={{ color: t.accentText, fontSize: 12, fontWeight: 600 }}>{results.gasSystem}</span>
                <span style={{ marginLeft: 10, color: t.faint, fontSize: 11 }}>
                  {c.structure.latency}: {results.latencyMs} ms · {c.structure.confidence}: {(results.confidenceScore * 100).toFixed(0)}%
                  {" · "}{c.structure.applicability}: {results.applicability?.warnings?.length ? c.structure.caution : c.structure.inDomain}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button onClick={exportCSV}
                  style={{ background: t.border, border: `1px solid ${t.borderStrong}`, borderRadius: 4, color: t.accentSoft,
                    fontSize: 11, padding: "5px 10px", cursor: "pointer" }}>
                  ↓ {c.structure.export}
                </button>
                <button onClick={onSaveRun}
                  style={{ background: t.border, border: `1px solid ${t.borderStrong}`, borderRadius: 4, color: t.success,
                    fontSize: 11, padding: "5px 10px", cursor: "pointer" }}>
                  + {c.common.saveRun}
                </button>
              </div>
            </div>

            {results.anomaly && (
              <Callout tone="warn">
                <strong>{results.anomaly.label}</strong>
                <br /><span style={{ opacity: 0.85 }}>{results.anomaly.reason}</span>
              </Callout>
            )}

            {results.applicability?.warnings?.length > 0 && (
              <Callout tone="warn">
                <strong>{c.structure.applicability}: {c.structure.caution}</strong>
                <br /><span style={{ opacity: 0.9 }}>
                  {results.applicability.warnings.slice(0, 3).map(w => w.message).join(" ")}
                </span>
              </Callout>
            )}

            <ResultLayer
              number="01"
              title={lang === "zh" ? "结果是什么？" : "What is the result?"}
              subtitle={lang === "zh" ? "先看 Stage 1 的吸附、选择性和置信状态。" : "Start with the Stage 1 uptake, selectivity, and confidence status."}
            >
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
              <MetricCard label={`${results.primaryName.toUpperCase()} ${c.structure.adsorptionCapacity}`}
                value={results.primaryUptake} unit="mmol/g"
                badge={perf?.label} badgeColor={perf?.color} badgeBg={perf?.bg} />
              <MetricCard label={`${results.secondaryName.toUpperCase()} ${c.structure.uptake}`}
                value={results.secondaryUptake} unit="mmol/g" />
              <MetricCard label={`${results.primaryName}/${results.secondaryName} ${c.structure.selectivity}`}
                value={results.selectivity}
                comparison={`${results.selectivity > 30 ? "+" : ""}${((results.selectivity / 30 - 1) * 100).toFixed(1)}% vs 30`} />
            </div>
            </ResultLayer>

            <ResultLayer
              number="02"
              title={lang === "zh" ? "为什么会这样？" : "Why does it look this way?"}
              subtitle={lang === "zh" ? "用等温线、选择性方法和结构驱动因素解释结果。" : "Interpret the result through isotherm shape, selectivity method, and structural drivers."}
            >
            {results.selectivityDetails && (
              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
                  <SectionTitle>{c.methods.selectivity}</SectionTitle>
                  <BasisBadge tone="proxy">{c.common.basisProxy}</BasisBadge>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
                  {[
                    ["Apparent", results.selectivityDetails.apparent],
                    ["Henry proxy", results.selectivityDetails.henry],
                    ["IAST proxy", results.selectivityDetails.iast],
                    ["Method", results.selectivityDetails.method],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
                      <div style={{ color: t.faint, fontSize: 10, marginBottom: 5 }}>{zhText(lang, label)}<InfoTip text={label === "Method" ? c.methods.formulaIastBody : c.methods.selectivityBody1} /></div>
                      <div style={{ color: t.textStrong, fontSize: label === "Method" ? 11 : 18, fontWeight: 800, fontFamily: label === "Method" ? FONT_SANS : FONT_MONO, lineHeight: 1.35 }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 10 }}>
                  {c.methods.selectivityBody2}
                </div>
              </div>
            )}

            {/* Charts Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ color: t.muted, fontSize: 11, marginBottom: 12, letterSpacing: "0.06em" }}>
                  {c.structure.isotherm}
                </div>
                <ResponsiveContainer width="100%" height={isNarrow ? 210 : 245}>
                  <LineChart data={results.isothermData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                    <XAxis dataKey="pressure" stroke={t.faint} tick={{ fill: t.subtle, fontSize: 10 }} label={{ value: "Pressure (bar)", fill: t.subtle, fontSize: 10, dy: 10 }} />
                    <YAxis stroke={t.faint} tick={{ fill: t.subtle, fontSize: 10 }} label={{ value: "mmol/g", fill: t.subtle, fontSize: 10, angle: -90, dx: -10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: t.subtle }} />
                    <Line type="monotone" dataKey="predicted"  stroke={t.accent} strokeWidth={2.5} dot={false} name="ML Predicted" />
                    <Line type="monotone" dataKey="literature" stroke={t.subtle} strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Literature Ref." />
                  </LineChart>
                </ResponsiveContainer>
                <HowToRead>
                  {lang === "zh"
                    ? "曲线显示预测吸附量随压力变化；虚线文献参考只作方向性对照，不代表同一严格实验条件。"
                    : "The curve shows predicted uptake versus pressure; the dashed literature reference is directional context, not a matched experimental condition."}
                </HowToRead>
              </div>

              <Callout tone="info">
                <strong>{lang === "zh" ? "为什么这个阶段先开始：" : "Why this stage comes first:"}</strong>{" "}
                {lang === "zh"
                  ? "早期材料筛选应以性能和化学合理性为中心。更宽的成本与生命周期标准只在形成初筛候选后引入。"
                  : "Early-stage materials screening should remain performance- and chemistry-centered. Broader cost and lifecycle criteria are introduced only after an initial filter exists."}
              </Callout>
            </div>
            </ResultLayer>

            <ResultLayer
              number="03"
              title={lang === "zh" ? "应该相信多少？" : "How much should I trust it?"}
              subtitle={lang === "zh" ? "把模型依据、来源类型和限制与结果分开阅读。" : "Read model basis, source type, and limitations separately from the result."}
            >
            <ProvenanceGrid items={[
              { label: "Basis", value: "Empirical heuristic model (browser-side)", type: "proxy", note: "Hand-crafted correlations based on CoRE MOF 2019 benchmarks. Not a trained ML model on this device." },
              { label: "Source type", value: "Seed benchmark + descriptor input", type: "benchmark", note: lang === "zh" ? `MOF 预设、CIF 派生字段或用户输入。官能团：${formatFunctionalGroupSummary(inputs, lang)}` : `MOF presets, CIF-derived fields, or user input. Groups: ${formatFunctionalGroupSummary(inputs, lang)}` },
              { label: "Quality", value: results.applicability?.warnings?.length ? "Medium-low" : "Medium", type: "proxy", note: results.applicability?.warnings?.length ? "Applicability warning present." : "Within prototype descriptor range." },
              { label: "Limitation", value: "Screening-level only", type: "proxy", note: "Not a strict IAST/GCMC or experimental result." },
            ]} />
            <ResultProvenanceDrawer results={results} inputs={inputs} />
            </ResultLayer>

            <NextStepCTA
              label={lang === "zh" ? "下一步：检查可行性边界" : "Next: check feasibility boundaries"}
              body={lang === "zh" ? "性能和化学筛选之后，再看成本、供应与可得性是否形成早期阻断。" : "After performance and chemistry screening, check whether cost, supply, or availability creates an early boundary."}
              actionLabel={lang === "zh" ? "进入可行性" : "Proceed to feasibility"}
              onClick={() => setActiveTab?.("feasibility")}
            />

            {/* Footer Badges */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
              {[
                { icon: "📊", title: c.structure.dataSource, desc: "Structure: public/data/mof_structures.json", sub: "Seed schema includes source_database, source_record, descriptor_method, CIF status" },
                { icon: "🤖", title: c.structure.mlArchitecture, desc: "Model: browser profile + optional FastAPI /predict", sub: "Training scaffold reads data/adsorption_labels.csv and writes RF/GBM artifacts" },
                { icon: "🌿", title: c.structure.lcaFramework, desc: "LCA/LCC: public/data/lca_inventory.json", sub: "Proxy inventory now has source_type, assumption, uncertainty, and roadmap replacement" },
              ].map(({ icon, title, desc, sub }) => (
                <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 14px",
                  display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div>
                    <div style={{ color: t.accentText, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em" }}>{title}</div>
                    <div style={{ color: t.muted, fontSize: 11, marginTop: 2 }}>{desc}</div>
                    <div style={{ color: t.faint, fontSize: 10, marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Right: Interpretation Sidebar ── */}
      <aside style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, boxShadow: t.shadowSm, backdropFilter: "blur(18px) saturate(135%)", position: isNarrow ? "static" : "sticky", top: 74 }}>
        <Callout tone="info">
          <strong>{lang === "zh" ? "为什么这个阶段先开始" : "Why this stage comes first"}</strong>
          <br />
          {lang === "zh"
            ? "早期材料筛选应以性能和化学合理性为中心。更宽的成本与生命周期标准只在形成初筛候选后引入。"
            : "Early-stage materials screening should remain performance- and chemistry-centered. Broader cost and lifecycle criteria are introduced only after an initial filter exists."}
        </Callout>
        <div style={{ height: 12 }} />
        <SectionTitle>{lang === "zh" ? "解释与下一步" : "Interpretation & Next Steps"}</SectionTitle>
        <div style={{ display: "grid", gap: 10 }}>
          {decisionTips.map(([title, body], index) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 7 }}>
                <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800 }}>{title}</div>
                <BasisBadge tone={index === 1 && hasUsableResults ? "calc" : "info"}>{index + 1}</BasisBadge>
              </div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.6 }}>{body}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {[
            ["interpretation", lang === "zh" ? "机理解释" : "Mechanism"],
            ["feasibility", lang === "zh" ? "可行性边界" : "Feasibility"],
            ["lca", lang === "zh" ? "入围候选 LCA/LCC" : "Shortlist LCA/LCC"],
            ["sensitivity", lang === "zh" ? "稳健性" : "Robustness"],
            ["validation", lang === "zh" ? "验证依据" : "Validation"],
          ].map(([tab, label]) => (
            <button key={tab} type="button" onClick={() => setActiveTab?.(tab)}
              style={{ ...toolbarBtn(t), justifyContent: "space-between", width: "100%", padding: "8px 10px" }}>
              <span>{label}</span>
              <span style={{ color: t.faint }}>→</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12, color: t.faint, fontSize: 10, lineHeight: 1.55 }}>
          {lang === "zh"
            ? "页面布局按输入、结果、解释三列组织，目的是让用户按研究判断链阅读，而不是只看一个预测数字。"
            : "This three-column layout follows input, result, and interpretation so the workflow supports decisions instead of isolated numbers."}
        </div>
      </aside>
    </div>
      <Callout tone="info">
        {lang === "zh"
          ? "来源依据：结构参数来自用户输入、MOF 预设或 CIF 解析；吸附结果为模型/代理筛选输出；LCA/LCC 由代理清单与用户参数计算。"
          : "Source basis: descriptors come from user input, MOF presets, or CIF parsing; adsorption results are model/proxy screening outputs; LCA/LCC uses proxy inventory plus user-defined assumptions."}
      </Callout>
    </div>
  )
}
