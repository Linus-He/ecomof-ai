type SourceLink = { label: string; url: string }
export type NobelOrganization = {
  id: string
  name: string
  englishName: string
  url: string
  logo: string
  logoKind: 'symbol' | 'wordmark'
}
export type NobelDevelopments = {
  updated?: string
  organizations: NobelOrganization[]
  researchCases: {
    id: string
    heading: string
    organizationIds: string[]
    authors: string
    paperTitle: string
    journal: string
    published: string
    doi: string
    paperUrl: string
    paragraphs: string[]
    sources: SourceLink[]
    relatedCompanyIds: string[]
    relation: string
  }[]
  companyCases: {
    organizationId: string
    role: string
    status: string
    paragraphs: string[]
    sources: SourceLink[]
  }[]
}
function OrganizationMark({ organization }: { organization: NobelOrganization }) {
  return <a className="nobel-organization" href={organization.url} target="_blank" rel="noreferrer">
    <img className={`nobel-organization-logo nobel-organization-logo--${organization.logoKind}`} src={`${import.meta.env.BASE_URL}${organization.logo}`} alt={`${organization.englishName} logo`} loading="lazy" decoding="async" />
    <span><strong>{organization.name}</strong>{organization.name !== organization.englishName && <small>{organization.englishName}</small>}</span>
  </a>
}
function SourceLinks({ sources }: { sources: SourceLink[] }) {
  return <div className="nobel-case-sources">{sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div>
}
export function NobelResearchProgress({ data }: { data: NobelDevelopments }) {
  const organizations = new Map(data.organizations.map(item => [item.id, item]))
  return <div className="nobel-research-progress" lang="zh-CN">
    <div className="nobel-progress-heading"><h3>大学论文</h3></div>
    <p className="nobel-case-note">列出主要研究机构；完整作者与合作机构见论文原文。</p>
    <div className="nobel-paper-list">{data.researchCases.map(paper => <article className="nobel-paper-case" key={paper.id}>
      <div className="nobel-organization-line">{paper.organizationIds.map(id => <OrganizationMark key={id} organization={organizations.get(id)!} />)}</div>
      <h4>{paper.heading}</h4>
      <p className="nobel-paper-title"><a href={paper.paperUrl} target="_blank" rel="noreferrer">{paper.paperTitle}</a></p>
      <div className="nobel-paper-meta"><span>{paper.journal}</span></div>
      <p className="nobel-paper-authors">{paper.authors}</p>
      {paper.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      <SourceLinks sources={paper.sources} />
      <div className="nobel-case-relation">{paper.relatedCompanyIds.length > 0 && <div>相关企业：{paper.relatedCompanyIds.map((id, index) => <span key={id}>{index > 0 ? ' · ' : ''}<a href={organizations.get(id)!.url} target="_blank" rel="noreferrer">{organizations.get(id)!.name}</a></span>)}</div>}<p>{paper.relation}</p></div>
    </article>)}</div>
    <div className="nobel-progress-heading"><h3>企业与产品进展</h3></div>
    <div className="nobel-company-list">{data.companyCases.map(company => <article className="nobel-company-case" key={company.organizationId}>
      <OrganizationMark organization={organizations.get(company.organizationId)!} />
      <h4>{company.role}</h4><p className="nobel-company-status">{company.status}</p>
      {company.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      <SourceLinks sources={company.sources} />
    </article>)}</div>
  </div>
}
