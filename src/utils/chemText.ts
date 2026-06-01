// @ts-nocheck
export const SCIENTIFIC_TOKEN_FONT = '"Times New Roman", Times, serif'

const FORMULA_REPLACEMENTS = [
  [/HCO3[−-]/g, "HCO₃⁻"],
  [/HCOO[−-]/g, "HCOO⁻"],
  [/CO2/g, "CO₂"],
  [/CH4/g, "CH₄"],
  [/N2/g, "N₂"],
  [/O2/g, "O₂"],
  [/C2H2/g, "C₂H₂"],
  [/C2H4/g, "C₂H₄"],
  [/C2H6/g, "C₂H₆"],
  [/H2/g, "H₂"],
  [/NaH13CO3/g, "NaH¹³CO₃"],
]

export function chemText(value = "") {
  return FORMULA_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    String(value ?? "")
  )
}

export function isScientificToken(value = "") {
  return /^[A-Za-z0-9₂₃₄₆₁₃⁻+\-/().,\s]+$/.test(String(value || "").trim())
}
