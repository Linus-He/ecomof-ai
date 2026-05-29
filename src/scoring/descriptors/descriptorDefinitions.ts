// @ts-nocheck
import { DESCRIPTOR_REGISTRY, getDescriptor, getDescriptors } from "./descriptorRegistry"

export const GENERAL_MOF_DESCRIPTOR_KEYS = [
  "surfaceArea",
  "poreSizeA",
  "poreVolume",
  "co2Uptake",
  "bandGap",
  "waterStability",
  "thermalStability",
  "toxicityConcern",
]

export const CATALYSIS_FORMATE_DESCRIPTOR_KEYS = ["d_stab", "d_barrier", "d_select"]

export const GENERAL_MOF_DESCRIPTOR_DEFINITIONS = Object.fromEntries(
  getDescriptors(GENERAL_MOF_DESCRIPTOR_KEYS).map(descriptor => [descriptor.key, descriptor])
)

export const CATALYSIS_FORMATE_DESCRIPTOR_DEFINITIONS = Object.fromEntries(
  getDescriptors(CATALYSIS_FORMATE_DESCRIPTOR_KEYS).map(descriptor => [descriptor.key, descriptor])
)

export const DESCRIPTOR_DEFINITIONS = DESCRIPTOR_REGISTRY

export function resolveDescriptorDefinitions(descriptors = []) {
  return descriptors.map(descriptor => {
    if (typeof descriptor === "object" && descriptor?.key) {
      return { ...(getDescriptor(descriptor.key) || {}), ...descriptor }
    }
    const key = String(descriptor)
    return getDescriptor(key) || { key, label: key, labelZh: key, valueType: "number", sourceField: key }
  })
}
