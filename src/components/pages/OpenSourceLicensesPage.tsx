// @ts-nocheck
import { ArrowSquareOut } from "@phosphor-icons/react"
import { useLang } from "../../contexts"
import "./AboutTextPages.css"

const text = (lang, zh, en) => lang === "zh" ? zh : en

const softwareLicenses = [
  {
    name: "RDKit 2025.3.6 (figure generation only)",
    license: "BSD 3-Clause License",
    scopeZh: "构建期生成二维分子结构图、验证分子式与 R/S 构型，并生成明确标注的计算构象；浏览器不加载 RDKit。",
    scopeEn: "Build-time 2D molecular drawing, formula/CIP checks and labelled computed conformers; RDKit is not loaded in the browser.",
    boundaryZh: "保留 RDKit 的 BSD 声明。连接记录来自 PubChem；绘图布局与计算构象不代表实验坐标，也不证明企业配方或材料性能。",
    boundaryEn: "Retain RDKit’s BSD notice. PubChem supplies connectivity; drawings and computed conformers are not experimental coordinates or proof of proprietary chemistry or performance.",
    url: "https://github.com/rdkit/rdkit/blob/master/license.txt",
  },
  {
    name: "EcoMOF-AI source code",
    license: "MIT License",
    scopeZh: "本仓库中由 EcoMOF-AI 项目维护的前端源代码、脚本和项目自有实现。",
    scopeEn: "Frontend source code, scripts, and project-authored implementation maintained in this EcoMOF-AI repository.",
    boundaryZh: "MIT 许可只覆盖项目自有代码；不自动覆盖外部数据库、论文、结构文件、商标、图像或第三方数据。",
    boundaryEn: "The MIT License covers project-authored code only; it does not automatically cover external databases, papers, structure files, trademarks, images, or third-party data.",
    url: "https://opensource.org/license/mit",
  },
  {
    name: "React, React DOM, Vite, Vitest, Recharts, React Icons, Phosphor Icons, quickhull3d",
    license: "MIT License",
    scopeZh: "主要前端运行、构建、测试、图表、图标和几何计算依赖。",
    scopeEn: "Core frontend runtime, build, test, charting, icon, and geometry dependencies.",
    boundaryZh: "使用时保留对应版权与许可声明；图标组件不改变 EcoMOF-AI 自有内容和数据的许可边界。",
    boundaryEn: "Copyright and license notices should be retained; icon components do not change the licensing boundary of EcoMOF-AI content or data.",
    url: "https://opensource.org/license/mit",
  },
  {
    name: "3Dmol.js",
    license: "BSD 3-Clause License",
    scopeZh: "用于分子和结构可视化相关能力。",
    scopeEn: "Used for molecule and structure visualization capabilities.",
    boundaryZh: "BSD 条款允许再分发和修改，但必须保留版权、条件和免责声明；可视化对象本身仍按其来源许可判断。",
    boundaryEn: "BSD terms permit redistribution and modification while retaining copyright, conditions, and disclaimers; visualized objects remain governed by their source terms.",
    url: "https://github.com/3dmol/3Dmol.js",
  },
  {
    name: "TypeScript and Playwright",
    license: "Apache License 2.0",
    scopeZh: "分别用于类型检查、构建期开发体验和端到端 / 可视化验证。",
    scopeEn: "Used for type checking, development tooling, and end-to-end or visual validation.",
    boundaryZh: "Apache 2.0 包含专利授权和 NOTICE 义务；这些工具不改变生成页面或科研数据的许可。",
    boundaryEn: "Apache 2.0 includes patent grants and NOTICE obligations; these tools do not change the license of generated pages or research data.",
    url: "https://www.apache.org/licenses/LICENSE-2.0",
  },
  {
    name: "opencc-js",
    license: "MIT AND Apache License 2.0",
    scopeZh: "使用 opencc-js 1.4.1 的 cn2t 转换器，支持台湾（中国）与香港（中国）的繁体中文显示；分别采用 tw 与 hk 区域字形转换。",
    scopeEn: "Uses opencc-js 1.4.1 cn2t conversion with the tw and hk regional variants for Taiwan (China) and Hong Kong (China).",
    boundaryZh: "MIT AND Apache-2.0 为组合许可义务，不是任选其一；保留库许可及词典的第三方声明。转换不改变原始内容许可，也不代表逐条人工语言审校。",
    boundaryEn: "MIT AND Apache-2.0 requires both sets of applicable notices, not a choice of one. Retain library and dictionary notices. Conversion neither relicenses content nor implies item-by-item linguistic review.",
    url: "https://github.com/nk2028/opencc-js",
  },
  {
    name: "KaTeX and KaTeX fonts",
    license: "MIT License",
    scopeZh: "用于公式排版、科学符号和数学表达渲染。",
    scopeEn: "Used for formula typesetting, scientific symbols, and mathematical expression rendering.",
    boundaryZh: "字体和渲染库按 MIT 使用；页面中展示的公式、算法解释和科研结论仍由 EcoMOF-AI 内容边界约束。",
    boundaryEn: "Fonts and rendering library are used under MIT; displayed formulas, algorithm explanations, and scientific conclusions remain bounded by EcoMOF-AI content terms.",
    url: "https://katex.org",
  },
  {
    name: "Swift toolchain and Swift ecosystem",
    license: "Apache License 2.0 with Runtime Library Exception",
    scopeZh: "当前 Web 仓库未分发 Swift 源码；若未来加入 iOS / Swift 辅助工具，应单独保留 Swift 工具链和运行库许可声明。",
    scopeEn: "This web repository currently does not distribute Swift source code; if iOS or Swift companion tooling is added later, Swift toolchain and runtime notices should be retained separately.",
    boundaryZh: "Swift 运行库例外不等于给外部科研数据重新授权，也不改变 EcoMOF-AI 源码 MIT 许可。",
    boundaryEn: "The Swift runtime exception does not relicense external research data and does not change EcoMOF-AI source code's MIT license.",
    url: "https://www.swift.org/LICENSE.txt",
  },
]

