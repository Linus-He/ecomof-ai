import { useLang } from '../../contexts'
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
    id?: string
    relation?: string
    introduction?: string[]
    en?: {role:string;status:string;paragraphs:string[];products:{name:string;application:string;url:string}[]}
    products?: { name: string; application: string; url: string }[]
    role: string
    status: string
    paragraphs: string[]
    sources: SourceLink[]
  }[]
}
function OrganizationMark({ organization, zh = true }: { organization: NobelOrganization; zh?:boolean }) {
  return <a className="nobel-organization" href={organization.url} target="_blank" rel="noreferrer">
    <img className={`nobel-organization-logo nobel-organization-logo--${organization.logoKind}`} src={`${import.meta.env.BASE_URL}${organization.logo}`} alt={`${organization.englishName} logo`} loading="lazy" decoding="async" />
    <span><strong>{zh ? organization.name : organization.englishName}</strong>{zh && organization.name !== organization.englishName && <small>{organization.englishName}</small>}</span>
  </a>
}
function SourceLinks({ sources, zh = true }: { sources: SourceLink[]; zh?:boolean }) {
  const uniqueSources = sources.filter((source, index) => sources.findIndex(item => item.url === source.url) === index)
  return <div className="nobel-case-sources">{uniqueSources.map((source, index) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{zh ? source.label : `Official source ${index+1}`} ↗</a>)}</div>
}
export function NobelResearchProgress({ data, section = 'all' }: { data: NobelDevelopments; section?: 'all' | 'research' | 'companies' }) {
  const {lang}=useLang();const zh=lang==='zh'
  const organizations = new Map(data.organizations.map(item => [item.id, item]))
  return <div className="nobel-research-progress" lang={zh ? "zh-CN" : "en"}>
    {section!=='companies' && <>
    <div className="nobel-progress-heading"><h3>{zh ? '大学论文' : 'University research'}</h3></div>
    <p className="nobel-case-note">{zh ? '列出主要研究机构；完整作者与合作机构见论文原文。' : 'Primary institutions are listed. Full authors and affiliations appear in the paper; the research commentary is currently in Chinese.'}</p>
    <div className="nobel-paper-list">{data.researchCases.map(paper => <article className="nobel-paper-case" key={paper.id}>
      <div className="nobel-organization-line">{paper.organizationIds.map(id => <OrganizationMark key={id} organization={organizations.get(id)!} zh={zh} />)}</div>
      <h4>{paper.heading}</h4>
      <p className="nobel-paper-title"><a href={paper.paperUrl} target="_blank" rel="noreferrer">{paper.paperTitle}</a></p>
      <div className="nobel-paper-meta"><span>{paper.journal}</span></div>
      <p className="nobel-paper-authors">{paper.authors} <a href={paper.paperUrl} target="_blank" rel="noreferrer">{zh ? '作者与所属机构' : 'Authors and affiliations'} ↗</a></p>
      {paper.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      <SourceLinks sources={paper.sources} />
      <div className="nobel-case-relation">{paper.relatedCompanyIds.length > 0 && <div>相关企业：{paper.relatedCompanyIds.map((id, index) => <span key={id}>{index > 0 ? ' · ' : ''}<a href={organizations.get(id)!.url} target="_blank" rel="noreferrer">{organizations.get(id)!.name}</a></span>)}</div>}<p>{paper.relation}</p></div>
    </article>)}</div>
    </>}
    {section!=='research' && <div className="nobel-company-list">{data.companyCases.map(company => {
      const content=!zh && company.en ? company.en : company
      return <article className="nobel-company-case nobel-company-profile" key={company.id || company.organizationId}>
        <aside><OrganizationMark organization={organizations.get(company.organizationId)!} zh={zh} />{company.introduction && <p className="nobel-company-introduction">{company.introduction[zh?0:1]}</p>}</aside>
        <div className="nobel-company-content"><span className="nobel-company-status">{content.status}</span><h4>{content.role}</h4>
        {content.paragraphs.slice(0,2).map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        {!!content.products?.length && <div className="nobel-product-details"><h5>{zh ? '产品与使用环节' : 'Products and their roles'}</h5><div className="nobel-product-grid">{content.products.map((product,index) => <div key={index}><a href={product.url} target="_blank" rel="noreferrer">{product.name} ↗</a><p>{product.application}</p></div>)}</div></div>}
        <details className="nobel-company-boundary"><summary>{zh ? '适用条件与研究联系' : 'Conditions and research context'}</summary>{content.paragraphs.slice(2).map(paragraph=><p key={paragraph}>{paragraph}</p>)}{zh && company.relation && <p>{company.relation}</p>}</details>
        <SourceLinks sources={company.sources} zh={zh} /></div>
      </article>
    })}</div>}
  </div>
}
