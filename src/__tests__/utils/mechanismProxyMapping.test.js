// @ts-nocheck
import { describe, expect, it } from "vitest"
import { buildMechanismProxies, MECHANISM_PROXY_KEYS, summarizeMechanismEvidence, summarizeMechanismProxyAvailability } from "../../utils/organicAcid/mechanismProxyMapping"

describe("mechanismProxyMapping", () => {
  it("returns insufficient evidence (null) when descriptors are missing", () => {
    const result = buildMechanismProxies({ recordId: "X", descriptors: {} })
    expect(result.proxies.co2ActivationProxy).toBeNull()
    expect(result.proxies.poreTransportProxy).toBeNull()
    expect(result.missingProxies.length).toBeGreaterThan(0)
    // evidence confidence is always derivable (defaults to preview_only).
    expect(result.proxies.evidenceConfidenceProxy).not.toBeNull()
  })

  it("produces proxies when metal node / pore / stability fields are present", () => {
    const result = buildMechanismProxies({
      recordId: "Y",
      metalNode: "Cu",
      descriptors: {
        openMetalSiteProxy: 0.7,
        pldA: 9,
        poreVolume: 0.8,
        stabilityProxy: 0.75,
        hydrophilicityProxy: 0.5,
        lcdA: 14,
        bandGap: 2.4,
      },
      metadataVerification: { verificationLevel: "partial_metadata" },
      descriptorProvenance: { source: "database" },
    })
    expect(result.proxies.co2ActivationProxy).toBeGreaterThan(0)
    expect(result.proxies.poreTransportProxy).toBeGreaterThan(0)
    expect(result.proxies.hydrothermalStabilityProxy).toBeCloseTo(0.75, 5)
    expect(result.proxies.metalSiteSynergyProxy).toBeGreaterThan(0)
  })

  it("does not expose Li-S target variables and carries a boundary + bilingual explanations", () => {
    const result = buildMechanismProxies({ recordId: "Z", metalNode: "Zr", descriptors: { openMetalSiteProxy: 0.6, pldA: 8 } })
    const keysText = MECHANISM_PROXY_KEYS.join(" ").toLowerCase()
    expect(keysText).not.toMatch(/li2s|li-s|lithium|migration barrier|bond breaking/)
    expect(result.boundary).toMatch(/Not DFT|mechanism proxy/i)
    expect(result.boundary).toMatch(/not a final recommendation/i)
    expect(result.explanationsEn.co2ActivationProxy).toBeTruthy()
    expect(result.explanationsZh.co2ActivationProxy).toBeTruthy()
    expect(result.notFinalRecommendation).toBe(true)
  })

  it("summarizes proxy availability across records without crashing on legacy rows", () => {
    const summary = summarizeMechanismProxyAvailability([{}, { descriptors: { openMetalSiteProxy: 0.5, pldA: 7 } }])
    expect(summary.recordCount).toBe(2)
    expect(summary.availableByProxy.evidenceConfidenceProxy).toBe(2)
  })

  it("backfills an evidence status for every proxy (V2.0-H)", () => {
    const result = buildMechanismProxies({ recordId: "Y", metalNode: "Cu", descriptors: { openMetalSiteProxy: 0.6, pldA: 9, poreVolume: 0.8, lcdA: 12, stabilityProxy: 0.7 } })
    for (const key of MECHANISM_PROXY_KEYS) {
      expect(["literature_supported", "descriptor_inferred", "weak_proxy", "insufficient_evidence"]).toContain(result.evidence[key].evidenceStatus)
    }
    // Pore transport comes from database descriptors -> descriptor_inferred.
    expect(result.evidence.poreTransportProxy.evidenceStatus).toBe("descriptor_inferred")
    // Hydrothermal stability comes from a computed proxy -> weak_proxy.
    expect(result.evidence.hydrothermalStabilityProxy.evidenceStatus).toBe("weak_proxy")
    // No proxy is ever labeled DFT or experiment.
    expect(JSON.stringify(result.evidence).toLowerCase()).not.toMatch(/dft|experiment/)
  })

  it("marks missing-input proxies as insufficient_evidence", () => {
    const result = buildMechanismProxies({ recordId: "Z", descriptors: {} })
    expect(result.evidence.poreTransportProxy.evidenceStatus).toBe("insufficient_evidence")
  })

  it("summarizes mechanism evidence status counts", () => {
    const summary = summarizeMechanismEvidence([{ metalNode: "Cu", descriptors: { openMetalSiteProxy: 0.6, pldA: 9, poreVolume: 0.7, lcdA: 12 } }])
    expect(summary.statusCounts.weak_proxy + summary.statusCounts.descriptor_inferred).toBeGreaterThan(0)
    expect(summary.notFinalRecommendation).toBe(true)
  })
})
