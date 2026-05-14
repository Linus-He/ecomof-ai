import { MethodArchitectureDiagram, scrollToMethodTarget } from "./MethodArchitectureDiagram"
import { MethodArrow } from "./MethodArrow"
import { MethodBlock } from "./MethodBlock"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function RegistryExample({ t, title, rows }) {
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 12, display: "grid", gap: 8, minWidth: 0 }}>
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>{title}</div>
      <div style={{ display: "grid", gap: 5 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "grid", gridTemplateColumns: "minmax(95px, 0.65fr) minmax(0, 1fr)", gap: 8, color: t.muted, fontSize: 11.2, lineHeight: 1.45 }}>
            <span style={{ color: t.faint }}>{label}</span>
            <span style={{ color: t.textStrong, overflowWrap: "anywhere" }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DescriptorRegistryDiagram({ t, lang = "en" }) {
  const steps = [
    "Descriptor key",
    "Definition",
    "Unit",
    "Direction: benefit / cost / neutral",
    "Normalizer",
    "Missing-value policy",
    "Evidence requirement",
    "Used in descriptor presets",
    "Used by scoring engine",
  ]

  return (
    <MethodArchitectureDiagram
      t={t}
      eyebrow={text(lang, "全局描述符注册中心", "Global Descriptor Registry")}
      title={text(lang, "Descriptor Registry Architecture", "Descriptor Registry Architecture")}
      subtitle={text(
        lang,
        "新增描述符不是随意加字段，而是先进入统一 registry，再被 preset、normalizer 和 scoring engine 复用。",
        "New descriptors are not loose fields; they enter one registry before presets, normalizers, and scoring engines reuse them."
      )}
      action={
        <button
          type="button"
          onClick={() => scrollToMethodTarget("registry-viewer")}
          style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 10, color: t.accentText, padding: "8px 10px", fontSize: 11, fontWeight: 850, cursor: "pointer" }}
        >
          {text(lang, "打开 registry table", "Open registry table")}
        </button>
      }
    >
      <div className="method-registry-layout">
        <div className="method-flow-chain">
          {steps.map((step, index) => (
            <div key={step}>
              <MethodBlock t={t} title={step} tone={index === 0 ? "input" : index >= steps.length - 2 ? "output" : "process"} compact />
              {index < steps.length - 1 && <MethodArrow t={t} direction="down" />}
            </div>
          ))}
        </div>
        <div className="method-registry-examples" style={{ display: "grid", gap: 12 }}>
          <RegistryExample
            t={t}
            title="surfaceArea"
            rows={[
              ["unit", "m²/g"],
              ["direction", "benefit"],
              ["group", "porosity"],
              ["normalizer", "minmax"],
              ["evidence", "required"],
            ]}
          />
          <RegistryExample
            t={t}
            title="toxicityConcern"
            rows={[
              ["unit", "score"],
              ["direction", "cost"],
              ["group", "sustainability"],
              ["normalizer", "minmax / categoricalScore"],
              ["evidence", "required"],
            ]}
          />
        </div>
      </div>
    </MethodArchitectureDiagram>
  )
}
