// @ts-nocheck
import { useState } from "react"
import { evidenceLevels, evidenceLoopNodes, validationActions } from "./workflowData"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function EvidenceValidationLoop({ lang = "en", compact = false }) {
  const [activeNode, setActiveNode] = useState("evidence")
  const active = evidenceLoopNodes.find((node) => node.id === activeNode) || evidenceLoopNodes[1]

  if (compact) {
    return (
      <div className="workflow-evidence-loop workflow-evidence-loop-compact">
        {evidenceLoopNodes.map((node, index) => (
          <button
            key={node.id}
            type="button"
            className="workflow-loop-vertical-node"
            data-active={activeNode === node.id ? "true" : "false"}
            onClick={() => setActiveNode(node.id)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{text(lang, node.zh, node.en)}</strong>
            <small>{text(lang, node.zhDetail, node.enDetail)}</small>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="workflow-evidence-loop" aria-label={text(lang, "证据与验证闭环", "Evidence and validation loop")}>
      <div className="workflow-loop-canvas">
        <svg viewBox="0 0 640 260" aria-hidden="true">
          <path className="workflow-loop-path" d="M120 132 C140 34 298 20 410 58 C534 100 538 194 430 224 C292 262 138 230 120 132" />
          <path className="workflow-loop-return" d="M456 214 C502 188 512 142 486 104" />
        </svg>
        {evidenceLoopNodes.map((node, index) => {
          const positions = [
            [74, 50],
            [34, 154],
            [268, 34],
            [488, 80],
            [420, 188],
          ]
          const [left, top] = positions[index]
          return (
            <button
              key={node.id}
              type="button"
              className="workflow-loop-node"
              data-active={activeNode === node.id ? "true" : "false"}
              onClick={() => setActiveNode(node.id)}
              onFocus={() => setActiveNode(node.id)}
              onMouseEnter={() => setActiveNode(node.id)}
              style={{ left, top }}
            >
              <span>{index + 1}</span>
              <strong>{text(lang, node.zh, node.en)}</strong>
            </button>
          )
        })}
      </div>
      <div className="workflow-loop-info">
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
      </div>
    </div>
  )
}
