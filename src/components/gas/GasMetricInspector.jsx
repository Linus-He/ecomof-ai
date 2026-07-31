// @ts-nocheck
import { BasisBadge, ChemicalText, FONT_SANS, SectionTitle, formatPercent } from "../../shared"
import { GasFieldProvenanceButton } from "./GasFieldProvenanceButton"
import { GasUnitNormalizationNote } from "./GasUnitNormalizationNote"
import { getFieldSource } from "./gasDataSchema"
import {
  dataStatus,
  formatNumber,
  metricContribution,
  metricDisplayValue,
  metricInterpretation,
  metricLabel,
  metricMeta,
  metricNormalizedValue,
  text,
  validationForRecord,
} from "./gasViewUtils"

export function GasMetricInspector({ cell, ranked = [], scenario = {}, onClose, lang, t }) {
  const record = cell?.record
  const metric = cell?.metric
  if (!record || !metric) {
    return (
      <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12, padding: 14 }}>
        {text(lang, "尚未选择热图单元格；选中后显示指标诊断。", "Select a heatmap cell to inspect a metric.")}
      </section>
    )
  }

  const meta = metricMeta(metric)
  const scoreKey = meta.scoreKey
  const normalized = metricNormalizedValue(record, metric, ranked)
  const contribution = metricContribution(record, metric)
  const weight = record.scoreBreakdown?.weights?.[scoreKey]
  const recommendation = validationForRecord(record, scenario, lang)
  const sourceField = metric === "stability" ? "waterStability" : metric === "evidence" ? "evidenceLevel" : metric
  const source = getFieldSource(record, sourceField)

  const rows = [
    [text(lang, "MOF 名称", "MOF name"), record.displayName],
    [text(lang, "指标", "Metric"), metricLabel(metric, lang)],
    [text(lang, "归一化值", "Normalized value"), normalized == null ? "pending" : formatPercent(normalized, { lang, normalized: true })],
    [text(lang, "原始值", "Raw value"), metricDisplayValue(record, metric, lang, ranked)],
    [text(lang, "单位", "Unit"), meta.unit || "dimensionless"],
    [text(lang, "当前权重", "Current weight"), weight == null ? "pending" : formatPercent(weight, { lang })],
    [text(lang, "分数贡献", "Score contribution"), contribution == null ? "pending" : formatNumber(contribution)],
    [text(lang, "数据类型", "Data type"), dataStatus(record, lang)],
    [text(lang, "证据等级", "Evidence level"), record.evidenceLevel || "C"],
    [text(lang, "字段来源类型", "Field source type"), source.sourceType || "pending"],
    [text(lang, "建议验证", "Suggested validation"), lang === "zh" && recommendation.typeZh ? recommendation.typeZh : recommendation.type],
  ]

  return (
    <section style={{ background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 10, boxShadow: t.shadowMd, padding: 16, minWidth: 0 }}>
      <div style={{ alignItems: "flex-start", display: "flex", gap: 12, justifyContent: "space-between" }}>
        <div>
          <SectionTitle>{text(lang, "GasMetricInspector 指标诊断", "GasMetricInspector")}</SectionTitle>
          <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 900, lineHeight: 1.2, marginTop: 6 }}>
            <ChemicalText value={record.displayName} /> × {metricLabel(metric, lang)}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label={text(lang, "关闭指标诊断", "Close metric inspector")} title={text(lang, "关闭", "Close")} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.subtle, cursor: "pointer", fontSize: 12, fontWeight: 850, minHeight: 40, padding: "7px 10px" }}>Esc</button>
      </div>

      <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "grid", gridTemplateColumns: "150px minmax(0, 1fr)", gap: 9, borderTop: `1px solid ${t.divider}`, paddingTop: 7 }}>
            <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
            <div style={{ color: t.muted, fontFamily: label.includes("值") || label.includes("value") || label.includes("weight") ? FONT_SANS : undefined, fontSize: 11.8, lineHeight: 1.48, overflowWrap: "anywhere" }}><ChemicalText value={value || "pending"} /></div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <GasFieldProvenanceButton record={record} field={sourceField} currentValue={metricDisplayValue(record, metric, lang, ranked)} unit={meta.unit || "dimensionless"} lang={lang} t={t} label={metricLabel(metric, lang)} />
        <span style={{ color: t.subtle, fontSize: 11.5, marginLeft: 8 }}>{text(lang, "查看该 heatmap 字段的来源、换算与整理状态。", "View source, conversion, and curation status for this heatmap field.")}</span>
      </div>
      <GasUnitNormalizationNote record={record} field={sourceField} lang={lang} t={t} />

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", marginTop: 12 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 12, lineHeight: 1.58, padding: 10 }}>
          <BasisBadge tone="info">{text(lang, "解释", "Interpretation")}</BasisBadge>
          <p style={{ margin: "8px 0 0" }}>{metricInterpretation(record, metric, lang, ranked)}</p>
        </div>
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.muted, fontSize: 12, lineHeight: 1.58, padding: 10 }}>
          <BasisBadge tone="warn">{text(lang, "限制", "Limitation")}</BasisBadge>
          <p style={{ margin: "8px 0 0" }}>{record.limitationNote || text(lang, "当前记录仍需真实 IAST/GCMC/穿透验证。", "This record still needs IAST/GCMC/breakthrough validation.")}</p>
          <p style={{ margin: "6px 0 0" }}>{dataStatus(record, lang)}</p>
        </div>
      </div>
    </section>
  )
}
