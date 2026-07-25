import { describe, expect, it } from "vitest"
import appReleaseLog from "../../../public/data/app_release_log.json"
import { APP_VERSION, APP_VERSION_LABEL, getCurrentAppVersion } from "../../constants/appVersion"

describe("app version constants", () => {
  it("reads the current Web version from app_release_log", () => {
    expect(APP_VERSION).toBe("v1.0.4")
    expect(APP_VERSION_LABEL).toBe("Web v1.0.4")
    expect(getCurrentAppVersion(appReleaseLog)).toBe(appReleaseLog.currentAppVersion)
  })

  it("falls back to the newest release when currentAppVersion is absent", () => {
    expect(getCurrentAppVersion({ releases: [{ appVersion: "v9.9.9" }] } as any)).toBe("v9.9.9")
  })
})
