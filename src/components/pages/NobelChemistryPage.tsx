import { useLang } from '../../contexts'
import { useEffect, useState } from 'react'
import katex from 'katex'
import { NobelResearchProgress, type NobelDevelopments } from './NobelResearchProgress'
import latestEdition from '../../data/nobelLatest.json'
import '../home/nobelChemistry.css'

type ReadingSection = {
  id: string
  title: string[]
  body: string
  equation?: string
  equationNote?: string
  supplementalEquations?: { math: string; note: string; sourceUrl?: string }[]
  relatedYear?: number
  relatedSource?: string
}
type Edition = {
  year: number
  status: 'awarded' | 'not-awarded'
  names: string[]
  personUrls?: string[]
  people?: {id:string; name:string; url:string; affiliations:string[]}[]
  motivations?: string[]
  theme?: string[]
  intro?: string[]
  citation?: string[]
  image?: string
  portraits?: { id: string; name: string; image: string; credit: string; page: string }[]
  checked?: string
  reading?: {
    title: string
    learningGuide?: {topic:string;title:string[];definition:string[];example:string[];sources?:{label:string;url:string}[]}
    summary: string
    language: string
    reviewed: string
    sections: ReadingSection[]
    developments?: NobelDevelopments
    officialSource: { url: string; kind: string; checked: string }
  }
}
const sourceLabels: Record<string, string[]> = {
  'popular-information': ['官方科普原文', 'Official popular science article'],
  'press-release': ['官方授奖解读原文', 'Official press release'],
  'ceremony-speech': ['官方颁奖演说原文', 'Official presentation speech'],
  summary: ['官方年度资料', 'Official annual record'],
}


function PersonText({text, people=[]}:{text:string;people:NonNullable<Edition['people']>}) {
  const aliases=new Map<string,NonNullable<Edition['people']>[number]>()
  for(const person of people){aliases.set(person.name,person);const surname=person.name.split(' ').slice(-1)[0];if(surname.length>2)aliases.set(surname,person)}
  if(!aliases.size)return <>{text}</>
  const escaped=[...aliases.keys()].sort((a,b)=>b.length-a.length).map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))
  const pattern=new RegExp(`(\\b(?:${escaped.join('|')})\\b)`,'g')
  return <>{text.split(pattern).map((part,index)=>{const person=aliases.get(part);return person ? <a key={index} href={person.url} target="_blank" rel="noreferrer" title={person.affiliations.join(' · ')}>{part}</a> : part})}</>
}

function Equation({ math, note, sourceUrl }: { math: string; note?: string; sourceUrl?: string }) {
  let html: string
  try {
    html = katex.renderToString(math, { displayMode: true, throwOnError: true, output: 'htmlAndMathml' })
  } catch {
    return <figure className="nobel-equation"><code>{math}</code><figcaption>{note}{sourceUrl && <> <a href={sourceUrl} target="_blank" rel="noreferrer">来源 / Source ↗</a></>}</figcaption></figure>
  }
  return <figure className="nobel-equation"><div dangerouslySetInnerHTML={{ __html: html }} /><figcaption>{note}{sourceUrl && <> <a href={sourceUrl} target="_blank" rel="noreferrer">来源 / Source ↗</a></>}</figcaption></figure>
}

