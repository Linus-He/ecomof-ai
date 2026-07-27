import { describe, expect, it } from "vitest"
import {
  buildCsdNamingFields,
  createEcoMofPlatformName,
  deriveMofMetalClass,
} from "../../utils/mofNaming.mjs"

describe("CSD MOF naming", () => {
  it("creates a stable platform name from metal identity and Refcode", () => {
    expect(createEcoMofPlatformName({
      refcode: "abavop",
      metalElements: ["Zn"],
    })).toBe("EcoMOF-Zn-ABAVOP")
    expect(createEcoMofPlatformName({
      refcode: "mixed01",
      metalElements: ["Cu", "Zn"],
    })).toBe("EcoMOF-Cu-Zn-MIXED01")
    expect(deriveMofMetalClass(["Cu", "Zn"])).toBe("Cu/Zn-MOFs")
  })

  it("uses a verified literature name for display while retaining the platform name", () => {
    const naming = buildCsdNamingFields(
      { refcode: "RUBTAK", metalElements: ["Zr"] },
      { commonName: "UiO-66", mofClass: "Zr-MOFs" },
    )

    expect(naming).toMatchObject({
      displayName: "UiO-66",
      platformName: "EcoMOF-Zr-RUBTAK",
      displayNameKind: "verified-literature-common-name",
      nameSource: "curated-identity-registry",
      csdRefcode: "RUBTAK",
    })
  })

  it("gives an unmapped CSD structure an explicit platform-canonical display name", () => {
    expect(buildCsdNamingFields({
      refcode: "ABAVOP",
      metalElements: ["Zn"],
    })).toMatchObject({
      displayName: "EcoMOF-Zn-ABAVOP",
      platformName: "EcoMOF-Zn-ABAVOP",
      displayNameKind: "ecomof-platform-canonical",
      nameSource: "derived-from-csd-refcode-and-metal-elements",
      mofClass: "Zn-MOFs",
      mofClassSource: "derived-from-csd-metal-elements",
      csdRefcode: "ABAVOP",
    })
  })
})
