// @ts-nocheck
import appReleaseLog from "../../../public/data/app_release_log.json"
import { useLang } from "../../contexts"
import "./ReleaseNotesPage.css"

const text = (lang, zh, en) => lang === "zh" ? zh : en
const localize = (value, lang) => value && typeof value === "object"
  ? value[lang === "zh" ? "zh" : "en"]
  : value

function cleanHeadline(value) {
  return String(value || "").replace(/^v\d+(?:\.\d+){2}[：:]\s*/i, "")
}

export function ReleaseNotesPage() {
  const { lang } = useLang()
  const releases = Array.isArray(appReleaseLog?.releases) ? appReleaseLog.releases : []
  const catalog = appReleaseLog?.moduleCatalog || {}

  return (
    <div className="release-notes-page" data-testid="release-notes-page">
      <header className="release-notes-intro">
        <span>{text(lang, "项目 / 更新日志", "Project / Changelog")}</span>
        <h1>{text(lang, "更新日志", "Changelog")}</h1>
        <p>
          {text(
            lang,
            "这里记录已经完成并进入统一 Web 版本的功能、方法、数据与界面变化。规划项和尚未核验的科研结论不写入发布记录。",
            "This page records completed feature, methodology, data, and interface changes that entered the unified Web version. Planned work and unverified scientific conclusions are excluded.",
          )}
        </p>
      </header>

      <section className="release-notes-list" aria-label={text(lang, "Web 版本记录", "Web release history")}>
        {releases.map((release, releaseIndex) => {
          const modules = Object.entries(release.modules || {})
          return (
            <article className="release-note" key={release.appVersion} data-current={releaseIndex === 0 ? "true" : "false"}>
              <header className="release-note-version">
                <strong>{release.appVersion}</strong>
                <time dateTime={release.date}>{release.date}</time>
                {releaseIndex === 0 ? <span>{text(lang, "当前版本", "Current")}</span> : null}
              </header>
              <div className="release-note-content">
                <h2>{cleanHeadline(localize(release.headline, lang))}</h2>
                <p>{localize(release.summary, lang)}</p>
                <div className="release-note-modules">
                  {modules.map(([moduleKey, module]) => (
                    <section key={`${release.appVersion}-${moduleKey}`}>
                      <h3>{localize(catalog[moduleKey]?.label, lang) || moduleKey}</h3>
                      <p>{localize(module.summary, lang)}</p>
                      <ul>
                        {(module.changes || []).map((change, index) => (
                          <li key={index}>{localize(change, lang)}</li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}

export default ReleaseNotesPage
