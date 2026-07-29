import fs from "node:fs"
import path from "node:path"

const registryPath = path.join(process.cwd(), "public/data/database_compliance_registry.json")
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"))

function rewriteStrings(value) {
  if (Array.isArray(value)) return value.map(rewriteStrings)
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewriteStrings(item)]))
  }
  if (typeof value !== "string") return value
  return value
    .replaceAll("FAIR-MOFs 与 QMOF", "FAIR-MOFs")
    .replaceAll("FAIR-MOFs and QMOF", "FAIR-MOFs")
    .replaceAll("FAIR-MOFs/QMOF", "FAIR-MOFs")
    .replaceAll("FAIR-MOFs / QMOF", "FAIR-MOFs")
    .replaceAll("同名 CoRE/QMOF 结构", "未经核验的同名外部结构")
    .replaceAll("same-name CoRE/QMOF structures", "unverified same-name external structures")
}

const next = rewriteStrings(registry)
next.version = "V1.3"
next.documentControl.version = "V1.3"
next.documentControl.reviewCycleZh = "来源条款、数据版本、预期用途或非商业运营边界发生变化时立即重新核验"
next.documentControl.reviewCycleEn = "Re-verify immediately whenever source terms, dataset versions, intended use, or the non-commercial operating boundary changes"
next.statusStatement.zh = "EcoMOF-AI 按非商业研究模式运行。当前物化性质主层为 9,835 条 CoRE MOF 2024 CSD-modified CR 结构记录；FAIR-MOFs 仅在 CSD Refcode 完全一致时提供独立交叉记录。许可、来源和科学适用性必须按具体数据对象分别判断。"
next.statusStatement.en = "EcoMOF-AI operates in non-commercial research mode. The primary physicochemical layer contains 9,835 CoRE MOF 2024 CSD-modified CR structure records; FAIR-MOFs supplies an independent cross-record only for an identical CSD Refcode. Licence, provenance, and scientific fitness must be assessed for each data object."

next.authorizationCredentials = next.authorizationCredentials.filter(item => item.id !== "cred-qmof")
next.officialDocuments = next.officialDocuments.filter(item => item.id !== "qmof-record")
next.datasets = next.datasets.filter(item => item.id !== "qmof")

const fairCredential = next.authorizationCredentials.find(item => item.id === "cred-fair-mofs")
if (fairCredential) {
  fairCredential.authorizationZh = "Zenodo 数据集记录将 FAIR-MOFs 标为 CC BY 4.0，并公布 DOI、逐文件清单与校验值。项目使用 porosity_of_unoptimised_mof.json 建立严格 Refcode 交叉层，并保留来源文件 MD5。"
  fairCredential.authorizationEn = "The Zenodo dataset record identifies FAIR-MOFs as CC BY 4.0 and publishes its DOI, file inventory, and checksums. The project uses porosity_of_unoptimised_mof.json for a strict Refcode cross-layer and retains the source-file MD5."
  fairCredential.limitationZh = "37,452 条 FAIR 孔隙记录不直接并入 CoRE 身份层；只有 3,451 条与当前 CoRE 结构的 CSD Refcode 完全一致。其余记录不以 DOI、化学式、基础 Refcode 或名称相似度强行合并。CC BY 不覆盖发布者无权许可的第三方权利。"
  fairCredential.limitationEn = "The 37,452 FAIR porosity records are not directly merged into the CoRE identity layer. Only 3,451 have an identical CSD Refcode in the current CoRE corpus. The remainder are not force-joined by DOI, formula, base Refcode, or name similarity. CC BY does not cover third-party rights the publisher lacks authority to license."
  fairCredential.evidence = [
    ...fairCredential.evidence.filter(item => !String(item.label).includes("mof_physicochemical_index")),
    {
      kindZh: "源文件与校验值",
      kindEn: "Source file and checksum",
      label: "porosity_of_unoptimised_mof.json · md5:f2ceed4e002c44f309221d604bc391f8",
      url: "https://zenodo.org/records/13254307",
    },
    {
      kindZh: "严格身份交叉索引",
      kindEn: "Strict identity cross-index",
      label: "public/data/mof_physicochemical_index_v1.json · exact CSD Refcode only",
      localPath: "public/data/mof_physicochemical_index_v1.json",
    },
  ]
}

const fairDataset = next.datasets.find(item => item.id === "fair-mofs")
if (fairDataset) {
  fairDataset.roleZh = "37,452 条孔隙性质记录、4,168 条合成条件/DOI 记录与严格 Refcode 交叉证据层"
  fairDataset.roleEn = "37,452 porosity records, 4,168 synthesis-condition/DOI records, and a strict Refcode cross-evidence layer"
  fairDataset.recordCount = 37452
  fairDataset.version = "Zenodo record 13254307 · porosity_of_unoptimised_mof.json + synthesis JSON"
  fairDataset.projectHandlingZh = "不复制 FAIR-MOFs CIF 归档。物化交叉层只保留与当前 CoRE 结构完全一致的 CSD Refcode（3,451 条），且不覆盖 CoRE 主值；合成条件与 DOI 仍按原有 4,168 条登记。"
  fairDataset.projectHandlingEn = "No FAIR-MOFs CIF archive is copied. The property cross-layer retains only CSD Refcodes identical to the current CoRE corpus (3,451 records) and never overwrites CoRE primary values; synthesis conditions and DOI links remain registered for 4,168 records."
}

const coreDataset = next.datasets.find(item => item.id === "core-mof-2024-csd-modified")
if (coreDataset) {
  coreDataset.roleZh = "9,835 条结构记录的主物化性质与描述符层"
  coreDataset.roleEn = "Primary physicochemical-property and descriptor layer for 9,835 structure records"
  coreDataset.projectHandlingZh = "只接入 CCDC 下载页标明的 modified 数据对象；9,835 条记录逐条显示比表面积、孔体积、PLD、LCD、密度和空隙率。unmodified 数据明确排除，所有展示标注非商业研究边界。"
  coreDataset.projectHandlingEn = "Only the modified data object identified on the CCDC download page is ingested. All 9,835 records expose surface area, pore volume, PLD, LCD, density, and void fraction. Unmodified data are explicitly excluded and every display retains the non-commercial research boundary."
}

const ccByGroup = next.applicableClauseGroups.find(group => group.id === "cc-by")
if (ccByGroup) {
  ccByGroup.scopeZh = "适用于 FAIR-MOFs 发布页明确标注为 CC BY 4.0 的材料；只覆盖发布者有权许可的权利。"
  ccByGroup.scopeEn = "Applies to FAIR-MOFs materials identified as CC BY 4.0 on the publication page, and only to rights the publisher has authority to license."
}

fs.writeFileSync(registryPath, `${JSON.stringify(next, null, 2)}\n`)
console.log(`Updated ${path.relative(process.cwd(), registryPath)} without QMOF display entries.`)
