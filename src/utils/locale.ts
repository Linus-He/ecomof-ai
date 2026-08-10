export const SUPPORTED_LOCALES = ["zh-CN", "zh-TW", "en"] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export function resolveInitialLocale({
  browserLanguages = [],
  storedLocale,
}: {
  browserLanguages?: readonly string[]
  storedLocale?: string | null
} = {}): SupportedLocale {
  if (SUPPORTED_LOCALES.includes(storedLocale as SupportedLocale)) {
    return storedLocale as SupportedLocale
  }

  const browserLocale = String(browserLanguages[0] || "").trim().toLowerCase()
  if (browserLocale === "zh-tw" || browserLocale === "zh-hk" || browserLocale === "zh-mo" || browserLocale.startsWith("zh-hant")) {
    return "zh-TW"
  }
  if (browserLocale === "zh" || browserLocale.startsWith("zh-")) return "zh-CN"
  if (browserLocale === "en" || browserLocale.startsWith("en-")) return "en"
  return "en"
}
