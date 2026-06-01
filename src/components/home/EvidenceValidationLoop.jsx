// @ts-nocheck
import { useState } from "react"
import { evidenceLevels, evidenceLoopNodes, validationActions } from "./workflowData"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function EvidenceValidationLoop({ lang = "en", compact = false }) {
  const [activeNode, setActiveNode] = useState("evidence")
  const active = evidenceLoopNodes.find((node) => node.id === activeNode) || evidenceLoopNodes[1]
  const methodLabel = text(lang, "查看证据与验证方法", "View evidence and validation method")

  if (compact) {
    return (
      <div className="workflow-evidence-loop workflow-evidence-loop-compact" aria-label={text(lang, "证据与验证闭环", "Evidence and validation loop")}>
        {evidenceLoopNodes.map((node, index) => (
          <div key={node.id} className="workflow-loop-accordion-item" data-active={activeNode === node.id ? "true" : "false"}>
            <button
              type="button"
              className="workflow-loop-vertical-node"
              aria-expanded={activeNode === node.id}
              onClick={() => setActiveNode(activeNode === node.id ? "" : node.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{text(lang, node.zh, node.en)}</strong>
            </button>
            {activeNode === node.id ? (
              <div className="workflow-loop-accordion-panel">
                <p>{text(lang, node.zhDetail, node.enDetail)}</p>
                <a href="#validation-evidence" className="workflow-loop-method-link">{methodLabel}</a>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="workflow-evidence-loop" aria-label={text(lang, "证据与验证闭环", "Evidence and validation loop")}>
      <div className="workflow-loop-sequence">
        {evidenceLoopNodes.map((node, index) => {
          return (
            <button
              key={node.id}
              type="button"
              className="workflow-loop-step"
              data-active={activeNode === node.id ? "true" : "false"}
              onClick={() => setActiveNode(node.id)}
              onFocus={() => setActiveNode(node.id)}
              onMouseEnter={() => setActiveNode(node.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{text(lang, node.zh, node.en)}</strong>
                <small>{text(lang, node.zhDetail, node.enDetail)}</small>
              </div>
            </button>
          )
        })}
      </div>
      <div className="workflow-loop-info">
        <span className="workflow-loop-active-badge">{text(lang, "当前步骤", "Active step")}</span>
        <strong>{text(lang, active.zh, active.en)}</strong>
        <p>{text(lang, active.zhDetail, active.enDetail)}</p>
        <div className="workflow-evidence-levels">
          {evidenceLevels.map((level) => (
            <span key={level.level} data-tone={level.tone}>
              <b>{level.level}</b> {text(lang, level.zh, level.en)}
            </span>
          ))}
        </div>
        <div className="workflow-validation-actions">
          {validationActions.map((action) => (
            <span key={action.en}>{text(lang, action.zh, action.en)}</span>
          ))}
        </div>
        <a href="#validation-evidence" className="workflow-loop-method-link">{methodLabel}</a>
      </div>
    </div>
  )
}
