// @ts-nocheck
import appReleaseLog from "../../public/data/app_release_log.json"

export function getCurrentAppVersion(log = appReleaseLog) {
  const explicit = String(log?.currentAppVersion || "").trim()
  if (explicit) return explicit
  const releases = Array.isArray(log?.releases) ? log.releases : []
  return String(releases[0]?.appVersion || "v0.0.0")
}

export const APP_VERSION = getCurrentAppVersion(appReleaseLog)
export const APP_VERSION_LABEL = `App ${APP_VERSION}`

