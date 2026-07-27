import { createHash } from "node:crypto"
import {
  access,
  copyFile,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { buildCsdNamingFields } from "../src/utils/mofNaming.mjs"

const DATASET_NAME = "CSD MOF Collection (Non-Commercial)"
const DATASET_VERSION = "CSD v601"
const SOURCE_URL = "https://www.ccdc.cam.ac.uk/support-and-resources/downloads"
const LICENSE_URL = "https://creativecommons.org/licenses/by-nc-sa/4.0/"
const ARCHIVE_SHA256 = "abf9f2a7288fd83e2a59f19b717c202414e744a1b2c8c1f9eec1f909554346fa"
const METAL_ELEMENTS = new Set([
  "Ac", "Ag", "Al", "Am", "Au", "Ba", "Be", "Bi", "Bk", "Ca", "Cd", "Ce", "Cf",
  "Cm", "Co", "Cr", "Cs", "Cu", "Dy", "Er", "Eu", "Fe", "Fm", "Fr", "Ga", "Gd",
  "Hf", "Hg", "Ho", "In", "Ir", "K", "La", "Li", "Lu", "Md", "Mg", "Mn", "Mo",
  "Na", "Nb", "Nd", "Ni", "Np", "Os", "Pa", "Pb", "Pd", "Pm", "Po", "Pr", "Pt",
  "Pu", "Ra", "Rb", "Re", "Rh", "Ru", "Sc", "Sm", "Sn", "Sr", "Ta", "Tb", "Tc",
  "Th", "Ti", "Tl", "Tm", "U", "V", "W", "Y", "Yb", "Zn", "Zr",
])

function parseArgs(argv) {
  const values = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith("--")) continue
    const key = token.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith("--")) {
      values[key] = true
      continue
    }
    values[key] = next
    index += 1
  }
  return values
}

function parseCsvLine(line) {
  const values = []
  let value = ""
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === "\"") {
      if (quoted && line[index + 1] === "\"") {
        value += "\""
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === "," && !quoted) {
      values.push(value)
      value = ""
    } else {
      value += character
    }
  }
  values.push(value)
  return values
}

function parseBooleanFlag(value) {
  return Boolean(String(value || "").trim() && String(value || "").trim() !== "-")
}

function stripCifValue(value) {
  return String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
}

function extractCifMetadata(source) {
  const formulaMatch = source.match(/^_chemical_formula_(?:moiety|sum)\s+(.+)$/im)
  const dataMatch = source.match(/(?:^|\n)data_([A-Za-z0-9]+)/)
  const originalRefcodeMatch = source.match(/original CSD entry\s+([A-Za-z0-9]+)/i)
  const formula = stripCifValue(formulaMatch?.[1])
  const elements = []
  const formulaPattern = /([A-Z][a-z]?)(?:\d+(?:\.\d+)?)?/g
  let match
  while ((match = formulaPattern.exec(formula)) !== null) {
    if (!elements.includes(match[1])) elements.push(match[1])
  }
  return {
    dataRefcode: dataMatch?.[1]?.toUpperCase() || null,
    formula: formula || null,
    metalElements: elements.filter(element => METAL_ELEMENTS.has(element)),
    originalRefcode: originalRefcodeMatch?.[1]?.toUpperCase() || null,
  }
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex")
}

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function runPool(items, concurrency, worker) {
  let cursor = 0
  const results = new Array(items.length)
  async function run() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await worker(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run))
  return results
}

function licenseMarkdown() {
  return `# Data license

The CIF files, source metadata, and dataset-derived indexes in this repository are
distributed under the **Creative Commons Attribution-NonCommercial-ShareAlike
4.0 International License (CC BY-NC-SA 4.0)**.

- Canonical license: ${LICENSE_URL}
- Source dataset: ${DATASET_NAME}
- Attribution party: Cambridge Crystallographic Data Centre (CCDC)

You may share and adapt this material only for non-commercial purposes, with
appropriate attribution, an indication of changes, and distribution of adapted
material under the same license.

The EcoMOF-AI application code is licensed separately. This data license applies
to the dataset content and dataset-derived indexes in this repository.
`
}

