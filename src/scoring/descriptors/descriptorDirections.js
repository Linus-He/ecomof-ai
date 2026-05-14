import { DESCRIPTOR_DIRECTIONS } from "../types/scoringTypes"
import { CATALYSIS_FORMATE_DESCRIPTOR_KEYS, GENERAL_MOF_DESCRIPTOR_KEYS, resolveDescriptorDefinitions } from "./descriptorDefinitions"

export const GENERAL_MOF_DESCRIPTOR_DIRECTIONS = Object.fromEntries(
  resolveDescriptorDefinitions(GENERAL_MOF_DESCRIPTOR_KEYS).map(descriptor => [descriptor.key, descriptor.direction || DESCRIPTOR_DIRECTIONS.BENEFIT])
)

export const CATALYSIS_FORMATE_DESCRIPTOR_DIRECTIONS = Object.fromEntries(
  resolveDescriptorDefinitions(CATALYSIS_FORMATE_DESCRIPTOR_KEYS).map(descriptor => [descriptor.key, descriptor.direction || DESCRIPTOR_DIRECTIONS.BENEFIT])
)

export function normalizeDescriptorDirections(descriptors = [], presetDirections = {}, overrides = {}) {
  return descriptors.reduce((map, descriptor) => {
    const key = descriptor.key || descriptor
    const direction = overrides?.[key] || presetDirections?.[key] || descriptor.direction || DESCRIPTOR_DIRECTIONS.BENEFIT
    map[key] = direction === DESCRIPTOR_DIRECTIONS.COST ? DESCRIPTOR_DIRECTIONS.COST : DESCRIPTOR_DIRECTIONS.BENEFIT
    return map
  }, {})
}
