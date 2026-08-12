import fs from "node:fs/promises"
import path from "node:path"
import { normalizeDoi, stableHash } from "./catalysis-v2-lib.mjs"

const args = new Set(process.argv.slice(2))
const live = args.has("--live")
const root = process.cwd()
const sourcePath = path.join(root, "public/data/catalysis_reaction_records_v1.json")
const cacheDir = path.join(root, "data/curation/catalysis/doi-cache")
const dataset = JSON.parse(await fs.readFile(sourcePath, "utf8"))
await fs.mkdir(cacheDir, { recursive: true })

function normalizeTitle(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
}

if (!live) {
  console.log("Dry run only. Add --live to refresh Crossref metadata. Existing curated data is unchanged.")
  console.log(JSON.stringify({ doiCount: dataset.sources.length, cacheDir }, null, 2))
  process.exit(0)
}

const mailto = process.env.CROSSREF_MAILTO
if (!mailto) throw new Error("CROSSREF_MAILTO is required for the Crossref polite pool.")

for (const source of dataset.sources) {
  const doi = normalizeDoi(source.doi)
  const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${encodeURIComponent(mailto)}`, {
    headers: { "User-Agent": `EcoMOF-AI-catalysis-verifier/2.0 (mailto:${mailto})` },
  })
  if (!response.ok) throw new Error(`Crossref ${response.status} for ${doi}`)
  const payload = await response.json()
  const work = payload.message || {}
  const registeredTitle = work.title?.[0] || ""
  const status = normalizeTitle(registeredTitle) === normalizeTitle(source.title) ? "matched" : "review-required"
  const cache = {
    doi,
    checkedAt: new Date().toISOString(),
    checkedBy: "Crossref REST API",
    registrationAgency: "Crossref",
    metadataMatch: { status, registeredTitle, curatedTitle: source.title, journal: work["container-title"]?.[0] || null, year: work.published?.["date-parts"]?.[0]?.[0] || null },
    scholarStatus: (work.update?.length || work.relation?.["is-updated-by"]?.length) ? "has-update-review-required" : "no-update-declared-in-crossref-record",
    updateStatus: { status: (work.update?.length || work.relation?.["is-updated-by"]?.length) ? "review-required" : "none-declared", update: work.update || [], relation: work.relation || {} },
    fullTextAccess: work.link?.length ? "crossref-link-available" : "landing-page-only",
    license: { fullTextReuseStatus: work.license?.length ? "publisher-license-declared-review-required" : "not-established", trainingUseAllowed: false, records: work.license || [] },
    crossrefSnapshotHash: stableHash(work),
  }
  const file = path.join(cacheDir, `${doi.replace(/[^a-z0-9]+/g, "_")}.json`)
  await fs.writeFile(file, `${JSON.stringify(cache, null, 2)}\n`)
  console.log(`${doi}\t${status}`)
}