function noticeMarkdown({ archiveSha256, generatedAt }) {
  return `# Attribution and modification notice

## Source

- Dataset: ${DATASET_NAME}
- Provider: Cambridge Crystallographic Data Centre (CCDC)
- Source version: ${DATASET_VERSION}
- Download page: ${SOURCE_URL}
- Original archive SHA-256: \`${archiveSha256}\`
- Public package generated: ${generatedAt}

## License

The source dataset is provided under CC BY-NC-SA 4.0:
${LICENSE_URL}

## Changes made by EcoMOF-AI

- The original CIF file contents are copied without modification.
- CIF files are reorganized into two-character Refcode prefix directories so
  that the repository does not contain an excessively wide directory.
- Machine-readable JSON indexes, checksums, and a dataset landing page are
  generated from the CCDC-provided CSV metadata and CIF headers.
- The browser index is split into a lightweight 15,906-record search file and
  detailed two-character Refcode-prefix files. A legacy complete index remains
  available for backward compatibility.
- Common-name aliases are limited to an explicit, citation-backed registry and
  do not change or merge the source CIF records.
- No topology, linker identity, publication metadata, or experimental
  performance is inferred by this packaging step.
- Source CIF and CSV files retain their original line endings and trailing
  spaces so their published checksums describe byte-identical copies rather
  than normalized derivatives.

EcoMOF-AI is not affiliated with or endorsed by CCDC. The data is provided
without warranty; users must evaluate fitness for their own research.
`
}

function readmeMarkdown({ recordCount, generatedAt }) {
  return `# EcoMOF-AI · CSD MOF public data

Public, non-commercial delivery package for the ${DATASET_NAME}.

## Contents

- ${recordCount.toLocaleString("en-US")} CSD-derived MOF CIF files
- A lightweight search index with Refcode, common-name aliases, formula, metal
  elements, CIF filename, and prefix
- Detailed indexes sharded by the first two Refcode characters, containing
  crystal system, void-space percentage, source quality flags, bytes, and
  SHA-256
- Per-file SHA-256 checksums
- The original CCDC README and CSV metadata

## Browser access

The EcoMOF-AI frontend loads one CIF at a time from:

\`cif/<first-two-refcode-characters>/<cif-filename>.cif\`

Example:

\`cif/ab/abadug_P1.cif\`

## Provenance

- Source: ${SOURCE_URL}
- Source version: ${DATASET_VERSION}
- Package generated: ${generatedAt}
- License: CC BY-NC-SA 4.0

Read [NOTICE.md](NOTICE.md), [LICENSE-DATA.md](LICENSE-DATA.md), and
[SOURCE_README.txt](SOURCE_README.txt) before reusing the data.

This repository is for open, non-commercial research. It is not an official
CCDC service and is not endorsed by CCDC.
`
}

