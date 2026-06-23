import { asArray, fmt, palette } from "./shared"
import { FactorRoseChart } from "./FactorRoseShared"

const HOST_ROSE_KEYS = new Set([
  "stabilityProxy",
  "poreEnvironmentScore",
  "co2EnrichmentSupport",
  "postModificationFeasibility",
  "guestHostingFeasibility",
])

function rowsFromProvenance(model) {
  return asArray(model?.rows)
    .filter(row => HOST_ROSE_KEYS.has(row.fieldKey))
    .map(row => ({
      factorKey: row.fieldKey,
      labelZh: row.labelZh,
      labelEn: row.labelEn,
      value: Number(row.normalizedValue) || 0,
    }))
}

export function HostFactorRose({ model, comparisonModels, lang = "zh", withTestId = true }) {
  const overlay = asArray(comparisonModels)[1]
  return (
    <FactorRoseChart
      rows={rowsFromProvenance(model)}
      outlineRows={rowsFromProvenance(overlay)}
      titleZh="主体子因子玫瑰图"
      titleEn="Host Sub-Factor Rose"
      subtitleZh="半径按主体数值子因子缩放；淡色轮廓用于对照当前竞争主体。"
      subtitleEn="Radius follows host numeric sub-factors; the outline compares the current runner-up host."
      centerLabel="Host"
      centerValue={fmt(model?.finalValue, 3)}
      lang={lang}
      testId={withTestId ? "host-factor-rose" : undefined}
      colorFor={(row, index) => index % 2 === 0 ? palette.positive : palette.accent}
    />
  )
}

export default HostFactorRose
