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

export function HostFactorRose({ model, comparisonModels, lang = "zh", withTestId = true, factorDetails = [], factorEvidence = [], selectedFactorKey = "", onSelectFactor }) {
  const overlay = asArray(comparisonModels)[1]
  return (
    <FactorRoseChart
      rows={rowsFromProvenance(model)}
      outlineRows={rowsFromProvenance(overlay)}
      titleZh="主体筛选五因子贡献谱"
      titleEn="Host five-factor profile"
      subtitleZh="逐项比较主体筛选的数值因子；对照主体以参考标记标出。"
      subtitleEn="Compares numeric host-selection factors, with the comparison host marked by a reference marker."
      captionZh="用于读取主体稳定性、孔环境和客体承载可行性的相对支撑；条形长度为归一化值，不是实验性能。"
      captionEn="Shows relative support from stability, pore environment, and guest-hosting feasibility. Bar length is normalized, not experimental performance."
      centerLabel="Host"
      centerValue={fmt(model?.finalValue, 3)}
      lang={lang}
      testId={withTestId ? "host-factor-rose" : undefined}
      colorFor={(row, index) => index % 2 === 0 ? palette.positive : palette.accent}
      outlineLabel={overlay?.candidateLabel || ""}
      factorDetails={factorDetails}
      factorEvidence={factorEvidence}
      selectedFactorKey={selectedFactorKey}
      onSelectFactor={onSelectFactor}
    />
  )
}

export default HostFactorRose
