// @ts-nocheck
import { useLang } from "../../contexts"
import { interfaceText } from "../../utils/interfaceLocale"
import { useEffect, useRef, useState } from "react"
import { SiGithub, SiGmail, SiZhihu } from "react-icons/si"
import { FooterLanguagePicker } from "./FooterLanguagePicker"

export function AppFooter({
  lang,
  navigate,
  onAcknowledgements,
  onContact,
  onDisclaimer,
  theme,
}) {
  const { locale } = useLang()
  const l = (en, zh = en) => interfaceText(lang === "zh" ? "zh-CN" : locale, en, zh)
  const zh = lang === "zh"
  const footerRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const columns = [
    {
      title: l("Research", "研究"),
      links: [
        [l("EcoScreen", "生态筛选"), "ecoscreen"],
        [l("GasSep", "气体分离"), "gassep"],
        [l("Catalysis", "催化"), "catalysis"],
        [l("Organic Acid Research", "有机酸研究工作区"), "catalysis-organic-acid"],
      ],
      sections: [],
    },
    {
      title: l("Data & Verification", "数据与核验"),
      links: [
        [l("MOF Library", "MOF 库"), "library"],
        [l("Catalysis Literature Verification", "催化文献核验中心"), "catalysis-literature-verification"],
        [l("Data Quality & Provenance", "数据质量与来源中心"), "data-quality-provenance"],
        [l("MOF Record Detail", "MOF 记录详情"), "mof-record"],
        [l("DOI Literature Detail", "DOI 文献详情"), "literature-record"],
      ],
      sections: [],
    },
    {
      title: l("Methods & Validation", "方法与验证"),
      links: [
        [l("Methodology Overview", "方法论总览"), "methodology"],
        [l("Algorithm Validation", "算法验证中心"), "methodology-algorithm-validation"],
        [l("Benchmark References", "基准参考"), "benchmark-references"],
        [l("GasSep Method", "GasSep 方法"), "methodology-gassep"],
        [l("Organic Acid Method", "有机酸方法"), "methodology-organic-acid"],
        [l("Validation & Evidence", "验证与证据"), "validation-evidence"],
      ],
      sections: [],
    },
    {
      title: l("About", "关于"),
      links: [
        [l("Creator Statement", "创建者说明"), "creator-statement"],
        [l("Research Charter", "研究宪章"), "research-charter"],
        [l("Scientific Milestones", "科学里程碑"), "project-evolution-milestones"],
        [l("Research Roadmap", "科研路线图"), "project-evolution-roadmap"],
        [l("Changelog", "更新日志"), "release-notes"],
        [l("Terms & Policies", "条款与政策"), "database-compliance"],
      ],
      sections: [],
    },
    {
        title: l("Contact & Notices", "联系与说明"),
        links: [
          [l("Contact", "联系我们"), "contact"],
          [l("Acknowledgements", "致谢"), "acknowledgements"],
          [l("Disclaimer & Boundaries", "声明与使用边界"), "disclaimer"],
        ],
      sections: [],
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
    <footer ref={footerRef} className="app-footer" data-visible={visible ? "true" : "false"} aria-label={l("Site footer", "站点页脚")}>
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <nav className="app-footer-social" aria-label={l("Contact us", "联系我们")}>
            <div>
              <a
                aria-label={l("View the EcoMOF-AI repository on GitHub", "在 GitHub 查看 EcoMOF-AI 仓库")}
                href="https://github.com/Linus-He/ecomof-ai"
                rel="noreferrer"
                target="_blank"
                title="GitHub"
              >
                <SiGithub aria-hidden="true" />
              </a>
              <a
                aria-label={l("Email ecomofai@outlook.com", "发送邮件至 ecomofai@outlook.com")}
                href="mailto:ecomofai@outlook.com"
                title="ecomofai@outlook.com"
              >
                <SiGmail aria-hidden="true" />
              </a>
              <a
                aria-label={l("Follow Xiao Luo Sheng on Zhihu", "在知乎关注小落生")}
                href="https://www.zhihu.com/people/xiao-luo-sheng-25"
                rel="noreferrer"
                target="_blank"
                title={l("Zhihu", "知乎")}
              >
                <SiZhihu aria-hidden="true" />
              </a>
            </div>
          </nav>
        </div>

        <nav className="app-footer-links" aria-label={l("Footer navigation", "页脚导航")}>
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
          <span>{l("© EcoMOF-AI · Maintained by Linus-He", "© EcoMOF-AI · Linus-He 维护")}</span>
          <FooterLanguagePicker />
        </div>
      </div>
    </footer>
  )
}
