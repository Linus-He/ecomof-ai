// @ts-nocheck
import versionEvolution from "../../../public/data/version_evolution_records.json"
import appReleaseLog from "../../../public/data/app_release_log.json"
import { useLang } from "../../contexts"
import "./MilestoneRoadmapPages.css"

const text = (lang, zh, en) => lang === "zh" ? zh : en
const localize = (value, lang) => value && typeof value === "object"
  ? value[lang === "zh" ? "zh" : "en"]
  : value

function cleanReleaseLabel(value) {
  return String(value || "").replace(/^v\d+(?:\.\d+){2}[：:]\s*/i, "")
}

function splitRisks(value) {
  return String(value || "pending").split(/[;；。]/).map(item => item.trim()).filter(Boolean)
}

function PageShell({ eyebrow, title, intro, children, testId, listTestId }) {
  return (
    <div className="milestone-roadmap-page" data-testid={testId}>
      <header className="milestone-roadmap-hero">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>
      <section className="milestone-roadmap-list" data-testid={listTestId}>
        {children}
      </section>
    </div>
  )
}

export function ScientificMilestonesPage() {
  const { lang } = useLang()
  const milestones = Array.isArray(versionEvolution?.milestones) ? versionEvolution.milestones : []
  const latestRelease = appReleaseLog?.releases?.[0]

  return (
    <PageShell
      testId="scientific-milestones-page"
      eyebrow={text(lang, "项目 / 科学里程碑", "Project / Scientific milestones")}
      title={text(lang, "科学里程碑", "Scientific milestones")}
      intro={text(
        lang,
        "这里仅保留已经形成方法、数据或验证边界的科研节点；更新日志负责记录发布内容，路线图负责记录未来目标。",
        "This page keeps only research milestones that have a method, data, or validation boundary. The changelog records releases, and the roadmap records future goals.",
      )}
    >
      {latestRelease ? (
        <article className="milestone-roadmap-row" data-testid="scientific-milestone-current-release">
          <div className="milestone-roadmap-index">
            <strong>{latestRelease.appVersion}</strong>
            <span>{latestRelease.date}</span>
          </div>
          <div className="milestone-roadmap-content">
            <h2>{text(lang, "当前设计与记录里程碑", "Current design and record milestone")}</h2>
            <p>{cleanReleaseLabel(localize(latestRelease.headline, lang))}</p>
            <div className="milestone-roadmap-facts">
              <div>
                <span>{text(lang, "完成范围", "Completed scope")}</span>
                <strong>{localize(latestRelease.summary, lang)}</strong>
              </div>
            </div>
          </div>
        </article>
      ) : null}
      {milestones.map((row, index) => (
        <article className="milestone-roadmap-row" key={row.id || `${row.version}-${index}`}>
          <div className="milestone-roadmap-index">
            <strong>{row.version}</strong>
            <span>{String(index + 1).padStart(2, "0")}</span>
          </div>
          <div className="milestone-roadmap-content">
            <h2>{row.title}</h2>
            <p>{row.detail}</p>
            <div className="milestone-roadmap-facts">
              <div>
                <span>{text(lang, "性质", "Type")}</span>
                <strong>{text(lang, "已完成科研节点", "Completed research milestone")}</strong>
              </div>
            </div>
          </div>
        </article>
      ))}
    </PageShell>
  )
}

export function ResearchRoadmapPage() {
  const { lang } = useLang()
  const rows = (Array.isArray(versionEvolution?.versions) ? versionEvolution.versions : []).slice(-6).map(row => ({
    version: row.version,
    plannedFeatures: row.categories || [row.summary],
    scientificGoal: row.nextVersionGoal || row.scientificImpact,
    databaseGoal: row.databaseImpact,
    validationGoal: row.validationImpact,
    knownRisks: splitRisks(row.knownLimitations),
  }))

  return (
    <PageShell
      testId="research-roadmap-page"
      listTestId="project-evolution-roadmap"
      eyebrow={text(lang, "项目 / 科研路线图", "Project / Research roadmap")}
      title={text(lang, "科研路线图", "Research roadmap")}
      intro={text(
        lang,
        "路线图从版本演化记录派生，强调下一步科研目标、数据目标、验证目标和已知风险；未完成事项不会写成已发布能力。",
        "The roadmap is derived from version-evolution records and separates scientific goals, data goals, validation goals, and known risks. Unfinished work is not presented as released capability.",
      )}
    >
      {rows.map((row, index) => (
        <article className="milestone-roadmap-row" key={row.version}>
          <div className="milestone-roadmap-index">
            <strong>{row.version}</strong>
            <span>{String(index + 1).padStart(2, "0")}</span>
          </div>
          <div className="milestone-roadmap-content">
            <h2>{row.plannedFeatures.join(", ")}</h2>
            <p>{text(lang, "由历史记录读取的研究、数据和验证计划。", "Research, data, and validation plan read from historical records.")}</p>
            <div className="milestone-roadmap-facts">
              <div>
                <span>{text(lang, "科研目标", "Scientific goal")}</span>
                <strong>{row.scientificGoal}</strong>
              </div>
              <div>
                <span>{text(lang, "数据库目标", "Database goal")}</span>
                <strong>{row.databaseGoal}</strong>
              </div>
              <div>
                <span>{text(lang, "验证目标", "Validation goal")}</span>
                <strong>{row.validationGoal}</strong>
              </div>
              <div>
                <span>{text(lang, "已知风险", "Known risks")}</span>
                <ul>
                  {row.knownRisks.map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </article>
      ))}
    </PageShell>
  )
}
