import type {ReactNode} from 'react'
import {ArrowSquareOut} from '@phosphor-icons/react'
export type Publisher={id:string;name:string;url:string;logo?:string;assetNote?:string}
export type SourceReview={checkedAt:string;status:string;dateKind:string[];dateValue:string;source:string;basis:string[];contentStatus?:string}
export type ReviewedSource={url:string;publisherId?:string;sourceReview?:SourceReview;documentUrl?:string;newsSources?:{publisherId:string;url:string;title:string[];date:string;dateNote:string[]}[]}
export function PublisherCitation({publisher,url,label}:{publisher:Publisher;url:string;label:string}){
 return <a className="science-publisher-link" href={url} target="_blank" rel="noreferrer">{publisher.logo&&<span className="science-publisher-icon"><img src={`${import.meta.env.BASE_URL}${publisher.logo}`} alt={`${publisher.name} logo`}/></span>}<span><small>{label}</small>{publisher.name}</span><ArrowSquareOut size={12}/></a>
}
export function ScienceSourceCitation({source,publishers,zh,onInspect,referenceNumber,extra}:{source:ReviewedSource;publishers:Publisher[];zh:boolean;onInspect?:()=>void;referenceNumber?:number;extra?:ReactNode}){
 const publisher=publishers.find(p=>p.id===source.publisherId),review=source.sourceReview
 return <footer className="science-source-citation" aria-label={zh?'来源与日期依据':'Source and date evidence'}>
  {publisher&&<PublisherCitation publisher={publisher} url={source.url} label={zh?'来源':'Source'}/>}
  {source.newsSources?.map(news=>{const p=publishers.find(p=>p.id===news.publisherId);return p&&<span key={news.url} title={`${news.date} · ${news.dateNote[zh?0:1]}`}><PublisherCitation publisher={p} url={news.url} label={zh?'新闻':'News'}/></span>})}
  {review&&<><span className="science-source-date">{review.dateKind[zh?0:1]} · {review.dateValue}</span>{review.contentStatus==='limited'&&<span className="science-source-limited">{zh?'访问受限':'Access limited'}</span>}<details className="science-source-details"><summary>{zh?'日期说明':'Date details'}</summary><div><p>{review.basis[zh?0:1]}</p><a href={review.source} target="_blank" rel="noreferrer">{zh?'日期依据原文':'Original date evidence'} <ArrowSquareOut size={11}/></a>{source.documentUrl&&<a href={source.documentUrl} target="_blank" rel="noreferrer">{zh?'原始报告':'Original document'} <ArrowSquareOut size={11}/></a>}</div></details></>}
  {onInspect&&<button className="science-source-reference" onClick={onInspect}>{zh?'查看完整来源条目':'Inspect reference'} [{referenceNumber}] <ArrowSquareOut size={11}/></button>}
  {extra}
 </footer>
}
