// @ts-nocheck
import { describe, expect, it } from "vitest"
import { CAT_MOF_OPTIONS, catScienceZoneForPoint, computeCatEnergyState } from "../../components/catalysis/catEnergyModel"

const pathway = {
  id: "formic-acid",
  labelZh: "甲酸路径",
  labelEn: "Formic acid pathway",
  baselineEa: 72,
  baselineDeltaE: -6,
  evidenceLevel: "C",
  descriptorWeights: {},
}

describe("cat energy model science zones", () => {
  it("maps two-dimensional cat points to Organic Acid science zones", () => {
    expect(catScienceZoneForPoint({ x: 150, y: 230 })).toEqual(expect.objectContaining({
      id: "hydrothermal-gate",
      reactionZoneId: "adsorption",
      actionId: "organic-acid-final-framework-ranking",
    }))
    expect(catScienceZoneForPoint({ x: 390, y: 100 })).toEqual(expect.objectContaining({
      id: "hot-spot-map",
      reactionZoneId: "transition",
      actionId: "organic-acid-final-hot-spot-map",
    }))
    expect(catScienceZoneForPoint({ x: 560, y: 230 })).toEqual(expect.objectContaining({
      id: "exafs",
      reactionZoneId: "transition",
      actionId: "organic-acid-final-exafs",
    }))
    expect(catScienceZoneForPoint({ x: 660, y: 260 })).toEqual(expect.objectContaining({
      id: "candidate-trace",
      reactionZoneId: "product",
      actionId: "organic-acid-final-validation-roadmap",
    }))
  })

  it("keeps science-zone insights tied to reaction-coordinate effects", () => {
    const mof = CAT_MOF_OPTIONS.find(row => row.id === "uio66nh2")
    const hydrothermal = computeCatEnergyState({
      pathway,
      descriptors: [],
      selectedDescriptorIds: [],
      mof,
      catProgress: 12,
      catScienceZone: catScienceZoneForPoint({ x: 150, y: 230 }),
    })
    const hotSpot = computeCatEnergyState({
      pathway,
      descriptors: [],
      selectedDescriptorIds: [],
      mof,
      catProgress: 52,
      catScienceZone: catScienceZoneForPoint({ x: 390, y: 100 }),
    })

    expect(hydrothermal.zone.id).toBe("hydrothermal-gate")
    expect(hydrothermal.contributions.find(row => row.id === "zone-hydrothermal-gate").activationEnergyDelta).toBe(-2)
    expect(hotSpot.zone.id).toBe("hot-spot-map")
    expect(hotSpot.contributions.find(row => row.id === "zone-hot-spot-map").activationEnergyDelta).toBe(-6)
    expect(hotSpot.tsStabilization).toBeGreaterThan(hydrothermal.tsStabilization)
  })
})
