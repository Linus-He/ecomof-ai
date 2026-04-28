import { useState } from "react"
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import {
  useT, useLang, useViewport,
  zhText, toolbarBtn,
  buildDecisionModel, downloadTextFile, buildRankedCandidates, buildMonteCarloData,
  MetricCard, EmptyState, ResultLayer, HowToRead, NextStepCTA, Callout, MethodDrawer,
} from "../../shared"

export function SensitivityTab({ results, inputs, onNavigate }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow } = useViewport()
  const [customScenario, setCustomScenario] = useState({ metal: 10, energy: 10, solvent: 10, cost: 10 })
  if (!results || results.unavailable) return <EmptyState message={c.lca.empty} />
  const decision = buildDecisionModel(results, inputs, c)
  const scenarios = [
    { name: c.sensitivityPage.base, lca: results.lca.compositeGreenScore, cost: decision.totalLcc, stability: "72%" },
    { name: c.sensitivityPage.optimistic, lca: Number((results.lca.compositeGreenScore + 0.8).toFixed(1)), cost: Number((decision.totalLcc * 0.86).toFixed(1)), stability: "84%" },
    { name: c.sensitivityPage.conservative, lca: Number((results.lca.compositeGreenScore - 0.9).toFixed(1)), cost: Number((decision.totalLcc * 1.18).toFixed(1)), stability: "58%" },
    { name: c.sensitivityPage.highEnergy, lca: Number((results.lca.compositeGreenScore - 1.2).toFixed(1)), cost: Number((decision.totalLcc * 1.26).toFixed(1)), stability: "46%" },
  ]
  const sweepData = [
    { parameter: c.lca.sensMetal, effect: decision.mostSensitive.value },
    { parameter: c.lca.sensProcess, effect: decision.mostSensitive.value * 0.86 },
    { parameter: c.lca.sensSolvent, effect: decision.mostSensitive.value * 0.72 },
    { parameter: c.lca.linkerCost, effect: decision.unitCost * 0.08 },
  ].map(item => ({ ...item, effect: Number(item.effect.toFixed(2)) }))
  const customPenalty = (customScenario.metal * 0.018) + (customScenario.energy * 0.026) + (customScenario.solvent * 0.014)
  const customCost = Number((decision.totalLcc * (1 + customScenario.cost / 100)).toFixed(1))
  const customScore = Number(Math.max(0, results.lca.compositeGreenScore - customPenalty).toFixed(1))
  const monteCarloData = buildMonteCarloData(results, decision)
  const rankedCandidates = buildRankedCandidates(inputs, c, customScenario).slice(0, 8)
  const mcLast = monteCarloData[monteCarloData.length - 1] || { p05: "—", p50: "—", p95: "—" }
  const scenarioPresets = [
    { label: "Base", values: { metal: 10, energy: 10, solvent: 10, cost: 10 } },
    { label: "Low energy", values: { metal: 8, energy: 2, solvent: 8, cost: 8 } },
    { label: "High recovery", values: { metal: 8, energy: 6, solvent: 2, cost: 6 } },
    { label: "Conservative", values: { metal: 22, energy: 25, solvent: 18, cost: 24 } },
  ]
  const exportSensitivityCsv = () => {
    const scenarioRows = scenarios.map(item => ["scenario", item.name, item.lca, item.cost, item.stability].join(","))
    const rankingRows = rankedCandidates.map(item => ["ranking", item.name, item.uptake, item.selectivity, item.lca, item.lcc, item.score].join(","))
    const mcRows = monteCarloData.map(item => ["monte_carlo", item.run, item.p05, item.p50, item.p95, item.costP50].join(","))
    downloadTextFile("ecomof_sensitivity_export.csv", ["section,name_or_run,p05_or_lca,p50_or_cost,p95_or_stability,cost_or_lcc,score", ...scenarioRows, ...rankingRows, ...mcRows].join("\n"), "text/csv")
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, color: t.textStrong, fontSize: 24 }}>{c.sensitivityPage.title}</h1>
          <p style={{ margin: "6px 0 0", color: t.muted, fontSize: 13, lineHeight: 1.6 }}>{c.sensitivityPage.subtitle}</p>
        </div>
        <button type="button" onClick={exportSensitivityCsv} style={toolbarBtn(t)}>↓ {lang === "zh" ? "敏感性 CSV" : "Sensitivity CSV"}</button>
      </div>
      <Callout tone="info">
        <strong>{lang === "zh" ? "这个页面的用途：" : "What this page is for:"}</strong>{" "}
        {lang === "zh" ? "不是主要命中识别；用于形成入围候选之后，检查成本和生命周期假设变化时比较结论是否稳定。" : "Not primary hit identification; use it after shortlist formation to test whether broader comparison conclusions remain stable when cost and lifecycle assumptions are uncertain."}
      </Callout>
      <ResultLayer number="01" title={lang === "zh" ? "结果是什么？" : "What is the result?"} subtitle={lang === "zh" ? "先看哪个假设最容易改变入围候选结论。" : "Start with which assumption can most easily change the shortlist conclusion."}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 14 }}>
          <MetricCard label={c.sensitivityPage.mostSensitive} value={decision.mostSensitive.label} unit="" />
          <MetricCard label={c.sensitivityPage.stability} value="72" unit="%" comparison={c.lca.assumptionSensitive} />
          <MetricCard label={c.sensitivityPage.followup} value={decision.dominantCost.name} unit="" />
          <MetricCard label="P05 / P50 / P95" value={`${mcLast.p05}/${mcLast.p50}/${mcLast.p95}`} unit="" />
        </div>
      </ResultLayer>
      <ResultLayer number="02" title={lang === "zh" ? "为什么会这样？" : "Why does it look this way?"} subtitle={lang === "zh" ? "用 tornado 图和情景变化解释稳健性。" : "Use the tornado chart and scenarios to explain robustness."}>
        <div style={{ background: t.chartBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800, marginBottom: 12 }}>{c.sensitivityPage.sweep}</div>
          <ResponsiveContainer width="100%" height={370}>
            <BarChart data={sweepData} layout="vertical" margin={{ top: 8, right: 20, left: 105, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} horizontal={false} />
              <XAxis type="number" tick={{ fill: t.subtle, fontSize: 10 }} />
              <YAxis type="category" dataKey="parameter" width={108} tick={{ fill: t.subtle, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <Bar dataKey="effect" fill={t.sensitivityAccent} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <HowToRead>{lang === "zh" ? "条形越长代表结论越敏感；它不是重新筛选命中，而是帮助决定下一步补什么数据。" : "Longer bars mean the conclusion is more sensitive; this does not identify new hits, it prioritizes the next data to collect."}</HowToRead>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 14 }}>
          <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800, marginBottom: 12 }}>{c.sensitivityPage.scenarios}</div>
            <div style={{ display: "grid", gap: 10 }}>
              {scenarios.map(item => (
                <div key={item.name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, display: "grid", gridTemplateColumns: "1fr 80px 90px 70px", gap: 8, alignItems: "center", color: t.muted, fontSize: 12 }}>
                  <strong style={{ color: t.textStrong }}>{item.name}</strong>
                  <span>LCA {item.lca}</span>
                  <span>${item.cost}</span>
                  <span>{item.stability}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>{lang === "zh" ? "决策稳健性解释" : "Decision stability explanation"}</div>
            <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.7 }}>
              {lang === "zh" ? "如果 Base、Optimistic 和 Conservative 情景下候选排序仍保持靠前，说明早期结论较稳；如果 High-energy 或高成本情景下迅速掉出前列，应先补再生能耗、连接体价格和溶剂回收率数据。" : "If the candidate stays highly ranked across Base, Optimistic, and Conservative scenarios, the early conclusion is more robust."}
            </div>
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {[[c.sensitivityPage.stability, "72%"], [c.sensitivityPage.mostSensitive, decision.mostSensitive.label], [c.sensitivityPage.followup, decision.dominantCost.name]].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 10, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 11px" }}>
                  <span style={{ color: t.subtle, fontSize: 12 }}>{label}</span>
                  <strong style={{ color: t.textStrong, fontSize: 12 }}>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ResultLayer>
      <ResultLayer number="03" title={lang === "zh" ? "应该相信多少？" : "How much should I trust it?"} subtitle={lang === "zh" ? "敏感性结果来自代理不确定性范围，不是校准概率推断。" : "Sensitivity results come from proxy uncertainty ranges, not calibrated probabilistic inference."}>
        <MethodDrawer title={lang === "zh" ? "敏感性方法说明" : "Sensitivity methodology"} badge={lang === "zh" ? "探索性" : "Exploratory"}>
          {lang === "zh" ? "当前敏感性模块用确定性情景和代理不确定性范围测试结论是否稳定。它适合入围候选之后的稳健性讨论，不适合主要命中识别，也不是校准的概率模型。" : "The current sensitivity module uses deterministic scenarios and proxy uncertainty ranges to test conclusion stability."}
        </MethodDrawer>
      </ResultLayer>
      <NextStepCTA
        label={lang === "zh" ? "下一步：查看验证依据" : "Next: review validation basis"}
        body={lang === "zh" ? "稳健性判断之后，回到验证页确认筛选层的基准支持和适用域。" : "After robustness checks, review validation to understand screening-layer benchmark support and applicability."}
        actionLabel={lang === "zh" ? "进入验证" : "Open validation"}
        onClick={() => onNavigate?.("validation")}
      />
      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800 }}>{c.common.customScenario}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {scenarioPresets.map(item => (
              <button key={item.label} type="button" onClick={() => setCustomScenario(item.values)} style={{ ...toolbarBtn(t), padding: "4px 9px", fontSize: 11 }}>{zhText(lang, item.label)}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          {[["metal", c.common.metalBurden], ["energy", c.common.energyPenalty], ["solvent", c.common.solventWaste], ["cost", c.common.costPremium]].map(([key, label]) => (
            <div key={key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: t.subtle, fontSize: 12, marginBottom: 8 }}>
                <span>{label}</span><strong>{customScenario[key]}%</strong>
              </div>
              <input type="range" min="0" max="50" value={customScenario[key]} onChange={e => setCustomScenario(prev => ({ ...prev, [key]: Number(e.target.value) }))} style={{ width: "100%", accentColor: t.accent }} />
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 12, marginTop: 12 }}>
          <MetricCard label="Custom LCA score" value={customScore} unit="/10" />
          <MetricCard label="Custom LCC" value={`$${customCost}`} unit="/kg MOF" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1.15fr 0.85fr", gap: 14 }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>{c.common.monteCarlo}</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monteCarloData} margin={{ top: 12, right: 20, left: -16, bottom: 18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis dataKey="run" tick={{ fill: t.subtle, fontSize: 10 }} />
              <YAxis tick={{ fill: t.subtle, fontSize: 10 }} domain={[0, 10]} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <Area type="monotone" dataKey="p95" stroke="none" fill={t.accent} fillOpacity={0.12} name="p95" />
              <Area type="monotone" dataKey="p05" stroke="none" fill={t.bg} fillOpacity={1} name="p05" />
              <Line type="monotone" dataKey="p50" stroke={t.accentStrong} strokeWidth={2} dot={false} name="p50" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5 }}>{c.common.uncertaintyNote}</div>
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>{c.common.rerankedCandidates}</div>
          <div style={{ display: "grid", gap: 8 }}>
            {rankedCandidates.map((item, index) => (
              <div key={item.name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, display: "grid", gridTemplateColumns: "28px 1fr 62px", gap: 8, alignItems: "center", color: t.subtle, fontSize: 12 }}>
                <strong style={{ color: index < 3 ? t.success : t.faint }}>#{index + 1}</strong>
                <div>
                  <div style={{ color: t.textStrong, fontWeight: 800 }}>{item.name}</div>
                  <div style={{ color: t.faint, fontSize: 10 }}>Uptake {item.uptake} · Sel. {item.selectivity} · LCC ${item.lcc}</div>
                </div>
                <strong style={{ color: t.accentSoft }}>{item.score}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Callout tone="warn">{c.sensitivityPage.caution}</Callout>
    </div>
  )
}
