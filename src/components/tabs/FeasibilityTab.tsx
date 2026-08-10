// @ts-nocheck
import {
  useT, useLang, useViewport,
  METAL_CENTERS, ORGANIC_LINKERS,
  zhText, toolbarBtn,
  BasisBadge, PageHeader, SectionTitle, ResultLayer, NextStepCTA, ProvenanceGrid, MethodDrawer, Callout,
} from "../../shared"

export function FeasibilityTab({ results, inputs, onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow } = useViewport()
  const metal = METAL_CENTERS.find(m => m.value === inputs.metalCenter)
  const linker = ORGANIC_LINKERS.find(l => l.value === inputs.organicLinker)
  const linkerScore = Number(linker?.lcaScore ?? 5)
  const metalScore = Number(metal?.lcaScore ?? 5)
  const hasRareMetal = ["Co2+", "Ni2+", "Cr3+"].includes(inputs.metalCenter)
  const hasComplexLinker = ["TCPP", "TBAPy", "BTB", "ADC", "NDC"].includes(inputs.organicLinker)
  const costBand = hasComplexLinker || linkerScore < 4.5 ? "High" : linkerScore < 5.8 || hasRareMetal ? "Medium" : "Low"
  const availability = hasComplexLinker ? "Custom synthesis likely" : linkerScore < 5.8 ? "Gram-scale or specialty supply" : "Likely commercially available"
  const supplyRisk = hasComplexLinker || hasRareMetal ? "Elevated" : linker?.fossil ? "Moderate" : "Lower"
  const processConstraints = lang === "zh" ? [
    ["反应时间", hasComplexLinker ? "可能较长" : "常规范围", hasComplexLinker ? "复杂芳香或卟啉连接体通常需要更长路线确认。" : "当前输入未触发长反应时间警告。"],
    ["回收难度", linker?.fossil ? "需要核查" : "较低", linker?.fossil ? "应检查溶剂交换、洗涤和母液回收假设。" : "当前路线未显示明显回收难点。"],
    ["工艺条件", hasRareMetal ? "可能敏感" : "未见强警告", hasRareMetal ? "稀缺或过渡金属前驱体可能带来安全、纯化或采购约束。" : "未触发苛刻条件提示。"],
    ["放大摩擦", costBand === "High" || supplyRisk === "Elevated" ? "较高" : "中低", costBand === "High" || supplyRisk === "Elevated" ? "成本、供应或路线复杂度可能在放大时成为阻力。" : "可作为下一轮候选继续比较。"],
  ] : [
    ["Reaction time", hasComplexLinker ? "Potentially long" : "Typical range", hasComplexLinker ? "Complex aromatic or porphyrinic linkers usually need route confirmation." : "No long-reaction warning is triggered by the current inputs."],
    ["Recovery difficulty", linker?.fossil ? "Needs check" : "Lower", linker?.fossil ? "Check solvent exchange, washing, and mother-liquor recovery assumptions." : "No obvious recovery issue is flagged by the current route."],
    ["Process conditions", hasRareMetal ? "Potentially sensitive" : "No strong warning", hasRareMetal ? "Rare or transition-metal precursors may add safety, purification, or procurement constraints." : "No harsh-condition cue is triggered."],
    ["Scale friction", costBand === "High" || supplyRisk === "Elevated" ? "Elevated" : "Lower-moderate", costBand === "High" || supplyRisk === "Elevated" ? "Cost, supply, or route complexity may become a scale-up barrier." : "Reasonable to keep for the next comparison round."],
  ]
  const rows = lang === "zh" ? [
    ["连接体可得性", zhText(lang, availability), "商业购买 / 克级供应 / 定制合成的粗略判断。"],
    ["成本初筛", zhText(lang, costBand), "低 / 中 / 高成本带，用于排除明显不适合放大的路线。"],
    ["稀缺或前驱体风险", hasRareMetal ? "有金属供应风险" : "未触发稀缺金属警告", `${inputs.metalCenter} · 金属评分 ${metalScore}/10`],
    ["供应瓶颈风险", supplyRisk, hasComplexLinker ? "复杂芳香/卟啉/大型连接体可能需要定制合成。" : "未发现明显连接体瓶颈。"],
  ] : [
    ["Linker availability", availability, "Coarse commercial / gram-scale / custom-synthesis classification."],
    ["Cost feasibility", costBand, "Low / medium / high preliminary cost band for rejecting obviously impractical routes."],
    ["Rare precursor warning", hasRareMetal ? "Metal supply warning" : "No rare-metal warning", `${inputs.metalCenter} · metal score ${metalScore}/10`],
    ["Supply bottleneck risk", supplyRisk, hasComplexLinker ? "Complex aromatic, porphyrin, or large linker may require custom synthesis." : "No obvious linker bottleneck flagged."],
  ]
  const severityTone = (value) => {
    const text = String(value)
    if (/High|Elevated|warning|Custom|高|风险|定制|瓶颈/.test(text)) return { color: t.danger, tone: "danger", label: lang === "zh" ? "高" : "high" }
    if (/Medium|Moderate|Gram|specialty|中|克级|需要核查/.test(text)) return { color: t.warn, tone: "warn", label: lang === "zh" ? "中" : "medium" }
    return { color: t.success, tone: "calc", label: lang === "zh" ? "低" : "low" }
  }
  const useCases = lang === "zh" ? [
    ["小规模学术探索", "可接受较高连接体成本；重点是机理、性能和可发表的结构-性质理解。"],
    ["中试或重复制备", "需要更明确的供应来源、批量可得性、溶剂路线和安全边界。"],
    ["大规模部署", "对连接体价格、金属供应、溶剂回收和再生能耗极度敏感。"],
  ] : [
    ["Small-scale academic relevance", "Higher linker cost may be acceptable when mechanism, performance, and structure-property insight matter most."],
    ["Pilot or repeated synthesis", "Supply source, batch availability, solvent route, and safety boundaries become more important."],
    ["Large-scale deployment relevance", "Linker price, metal supply, solvent recovery, and regeneration energy become highly scale-sensitive."],
  ]
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={lang === "zh" ? "可行性边界" : "Feasibility"}
        subtitle={lang === "zh"
          ? "科学筛选之后的可得性、粗略成本与用途尺度边界。"
          : "Availability, rough cost, and use-scale boundaries after scientific screening."}
        meta={lang === "zh" ? "可行性边界 · 仅供探索" : "Feasibility boundary · exploratory only"}
        action={<BasisBadge tone="proxy">{lang === "zh" ? "不是正式生命周期成本" : "Not formal lifecycle costing"}</BasisBadge>}
      />
      <Callout tone="warn">
        {lang === "zh"
          ? "这个阶段不是正式生命周期成本。它是科学筛选与工程尺度评估之间的粗略可行性边界。"
          : "This stage is not formal lifecycle costing. It is a coarse feasibility boundary between scientific screening and engineering-scale evaluation."}
      </Callout>
      <ResultLayer number="01" title={lang === "zh" ? "核心结果" : "Key Outputs"} subtitle={lang === "zh" ? "先看哪些实际边界可能阻断下一轮比较。" : "Start with which practical boundaries may block the next comparison round."}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          {rows.map(([label, value, note]) => {
            const severity = severityTone(value)
            return (
              <div key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14, borderTop: `3px solid ${severity.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</div>
                  <BasisBadge tone={severity.tone}>{severity.label}</BasisBadge>
                </div>
                <div style={{ color: t.textStrong, fontSize: 17, fontWeight: 850, lineHeight: 1.25 }}>{zhText(lang, value)}</div>
                <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, marginTop: 8 }}>{note}</div>
              </div>
            )
          })}
        </div>
      </ResultLayer>
      <ResultLayer number="02" title={lang === "zh" ? "边界判断依据" : "Boundary Rationale"} subtitle={lang === "zh" ? "把连接体、路线和用途尺度分开解释。" : "Separate linker, route, and use-scale interpretation."}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "0.9fr 1.1fr", gap: 14 }}>
          <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
            <SectionTitle>{lang === "zh" ? "连接体与路线提示" : "Linker and route cues"}</SectionTitle>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                [lang === "zh" ? "连接体" : "Linker", inputs.organicLinker, zhText(lang, linker?.category || "—")],
                [lang === "zh" ? "可得性" : "Availability", zhText(lang, availability), zhText(lang, "Stage 2 feasibility boundary")],
                [lang === "zh" ? "材料负担提示" : "Material burden note", zhText(lang, costBand === "High" ? "High rough burden" : costBand === "Medium" ? "Moderate rough burden" : "Lower rough burden"), zhText(lang, "Derived from current proxy catalog")],
                [lang === "zh" ? "下一步" : "Next evidence", zhText(lang, "Supplier quote / route check"), zhText(lang, "Needed before comparative LCC")],
              ].map(([label, value, note]) => (
                <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</span>
                    <BasisBadge tone="proxy">{zhText(lang, "coarse")}</BasisBadge>
                  </div>
                  <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850, marginTop: 6 }}>{value}</div>
                  <div style={{ color: t.subtle, fontSize: 10, lineHeight: 1.45, marginTop: 5 }}>{note}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
            <SectionTitle>{lang === "zh" ? "用途尺度依赖" : "Use-case dependence"}</SectionTitle>
            <div style={{ display: "grid", gap: 10 }}>
              {useCases.map(([title, body]) => (
                <div key={title} style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "180px 1fr", gap: 12, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{title}</div>
                  <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>{body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 12 }}>
            <div>
              <SectionTitle>{lang === "zh" ? "实践过程约束" : "Practical process constraints"}</SectionTitle>
              <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>
                {lang === "zh" ? "这些是放大前的粗略路线提示，不等同于工艺包或安全审查。" : "These are coarse route cues before scale-up, not a process package or safety review."}
              </div>
            </div>
            <BasisBadge tone="proxy">{lang === "zh" ? "可行性边界" : "Feasibility boundary"}</BasisBadge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            {processConstraints.map(([label, value, body]) => (
              <div key={label} style={{ background: t.surface, border: `1px solid ${value.includes("高") || value.includes("Elevated") || value.includes("long") || value.includes("sensitive") ? t.lccAccent : t.validationAccent}`, borderRadius: 8, padding: 12 }}>
                <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{value}</div>
                <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.5, marginTop: 7 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </ResultLayer>
      <ResultLayer number="03" title={lang === "zh" ? "适用范围与局限" : "Scope and Limitations"} subtitle={lang === "zh" ? "当前仅提供筛选级边界，不构成正式 LCC 或工程经济分析。" : "This is a coarse boundary, not formal LCC or engineering economics."}>
        <ProvenanceGrid items={[
          { label: "Use stage", value: "Stage 2 — Feasibility Boundaries", type: "proxy", note: "Practical boundary between scientific screening and shortlist comparison." },
          { label: "Purpose", value: "Feasibility boundary", type: "user", note: "Cost / availability / supply feasibility screening." },
          { label: "Interpretation", value: "Exploratory only", type: "proxy", note: "Not formal LCC, not engineering-grade economics." },
          { label: "Next layer", value: results && !results.unavailable ? "Stage 3 shortlist comparison" : "Run Stage 1 first", type: "info", note: "Use LCA/LCC only after an initial performance filter exists." },
        ]} />
        <MethodDrawer title={lang === "zh" ? "可行性判断依据" : "Feasibility basis"} badge={lang === "zh" ? "粗边界" : "Coarse boundary"}>
          {lang === "zh"
            ? "本页使用连接体类别、金属节点、代理成本带和路线复杂度提示来标记 low / medium / high 约束。"
            : "This page uses linker class, metal node, proxy cost band, and route-complexity cues to flag low / medium / high constraints."}
        </MethodDrawer>
      </ResultLayer>
      <NextStepCTA
        label={lang === "zh" ? "下一步：比较入围候选" : "Next: compare shortlisted candidates"}
        body={lang === "zh" ? "如果没有明显可行性阻断，再进入 LCA/LCC 和敏感性作为次级比较层。" : "If no feasibility boundary blocks the candidate, move to LCA/LCC and sensitivity as secondary comparison layers."}
        actionLabel={lang === "zh" ? "进入 LCA/LCC" : "Open LCA/LCC"}
        onClick={() => onNavigate?.("lca")}
      />
    </div>
  )
}
