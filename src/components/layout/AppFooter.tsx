// @ts-nocheck
import { useEffect, useRef, useState } from "react"
import { ArrowSquareOut, GlobeHemisphereEast } from "@phosphor-icons/react"
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
          [zh ? "条款与政策" : "Terms & policies", "dataCompliance"],
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
          [zh ? "EcoMOF-AI 宪章" : "EcoMOF-AI Charter", "dataCompliance"],
          [zh ? "非商业研究说明" : "Non-commercial research notice", "dataCompliance"],
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
          <span>{zh ? "© 2026 EcoMOF-AI · Linus-He 维护" : "© 2026 EcoMOF-AI · Maintained by Linus-He"}</span>
          <p>{zh ? "用于早期筛选和研究假设生成，不代表最终实验结论。" : "For early-stage screening and research hypothesis generation; not a final experimental conclusion."}</p>
        </div>
        <aside className="app-footer-access-note" aria-label={zh ? "数据托管与跨境访问说明" : "Data hosting and cross-border access notice"}>
          <GlobeHemisphereEast aria-hidden size={19} weight="duotone" />
          <p>
            <strong>{zh ? "数据托管与跨境访问" : "Data hosting & cross-border access"}</strong>
            <span>{zh ? "受数据保护与跨境传输要求、提供方许可和当前托管条件影响，相关数据暂未部署在中国大陆地区服务器。若无法加载，请切换至可访问相关境外数据源的合规网络环境。由此带来的不便，我们深表歉意。" : "Data-protection and cross-border transfer requirements, provider licences, and current hosting conditions mean that the relevant data is not hosted on servers in mainland China. If it does not load, retry from a compliant network that can access the relevant overseas source. We apologize for the inconvenience."}</span>
          </p>
          <div>
            <a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj" target="_blank" rel="noreferrer">{zh ? "GDPR 原文" : "GDPR text"}<ArrowSquareOut aria-hidden size={13} /></a>
            <button type="button" onClick={() => activate("dataCompliance")}>{zh ? "条款与政策" : "Terms & policies"}</button>
          </div>
        </aside>
      </div>
    </footer>
  )
}
