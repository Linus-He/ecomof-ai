import { describe, expect, it } from "vitest"
import { buildCandidateSearchText, getReadableMofLabel } from "../../utils/mofDisplayName"

describe("readable MOF labels", () => {
  it("keeps raw database identifiers out of user-facing candidate titles", () => {
    const record = {
      displayName: "CoRE MOF record",
      rawName: "ja512973b_si_005_auto",
      sourceRecordId: "ja512973b_si_005_auto",
      sourceDatabase: "CoRE MOF DB",
      metalNode: "Zr",
    }

    expect(getReadableMofLabel(record, "zh")).toBe("Zr-MOF 候选")
    expect(getReadableMofLabel(record, "en")).toBe("Zr-MOF candidate")
    expect(buildCandidateSearchText(record)).toContain("ja512973b_si_005_auto")
  })

  it("preserves recognized material names", () => {
    expect(getReadableMofLabel({ displayName: "UiO-66", metalNode: "Zr" }, "zh")).toBe("UiO-66")
    expect(getReadableMofLabel({ rawName: "MOF-5", metalNode: "Zn" }, "en")).toBe("MOF-5")
  })

  it("uses an honest unnamed fallback when no interpretable name or metal exists", () => {
    expect(getReadableMofLabel({ sourceRecordId: "DIDDOK_clean_pacman" }, "zh")).toBe("未命名 MOF 候选")
  })
})