export function NobelChemistryPage({ hash }: { hash: string }) {
  const { lang } = useLang()
  const zh = lang === 'zh', i = zh ? 0 : 1
  const routeYear = Number(hash.match(/-(\d{4})$/)?.[1]) || latestEdition.year
  const [selectedYear, setSelectedYear] = useState(String(routeYear))
  const [range, setRange] = useState({ firstYear: 1901, latestYear: latestEdition.year })
  const [edition, setEdition] = useState<Edition | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/nobel-chemistry/index.json`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Index unavailable'); return response.json() })
      .then(index => { if (!controller.signal.aborted) setRange(index) }).catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    setSelectedYear(String(routeYear))
    setEdition(null)
    setError(false)
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/nobel-chemistry/${routeYear}.json`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Edition unavailable'); return response.json() })
      .then(record => {
        if (record.year !== routeYear) throw new Error('Wrong annual record')
        if (!controller.signal.aborted) setEdition(record)
      }).catch(err => { if (err.name !== 'AbortError' && !controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [routeYear, attempt])

  const year = Number(selectedYear)
  const valid = /^\d{4}$/.test(selectedYear) && year >= range.firstYear && year <= range.latestYear
  const adjustYear = (change: number) => setSelectedYear(String(Math.min(range.latestYear, Math.max(range.firstYear, (Number(selectedYear) || routeYear) + change))))
  const official = `https://www.nobelprize.org/prizes/chemistry/${routeYear}`
  const reading = edition?.reading

  return <main className="nobel-editorial nobel-page">
    <header className="nobel-masthead">
      <a href="#unified-search">{zh ? '返回首页' : 'Back to home'}</a>
      <div><span className="nobel-kicker">EcoMOF-AI · {zh ? '科学解读' : 'SCIENCE READINGS'}</span><h1>The Nobel Prize in Chemistry</h1><p>{zh ? '一年一项发现，理解化学如何向前。' : 'A discovery each year. A new way to understand chemistry.'}</p></div>
      <form className="nobel-year-explorer" aria-label={zh ? '选择诺奖年度' : 'Explore a Nobel year'} onSubmit={event => { event.preventDefault(); if (valid) window.location.hash = `nobel-chemistry-${year}` }}>
        <div className="nobel-year-stepper">
          <button type="button" aria-label={zh ? '上一年' : 'Previous year'} disabled={year <= range.firstYear} onClick={() => adjustYear(-1)}>−</button>
          <input aria-label={zh ? '年份' : 'Year'} type="text" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={selectedYear} onChange={event => setSelectedYear(event.target.value)} />
          <button type="button" aria-label={zh ? '下一年' : 'Next year'} disabled={year >= range.latestYear} onClick={() => adjustYear(1)}>+</button>
        </div>
        <button className="nobel-explore-button" type="submit" disabled={!valid}>Explore</button>
        <small>{range.firstYear}–{range.latestYear}{!valid ? (zh ? ' · 请输入范围内的四位年份' : ' · Enter a four-digit year in range') : ''}</small>
      </form>
    </header>
    {error ? <div role="alert" className="nobel-archive"><p>{zh ? '该年度资料暂时无法加载，请重试或查看官方记录。' : 'This edition could not be loaded. Retry or consult the official record.'}</p><button onClick={() => setAttempt(value => value + 1)}>{zh ? '重试' : 'Retry'}</button> <a href={`${official}/summary/`} target="_blank" rel="noreferrer">NobelPrize.org ↗</a></div>
      : !edition ? <p role="status">{zh ? '正在加载年度资料…' : 'Loading the selected edition…'}</p>
      : edition.status === 'not-awarded' ? <article className="nobel-archive"><h2>{zh ? `${routeYear} 年` : String(routeYear)}</h2><p>{zh ? '这一年未颁发诺贝尔化学奖。' : 'The Nobel Prize in Chemistry was not awarded this year.'}</p><a className="nobel-read-link" href={`${official}/summary/`} target="_blank" rel="noreferrer">{zh ? '查看官方年度记录' : 'Read the official annual record'} ↗</a></article>
      : <article key={edition.year}>
        <div className={`nobel-laureates-grid${edition.image || edition.portraits?.length ? '' : ' nobel-laureates-grid--text'}`}>
          <div className="nobel-lead">
            <h2>{zh ? `${edition.year} 年化学奖得主` : `The ${edition.year} chemistry laureates`}</h2>
            <p className="nobel-award">{edition.names.map((name, index) => <span key={name}>{index > 0 ? (zh ? '、' : ', ') : ''}<a href={edition.people?.[index]?.url || edition.personUrls?.[index] || `${official}/summary/`} target="_blank" rel="noreferrer">{name}</a></span>)}</p>
            <div className="nobel-laureate-affiliations">{edition.people?.map(person => <p key={person.id}><a href={person.url} target="_blank" rel="noreferrer">{person.name}</a><small>{person.affiliations.join(' · ') || (zh ? '机构信息见个人官方档案' : 'See official personal record')}</small></p>)}</div>
            {edition.citation ? <p>{edition.citation[i]}</p> : <ul className="nobel-award-motivations">{[...new Set(edition.motivations)].map(motivation => <li key={motivation}>{motivation}</li>)}</ul>}
            <h3>{edition.theme?.[i] || reading?.title}</h3>
            {edition.intro && <p><PersonText text={edition.intro[i]} people={edition.people || []}/></p>}
            {reading?.learningGuide && <div className="nobel-learning-lead"><h3>{reading.learningGuide.title[i]}</h3><p>{reading.learningGuide.definition[i]}</p></div>}
          </div>
          {edition.image && <figure><img src={`${import.meta.env.BASE_URL}${edition.image}`} alt={edition.names.join(', ')} /><figcaption>Ill. <a href="https://niklaselmehed.com/" target="_blank" rel="noreferrer">Niklas Elmehed</a> © Nobel Prize Outreach</figcaption></figure>}
          {!edition.image && edition.portraits?.length && <div className="nobel-portraits" data-count={edition.portraits.length}>{edition.portraits.map(person => <figure key={person.id}><a href={person.page} target="_blank" rel="noreferrer"><img src={`${import.meta.env.BASE_URL}${person.image}`} alt={person.name} loading="lazy" /></a><figcaption><strong><a href={edition.people?.find(p=>p.id===person.id)?.url || person.page} target="_blank" rel="noreferrer">{person.name}</a></strong><small>{edition.people?.find(p=>p.id===person.id)?.affiliations.join(" · ")}</small><small>{person.credit}</small></figcaption></figure>)}</div>}
        </div>
        {reading && <div className="nobel-reading-body" lang="zh-CN">
          <section className="nobel-summary" aria-labelledby="nobel-summary-title">
            <span className="nobel-kicker">{zh ? '科普解读' : 'SCIENCE READING · CHINESE'}</span>
            <h2 id="nobel-summary-title">{zh ? '研究概述' : 'Research overview'}</h2><p><PersonText text={reading.summary} people={edition.people || []}/></p>
            {reading.learningGuide && <div className="nobel-learning-example"><h3>{zh ? '一个具体例子' : 'A concrete example'}</h3><p>{reading.learningGuide.example[i]}</p>{reading.learningGuide.sources?.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{zh ? source.label : 'Example source'} ↗</a>)}</div>}
            <p className="nobel-section-meta">{zh ? '依据当年诺奖官方资料编写的独立中文总结；方程式含明确标注的教学模型。' : 'Independent Chinese commentary based on official Nobel material; teaching models are identified explicitly.'} <a href={reading.officialSource.url} target="_blank" rel="noreferrer">{sourceLabels[reading.officialSource.kind]?.[i] || 'NobelPrize.org'} ↗</a></p>
          </section>
          {reading.sections.map(section => <section className="nobel-science-section" key={section.id} data-reading-section={section.id}>
            <h2>{section.id==='uses' ? (zh ? '应用与产业' : 'Applications and industry') : section.id==='development' ? (zh ? '研究进展' : 'Research progress') : section.title[i]}</h2>{section.body.split(/\n\n+/).map(paragraph => <p key={paragraph}><PersonText text={paragraph} people={edition.people || []}/></p>)}
            {section.id === 'uses' && reading.developments && <NobelResearchProgress data={reading.developments} section="companies" />}
            {section.id === 'development' && reading.developments && <NobelResearchProgress data={reading.developments} section="research" />}
            {section.equation && <Equation math={section.equation} note={section.equationNote} />}
            {section.supplementalEquations?.map(equation => <Equation key={equation.math} math={equation.math} note={equation.note} sourceUrl={equation.sourceUrl} />)}
            {section.relatedSource && <p className="nobel-section-meta">{zh ? '后续研究联系，参照已核对的官方资料；不是实时新闻或完整文献综述。' : 'A source-backed research connection, not a live news feed or exhaustive review.'} <a href={section.relatedSource} target="_blank" rel="noreferrer">{section.relatedYear} · NobelPrize.org ↗</a></p>}
          </section>)}
          <aside className="nobel-original" aria-labelledby="nobel-original-title">
            <h2 id="nobel-original-title">{zh ? '官网原文 · 继续阅读' : 'Official original · Further reading'}</h2>
            <p>{reading.officialSource.kind === 'ceremony-speech' ? (zh ? '本年度采用官方颁奖演说作为历史解读来源。' : 'The official presentation speech is the historical source for this edition.') : (zh ? '以上为独立总结与教学说明。完整官方原文由诺奖官网提供，点击下方入口阅读。' : 'The text above is independent commentary. Read the complete original on NobelPrize.org below.')}</p>
            <div className="nobel-original-links"><a className="nobel-read-link" href={reading.officialSource.url} target="_blank" rel="noreferrer">{sourceLabels[reading.officialSource.kind]?.[i] || 'Official original'} ↗</a><a href={`${official}/summary/`} target="_blank" rel="noreferrer">{zh ? '官方年度资料' : 'Official annual record'} ↗</a>{edition.year >= 2025 && <a href={`${official}/advanced-information/`} target="_blank" rel="noreferrer">{zh ? '科学背景' : 'Scientific background'} ↗</a>}</div>
            <p className="nobel-section-meta">EcoMOF-AI {zh ? '独立科学解读，非诺奖官方出版物。' : 'independent science commentary.'}</p>
          </aside>
        </div>}
      </article>}
  </main>
}
