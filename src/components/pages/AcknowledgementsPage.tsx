// @ts-nocheck
import { useLang } from "../../contexts"
import "./AboutTextPages.css"

const text = (lang, zh, en) => lang === "zh" ? zh : en

const people = [
  {
    name: "HappyFlight",
    roleZh: "早期支持者",
    roleEn: "Early supporter",
    bodyZh: "亦师亦友，感谢你一路的鼓励、分享与启发。愿你在热爱的领域继续飞得更高、更远。",
    bodyEn: "Mentor and friend, thank you for your encouragement, sharing, and inspiration throughout this work. May you continue to go further in the field you love.",
  },
  {
    name: "李新建",
    nameEn: "Li Xinjian",
    roleZh: "新疆大学 · 有机酸催化方向建议",
    roleEn: "Xinjiang University · Organic acid catalysis feedback",
    bodyZh: "感谢你从有机酸催化实验的角度提出建议，帮助催化模块更准确地理解真实实验记录、数据字段与可比性判断。",
    bodyEn: "Thank you for your suggestions from the perspective of organic-acid catalysis experiments. Your feedback helped the Catalysis workspace better represent experimental records, data fields, and comparability decisions.",
  },
]

export function AcknowledgementsPage() {
  const { lang } = useLang()

  return (
    <div className="about-text-page" data-testid="acknowledgements-page">
      <header className="about-text-intro">
        <span>{text(lang, "关于 / 致谢", "About / Acknowledgements")}</span>
        <h1>{text(lang, "致谢", "Acknowledgements")}</h1>
        <p>{text(
          lang,
          "EcoMOF-AI 的形成离不开长期的鼓励、实验方向建议，以及科研数据基础设施和开放学术资源的支持。",
          "EcoMOF-AI has been shaped by sustained encouragement, experimental feedback, research data infrastructure, and open scholarly resources.",
        )}</p>
      </header>

      <section className="about-text-list" aria-label={text(lang, "致谢名单", "Acknowledgement list")}>
        {people.map((person, index) => (
          <article className="about-text-row" key={person.name}>
            <header className="about-text-row-label">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{text(lang, person.roleZh, person.roleEn)}</strong>
            </header>
            <div className="about-text-row-content">
              <h2>{text(lang, person.name, person.nameEn || person.name)}</h2>
              <p>{text(lang, person.bodyZh, person.bodyEn)}</p>
            </div>
          </article>
        ))}

        <article className="about-text-row">
          <header className="about-text-row-label">
            <span>03</span>
            <strong>{text(lang, "研究数据基础设施", "Research data infrastructure")}</strong>
          </header>
          <div className="about-text-row-content">
            <h2>Cambridge Crystallographic Data Centre (CCDC)</h2>
            <p>{text(
              lang,
              "感谢 CCDC 长期维护 Cambridge Structural Database（CSD），并提供晶体结构标识、MOF 相关集合、下载说明与数据使用文档。这些资源为本项目的 MOF 身份核对、CSD Refcode／CCDC 编号记录和数据治理边界提供了重要基础。",
              "We thank the CCDC for maintaining the Cambridge Structural Database (CSD) and for providing crystal-structure identifiers, MOF-related collections, download guidance, and data-use documentation. These resources support MOF identity checks, CSD Refcode and CCDC-number records, and the project's data-governance boundaries.",
            )}</p>
            <p>
              <a href="https://www.ccdc.cam.ac.uk/" rel="noreferrer" target="_blank">{text(lang, "访问 CCDC 官方网站", "Visit the official CCDC website")}</a>
            </p>
            <p className="acknowledgements-boundary">{text(
              lang,
              "本致谢不表示 CCDC 对 EcoMOF-AI 的认可、背书或隶属关系。任何 CSD／CCDC 数据的使用仍以适用许可、机构协议和发布方原文为准。",
              "This acknowledgement does not imply CCDC endorsement, affiliation, or approval of EcoMOF-AI. Any use of CSD or CCDC data remains governed by the applicable licence, institutional agreement, and publisher terms.",
            )}</p>
          </div>
        </article>

        <article className="about-text-row">
          <header className="about-text-row-label">
            <span>04</span>
            <strong>{text(lang, "开放科研生态", "Open research ecosystem")}</strong>
          </header>
          <div className="about-text-row-content">
            <h2>{text(lang, "数据集、文献元数据与开源工具维护者", "Dataset, scholarly metadata, and open-source maintainers")}</h2>
            <p>{text(
              lang,
              "同时感谢 CoRE MOF、QMOF、FAIR-MOFs、NIST／ISODB、Crossref、OpenAlex 以及项目所使用开源软件的维护者。各来源的许可、适用范围和具体引用仍在条款与政策及字段来源中分别记录。",
              "We also thank the maintainers of CoRE MOF, QMOF, FAIR-MOFs, NIST/ISODB, Crossref, OpenAlex, and the open-source software used by this project. Source-specific licences, scope, and citations remain documented separately in Terms and Policies and field-level provenance.",
            )}</p>
          </div>
        </article>
      </section>
    </div>
  )
}

export default AcknowledgementsPage
