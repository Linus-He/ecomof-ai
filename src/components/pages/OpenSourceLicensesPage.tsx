// @ts-nocheck
import { ArrowSquareOut } from "@phosphor-icons/react"
import { useLang } from "../../contexts"
import "./AboutTextPages.css"

const text = (lang, zh, en) => lang === "zh" ? zh : en

const softwareLicenses = [
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
    scopeZh: "用于简繁中文转换与本地化显示辅助。",
    scopeEn: "Used for Simplified and Traditional Chinese conversion and localization support.",
    boundaryZh: "依赖自身按双许可声明使用；转换后的 EcoMOF-AI 文字内容仍按原内容来源判断。",
    boundaryEn: "The dependency is used under its declared dual licensing; converted EcoMOF-AI text remains governed by the source content boundary.",
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
          "本页集中说明 EcoMOF-AI 当前 Web 仓库的自有代码许可、主要开源依赖、Swift 生态边界，以及第三方科研数据和文献材料不能被项目源码许可重新授权的范围。",
          "This page summarizes the current EcoMOF-AI web repository's source-code license, major open-source dependencies, Swift ecosystem boundary, and the limits that prevent third-party research data or literature material from being relicensed by the project's source-code license.",
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
