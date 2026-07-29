import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const outputPath = path.join(root, "public/data/mof_anatomy_identity_index_v1.json")
const apiBase = "https://mofanatomy.com/wp-json/wp/v2/mof"
const retrievedAt = process.env.MOF_ANATOMY_RETRIEVED_AT || new Date().toISOString().slice(0, 10)

const decodeHtml = value => String(value || "")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, "\"")
  .replace(/&#039;|&apos;/gi, "'")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")

const stripHtml = value => decodeHtml(String(value || "")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim())

const normalizeName = value => String(value || "")
  .normalize("NFKC")
  .replace(/[‐‑‒–—−]/g, "-")
  .replace(/\s+/g, " ")
  .trim()

function extractField(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(
    `<h5[^>]*>\\s*(?:<strong>)?\\s*${escaped}\\s*(?:<\\/strong>)?\\s*<\\/h5>[\\s\\S]{0,500}?<(?:div|p)[^>]*>([\\s\\S]*?)<\\/(?:div|p)>`,
    "i",
  )
  return stripHtml(html.match(pattern)?.[1] || "")
}

function extractFirstUrl(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const section = html.match(new RegExp(
    `<h5[^>]*>\\s*(?:<strong>)?\\s*${escaped}\\s*(?:<\\/strong>)?\\s*<\\/h5>([\\s\\S]{0,700}?)<\\/article>`,
    "i",
  ))?.[1] || ""
  return decodeHtml(section.match(/href=["']([^"']+)["']/i)?.[1] || "")
}

async function fetchJson(url, attempt = 1) {
  const response = await fetch(url, {
    headers: { "user-agent": "EcoMOF-AI non-commercial research metadata indexer/1.0" },
  })
  if (!response.ok) {
    if (attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, attempt * 500))
      return fetchJson(url, attempt + 1)
    }
    throw new Error(`HTTP ${response.status} for ${url}`)
  }
  return response.json()
}

async function fetchText(url, attempt = 1) {
  const response = await fetch(url, {
    headers: { "user-agent": "EcoMOF-AI non-commercial research metadata indexer/1.0" },
  })
  if (!response.ok) {
    if (attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, attempt * 500))
      return fetchText(url, attempt + 1)
    }
    throw new Error(`HTTP ${response.status} for ${url}`)
  }
  return response.text()
}

const firstPage = await fetchJson(`${apiBase}?per_page=100&page=1&_fields=id,slug,link,title`)
const secondPage = await fetchJson(`${apiBase}?per_page=100&page=2&_fields=id,slug,link,title`)
const posts = [...firstPage, ...secondPage]
  .filter((post, index, all) => all.findIndex(candidate => candidate.id === post.id) === index)
  .sort((a, b) => normalizeName(a.title?.rendered).localeCompare(normalizeName(b.title?.rendered), "en"))

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length)
  let nextIndex = 0
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await mapper(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}

const records = await mapWithConcurrency(posts, 8, async post => {
  const html = await fetchText(post.link)
  const canonicalName = normalizeName(stripHtml(post.title?.rendered))
  const associatedPaperUrl = extractFirstUrl(html, "Associated Paper")
  const ccdcUrl = extractFirstUrl(html, "CCDC Link")
  const doi = associatedPaperUrl.match(/doi\.org\/(.+)$/i)?.[1] || null
  const ccdcNumber = extractField(html, "CCDC Link").match(/\d{5,}/)?.[0] || null
  const yearText = extractField(html, "Year")

  return {
    id: `mof-anatomy:${post.slug}`,
    canonicalName,
    searchAliases: [
      canonicalName.replace(/-/g, ""),
      canonicalName.replace(/-/g, " "),
    ].filter((value, index, all) => value && all.indexOf(value) === index && value !== canonicalName),
    slug: post.slug,
    identityPage: post.link,
    firstReportedYear: /^\d{4}$/.test(yearText) ? Number(yearText) : null,
    mofClass: extractField(html, "Class") || null,
    mofFamily: extractField(html, "Family") || null,
    linker: {
      name: extractField(html, "Linker") || null,
      abbreviation: extractField(html, "Linker Abbreviation") || null,
    },
    metalCluster: extractField(html, "Metal Cluster") || null,
    topology: extractField(html, "Topology") || null,
    associatedPaper: associatedPaperUrl
      ? { doi, url: associatedPaperUrl }
      : null,
    ccdcNumber,
    ccdcUrl: ccdcUrl || null,
    identityStatus: "catalogued-name-literature-pointer",
    structureMappingStatus: "No structure or physicochemical property is redistributed from MOF Anatomy. A local licensed record is linked only when an independent exact identifier match is available.",
    provenance: {
      sourceName: "MOF Anatomy",
      sourceUrl: post.link,
      retrievedAt,
      fieldsUsed: [
        "canonical name",
        "first reported year",
        "class",
        "family",
        "linker",
        "metal cluster",
        "topology",
        "associated paper DOI",
        "CCDC deposition number",
      ],
    },
  }
})

const output = {
  schemaVersion: "1.0.0",
  version: retrievedAt,
  generatedAt: retrievedAt,
  operatingMode: "non-commercial-research",
  source: {
    id: "mof-anatomy",
    name: "MOF Anatomy",
    sourceUrl: "https://mofanatomy.com/",
    aboutUrl: "https://mofanatomy.com/about/",
    apiUrl: apiBase,
    recordCount: records.length,
    licenseStatus: "No explicit site-wide reuse licence was located during the 2026-07-29 review.",
    permittedUseInThisIndex: "Factual identity metadata and outbound literature/database pointers only.",
    excludedAssets: [
      "rendered structure images",
      "XYZ files",
      "cleaned crystal structures",
      "page prose and visual design",
    ],
    redistributionAuthorized: false,
  },
  identityRuleZh: "本索引只登记名称、分类、年份、DOI 与 CCDC 号等事实性身份元数据。未经明确授权，不复制 MOF Anatomy 的结构图片、XYZ 文件或整理后晶体结构；物化性质仅在本地已有数据能通过独立且完全一致的标识符连接时展示。",
  identityRuleEn: "This index records factual identity metadata only. MOF Anatomy images, XYZ files, and cleaned structures are not copied without explicit permission; physicochemical properties are shown only when an independently licensed local record can be linked by an exact identifier.",
  missingDataPolicyZh: "找到名称但没有可授权的本地结构或性质记录时，界面必须显示原论文 DOI、CCDC 号（如有）和缺失原因，不得以相似名称、同一论文或同系列材料推断数值。",
  missingDataPolicyEn: "When a name is found but no licensed local structure or property record is available, the interface must show the original DOI, CCDC number when present, and the reason for the gap; values must not be inferred from similar names, a shared paper, or a related material family.",
  summary: {
    recordCount: records.length,
    recordsWithDoi: records.filter(record => record.associatedPaper?.doi).length,
    recordsWithCcdcNumber: records.filter(record => record.ccdcNumber).length,
    recordsWithTopology: records.filter(record => record.topology).length,
  },
  records,
}

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(`Wrote ${path.relative(root, outputPath)} with ${records.length} factual identity records.`)
