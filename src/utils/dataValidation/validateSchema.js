// @ts-nocheck
// Required-field completeness across the five layers.
const REQUIRED = {
  mof: ["mofId", "displayName", "metalNode"],
  reaction: ["reactionId", "targetProduct"],
}

export function validateSchema(record = {}) {
  const missing = []
  for (const [layer, fields] of Object.entries(REQUIRED)) {
    const layerData = record[layer] || {}
    for (const field of fields) {
      const value = layerData[field]
      if (value == null || value === "" || String(value).toLowerCase() === "unknown") {
        missing.push(`${layer}.${field}`)
      }
    }
  }
  return { check: "schema", ok: missing.length === 0, missing }
}