const dataLicenses = [
  {
    name: "Search landing illustrations and editorial summaries · 2026-09",
    statusZh: "AI 辅助生成素材与项目编写的摘要，独立于代码许可",
    statusEn: "AI-assisted illustrations and project-authored summaries, separate from code licensing",
    bodyZh: "首页六张 search-release / search-research 封面为本项目通过 OpenAI 图像生成工具制作的概念插图，不是论文实验图，也未复制参考网站的图片或字体文件。动态效果、打字提示、检索和语言面板由项目代码及浏览器原生 CSS 动画、dialog、React portal 实现，未加入外部动画或搜索服务。OpenAI 页面仅作为布局参考，不表示关联或背书。论文摘要按发布方页面重新撰写并附 DOI；原文和图像仍依各自来源条款。生成图片不因同处本仓库而自动纳入源码 MIT 许可，不保证排他版权；复用前需另行核对适用权利与服务条款。",
    bodyEn: "The six search-release / search-research covers were made with OpenAI image generation as conceptual artwork, not experimental figures. No reference-site image or font files are copied. Motion, typewriter prompts, search, and the language panel use project code, native CSS animation, dialog, and React portals, without a new animation or search service. OpenAI is a layout reference, not an affiliation or endorsement. Summaries are rewritten from publisher pages with DOI links; source text and figures retain their own terms. Generated artwork is not automatically covered by the source-code MIT license or guaranteed exclusive copyright; reuse requires a separate rights and terms review.",
  },
  {
    name: "CCDC / CSD MOF Collection and CoRE-MOF modified CIF records",
    statusZh: "按来源条款和记录级许可使用",
    statusEn: "Used under source terms and record-level licensing",
    bodyZh: "结构、Refcode、CIF、衍生描述符和 CSD 相关材料必须按 CCDC、CSD MOF Collection、CoRE-MOF 及原始记录条款分别判断。项目源代码 MIT 许可不授予这些外部数据库材料的再分发或商业使用权。",
    bodyEn: "Structures, Refcodes, CIF files, derived descriptors, and CSD-related materials must be evaluated under CCDC, CSD MOF Collection, CoRE-MOF, and original record terms. The project's MIT source-code license does not grant redistribution or commercial rights to these external database materials.",
  },
  {
    name: "FAIR-MOFs / Zenodo datasets",
    statusZh: "按数据集页面声明的开放许可使用",
    statusEn: "Used under the open license stated by each dataset page",
    bodyZh: "当来源页面声明 CC BY 4.0 或其他开放许可时，EcoMOF-AI 保留来源、版本和引用边界；不同 Zenodo 记录不能被合并为一张默认许可。",
    bodyEn: "When a source page states CC BY 4.0 or another open license, EcoMOF-AI preserves source, version, and citation boundaries; separate Zenodo records are not merged into one assumed license.",
  },
  {
    name: "NIST / ARPA-E ISODB and adsorption literature records",
    statusZh: "无统一项目级再授权",
    statusEn: "No single project-level relicensing",
    bodyZh: "等温线、温度、压力、气体组成、实验方法和文献摘录按记录来源判断。本站可以展示字段级溯源和整理状态，但不把所有记录重新授权为 EcoMOF-AI 自有开放数据。",
    bodyEn: "Isotherms, temperatures, pressures, gas compositions, experimental methods, and literature excerpts are governed by their record sources. The site may show field-level provenance and curation status, but it does not relicense all records as EcoMOF-AI-owned open data.",
  },
  {
    name: "Articles, DOI metadata, images, names, and trademarks",
    statusZh: "仅按引用、事实描述或来源允许范围使用",
    statusEn: "Used only within citation, factual description, or source-permitted boundaries",
    bodyZh: "论文图文、期刊材料、组织名称、数据库名称和商标不因出现在 EcoMOF-AI 页面中而获得项目背书或重新授权。需要复用时应回到原始来源核对许可。",
    bodyEn: "Article material, journal content, organization names, database names, and trademarks are not endorsed or relicensed by appearing in EcoMOF-AI. Reuse should be checked against the original source.",
  },
]

