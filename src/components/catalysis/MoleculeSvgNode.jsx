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

export const moleculeCatalog = {
  glucose: {
    id: "glucose",
    svg: glucoseSvg,
    englishName: "Glucose",
    zhName: "葡萄糖",
    role: "feedstock",
    pathwayRole: "Feedstock entering isomerization, retro-aldol, and C1/C3 fragmentation routes.",
    scoreTerm: "A1 glucose activation; precursor context for A2/A3/B1.",
    contributesTo: { A2: false, A3: false, A4: false, B1: false, SelectivityFactor: false },
  },
  fructose: {
    id: "fructose",
    svg: fructoseSvg,
    englishName: "Fructose",
    zhName: "果糖",
    role: "feedstock",
    pathwayRole: "Isomerized feedstock that supplies C1 and C3 intermediates.",
    scoreTerm: "A1/A2 precursor generation context.",
    contributesTo: { A2: true, A3: false, A4: false, B1: false, SelectivityFactor: false },
  },
  glyceraldehyde: {
    id: "glyceraldehyde",
    svg: glyceraldehydeSvg,
    englishName: "Glyceraldehyde",
    zhName: "甘油醛",
    role: "intermediate",
    pathwayRole: "Mixed C3 intermediate: can support formic acid formation and leak to C2 byproducts.",
    scoreTerm: "A2/A3 when routed to formic acid; B1 when routed to glycolic or acetic acid.",
    contributesTo: { A2: true, A3: true, A4: false, B1: true, SelectivityFactor: true },
  },
  formaldehyde: {
    id: "formaldehyde",
    svg: formaldehydeSvg,
    englishName: "Formaldehyde",
    zhName: "甲醛",
    role: "intermediate",
    pathwayRole: "Primary C1 positive intermediate toward formic acid / formate.",
    scoreTerm: "A3 and SelectivityFactor.",
    contributesTo: { A2: false, A3: true, A4: false, B1: false, SelectivityFactor: true },
  },
  pyruvaldehyde: {
    id: "pyruvaldehyde",
    svg: pyruvaldehydeSvg,
    englishName: "Pyruvaldehyde",
    zhName: "丙酮醛",
    role: "intermediate",
    pathwayRole: "Risk-dominant C3 intermediate competing through lactic, pyruvic, and acetic acid branches.",
    scoreTerm: "B1 and SelectivityFactor penalty.",
    contributesTo: { A2: false, A3: false, A4: false, B1: true, SelectivityFactor: true },
  },
  formicAcid: {
    id: "formicAcid",
    svg: formicAcidSvg,
    englishName: "Formic acid / Formate",
    zhName: "甲酸 / 甲酸盐",
    role: "target product",
    pathwayRole: "Target product endpoint shared by the three routes.",
    scoreTerm: "A3, A4, yield, carbon selectivity, and SelectivityFactor.",
    contributesTo: { A2: false, A3: true, A4: true, B1: false, SelectivityFactor: true },
  },
  glycolicAcid: {
    id: "glycolicAcid",
    svg: glycolicAcidSvg,
    englishName: "Glycolic acid",
    zhName: "乙醇酸",
    role: "byproduct",
    pathwayRole: "C2 byproduct endpoint from the glyceraldehyde branch.",
    scoreTerm: "B1 and SelectivityFactor penalty.",
    contributesTo: { A2: false, A3: false, A4: false, B1: true, SelectivityFactor: true },
  },
  aceticAcid: {
    id: "aceticAcid",
    svg: aceticAcidSvg,
    englishName: "Acetic acid",
    zhName: "乙酸",
    role: "byproduct",
    pathwayRole: "C2 byproduct endpoint from glyceraldehyde and pyruvaldehyde branches.",
    scoreTerm: "B1 and SelectivityFactor penalty.",
    contributesTo: { A2: false, A3: false, A4: false, B1: true, SelectivityFactor: true },
  },
  lacticAcid: {
    id: "lacticAcid",
    svg: lacticAcidSvg,
    englishName: "Lactic acid",
    zhName: "乳酸",
    role: "byproduct",
    pathwayRole: "Risk-dominant C3 byproduct endpoint.",
    scoreTerm: "B1 and SelectivityFactor penalty.",
    contributesTo: { A2: false, A3: false, A4: false, B1: true, SelectivityFactor: true },
  },
  pyruvicAcid: {
    id: "pyruvicAcid",
    svg: pyruvicAcidSvg,
    englishName: "Pyruvic acid",
    zhName: "丙酮酸",
    role: "byproduct",
    pathwayRole: "Risk-dominant oxidized C3 byproduct endpoint.",
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

export function MoleculeStructureImage({ moleculeId, compact = false }) {
  const molecule = moleculeCatalog[moleculeId]
  if (!molecule) return null

  return (
    <img
      src={molecule.svg}
      alt={`${molecule.englishName} molecular structure`}
      draggable="false"
      style={{
        display: "block",
        height: compact ? 58 : 82,
        maxHeight: compact ? 58 : 82,
        maxWidth: "100%",
        objectFit: "contain",
        width: "100%",
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
}) {
  const molecule = moleculeCatalog[moleculeId]
  if (!molecule) return null

  const interactive = typeof onClick === "function"
  const resolvedStatus = selected ? "selected" : dimmed ? "dimmed" : active ? status || "active" : status
  const colors = toneMap[resolvedStatus] || toneMap.neutral
  const displayRole = role || molecule.role

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
        borderRadius: 8,
        boxShadow: selected || active ? colors.shadow : "none",
        cursor: interactive ? "pointer" : "default",
        display: "grid",
        gap: compact ? 5 : 7,
        minWidth: compact ? 154 : 184,
        opacity: dimmed ? 0.36 : 1,
        outline: "none",
        padding: compact ? 8 : 10,
        transform: selected || active ? "translateY(-1px)" : "none",
        transition: "opacity 180ms ease, transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
        ...style,
      }}
    >
      <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
        <div style={{ color: "#0F172A", fontSize: compact ? 11.5 : 12.5, fontWeight: 900, lineHeight: 1.2 }}>
          {molecule.englishName}
        </div>
        <div style={{ color: colors.accent, fontSize: compact ? 10 : 10.6, fontWeight: 850, lineHeight: 1.2 }}>
          {molecule.zhName} · {displayRole}
        </div>
      </div>
      <div
        style={{
          alignItems: "center",
          background: "#FFFFFF",
          border: "1px solid #EEF2F7",
          borderRadius: 7,
          display: "flex",
          justifyContent: "center",
          minHeight: compact ? 66 : 92,
          padding: compact ? 4 : 6,
        }}
      >
        <MoleculeStructureImage moleculeId={moleculeId} compact={compact} />
      </div>
    </div>
  )
}
