import { CheckCircle, CaretDown, WarningCircle } from "@phosphor-icons/react"

export function MofIndexProgress({ states, labels, lang }: { states: string[]; labels: string[][]; lang: string }) {
  const zh = lang === "zh"
  const loading = states.includes("loading")
  const failed = states.includes("failed")
  const percent = Math.round(states.filter(state => state !== "loading").length / states.length * 100)
  return (
    <details className="mof-index-progress" data-testid="mof-index-progress" onKeyDown={event => { if (event.key === "Escape") event.currentTarget.open = false }}>
      <summary aria-label={zh ? "查看索引加载进度" : "View index loading progress"}>
        {loading ? <svg className="mof-index-spinner" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => <rect key={index} x="11" y="2" width="2" height="5" rx="1" fill="currentColor" opacity={(index + 1) / 8} transform={`rotate(${index * 45} 12 12)`} />)}
        </svg> : failed ? <WarningCircle size={16} /> : <CheckCircle size={16} />}
        <span>{loading ? (zh ? "加载中" : "Loading") : failed ? (zh ? "有异常" : "Issue") : (zh ? "已完成" : "Complete")}</span>
        <span role="progressbar" aria-label={zh ? "索引请求完成百分比" : "Index request completion percentage"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>{percent}%</span>
        <CaretDown size={10} aria-hidden="true" />
      </summary>
      <div className="mof-index-progress-popover">
        <strong>{zh ? "索引加载详情" : "Index loading details"}</strong>
        {labels.map(([labelZh, labelEn], index) => <div className="mof-index-progress-row" key={labelEn}>
          <span>{zh ? labelZh : labelEn}</span>
          <span>{states[index] === "loading" ? (zh ? "加载中…" : "Loading…") : states[index] === "failed" ? (zh ? "请求失败" : "Failed") : (zh ? "已返回" : "Returned")}</span>
        </div>)}
        <p>{zh ? "按已完成的索引请求计；数据可用性见对应版块。" : "Based on completed index requests; data availability is shown in each section."}</p>
      </div>
    </details>
  )
}
