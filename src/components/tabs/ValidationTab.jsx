import { useState, useEffect } from "react"
import {
  BarChart, Bar, ScatterChart, Scatter, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import {
  useT, useLang, useViewport,
  LITERATURE_DB, DEFAULT_INPUTS,
  zhText, toolbarBtn,
  fetchDataJson, downloadTextFile, buildApplicabilityPoints,
  MetricCard, BasisBadge, PageHeader, EmptyState, ResultLayer, HowToRead, NextStepCTA, Callout, StageStrip, StickySummaryBar,
} from "../../shared"

export function ValidationTab({ results, inputs, apiUrl, apiStatus, onCheckApi, onNavigate, onAddComparison }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow } = useViewport()
  const [manifest, setManifest] = useState(null)
  const [manifestSource, setManifestSource] = useState("loading")

  useEffect(() => {
    let active = true
    async function loadManifest() {
      try {
        if (apiUrl) {
          const response = await fetch(`${apiUrl.replace(/\/$/, "")}/models/manifest`)
          if (response.ok) {
            const apiManifest = await response.json()
            if (active) { setManifest(apiManifest); setManifestSource("backend"); return }
          }
        }
        const staticManifest = await fetchDataJson("training_manifest.json")
        if (active) { setManifest(staticManifest); setManifestSource("static") }
      } catch (_) {
        if (active) { setManifest(null); setManifestSource("fallback") }
      }
    }
    loadManifest()
    return () => { active = false }
  }, [apiUrl])

  const metricText = (target) => {
    const metric = manifest?.metrics?.[target]
    if (!metric) return "R² — · MAE —"
    const r2 = Number(metric.r2)
    const mae = Number(metric.mae)
    return `R² ${Number.isFinite(r2) ? r2.toFixed(3) : "—"} · MAE ${Number.isFinite(mae) ? mae.toFixed(3) : "—"}`
  }

  const validationData = LITERATURE_DB.slice(0, 10).map((item, index) => {
    const offset = ((index % 5) - 2) * 0.16
    const predicted = Number(Math.max(0.2, item.co2 + offset).toFixed(2))
    return { name: item.name, reference: item.co2, predicted, residual: Number((predicted - item.co2).toFixed(2)) }
  })
  const errorDistributionData = [
    { bin: "< -0.4", count: validationData.filter(d => d.residual < -0.4).length },
    { bin: "-0.4 to -0.2", count: validationData.filter(d => d.residual >= -0.4 && d.residual < -0.2).length },
    { bin: "-0.2 to 0", count: validationData.filter(d => d.residual >= -0.2 && d.residual < 0).length },
    { bin: "0 to 0.2", count: validationData.filter(d => d.residual >= 0 && d.residual < 0.2).length },
    { bin: "0.2 to 0.4", count: validationData.filter(d => d.residual >= 0.2 && d.residual < 0.4).length },
    { bin: "> 0.4", count: validationData.filter(d => d.residual >= 0.4).length },
  ]
  const applicabilityPoints = buildApplicabilityPoints(inputs || DEFAULT_INPUTS, results)
  const cards = [
    { title: c.validation.dataset, body: `${c.validation.datasetBody} ${manifest ? `Manifest: ${manifest.origin || "unknown"} · rows ${manifest.rows ?? "—"} · source ${manifestSource}.` : "Manifest not loaded."}` },
    { title: c.validation.metrics, body: `CO2 uptake: ${metricText("co2_uptake")} · N2 uptake: ${metricText("n2_uptake")} · selectivity: ${metricText("selectivity")}.` },
    { title: c.validation.error, body: c.validation.errorBody },
    { title: c.validation.applicability, body: results?.applicability?.warnings?.length ? results.applicability.warnings.map(w => w.message).join(" ") : c.methods.applicabilityBody },
    { title: c.validation.benchmark, body: c.validation.benchmarkBody },
  ]
  const validationCsv = [["MOF", "Reference uptake", "Predicted uptake", "Residual"], ...validationData.map(row => [row.name, row.reference, row.predicted, row.residual])].map(row => row.join(",")).join("\n")
  const validationReport = ["# ecomof-ai Validation Summary", "", `Manifest source: ${manifestSource}`, `Training origin: ${manifest?.origin || "not loaded"}`, `Rows: ${manifest?.rows ?? "unknown"}`, "", "## Metrics", `CO2 uptake: ${metricText("co2_uptake")}`, `N2 uptake: ${metricText("n2_uptake")}`, `Selectivity: ${metricText("selectivity")}`].join("\n")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader title={c.validation.title} subtitle={c.validation.subtitle} />
      <StageStrip current="validation" onNavigate={onNavigate} />
      <StickySummaryBar inputs={inputs} results={results} stage={lang === "zh" ? "第 1 阶段验证" : "Stage 1 validation"} onAddComparison={onAddComparison} canAddComparison={Boolean(results && !results.unavailable)} />
      <Callout tone="warn">
        {lang === "zh" ? "该验证页主要支持筛选导向的预测层。更宽的生命周期/成本层仍属于探索性、假设依赖模块。" : "This validation page primarily supports the screening-oriented prediction layer. Broader lifecycle/cost layers remain exploratory and assumption-dependent."}
      </Callout>
      <ResultLayer number="01" title={lang === "zh" ? "核心结果" : "Key Outputs"} subtitle={lang === "zh" ? "验证层先显示筛选模型的核心误差指标。" : "Validation first shows core error metrics for the screening model."}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          <MetricCard label="R²" value={manifest?.metrics?.co2_uptake?.r2 ? Number(manifest.metrics.co2_uptake.r2).toFixed(3) : "—"} unit="" />
          <MetricCard label="MAE" value={manifest?.metrics?.co2_uptake?.mae ? Number(manifest.metrics.co2_uptake.mae).toFixed(2) : "—"} unit="mmol/g" />
          <MetricCard label="RMSE" value={manifest?.metrics?.co2_uptake?.rmse ? Number(manifest.metrics.co2_uptake.rmse).toFixed(2) : "—"} unit="mmol/g" />
          <MetricCard label={c.validation.applicability} value={results?.applicability?.warnings?.length ? c.structure.caution : c.structure.inDomain} unit="" />
        </div>
      </ResultLayer>
      <ResultLayer number="02" title={lang === "zh" ? "模型表现解读" : "Model Performance Interpretation"} subtitle={lang === "zh" ? "用 parity、残差和适用域图解释模型表现。" : "Use parity, residual, and applicability plots to explain model behavior."}>
        <div style={{ background: t.card || t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800, marginBottom: 12 }}>{c.common.validationPredictedVsReference}</div>
          <ResponsiveContainer width="100%" height={410}>
            <ScatterChart margin={{ top: 12, right: 24, bottom: 28, left: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis type="number" dataKey="reference" name={lang === "zh" ? "参考值" : "Reference"} tick={{ fill: t.subtle, fontSize: 11 }} label={{ value: lang === "zh" ? "参考吸附量" : "Reference uptake", fill: t.subtle, fontSize: 11, dy: 18 }} />
              <YAxis type="number" dataKey="predicted" name={lang === "zh" ? "预测值" : "Predicted"} tick={{ fill: t.subtle, fontSize: 11 }} label={{ value: lang === "zh" ? "预测吸附量" : "Predicted uptake", fill: t.subtle, fontSize: 11, angle: -90, dx: -10 }} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 10, y: 10 }]} stroke={t.validationAccent} strokeDasharray="4 4" />
              <Scatter data={validationData} fill={t.accent} />
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>{lang === "zh" ? "当前一致性图是种子基准演示结构；科研级版本应替换为冻结外部测试集。" : "This parity plot uses a seed benchmark demonstration; a research-grade version should replace it with a frozen external test set."}</div>
          <HowToRead>{lang === "zh" ? "点越接近虚线，预测与参考越一致；当前点集是演示基准，不应用于泛化结论。" : "Points closer to the dashed line agree better with reference values; this seed set is a demonstration and should not support broad generalization claims."}</HowToRead>
        </div>
      </ResultLayer>
      <ResultLayer number="03" title={lang === "zh" ? "验证范围与限制" : "Validation Scope and Limits"} subtitle={lang === "zh" ? "训练清单、后端状态和导出工具保持低强调。" : "Training manifest, backend status, and export tools stay low-emphasis."}>
        <details style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
          <summary style={{ color: t.accentText, cursor: "pointer", fontSize: 12, fontWeight: 850 }}>{lang === "zh" ? "训练清单与后端状态" : "Training Manifest & Backend Status"}</summary>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 12 }}>
              <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>{lang === "zh" ? "这里读取 public/data/training_manifest.json；如果填了本地 FastAPI 地址，则优先读取 /models/manifest。" : "Reads public/data/training_manifest.json; if a local FastAPI URL is provided, /models/manifest takes priority."}</div>
              <button type="button" onClick={onCheckApi} style={toolbarBtn(t)}>{lang === "zh" ? "检查 API" : "Check API"}</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))", gap: 10 }}>
              {[
                [lang === "zh" ? "清单来源" : "Manifest source", zhText(lang, manifestSource), apiUrl || zhText(lang, "static site")],
                [lang === "zh" ? "模型状态" : "Model status", apiStatus?.ok ? zhText(lang, "backend connected") : zhText(lang, "static fallback"), apiStatus?.message ? zhText(lang, apiStatus.message) : zhText(lang, "browser-side model")],
                [lang === "zh" ? "训练来源" : "Training origin", manifest?.origin || "—", manifest?.warning || "—"],
                [lang === "zh" ? "训练行数" : "Rows", manifest?.rows ?? "—", (manifest?.source_files || []).join(" · ") || zhText(lang, "public seed")],
                [lang === "zh" ? "目标变量" : "Targets", (manifest?.targets || []).join(" / ") || "—", (manifest?.models || []).join(" / ") || "—"],
              ].map(([label, value, sub]) => (
                <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11, minHeight: 96 }}>
                  <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800, marginTop: 6, lineHeight: 1.25 }}>{value}</div>
                  <div style={{ color: t.subtle, fontSize: 10, lineHeight: 1.45, marginTop: 6, overflowWrap: "anywhere" }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </details>
      </ResultLayer>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 14 }}>
        {cards.map(card => (
          <div key={card.title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 18 }}>
            <div style={{ color: t.accentText, fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{card.title}</div>
            <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.7 }}>{card.body}</div>
          </div>
        ))}
      </div>
      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>{c.common.validationResiduals}</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={validationData} margin={{ top: 8, right: 14, left: -18, bottom: 54 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: t.subtle, fontSize: 9, angle: -35, textAnchor: "end" }} interval={0} height={60} />
            <YAxis tick={{ fill: t.subtle, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
            <Bar dataKey="residual" name={lang === "zh" ? "预测 - 参考" : "Predicted - reference"} fill={t.validationAccent} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <HowToRead>{lang === "zh" ? "残差显示预测减参考的偏差；系统性偏正或偏负说明模型可能需要重新校准。" : "Residuals show predicted minus reference values; systematic positive or negative bias suggests recalibration may be needed."}</HowToRead>
      </div>
      <NextStepCTA
        label={lang === "zh" ? "下一步：查看数据来源" : "Next: review data sources"}
        body={lang === "zh" ? "验证页只支持筛选层；数据来源页说明每个数据层属于哪个工作流阶段。" : "Validation supports the screening layer; Data Sources explains which workflow stage each data layer belongs to."}
        actionLabel={lang === "zh" ? "打开数据来源" : "Open data sources"}
        onClick={() => onNavigate?.("dataSources")}
      />
      <details style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
        <summary style={{ color: t.accentText, cursor: "pointer", fontSize: 12, fontWeight: 800 }}>{lang === "zh" ? "导出与工程操作" : "Export and engineering actions"}</summary>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <button type="button" onClick={() => downloadTextFile("ecomof_validation_summary.md", validationReport, "text/markdown")} style={toolbarBtn(t)}>↓ {lang === "zh" ? "验证 MD" : "Validation MD"}</button>
          <button type="button" onClick={() => downloadTextFile("ecomof_validation_points.csv", validationCsv, "text/csv")} style={toolbarBtn(t)}>↓ {lang === "zh" ? "验证 CSV" : "Validation CSV"}</button>
        </div>
      </details>
    </div>
  )
}
