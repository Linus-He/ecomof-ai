import { SCIENTIFIC_TOKEN_FONT } from "../../utils/chemText"

function normalizeMinus(value) {
  return String(value ?? "").replace(/−/g, "-").trim()
}

function parseFormulaPart(rawValue) {
  const value = normalizeMinus(rawValue)
  if (!value) return []
  if (value === "NaH13CO3") {
    return [
      { text: "Na" },
      { text: "H" },
      { text: "13", type: "sup" },
      { text: "C" },
      { text: "O" },
      { text: "3", type: "sub" },
    ]
  }

  let body = value
  let charge = ""
  const sign = body.match(/[+-]$/)?.[0]
  if (sign) {
    const withoutSign = body.slice(0, -1)
    const chargeDigits = withoutSign.match(/\d+$/)?.[0] || ""
    const withoutDigits = chargeDigits ? withoutSign.slice(0, -chargeDigits.length) : withoutSign
    const singleIon = /^[A-Z][a-z]?$/.test(withoutDigits)
    if (singleIon && chargeDigits) {
      body = withoutDigits
      charge = `${chargeDigits}${sign === "-" ? "−" : "+"}`
    } else {
      body = withoutSign
      charge = sign === "-" ? "−" : "+"
    }
  }

  const tokens = []
  const pattern = /([A-Z][a-z]?)(\d*)/g
  let match
  while ((match = pattern.exec(body)) !== null) {
    tokens.push({ text: match[1] })
    if (match[2]) tokens.push({ text: match[2], type: "sub" })
  }
  if (!tokens.length) tokens.push({ text: body })
  if (charge) tokens.push({ text: charge, type: "sup" })
  return tokens
}

function FormulaPart({ value }) {
  return (
    <>
      {parseFormulaPart(value).map((token, index) => {
        if (token.type === "sub") return <sub key={`${token.text}-${index}`}>{token.text}</sub>
        if (token.type === "sup") return <sup key={`${token.text}-${index}`}>{token.text}</sup>
        return <span key={`${token.text}-${index}`}>{token.text}</span>
      })}
    </>
  )
}

function toAsciiFormula(value) {
  return String(value)
    .replace(/NaH¹³CO₃/g, "NaH13CO3")
    .replace(/NaHCO₃/g, "NaHCO3")
    .replace(/HCO₃⁻/g, "HCO3-")
    .replace(/HCOO⁻/g, "HCOO-")
    .replace(/CO₂/g, "CO2")
    .replace(/CH₄/g, "CH4")
    .replace(/N₂/g, "N2")
    .replace(/H₂/g, "H2")
    .replace(/C₂H₂/g, "C2H2")
    .replace(/C₂H₄/g, "C2H4")
    .replace(/Fe³⁺/g, "Fe3+")
    .replace(/Mg²⁺/g, "Mg2+")
    .replace(/Li⁺/g, "Li+")
}

export function ChemicalFormula({ value, formula, className = "", style, separator = " / " }) {
  const raw = normalizeMinus(toAsciiFormula(value ?? formula))
  const parts = raw.split(/\s*\/\s*/).filter(Boolean)
  return (
    <span className={`chemical-formula ${className}`.trim()} style={{ fontFamily: SCIENTIFIC_TOKEN_FONT, ...style }}>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {index > 0 ? <span className="chemical-formula-separator">{separator}</span> : null}
          <FormulaPart value={part} />
        </span>
      ))}
    </span>
  )
}

export function ChemicalText({ value, children, style }) {
  const raw = String(value ?? children ?? "")
  const pattern = /(NaH13CO3|NaH¹³CO₃|NaHCO3|NaHCO₃|HCO3[−-]?|HCO₃⁻|HCOO[−-]?|HCOO⁻|CO2|CO₂|CH4|CH₄|N2|N₂|H2|H₂|C2H2|C₂H₂|C2H4|C₂H₄|Fe3\+|Fe³⁺|Mg2\+|Mg²⁺|Li\+|Li⁺)/g
  const exactPattern = /^(NaH13CO3|NaH¹³CO₃|NaHCO3|NaHCO₃|HCO3[−-]?|HCO₃⁻|HCOO[−-]?|HCOO⁻|CO2|CO₂|CH4|CH₄|N2|N₂|H2|H₂|C2H2|C₂H₂|C2H4|C₂H₄|Fe3\+|Fe³⁺|Mg2\+|Mg²⁺|Li\+|Li⁺)$/
  const parts = raw.split(pattern).filter(part => part !== "")
  return (
    <span style={style}>
      {parts.map((part, index) => (
        exactPattern.test(part)
          ? <ChemicalFormula key={`${part}-${index}`} value={part} />
          : <span key={`${part}-${index}`}>{part}</span>
      ))}
    </span>
  )
}
