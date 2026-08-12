import fs from "node:fs/promises"
import path from "node:path"
import { normalizeText, stableHash } from "./catalysis-discovery-lib.mjs"

const root = process.cwd()
const queuePath = path.join(root, "public/data/catalysis_v2/catalysis_candidate_queue_v1.json")
const cacheDir = path.join(root, "data/curation/catalysis/discovery-doi-cache")
const liveMode = process.argv.includes("--live")
const readJson = async file => JSON.parse(await fs.readFile(file, "utf8"))
const queue = await readJson(queuePath)
const records = [...(queue.candidates || []), ...(queue.navigationCandidates || [])]

await fs.mkdir(cacheDir, { recursive: true })

function normalizedTitle(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "")
}

async function fetchWork(doi) {
  const url = new URL(`https://api.crossref.org/v1/works/${encodeURIComponent(doi)}`)
  if (process.env.CROSSREF_MAILTO) url.searchParams.set("mailto", process.env.CROSSREF_MAILTO)
  let lastError = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "EcoMOF-AI-catalysis-discovery-verifier/1.0 (https://github.com/linus-he/ecomof-ai)",
        },
      })
      if (!response.ok) throw new Error(`Crossref ${response.status} for ${doi}`)
      return (await response.json()).message || {}
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 800))
    }
  }
  throw lastError
}

if (!liveMode) {
  const missing = []
  for (const record of records) {
    try {
      await fs.access(path.join(cacheDir, `${record.doi.replace(/[^a-z0-9]+/g, "_")}.json`))
    } catch {
      missing.push(record.doi)
    }
  }
  console.log(JSON.stringify({ candidateCount: records.length, missingCacheCount: missing.length, missing }, null, 2))
  process.exit(missing.length ? 1 : 0)
}

for (const record of records) {
  const work = await fetchWork(record.doi)
  const registeredTitle = work.title?.[0] || ""
  const status = normalizedTitle(registeredTitle) === normalizedTitle(record.title) ? "matched" : "review-required"
  const cache = {
    schemaVersion: "catalysis-discovery-doi-verification-v1",
    doi: record.doi,
    checkedAt: new Date().toISOString(),
    checkedBy: "Crossref REST API single-work endpoint",
    registrationAgency: "Crossref",
    metadataMatch: {
      status,
      registeredTitle,
      discoveryTitle: record.title,
      journal: work["container-title"]?.[0] || null,
      year: work.published?.["date-parts"]?.[0]?.[0] || null,
      publicationType: work.type || null,
    },
    updateStatus: {
      status: (work.update?.length || work.relation?.["is-updated-by"]?.length) ? "review-required" : "none-declared",
      updateCount: work.update?.length || 0,
      relatedUpdateCount: work.relation?.["is-updated-by"]?.length || 0,
    },
    abstractPersisted: false,
    snapshotHash: stableHash(work),
  }
  const file = path.join(cacheDir, `${record.doi.replace(/[^a-z0-9]+/g, "_")}.json`)
  await fs.writeFile(file, `${JSON.stringify(cache, null, 2)}\n`)
  console.log(`${record.doi}\t${status}`)
}
