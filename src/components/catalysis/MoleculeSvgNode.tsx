// @ts-nocheck
import glucoseSvg from "../../assets/molecules/glucose.svg"
import fructoseSvg from "../../assets/molecules/fructose.svg"
import formaldehydeSvg from "../../assets/molecules/formaldehyde.svg"
import glyceraldehydeSvg from "../../assets/molecules/glyceraldehyde.svg"
import pyruvaldehydeSvg from "../../assets/molecules/pyruvaldehyde.svg"
import formicAcidSvg from "../../assets/molecules/formic-acid.svg"
import glycolicAcidSvg from "../../assets/molecules/glycolic-acid.svg"
import aceticAcidSvg from "../../assets/molecules/acetic-acid.svg"
import lacticAcidSvg from "../../assets/molecules/lactic-acid.svg"
import pyruvicAcidSvg from "../../assets/molecules/pyruvic-acid.svg"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const roleLabels = {
  feedstock: { zh: "原料", en: "feedstock" },
  intermediate: { zh: "中间体", en: "intermediate" },
  "target product": { zh: "目标产物", en: "target product" },
  byproduct: { zh: "副产物", en: "byproduct" },
}

function localizedRole(role, lang) {
  const key = String(role || "").trim()
  const label = roleLabels[key]
  if (!label) return key
  return lang === "zh" ? label.zh : label.en
}

