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
      titleZh={mini ? "HGCPS 八因子玫瑰" : "HGCPS 八因子风玫瑰图"}
      titleEn={mini ? "HGCPS Factor Rose" : "HGCPS Eight-Factor Rose"}
      subtitleZh="半径按八个 HGCPS 因子值缩放；风险保留因子使用风险色，表示压缩而非实验否定。"
      subtitleEn="Radius is scaled by the eight HGCPS factors; risk retention uses the risk tone and means compression, not experimental rejection."
      captionZh="主体、路径、客体、证据、风险、可合成性与经济性共同决定当前路线 HGCPS；虚线轮廓为对照路线。"
      captionEn="Host, pathway, guest, evidence, risk, synthesizability, and economics jointly shape the current route HGCPS; the dashed outline is the comparison route."
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
