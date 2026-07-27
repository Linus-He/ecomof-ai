function normalizedRefcode(value) {
  return String(value || "").trim().toUpperCase()
}

function normalizedMetals(values) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map(value => String(value || "").trim())
      .filter(Boolean),
  )]
}

export function deriveMofMetalClass(metalElements = []) {
  const metals = normalizedMetals(metalElements)
  if (!metals.length) return "Metal class pending"
  return `${metals.join("/")}-MOFs`
}

export function createEcoMofPlatformName(record = {}) {
  const refcode = normalizedRefcode(record.refcode) || "UNRESOLVED"
  const metals = normalizedMetals(record.metalElements)
  const metalSegment = metals.length
    ? metals.slice(0, 3).join("-")
    : "CSD"
  return `EcoMOF-${metalSegment}-${refcode}`
}

export function buildCsdNamingFields(record = {}, curated = {}) {
  const combined = { ...record, ...curated }
  const refcode = normalizedRefcode(combined.refcode)
  const commonName = String(combined.commonName || "").trim()
  const platformName = createEcoMofPlatformName(combined)
  const displayName = commonName || refcode
  const curatedClass = String(curated.mofClass || "").trim()
  const existingClass = String(record.mofClass || "").trim()
  const mofClass = curatedClass || existingClass || deriveMofMetalClass(combined.metalElements)

  return {
    platformName,
    displayName,
    displayNameKind: commonName
      ? "verified-literature-common-name"
      : "csd-refcode",
    nameSource: commonName
      ? "curated-identity-registry"
      : "csd-refcode",
    mofClass,
    mofClassSource: curatedClass
      ? "curated-identity-registry"
      : existingClass && record.mofClassSource
        ? record.mofClassSource
        : "derived-from-csd-metal-elements",
    ...(refcode ? { csdRefcode: refcode } : {}),
  }
}