const apiServices = [
  {
    name: "Manifold API",
    termsZh: "平台服务条款；不按项目 MIT 再授权",
    termsEn: "Platform terms; not relicensed under project MIT",
    scopeZh: "科学预测与诺奖历史：公开市场检索、原题与日期字段、分页 bets 记录中的成交后概率。采集和核对在构建期进行，页面读取本地存档；不接入交易或用户账户。",
    scopeEn: "Science and Nobel archives: public market search, original questions and dates, and post-trade probabilities from paginated bets. Collection and review happen outside page entry; readers use local snapshots without trading or account access.",
    boundaryZh: "遵守官方 API 使用规范、限流和服务条款。公开投影不包含账户标识；MANA 为虚拟币。接口可访问不等于数据获得开源再分发许可。",
    boundaryEn: "Follow API guidelines, rate limits and service terms. Public projections omit account identities; MANA is play money. API accessibility does not itself grant an open redistribution license.",
    docs: "https://docs.manifold.markets/api", terms: "https://docs.manifold.markets/terms",
  },
  {
    name: "Polymarket Gamma / CLOB APIs",
    termsZh: "平台数据与服务条款；非统一开放数据许可",
    termsEn: "Platform data and service terms; no blanket open-data license",
    scopeZh: "诺奖候选市场检索与 Yes token 历史价格采样，分别来自 Gamma public-search 和 CLOB prices-history；不是逐笔成交档案，也不是实时行情。",
    scopeEn: "Nobel market discovery and historical Yes-token price samples use Gamma public-search and CLOB prices-history. These are sampled prices, not trade-by-trade records or a live feed.",
    boundaryZh: "保留市场与 token 来源、截止时间和采样口径。部分历史接口复查返回 403，页面保留未完成复核说明；不绕过访问限制，不把本项目代码许可扩展到平台数据。",
    boundaryEn: "Retain market/token provenance, cutoffs and sampling grain. Some re-fetches return 403 and remain visibly unverified; access restrictions are not bypassed and project code licensing does not extend to platform data.",
    docs: "https://docs.polymarket.com/api-reference/markets/get-prices-history", terms: "https://polymarket.com/tos",
  },
  {
    name: "Kalshi Trade API v2",
    termsZh: "Developer Agreement / Data Terms；再分发授权未确认",
    termsEn: "Developer Agreement / Data Terms; redistribution permission unconfirmed",
    scopeZh: "既有诺奖存档使用公开事件信息及有成交量的一分钟蜡烛收盘价。蜡烛结束时间是聚合边界，不是精确成交时刻；没有接入下单或个人账户。",
    scopeEn: "Existing Nobel snapshots use public event information and one-minute candle closes with positive traded volume. Candle ends are aggregation boundaries, not exact trade times. No order placement or personal accounts are connected.",
    boundaryZh: "官方开发者协议限制非自身交易目的的数据缓存与共享，向第三方共享需事先书面授权。本项目未登记该授权，不将已有存档声明为可自由再分发的开放数据；接口可读不能代替授权。",
    boundaryEn: "The official developer agreement restricts caching beyond a member’s own trading and requires prior written authorization for third-party sharing. No such authorization is registered here. Existing snapshots are not declared freely redistributable open data; readable endpoints do not establish permission.",
    docs: "https://docs.kalshi.com/api-reference/market/get-market-candlesticks", terms: "https://kalshi-public-docs.s3.amazonaws.com/Kalshi-Developer-Agreement.pdf",
  },
  {
    name: "Nobel Prize API",
    termsZh: "官方开放数据说明；图像单独判断",
    termsEn: "Official open-data guidance; separate image rights",
    scopeZh: "诺奖化学年度与获奖者基础信息。当前构建脚本使用 api.nobelprize.org/v1/prize.json 的 chemistry 分类，保存成站内年度数据；官方文档建议新接入使用 v2。",
    scopeEn: "Annual Chemistry awards and basic laureate metadata. The current build uses the chemistry category of api.nobelprize.org/v1/prize.json and stores annual records locally; official guidance recommends v2 for new integrations.",
    boundaryZh: "官方说明 API 数据可免费使用；获奖者肖像、奖章、网页图文和商标不随元数据一并取得授权，仍保留图片来源、署名和对应使用条款。",
    boundaryEn: "Official guidance makes API data free to use. Portraits, medals, site text/images and marks do not inherit metadata permissions; their source, credit and applicable terms remain separate.",
    docs: "https://nobelprize.readme.io/reference/getting-started", terms: "https://www.nobelprize.org/about/terms-of-use/",
  },
  {
    name: "PubChem PUG REST",
    termsZh: "按 PubChem 与贡献者的记录级说明使用",
    termsEn: "PubChem and contributor record-level terms",
    scopeZh: "读取 CID 的分子连接、分子式与立体化学字段，为 RDKit 构建期绘图提供依据。连接记录、二维布局与计算构象分开标注，保留 CID 和实际请求链接。",
    scopeEn: "CID connectivity, formulas and stereochemistry support build-time RDKit figures. Recorded connectivity, 2D layouts and computed conformers are labelled separately, with CID and actual request links retained.",
    boundaryZh: "PubChem 汇集多个贡献来源，复用时仍需查看原记录的来源与许可说明；接口数据、计算绘图和企业未公开配方不相互替代。PUG REST 是数据服务，不是随仓库分发的软件依赖。",
    boundaryEn: "PubChem aggregates multiple contributors; reuse remains subject to record provenance and source terms. API records, computed drawings and undisclosed company formulations are distinct. PUG REST is a data service, not a bundled software dependency.",
    docs: "https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest", terms: "https://www.ncbi.nlm.nih.gov/home/about/policies/",
  },
  {
    name: "Crossref REST API",
    termsZh: "开放书目元数据；摘要与全文另有权利",
    termsEn: "Open bibliographic metadata; separate abstract/full-text rights",
    scopeZh: "催化文献检索、DOI 单条元数据核对，以及题名、期刊、年份、许可链接和更新关系记录。核对论文身份不等于已核对全部实验数值或科学结论。",
    scopeEn: "Catalysis literature discovery and single-DOI checks of title, journal, year, license links and update relations. Article identity checks do not verify every experimental value or scientific conclusion.",
    boundaryZh: "官方说明绝大多数元数据可用于任意目的，部分摘要仍可能受出版方或作者版权约束。本站不缓存发现流程中的摘要或全文；保留 DOI、请求来源与 polite-pool 联系方式配置。",
    boundaryEn: "Official guidance permits broad reuse of almost all metadata, while some abstracts may retain publisher or author copyright. Discovery stores neither abstracts nor full text; DOI, request provenance and polite-pool contact configuration are preserved.",
    docs: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/", terms: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/",
  },
  {
    name: "OpenAlex API",
    termsZh: "OpenAlex 元数据 CC0；链接内容另按来源许可",
    termsEn: "OpenAlex metadata CC0; linked content retains source terms",
    scopeZh: "催化候选文献发现与 Crossref 交叉检索，通过 DOI 合并书目元数据。候选与正式反应记录分开，未经人工核对不会自动成为已验证证据。",
    scopeEn: "Catalysis candidate discovery cross-checks Crossref and merges bibliographic metadata by DOI. Candidates remain separate from formal reaction records and are not automatically promoted to verified evidence.",
    boundaryZh: "OpenAlex 元数据按官方 CC0 说明使用；论文开放获取标记、许可链接与被链接的全文是不同对象，不把 CC0 扩展到论文正文、图片或出版方内容。",
    boundaryEn: "OpenAlex metadata uses the official CC0 dedication. Open-access flags, license links and linked full text are distinct; CC0 does not extend to papers, figures or publisher content.",
    docs: "https://help.openalex.org/api/", terms: "https://help.openalex.org/api/",
  },
]

