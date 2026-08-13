// @ts-nocheck
import { ArrowRight } from "@phosphor-icons/react"
import { useLang } from "../../contexts"
import "./AboutTextPages.css"

const text = (lang, zh, en) => lang === "zh" ? zh : en

const sections = [
  {
    number: "01",
    labelZh: "起点",
    labelEn: "The beginning",
    titleZh: "因为我真心喜欢化学。",
    titleEn: "Because I genuinely care about chemistry.",
    bodyZh: [
      "我喜欢化学，不只是因为它能解释物质如何组成和变化，也因为每一个可靠结论背后，都有结构、条件、证据与反复验证共同支撑。MOF 研究尤其让我着迷：一个看似细小的结构差异，可能改变吸附、分离、催化与环境影响的整个判断。",
      "我创建 EcoMOF-AI，是想把这种好奇心变成一件可以持续做下去的事。它从一个很朴素的问题开始：当数据散落在数据库、论文和实验条件里时，能不能把来源、缺口和判断过程放回同一个研究界面中？",
    ],
    bodyEn: [
      "I care about chemistry not only because it explains how matter is composed and transformed, but because every reliable conclusion depends on structure, conditions, evidence, and repeated validation. MOF research is especially compelling to me: a subtle structural difference can change the entire assessment of adsorption, separation, catalysis, or environmental impact.",
      "I created EcoMOF-AI to turn that curiosity into work I can continue over time. It began with a simple question: when data is scattered across databases, papers, and experimental conditions, can provenance, gaps, and the reasoning process be brought back into one research interface?",
    ],
  },
  {
    number: "02",
    labelZh: "期望",
    labelEn: "What I hope for",
    titleZh: "让研究判断更容易被理解，也更容易被纠正。",
    titleEn: "Make research decisions easier to understand and easier to correct.",
    bodyZh: [
      "我不希望这个网站替研究者下结论。我的期望更克制：减少寻找证据、核对条件和辨认数据缺口所消耗的时间，让一个候选材料为什么被保留、为什么被阻断、还缺什么证据，都能够被追问。",
      "如果 EcoMOF-AI 最终能帮助一位学生更快找到可信来源，帮助一位研究者发现不可比较的实验条件，或者让一个错误在进入下一步实验前被指出，那么它就有继续存在的价值。",
    ],
    bodyEn: [
      "I do not want this website to make conclusions on behalf of researchers. My aim is more restrained: reduce the time spent finding evidence, checking conditions, and identifying data gaps, while making it possible to ask why a candidate was retained, why it was blocked, and what evidence is still missing.",
      "If EcoMOF-AI helps a student find a trustworthy source sooner, helps a researcher notice non-comparable experimental conditions, or allows an error to be caught before the next experiment, then it has a reason to continue.",
    ],
  },
  {
    number: "03",
    labelZh: "身份",
    labelEn: "Who I am",
    titleZh: "这是一个学生独立发起的研究项目。",
    titleEn: "This is an independently initiated student research project.",
    bodyZh: [
      "我目前只是一名仍在学习中的学生。EcoMOF-AI 由我个人发起和维护，不代表任何高校、科研机构、基金或企业，也没有获得这些组织的官方背书或资助。网站中出现的数据库、论文、组织名称和外部链接，只表示来源、引用或研究对象，不表示合作、隶属或认可关系。",
      "独立意味着我可以认真追随问题本身，也意味着项目能力受到个人知识、时间和资源的真实限制。如果未来项目身份、资助或合作关系发生变化，我会在这里公开更新，而不是让访问者自行猜测。",
    ],
    bodyEn: [
      "I am currently a student and still learning. EcoMOF-AI was initiated and is maintained by me personally. It does not represent any university, research institution, fund, or company, and it has not received official endorsement or funding from those organizations. Databases, papers, organizations, and external links named on the site indicate sources, citations, or research subjects only; they do not imply partnership, affiliation, or endorsement.",
      "Independence lets me follow the research question carefully, but it also means the project is genuinely limited by one person's knowledge, time, and resources. If its identity, funding, or partnerships change, I will update this page openly rather than leave visitors to infer them.",
    ],
  },
  {
    number: "04",
    labelZh: "纠错",
    labelEn: "Correction",
    titleZh: "请直接指出错误，不必替我保留它。",
    titleEn: "Please point out errors directly; there is no need to preserve them for me.",
    bodyZh: [
      "受限于我的知识和经验，这个网站一定还会有理解不准确、数据不完整、表达不清楚或实现不成熟的地方。对此我不回避，也不会把界面的完整感当作科学正确性的证明。",
      "我愿意接受任何具体、诚实和有依据的意见，包括对化学原理、数据来源、方法假设、许可边界和交互设计的批评。也恳请大家对一个仍在学习的学生多一些包容；这种包容不是降低科学标准，而是允许我在被纠正后认真修正、记录变化，并继续学习。",
    ],
    bodyEn: [
      "Because my knowledge and experience are limited, this website will still contain inaccurate interpretations, incomplete data, unclear explanations, and immature implementations. I will not avoid that reality, nor treat a polished interface as proof of scientific correctness.",
      "I welcome any specific, honest, and evidence-based feedback, including criticism of chemical principles, data provenance, methodological assumptions, licensing boundaries, and interaction design. I also ask for some patience with a student who is still learning. That patience does not mean lowering scientific standards; it means allowing me to correct the work carefully, document the change, and keep learning.",
    ],
  },
  {
    number: "05",
    labelZh: "使用边界",
    labelEn: "Use boundary",
    titleZh: "以非商业研究方式运行，许可边界必须分别判断。",
    titleEn: "Operated for non-commercial research, with licences assessed separately.",
    bodyZh: [
      "EcoMOF-AI 当前以非商业学生研究项目运行。我不通过本站销售数据、科研结论或商业服务，也不向访问者授予外部数据库、受限内容或整合成果的商业使用权。本站不能被当作商业适用性、数据授权或科研结论的保证。",
      "同时，项目中的对象并不共用一张许可证：仓库源代码采用 MIT License；外部数据库、论文材料、图像、结构文件和派生数据分别受各自条款约束。任何商业使用、再分发或机构部署，都应先核对对应来源并向权利人取得必要许可。",
    ],
    bodyEn: [
      "EcoMOF-AI currently operates as a non-commercial student research project. I do not sell data, scientific conclusions, or commercial services through this site, and I do not grant commercial rights to external databases, restricted content, or integrated outputs. The site must not be treated as a guarantee of commercial suitability, data authorization, or scientific conclusions.",
      "The objects used by this project do not share one licence. Repository source code is provided under the MIT License, while external databases, article material, images, structure files, and derived datasets remain governed by their respective terms. Commercial use, redistribution, or institutional deployment should begin with source-specific review and any permission required from the rightsholder.",
    ],
  },
  {
    number: "06",
    labelZh: "同行与顾问",
    labelEn: "Peers and advisors",
    titleZh: "我欢迎专业人士成为这个项目的顾问。",
    titleEn: "I welcome professionals who are willing to advise this project.",
    bodyZh: [
      "我真诚欢迎 MOF 化学、吸附与分离、催化、生命周期评价、材料数据库、科学计算、科研伦理与数据许可等方向的研究者和从业者提供指导。最需要的不是礼貌的认可，而是能够指出关键问题、推荐可靠来源、审阅方法边界和帮助建立更高标准的人。",
      "顾问关系可以从一次具体意见开始，不要求机构身份，也不产生雇佣、商业合作或项目背书。未经本人同意，我不会公开姓名或将意见包装成认可；愿意长期参与的人，可以一起明确适合的范围、署名方式与信息边界。",
    ],
    bodyEn: [
      "I sincerely welcome guidance from researchers and practitioners in MOF chemistry, adsorption and separation, catalysis, life-cycle assessment, materials databases, scientific computing, research ethics, and data licensing. What the project needs most is not polite approval, but people who can identify important problems, recommend reliable sources, review methodological boundaries, and help establish a higher standard.",
      "An advisory relationship can begin with one specific comment. It does not require institutional status and does not create employment, commercial partnership, or project endorsement. I will not publish anyone's name or present feedback as approval without consent; those who wish to contribute over time can agree on an appropriate scope, attribution, and information boundary.",
    ],
  },
]

