import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { buildCsdNamingFields } from "../src/utils/mofNaming.mjs"

function parseArgs(argv) {
  const values = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith("--")) continue
    const key = token.slice(2)
    const value = argv[index + 1]
    if (value && !value.startsWith("--")) {
      values[key] = value
      index += 1
    } else {
      values[key] = true
    }
  }
  return values
}

function aliasMap(registry) {
  const result = new Map()
  for (const alias of registry.aliases || []) {
    for (const refcode of alias.refcodes || []) {
      result.set(String(refcode).toUpperCase(), {
        commonName: alias.canonicalName,
        searchAliases: [...new Set([alias.canonicalName, ...(alias.searchAliases || [])].filter(Boolean))],
        preferredAliasRefcode: alias.preferredRefcode,
        mofClass: alias.mofClass,
        mofFamily: alias.mofFamily,
        firstReportedYear: alias.firstReportedYear,
      })
    }
  }
  return result
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.data) {
    throw new Error("Usage: node scripts/split-csd-mof-public-index.mjs --data <public-data-repository>")
  }
  const dataDirectory = path.resolve(String(args.data))
  const legacyPath = path.join(dataDirectory, "index", "structures.json")
  const aliasPath = new URL("../src/data/csdCommonAliases.json", import.meta.url)
  const [legacyText, aliasText] = await Promise.all([
    readFile(legacyPath, "utf8"),
    readFile(aliasPath, "utf8"),
  ])
  const catalog = JSON.parse(legacyText)
  const aliases = JSON.parse(aliasText)
  const aliasesByRefcode = aliasMap(aliases)
  const records = Array.isArray(catalog.structures) ? catalog.structures : []
  const literatureNamed = records.filter(record => aliasesByRefcode.has(String(record.refcode || "").toUpperCase())).length
  const searchCatalog = {
    schemaVersion: "2.0.0",
    dataset: catalog.dataset || {},
    summary: {
      ...(catalog.summary || { total: records.length }),
      namedTotal: records.length,
      literatureNamed,
      platformNamed: records.length - literatureNamed,
    },
    indexMode: "prefix-details",
    structures: records.map(record => {
      const alias = aliasesByRefcode.get(String(record.refcode || "").toUpperCase()) || {}
      const lightweight = {
        refcode: record.refcode,
        file: record.file || String(record.path || "").split("/").pop(),
        prefix: String(record.refcode || "").slice(0, 2).toLowerCase(),
        formula: record.formula || null,
        metalElements: Array.isArray(record.metalElements) ? record.metalElements : [],
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
    const prefix = String(record.refcode || "").slice(0, 2).toLowerCase()
    if (!recordsByPrefix.has(prefix)) recordsByPrefix.set(prefix, [])
    recordsByPrefix.get(prefix).push(record)
  }

  const prefixDirectory = path.join(dataDirectory, "index", "prefix")
  await mkdir(prefixDirectory, { recursive: true })
  await Promise.all([
    writeFile(path.join(dataDirectory, "index", "search.json"), `${JSON.stringify(searchCatalog)}\n`),
    writeFile(path.join(dataDirectory, "index", "aliases.json"), `${JSON.stringify(aliases, null, 2)}\n`),
    ...[...recordsByPrefix.entries()].map(([prefix, prefixRecords]) => (
      writeFile(
        path.join(prefixDirectory, `${prefix}.json`),
        `${JSON.stringify({
          schemaVersion: "2.0.0",
          dataset: {
            name: catalog.dataset?.name,
            version: catalog.dataset?.version,
            generatedAt: catalog.dataset?.generatedAt,
          },
          prefix,
          summary: { total: prefixRecords.length },
          structures: prefixRecords,
        })}\n`,
      )
    )),
  ])

  process.stdout.write(`${JSON.stringify({
    dataDirectory,
    records: records.length,
    detailPrefixes: recordsByPrefix.size,
    searchPath: "index/search.json",
    detailPattern: "index/prefix/<prefix>.json",
    aliases: aliases.aliases?.length || 0,
  }, null, 2)}\n`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
