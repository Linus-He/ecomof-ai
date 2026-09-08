import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Check, GlobeHemisphereWest, MagnifyingGlass, X } from "@phosphor-icons/react"
import { useLang } from "../../contexts"
import { interfaceText } from "../../utils/interfaceLocale"

const languages = [
  { id:"zh-CN", native:"中文", region:"中国大陆", english:"Chinese · China Mainland" },
  { id:"zh-TW", native:"中文", region:"台灣（中國）", english:"Chinese · Taiwan (China)" },
  { id:"zh-HK", native:"中文", region:"香港（中國）", english:"Chinese · Hong Kong (China)" },
  { id:"en", native:"English", region:"", english:"English" },
  { id:"ja", native:"日本語", region:"", english:"Japanese" },
  { id:"ko", native:"한국어", region:"", english:"Korean" },
  { id:"es", native:"Español", region:"", english:"Spanish" },
]

export function FooterLanguagePicker() {
  const { locale = "en", setLang, lang } = useLang()
  const l = (en: string, zh: string) => {
    // This dialog is portaled outside the shell's regional conversion observer.
    const traditional: Record<string, string> = { "Choose language":"選擇語言", "Choose a language":"選擇語言", "Close":"關閉", "Search":"搜尋", "Search languages":"搜尋語言", "No matching available language":"沒有符合的可用語言" }
    return (locale === "zh-TW" || locale === "zh-HK") ? traditional[en] || zh : interfaceText(locale, en, zh)
  }
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const selected = languages.find(item => item.id === locale) || languages[3]
  useEffect(() => {
    if (!open) return
    dialog.current?.showModal()
    dialog.current?.querySelector<HTMLInputElement>("input")?.focus()
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = previous; trigger.current?.focus() }
  }, [open])
  const close = () => { dialog.current?.close(); setOpen(false); setQuery("") }
  return <>
    <button className="footer-language-trigger" ref={trigger} onClick={() => setOpen(true)} aria-haspopup="dialog"><GlobeHemisphereWest size={18} /><span>{selected.native} <span>{selected.region}</span></span></button>
    {open && createPortal(<dialog className="footer-language-dialog" ref={dialog} aria-label={l("Choose language", "选择语言")} onCancel={close} onClick={event => { if (event.target === event.currentTarget) { const r=event.currentTarget.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) close() } }}>
      <div className="footer-language-panel">
        <header><span>{l("Choose a language", "输入语言")}</span><button aria-label={l("Close", "关闭")} onClick={close}><X size={20} /></button></header>
        <div className="footer-language-options">
          {languages.filter(item => `${item.native} ${item.region} ${item.english}`.toLowerCase().includes(query.toLowerCase())).map(item => <button key={item.id} aria-pressed={item.id === locale} onClick={() => { setLang(item.id); close() }}><span><span>{item.native} <span>{item.region}</span></span><small>{item.english}</small></span>{item.id === locale && <span className="language-check"><Check size={20} /></span>}</button>)}
          {!languages.some(item => `${item.native} ${item.region} ${item.english}`.toLowerCase().includes(query.toLowerCase())) && <p>{l("No matching available language", "没有匹配的可用语言")}</p>}
        </div>
      </div>
      <label className="footer-language-search"><MagnifyingGlass size={20} /><input autoFocus aria-label={l("Search languages", "搜索语言")} placeholder={l("Search", "搜索")} value={query} onChange={e => setQuery(e.target.value)} /></label>
    </dialog>, document.body)}
  </>
}
