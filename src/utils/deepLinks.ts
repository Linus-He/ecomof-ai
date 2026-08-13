// @ts-nocheck
import {
  DEFAULT_ROUTE_META,
  HASH_META,
  HASH_TO_TAB,
  TAB_TO_HASH,
  getNavigationMeta,
} from "../config/navigationRegistry"

export const BASE_PATH = "/ecomof-ai/"

export { HASH_META, HASH_TO_TAB, TAB_TO_HASH }

export function normalizeHash(hash) {
  const cleaned = String(hash || "").replace(/^#/, "").trim()
  return cleaned || "overview"
}

export function tabToHash(tab) {
  return TAB_TO_HASH[tab] || "overview"
}

export function buildDeepLink(hash = "overview") {
  const normalized = normalizeHash(hash)
  if (typeof window !== "undefined") {
    const base = import.meta.env.BASE_URL || BASE_PATH
    return `${window.location.origin}${base}#${normalized}`
  }
  return `https://linus-he.github.io${BASE_PATH}#${normalized}`
}

export function getHashMeta(hash) {
  return getNavigationMeta(hash) || DEFAULT_ROUTE_META
}
