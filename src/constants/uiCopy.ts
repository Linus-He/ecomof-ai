// @ts-nocheck
export const UI_COPY = {
  buttons: {
    start: { zh: "开始", en: "Start" },
    enter: { zh: "进入", en: "Enter" },
    run: { zh: "运行", en: "Run" },
    browse: { zh: "浏览", en: "Browse" },
    view: { zh: "查看", en: "View" },
    read: { zh: "阅读", en: "Read" },
    learn: { zh: "了解", en: "Learn" },
    interpret: { zh: "解读", en: "Interpret" },
    viewReason: { zh: "查看原因", en: "View reason" },
    plan: { zh: "规划", en: "Plan" },
    viewValidation: { zh: "查看验证", en: "View validation" },
    readMethodology: { zh: "阅读方法论", en: "Read methodology" },
    viewMethodEvidence: { zh: "查看方法与证据说明", en: "View methods and evidence notes" },
    enterComparator: { zh: "进入对比器", en: "Enter comparator" },
    collaborationContact: { zh: "合作联系", en: "Collaboration contact" },
    enterGasSep: { zh: "进入 GasSep", en: "Enter GasSep" },
    viewScoringMethod: { zh: "查看评分方法", en: "View scoring method" },
  },
  data: {
    pending: { zh: "待补充", en: "pending" },
    demo: { zh: "Demo｜仅用于界面验证", en: "Demo | interface validation only" },
  },
}

export function uiCopy(path, lang = "en") {
  const value = String(path || "").split(".").reduce((acc, key) => acc?.[key], UI_COPY)
  if (!value) return path
  return lang === "zh" ? value.zh : value.en
}