export const moleculeCatalog = {
  glucose: {
    id: "glucose",
    svg: glucoseSvg,
    englishName: "Glucose",
    zhName: "葡萄糖",
    role: "feedstock",
    pathwayRoleZh: "进入异构化、逆醛醇和 C1/C3 裂解路径的原料。",
    pathwayRole: "Feedstock entering isomerization, retro-aldol, and C1/C3 fragmentation routes.",
    scoreTermZh: "A1 葡萄糖活化；为 A2/A3/B1 提供前体背景。",
    scoreTerm: "A1 glucose activation; precursor context for A2/A3/B1.",
    contributesTo: { A2: false, A3: false, A4: false, B1: false, SelectivityFactor: false },
  },
  fructose: {
    id: "fructose",
    svg: fructoseSvg,
    englishName: "Fructose",
    zhName: "果糖",
    role: "feedstock",
    pathwayRoleZh: "异构化后的原料，为 C1 和 C3 中间体提供来源。",
    pathwayRole: "Isomerized feedstock that supplies C1 and C3 intermediates.",
    scoreTermZh: "A1/A2 前体生成背景。",
    scoreTerm: "A1/A2 precursor generation context.",
    contributesTo: { A2: true, A3: false, A4: false, B1: false, SelectivityFactor: false },
  },
  glyceraldehyde: {
    id: "glyceraldehyde",
    svg: glyceraldehydeSvg,
    englishName: "Glyceraldehyde",
    zhName: "甘油醛",
    role: "intermediate",
    pathwayRoleZh: "混合 C3 中间体：可支持甲酸生成，也可能泄漏到 C2 副产物。",
    pathwayRole: "Mixed C3 intermediate: can support formic acid formation and leak to C2 byproducts.",
    scoreTermZh: "导向甲酸时贡献 A2/A3；导向乙醇酸或乙酸时提高 B1。",
    scoreTerm: "A2/A3 when routed to formic acid; B1 when routed to glycolic or acetic acid.",
    contributesTo: { A2: true, A3: true, A4: false, B1: true, SelectivityFactor: true },
  },
  formaldehyde: {
    id: "formaldehyde",
    svg: formaldehydeSvg,
    englishName: "Formaldehyde",
    zhName: "甲醛",
    role: "intermediate",
    pathwayRoleZh: "导向甲酸 / 甲酸盐的主 C1 正向中间体。",
    pathwayRole: "Primary C1 positive intermediate toward formic acid / formate.",
    scoreTermZh: "A3 和 SelectivityFactor。",
    scoreTerm: "A3 and SelectivityFactor.",
    contributesTo: { A2: false, A3: true, A4: false, B1: false, SelectivityFactor: true },
  },
  pyruvaldehyde: {
    id: "pyruvaldehyde",
    svg: pyruvaldehydeSvg,
    englishName: "Pyruvaldehyde",
    zhName: "丙酮醛",
    role: "intermediate",
    pathwayRoleZh: "风险主导 C3 中间体，竞争性导向乳酸、丙酮酸和乙酸分支。",
    pathwayRole: "Risk-dominant C3 intermediate competing through lactic, pyruvic, and acetic acid branches.",
    scoreTermZh: "B1 和 SelectivityFactor 惩罚项。",
    scoreTerm: "B1 and SelectivityFactor penalty.",
    contributesTo: { A2: false, A3: false, A4: false, B1: true, SelectivityFactor: true },
  },
  formicAcid: {
    id: "formicAcid",
    svg: formicAcidSvg,
    englishName: "Formic acid / Formate",
    zhName: "甲酸 / 甲酸盐",
    role: "target product",
    pathwayRoleZh: "三条路径共享的目标产物终点。",
    pathwayRole: "Target product endpoint shared by the three routes.",
    scoreTermZh: "A3、A4、产率、碳选择性和 SelectivityFactor。",
    scoreTerm: "A3, A4, yield, carbon selectivity, and SelectivityFactor.",
    contributesTo: { A2: false, A3: true, A4: true, B1: false, SelectivityFactor: true },
  },
  glycolicAcid: {
    id: "glycolicAcid",
    svg: glycolicAcidSvg,
    englishName: "Glycolic acid",
    zhName: "乙醇酸",
    role: "byproduct",
    pathwayRoleZh: "甘油醛分支形成的 C2 副产物终点。",
    pathwayRole: "C2 byproduct endpoint from the glyceraldehyde branch.",
    scoreTermZh: "B1 和 SelectivityFactor 惩罚项。",
    scoreTerm: "B1 and SelectivityFactor penalty.",
    contributesTo: { A2: false, A3: false, A4: false, B1: true, SelectivityFactor: true },
  },
  aceticAcid: {
    id: "aceticAcid",
    svg: aceticAcidSvg,
    englishName: "Acetic acid",
    zhName: "乙酸",
    role: "byproduct",
    pathwayRoleZh: "甘油醛和丙酮醛分支形成的 C2 副产物终点。",
    pathwayRole: "C2 byproduct endpoint from glyceraldehyde and pyruvaldehyde branches.",
    scoreTermZh: "B1 和 SelectivityFactor 惩罚项。",
    scoreTerm: "B1 and SelectivityFactor penalty.",
    contributesTo: { A2: false, A3: false, A4: false, B1: true, SelectivityFactor: true },
  },
  lacticAcid: {
    id: "lacticAcid",
    svg: lacticAcidSvg,
    englishName: "Lactic acid",
    zhName: "乳酸",
    role: "byproduct",
    pathwayRoleZh: "风险主导的 C3 副产物终点。",
    pathwayRole: "Risk-dominant C3 byproduct endpoint.",
    scoreTermZh: "B1 和 SelectivityFactor 惩罚项。",
    scoreTerm: "B1 and SelectivityFactor penalty.",
    contributesTo: { A2: false, A3: false, A4: false, B1: true, SelectivityFactor: true },
  },
  pyruvicAcid: {
    id: "pyruvicAcid",
    svg: pyruvicAcidSvg,
    englishName: "Pyruvic acid",
    zhName: "丙酮酸",
    role: "byproduct",
    pathwayRoleZh: "风险主导的氧化 C3 副产物终点。",
    pathwayRole: "Risk-dominant oxidized C3 byproduct endpoint.",
    scoreTermZh: "B1 和 SelectivityFactor 惩罚项。",
    scoreTerm: "B1 and SelectivityFactor penalty.",
    contributesTo: { A2: false, A3: false, A4: false, B1: true, SelectivityFactor: true },
  },
}

const toneMap = {
  neutral: { bg: "#FFFFFF", border: "#D9E2EC", accent: "#475569", shadow: "none" },
  feedstock: { bg: "#FFFFFF", border: "#B8C5D4", accent: "#1A6DB5", shadow: "0 8px 18px rgba(26, 109, 181, 0.08)" },
  active: { bg: "#FFFFFF", border: "#1A6DB5", accent: "#1A6DB5", shadow: "0 8px 18px rgba(26, 109, 181, 0.08)" },
  selected: { bg: "#FFFFFF", border: "#0F172A", accent: "#0F172A", shadow: "0 10px 24px rgba(15, 23, 42, 0.14)" },
  positive: { bg: "#F7FEFA", border: "#147C43", accent: "#147C43", shadow: "0 8px 20px rgba(20, 124, 67, 0.12)" },
  mixed: { bg: "#FFFDF8", border: "#C98530", accent: "#A15C13", shadow: "0 8px 20px rgba(161, 92, 19, 0.10)" },
  risk: { bg: "#FFFCFA", border: "#B35A32", accent: "#8F3B1B", shadow: "0 8px 20px rgba(143, 59, 27, 0.11)" },
  dimmed: { bg: "#FFFFFF", border: "#D9E2EC", accent: "#64748B", shadow: "none" },
}

