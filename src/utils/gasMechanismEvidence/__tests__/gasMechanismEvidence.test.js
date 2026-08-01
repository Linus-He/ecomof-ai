import { describe, expect, it } from "vitest"
import { buildGasMechanismEvidence } from "../index"

const propertiesDoc = {
  sources: [
    { id: "nist-adsorption-data-resources", label: "NIST Data Resources for Adsorption" },
    { id: "nist-chemistry-webbook-srd69", label: "NIST Chemistry WebBook SRD 69" },
    { id: "jacs-ntu68-temperature-responsive-sieving", label: "NTU-68 mechanism reference" },
  ],
  gases: [
    { gas: "C3H6", kineticDiameterA: 4.0, polarityClass: "nonpolar-pi", condensabilityClass: "high" },
    { gas: "C3H8", kineticDiameterA: 4.3, polarityClass: "nonpolar", condensabilityClass: "high" },
    { gas: "CO2", kineticDiameterA: 3.3, polarityClass: "linear-quadrupolar", condensabilityClass: "moderate" },
    { gas: "N2", kineticDiameterA: 3.64, polarityClass: "linear-quadrupolar", condensabilityClass: "low" },
  ],
  databaseLookupTargets: [
    { id: "isotherm-gap", targetSourceId: "nist-adsorption-data-resources", missingWhen: "isotherm gap", queryFields: ["adsorbent"] },
    { id: "molecular-property-gap", targetSourceId: "nist-chemistry-webbook-srd69", missingWhen: "molecular property gap", queryFields: ["gas"] },
    { id: "breakthrough-gap", targetSourceId: "nist-adsorption-data-resources", missingWhen: "breakthrough gap", queryFields: ["DOI"] },
    { id: "framework-response-gap", targetSourceId: "jacs-ntu68-temperature-responsive-sieving", missingWhen: "framework response gap", queryFields: ["in situ PXRD"] },
  ],
}

describe("gas mechanism evidence", () => {
  it("keeps close-size kinetic sieving as a hypothesis until breakthrough evidence exists", () => {
    const result = buildGasMechanismEvidence({
      id: "candidate",
      displayName: "Tight pore candidate",
      gasPair: "C3H6/C3H8",
      primaryGas: "C3H6",
      secondaryGas: "C3H8",
      poreSizeA: 4.8,
      selectivity: 5.3,
      metrics: { selectivity: 5.3 },
      evidence: { hasBreakthroughValidation: false },
    }, { gasPair: "C3H6/C3H8" }, propertiesDoc, [])

    expect(result.kineticCandidate).toBe(true)
    expect(result.primaryMechanism).toBe("kinetic/dynamic sieving hypothesis")
    expect(result.layers.find(layer => layer.label === "Dynamic breakthrough").status).toBe("breakthrough-evidence-missing")
    expect(result.databaseGaps.map(gap => gap.id)).toContain("breakthrough-gap")
    expect(result.databaseGaps.map(gap => gap.id)).toContain("framework-response-gap")
  })

  it("detects temperature-enhanced dynamic behavior only from comparable breakthrough rows", () => {
    const rows = [
      {
        id: "low",
        canonicalId: "mof-a",
        displayName: "MOF-A",
        gasPair: "C3H6/C3H8",
        condition: { temperatureK: 273 },
        metrics: { breakthroughTime: 10 },
      },
      {
        id: "high",
        canonicalId: "mof-a",
        displayName: "MOF-A",
        gasPair: "C3H6/C3H8",
        condition: { temperatureK: 298 },
        metrics: { breakthroughTime: 20 },
      },
    ]

    const result = buildGasMechanismEvidence({
      canonicalId: "mof-a",
      displayName: "MOF-A",
      gasPair: "C3H6/C3H8",
      primaryGas: "C3H6",
      secondaryGas: "C3H8",
      poreSizeA: 4.8,
      metrics: { breakthroughTime: 20 },
      evidence: { hasBreakthroughValidation: true },
    }, { gasPair: "C3H6/C3H8" }, propertiesDoc, rows)

    expect(result.temperature.status).toBe("temperature-enhanced-breakthrough")
    expect(result.temperature.ratio).toBe(2)
    expect(result.layers.find(layer => layer.label === "Dynamic breakthrough").status).toBe("process-evidence-present")
  })
})
