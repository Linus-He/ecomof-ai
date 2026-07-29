import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const registryPath = path.join(root, "public/data/data_ingestion/source_registry.json")
const compliancePath = path.join(root, "public/data/database_compliance_registry.json")
const anatomyIndexPath = path.join(root, "public/data/mof_anatomy_identity_index_v1.json")
const anatomyIndex = JSON.parse(fs.readFileSync(anatomyIndexPath, "utf8"))

const sourceRegistry = JSON.parse(fs.readFileSync(registryPath, "utf8"))
const sourceEntry = {
  sourceId: "SRC-MOF-ANATOMY-IDENTITY",
  sourceName: "MOF Anatomy factual identity catalog",
  sourceType: "Literature Dataset",
  sourceUrl: "https://mofanatomy.com/",
  citation: "MOF Anatomy, MOF identity pages and associated source-paper / CCDC pointers; accessed 2026-07-29.",
  license: "No explicit site-wide reuse licence located; factual metadata and outbound pointers only",
  retrievedAt: "2026-07-29",
  accessMethod: "Public WordPress REST directory plus public MOF identity pages",
  uncertainty: "restricted",
  notes: "185 factual identity records. EcoMOF-AI does not copy MOF Anatomy images, XYZ files, cleaned structures, or page prose. Physicochemical properties are linked only to separately licensed local records by exact identifiers.",
}
sourceRegistry.sources = [
  ...(sourceRegistry.sources || []).filter(source => source.sourceId !== sourceEntry.sourceId),
  sourceEntry,
]
sourceRegistry.generatedAt = "2026-07-29"
fs.writeFileSync(registryPath, `${JSON.stringify(sourceRegistry, null, 2)}\n`)

const compliance = JSON.parse(fs.readFileSync(compliancePath, "utf8"))
compliance.version = "1.3"

const credential = {
  id: "cred-mof-anatomy",
  sourceZh: "MOF Anatomy 名称与文献身份目录",
  sourceEn: "MOF Anatomy name and literature identity directory",
  status: "limited-factual-metadata-no-site-licence",
  statusZh: "仅使用事实性元数据；未发现站点统一再利用许可",
  statusEn: "Factual metadata only; no site-wide reuse licence located",
  authorizationZh: "公开页面提供 MOF 名称、年份、分类、原论文 DOI 和 CCDC 号等事实性来源指针。此登记不把公开可访问等同于获得结构文件、图片或页面表达的复制许可。",
  authorizationEn: "Public pages provide factual source pointers such as MOF names, year, class, source-paper DOI, and CCDC number. This record does not treat public access as permission to copy structure files, images, or page expression.",
  limitationZh: "不得复制或再分发 MOF Anatomy 的结构图片、XYZ 文件、整理后结构、页面文案或视觉设计；没有独立许可与精确标识符时，不得把该目录条目补写成物化性质记录。",
  limitationEn: "Do not copy or redistribute MOF Anatomy structure images, XYZ files, cleaned structures, page prose, or visual design. Without independent permission and an exact identifier, a directory entry must not be converted into a physicochemical-property record.",
  evidence: [
    {
      kindZh: "官方目录与项目说明",
      kindEn: "Official directory and project description",
      label: "MOF Anatomy · Home / About",
      url: "https://mofanatomy.com/about/",
    },
    {
      kindZh: "仓库内来源登记",
      kindEn: "Repository source registry",
      label: "SRC-MOF-ANATOMY-IDENTITY",
      localPath: "public/data/data_ingestion/source_registry.json",
    },
    {
      kindZh: "合规派生索引",
      kindEn: "Governed derived index",
      label: "mof_anatomy_identity_index_v1.json · 185 factual records",
      localPath: "public/data/mof_anatomy_identity_index_v1.json",
    },
  ],
}
compliance.authorizationCredentials = [
  ...(compliance.authorizationCredentials || []).filter(item => item.id !== credential.id),
  credential,
]

const officialDocument = {
  id: "doc-mof-anatomy-about",
  publisher: "MOF Anatomy",
  titleZh: "MOF Anatomy 项目说明与公开目录",
  titleEn: "MOF Anatomy project description and public directory",
  url: "https://mofanatomy.com/about/",
  scopeZh: "用于核对项目性质、目录范围与事实性身份字段；该页面不是站点统一再利用许可。",
  scopeEn: "Used to verify project context, directory scope, and factual identity fields; this page is not a site-wide reuse licence.",
}
compliance.officialDocuments = [
  ...(compliance.officialDocuments || []).filter(item => item.id !== officialDocument.id),
  officialDocument,
]

const dataset = {
  id: "mof-anatomy-identity",
  name: "MOF Anatomy factual identity and literature pointer index",
  status: "active-limited",
  roleZh: `${anatomyIndex.summary.recordCount} 条 MOF 名称、分类、年份、原论文 DOI 与 CCDC 来源指针`,
  roleEn: `${anatomyIndex.summary.recordCount} MOF name, class, year, source-paper DOI, and CCDC pointers`,
  recordCount: anatomyIndex.summary.recordCount,
  version: `EcoMOF-AI identity snapshot ${anatomyIndex.version}`,
  licence: "No explicit site-wide reuse licence located; factual metadata and links only",
  sourceUrl: "https://mofanatomy.com/",
  licenceUrls: [],
  publisher: "MOF Anatomy",
  allowedZh: "仅登记名称、年份、分类、DOI、CCDC 号及指向原站和原论文的链接，用于科研检索与缺失说明。",
  allowedEn: "Register names, year, class, DOI, CCDC number, and outbound source links only for research retrieval and gap reporting.",
  prohibitedZh: "不得复制站点图片、XYZ／整理后结构、页面文案或设计；不得把目录身份条目当作获得物化性质授权或结构同一性的单独凭证。",
  prohibitedEn: "Do not copy site images, XYZ/cleaned structures, page prose, or design, and do not treat an identity directory entry as authorization for properties or sole evidence of structure identity.",
  projectHandlingZh: "生成 185 条事实性身份索引；搜索命中但本地无精确结构／性质记录时，只显示 DOI、CCDC 号、来源页和缺失原因，不推断数值。",
  projectHandlingEn: "Builds a 185-record factual identity index. When search finds a name without an exact local structure/property record, the UI shows DOI, CCDC number, source page, and the gap reason, without inferring values.",
}
compliance.datasets = [
  ...(compliance.datasets || []).filter(item => item.id !== dataset.id),
  dataset,
]

fs.writeFileSync(compliancePath, `${JSON.stringify(compliance, null, 2)}\n`)
console.log(`Registered MOF Anatomy factual metadata boundary in source and compliance registries (${anatomyIndex.summary.recordCount} records).`)
