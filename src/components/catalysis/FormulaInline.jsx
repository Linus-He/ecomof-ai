export const ORGANIC_ACID_FONT = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif'

export const organicAcidPalette = {
  bg: "#FFFFFF",
  surface: "#F8FAFC",
  surfaceStrong: "#F1F5F9",
  border: "#D9E2EC",
  borderStrong: "#B8C5D4",
  text: "#0F172A",
  muted: "#475569",
  faint: "#64748B",
  accent: "#1A6DB5",
  accentSoft: "#E8F2FC",
  positive: "#147C43",
  positiveSoft: "#F2FBF6",
  mixed: "#A15C13",
  mixedSoft: "#FFF7ED",
  risk: "#8F3B1B",
  riskSoft: "#FFF1E8",
}

export const numericTextStyle = {
  fontFamily: ORGANIC_ACID_FONT,
  fontVariantNumeric: "tabular-nums",
}

export function Sub({ children }) {
  return <sub style={{ fontSize: "0.72em", lineHeight: 0 }}>{children}</sub>
}

export function Sup({ children }) {
  return <sup style={{ fontSize: "0.72em", lineHeight: 0 }}>{children}</sup>
}

export function NumericText({ children, style = {} }) {
  return <span style={{ ...numericTextStyle, ...style }}>{children}</span>
}

export function FormulaInline({ children, size = 13, weight = 600, color = organicAcidPalette.text, gap = "4px 7px", wrap = true }) {
  return (
    <div
      style={{
        alignItems: "baseline",
        color,
        display: "flex",
        flexWrap: wrap ? "wrap" : "nowrap",
        fontFamily: ORGANIC_ACID_FONT,
        fontStyle: "normal",
        fontSize: size,
        fontVariantNumeric: "tabular-nums",
        fontWeight: weight,
        gap,
        lineHeight: 1.55,
        minWidth: 0,
      }}
    >
      {children}
    </div>
  )
}

