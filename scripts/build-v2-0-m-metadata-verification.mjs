// V2.0-M verified metadata gate builder (offline, reproducible).
//
// Runs the strict verified-metadata gate over the candidates nearest to verified.
// It NEVER goes to the network and NEVER fabricates DOI / license / source URL /
// citation. Because the curated fixture record ids cannot be mapped to an exact
// external record offline, fixtureRecordMappingStatus stays "ambiguous" and the gate
// honestly keeps verifiedMetadata = false. The summary records the blocking reasons.
// MIL-101(Al) stays in ambiguity quarantine (Cr vs Al framework).
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import {
  normalizeVerificationRecord,
  buildVerifiedMetadataGateSummary,
  buildVerifiedCandidateReport,
} from "../src/utils/databaseIndex/verifiedMetadataGate.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const outRoot = path.join(repoRoot, "public", "data", "database_precompute", "v2_0_m")
const recordsFile = path.join(outRoot, "metadata_verification_records.json")

function readJson(file) {
  if (!fs.existsSync(file)) return null
  try { return JSON.parse(fs.readFileSync(file, "utf8")) } catch { return null }
}

// Seed candidates: source/citation confirmed at material level offline, but sourceUrl,
// license, DOI, and exact fixture-record mapping cannot be confirmed offline, so they
// stay pending/ambiguous. No value is fabricated.
const SEED = [
  {
    candidateId: "COREMOF_000001", displayName: "MIL-53(Al) curated example database index preview",
    sourceConfirmed: true, sourceUrl: null, sourceUrlStatus: "pending",
    doi: null, doiStatus: "pending",
    license: null, licenseStatus: "pending",
    exactCitation: null, citationStatus: "pending",
    fixtureRecordMappingStatus: "ambiguous",
    ambiguityWarnings: [],
    verificationNotes: "MIL-53(Al) is a well-known Al terephthalate framework (Loiseau et al., Chem. Eur. J., 2004 at material level), but sourceUrl/license/DOI and exact record mapping are unconfirmed offline.",
  },
  {
    candidateId: "COREMOF_000002", displayName: "CAU-10(Al) curated example database index preview",
    sourceConfirmed: true, sourceUrl: null, sourceUrlStatus: "pending",
    doi: null, doiStatus: "pending",
    license: null, licenseStatus: "pending",
    exactCitation: null, citationStatus: "pending",
    fixtureRecordMappingStatus: "ambiguous",
    ambiguityWarnings: [],
    verificationNotes: "CAU-10(Al) is a known Al isophthalate series (Reinsch et al., Chem. Mater., 2013 at material level); sourceUrl/license/DOI and exact record mapping unconfirmed offline.",
  },
  {
    candidateId: "COREMOF_000003", displayName: "MIL-100(Al) curated example database index preview",
    sourceConfirmed: true, sourceUrl: null, sourceUrlStatus: "pending",
    doi: null, doiStatus: "pending",
    license: null, licenseStatus: "pending",
    exactCitation: null, citationStatus: "pending",
    fixtureRecordMappingStatus: "ambiguous",
    ambiguityWarnings: [],
    verificationNotes: "MIL-100(Al) is a known mesoporous Al trimesate (Volkringer et al., Chem. Mater., 2009 at material level); sourceUrl/license/DOI and exact record mapping unconfirmed offline.",
  },
  {
    candidateId: "COREMOF_000005", displayName: "DUT-4(Al) curated example database index preview",
    sourceConfirmed: true, sourceUrl: null, sourceUrlStatus: "pending",
    doi: null, doiStatus: "pending",
    license: null, licenseStatus: "pending",
    exactCitation: null, citationStatus: "pending",
    fixtureRecordMappingStatus: "ambiguous",
    ambiguityWarnings: [],
    verificationNotes: "DUT-4(Al) is a known Al 2,6-ndc framework (Senkovska et al., Microporous Mesoporous Mater., 2009 at material level); sourceUrl/license/DOI and exact record mapping unconfirmed offline.",
  },
  {
    candidateId: "COREMOF_000004", displayName: "MIL-101(Al) curated example database index preview",
    sourceConfirmed: false, sourceUrl: null, sourceUrlStatus: "ambiguous",
    doi: null, doiStatus: "ambiguous",
    license: null, licenseStatus: "pending",
    exactCitation: null, citationStatus: "ambiguous",
    fixtureRecordMappingStatus: "ambiguous",
    ambiguityWarnings: [
      "MIL-101 was originally reported for Cr, not Al; the Al analogue is a distinct material and must not be assumed from the Cr framework.",
      "Curated fixture record id cannot be mapped to an exact external source record offline.",
    ],
    quarantined: true,
    verificationNotes: "MIL-101(Al) remains in ambiguity quarantine (Cr vs Al framework). It must not enter verified metadata.",
  },
]

export function buildMetadataVerification(seed = SEED, existing = []) {
  const existingById = new Map((existing || []).map(r => [r.candidateId, r]))
  // Only manual evidence fields are preserved across re-runs; derived fields
  // (ambiguityWarnings, quarantined, blockers, notes) always come from the seed/gate.
  const MANUAL_FIELDS = ["sourceConfirmed", "sourceUrl", "sourceUrlStatus", "doi", "doiStatus", "license", "licenseStatus", "exactCitation", "citationStatus", "fixtureRecordMappingStatus"]
  const records = seed.map(record => {
    const prev = existingById.get(record.candidateId)
    const merged = { ...record }
    if (prev) {
      for (const field of MANUAL_FIELDS) {
        if (prev[field] !== null && prev[field] !== undefined && prev[field] !== "" && prev[field] !== "pending" && prev[field] !== "ambiguous") {
          merged[field] = prev[field]
        }
      }
    }
    return normalizeVerificationRecord(merged)
  })
  const summary = buildVerifiedMetadataGateSummary(records)
  const report = buildVerifiedCandidateReport(records)
  return { records, summary, report }
}

function stripNulls(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined && v !== "") out[k] = v
  }
  return out
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const existing = readJson(recordsFile)?.records || []
  const { records, summary, report } = buildMetadataVerification(SEED, existing)
  fs.mkdirSync(outRoot, { recursive: true })
  fs.writeFileSync(recordsFile, `${JSON.stringify({ version: "V2.0-M", records, notFinalRecommendation: true }, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "verified_metadata_gate_summary.json"), `${JSON.stringify({ version: "V2.0-M", ...summary }, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "verified_candidate_report.json"), `${JSON.stringify(report, null, 2)}\n`)

  console.log(`V2.0-M metadata verification built: ${records.length} candidates checked`)
  console.log(`source confirmed=${summary.sourceConfirmedCount} citation ready=${summary.citationReadyCount} verifiedMetadataCount=${summary.verifiedMetadataCount} quarantined=${summary.quarantinedCount}`)
  if (summary.verifiedMetadataCount === 0) console.log(`verified metadata blocked by: ${summary.blockingReasons.join("; ")}`)
}
