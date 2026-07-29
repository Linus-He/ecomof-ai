import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const sourcePath = process.env.FAIR_MOFS_POROSITY_SOURCE
  || "/private/tmp/fair-mofs-porosity-unoptimised.json"
const corePath = path.join(root, "public/data/core_mof_2024/cr_search_index.json")
const outputPath = path.join(root, "public/data/mof_physicochemical_index_v1.json")

if (!fs.existsSync(sourcePath)) {
  throw new Error(`FAIR-MOFs porosity source not found: ${sourcePath}`)
}
if (!fs.existsSync(corePath)) {
  throw new Error(`CoRE MOF search index not found: ${corePath}`)
}

const normalizeRefcode = value => String(value || "")
  .trim()
  .toUpperCase()
  .replace(/_FAIR$/, "")

const fairPorosity = JSON.parse(fs.readFileSync(sourcePath, "utf8"))
const coreRecords = JSON.parse(fs.readFileSync(corePath, "utf8"))
const fairByRefcode = new Map(
  Object.entries(fairPorosity).map(([key, value]) => [
    normalizeRefcode(key),
    { fairRecordId: key, ...value },
  ]),
)

const records = coreRecords.map(core => {
  const fair = fairByRefcode.get(normalizeRefcode(core.csdRefcode)) || null
  return fair ? {
    coreRecordId: core.id,
    csdRefcode: core.csdRefcode,
    fairMofsCrossValidation: {
      matchType: "exact-csd-refcode",
      fairRecordId: fair.fairRecordId,
      sourceUrl: "https://zenodo.org/records/13254307",
      license: "CC-BY-4.0",
      properties: {
        accessibleSurfaceAreaA2: fair["ASA_A^2"],
        accessibleSurfaceAreaM2Cm3: fair["ASA_m^2/cm^3"],
        accessibleVolumeA3: fair["AV_A^3"],
        accessibleVolumeFraction: fair.AV_Volume_fraction,
        lcdA: fair.LCD_A,
        pldA: fair.PLD_A,
        largestFreePathDiameterA: fair.lfpd_A,
        numberOfChannels: fair.Number_of_channels,
      },
    },
  } : null
}).filter(Boolean)

const exactMatches = records.length
const output = {
  schemaVersion: "1.0",
  version: "2026-07-29",
  generatedAt: "2026-07-29",
  operatingMode: "non-commercial-research",
  identityRuleZh: "仅按完全一致的 CSD Refcode 连接 CoRE MOF 2024 与 FAIR-MOFs；不使用 DOI、化学式、基础 Refcode 或名称相似度强行合并。",
  identityRuleEn: "CoRE MOF 2024 and FAIR-MOFs are joined only by an identical CSD Refcode; DOI, formula, base-Refcode, and name similarity are not used for forced merges.",
  valueBoundaryZh: "CoRE 与 FAIR-MOFs 字段保留各自来源和单位。FAIR-MOFs 交叉值用于复核，不覆盖 CoRE 主值；0 保留为来源值，缺失保持 null。",
  valueBoundaryEn: "CoRE and FAIR-MOFs fields retain their own provenance and units. FAIR-MOFs cross-values support review and never overwrite CoRE primary values; source zeros are retained and missing values stay null.",
  sources: [
    {
      id: "core-mof-2024-csd-modified",
      role: "primary-physicochemical-layer",
      recordCount: coreRecords.length,
      sourceUrl: "https://zenodo.org/records/15055758",
      termsUrl: "https://www.ccdc.cam.ac.uk/support-and-resources/downloads",
      license: "CC-BY-NC-SA-4.0",
      nonCommercialOnly: true,
    },
    {
      id: "fair-mofs-porosity-unoptimised",
      role: "exact-refcode-cross-validation",
      recordCount: Object.keys(fairPorosity).length,
      sourceUrl: "https://zenodo.org/records/13254307",
      sourceFile: "porosity_of_unoptimised_mof.json",
      sourceChecksum: "md5:f2ceed4e002c44f309221d604bc391f8",
      license: "CC-BY-4.0",
      nonCommercialOnly: false,
    },
  ],
  summary: {
    coreRecordCount: coreRecords.length,
    corePropertyRecordCount: coreRecords.filter(record => [
      record.surfaceArea,
      record.poreSizeA,
      record.pldA,
      record.lcdA,
      record.poreVolume,
      record.density,
      record.voidFraction,
    ].some(value => value !== null && value !== undefined && value !== "")).length,
    fairSourceRecordCount: Object.keys(fairPorosity).length,
    exactFairRefcodeMatches: exactMatches,
    exactFairRefcodeMatchRate: Number((exactMatches / Math.max(coreRecords.length, 1)).toFixed(4)),
    unmatchedCoreRecords: coreRecords.length - exactMatches,
  },
  records,
}

fs.writeFileSync(outputPath, `${JSON.stringify(output)}\n`)
console.log(`Wrote ${path.relative(root, outputPath)} with ${coreRecords.length} CoRE property records and ${exactMatches} exact FAIR-MOFs cross-matches.`)
