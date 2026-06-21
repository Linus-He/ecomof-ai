// @ts-nocheck
// V3.9 export — pure JSON serialization that always wraps the payload with
// provenance metadata (version, generatedAt, dataVersion, dataMode, provenance)
// and strips undefined / NaN so the exported file is self-describing and clean.
import { sanitizeCell } from "./sanitizeExportRows"

const DATA_MODES = ["demo", "seed", "curated", "inferred", "experimental", "literature", "simulation", "mixed"]

function deepClean(value: any): any {
  if (value == null) return null
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (Array.isArray(value)) return value.map(deepClean)
  if (typeof value === "object") {
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue
      out[k] = deepClean(v)
    }
    return out
  }
  return value
}

export function buildExportEnvelope({ title = "EcoMOF-AI Export", version = "V0.0", generatedAt, dataVersion, dataMode = "mixed", provenance = null, payload = {} }: any = {}): any {
  const mode = DATA_MODES.includes(String(dataMode)) ? dataMode : "mixed"
  return {
    title,
    version,
    generatedAt: generatedAt || new Date().toISOString(),
    dataVersion: dataVersion || version,
    dataMode: mode,
    provenance: provenance ? deepClean(provenance) : { note: "Provenance not attached; see source_registry.json." },
    payload: deepClean(payload),
  }
}

export function buildJson(payloadOrEnvelope: any = {}, options: any = {}): string {
  const envelope = options && options.wrap === false ? deepClean(payloadOrEnvelope) : buildExportEnvelope({ ...options, payload: payloadOrEnvelope })
  return JSON.stringify(envelope, null, 2) + "\n"
}

export { sanitizeCell }
export default buildJson
