// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, ArrowUp } from "@phosphor-icons/react"
import { useLang, useT } from "../../shared"
import { MaterialSearchResults } from "./MaterialSearchResults"
import { interfaceText } from "../../utils/interfaceLocale"
import {
  NAVIGATION_ITEMS,
  getNavigationLabel,
} from "../../config/navigationRegistry"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const SEARCH_PROMPTS = [
  "探索 MOF 材料与研究资料",
  "Explore materials, methods, and evidence",
  "Explore materiais e métodos de pesquisa",
  "Découvrez les matériaux et leurs propriétés",
  "材料と研究データを探す",
  "재료와 연구 데이터를 검색하세요",
  "Explora materiales y datos de investigación",
]

const SEARCH_DOCUMENTS = [
  {
    id: "home-data-foundation",
    kind: "text",
    titleZh: "数据基础",
    titleEn: "Data Foundation",
    bodyZh: "当前参与检索、计算或验证的数据层，包括 CoRE MOF 2024 CR、FAIR-MOFs、气体吸附记录、实验标签和 Benchmark。",
    bodyEn: "The active data layers used for search, calculation, or validation: CoRE MOF 2024 CR, FAIR-MOFs, gas adsorption records, experimental labels, and benchmarks.",
    hash: "overview",
    targetId: "home-data-foundation",
    keywords: "数据 数据库 来源 记录 CoRE CCDC FAIR MOFs ISODB NIST benchmark 实验标签 data provenance",
  },
  {
    id: "home-gassep-evidence",
    kind: "text",
    titleZh: "气体分离证据链",
    titleEn: "Gas-separation evidence chain",
    bodyZh: "从气体组成、温度、压力窗口到 IAST 资格和工作容量，只有满足条件与数据边界时才给出热力学解释。",
    bodyEn: "Gas composition, temperature, pressure window, IAST eligibility, and working capacity stay together; thermodynamic interpretation is withheld outside the data boundary.",
    hash: "overview",
    targetId: "home-research-continuum",
    keywords: "气体分离 GasSep IAST 等温线 选择性 工作容量 温度 压力 adsorption isotherm",
  },
  {
    id: "home-validation-chain",
    kind: "text",
    titleZh: "白盒筛选与验证链",
    titleEn: "White-box screening and validation chain",
    bodyZh: "评分、证据修正、敏感性、实验标签与 Benchmark 组成可检查的验证路径，而不是孤立的状态卡片。",
    bodyEn: "Scoring, evidence adjustment, sensitivity, experimental labels, and benchmarks form one inspectable validation chain instead of isolated status cards.",
    hash: "overview",
    targetId: "home-validation-chain",
    keywords: "验证 白盒 评分 证据 敏感性 实验标签 benchmark validation evidence sensitivity",
  },
  {
    id: "home-limits",
    kind: "text",
    titleZh: "结果边界与使用限制",
    titleEn: "Result boundaries and limitations",
    bodyZh: "平台输出用于早期筛选和研究假设生成，不等同于最终实验结论；数据缺口、外部验证和条件可比性会保留在结果中。",
    bodyEn: "Outputs support early-stage screening and research hypothesis generation, not final experimental conclusions; data gaps, external validation, and condition comparability remain visible.",
    hash: "overview",
    targetId: "home-research-gateway",
    keywords: "限制 边界 风险 结论 可比性 外部验证 not final recommendation",
  },
]

const FEATURE_DOCUMENTS = [
  ["search-material", "MOF 材料检索", "Search MOF materials", "按名称、Refcode、金属、拓扑和物化性质检索结构记录。", "Search structure records by name, Refcode, metal, topology, and physicochemical properties.", "library", "MOF 材料 结构 Refcode 金属 拓扑 surface area pore library"],
  ["search-gas", "气体分离工作台", "Gas separation workbench", "查看气体吸附、IAST 选择性、工作容量和条件边界。", "Inspect adsorption, IAST selectivity, working capacity, and condition boundaries.", "gassep", "气体分离 IAST 吸附 等温线 工作容量 selectivity"],
  ["search-organic", "有机酸研究工作区", "Organic Acid research workspace", "查看主客体匹配、路径图、候选优先级和验证路线。", "Inspect host-guest matching, pathway graphs, candidate priority, and validation routes.", "catalysis-organic-acid", "有机酸 催化 主客体 路径 HGCPS candidate"],
  ["search-ecoscreen", "生态筛选", "EcoScreen", "比较环境影响、成本和任务性能，并保留排序解释。", "Compare environmental impact, cost, and task performance with ranking explanations.", "ecoscreen", "生态筛选 LCA LCC 环境 成本 sustainability"],
  ["search-methods", "方法论与证据边界", "Methods and evidence boundaries", "查看评分、数据来源、证据等级、验证状态和引用边界。", "Inspect scoring, sources, evidence grades, validation state, and citation boundaries.", "methodology", "方法论 证据 来源 评分 引用 methodology evidence"],
  ["search-validation", "验证中心", "Validation Center", "查看 Benchmark、实验标签、稳健性和数据质量验证。", "Inspect benchmarks, experimental labels, robustness, and data-quality validation.", "algorithm-validation", "验证 benchmark 实验标签 稳健性 data quality"],
]

