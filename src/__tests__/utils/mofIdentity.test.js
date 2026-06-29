import { describe, expect, it } from "vitest"
import registry from "../../../public/data/mof_identity_registry.json"
import { getLinkedRecords, normalizeMofName, resolveMof } from "../../utils/mofIdentity"

describe("mof identity registry", () => {
  it("normalizes common MOF aliases", () => {
    expect(normalizeMofName("Cu3(BTC)2")).toContain("cu-btc")
    expect(resolveMof("HKUST-1", registry)).toBe(resolveMof("Cu-BTC", registry))
    expect(resolveMof("MOF-199", registry)).toBe(resolveMof("HKUST1", registry))
  })

  it("returns linked buckets without forcing unresolved names", () => {
    const canonicalId = resolveMof("HKUST-1", registry)
    const links = getLinkedRecords(canonicalId, registry)
    expect(links).toMatchObject({ structural: expect.any(Array), gas: expect.any(Array), catalysis: expect.any(Array) })
    expect(resolveMof("not-a-real-mof-name", registry)).toBeNull()
  })
})