function landingHtml({ recordCount }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="Public non-commercial CSD MOF structure package for EcoMOF-AI">
  <title>EcoMOF-AI · CSD MOF public data</title>
  <style>
    :root{color-scheme:light dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    body{margin:0;background:#f4f7f8;color:#15242a}
    main{max-width:920px;margin:0 auto;padding:64px 24px}
    .eyebrow{color:#217f88;font-size:.78rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
    h1{font-size:clamp(2rem,5vw,4.3rem);line-height:1.02;margin:.6rem 0 1rem;letter-spacing:-.055em}
    p{color:#53676f;line-height:1.7}
    .card{background:#fff;border:1px solid #d8e2e5;border-radius:18px;padding:22px;box-shadow:0 16px 38px rgba(25,54,62,.08)}
    .stats{display:flex;flex-wrap:wrap;gap:10px;margin:24px 0}
    .pill{border:1px solid #b7d5d8;border-radius:999px;padding:8px 12px;font-size:.86rem;font-weight:750;color:#246b72;background:#eef8f8}
    label{display:block;font-size:.82rem;font-weight:800;margin-bottom:8px}
    input{box-sizing:border-box;width:100%;border:1px solid #b9c8cc;border-radius:12px;padding:12px 14px;font:inherit;background:#fff;color:#15242a}
    #result{min-height:82px;margin-top:16px}
    a{color:#126f79}
    .notice{font-size:.82rem;margin-top:26px}
    @media(prefers-color-scheme:dark){body{background:#0d151a;color:#eef6f7}.card{background:#131f25;border-color:#2d4149}.pill{background:#142d32;border-color:#315f65;color:#94d9de}p{color:#a9bac0}input{background:#0d171c;border-color:#3b515a;color:#eef6f7}}
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">EcoMOF-AI data service</div>
    <h1>CSD MOF public data</h1>
    <p>A public, non-commercial research package derived from the CSD MOF Collection. CIF content is served on demand for the EcoMOF-AI structure viewer.</p>
    <div class="stats">
      <span class="pill">${recordCount.toLocaleString("en-US")} CIF structures</span>
      <span class="pill">${DATASET_VERSION}</span>
      <span class="pill">CC BY-NC-SA 4.0</span>
    </div>
    <section class="card">
      <label for="search">Find a CSD Refcode</label>
      <input id="search" autocomplete="off" maxlength="16" placeholder="Example: ABADUG">
      <div id="result"><p>Enter a Refcode to locate its metadata and CIF.</p></div>
    </section>
    <p class="notice">Source: Cambridge Crystallographic Data Centre (CCDC). This is not an official CCDC service and is not endorsed by CCDC. See <a href="NOTICE.md">attribution notice</a> and <a href="LICENSE-DATA.md">data license</a>.</p>
  </main>
  <script>
    const input=document.querySelector("#search")
    const result=document.querySelector("#result")
    let records=[]
    fetch("index/search.json").then(r=>r.json()).then(data=>{records=data.structures||[]})
    input.addEventListener("input",()=>{
      const query=input.value.trim().toUpperCase()
      if(!query){result.innerHTML="<p>Enter a Refcode to locate its metadata and CIF.</p>";return}
      const normalized=query.replace(/[^A-Z0-9]+/g,"")
      const matches=records.filter(record=>record.refcode.startsWith(query)||(record.searchAliases||[]).some(alias=>alias.toUpperCase().replace(/[^A-Z0-9]+/g,"").includes(normalized))).slice(0,8)
      result.innerHTML=matches.length?matches.map(record=>\`<p><strong>\${record.refcode}</strong>\${record.commonName?\` · \${record.commonName}\`:""} · \${record.formula||"formula pending"} · <a href="cif/\${record.prefix}/\${record.file}">open CIF</a></p>\`).join(""):"<p>No matching Refcode or common name.</p>"
    })
  </script>
</body>
</html>
`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sourceDirectory = path.resolve(String(args.source || process.env.CSD_MOF_SOURCE || ""))
  const outputDirectory = path.resolve(String(args.output || process.env.CSD_MOF_OUTPUT || ""))
  const archivePath = args.archive ? path.resolve(String(args.archive)) : null
  if (!args.source || !args.output) {
    throw new Error("Usage: node scripts/build-csd-mof-public-dataset.mjs --source <extracted-folder> --output <output-folder> [--archive <zip>]")
  }

  const detailsPath = path.join(sourceDirectory, "Framework details.csv")
  if (!(await fileExists(detailsPath))) throw new Error(`Missing source index: ${detailsPath}`)

  const [csvText, aliasRegistryText] = await Promise.all([
    readFile(detailsPath, "utf8"),
    readFile(new URL("../src/data/csdCommonAliases.json", import.meta.url), "utf8"),
  ])
  const aliasRegistry = JSON.parse(aliasRegistryText)
  const aliasesByRefcode = new Map()
  for (const alias of aliasRegistry.aliases || []) {
    for (const refcode of alias.refcodes || []) {
      aliasesByRefcode.set(String(refcode).toUpperCase(), {
        commonName: alias.canonicalName,
        searchAliases: [...new Set([alias.canonicalName, ...(alias.searchAliases || [])].filter(Boolean))],
        preferredAliasRefcode: alias.preferredRefcode,
        mofClass: alias.mofClass,
        mofFamily: alias.mofFamily,
        firstReportedYear: alias.firstReportedYear,
      })
    }
  }
  const lines = csvText.trim().split(/\r?\n/)
  const header = parseCsvLine(lines[0])
  const expectedHeader = [
    "CSD refcode",
    "CIF filename",
    "original crystal system",
    "Sohncke space group",
    "Percentage void space",
    "Charged framework",
    "Hydrogen added",
    "Unreliable chemistry",
  ]
  if (JSON.stringify(header) !== JSON.stringify(expectedHeader)) {
    throw new Error(`Unexpected Framework details.csv header: ${header.join(" | ")}`)
  }

  const rows = lines.slice(1).map(parseCsvLine)
  const refcodes = new Set()
  const filenames = new Set()
  for (const row of rows) {
    if (row.length !== expectedHeader.length) throw new Error(`Unexpected CSV row width for ${row[0] || "unknown"}`)
    if (refcodes.has(row[0])) throw new Error(`Duplicate Refcode: ${row[0]}`)
    if (filenames.has(row[1])) throw new Error(`Duplicate CIF filename: ${row[1]}`)
    refcodes.add(row[0])
    filenames.add(row[1])
  }

  await rm(outputDirectory, { force: true, recursive: true })
  await mkdir(path.join(outputDirectory, "cif"), { recursive: true })
  await mkdir(path.join(outputDirectory, "checksums"), { recursive: true })
  await mkdir(path.join(outputDirectory, "index"), { recursive: true })
  await mkdir(path.join(outputDirectory, "index", "prefix"), { recursive: true })
  await mkdir(path.join(outputDirectory, "source-metadata"), { recursive: true })

  let processed = 0
  const records = await runPool(rows, 24, async row => {
    const [refcode, cifStem, crystalSystem, sohncke, voidPercent, charged, hydrogenAdded, unreliableChemistry] = row
    const filename = `${cifStem}.cif`
    const sourcePath = path.join(sourceDirectory, filename)
    const prefix = refcode.slice(0, 2).toLowerCase()
    const relativePath = `cif/${prefix}/${filename}`
    const destinationDirectory = path.join(outputDirectory, "cif", prefix)
    const destinationPath = path.join(outputDirectory, relativePath)
    const buffer = await readFile(sourcePath)
    const cifSource = buffer.toString("utf8")
    const metadata = extractCifMetadata(cifSource)
    if (metadata.dataRefcode !== refcode || metadata.originalRefcode !== refcode) {
      throw new Error(`Refcode mismatch for ${filename}: CSV=${refcode}, data=${metadata.dataRefcode}, header=${metadata.originalRefcode}`)
    }
    await mkdir(destinationDirectory, { recursive: true })
    await writeFile(destinationPath, buffer)
    processed += 1
    if (processed % 1000 === 0) process.stdout.write(`Processed ${processed}/${rows.length}\n`)
    return {
      refcode,
      file: filename,
      path: relativePath,
      formula: metadata.formula,
      metalElements: metadata.metalElements,
      originalCrystalSystem: crystalSystem,
      sohncke: parseBooleanFlag(sohncke),
      voidPercent: Number(voidPercent),
      charged: parseBooleanFlag(charged),
      hydrogenAdded: parseBooleanFlag(hydrogenAdded),
      unreliableChemistry: parseBooleanFlag(unreliableChemistry),
      sha256: sha256(buffer),
      bytes: buffer.length,
    }
  })

  records.sort((a, b) => a.refcode.localeCompare(b.refcode))
  const aggregate = records.reduce((summary, record) => {
    summary.bytes += record.bytes
    if (record.charged) summary.charged += 1
    if (record.hydrogenAdded) summary.hydrogenAdded += 1
    if (record.unreliableChemistry) summary.unreliableChemistry += 1
    for (const metal of record.metalElements) summary.metalCounts[metal] = (summary.metalCounts[metal] || 0) + 1
    return summary
  }, { bytes: 0, charged: 0, hydrogenAdded: 0, unreliableChemistry: 0, metalCounts: {} })

  let archiveSha256 = ARCHIVE_SHA256
  if (archivePath) {
    const archiveBuffer = await readFile(archivePath)
    archiveSha256 = sha256(archiveBuffer)
    if (archiveSha256 !== ARCHIVE_SHA256) {
      throw new Error(`Archive SHA-256 mismatch: ${archiveSha256}`)
    }
  }

  const generatedAt = new Date().toISOString()
  const manifest = {
    dataset: DATASET_NAME,
    sourceProvider: "Cambridge Crystallographic Data Centre (CCDC)",
    sourceVersion: DATASET_VERSION,
    sourceUrl: SOURCE_URL,
    generatedAt,
    archiveSha256,
    license: {
      name: "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International",
      spdx: "CC-BY-NC-SA-4.0",
      url: LICENSE_URL,
    },
    content: {
      cifCount: records.length,
      cifBytes: aggregate.bytes,
      searchIndexPath: "index/search.json",
      detailIndexPattern: "index/prefix/<two-character-refcode-prefix>.json",
      aliasIndexPath: "index/aliases.json",
      legacyIndexPath: "index/structures.json",
      checksumPath: "checksums/sha256.csv",
      sharding: "lowercase first two characters of CSD Refcode",
      cifContentModified: false,
    },
    qualityFlags: {
      charged: aggregate.charged,
      hydrogenAdded: aggregate.hydrogenAdded,
      unreliableChemistry: aggregate.unreliableChemistry,
    },
    metalCounts: Object.fromEntries(Object.entries(aggregate.metalCounts).sort(([a], [b]) => a.localeCompare(b))),
  }
  const catalog = {
    schemaVersion: "1.0.0",
    dataset: {
      name: DATASET_NAME,
      version: DATASET_VERSION,
      generatedAt,
      license: manifest.license,
      sourceUrl: SOURCE_URL,
    },
    summary: {
      total: records.length,
      charged: aggregate.charged,
      hydrogenAdded: aggregate.hydrogenAdded,
      unreliableChemistry: aggregate.unreliableChemistry,
    },
    structures: records,
  }
  const searchCatalog = {
    schemaVersion: "2.0.0",
    dataset: catalog.dataset,
    summary: {
      ...catalog.summary,
      namedTotal: records.length,
      literatureNamed: records.filter(record => aliasesByRefcode.has(record.refcode)).length,
      platformNamed: records.filter(record => !aliasesByRefcode.has(record.refcode)).length,
    },
    indexMode: "prefix-details",
    structures: records.map(record => {
      const alias = aliasesByRefcode.get(record.refcode) || {}
      const lightweight = {
        refcode: record.refcode,
        file: record.file,
        prefix: record.refcode.slice(0, 2).toLowerCase(),
        formula: record.formula,
        metalElements: record.metalElements,
        ...alias,
      }
      const naming = buildCsdNamingFields(lightweight, alias)
      return {
        ...lightweight,
        platformName: naming.platformName,
      }
    }),
  }
  const recordsByPrefix = new Map()
  for (const record of records) {
    const prefix = record.refcode.slice(0, 2).toLowerCase()
    if (!recordsByPrefix.has(prefix)) recordsByPrefix.set(prefix, [])
    recordsByPrefix.get(prefix).push(record)
  }
  const prefixCatalogWrites = [...recordsByPrefix.entries()].map(([prefix, prefixRecords]) => (
    writeFile(
      path.join(outputDirectory, "index", "prefix", `${prefix}.json`),
      `${JSON.stringify({
        schemaVersion: "2.0.0",
        dataset: {
          name: DATASET_NAME,
          version: DATASET_VERSION,
          generatedAt,
        },
        prefix,
        summary: { total: prefixRecords.length },
        structures: prefixRecords,
      })}\n`,
    )
  ))
  const checksumLines = [
    "sha256,bytes,refcode,path",
    ...records.map(record => `${record.sha256},${record.bytes},${record.refcode},${record.path}`),
  ]

  await Promise.all([
    writeFile(path.join(outputDirectory, ".gitattributes"), "*.cif -diff\nsource-metadata/*.csv -diff\n"),
    writeFile(path.join(outputDirectory, ".nojekyll"), ""),
    writeFile(path.join(outputDirectory, "LICENSE-DATA.md"), licenseMarkdown()),
    writeFile(path.join(outputDirectory, "NOTICE.md"), noticeMarkdown({ archiveSha256, generatedAt })),
    writeFile(path.join(outputDirectory, "README.md"), readmeMarkdown({ recordCount: records.length, generatedAt })),
    writeFile(path.join(outputDirectory, "index.html"), landingHtml({ recordCount: records.length })),
    writeFile(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(outputDirectory, "index", "search.json"), `${JSON.stringify(searchCatalog)}\n`),
    writeFile(path.join(outputDirectory, "index", "aliases.json"), `${JSON.stringify(aliasRegistry, null, 2)}\n`),
    writeFile(path.join(outputDirectory, "index", "structures.json"), `${JSON.stringify(catalog)}\n`),
    writeFile(path.join(outputDirectory, "index", "summary.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(outputDirectory, "checksums", "sha256.csv"), `${checksumLines.join("\n")}\n`),
    copyFile(path.join(sourceDirectory, "00_README.txt"), path.join(outputDirectory, "SOURCE_README.txt")),
    ...[
      "Framework details.csv",
      "Charged frameworks.csv",
      "Frameworks with hydrogen added.csv",
      "Suspect chemistry frameworks.csv",
    ].map(filename => copyFile(path.join(sourceDirectory, filename), path.join(outputDirectory, "source-metadata", filename))),
    ...prefixCatalogWrites,
  ])

  const outputStats = await stat(outputDirectory)
  process.stdout.write(`${JSON.stringify({
    outputDirectory,
    outputCreated: outputStats.isDirectory(),
    records: records.length,
    searchIndexRecords: searchCatalog.structures.length,
    detailPrefixes: recordsByPrefix.size,
    bytes: aggregate.bytes,
    archiveSha256,
    qualityFlags: manifest.qualityFlags,
  }, null, 2)}\n`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
