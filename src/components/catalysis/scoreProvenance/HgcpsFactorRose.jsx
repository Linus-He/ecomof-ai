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
      titleZh={mini ? "HGCPS 六因子玫瑰" : "HGCPS 六因子风玫瑰图"}
      titleEn={mini ? "HGCPS Factor Rose" : "HGCPS Six-Factor Rose"}
      subtitleZh="半径按六个 HGCPS 因子值缩放；风险保留因子使用风险色，表示压缩而非实验否定。"
      subtitleEn="Radius is scaled by the six HGCPS factors; risk retention uses the risk tone and means compression, not experimental rejection."
      captionZh="互补性、主体稳定性、客体补偿、证据置信与风险保留共同决定当前路线 HGCPS；虚线轮廓为对照路线。"
      captionEn="Complementarity, host stability, guest compensation, evidence confidence, and risk retention jointly shape the current route HGCPS; the dashed outline is the comparison route."
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