export function FormulaCard({ title, children }) {
  return (
    <div style={{ background: organicAcidPalette.surface, border: `1px solid ${organicAcidPalette.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 12 }}>
      {title ? <div style={{ color: organicAcidPalette.faint, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.04 }}>{title}</div> : null}
      {children}
    </div>
  )
}

export function ChemFormula({ kind }) {
  if (kind === "sodiumBicarbonate") return <>NaHCO<Sub>3</Sub></>
  if (kind === "water") return <>H<Sub>2</Sub>O</>
  if (kind === "bicarbonate") return <>HCO<Sub>3</Sub><Sup>−</Sup></>
  if (kind === "isotopeBicarbonate") return <>NaH<Sup>13</Sup>CO<Sub>3</Sub></>
  return null
}

export function VariableLabel({ name }) {
  const labels = {
    A1: <>A<Sub>1</Sub></>,
    A2: <>A<Sub>2</Sub></>,
    A3: <>A<Sub>3</Sub></>,
    A4: <>A<Sub>4</Sub></>,
    B1: <>B<Sub>1</Sub></>,
    Y_FA: <>Y<Sub>FA</Sub></>,
    S_FA_C: <>S<Sub>FA,C</Sub></>,
    yFormicAcid: <>Y<Sub>FA</Sub></>,
    sFormicCarbon: <>S<Sub>FA,C</Sub></>,
    Y_lactic: <>Y<Sub>lactic</Sub></>,
    Y_acetic: <>Y<Sub>acetic</Sub></>,
    Y_glycolic: <>Y<Sub>glycolic</Sub></>,
    Y_pyruvic: <>Y<Sub>pyruvic</Sub></>,
    Y_solid: <>Y<Sub>solid</Sub></>,
    yLactic: <>Y<Sub>lactic</Sub></>,
    yAcetic: <>Y<Sub>acetic</Sub></>,
    yGlycolic: <>Y<Sub>glycolic</Sub></>,
    yPyruvic: <>Y<Sub>pyruvic</Sub></>,
    ySolid: <>Y<Sub>solid</Sub></>,
    w_lactic: <>w<Sub>lactic</Sub></>,
    C_j: <>C<Sub>j</Sub></>,
    sigma_j: <>σ<Sub>j</Sub></>,
    r_ij: <>r<Sub>ij</Sub></>,
  }

  return labels[name] || name
}

export function DescriptorLabel({ descriptor }) {
  const labels = {
    waterStability: "Water stability",
    hydrothermalStability: "Hydrothermal stability",
    metalLeachingRisk: "Metal leaching risk",
    pxrdRetention: "Post-reaction PXRD retention",
    PLD: "PLD",
    LCD: "LCD",
    poreVolume: "Pore volume",
    hydrophilicPoreEnvironment: "Hydrophilic pore environment",
    metalType: "Metal type",
    valenceState: "Valence state",
    lewisAcidity: "Lewis acidity",
    basicSites: "Basic sites",
    openMetalSites: "Open metal sites",
    amino: <>-NH<Sub>2</Sub></>,
    hydroxyl: "-OH",
    carboxyl: "-COOH",
    defects: "Defects",
    zrHydroxyl: "Zr-OH",
    feHydroxyl: "Fe-OH",
    Eads_HCO3: <>E<Sub>ads</Sub>(HCO<Sub>3</Sub><Sup>−</Sup>)</>,
    Eads_formaldehyde: <>E<Sub>ads</Sub>(formaldehyde)</>,
    Eads_glyceraldehyde: <>E<Sub>ads</Sub>(glyceraldehyde)</>,
    Eads_pyruvaldehyde: <>E<Sub>ads</Sub>(pyruvaldehyde)</>,
    Eads_formate: <>E<Sub>ads</Sub>(formate)</>,
    eadsBicarbonate: <>E<Sub>ads</Sub>(HCO<Sub>3</Sub><Sup>−</Sup>)</>,
    eadsFormaldehyde: <>E<Sub>ads</Sub>(formaldehyde)</>,
    eadsGlyceraldehyde: <>E<Sub>ads</Sub>(glyceraldehyde)</>,
    eadsPyruvaldehyde: <>E<Sub>ads</Sub>(pyruvaldehyde)</>,
    eadsFormate: <>E<Sub>ads</Sub>(formate)</>,
  }

  if (descriptor in labels) return labels[descriptor]
  return <VariableLabel name={descriptor} />
}

export const pathwayMeta = {
  formaldehyde_to_formic: {
    labelZh: "甲醛 → 甲酸",
    labelEn: "Formaldehyde → Formic acid",
    note: "主正路径 Primary C1 positive route",
    color: organicAcidPalette.positive,
  },
  glyceraldehyde_to_formic: {
    labelZh: "甘油醛 → 甲酸",
    labelEn: "Glyceraldehyde → Formic acid",
    note: "混合路径中的正向分支",
    color: organicAcidPalette.mixed,
  },
  glyceraldehyde_to_c2_byproducts: {
    labelZh: "甘油醛 → C2 副产物",
    labelEn: "Glyceraldehyde → C2 byproducts",
    note: "C2 副产物风险",
    color: organicAcidPalette.mixed,
  },
  pyruvaldehyde_to_formic: {
    labelZh: "丙酮醛 → 甲酸",
    labelEn: "Pyruvaldehyde → Formic acid",
    note: "可能正向分支",
    color: organicAcidPalette.risk,
  },
  pyruvaldehyde_to_lactic: {
    labelZh: "丙酮醛 → 乳酸/丙酮酸",
    labelEn: "Pyruvaldehyde → Lactic/Pyruvic acid",
    note: "风险主导分支",
    color: organicAcidPalette.risk,
  },
}

const descriptorDefinitions = [
  { group: "stability", groupZh: "稳定性", groupEn: "Stability", key: "waterStability", labelZh: "水相稳定性", labelEn: "Water stability", unit: "score", usedIn: ["Gate", "A4"] },
  { group: "stability", groupZh: "稳定性", groupEn: "Stability", key: "hydrothermalStability", labelZh: "水热稳定性", labelEn: "Hydrothermal stability", unit: "score", usedIn: ["Gate"] },
  { group: "stability", groupZh: "稳定性", groupEn: "Stability", key: "metalLeachingRisk", labelZh: "金属流失风险", labelEn: "Metal leaching risk", unit: "score", usedIn: ["Gate"] },
  { group: "stability", groupZh: "稳定性", groupEn: "Stability", key: "pxrdRetention", labelZh: "反应后 PXRD 保持度", labelEn: "Post-reaction PXRD retention", unit: "%", usedIn: ["Validation"] },
  { group: "accessibility", groupZh: "可及性", groupEn: "Accessibility", key: "PLD", labelZh: "孔径下限 PLD", labelEn: "PLD", unit: "Å", usedIn: ["Gate", "Accessibility"] },
  { group: "accessibility", groupZh: "可及性", groupEn: "Accessibility", key: "LCD", labelZh: "孔径上限 LCD", labelEn: "LCD", unit: "Å", usedIn: ["Gate", "Accessibility"] },
  { group: "accessibility", groupZh: "可及性", groupEn: "Accessibility", key: "poreVolume", labelZh: "孔体积", labelEn: "Pore volume", unit: "cm3/g", usedIn: ["Gate"] },
  { group: "accessibility", groupZh: "可及性", groupEn: "Accessibility", key: "hydrophilicPoreEnvironment", labelZh: "亲水孔环境", labelEn: "Hydrophilic pore environment", unit: "score", usedIn: ["Gate", "A2"] },
  { group: "activeSite", groupZh: "活性位点", groupEn: "Active-site", key: "metalType", labelZh: "金属类型", labelEn: "Metal type", unit: "", usedIn: ["Gate", "A3"] },
  { group: "activeSite", groupZh: "活性位点", groupEn: "Active-site", key: "valenceState", labelZh: "价态", labelEn: "Valence state", unit: "", usedIn: ["Gate", "A3"] },
  { group: "activeSite", groupZh: "活性位点", groupEn: "Active-site", key: "lewisAcidity", labelZh: "Lewis 酸性", labelEn: "Lewis acidity", unit: "score", usedIn: ["A2", "A3"] },
  { group: "activeSite", groupZh: "活性位点", groupEn: "Active-site", key: "basicSites", labelZh: "碱性位点", labelEn: "Basic sites", unit: "score", usedIn: ["A1", "A2"] },
  { group: "activeSite", groupZh: "活性位点", groupEn: "Active-site", key: "openMetalSites", labelZh: "开放金属位点", labelEn: "Open metal sites", unit: "score", usedIn: ["A3"] },
  { group: "functionalGroup", groupZh: "官能团", groupEn: "Functional-group", key: "amino", labelZh: "-NH2", labelEn: "-NH2", unit: "", usedIn: ["A1", "A2"] },
  { group: "functionalGroup", groupZh: "官能团", groupEn: "Functional-group", key: "hydroxyl", labelZh: "-OH", labelEn: "-OH", unit: "", usedIn: ["A2"] },
  { group: "functionalGroup", groupZh: "官能团", groupEn: "Functional-group", key: "carboxyl", labelZh: "-COOH", labelEn: "-COOH", unit: "", usedIn: ["A2"] },
  { group: "functionalGroup", groupZh: "官能团", groupEn: "Functional-group", key: "defects", labelZh: "缺陷位", labelEn: "Defects", unit: "", usedIn: ["A3", "A4"] },
  { group: "functionalGroup", groupZh: "官能团", groupEn: "Functional-group", key: "zrHydroxyl", labelZh: "Zr-OH", labelEn: "Zr-OH", unit: "", usedIn: ["A2", "A3"] },
  { group: "functionalGroup", groupZh: "官能团", groupEn: "Functional-group", key: "feHydroxyl", labelZh: "Fe-OH", labelEn: "Fe-OH", unit: "", usedIn: ["A2", "A3"] },
  { group: "reaction", groupZh: "反应", groupEn: "Reaction", key: "Eads_HCO3", labelZh: "Eads(HCO₃⁻)", labelEn: "Eads(HCO₃⁻)", unit: "eV", usedIn: ["A3", "Reaction descriptors"] },
  { group: "reaction", groupZh: "反应", groupEn: "Reaction", key: "Eads_formaldehyde", labelZh: "Eads(formaldehyde)", labelEn: "Eads(formaldehyde)", unit: "eV", usedIn: ["A2", "A3"] },
  { group: "reaction", groupZh: "反应", groupEn: "Reaction", key: "Eads_glyceraldehyde", labelZh: "Eads(glyceraldehyde)", labelEn: "Eads(glyceraldehyde)", unit: "eV", usedIn: ["A2", "A3"] },
  { group: "reaction", groupZh: "反应", groupEn: "Reaction", key: "Eads_pyruvaldehyde", labelZh: "Eads(pyruvaldehyde)", labelEn: "Eads(pyruvaldehyde)", unit: "eV", usedIn: ["B1", "Reaction descriptors"] },
  { group: "reaction", groupZh: "反应", groupEn: "Reaction", key: "Eads_formate", labelZh: "Eads(formate)", labelEn: "Eads(formate)", unit: "eV", usedIn: ["A4"] },
  { group: "product", groupZh: "产物", groupEn: "Product", key: "Y_FA", labelZh: "甲酸产率 YFA", labelEn: "YFA", unit: "fraction", usedIn: ["SelectivityFactor", "Ranking"] },
  { group: "product", groupZh: "产物", groupEn: "Product", key: "S_FA_C", labelZh: "甲酸碳选择性 SFA,C", labelEn: "SFA,C", unit: "fraction", usedIn: ["SelectivityFactor", "Ranking"] },
  { group: "product", groupZh: "产物", groupEn: "Product", key: "Y_lactic", labelZh: "乳酸产率 Ylactic", labelEn: "Ylactic", unit: "fraction", usedIn: ["SelectivityFactor", "CRITIC"] },
  { group: "product", groupZh: "产物", groupEn: "Product", key: "Y_acetic", labelZh: "乙酸产率 Yacetic", labelEn: "Yacetic", unit: "fraction", usedIn: ["SelectivityFactor", "CRITIC"] },
  { group: "product", groupZh: "产物", groupEn: "Product", key: "Y_glycolic", labelZh: "乙醇酸产率 Yglycolic", labelEn: "Yglycolic", unit: "fraction", usedIn: ["SelectivityFactor", "CRITIC"] },
  { group: "product", groupZh: "产物", groupEn: "Product", key: "Y_pyruvic", labelZh: "丙酮酸产率 Ypyruvic", labelEn: "Ypyruvic", unit: "fraction", usedIn: ["SelectivityFactor", "CRITIC"] },
  { group: "product", groupZh: "产物", groupEn: "Product", key: "Y_solid", labelZh: "固体副产物 Ysolid", labelEn: "Ysolid", unit: "fraction", usedIn: ["SelectivityFactor", "CRITIC"] },
]

export const descriptorGroupTabs = [
  { key: "all", labelZh: "全部", labelEn: "All" },
  { key: "stability", labelZh: "稳定性", labelEn: "Stability" },
  { key: "accessibility", labelZh: "可及性", labelEn: "Accessibility" },
  { key: "activeSite", labelZh: "活性位点", labelEn: "Active-site" },
  { key: "functionalGroup", labelZh: "官能团", labelEn: "Functional-group" },
  { key: "reaction", labelZh: "反应", labelEn: "Reaction" },
  { key: "product", labelZh: "产物", labelEn: "Product" },
]

export function getDescriptorDefinitions() {
  return descriptorDefinitions
}

export function buildDescriptorRows(candidate) {
  return descriptorDefinitions.map((definition) => {
    const record = candidate?.descriptors?.[definition.key] || null
    return {
      ...definition,
      value: record?.value ?? null,
      unit: record?.unit ?? definition.unit ?? "",
      status: record?.status ?? "pending",
      evidence: record?.evidence ?? "demo placeholder",
      source: record?.source ?? "not yet curated",
      usedIn: Array.isArray(record?.usedIn) && record.usedIn.length ? record.usedIn : definition.usedIn,
    }
  })
}

export function humanizePathway(value) {
  const lookup = {
    formaldehyde_to_formic_acid: "Formaldehyde → formic acid",
    glyceraldehyde_to_formic_acid: "Glyceraldehyde → formic acid",
    glyceraldehyde_to_acetic_acid: "Glyceraldehyde → acetic acid",
    glyceraldehyde_to_glycolic_acid: "Glyceraldehyde → glycolic acid",
    pyruvaldehyde_to_lactic_acid: "Pyruvaldehyde → lactic acid",
    pyruvaldehyde_to_pyruvic_acid: "Pyruvaldehyde → pyruvic acid",
  }
  return lookup[value] || String(value || "pending").replace(/_/g, " ").replace(/\bto\b/g, "→")
}
