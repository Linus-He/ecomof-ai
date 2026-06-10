// V2.0-H metadata verification queue generator (offline, reproducible).
//
// Builds a prioritized MANUAL-REVIEW queue from the V2.0-G sample using the shared
// buildMetadataVerificationQueue helper. It NEVER fabricates DOI / license / sourceUrl
// / citation — those stay null and the candidate stays a manual-review item. No
// candidate is auto-promoted to verified_metadata.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { buildMetadataVerificationQueue } from "../src/utils/databaseIndex/metadataVerification.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const sampleFile = path.join(repoRoot, "public", "data", "database_precompute", "v2_0_g", "parts", "verified_sample_part_001.json")
const outRoot = path.join(repoRoot, "public", "data", "database_precompute", "v2_0_h")

const sample = JSON.parse(fs.readFileSync(sampleFile, "utf8"))
const { queue, summary } = buildMetadataVerificationQueue(sample.records || [], { lang: "en" })

fs.mkdirSync(outRoot, { recursive: true })
fs.writeFileSync(path.join(outRoot, "metadata_verification_queue.json"), `${JSON.stringify({ version: "V2.0-H", queue, notFinalRecommendation: true }, null, 2)}\n`)
fs.writeFileSync(path.join(outRoot, "metadata_verification_summary.json"), `${JSON.stringify({ version: "V2.0-H", ...summary, boundary: "Manual-review queue only. No DOI/license/source is fabricated and no candidate is auto-verified.", boundaryZh: "仅人工核验队列。不伪造 DOI/license/来源，也不自动将任何候选标记为已核验。" }, null, 2)}\n`)

console.log(`V2.0-H queue built: ${summary.queueSize} items (high=${summary.priorityCounts.high}, medium=${summary.priorityCounts.medium})`)
console.log(`proposed tiers: ${JSON.stringify(summary.proposedTierCounts)}`)
console.log(`proposed verified_metadata: ${summary.proposedVerifiedMetadataCount} (must be 0 — no fabrication)`)