function normalize(value) {
  return String(value || "").toLocaleLowerCase().replace(/[\s\-_/.·]+/g, "")
}

function scoreDocument(document, query) {
  const needle = normalize(query)
  if (!needle) return 0
  const title = normalize(`${document.titleZh} ${document.titleEn}`)
  const keywords = normalize(document.keywords)
  const body = normalize(`${document.bodyZh || ""} ${document.bodyEn || ""}`)
  if (title === needle) return 100
  if (title.includes(needle)) return 80
  if (keywords.includes(needle)) return 58
  if (body.includes(needle)) return 38
  return 0
}

function routeDocuments(lang) {
  return NAVIGATION_ITEMS
    .filter(item => item?.hash && item?.label && item?.meta)
    .map(item => ({
      id: `route-${item.id}`,
      kind: "section",
      titleZh: getNavigationLabel(item, "zh"),
      titleEn: getNavigationLabel(item, "en"),
      bodyZh: item.meta?.description || "",
      bodyEn: item.meta?.description || "",
      hash: item.hash,
      targetId: item.scrollTarget === true ? item.hash : null,
      keywords: `${item.id} ${item.aliases?.join(" ") || ""} ${["ja", "ko", "es"].map(locale => interfaceText(locale, getNavigationLabel(item, "en"))).join(" ")}`,
      routeLabel: text(lang, "版块", "Section"),
    }))
}

