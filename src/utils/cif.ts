// @ts-nocheck
export function extractCifValue(text, tag) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = text.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s+([^\\n\\r]+)`, "i"))
  if (!match) return null
  return match[1].trim().replace(/^['"]|['"]$/g, "")
}

export function parseNumericCifValue(value) {
  if (!value) return null
  const match = String(value).match(/-?\d+(?:\.\d+)?/)
  return match ? parseFloat(match[0]) : null
}

export function parseCifText(text, fileName = "") {
  const block = text.match(/(?:^|\n)\s*data_([^\s]+)/i)
  const nameFromBlock = block ? block[1].replace(/[_-]clean.*$/i, "") : ""
  const name = nameFromBlock || fileName.replace(/\.(cif|txt)$/i, "")
  const cell = {
    a: parseNumericCifValue(extractCifValue(text, "_cell_length_a")),
    b: parseNumericCifValue(extractCifValue(text, "_cell_length_b")),
    c: parseNumericCifValue(extractCifValue(text, "_cell_length_c")),
    alpha: parseNumericCifValue(extractCifValue(text, "_cell_angle_alpha")),
    beta: parseNumericCifValue(extractCifValue(text, "_cell_angle_beta")),
    gamma: parseNumericCifValue(extractCifValue(text, "_cell_angle_gamma")),
  }
  const descriptorCandidates = {
    poreDiameter: ["_pore_diameter", "_pld", "_pore_limiting_diameter", "_largest_free_sphere"],
    betSurfaceArea: ["_bet_surface_area", "_surface_area_m2g", "_asa_m2g", "_accessible_surface_area"],
    poreVolume: ["_pore_volume", "_void_volume", "_accessible_volume_cm3g"],
  }
  const descriptors = {}
  for (const [key, tags] of Object.entries(descriptorCandidates)) {
    const value = tags.map(tag => parseNumericCifValue(extractCifValue(text, tag))).find(v => Number.isFinite(v))
    if (Number.isFinite(value)) descriptors[key] = value
  }
  return { name, cell, descriptors }
}
