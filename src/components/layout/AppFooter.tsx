// @ts-nocheck
import { useEffect, useRef, useState } from "react"
import { SiGithub, SiGmail, SiZhihu } from "react-icons/si"
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
      title: zh ? "研究" : "Research",
      links: [
        [zh ? "生态筛选" : "EcoScreen", "ecoscreen"],
        [zh ? "气体分离" : "GasSep", "gassep"],
        [zh ? "催化" : "Catalysis", "catalysis"],
        [zh ? "有机酸研究工作区" : "Organic Acid Research", "catalysis-organic-acid"],
      ],
      sections: [],
    },
    {
      title: zh ? "数据与核验" : "Data & Verification",
      links: [
        [zh ? "MOF 库" : "MOF Library", "library"],
        [zh ? "催化文献核验中心" : "Catalysis Literature Verification", "catalysis-literature-verification"],
        [zh ? "数据质量与来源中心" : "Data Quality & Provenance", "data-quality-provenance"],
        [zh ? "MOF 记录详情" : "MOF Record Detail", "mof-record"],
        [zh ? "DOI 文献详情" : "DOI Literature Detail", "literature-record"],
      ],
      sections: [],
    },
    {
      title: zh ? "方法与验证" : "Methods & Validation",
      links: [
        [zh ? "方法论总览" : "Methodology Overview", "methodology"],
        [zh ? "算法验证中心" : "Algorithm Validation", "methodology-algorithm-validation"],
        [zh ? "基准参考" : "Benchmark References", "benchmark-references"],
        [zh ? "GasSep 方法" : "GasSep Method", "methodology-gassep"],
        [zh ? "有机酸方法" : "Organic Acid Method", "methodology-organic-acid"],
        [zh ? "验证与证据" : "Validation & Evidence", "validation-evidence"],
      ],
      sections: [],
    },
    {
      title: zh ? "关于" : "About",
      links: [
        [zh ? "创建者说明" : "Creator Statement", "creator-statement"],
        [zh ? "研究宪章" : "Research Charter", "research-charter"],
        [zh ? "项目演化" : "Project Evolution", "project-evolution"],
        [zh ? "更新日志" : "Changelog", "release-notes"],
        [zh ? "条款与政策" : "Terms & Policies", "database-compliance"],
      ],
      sections: [{
        title: zh ? "联系与说明" : "Contact & Notices",
        links: [
          [zh ? "联系我们" : "Contact", "contact"],
          [zh ? "致谢" : "Acknowledgements", "acknowledgements"],
          [zh ? "声明与使用边界" : "Disclaimer & Boundaries", "disclaimer"],
        ],
      }],
    },
  ]

  const activate = target => {
    if (target === "contact") {
      if (onContact) return onContact()
      return navigate?.(target)
    }
    if (target === "acknowledgements") {
      if (onAcknowledgements) return onAcknowledgements()
      return navigate?.(target)
    }
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
          <p>{zh ? "让 MOF 研究判断回到数据、条件、方法与来源。" : "Grounding MOF research decisions in data, conditions, methods, and sources."}</p>
          <nav className="app-footer-social" aria-label={zh ? "联系我们" : "Contact us"}>
            <h2>{zh ? "联系我们" : "Contact us"}</h2>
            <div>
              <a
                aria-label={zh ? "在 GitHub 查看 EcoMOF-AI 仓库" : "View the EcoMOF-AI repository on GitHub"}
                href="https://github.com/Linus-He/ecomof-ai"
                rel="noreferrer"
                target="_blank"
                title="GitHub"
              >
                <SiGithub aria-hidden="true" />
              </a>
              <a
                aria-label={zh ? "发送邮件至 ecomofai@outlook.com" : "Email ecomofai@outlook.com"}
                href="mailto:ecomofai@outlook.com"
                title="ecomofai@outlook.com"
              >
                <SiGmail aria-hidden="true" />
              </a>
              <a
                aria-label={zh ? "在知乎关注小落生" : "Follow Xiao Luo Sheng on Zhihu"}
                href="https://www.zhihu.com/people/xiao-luo-sheng-25"
                rel="noreferrer"
                target="_blank"
                title={zh ? "知乎" : "Zhihu"}
              >
                <SiZhihu aria-hidden="true" />
              </a>
            </div>
          </nav>
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
          <span>{zh ? "© EcoMOF-AI · Linus-He 维护" : "© EcoMOF-AI · Maintained by Linus-He"}</span>
          <p>{zh ? "用于早期筛选和研究假设生成，不代表最终实验结论。" : "For early-stage screening and research hypothesis generation; not a final experimental conclusion."}</p>
        </div>
      </div>
    </footer>
  )
}