export function UnifiedResearchSearch({ onNavigate }) {
  const t = useT()
  const { lang, locale } = useLang()
  const text = (_lang, zh, en) => interfaceText(locale, en, zh)
  const inputRef = useRef(null)
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const [promptIndex, setPromptIndex] = useState(0)
  const [promptLength, setPromptLength] = useState(0)
  const [erasing, setErasing] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReducedMotion(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    if (focused || query || reducedMotion) return
    const prompt = SEARCH_PROMPTS[promptIndex]
    const complete = promptLength === prompt.length
    const timer = window.setTimeout(() => {
      if (!erasing && complete) setErasing(true)
      else if (erasing && promptLength === 0) {
        setErasing(false)
        setPromptIndex(index => (index + 1) % SEARCH_PROMPTS.length)
      } else setPromptLength(length => length + (erasing ? -1 : 1))
    }, !erasing && complete ? 2400 : erasing ? 28 : 70)
    return () => window.clearTimeout(timer)
  }, [focused, query, reducedMotion, promptIndex, promptLength, erasing])
  const [activeDocument, setActiveDocument] = useState(null)
  const documents = useMemo(() => [
    ...FEATURE_DOCUMENTS.map(([id, titleZh, titleEn, bodyZh, bodyEn, hash, keywords]) => ({ id, kind: "feature", titleZh, titleEn, bodyZh, bodyEn, hash, keywords })),
    ...SEARCH_DOCUMENTS,
    ...routeDocuments(lang),
  ], [lang])
  const results = useMemo(() => {
    const value = query.trim()
    if (!value) return []
    return documents
      .map(document => ({ ...document, score: scoreDocument(document, value) }))
      .filter(document => document.score > 0)
      .sort((a, b) => b.score - a.score || a.titleZh.length - b.titleZh.length)
      .filter((document, index, list) => list.findIndex(item => item.titleZh === document.titleZh && item.hash === document.hash) === index)
      .slice(0, 8)
  }, [documents, query])

  useEffect(() => {
    const onKeyDown = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        inputRef.current?.focus()
      }
      if (event.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current.blur()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const navigate = document => {
    setActiveDocument(document)
    if (document.kind !== "text") {
      onNavigate?.(document.hash)
      return
    }
    window.requestAnimationFrame(() => {
      document.targetId && window.document.getElementById(document.targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  const reset = () => {
    setQuery("")
    setActiveDocument(null)
    inputRef.current?.focus()
  }

  const submit = () => {
    if (results[0]) {
      navigate(results[0])
      return
    }
    if (query) document.querySelector(".material-search-results")?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    inputRef.current?.focus()
  }

  return (
    <section className="unified-research-search" data-testid="unified-research-search" aria-labelledby="unified-research-search-title">
      <div className="unified-research-search-heading">
        <div>
          <span className="unified-research-search-kicker">{text(lang, "统一研究检索", "UNIFIED RESEARCH SEARCH")}</span>
          <h2 id="unified-research-search-title">{text(lang, "有什么可以帮忙的？", "What can I help with?")}</h2>
          <p>{text(lang, "输入一个关键词，直接发现对应的研究入口；文字资料会在这里展开，并保留进入原版块的路径。", "Type a keyword to discover the right research entry. Text evidence opens here while the original section remains one click away.")}</p>
        </div>
        <kbd>⌘ K</kbd>
      </div>

      <div className={`unified-research-search-input ${focused ? "is-focused" : ""}`}>
        <input
          ref={inputRef}
          aria-label={text(lang, "搜索所有资料、功能与版块", "Search all materials, functions, and sections")}
          placeholder={focused || reducedMotion ? text(lang, "搜索资料、功能与研究版块", "Search materials, functions, and research spaces") : SEARCH_PROMPTS[promptIndex].slice(0, promptLength)}
          value={query}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          onChange={event => { setQuery(event.target.value); setActiveDocument(null) }}
          onKeyDown={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing) submit() }}
        />
        <button type="button" aria-label={text(lang, "提交搜索", "Submit search")} onMouseDown={event => event.preventDefault()} onClick={submit}><ArrowUp size={20} weight="bold" /></button>
      </div>

      {query ? (
        <>
        <MaterialSearchResults query={query} lang={lang} />
        <div className="unified-research-search-results" aria-label={text(lang, "版块与文字结果", "Section and text results")}>
          {results.length ? results.map(document => {
            const title = text(lang, document.titleZh, document.titleEn)
            const body = text(lang, document.bodyZh, document.bodyEn)
            const isText = document.kind === "text"
            return (
              <article key={document.id} className={`unified-research-result unified-research-result--${document.kind}`}>
                <div className="unified-research-result-copy">
                  <span>{isText ? text(lang, "文字资料", "TEXT") : document.kind === "feature" ? text(lang, "功能入口", "FUNCTION") : text(lang, "研究版块", "SECTION")}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
                <button type="button" onClick={() => navigate(document)}>
                  {isText ? text(lang, "展开资料", "Read here") : text(lang, "进入版块", "Open section")} <ArrowRight aria-hidden="true" size={15} />
                </button>
              </article>
            )
          }) : (
            <div className="unified-research-search-empty">{text(lang, "没有匹配的版块或文字条目；材料匹配结果见上方。", "No section or text matches; material matches appear above.")}</div>
          )}
        </div>
        {activeDocument?.kind === "text" ? (
          <div className="unified-research-reading" aria-live="polite">
            <div>
              <span>{text(lang, "当前阅读", "READING NOW")}</span>
              <h3>{text(lang, activeDocument.titleZh, activeDocument.titleEn)}</h3>
              <p>{text(lang, activeDocument.bodyZh, activeDocument.bodyEn)}</p>
            </div>
            <button type="button" onClick={() => navigate({ ...activeDocument, kind: "section" })}>
              {text(lang, "跳转到原版块", "Open original section")} <ArrowRight aria-hidden="true" size={15} />
            </button>
          </div>
        ) : null}
        </>
      ) : (
        <div className="unified-research-search-empty unified-research-search-empty--idle">
          <span>{text(lang, "热门入口", "Popular entries")}</span>
          <div>{[["MOF库", "MOF Library"], ["气体分离", "Gas separation"], ["数据来源", "Data sources"], ["实验标签", "Experimental labels"]].map(([label, en]) => <button key={label} type="button" onClick={() => setQuery(label)}>{text(lang, label, en)}</button>)}</div>
        </div>
      )}
    </section>
  )
}
