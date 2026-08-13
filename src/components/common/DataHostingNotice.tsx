// @ts-nocheck
import { CaretDown, GlobeHemisphereWest } from "@phosphor-icons/react"
import "./DataHostingNotice.css"

const GDPR_SOURCE = "https://eur-lex.europa.eu/eli/reg/2016/679/oj"

export function DataHostingNotice({ lang = "zh", placement = "workspace" }) {
  const zh = lang === "zh"

  return (
    <details className="data-hosting-note" data-placement={placement} data-testid={`data-hosting-note-${placement}`}>
      <summary>
        <span className="data-hosting-note__icon" aria-hidden="true">
          <GlobeHemisphereWest size={18} weight="regular" />
        </span>
        <span className="data-hosting-note__summary-copy">
          <strong>{zh ? "部分研究数据由境外来源托管" : "Some research data is hosted by overseas sources"}</strong>
          <span>{zh ? "若加载异常，请查看访问与合规说明" : "Open the access and compliance note if data does not load"}</span>
        </span>
        <span className="data-hosting-note__more">
          {zh ? "查看说明" : "Details"}
          <CaretDown size={14} weight="bold" />
        </span>
      </summary>

      <div className="data-hosting-note__detail">
        <p>
          {zh
            ? "基于对欧盟及相关地区数据保护与跨境传输要求的审慎处理，同时受数据提供方许可和当前托管条件影响，本站暂未将相关数据部署在中国大陆地区服务器。若数据未能加载，请切换至可正常访问相关境外数据源的合规网络环境后重试。由此带来的不便，我们深表歉意。"
            : "To handle European and related regional data-protection and cross-border transfer requirements carefully, and because of provider licences and current hosting conditions, these datasets are not currently deployed on servers in mainland China. If a dataset does not load, retry from a compliant network environment that can reach the relevant overseas source. We apologise for the inconvenience."}
        </p>
        <div className="data-hosting-note__links">
          <a href={GDPR_SOURCE} target="_blank" rel="noreferrer">
            {zh ? "欧盟 GDPR 原始法律文本" : "Original EU GDPR text"}
          </a>
          <a href="#database-compliance">
            {zh ? "查看条款与政策" : "View terms and policies"}
          </a>
        </div>
      </div>
    </details>
  )
}
