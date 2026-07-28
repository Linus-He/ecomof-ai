import { asArray, fmt, palette, text } from "./shared"
import { FactorRoseChart } from "./FactorRoseShared"

function rowsFromModel(model) {
  const rows = asArray(model?.rows).length ? asArray(model.rows) : asArray(model?.steps)
  return rows.map(row => ({
    factorKey: row.fieldKey || row.factorKey,
    labelZh: row.labelZh,
    labelEn: row.labelEn,
    value: Number(row.normalizedValue ?? row.factorValue ?? row.weightOrFactor) || 0,
  }))
}

export function HgcpsFactorRose({ model, overlayRoute, lang = "zh", mini = false, withTestId = true, factorDetails = [], factorEvidence = [], selectedFactorKey = "", onSelectFactor }) {
  const rows = rowsFromModel(model)
  const outlineRows = rowsFromModel(overlayRoute)
  return (
    <FactorRoseChart
      rows={rows}
      outlineRows={outlineRows}
      titleZh={mini ? "HGCPS 因子贡献谱" : "HGCPS 八因子贡献谱"}
      titleEn={mini ? "HGCPS factor profile" : "HGCPS eight-factor profile"}
      subtitleZh="逐项比较八个数据派生因子；风险保留使用风险色，对照路线以竖线标出。"
      subtitleEn="Compares the eight data-derived factors; risk retention uses the risk tone and the comparison route is marked by a vertical line."
      captionZh="HGCPS 由主体稳定性、路径支持、客体补偿、主客体互补、证据、风险、合成条件可及性与经济性共同计算。条形长度表示归一化因子值，不代表实验测得的性能。"
      captionEn="HGCPS combines host stability, pathway support, guest compensation, host-guest complementarity, evidence, risk, synthesis-condition accessibility, and economics. Bar length is a normalized factor value, not experimentally measured performance."
      centerLabel="HGCPS"
      centerValue={fmt(model?.finalValue ?? model?.finalHGCPS, 3)}
      lang={lang}
      testId={withTestId ? "hgcps-factor-rose" : undefined}
      colorFor={row => row.factorKey === "riskRetentionFactor" ? palette.risk : palette.accent}
      outlineLabel={overlayRoute ? text(lang, `${overlayRoute.candidateLabel || overlayRoute.routeLabel || "对照路线"}`, `${overlayRoute.candidateLabel || overlayRoute.routeLabel || "comparison route"}`) : ""}
      factorDetails={factorDetails}
      factorEvidence={factorEvidence}
      selectedFactorKey={selectedFactorKey}
      onSelectFactor={onSelectFactor}
    />
  )
}

export default HgcpsFactorRose
