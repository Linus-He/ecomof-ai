import { useState } from 'react'
import { ArrowSquareOut, MagnifyingGlassPlus, MagnifyingGlassMinus } from '@phosphor-icons/react'
import manifest from '../../data/scientificStructures.json'
import './scientificStructures.css'

type Figure = { id:string; image:string; title:string[]; caption:string[]; kind:string; sources:{label:string;url:string}[]; formula?:string; smiles?:string }
const figures=manifest.figures as Record<string,Figure>
const concepts=manifest.concepts as Record<string,string[]>
const contexts=manifest.contexts as Record<string,string[]>

export function ScientificStructures({ concept, context, zh }: {concept?:string;context?:string;zh:boolean}) {
 const [expanded,setExpanded]=useState(false)
 const ids=(concept?concepts[concept]:context?contexts[context]:[])||[]
 if(!ids.length)return null
 return <section className={`scientific-structures${expanded?' scientific-structures--expanded':''}`} aria-label={zh?'结构图与连接示意':'Molecular structures and connectivity'}>
  <div className="scientific-structure-heading"><h4>{zh?'看结构，理解差异':'See the structure'}</h4><button onClick={()=>setExpanded(v=>!v)} aria-pressed={expanded}>{expanded?<MagnifyingGlassMinus size={15}/>:<MagnifyingGlassPlus size={15}/>} {expanded?(zh?'收起放大':'Reduce'):(zh?'放大查看':'Enlarge')}</button></div>
  <div className="scientific-structure-grid">{ids.map(key=>{
   const figure=figures[key]||figures[`${key}-${zh?'zh':'en'}`]
   if(!figure)return null
   return <figure key={figure.id} data-figure-kind={figure.kind}>
    <h5>{figure.title[zh?0:1]}</h5>
    <div className="scientific-structure-image"><img src={`${import.meta.env.BASE_URL}${figure.image}`} alt={figure.title[zh?0:1]} loading="lazy"/></div>
    {figure.formula&&<p className="scientific-formula">{figure.formula.split(/(\d+)/).map((part,i)=>/^\d+$/.test(part)?<sub key={i}>{part}</sub>:part)}</p>}
    <figcaption>{figure.caption[zh?0:1]}</figcaption>
    {figure.sources.length>0&&<div className="scientific-structure-sources">{figure.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} <ArrowSquareOut size={11}/></a>)}</div>}
   </figure>
  })}</div>
  {ids.includes('carvone-r')&&<p className="scientific-stereo-note">{zh?'两幅图具有相同的原子连接，仅手性中心的空间构型相反。实楔键朝向观察者，虚楔键背向观察者；淡蓝标记处为手性中心。R／S 标签是构型，不直接表示左旋或右旋。':'The two structures share connectivity and differ at the stereocentre. Solid wedges point toward the viewer; hashed wedges point away. Pale blue marks the stereocentre. R/S describes configuration, not optical rotation.'}</p>}
 </section>
}