const reviewRules = [
  {
    titleZh: "代码与数据分开判断",
    titleEn: "Separate code from data",
    bodyZh: "MIT License 覆盖 EcoMOF-AI 自有代码，不覆盖第三方结构数据、文献材料、外部数据库记录或受限内容。",
    bodyEn: "The MIT License covers EcoMOF-AI-authored code, not third-party structure data, literature material, external database records, or restricted content.",
  },
  {
    titleZh: "保留来源与版本",
    titleEn: "Retain source and version context",
    bodyZh: "引用、再处理或导出任何数据时，应保留来源名称、版本、访问路径、记录 ID 和原始许可说明。",
    bodyEn: "When citing, reprocessing, or exporting data, retain source name, version, access path, record ID, and original license notes.",
  },
  {
    titleZh: "商业和机构部署需重新核对",
    titleEn: "Commercial or institutional deployment needs review",
    bodyZh: "商业使用、批量再分发、机构部署或封闭数据接入，应在对应来源条款下重新核对，不应只依赖本页摘要。",
    bodyEn: "Commercial use, bulk redistribution, institutional deployment, or restricted-data access should be reviewed under each source's terms, not only this page summary.",
  },
]

function ExternalLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      <span>{children}</span>
      <ArrowSquareOut aria-hidden="true" size={15} weight="bold" />
    </a>
  )
}

