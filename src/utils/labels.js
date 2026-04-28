import { ZH_UI_TERMS } from "../constants/uiTerms"

export function zhText(lang, value) {
  if (lang !== "zh" || typeof value !== "string") return value
  return ZH_UI_TERMS[value] || value
}

export function gasLabel(label, lang = "en") {
  if (lang !== "zh") return label
  return String(label)
    .replace("Post-combustion capture", "燃烧后捕集")
    .replace("Natural gas purification", "天然气净化")
    .replace("Olefin / paraffin separation", "烯烃 / 烷烃分离")
    .replace("Acetylene purification — reversal risk", "乙炔纯化 — 反转风险")
    .replace("Hydrogen storage — mid-term", "氢储存 — 中期")
    .replace("Electronic specialty gases (NF₃, SF₆, C₄F₈) — not yet supported", "电子特气（NF₃、SF₆、C₄F₈）— 暂不支持")
}

export function functionalGroupLabel(label, lang = "en") {
  if (lang !== "zh") return label
  return String(label)
    .replace("(Amine)", "（胺基）")
    .replace("(Hydroxyl)", "（羟基）")
    .replace("(Carboxyl)", "（羧基）")
    .replace("(Thiol)", "（巯基）")
    .replace("(Nitro)", "（硝基）")
    .replace("(Fluoro)", "（氟）")
    .replace("(Chloro)", "（氯）")
    .replace("(Bromo)", "（溴）")
    .replace("(Iodo)", "（碘）")
    .replace("(Methyl)", "（甲基）")
    .replace("(Trifluoromethyl)", "（三氟甲基）")
    .replace("(Isopropyl)", "（异丙基）")
    .replace("(Methoxy)", "（甲氧基）")
    .replace("(Pyridyl)", "（吡啶基）")
}
