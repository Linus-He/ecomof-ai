// @ts-nocheck
import { useState, useEffect } from "react"
import {
  BarChart, Bar, ScatterChart, Scatter, ZAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts"
import {
  useT, useLang, useViewport,
  FONT_MONO, CURRENCIES,
  zhText, toolbarBtn,
  fetchDataJson, formatCurrency,
  buildDecisionModel, downloadTextFile, buildReportHtml, buildDecisionReport, exportChartPng,
  MetricCard, BasisBadge, SectionTitle, EmptyState, ResultLayer, HowToRead, InfoTip, NextStepCTA,
  ProvenanceGrid, Callout, MethodDrawer, WindRoseChart,
} from "../../shared"

export function LCAScoringTab({ results, inputs, onNavigate }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow } = useViewport()
  const [currencyCode, setCurrencyCode] = useState("USD")
  const [inventoryRows, setInventoryRows] = useState([])
  const [lcaParams, setLcaParams] = useState({
    electricityPrice: 0.12,
    solventRecovery: 80,
    materialLifetime: 10,
    regenerationCycles: 1000,
    metalPrice: 24,
    linkerPrice: 31,
  })
  useEffect(() => {
    let active = true
    fetchDataJson("lca_inventory.json")
      .then(rows => { if (active) setInventoryRows(rows) })
      .catch(() => { if (active) setInventoryRows([]) })
    return () => { active = false }
  }, [])
  if (!results || results.unavailable) return <EmptyState message={c.lca.empty} />
  const { lca } = results
  const decision = buildDecisionModel(results, inputs, c)
  const { categories, indicatorData, roseColors, windRoseData, sensitivityRadarData, lccBreakdown,
    totalLcc, unitCost, dominantImpact, dominantCost, mostSensitive, tradeoffData } = decision
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  const convertedBreakdown = lccBreakdown.map(item => ({
    ...item,
    convertedValue: Number((item.value * currency.rate).toFixed(currencyCode === "JPY" ? 0 : 1)),
  }))
  const scoreColor = (s) => s >= 7 ? t.success : s >= 5 ? t.accent : s >= 3 ? t.warn : t.danger
  const chartCardStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }
  const detailStyle = { marginTop: 8, color: t.faint, fontSize: 11, lineHeight: 1.55 }
  const paramFactor =
    (lcaParams.electricityPrice / 0.12) * 0.14 +
    ((100 - lcaParams.solventRecovery) / 20) * 0.16 +
    (10 / Math.max(1, lcaParams.materialLifetime)) * 0.10 +
    (1000 / Math.max(100, lcaParams.regenerationCycles)) * 0.08 +
    (lcaParams.metalPrice / 24) * 0.26 +
    (lcaParams.linkerPrice / 31) * 0.26
  const adjustedLcc = Number((totalLcc * paramFactor).toFixed(1))
  const adjustedGreenScore = Number(Math.max(0, Math.min(10, lca.compositeGreenScore + (lcaParams.solventRecovery - 80) * 0.018 - (lcaParams.electricityPrice - 0.12) * 3.2)).toFixed(1))
  const displayMoney = (valueUsd, digits = 1) => formatCurrency(valueUsd, currencyCode, digits)
  const displayPrice = (valueUsd, digits = 2) => Number((Number(valueUsd) * currency.rate).toFixed(currencyCode === "JPY" ? 0 : digits))
  const updatePriceParam = (key, valueInCurrency) => {
    const usdValue = Number(valueInCurrency) / currency.rate
    setLcaParams(prev => ({ ...prev, [key]: Number.isFinite(usdValue) ? usdValue : prev[key] }))
  }
  const lcaParamRows = [
    ["electricityPrice", lang === "zh" ? `电价（${currency.unit}/kWh）` : `Electricity price (${currency.unit}/kWh)`, displayPrice(lcaParams.electricityPrice, 3), 0.01, 0.5 * currency.rate, 0.01, "price"],
    ["solventRecovery", lang === "zh" ? "溶剂回收率（%）" : "Solvent recovery (%)", lcaParams.solventRecovery, 0, 99, 1, "plain"],
    ["materialLifetime", lang === "zh" ? "材料寿命（年）" : "Material lifetime (years)", lcaParams.materialLifetime, 1, 30, 1, "plain"],
    ["regenerationCycles", lang === "zh" ? "再生循环次数" : "Regeneration cycles", lcaParams.regenerationCycles, 100, 10000, 100, "plain"],
    ["metalPrice", lang === "zh" ? `金属前驱体（${currency.unit}/kg）` : `Metal precursor (${currency.unit}/kg)`, displayPrice(lcaParams.metalPrice, 1), 1, 500 * currency.rate, 1, "price"],
    ["linkerPrice", lang === "zh" ? `连接体价格（${currency.unit}/kg）` : `Linker price (${currency.unit}/kg)`, displayPrice(lcaParams.linkerPrice, 1), 1, 800 * currency.rate, 1, "price"],
  ]
  const sourceRows = inventoryRows.length ? inventoryRows : [
    { flow: "metal precursor", unit: "kg/kg_mof", price_usd_per_unit: 24, source_type: "proxy", source_ref: "seed-inventory", assumption: "Metal burden scaled by selected node", roadmap_replacement: "Replace with supplier-specific LCI and price database", price_source: "Screening seed value" },
    { flow: "organic linker", unit: "kg/kg_mof", price_usd_per_unit: 31, source_type: "proxy", source_ref: "seed-inventory", assumption: "Linker burden scaled by linker class", roadmap_replacement: "Replace with synthesis-specific LCI and purchase price", price_source: "Screening seed value" },
    { flow: "electricity", unit: "kWh/kg_mof", price_usd_per_unit: 0.12, source_type: "proxy", source_ref: "seed-inventory", assumption: "Grid electricity default", roadmap_replacement: "Replace with regional grid mix", price_source: "Regional proxy" },
  ]
  const summaryCards = [
    { label: c.lca.environmentalBurden, value: c.lca.medium, sub: `${c.lca.dominatedBy}: ${dominantImpact.name}` },
    { label: c.lca.normalizedImpact, value: dominantImpact.name, sub: dominantImpact.def },
    { label: c.lca.lcc, value: displayMoney(totalLcc), sub: `${c.lca.mainCost}: ${dominantCost.name}` },
    { label: c.lca.influentialFactor, value: mostSensitive.label, sub: `${c.lca.deltaScore}: ${mostSensitive.value.toFixed(1)}` },
    { label: c.lca.tradeoffStatus, value: results.primaryUptake > 3 && lca.compositeGreenScore > 6 ? c.lca.acceptable : c.lca.assumptionSensitive, sub: c.lca.tradeoffBody },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, color: t.textStrong, fontSize: 24, letterSpacing: 0 }}>{c.lca.pageTitle}</h1>
          <p style={{ margin: "6px 0 0", color: t.muted, fontSize: 13, maxWidth: 760, lineHeight: 1.6 }}>{c.lca.pageSubtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => downloadTextFile(`ecomof_decision_${inputs.mofName || inputs.metalCenter}.md`, buildDecisionReport(results, inputs, decision, c), "text/markdown")} style={toolbarBtn(t)}>↓ {c.common.exportReport}</button>
          <button onClick={() => downloadTextFile(`ecomof_decision_${inputs.mofName || inputs.metalCenter}.html`, buildReportHtml(results, inputs, decision, c, lcaParams), "text/html")} style={toolbarBtn(t)}>↓ {lang === "zh" ? "HTML/PDF 模板" : "HTML/PDF template"}</button>
          <button onClick={() => window.print()} style={toolbarBtn(t)}>⎙ {c.common.printPdf}</button>
        </div>
      </div>
      <Callout tone="warn">{c.lca.pageSubtitle} {lang === "zh" ? "它不用于替代早期科学筛选，也不用于工程级经济结论。" : "This page is intended for secondary comparison after an initial performance/stability filter."}</Callout>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", marginBottom: 6 }}>{lang === "zh" ? "功能单位" : "Functional unit"}</div>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800, lineHeight: 1.45 }}>{c.lca.functionalUnitBody}</div>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", marginBottom: 6 }}>{lang === "zh" ? "系统边界" : "System boundary"}</div>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800, lineHeight: 1.45 }}>{c.lca.systemBoundaryBody}</div>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", marginBottom: 6 }}>{lang === "zh" ? "解读规则" : "Interpretation rule"}</div>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800, lineHeight: 1.45 }}>
            {lang === "zh"
              ? "不要只读 Eco-score。必须同时看 characterization、normalization、LCC 和假设来源。"
              : "Do not read the Eco-score alone. Always inspect characterization, normalization, LCC, and assumption basis together."}
          </div>
        </div>
      </div>
      <ResultLayer number="01" title={lang === "zh" ? "核心结果" : "Key Outputs"} subtitle={lang === "zh" ? "先看入围候选的负担、成本压力和最敏感输入。" : "Start with shortlist burden, cost pressure, and the most sensitive input."}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))", gap: 10 }}>
          {summaryCards.map(card => (
            <div key={card.label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, minHeight: 118 }}>
              <div style={{ color: t.faint, fontSize: 10, marginBottom: 8, textTransform: "uppercase" }}>{card.label}</div>
              <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 800, lineHeight: 1.25 }}>{card.value}</div>
              <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.45, marginTop: 8 }}>{card.sub}</div>
              <div style={{ marginTop: 10 }}>
                <BasisBadge tone={card.label === c.lca.lcc || card.label === c.lca.environmentalBurden ? "proxy" : "calc"}>
                  {card.label === c.lca.lcc ? c.common.basisProxy : c.common.basisCalculated}
                </BasisBadge>
              </div>
            </div>
          ))}
        </div>
      </ResultLayer>
      <ResultLayer number="02" title={lang === "zh" ? "权衡分析" : "Trade-off Interpretation"} subtitle={lang === "zh" ? "用性能、负担和成本三者的权衡解释入围候选差异。" : "Explain shortlist differences through performance, burden, and cost trade-offs."}>
        <div style={{ ...chartCardStyle, background: t.chartBg, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap" }}>
            <div>
              <SectionTitle>{c.lca.tradeoff}</SectionTitle>
              <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, maxWidth: 820 }}>{c.lca.tradeoffBody} {c.lca.basisBody}</div>
            </div>
            <BasisBadge tone="proxy">{c.common.basisProxy}</BasisBadge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) 280px", gap: 18, alignItems: "center" }}>
            <ResponsiveContainer width="100%" height={420}>
              <ScatterChart margin={{ top: 18, right: 24, bottom: 26, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                <XAxis type="number" dataKey="performance" name={zhText(lang, "Performance")} tick={{ fill: t.subtle, fontSize: 11 }} label={{ value: zhText(lang, "Adsorption performance"), fill: t.subtle, fontSize: 11, dy: 18 }} />
                <YAxis type="number" dataKey="burden" name={zhText(lang, "LCA burden")} tick={{ fill: t.subtle, fontSize: 11 }} label={{ value: zhText(lang, "LCA burden"), fill: t.subtle, fontSize: 11, angle: -90, dx: -10 }} />
                <ZAxis type="number" dataKey="cost" range={[180, 980]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
                <Scatter name={inputs.mofName || zhText(lang, "Current MOF")} data={tradeoffData} fill={t.accent} />
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ display: "grid", gap: 10 }}>
              <MetricCard label={c.lca.totalLcc} value={displayMoney(totalLcc)} unit="/kg MOF" />
              <MetricCard label={c.lca.environmentalBurden} value={dominantImpact.name} unit="" comparison={dominantImpact.def} />
              <MetricCard label={c.lca.influentialFactor} value={mostSensitive.label} unit="" comparison={`${c.lca.deltaScore}: ${mostSensitive.value.toFixed(1)}`} />
            </div>
          </div>
          <HowToRead>{lang === "zh" ? "横轴是性能，纵轴是负担，点大小代表成本；这只适合同一入围集合内的粗比较。" : "X is performance, Y is burden, and point size is cost; use it only for coarse comparison within the same shortlist."}</HowToRead>
        </div>
      </ResultLayer>

      <div style={chartCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <SectionTitle>{lang === "zh" ? "用户定义 LCA / LCC 参数表" : "User-defined LCA / LCC parameter table"}</SectionTitle>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>{lang === "zh" ? "筛选级情景控制项。" : "Screening-level scenario controls."} {c.lca.currencyNote}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select value={currencyCode} onChange={e => setCurrencyCode(e.target.value)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "6px 9px", color: t.text, fontSize: 12, outline: "none" }}>
              {Object.keys(CURRENCIES).map(code => <option key={code} value={code}>{code}</option>)}
            </select>
            <BasisBadge tone="user">{c.common.basisUserDefined}</BasisBadge>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) 260px", gap: 14, alignItems: "start" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: t.surface }}>
                  {["Parameter", "Value", "Control"].map(h => <th key={h} style={{ padding: "9px 10px", color: t.subtle, fontSize: 11, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>{zhText(lang, h)}</th>)}
                </tr>
              </thead>
              <tbody>
                {lcaParamRows.map(([key, label, value, min, max, step, kind]) => (
                  <tr key={key} style={{ borderBottom: `1px solid ${t.divider}` }}>
                    <td style={{ padding: "8px 10px", color: t.muted, fontSize: 12 }}>{label}</td>
                    <td style={{ padding: "8px 10px", color: t.textStrong, fontSize: 12, fontFamily: FONT_MONO }}>{value}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <input type="number" min={min} max={max} step={step} value={value}
                        onChange={e => kind === "price" ? updatePriceParam(key, Number(e.target.value)) : setLcaParams(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                        style={{ width: 120, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, padding: "6px 8px", color: t.text, fontFamily: FONT_MONO }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <MetricCard label={zhText(lang, "Adjusted LCC")} value={displayMoney(adjustedLcc)} unit="/kg MOF" comparison={lang === "zh" ? `基准 ${displayMoney(totalLcc)}` : `base ${displayMoney(totalLcc)}`} />
            <MetricCard label={zhText(lang, "Adjusted eco score")} value={adjustedGreenScore} unit="/10" comparison={lang === "zh" ? `基准 ${lca.compositeGreenScore}/10` : `base ${lca.compositeGreenScore}/10`} />
          </div>
        </div>
      </div>

      <ProvenanceGrid items={[
        { label: "Stage", value: "Stage 3 — Secondary Comparison", type: "proxy", note: "Use only after Stage 1 screening and Stage 2 feasibility boundaries." },
        { label: "Source type", value: "LCA/LCC inventory seed", type: "benchmark", note: "public/data/lca_inventory.json with source fields." },
        { label: "Quality", value: "Medium-low", type: "proxy", note: "Traceable schema, not full industrial LCI." },
        { label: "Limitation", value: "Shortlist comparison only", type: "proxy", note: "Exploratory, assumption-dependent, and not engineering-grade." },
      ]} />

      <ResultLayer number="03" title={lang === "zh" ? "假设与局限" : "Assumptions and Limitations"} subtitle={lang === "zh" ? "检查假设、价格来源和清单限制。" : "Inspect assumptions, price sources, and inventory limits."}>
        <div style={chartCardStyle}>
          <SectionTitle>{lang === "zh" ? "两层成本逻辑" : "Two-layer cost logic"}</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 12, marginTop: 10 }}>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14, borderLeft: `3px solid ${t.lccAccent}` }}>
              <BasisBadge tone="proxy">{lang === "zh" ? "阶段 2 可行性边界" : "Stage 2 feasibility boundary"}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850, marginTop: 10 }}>{lang === "zh" ? "早期成本初筛" : "Early cost feasibility checks"}</div>
              <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.65, marginTop: 8 }}>{lang === "zh" ? "连接体可得性、近似成本带、前驱体稀缺性和尺度警告可以更早出现，作为可行性边界。" : "Linker availability, approximate cost band, precursor rarity, and scale warnings may appear earlier as feasibility boundaries."}</div>
            </div>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14, borderLeft: `3px solid ${t.lcaAccent}` }}>
              <BasisBadge tone="proxy">{lang === "zh" ? "第 3 阶段入围候选比较" : "Stage 3 shortlist comparison"}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850, marginTop: 10 }}>{lang === "zh" ? "初步比较型 LCC" : "Preliminary comparative LCC"}</div>
              <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.65, marginTop: 8 }}>{lang === "zh" ? "仅用于已入围候选的横向比较；依赖假设，不是详细工程经济学。" : "Only for shortlisted candidates; assumption-dependent and not detailed engineering economics."}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) 300px", gap: 16, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: isNarrow ? "column" : "row", gap: 20 }}>
              <div style={{ flex: 1, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20 }}>
                <SectionTitle>{c.lca.breakdown}</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {categories.map(category => (
                    <div key={category.name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "12px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10 }}>
                        <div><span style={{ color: t.muted, fontSize: 13 }}>{category.name}</span><span style={{ marginLeft: 8, color: t.faint, fontSize: 11 }}>{c.lca.weight}: {(category.weight * 100).toFixed(0)}%</span></div>
                        <span style={{ color: scoreColor(category.score), fontWeight: 700, fontSize: 15, fontFamily: FONT_MONO }}>{category.score.toFixed(1)}/10</span>
                      </div>
                      <div style={{ height: 5, background: t.border, borderRadius: 3, marginBottom: 6 }}>
                        <div style={{ height: "100%", width: `${category.score * 10}%`, background: scoreColor(category.score), borderRadius: 3, transition: "width 0.6s ease" }} />
                      </div>
                      <div style={{ color: t.faint, fontSize: 11 }}>{category.desc}</div>
                      <details style={detailStyle}>
                        <summary style={{ color: t.accentText, cursor: "pointer", fontSize: 11 }}>{c.lca.dataSource}</summary>
                        <div style={{ marginTop: 6 }}>{category.source}</div>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ width: isNarrow ? "100%" : 260, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20 }}>
                  <SectionTitle>{c.lca.composite}</SectionTitle>
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <div style={{ fontSize: 52, fontWeight: 800, fontFamily: FONT_MONO, color: scoreColor(lca.compositeGreenScore) }}>{lca.compositeGreenScore}</div>
                    <div style={{ color: t.subtle, fontSize: 13 }}>{c.lca.outOf}</div>
                  </div>
                  <div style={{ height: 8, background: t.border, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${lca.compositeGreenScore * 10}%`, background: `linear-gradient(90deg, ${t.accentStrong}, ${t.success})`, borderRadius: 4 }} />
                  </div>
                  <div style={{ marginTop: 12, color: t.subtle, fontSize: 12, textAlign: "center" }}>
                    {lca.compositeGreenScore >= 7 ? c.lca.recommended : lca.compositeGreenScore >= 5 ? c.lca.acceptable : c.lca.concern}
                  </div>
                </div>
              </div>
            </div>

            <div style={chartCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", marginBottom: 12 }}>
                <SectionTitle>{c.lca.analysisCharts}</SectionTitle>
                <span style={{ color: t.faint, fontSize: 11, lineHeight: 1.5, maxWidth: 520, textAlign: "right" }}>{c.lca.prototypeNote}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 14 }}>
                <div id="chart-characterization" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <div style={{ color: t.muted, fontSize: 12, fontWeight: 700 }}>{c.lca.characterization}<InfoTip text={c.common.tooltipCharacterization} /></div>
                    <button onClick={() => exportChartPng("chart-characterization", "ecomof-characterization.png")} style={{ ...toolbarBtn(t), padding: "3px 8px", fontSize: 10 }}>↓ {c.common.exportPng}</button>
                  </div>
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={indicatorData} margin={{ top: 8, right: 6, left: -20, bottom: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: t.subtle, fontSize: 10 }} interval={0} />
                      <YAxis tick={{ fill: t.subtle, fontSize: 10 }} />
                      <Tooltip formatter={(value) => [value, c.lca.relativeBurden]} contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
                      <Bar dataKey="value" name={c.lca.relativeBurden} radius={[4, 4, 0, 0]}>
                        {indicatorData.map((entry, index) => <Cell key={entry.name} fill={roseColors[index % roseColors.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5 }}>{c.lca.characterizationBody}</div>
                </div>
                <div id="chart-normalization" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <div style={{ color: t.muted, fontSize: 12, fontWeight: 700 }}>{c.lca.normalization}<InfoTip text={c.common.tooltipNormalization} /></div>
                    <button onClick={() => exportChartPng("chart-normalization", "ecomof-normalization.png")} style={{ ...toolbarBtn(t), padding: "3px 8px", fontSize: 10 }}>↓ {c.common.exportPng}</button>
                  </div>
                  <WindRoseChart data={windRoseData} />
                  <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5 }}>{c.lca.normalizationBody}</div>
                </div>
                <div id="chart-sensitivity" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <div style={{ color: t.muted, fontSize: 12, fontWeight: 700 }}>{c.lca.sensitivity}<InfoTip text={c.common.tooltipSensitivity} /></div>
                    <button onClick={() => exportChartPng("chart-sensitivity", "ecomof-sensitivity.png")} style={{ ...toolbarBtn(t), padding: "3px 8px", fontSize: 10 }}>↓ {c.common.exportPng}</button>
                  </div>
                  <ResponsiveContainer width="100%" height={210}>
                    <RadarChart data={sensitivityRadarData}>
                      <PolarGrid stroke={t.border} />
                      <PolarAngleAxis dataKey="indicator" tick={{ fill: t.subtle, fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: t.faint, fontSize: 9 }} />
                      <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
                      <Legend wrapperStyle={{ fontSize: 10, color: t.subtle }} />
                      <Radar name={c.lca.sensMetal} dataKey="metal" stroke={t.lcaAccent} fill={t.lcaAccent} fillOpacity={0.12} strokeWidth={2} />
                      <Radar name={c.lca.sensProcess} dataKey="process" stroke={t.sensitivityAccent} fill={t.sensitivityAccent} fillOpacity={0.10} strokeWidth={2} />
                      <Radar name={c.lca.sensSolvent} dataKey="solvent" stroke={t.accent} fill={t.accent} fillOpacity={0.10} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5 }}>{c.lca.sensitivityBody}</div>
                </div>
              </div>
            </div>

            <div style={chartCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
                <SectionTitle>{c.lca.costBreakdown}</SectionTitle>
                <BasisBadge tone="proxy">{currencyCode} · {c.common.basisProxy}</BasisBadge>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "260px minmax(0, 1fr)", gap: 16, alignItems: "center" }}>
                <div style={{ display: "grid", gap: 10 }}>
                  <MetricCard label={c.lca.totalLcc} value={displayMoney(totalLcc)} unit="/kg MOF" />
                  <MetricCard label={c.lca.unitCost} value={displayMoney(unitCost)} unit="/uptake" comparison={`${c.lca.mainCost}: ${dominantCost.name}`} />
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={convertedBreakdown} layout="vertical" margin={{ top: 8, right: 24, left: 95, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} horizontal={false} />
                    <XAxis type="number" tick={{ fill: t.subtle, fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: t.muted, fontSize: 11 }} width={96} />
                    <Tooltip formatter={(value) => [`${currency.symbol}${value}`, c.lca.lcc]} contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
                    <Bar dataKey="convertedValue" name={c.lca.lcc} fill={t.lccAccent} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                  <div><SectionTitle>{c.lca.priceSourceTitle}</SectionTitle><div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>{c.lca.priceSourceBody}</div></div>
                  <BasisBadge tone="proxy">public/data/lca_inventory.json</BasisBadge>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: t.panel }}>
                        {["Flow", "Unit", lang === "zh" ? `价格（${currencyCode}）` : `Price (${currencyCode})`, c.common.priceSource, c.common.sourceBasis, "Replacement"].map(header => (
                          <th key={header} style={{ padding: "8px 10px", color: t.subtle, fontSize: 11, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>{zhText(lang, header)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sourceRows.map(row => (
                        <tr key={row.inventory_id || row.flow} style={{ borderBottom: `1px solid ${t.divider}` }}>
                          <td style={{ padding: "8px 10px", color: t.textStrong, fontSize: 12 }}>{row.flow}</td>
                          <td style={{ padding: "8px 10px", color: t.subtle, fontSize: 11, fontFamily: FONT_MONO }}>{row.unit}</td>
                          <td style={{ padding: "8px 10px", color: t.textStrong, fontSize: 12, fontFamily: FONT_MONO }}>{Number(row.price_usd_per_unit) > 0 ? displayMoney(Number(row.price_usd_per_unit), 3) : "—"}</td>
                          <td style={{ padding: "8px 10px", color: t.muted, fontSize: 11, lineHeight: 1.45 }}><strong style={{ color: t.accentText }}>{row.source_type || "proxy"}</strong><br />{row.price_source || row.source_ref || "seed-inventory"}</td>
                          <td style={{ padding: "8px 10px", color: t.subtle, fontSize: 11, lineHeight: 1.45 }}>{row.price_basis || row.assumption || "—"}</td>
                          <td style={{ padding: "8px 10px", color: t.faint, fontSize: 11, lineHeight: 1.45 }}>{row.roadmap_replacement || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <MethodDrawer title={lang === "zh" ? "LCA/LCC 假设与来源" : "LCA/LCC assumptions and provenance"} badge={lang === "zh" ? "假设依赖" : "Assumption-dependent"}>
              {lang === "zh" ? "本层只用于入围候选的初步比较。价格、能耗、溶剂回收和寿命是筛选级情景参数；正式工程结论需要供应商价格、工艺路线、地区电网和完整 LCI。" : "This layer is for preliminary comparison within shortlisted candidates only. Prices, energy, solvent recovery, and lifetime are screening-level scenario parameters."}
            </MethodDrawer>
          </div>
          <aside style={{ position: isNarrow ? "static" : "sticky", top: 72, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { title: c.lca.functionalUnit, body: c.lca.functionalUnitBody },
              { title: c.lca.systemBoundary, body: c.lca.systemBoundaryBody },
              { title: c.lca.assumptions, body: c.lca.assumptionsBody },
              { title: c.lca.priceSourceTitle, body: `${c.lca.priceSourceBody} ${c.lca.currencyNote}` },
              { title: c.lca.basisLabels, body: c.lca.basisBody },
              { title: c.lca.confidenceLimits, body: c.lca.prototypeNote },
            ].map(item => (
              <div key={item.title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14, boxShadow: t.shadowSm, backdropFilter: "blur(18px) saturate(135%)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <div style={{ color: t.accentText, fontSize: 12, fontWeight: 800 }}>{item.title}</div>
                  <BasisBadge tone={item.title === c.lca.priceSourceTitle || item.title === c.lca.basisLabels ? "proxy" : "info"}>{item.title === c.lca.priceSourceTitle ? currencyCode : "basis"}</BasisBadge>
                </div>
                <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.6 }}>{item.body}</div>
              </div>
            ))}
          </aside>
        </div>
      </ResultLayer>
      <NextStepCTA
        label={lang === "zh" ? "下一步：测试稳健性" : "Next: test robustness"}
        body={lang === "zh" ? "如果 LCA/LCC 结论依赖假设，进入敏感性页看排序是否稳定。" : "If the LCA/LCC conclusion depends on assumptions, use sensitivity to test whether the ranking is stable."}
        actionLabel={lang === "zh" ? "进入敏感性" : "Open sensitivity"}
        onClick={() => onNavigate?.("sensitivity")}
      />
    </div>
  )
}
