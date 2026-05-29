// @ts-nocheck
import { getDescriptor } from "./descriptorRegistry"

export function validateDescriptorKeys(keys = []) {
  const seen = new Set()
  const valid = []
  const warnings = []
  ;(Array.isArray(keys) ? keys : []).forEach(key => {
    if (seen.has(key)) {
      warnings.push(`Duplicate descriptor key ignored: ${key}`)
      return
    }
    seen.add(key)
    const descriptor = getDescriptor(key)
    if (!descriptor) {
      warnings.push(`Unknown descriptor key ignored: ${key}`)
      return
    }
    valid.push(key)
  })
  return { valid, warnings }
}

export function getDescriptorUsageByPreset(descriptorKey, presets = {}) {
  return Object.values(presets)
    .filter(preset => Array.isArray(preset.descriptorKeys) && preset.descriptorKeys.includes(descriptorKey))
    .map(preset => preset.key || preset.id)
}
