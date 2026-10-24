// @ts-nocheck
import platforms from "../../data/acknowledgementPlatforms.json"
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
    institutionUrl: "https://www.xju.edu.cn/",
    logo: "images/nobel/organizations/xinjiang.png",
    roleZh: "新疆大学 · 有机酸催化方向建议",
    roleEn: "Xinjiang University · Organic acid catalysis feedback",
    bodyZh: "感谢你从有机酸催化实验的角度提出建议，帮助催化模块更准确地理解真实实验记录、数据字段与可比性判断。",
    bodyEn: "Thank you for your suggestions from the perspective of organic-acid catalysis experiments. Your feedback helped the Catalysis workspace better represent experimental records, data fields, and comparability decisions.",
  },
  {
    name: "李一凡", nameEn: "Li Yifan",
    roleZh: "北京大学深圳研究院 · UI 方面建议",
    roleEn: "Peking University Shenzhen Institute · UI feedback",
    institutionUrl: "https://www.pku-sz.cn/", logo: "images/nobel/organizations/pku.png",
    bodyZh: "感谢你对界面设计提出建议，帮助改进内容层级、页面排版与阅读体验。",
    bodyEn: "Thank you for your interface-design feedback on content hierarchy, layout and reading."
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
        <p className="acknowledgements-consent">{text(lang, "本页具名致谢均已获得本人同意。", "All named personal acknowledgements on this page are published with the individuals’ consent.")}</p>
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
              {person.institutionUrl && <a className="acknowledgement-institution" href={person.institutionUrl} target="_blank" rel="noreferrer"><img src={`${import.meta.env.BASE_URL}${person.logo}`} alt="" loading="lazy" />{text(lang, person.roleZh.split(' · ')[0], person.roleEn.split(' · ')[0])} ↗</a>}
              <p>{text(lang, person.bodyZh, person.bodyEn)}</p>
            </div>
          </article>
        ))}

        {platforms.map((platform,index)=><article className="about-text-row" key={platform.id}>
          <header className="about-text-row-label"><span>{String(people.length+index+1).padStart(2,'0')}</span><strong>{text(lang,'数据与学术资源平台','Data and scholarly resource platform')}</strong></header>
          <div className="about-text-row-content"><a className="acknowledgement-platform" data-platform={platform.id} href={platform.url} target="_blank" rel="noreferrer"><img src={`${import.meta.env.BASE_URL}${platform.logo}`} alt={`${platform.name} logo`} loading="lazy"/><h2>{platform.name}</h2></a><p>{platform.use[lang==='zh'?0:1]}</p><a href={platform.url} target="_blank" rel="noreferrer">{text(lang,'访问官方网站','Official website')} ↗</a>
          {platform.id==='ccdc' && <p className="acknowledgements-boundary">{text(lang,'本致谢不表示 CCDC 对 EcoMOF-AI 的认可、背书或隶属关系。CSD 数据使用以适用许可、机构协议和发布方原文为准。','This acknowledgement does not imply CCDC endorsement, affiliation, or approval of EcoMOF-AI. CSD use remains governed by applicable licences, institutional agreements and publisher terms.')}</p>}
          </div></article>)}
      </section>
    </div>
  )
}

export default AcknowledgementsPage
