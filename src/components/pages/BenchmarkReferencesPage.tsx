// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, WarningCircle } from "@phosphor-icons/react"
import { useLang } from "../../contexts"
import { getBenchmarkReferences } from "../../services/dataService"
import "./PriorityResearchPages.css"

const text = (lang, zh, en) => lang === "zh" ? zh : en

function statusLabel(registry, status, lang) {
  const row = registry?.statusVocabulary?.[status]
  return row?.[lang === "zh" ? "zh" : "en"] || status
}

function referenceHref(reference) {
  return reference.url || (reference.doi ? `https://doi.org/${reference.doi}` : "")
}

export function BenchmarkReferencesPage() {
  const { lang } = useLang()
  const [status, setStatus] = useState("loading")
  const [registry, setRegistry] = useState(null)

  useEffect(() => {
    let active = true
    getBenchmarkReferences({ throwOnError: true }).then(data => {
      if (!active) return
      setRegistry(data)
      setStatus("loaded")
    }).catch(() => active && setStatus("error"))
    return () => { active = false }
  }, [])

  const modules = useMemo(
    () => [...(registry?.modules || [])].sort((a, b) => Number(a.order) - Number(b.order)),
    [registry],
  )

  return (
    <div className="priority-research-page benchmark-reference-page" data-testid="benchmark-references-page">
      <header className="priority-page-intro benchmark-reference-hero">
        <span>{text(lang, "方法与验证 / 研究基准", "Methods & Validation / Research Benchmarks")}</span>
        <h1>{text(lang, "基准参考", "Benchmark References")}</h1>
        <p>{text(
          lang,
          "这里集中说明生态、结构与数据、气体分离、催化和算法验证实际采用的依据。每一项都标明采用方式、用途与不能推出的结论。",
          "This page records the references actually used across ecology, structure and data, gas separation, catalysis, and algorithm validation. Each entry states how it is used and what it cannot establish.",
        )}</p>
      </header>

      {status === "loading" ? <div className="priority-page-status" role="status">{text(lang, "正在读取基准注册表…", "Loading the benchmark registry...")}</div> : null}
      {status === "error" ? <div className="priority-page-status priority-page-status--error" role="alert"><WarningCircle aria-hidden size={19} />{text(lang, "基准注册表无法读取。", "The benchmark registry could not be loaded.")}</div> : null}

      {status === "loaded" ? (
        <>
          <section className="benchmark-boundary" aria-labelledby="benchmark-boundary-title">
            <h2 id="benchmark-boundary-title">{text(lang, "先说明边界", "Boundary first")}</h2>
            <p>{text(lang, registry.boundaryZh, registry.boundaryEn)}</p>
            <div className="benchmark-status-legend" aria-label={text(lang, "采用状态", "Adoption status")}>
              {Object.entries(registry.statusVocabulary || {}).map(([key, value]) => (
                <span key={key} data-status={key}>{text(lang, value.zh, value.en)}</span>
              ))}
            </div>
          </section>

          <nav className="benchmark-module-index" aria-label={text(lang, "基准模块索引", "Benchmark module index")}>
            {modules.map((module, index) => (
              <a href={`#benchmark-${module.id}`} key={module.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {text(lang, module.labelZh, module.labelEn)}
              </a>
            ))}
          </nav>

          <div className="benchmark-module-list">
            {modules.map((module, moduleIndex) => (
              <section className="benchmark-module" id={`benchmark-${module.id}`} key={module.id}>
                <header>
                  <span>{String(moduleIndex + 1).padStart(2, "0")}</span>
                  <div>
                    <h2>{text(lang, module.labelZh, module.labelEn)}</h2>
                    <p>{text(lang, module.summaryZh, module.summaryEn)}</p>
                  </div>
                </header>
                <div className="benchmark-module-boundary">
                  <strong>{text(lang, "不能据此推出", "Does not establish")}</strong>
                  <p>{text(lang, module.boundaryZh, module.boundaryEn)}</p>
                </div>
                <div className="benchmark-reference-list">
                  {(module.references || []).map(reference => {
                    const href = referenceHref(reference)
                    return (
                      <article className="benchmark-reference-row" key={reference.id}>
                        <div className="benchmark-reference-meta">
                          <span data-status={reference.status}>{statusLabel(registry, reference.status, lang)}</span>
                          <small>{reference.identifier}</small>
                        </div>
                        <div className="benchmark-reference-content">
                          <h3>{reference.title}</h3>
                          <p>{text(lang, reference.projectUseZh, reference.projectUseEn)}</p>
                          {reference.sources?.length ? (
                            <details>
                              <summary>{text(lang, `查看 ${reference.sources.length} 条 DOI`, `View ${reference.sources.length} DOI records`)}</summary>
                              <ol>
                                {reference.sources.map(source => (
                                  <li key={source.doi}>
                                    <a href={`https://doi.org/${source.doi}`} rel="noreferrer" target="_blank">{source.doi}<ArrowUpRight aria-hidden size={13} /></a>
                                    <span>{source.title}</span>
                                  </li>
                                ))}
                              </ol>
                            </details>
                          ) : null}
                        </div>
                        <div className="benchmark-reference-source">
                          {href ? <a href={href} rel="noreferrer" target="_blank">{text(lang, reference.sourceLabelZh, reference.sourceLabelEn)}<ArrowUpRight aria-hidden size={14} /></a> : <span>{text(lang, reference.sourceLabelZh, reference.sourceLabelEn)}</span>}
                          <small>{text(lang, "核对：", "Checked: ")}{reference.verifiedAt}</small>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

export default BenchmarkReferencesPage