export function MoleculeStructureImage({ moleculeId, compact = false, lang = "zh" }) {
  const molecule = moleculeCatalog[moleculeId]
  if (!molecule) return null
  const isFormaldehyde = moleculeId === "formaldehyde"
  const maxHeight = isFormaldehyde ? 176 : compact ? 138 : 150

  return (
    <img
      src={molecule.svg}
      alt={text(lang, `${molecule.zhName}分子结构式`, `${molecule.englishName} molecular structure`)}
      draggable="false"
      style={{
        display: "block",
        height: "auto",
        maxHeight,
        maxWidth: "100%",
        objectFit: "contain",
        width: "auto",
      }}
    />
  )
}

export function MoleculeSvgNode({
  moleculeId,
  role,
  status = "neutral",
  active = false,
  dimmed = false,
  selected = false,
  compact = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style,
  lang = "zh",
}) {
  const molecule = moleculeCatalog[moleculeId]
  if (!molecule) return null

  const interactive = typeof onClick === "function"
  const resolvedStatus = selected ? "selected" : dimmed ? "dimmed" : active ? status || "active" : status
  const colors = toneMap[resolvedStatus] || toneMap.neutral
  const displayRole = role || molecule.role
  const roleLabel = localizedRole(displayRole, lang)
  const primaryName = lang === "zh" ? molecule.zhName : molecule.englishName
  const secondaryName = lang === "zh" ? molecule.englishName : molecule.zhName
  const isFormaldehyde = moleculeId === "formaldehyde"
  const nodeMinHeight = isFormaldehyde ? 250 : 220
  const nodeMinWidth = isFormaldehyde ? 300 : 260
  const structureMinHeight = isFormaldehyde ? 165 : 140
  const structurePadding = isFormaldehyde ? 18 : compact ? 14 : 16
  const structureInnerMinHeight = isFormaldehyde ? 150 : 108

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!interactive) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick()
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: colors.bg,
        border: `${selected || active ? 2 : 1}px solid ${colors.border}`,
        borderRadius: 12,
        boxShadow: selected || active ? colors.shadow : "none",
        cursor: interactive ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: nodeMinHeight,
        minWidth: nodeMinWidth,
        opacity: dimmed ? 0.36 : 1,
        outline: "none",
        overflow: "visible",
        padding: compact ? 16 : 20,
        transform: selected || active ? "translateY(-1px)" : "none",
        transition: "opacity 180ms ease, transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
        ...style,
      }}
    >
      <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
        <div style={{ color: "#0F172A", fontSize: compact ? 14 : 14.5, fontWeight: 800, lineHeight: 1.2 }}>
          {primaryName}
        </div>
        <div style={{ color: colors.accent, fontSize: compact ? 11 : 11.2, fontWeight: 700, lineHeight: 1.25 }}>
          {secondaryName}
        </div>
        <div style={{ color: "#64748B", fontSize: compact ? 10.5 : 10.8, fontWeight: 700, lineHeight: 1.2 }}>
          {roleLabel}
        </div>
      </div>
      <div
        style={{
          alignItems: "center",
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          display: "flex",
          flex: "1 1 auto",
          justifyContent: "center",
          minHeight: structureMinHeight,
          overflow: "visible",
          padding: structurePadding,
        }}
      >
        <div style={{ alignItems: "center", display: "flex", height: "100%", justifyContent: "center", maxHeight: "100%", maxWidth: "100%", minHeight: structureInnerMinHeight, overflow: "visible", width: "100%" }}>
          <MoleculeStructureImage moleculeId={moleculeId} compact={compact} lang={lang} />
        </div>
      </div>
    </div>
  )
}