export function CreatorStatementPage() {
  const { lang } = useLang()

  return (
    <div className="about-text-page creator-statement-page" data-testid="creator-statement-page">
      <header className="creator-statement-hero">
        <div className="creator-statement-title">
          <span>{text(lang, "项目治理 / 创建者说明", "Governance / Creator statement")}</span>
          <h1>{text(lang, "为什么建立 EcoMOF-AI", "Why I built EcoMOF-AI")}</h1>
          <p>{text(
            lang,
            "我想把对化学的热爱，做成一套可以被追问、被纠正，也能继续生长的研究工具。",
            "I want to turn my enthusiasm for chemistry into a research tool that can be questioned, corrected, and allowed to keep growing.",
          )}</p>
        </div>
      </header>

      <blockquote className="creator-statement-quote">
        <p>{text(
          lang,
          "我希望这个项目最终由它如何面对证据、错误与边界来定义，而不是由我如何介绍它来定义。",
          "I hope this project will ultimately be defined by how it handles evidence, errors, and boundaries, not by how I describe it.",
        )}</p>
      </blockquote>

      <section className="creator-statement-sections" aria-label={text(lang, "创建者说明正文", "Creator statement")}>
        {sections.map(section => (
          <article className="creator-statement-section" key={section.number}>
            <header>
              <span>{section.number}</span>
              <strong>{text(lang, section.labelZh, section.labelEn)}</strong>
            </header>
            <div>
              <h2>{text(lang, section.titleZh, section.titleEn)}</h2>
              {(lang === "zh" ? section.bodyZh : section.bodyEn).map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </article>
        ))}
      </section>

      <footer className="creator-statement-closing">
        <div>
          <span>{text(lang, "继续对话", "Continue the conversation")}</span>
          <h2>{text(lang, "谢谢你愿意认真看待一个学生正在做的事。", "Thank you for taking a student's work seriously.")}</h2>
          <p>{text(
            lang,
            "如果你愿意指出问题、提供专业建议或讨论长期顾问关系，请通过联系页告诉我。也请查看致谢页，那里记录了帮助这个项目走到今天的人与科研资源。",
            "If you would like to identify a problem, offer professional guidance, or discuss an ongoing advisory role, please use the contact page. The acknowledgements page records the people and research resources that have helped this project reach its current stage.",
          )}</p>
        </div>
        <nav aria-label={text(lang, "创建者说明相关链接", "Creator statement links")}>
          <a href="#contact"><span>{text(lang, "联系与合作", "Contact and collaboration")}</span><ArrowRight aria-hidden size={18} /></a>
          <a href="#acknowledgements"><span>{text(lang, "查看致谢", "View acknowledgements")}</span><ArrowRight aria-hidden size={18} /></a>
          <a href="#database-compliance"><span>{text(lang, "条款与政策", "Terms and policies")}</span><ArrowRight aria-hidden size={18} /></a>
        </nav>
      </footer>
    </div>
  )
}

export default CreatorStatementPage
