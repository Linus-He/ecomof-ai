import { describe, expect, it } from "vitest"
import manifest from "../../../public/data/csd_structure_pilot_manifest.json"

describe("CSD structure pilot manifest", () => {
  it("keeps the authenticated-ingestion boundary explicit", () => {
    expect(manifest.sourceDatabase).toMatch(/CSD MOF Collection/)
    expect(manifest.registrationUrl).toBe("https://www.ccdc.cam.ac.uk/account/login/register")
    expect(manifest.license.spdx).toBe("CC-BY-NC-SA-4.0")
    expect(manifest.processingPolicy.rawCifRequired).toBe(true)
    expect(manifest.processingPolicy.polyhedraAreDerived).toBe(true)
  })

  it("does not claim unverified CSD records or renderable structures", () => {
    expect(manifest.records).toHaveLength(10)
    manifest.records.forEach(record => {
      expect(record.csdRefcode).toBeNull()
      expect(record.ccdcNumber).toBeNull()
      expect(record.cifFile).toBeNull()
      expect(record.sourceConfirmation).toBe("pending-authenticated-ingestion")
      expect(record.viewerStatus).toBe("blocked-no-cif")
    })
  })
})