export function OpenSourceLicensesPage() {
  const { lang } = useLang()

  return (
    <div className="about-text-page open-source-licenses-page" data-testid="open-source-licenses-page">
      <header className="about-text-intro">
        <span>{text(lang, "项目治理 / 开源许可", "Governance / Open source licenses")}</span>
        <h1>{text(lang, "开源许可", "Open Source Licenses")}</h1>
        <p>{text(
          lang,
          "本页集中说明 EcoMOF-AI 当前 Web 仓库的自有代码许可、主要开源依赖、Swift 生态边界、近期数据 API，以及第三方科研数据和文献材料不能被项目源码许可重新授权的范围。",
          "This page summarizes the current EcoMOF-AI web repository's source-code license, major open-source dependencies, Swift ecosystem boundary, recent data APIs, and the limits that prevent third-party research data or literature material from being relicensed by the project's source-code license.",
        )}</p>
      </header>

      <section className="license-summary-strip" aria-label={text(lang, "许可摘要", "License summary")}>
        <div>
          <span>{text(lang, "项目自有代码", "Project-authored code")}</span>
          <strong>MIT License</strong>
        </div>
        <div>
          <span>{text(lang, "主要前端依赖", "Main frontend dependencies")}</span>
          <strong>MIT / BSD-3-Clause / Apache-2.0</strong>
        </div>
        <div>
          <span>{text(lang, "科研数据与文献", "Research data and literature")}</span>
          <strong>{text(lang, "按来源逐项判断", "Source-specific terms")}</strong>
        </div>
      </section>

      <section className="license-section">
        <header>
          <span>01</span>
          <h2>{text(lang, "软件与工具依赖", "Software and tooling dependencies")}</h2>
          <p>{text(
            lang,
            "以下为当前 Web 项目中需要公开说明的主要开源许可类别。完整依赖仍以 package.json、锁文件和各上游包元数据为准。",
            "The following are the major open-source license categories that need to be stated for the current web project. The full dependency set remains governed by package.json, the lockfile, and upstream package metadata.",
          )}</p>
        </header>
        <div className="license-ledger">
          {softwareLicenses.map(item => (
            <article key={item.name} className="license-ledger-row">
              <div className="license-ledger-title">
                <strong>{item.name}</strong>
                <ExternalLink href={item.url}>{item.license}</ExternalLink>
              </div>
              <div>
                <span>{text(lang, "使用范围", "Scope")}</span>
                <p>{text(lang, item.scopeZh, item.scopeEn)}</p>
              </div>
              <div>
                <span>{text(lang, "边界", "Boundary")}</span>
                <p>{text(lang, item.boundaryZh, item.boundaryEn)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="license-section">
        <header>
          <span>02</span>
          <h2>{text(lang, "科研数据、结构文件与文献材料", "Research data, structure files, and literature material")}</h2>
          <p>{text(
            lang,
            "EcoMOF-AI 的源码许可不会把外部数据库、论文材料或结构记录变成项目自有开放数据。每一类材料都必须回到原始来源、版本和条款中判断。",
            "EcoMOF-AI's source-code license does not turn external databases, article material, or structure records into project-owned open data. Each material class must be evaluated against its original source, version, and terms.",
          )}</p>
        </header>
        <div className="license-data-boundaries">
          {dataLicenses.map(item => (
            <article key={item.name}>
              <span>{text(lang, item.statusZh, item.statusEn)}</span>
              <h3>{item.name}</h3>
              <p>{text(lang, item.bodyZh, item.bodyEn)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="license-section">
        <header>
          <span>03</span>
          <h2>{text(lang, "近期使用的数据 API 与服务", "Recently used data APIs and services")}</h2>
          <p>{text(lang, "以下接口用于数据采集、历史复核与文献整理，页面读取已保存的数据。数据接口的服务条款与软件开源许可分别列出；公开可读不代表可以任意再分发。", "These APIs support collection, historical review and literature curation; pages read saved data. Service terms are separate from software licenses, and public readability does not imply unrestricted redistribution.")}</p>
        </header>
        <div className="license-ledger">
          {apiServices.map(item => <article key={item.name} className="license-ledger-row">
            <div className="license-ledger-title"><strong>{item.name}</strong><ExternalLink href={item.docs}>{text(lang, "官方接口文档", "Official API documentation")}</ExternalLink><ExternalLink href={item.terms}>{text(lang, "条款与许可依据", "Terms and licensing basis")}</ExternalLink></div>
            <div><span>{text(lang, "本站用途", "Use on this site")}</span><p>{text(lang, item.scopeZh, item.scopeEn)}</p></div>
            <div><span>{text(lang, item.termsZh, item.termsEn)}</span><p>{text(lang, item.boundaryZh, item.boundaryEn)}</p></div>
          </article>)}
        </div>
        <p>{text(lang, "来源标识另有说明：少量站点图标通过 Google S2 favicon 或 DuckDuckGo 图标缓存取得，下载来源和校验值随来源登记；图标在构建期保存，页面不向这些服务发送读者请求。缓存服务不授予商标或图像再授权。PubMed、期刊、新闻与机构网页按原始资料链接引用，未列为已接入 API。", "Publisher identities are separate: a few site icons came from Google S2 favicon or DuckDuckGo caches, with retrieval URLs and checksums registered. Assets are stored before page entry, so readers do not request these services. Caching does not relicense trademarks or images. PubMed, journals, news and institution pages are cited as source pages rather than claimed API integrations.")}</p>
      </section>

      <section className="license-section">
        <header>
          <span>04</span>
          <h2>{text(lang, "复用前检查规则", "Reuse review rules")}</h2>
        </header>
        <div className="license-review-rules">
          {reviewRules.map((rule, index) => (
            <article key={rule.titleEn}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{text(lang, rule.titleZh, rule.titleEn)}</strong>
              <p>{text(lang, rule.bodyZh, rule.bodyEn)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
