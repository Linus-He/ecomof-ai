// @ts-nocheck
export function DescriptorTreatChips({ descriptors = [], selectedIds = [], toggleDescriptor, lang, t }) {
  const zh = lang === "zh"
  return (
    <section className="descriptor-treat-panel" style={{ background: t.surface, borderColor: t.border }}>
      <strong style={{ color: t.textStrong }}>{zh ? "描述符投喂卡片" : "Descriptor treat chips"}</strong>
      <div className="descriptor-treat-grid">
        {descriptors.map(item => {
          const active = selectedIds.includes(item.id)
          return (
            <button
              key={item.id}
              type="button"
              draggable
              onDragStart={event => event.dataTransfer.setData("text/plain", item.id)}
              onClick={() => toggleDescriptor(item.id)}
              data-active={active ? "true" : "false"}
              style={{ background: active ? t.badgeInfoBg : t.panel, borderColor: active ? t.accent : t.border, color: active ? t.textStrong : t.muted }}
            >
              <span>{zh ? item.labelZh : item.labelEn}</span>
              <small>{item.activationEnergyDelta > 0 ? "+" : ""}{item.activationEnergyDelta} kJ/mol · Evidence {item.evidenceLevel}</small>
            </button>
          )
        })}
      </div>
      <p style={{ color: t.subtle }}>{zh ? "点击或拖动 chip 到图上，用 proxy contribution 改变曲线和风险提示。" : "Click or drag a chip onto the diagram; proxy contributions update the curve and risk notes."}</p>
    </section>
  )
}
