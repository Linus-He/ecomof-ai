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

  it("uses the professional CSD Refcode as the public name while retaining an internal stable ID", () => {
    expect(buildCsdNamingFields({
      refcode: "ABAVOP",
      metalElements: ["Zn"],
    })).toMatchObject({
      displayName: "ABAVOP",
      platformName: "EcoMOF-Zn-ABAVOP",
      displayNameKind: "csd-refcode",
      nameSource: "csd-refcode",
      mofClass: "Zn-MOFs",
      mofClassSource: "derived-from-csd-metal-elements",
      csdRefcode: "ABAVOP",
    })
  })
})
