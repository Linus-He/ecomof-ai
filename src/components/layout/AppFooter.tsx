// @ts-nocheck
import { useEffect, useRef, useState } from "react"
import { ArrowUpRight } from "@phosphor-icons/react"
import { LogoWordmark } from "../brand"

export function AppFooter({
  lang,
  navigate,
  onAcknowledgements,
  onContact,
  onDisclaimer,
  theme,
}) {
  const zh = lang === "zh"
  const footerRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const columns = [
    {
      title: zh ? "研究工作区" : "Research workspaces",
      links: [
        [zh ? "生态筛选" : "EcoScreen", "ecoscreen"],
        [zh ? "气体分离" : "GasSep", "gassep"],
        [zh ? "催化与有机酸" : "Catalysis & Organic Acid", "catalysis-organic-acid"],
        [zh ? "MOF 库" : "MOF Library", "library"],
      ],
      sections: [{
        title: zh ? "数据与证据" : "Data and evidence",
        links: [
          [zh ? "数据质量与溯源" : "Data quality & provenance", "data-quality-provenance"],
          [zh ? "数据合规承诺" : "Data compliance pledge", "dataCompliance"],
          [zh ? "验证证据" : "Validation evidence", "validation-evidence"],
        ],
      }],
    },
    {
      title: zh ? "方法与验证" : "Methods and validation",
      links: [
        [zh ? "方法论总览" : "Methodology overview", "methodology"],
        [zh ? "算法验证中心" : "Algorithm validation", "methodology-algorithm-validation"],
        [zh ? "GasSep 方法" : "GasSep methodology", "methodology-gassep"],
        [zh ? "有机酸方法" : "Organic Acid methodology", "methodology-organic-acid"],
        [zh ? "基准与参考" : "Benchmarks & references", "benchmark-references"],
      ],
      sections: [{
        title: zh ? "研究进展" : "Research progress",
        links: [
          [zh ? "项目演化" : "Project evolution", "projectEvolution"],
          [zh ? "科学里程碑" : "Scientific milestones", "project-evolution-scientific"],
          [zh ? "路线图" : "Roadmap", "project-evolution-roadmap"],
        ],
      }],
    },
    {
      title: zh ? "资源与来源" : "Resources and sources",
      links: [
        ["CoRE MOF 2024 CR", "library"],
        ["FAIR-MOFs", "library"],
        ["ISODB / NIST", "gassep"],
        [zh ? "生命周期与成本清单" : "Life-cycle & cost inventories", "ecoscreen"],
        [zh ? "反应与实验标签" : "Reaction & experimental labels", "catalysis-organic-acid"],
      ],
      sections: [{
        title: zh ? "使用与支持" : "Use and support",
        links: [
          [zh ? "联系我们" : "Contact", "contact"],
          [zh ? "致谢" : "Acknowledgements", "acknowledgements"],
          [zh ? "声明与适用边界" : "Disclaimer & boundaries", "disclaimer"],
        ],
      }],
    },
    {
      title: zh ? "项目" : "Project",
      links: [
        [zh ? "关于 EcoMOF-AI" : "About EcoMOF-AI", "overview"],
        [zh ? "研究原则" : "Research principles", "methodology"],
        [zh ? "字段级来源" : "Field-level provenance", "data-quality-provenance"],
        [zh ? "公开版本记录" : "Public release record", "projectEvolution"],
      ],
      sections: [{
        title: zh ? "条款与政策" : "Terms and policies",
        links: [
          [zh ? "非商业研究说明" : "Non-commercial research notice", "disclaimer"],
          [zh ? "数据许可与引用" : "Data licenses & citation", "dataCompliance"],
          [zh ? "方法限制" : "Method limitations", "methodology"],
        ],
      }],
    },
  ]

  const activate = target => {
    if (target === "contact") return onContact?.()
    if (target === "acknowledgements") return onAcknowledgements?.()
    if (target === "disclaimer") return onDisclaimer?.()
    navigate?.(target)
  }

  useEffect(() => {
    const footer = footerRef.current
    if (!footer) return undefined
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    if (reducedMotion || typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return
      setVisible(true)
      observer.disconnect()
    }, { rootMargin: "0px 0px 6% 0px", threshold: 0.04 })
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  return (
    <footer ref={footerRef} className="app-footer" data-visible={visible ? "true" : "false"} aria-label={zh ? "站点页脚" : "Site footer"}>
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <LogoWordmark markSize={34} radius={8} t={theme} text="EcoMOF-AI" compact />
          <p>{zh ? "透明、可追溯、面向验证的 MOF 研究工作台。" : "A transparent, traceable, validation-oriented MOF research workbench."}</p>
        </div>

        <nav className="app-footer-links" aria-label={zh ? "页脚导航" : "Footer navigation"}>
          {columns.map(column => (
            <div className="app-footer-column" key={column.title}>
              <section>
                <h2>{column.title}</h2>
                {column.links.map(([label, target]) => (
                  <button key={`${label}-${target}`} type="button" onClick={() => activate(target)}>{label}</button>
                ))}
              </section>
              {column.sections.map(section => (
                <section key={section.title}>
                  <h2>{section.title}</h2>
                  {section.links.map(([label, target]) => (
                    <button key={`${label}-${target}`} type="button" onClick={() => activate(target)}>{label}</button>
                  ))}
                </section>
              ))}
            </div>
          ))}
        </nav>

        <div className="app-footer-meta">
          <span>{zh ? "© 2026 EcoMOF-AI · Linus-He 维护" : "© 2026 EcoMOF-AI · Maintained by Linus-He"}</span>
          <a href="https://github.com/Linus-He/ecomof-ai" target="_blank" rel="noreferrer">
            <span>GitHub</span>
            <ArrowUpRight aria-hidden="true" size={15} weight="bold" />
          </a>
          <p>{zh ? "用于早期筛选和研究假设生成，不代表最终实验结论。" : "For early-stage screening and research hypothesis generation; not a final experimental conclusion."}</p>
        </div>
      </div>
    </footer>
  )
}
