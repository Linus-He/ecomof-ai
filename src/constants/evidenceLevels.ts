// @ts-nocheck
export const EVIDENCE_LEVEL_COPY = {
  A: {
    zh: "实验或高质量文献",
    en: "experimental or high-quality literature",
    tone: "calc",
  },
  B: {
    zh: "模拟或部分整理数据",
    en: "simulation or partially curated data",
    tone: "info",
  },
  C: {
    zh: "预测、推断或不完整数据",
    en: "predicted, inferred, or incomplete data",
    tone: "warn",
  },
  D: {
    zh: "演示或占位数据",
    en: "demo or placeholder data",
    tone: "proxy",
  },
}

export const DATA_TYPE_COPY = {
  experimental: { zh: "实验数据", en: "experimental", tone: "calc" },
  literature: { zh: "文献数据", en: "literature", tone: "calc" },
  simulation: { zh: "模拟数据", en: "simulation", tone: "info" },
  predicted: { zh: "预测数据", en: "predicted", tone: "warn" },
  ruleBased: { zh: "规则推断", en: "rule-based", tone: "warn" },
  demo: { zh: "演示数据", en: "demo", tone: "proxy" },
  needsValidation: { zh: "待验证", en: "needs validation", tone: "proxy" },
}

export function evidenceLevelCopy(level = "D", lang = "en") {
  const item = EVIDENCE_LEVEL_COPY[String(level || "D").toUpperCase()] || EVIDENCE_LEVEL_COPY.D
  return `${String(level || "D").toUpperCase()}：${lang === "zh" ? item.zh : item.en}`
}

export function dataTypeCopy(type = "", lang = "en") {
  const label = String(type || "").toLowerCase()
  const key = label.includes("experimental") ? "experimental"
    : label.includes("literature") ? "literature"
      : label.includes("simulated") || label.includes("simulation") || label.includes("gcmc") || label.includes("iast") ? "simulation"
        : label.includes("predicted") || label.includes("ml") ? "predicted"
          : label.includes("rule") || label.includes("derived") ? "ruleBased"
            : label.includes("demo") || label.includes("placeholder") ? "demo"
              : "needsValidation"
  const item = DATA_TYPE_COPY[key]
  return lang === "zh" ? item.zh : item.en
}
