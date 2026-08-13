// @ts-nocheck
import { useMemo, useState } from "react"
import {
  ArrowRight,
  ArrowSquareOut,
  CaretDown,
  CheckCircle,
  Copy,
  Database,
  FileText,
  GlobeHemisphereEast,
  LinkSimple,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react"
import complianceRegistry from "../../../public/data/database_compliance_registry.json"
import responsibleDataHero from "../../assets/data-compliance/ecomof-responsible-data-hero.png"
import { useLang } from "../../shared"
import "./DatabaseComplianceTab.css"

const text = (lang, zh, en) => lang === "zh" ? zh : en

const OBLIGATION_TITLES = {
  identify: ["确认记录与许可", "Identify the record and licence"],
  "preserve-notices": ["保留署名与权利声明", "Preserve attribution and rights notices"],
  nc: ["遵守非商业边界", "Respect the non-commercial boundary"],
  sharealike: ["履行相同方式共享", "Apply ShareAlike where required"],
  "fair-by": ["履行 CC BY 署名", "Apply CC BY attribution"],
  "no-rights-expansion": ["不得扩张或转移权利", "Do not expand or transfer rights"],
  "no-bulk-csd": ["不得规避 CSD 许可", "Do not circumvent CSD licensing"],
  articles: ["单独核验出版物及其他权利", "Review publication and other rights separately"],
  science: ["完成科学与工程复核", "Complete scientific and engineering verification"],
  responsibility: ["承担独立判断责任", "Retain independent responsibility"],
}

const COMMITMENT_TITLES = {
  scope: ["限制数据用途", "Limit data use"],
  attribution: ["保留来源与署名", "Preserve provenance and attribution"],
  changes: ["区分原始数据与派生结果", "Separate source data and derivatives"],
  noncommercial: ["执行非商业限制", "Apply non-commercial restrictions"],
  "restricted-csd": ["隔离受限 CSD 数据", "Isolate restricted CSD data"],
  isolation: ["隔离许可未明记录", "Quarantine unresolved records"],
  review: ["复核变更与权利异议", "Review changes and rights concerns"],
}

const STATUS_LABELS = {
  active: ["当前接入", "Active"],
  "active-limited": ["有限接入", "Limited"],
  quarantined: ["未公开接入", "Not publicly ingested"],
}

function sourceStatus(status, lang) {
  return text(lang, ...(STATUS_LABELS[status] || [status, status]))
}

function credentialStatus(status, lang) {
  const labels = {
    "public-licence": ["公开许可", "Public licence"],
    "documented-quarantined": ["已登记但隔离", "Documented and quarantined"],
    "record-level": ["逐记录核验", "Record-level review"],
    "limited-factual-metadata-no-site-licence": ["仅登记事实信息", "Factual metadata only"],
    "blocked-no-credential": ["无覆盖性凭证，停止接入", "No blanket evidence; blocked"],
    "project-origin": ["项目自产材料", "Project-origin material"],
  }
  return text(lang, ...(labels[status] || [status, status]))
}

function EditorialLink({ href, children }) {
  return (
    <a className="dc-text-link" href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noreferrer" : undefined}>
      <span>{children}</span>
      {href?.startsWith("http") ? <ArrowSquareOut aria-hidden size={17} /> : <ArrowRight aria-hidden size={17} />}
    </a>
  )
}

function Principle({ number, icon: Icon, title, body }) {
  return (
    <article className="dc-principle">
      <div className="dc-principle-meta"><span>{number}</span><Icon aria-hidden size={25} weight="light" /></div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  )
}

function DatasetList({ datasets, lang }) {
  return (
    <div className="dc-source-list" data-testid="compliance-dataset-list">
      {datasets.map(dataset => (
        <details className="dc-source-row" key={dataset.id}>
          <summary>
            <span className={`dc-source-state dc-source-state--${dataset.status}`}>{sourceStatus(dataset.status, lang)}</span>
            <strong>{dataset.name}</strong>
            <span className="dc-source-count">{dataset.recordCount == null ? text(lang, "逐记录", "Per record") : Number(dataset.recordCount).toLocaleString()}</span>
            <CaretDown aria-hidden className="dc-disclosure-icon" size={20} />
          </summary>
          <div className="dc-source-detail">
            <div>
              <span>{text(lang, "来源与版本", "Source and version")}</span>
              <p>{dataset.publisher}<br />{dataset.version}</p>
            </div>
            <div>
              <span>{text(lang, "许可与允许用途", "Licence and permitted use")}</span>
              <p><strong>{dataset.licence}</strong><br />{text(lang, dataset.allowedZh, dataset.allowedEn)}</p>
            </div>
            <div>
              <span>{text(lang, "禁止推定", "Do not infer")}</span>
              <p>{text(lang, dataset.prohibitedZh, dataset.prohibitedEn)}</p>
            </div>
            <div>
              <span>{text(lang, "本站处理", "Site handling")}</span>
              <p>{text(lang, dataset.projectHandlingZh, dataset.projectHandlingEn)}</p>
            </div>
            <div className="dc-source-links">
              {dataset.sourceUrl ? <EditorialLink href={dataset.sourceUrl}>{text(lang, "官方来源", "Official source")}</EditorialLink> : null}
              {(dataset.licenceUrls || []).map((url, index) => <EditorialLink href={url} key={url}>{index === 0 ? text(lang, "许可原文", "Licence text") : text(lang, "附加条款", "Additional terms")}</EditorialLink>)}
            </div>
          </div>
        </details>
      ))}
    </div>
  )
}

function ArchiveSection({ id, testId, number, title, intro, children }) {
  return (
    <section className="dc-archive-section" id={id} data-testid={testId}>
      <header><span>{number}</span><div><h3>{title}</h3>{intro ? <p>{intro}</p> : null}</div></header>
      <div className="dc-archive-body">{children}</div>
    </section>
  )
}

function ArchiveItem({ number, title, body, children, warn = false }) {
  return (
    <article className={`dc-archive-item${warn ? " dc-archive-item--warn" : ""}`}>
      <span>{number}</span>
      <div><h4>{title}</h4>{body ? <p>{body}</p> : null}{children}</div>
    </article>
  )
}

function SourceLink({ source, lang }) {
  if (!source) return null
  return <EditorialLink href={source.url}>{text(lang, "发布方原文：", "Publisher source: ")}{text(lang, source.titleZh, source.titleEn)}</EditorialLink>
}

function ClauseList({ lang }) {
  return complianceRegistry.applicableClauseGroups.map((group, groupIndex) => {
    const sectionNumber = `3.${groupIndex + 1}`
    return (
      <section className="dc-clause-group" key={group.id}>
        <h4><span>{sectionNumber}</span>{text(lang, group.titleZh, group.titleEn)}</h4>
        <p>{text(lang, group.scopeZh, group.scopeEn)}</p>
        {group.clauses.map((clause, index) => {
          const source = complianceRegistry.officialDocuments.find(item => item.id === clause.sourceDocumentId)
          return (
            <ArchiveItem key={clause.id} number={`${sectionNumber}.${index + 1}`} title={text(lang, clause.titleZh, clause.titleEn)} body={text(lang, clause.bodyZh, clause.bodyEn)}>
              <small>{text(lang, "原文位置：", "Original section: ")}{clause.section}</small>
              <SourceLink source={source} lang={lang} />
            </ArchiveItem>
          )
        })}
      </section>
    )
  })
}

function CredentialList({ lang }) {
  return complianceRegistry.authorizationCredentials.map((credential, index) => (
    <ArchiveItem
      key={credential.id}
      number={`4.${index + 1}`}
      title={`${text(lang, credential.sourceZh, credential.sourceEn)} · ${credentialStatus(credential.status, lang)}`}
      body={text(lang, credential.authorizationZh, credential.authorizationEn)}
      warn={credential.status === "blocked-no-credential"}
    >
      <p><strong>{text(lang, "边界：", "Boundary: ")}</strong>{text(lang, credential.limitationZh, credential.limitationEn)}</p>
      {(credential.evidence || []).map((evidence, evidenceIndex) => evidence.url
        ? <EditorialLink key={`${credential.id}-${evidenceIndex}`} href={evidence.url}>{text(lang, evidence.kindZh, evidence.kindEn)}：{evidence.label}</EditorialLink>
        : <small key={`${credential.id}-${evidenceIndex}`}>{text(lang, evidence.kindZh, evidence.kindEn)}：{evidence.label}</small>)}
    </ArchiveItem>
  ))
}

function ComplianceArchive({ lang }) {
  return (
    <details className="dc-archive">
      <summary>
        <span><FileText aria-hidden size={24} /><span><strong>{text(lang, "完整许可、授权凭证与术语档案", "Full licence, authorization, and definitions archive")}</strong><small>{text(lang, "展开 9 章、43 条适用条款和逐项授权证据", "Open nine chapters, 43 applicable clauses, and itemized evidence")}</small></span></span>
        <CaretDown aria-hidden className="dc-disclosure-icon" size={22} />
      </summary>
      <div className="dc-archive-content">
        <ArchiveSection number="使用前" title={text(lang, "适用条款与使用前核查", "Read before use")}>
          <p>{text(lang, "继续访问或使用本站内容，表示您已经看到本页列出的来源、许可和责任说明。这并不替代数据发布方的许可，也不代表您已经取得商业使用、批量再分发或其他受限用途的授权。", "Continuing to use this site means that you have seen the listed source, licence, and responsibility notes. This does not replace publisher terms or grant permission for commercial use, bulk redistribution, or another restricted purpose.")}</p>
        </ArchiveSection>

        <ArchiveSection id="compliance-position" number="1" title={text(lang, "适用范围与免责声明", "Scope and disclaimer")} intro={text(lang, "这里记录的是本站采用的处理边界，不是法律意见，也不是全面合规认证。", "These are the site's operating boundaries, not legal advice or comprehensive compliance certification.")}>
          <ArchiveItem number="1.1" title={text(lang, "本站以非商业研究方式运行", "The site operates for non-commercial research")} body={text(lang, complianceRegistry.statusStatement.zh, complianceRegistry.statusStatement.en)} />
          <ArchiveItem number="1.2" title={text(lang, "访问不等于取得授权", "Access is not permission")} body={text(lang, "访问本网站不等于获得任何数据库的商业许可、机构许可或批量再分发权。", "Accessing this site does not grant commercial, institutional, or bulk-redistribution rights.")} />
          <ArchiveItem number="1.3" title={text(lang, "原文和实际协议优先", "Primary terms and actual agreements prevail")} body={text(lang, "如本站说明与许可正文、附加下载条款、实际机构协议或权利人书面答复不一致，以适用于该记录的原始文件为准。", "If this page differs from a licence, download term, institutional agreement, or written rightsholder response, the source document applicable to the record prevails.")} />
          <ArchiveItem number="1.4" title={text(lang, "科学结果仍需独立复核", "Scientific results require independent review")} body={text(lang, complianceRegistry.notLegalAdvice.zh, complianceRegistry.notLegalAdvice.en)} />
        </ArchiveSection>

        <ArchiveSection id="compliance-ccdc" testId="compliance-ccdc-boundaries" number="2" title={text(lang, "CCDC 与 CSD 数据边界", "CCDC and CSD data boundaries")} intro={text(lang, "CSD MOF Collection、CoRE-MOF modified CIF、CoRE-MOF unmodified CIF 和完整付费 CSD 是不同对象。", "These CCDC/CSD objects are distinct and do not share one licence.")}>
          {complianceRegistry.ccdcDecisionRules.map((item, index) => <ArchiveItem key={item.id} number={`2.${index + 1}`} title={text(lang, item.objectZh, item.objectEn)} body={text(lang, item.ruleZh, item.ruleEn)} warn={index > 1}><p><strong>{text(lang, "本站决定：", "Site decision: ")}</strong>{text(lang, item.decisionZh, item.decisionEn)}</p></ArchiveItem>)}
        </ArchiveSection>

        <ArchiveSection id="compliance-clauses" testId="compliance-applicable-clauses" number="3" title={text(lang, "适用条款与发布方原文", "Applicable terms and publisher sources")} intro={text(lang, "中文说明只作索引和保守提示；定义和例外以发布方原文为准。", "Summaries are a conservative index; publisher text controls meaning and exceptions.")}><ClauseList lang={lang} /></ArchiveSection>
        <ArchiveSection id="compliance-credentials" testId="compliance-authorization-credentials" number="4" title={text(lang, "授权凭证与尚未解决的缺口", "Authorization evidence and unresolved gaps")}><CredentialList lang={lang} /></ArchiveSection>

        <ArchiveSection id="compliance-responsibilities" number="5" title={text(lang, "用户责任与本站责任", "User and site responsibilities")}>
          <h4 className="dc-archive-subtitle">{text(lang, "5.1 使用者需要做到", "5.1 User responsibilities")}</h4>
          {complianceRegistry.userObligations.map((item, index) => <ArchiveItem key={item.id} number={`5.1.${index + 1}`} title={text(lang, OBLIGATION_TITLES[item.id]?.[0] || item.id, OBLIGATION_TITLES[item.id]?.[1] || item.id)} body={text(lang, item.zh, item.en)} warn={item.level === "required"} />)}
          <h4 className="dc-archive-subtitle">{text(lang, "5.2 本站目前执行的原则", "5.2 Current site commitments")}</h4>
          {complianceRegistry.platformCommitments.map((item, index) => <ArchiveItem key={item.id} number={`5.2.${index + 1}`} title={text(lang, COMMITMENT_TITLES[item.id]?.[0] || item.id, COMMITMENT_TITLES[item.id]?.[1] || item.id)} body={text(lang, item.zh, item.en)} />)}
        </ArchiveSection>

        <ArchiveSection id="compliance-documents" testId="compliance-primary-documents" number="6" title={text(lang, "发布方官方文件", "Official publisher documents")}>
          {complianceRegistry.officialDocuments.map((item, index) => <ArchiveItem key={item.id} number={`6.${index + 1}`} title={text(lang, item.titleZh, item.titleEn)} body={text(lang, item.scopeZh, item.scopeEn)}><EditorialLink href={item.url}>{item.publisher}</EditorialLink></ArchiveItem>)}
        </ArchiveSection>

        <ArchiveSection id="compliance-source-registry-archive" number="7" title={text(lang, "来源登记说明", "Source registry notes")}><p>{text(lang, "来源登记逐项记录版本、记录范围、许可、允许用途、禁止推定事项和本站处理方式。", "The registry records version, scope, licence, permitted use, non-implications, and site handling.")}</p></ArchiveSection>
        <ArchiveSection id="compliance-response" testId="compliance-incident-response" number="8" title={text(lang, "异议、纠错与移除", "Disputes, corrections, and removal")}>
          {complianceRegistry.incidentResponse.map((item, index) => <ArchiveItem key={item.id} number={`8.${index + 1}`} title={text(lang, ["登记问题", "暂停相关展示", "核对来源与条款", "记录处理决定", "通知并保留复核入口"][index], ["Record the concern", "Pause the affected display", "Review provenance and terms", "Record the decision", "Notify and retain a review route"][index])} body={text(lang, item.zh, item.en)} />)}
        </ArchiveSection>
        <ArchiveSection testId="compliance-definitions" number="9" title={text(lang, "术语说明", "Definitions")}>
          {complianceRegistry.definitions.map((item, index) => <ArchiveItem key={item.termEn} number={`9.${index + 1}`} title={text(lang, item.termZh, item.termEn)} body={text(lang, item.definitionZh, item.definitionEn)} />)}
        </ArchiveSection>
      </div>
    </details>
  )
}

export function DatabaseComplianceTab() {
  const { lang } = useLang()
  const [filter, setFilter] = useState("all")
  const [copyStatus, setCopyStatus] = useState("")
  const datasets = useMemo(() => {
    if (filter === "all") return complianceRegistry.datasets
    if (filter === "active") return complianceRegistry.datasets.filter(row => row.status === "active")
    if (filter === "limited") return complianceRegistry.datasets.filter(row => row.status === "active-limited")
    return complianceRegistry.datasets.filter(row => row.status === "quarantined")
  }, [filter])

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#database-compliance`
    try {
      await navigator.clipboard.writeText(url)
      setCopyStatus("copied")
    } catch {
      setCopyStatus("failed")
    }
    window.setTimeout(() => setCopyStatus(""), 1500)
  }

  return (
    <div id="database-compliance" className="dc-page" data-testid="database-compliance-tab">
      <section className="dc-cover">
        <div className="dc-cover-copy">
          <h1>{text(lang, "我们希望以可追溯的方式使用研究数据", "We want to use research data in a traceable way")}</h1>
          <button className="dc-copy-link" type="button" onClick={copyLink} aria-label={text(lang, "复制合规说明链接", "Copy compliance link")}>
            {copyStatus === "copied" ? <CheckCircle aria-hidden size={19} /> : <LinkSimple aria-hidden size={19} />}
            {copyStatus === "copied" ? text(lang, "链接已复制", "Link copied") : copyStatus === "failed" ? text(lang, "复制失败", "Copy failed") : text(lang, "复制本页链接", "Copy page link")}
          </button>
        </div>
      </section>

      <section className="dc-reading-section dc-approach" id="compliance-approach">
        <h2>{text(lang, "我们的方式", "Our approach")}</h2>
        <div className="dc-prose">
          <p className="dc-lead">{text(lang, "开放科学可以带来非凡价值，但只有当来源、许可、计算边界与不确定性都能够被追问时，数据才值得被信任。", "Open science can create extraordinary value, but research data is trustworthy only when its provenance, licence, computational boundary, and uncertainty can be questioned.")}</p>
          <p>{text(lang, "EcoMOF-AI 以非商业研究模式运行。我们把数据责任放进每一次接入、标准化、筛选和派生计算中：先识别数据对象与原始条款，再保留字段级来源，最后把不能确认的记录隔离，而不是用界面上的“合规”标签替代判断。", "EcoMOF-AI operates in non-commercial research mode. Responsibility is built into ingestion, normalization, screening, and derivation: identify the data object and primary terms, preserve field-level provenance, and quarantine records that cannot be resolved rather than replacing judgment with a compliance label.")}</p>
          <p>{text(lang, "本页不是法律意见，也不是全面合规认证。发布方许可正文、附加下载条款、机构协议和权利人书面答复始终优先。", "This page is not legal advice or comprehensive compliance certification. Publisher licences, download terms, institutional agreements, and written rightsholder responses always prevail.")}</p>
        </div>
      </section>

      <figure className="dc-hero-media">
        <img src={responsibleDataHero} alt={text(lang, "由 MOF 孔道与证据节点组成的抽象数据溯源网络", "An abstract provenance network formed from MOF pores and evidence nodes")} />
        <figcaption><span>{text(lang, "证据网络", "Evidence network")}</span><p>{text(lang, "每一个发光节点代表一个可回到来源、条款或计算记录的研究声明。", "Each luminous node represents a research claim that can return to a source, term, or computational record.")}</p></figcaption>
      </figure>

      <section className="dc-principles" aria-label={text(lang, "责任原则", "Responsibility principles")}>
        <Principle number="01" icon={ShieldCheck} title={text(lang, "负责任的治理", "Responsible governance")} body={text(lang, "来源、许可与用途同时登记；权限不清的记录先隔离，运营模式或条款变化即重新复核。", "Register source, licence, and use together; quarantine unresolved records and review again when terms or operating mode change.")} />
        <Principle number="02" icon={Database} title={text(lang, "可验证的研究", "Verifiable research")} body={text(lang, "明确区分原始文件、重组索引、字段标准化、派生分数与算法输出，并保留修改说明。", "Separate original files, reorganized indexes, normalized fields, derived scores, and algorithm outputs, preserving change notices.")} />
        <Principle number="03" icon={CheckCircle} title={text(lang, "有边界的影响", "Bounded impact")} body={text(lang, "不把可访问解释为可商用或可再分发，也不把数据库记录与模型分数包装成性能、安全或适用性保证。", "Never interpret access as commercial or redistribution permission, or present database records and model scores as guarantees.")} />
      </section>

      <section className="dc-reading-section dc-security" id="compliance-security">
        <h2>{text(lang, "安全、许可与隐私保护", "Secure, licensed, and privacy-preserving research")}</h2>
        <div className="dc-prose">
          <p className="dc-lead">{text(lang, "随着数据覆盖与模型能力扩大，错误传播、权利越界和用途漂移的风险也会同步增加。", "As data coverage and model capability expand, so do the risks of error propagation, rights overreach, and use drift.")}</p>
          <p>{text(lang, "因此，受限 CSD 数据不进入公开批量再分发；带 NC 条款的数据不用于商业用途；论文全文、图像、补充材料、专利与隐私权不因 DOI 或数据集许可而自动获得。所有科研与工程结论仍需回到来源论文、实验条件和派生方法独立复核。", "Restricted CSD data is not publicly redistributed in bulk; NC data is not used commercially; rights to article text, figures, supplements, patents, and privacy-controlled material do not follow automatically from a DOI or dataset licence. Scientific and engineering conclusions still require independent review of source papers, conditions, and derivations.")}</p>
          <EditorialLink href="#compliance-source-registry">{text(lang, "查看实际接入来源", "Review ingested sources")}</EditorialLink>
        </div>
      </section>

      <section className="dc-hosting-notice" id="compliance-hosting-notice" data-testid="compliance-hosting-notice">
        <div className="dc-hosting-notice-icon"><GlobeHemisphereEast aria-hidden size={31} weight="light" /></div>
        <div>
          <h2>{text(lang, "部分数据暂未部署在中国大陆地区服务器", "Some data is not currently hosted on servers in mainland China")}</h2>
          <p>{text(lang, "基于对欧盟及相关地区数据保护与跨境传输要求的审慎处理，同时受数据提供方许可和当前托管条件影响，本站暂未将相关数据部署在中国大陆地区服务器。若数据未能加载，请切换至可正常访问相关境外数据源的合规网络环境后重试。由此带来的不便，我们深表歉意。", "As a cautious response to European and other applicable data-protection and cross-border transfer requirements, together with provider licences and current hosting conditions, the relevant data is not currently hosted on servers in mainland China. If it does not load, please retry from a compliant network environment that can access the relevant overseas data source. We apologize for the inconvenience.")}</p>
          <p className="dc-hosting-legal-note">{text(lang, "法律范围说明：GDPR 第五章规范的是个人数据向第三国或国际组织的传输，不是对所有科研数据在特定地域托管的概括性禁令。本项目当前限制还包括数据发布方的许可条件与实际托管能力。", "Legal scope: GDPR Chapter V regulates transfers of personal data to third countries or international organizations; it is not a blanket geographic hosting ban for all research data. Current project limits also reflect publisher licence terms and practical hosting capability.")}</p>
          <div className="dc-hosting-links">
            <EditorialLink href="https://eur-lex.europa.eu/eli/reg/2016/679/oj">{text(lang, "GDPR 原始法律条文（EUR-Lex）", "Original GDPR text (EUR-Lex)")}</EditorialLink>
            <EditorialLink href="https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection_en">{text(lang, "欧盟委员会：个人数据国际传输", "European Commission: international data transfers")}</EditorialLink>
            <EditorialLink href="#compliance-source-registry">{text(lang, "查看来源与许可登记", "Review source and licence registry")}</EditorialLink>
          </div>
        </div>
      </section>

      <section className="dc-registry" id="compliance-source-registry" data-testid="compliance-source-registry">
        <header className="dc-section-header">
          <div><h2>{text(lang, "来源登记", "Source registry")}</h2></div>
          <p>{text(lang, "这里不是合作伙伴徽标墙，而是本站真实接入对象的可审计清单。展开任一来源，可查看版本、许可、允许范围和禁止推定。", "This is not a partner-logo wall. It is an auditable list of the objects actually ingested by this site. Open any source to review its version, licence, permitted scope, and non-implications.")}</p>
        </header>
        <div className="dc-registry-stats" aria-label={text(lang, "登记摘要", "Registry summary")}>
          <div><strong>{complianceRegistry.datasets.length}</strong><span>{text(lang, "个登记来源", "registered sources")}</span></div>
          <div><strong>43</strong><span>{text(lang, "条适用条款", "applicable clauses")}</span></div>
          <div><strong>{complianceRegistry.officialDocuments.length}</strong><span>{text(lang, "份官方原文", "official documents")}</span></div>
        </div>
        <div className="dc-filters" role="group" aria-label={text(lang, "按接入状态筛选", "Filter by ingestion status")}>
          {[
            ["all", text(lang, "全部来源", "All sources")],
            ["active", text(lang, "当前接入", "Active")],
            ["limited", text(lang, "有限接入", "Limited")],
            ["quarantined", text(lang, "未公开接入", "Excluded")],
          ].map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}
        </div>
        <DatasetList datasets={datasets} lang={lang} />
      </section>

      <section className="dc-reading-section dc-benefit">
        <h2>{text(lang, "让研究结果真正有益", "Research that genuinely benefits its users")}</h2>
        <div className="dc-prose">
          <p className="dc-lead">{text(lang, "透明不是把条款堆满一页，而是让使用者在作出判断时，能看到最关键的证据与停止条件。", "Transparency is not filling a page with terms. It means surfacing the evidence and stop conditions that matter when a user makes a decision.")}</p>
          <p>{text(lang, "在下载、改编、训练模型、发布结果或再分发之前，请确认具体记录来自哪个数据库，保留署名、许可与修改说明，并独立判断你的机构政策、适用法律和所需授权。若用途可能涉及商业机构、收费产品、客户交付或商业模型，应先向 CCDC 或相关权利人取得书面确认。", "Before downloading, adapting, training, publishing, or redistributing, identify the source database, preserve attribution, licence, and change notices, and independently assess institutional policy, applicable law, and required permission. Commercial entities, paid products, client delivery, or commercial models require written confirmation from CCDC or the relevant rightsholder first.")}</p>
        </div>
      </section>

      <section className="dc-response-card">
        <div><WarningCircle aria-hidden size={30} weight="light" /><span>{text(lang, "异议处理", "Issue response")}</span></div>
        <h2>{text(lang, "有合理争议时，先暂停，再核验。", "When a concern is reasonable, pause first and verify.")}</h2>
        <p>{text(lang, "来信请包含记录名称、来源链接与问题说明。相关展示、计算、下载和导出会先暂停；恢复、更正、限制或移除决定必须留下可复核的依据。", "Include the record name, source link, and concern. Related display, computation, download, and export are paused first; restoration, correction, restriction, or removal requires reviewable evidence.")}</p>
        <a href="#contact"><span>{text(lang, "联系我们", "Contact us")}</span><ArrowRight aria-hidden size={20} /></a>
      </section>

      <ComplianceArchive lang={lang} />

      <footer className="dc-page-note">
        <Copy aria-hidden size={18} /><p><strong>{text(lang, "数据使用、许可与责任", "Data use, licensing, and responsibilities")}</strong><span>{text(lang, "非商业研究 · 原文优先 · 来源持续登记", "Non-commercial research · primary terms prevail · maintained source registry")}</span></p>
      </footer>
    </div>
  )
}
