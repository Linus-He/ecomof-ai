import { useMemo, useState } from "react"
import {
  useT, useLang, useViewport,
  toolbarBtn, BasisBadge, PageHeader, ResultLayer, Callout, MethodDrawer,
} from "../../shared"

const CATALYSIS_TASKS = [
  { id: "co2-hydrogenation", name: "CO2 hydrogenation", zh: "CO2 加氢转化候选", focus: "Lewis acid/base pair + thermal stability", focusZh: "Lewis 酸/碱位点 + 热稳定性线索" },
  { id: "olefin-epoxidation", name: "Olefin epoxidation", zh: "烯烃环氧化候选", focus: "redox-active node + accessible pore", focusZh: "氧化还原活性节点 + 可进入孔道" },
  { id: "photoredox-co2", name: "Photoredox CO2 reduction", zh: "光/电催化 CO2 还原候选", focus: "photoactive linker + charge-transfer cue", focusZh: "光活性连接体 + 电荷转移线索" },
]

const CATALYSIS_MOCK = [
  { name: "UiO-66-NH2", metal: "Zr4+", linker: "NH2-BDC", site: "Lewis acid + amine", stability: "high", evidenceRank: 2, taskFit: { "co2-hydrogenation": 8.1, "olefin-epoxidation": 5.8, "photoredox-co2": 7.4 }, reasons: ["amine site", "Zr cluster stability", "post-synthetic tuning"], evidence: "medium evidence: literature analogs + descriptor rule" },
  { name: "PCN-222", metal: "Zr4+", linker: "TCPP", site: "porphyrinic linker", stability: "medium", evidenceRank: 2, taskFit: { "co2-hydrogenation": 6.6, "olefin-epoxidation": 6.2, "photoredox-co2": 8.3 }, reasons: ["photoactive linker", "large channels", "metalation route"], evidence: "medium evidence: literature analogs" },
  { name: "HKUST-1", metal: "Cu2+", linker: "BTC", site: "open Cu site", stability: "medium", evidenceRank: 2, taskFit: { "co2-hydrogenation": 6.9, "olefin-epoxidation": 7.5, "photoredox-co2": 5.6 }, reasons: ["open metal site", "accessible pore", "moisture sensitivity"], evidence: "medium evidence: benchmark material" },
  { name: "MOF-74-Mg", metal: "Mg2+", linker: "DOBDC", site: "open Mg site", stability: "medium", evidenceRank: 1, taskFit: { "co2-hydrogenation": 6.7, "olefin-epoxidation": 5.3, "photoredox-co2": 4.8 }, reasons: ["strong adsorption site", "thermal cue", "catalysis evidence sparse"], evidence: "low-medium evidence: adsorption analogs" },
  { name: "Fe-MIL-100", metal: "Fe3+", linker: "BTC", site: "Fe oxo cluster", stability: "medium", evidenceRank: 2, taskFit: { "co2-hydrogenation": 6.4, "olefin-epoxidation": 8.0, "photoredox-co2": 5.8 }, reasons: ["redox-active node", "mesoporous cage", "needs route validation"], evidence: "medium evidence: catalytic analogs" },
  { name: "NU-1000", metal: "Zr4+", linker: "TBAPy", site: "Zr node + pyrene linker", stability: "high", evidenceRank: 1, taskFit: { "co2-hydrogenation": 7.0, "olefin-epoxidation": 6.8, "photoredox-co2": 7.2 }, reasons: ["stable Zr node", "large pore", "functionalization handle"], evidence: "low-medium evidence: descriptor rule + analogs" },
]

function translateEvidence(text, lang) {
  if (lang !== "zh") return text
  if (text.startsWith("medium evidence: literature analogs + descriptor rule")) return "中等证据：文献类似体系 + 描述符规则"
  if (text.startsWith("medium evidence: literature analogs")) return "中等证据：文献类似体系"
  if (text.startsWith("medium evidence: benchmark material")) return "中等证据：基准材料"
  if (text.startsWith("medium evidence: catalytic analogs")) return "中等证据：催化类似体系"
  return "低-中证据：描述符规则 / 吸附类似体系"
}

function translateCatalysisReason(reason, lang) {
  if (lang !== "zh") return reason
  const map = {
    "amine site": "胺基位点",
    "Zr cluster stability": "Zr 簇稳定性",
    "post-synthetic tuning": "后修饰空间",
    "photoactive linker": "光活性连接体",
    "large channels": "大孔道",
    "metalation route": "金属化路线",
    "open metal site": "开放金属位点",
    "accessible pore": "可进入孔道",
    "moisture sensitivity": "湿度敏感需复核",
    "strong adsorption site": "强吸附位点",
    "thermal cue": "热稳定线索",
    "catalysis evidence sparse": "催化证据稀疏",
    "redox-active node": "氧化还原活性节点",
    "mesoporous cage": "介孔笼",
    "needs route validation": "路线需要验证",
    "stable Zr node": "稳定 Zr 节点",
    "large pore": "大孔结构",
    "functionalization handle": "可功能化位点",
  }
  return map[reason] || reason
}

function translateActiveSite(site, lang) {
  if (lang !== "zh") return site
  const map = {
    "Lewis acid + amine": "Lewis 酸位点 + 胺基",
    "porphyrinic linker": "卟啉连接体",
    "open Cu site": "开放 Cu 位点",
    "open Mg site": "开放 Mg 位点",
    "Fe oxo cluster": "Fe-oxo 簇",
    "Zr node + pyrene linker": "Zr 节点 + 芘基连接体",
  }
  return map[site] || site
}

function evidenceTone(text) {
  if (/medium|中等/i.test(text)) return "info"
  return "proxy"
}

function CatalysisResultCard({ candidate, task, onDetails }) {
  const t = useT()
  const { lang } = useLang()
  const score = candidate.taskFit[task.id]
  return (
    <article className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14, display: "grid", gap: 11 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div>
          <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 880 }}>{candidate.name}</div>
          <div style={{ color: t.faint, fontSize: 11, marginTop: 3 }}>{candidate.metal} · {candidate.linker}</div>
        </div>
        <BasisBadge tone={score >= 8 ? "calc" : score >= 7 ? "info" : "proxy"}>{score.toFixed(1)} {lang === "zh" ? "潜力" : "potential"}</BasisBadge>
      </div>
      <div>
        <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>{lang === "zh" ? "适合任务" : "Suitable task"}</div>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>{lang === "zh" ? task.zh : task.name}</div>
      </div>
      <div>
        <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>{lang === "zh" ? "关键原因" : "Key reasons"}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {candidate.reasons.slice(0, 3).map(reason => (
            <span key={reason} style={{ color: t.subtle, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, padding: "4px 8px", fontSize: 10, fontWeight: 750 }}>{translateCatalysisReason(reason, lang)}</span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <BasisBadge tone={evidenceTone(translateEvidence(candidate.evidence, lang))}>{translateEvidence(candidate.evidence, lang)}</BasisBadge>
        <button type="button" onClick={() => onDetails(candidate)} style={{ ...toolbarBtn(t), padding: "6px 9px", fontSize: 11 }}>
          {lang === "zh" ? "查看详情" : "View details"}
        </button>
      </div>
    </article>
  )
}

export function CatalysisLabTab() {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [taskId, setTaskId] = useState("co2-hydrogenation")
  const [filters, setFilters] = useState({ minScore: 6.5, stability: "all", evidence: "all" })
  const [selected, setSelected] = useState(null)

  const task = CATALYSIS_TASKS.find(item => item.id === taskId) || CATALYSIS_TASKS[0]
  const candidates = useMemo(() => {
    return CATALYSIS_MOCK
      .filter(item => item.taskFit[taskId] >= Number(filters.minScore))
      .filter(item => filters.stability === "all" || item.stability === filters.stability)
      .filter(item => filters.evidence === "all" || item.evidenceRank >= 2)
      .sort((a, b) => b.taskFit[taskId] - a.taskFit[taskId])
  }, [taskId, filters])
  const activeCandidate = selected || candidates[0]
  const controlStyle = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 10px", color: t.text, fontSize: 12, width: "100%" }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title="CatalysisLab"
        subtitle={lang === "zh"
          ? "第一版使用模拟数据展示催化任务筛选骨架。页面只表达候选、潜力和需要验证，不把评分描述为确定预测结论。"
          : "A mock-data first page for catalysis-task screening. It uses candidate / potential / needs validation language, not deterministic prediction claims."}
        meta={lang === "zh" ? "任务选择器 · 催化筛选条件 · 潜力评分排序 · 候选解释 · 证据等级标记 · 方法说明" : "task selector · catalysis filters · potential score ranking · explanation · evidence badges · method notes"}
        action={<BasisBadge tone="warn">{lang === "zh" ? "模拟数据" : "mock data"}</BasisBadge>}
      />
      <Callout tone="warn">
        {lang === "zh"
          ? "催化潜力评分是候选优先级信号。它不能替代反应测试、动力学、选择性测定、循环稳定性或真实机理研究。"
          : "Catalysis Potential Score is a candidate-priority signal. It does not replace reaction testing, kinetics, selectivity measurement, cycling stability, or mechanistic study."}
      </Callout>

      <ResultLayer number="01" title={lang === "zh" ? "催化任务选择器" : "Catalysis Task Selector"}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          {CATALYSIS_TASKS.map(item => (
            <button key={item.id} type="button" onClick={() => { setTaskId(item.id); setSelected(null) }} style={{
              textAlign: "left",
              background: taskId === item.id ? t.badgeInfoBg : t.panel,
              border: `1px solid ${taskId === item.id ? t.borderStrong : t.border}`,
              borderRadius: 8,
              padding: 13,
              cursor: "pointer",
              color: t.text,
            }}>
              <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 850 }}>{lang === "zh" ? item.zh : item.name}</div>
              <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.5, marginTop: 6 }}>{lang === "zh" ? item.focusZh : item.focus}</div>
            </button>
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="02" title={lang === "zh" ? "催化筛选条件" : "Catalysis Filters"}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
            {lang === "zh" ? "最低潜力分" : "Minimum potential score"}
            <input type="number" min="0" max="10" step="0.1" value={filters.minScore} onChange={e => setFilters(prev => ({ ...prev, minScore: e.target.value }))} style={controlStyle} />
          </label>
          <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
            {lang === "zh" ? "稳定性线索" : "Stability cue"}
            <select value={filters.stability} onChange={e => setFilters(prev => ({ ...prev, stability: e.target.value }))} style={controlStyle}>
              <option value="all">{lang === "zh" ? "全部" : "all"}</option>
              <option value="high">{lang === "zh" ? "高稳定性候选" : "high-stability candidates"}</option>
              <option value="medium">{lang === "zh" ? "中等稳定性候选" : "medium-stability candidates"}</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
            {lang === "zh" ? "证据等级" : "Evidence level"}
            <select value={filters.evidence} onChange={e => setFilters(prev => ({ ...prev, evidence: e.target.value }))} style={controlStyle}>
              <option value="all">{lang === "zh" ? "全部候选" : "all candidates"}</option>
              <option value="medium">{lang === "zh" ? "中等证据优先" : "medium evidence first"}</option>
            </select>
          </label>
        </div>
      </ResultLayer>

      <ResultLayer number="03" title={lang === "zh" ? "催化潜力评分排序" : "Catalysis Potential Score Ranking"}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          {candidates.map(candidate => (
            <CatalysisResultCard key={candidate.name} candidate={candidate} task={task} onDetails={setSelected} />
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="04" title={lang === "zh" ? "候选解释" : "Candidate Explanation"}>
        {activeCandidate && (
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12 }}>
            <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
              <BasisBadge tone="info">{activeCandidate.taskFit[task.id].toFixed(1)} {lang === "zh" ? "潜力" : "potential"}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850, marginTop: 10 }}>{activeCandidate.name}</div>
              <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>{lang === "zh" ? "该候选只表示值得进入下一轮催化任务评估。" : "This candidate only indicates a worthwhile next-round catalysis evaluation."}</div>
            </div>
            <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
              <BasisBadge tone="proxy">{lang === "zh" ? "活性位点线索" : "Active-site cue"}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850, marginTop: 10 }}>{translateActiveSite(activeCandidate.site, lang)}</div>
              <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>{lang === "zh" ? "需要通过反应测试和表征确认真实活性位点。" : "Reaction testing and characterization are needed to confirm the actual active site."}</div>
            </div>
            <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
              <BasisBadge tone={evidenceTone(translateEvidence(activeCandidate.evidence, lang))}>{translateEvidence(activeCandidate.evidence, lang)}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850, marginTop: 10 }}>{lang === "zh" ? "证据等级" : "Evidence level"}</div>
              <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>{lang === "zh" ? "证据等级用于提醒结果可信边界，不代表已完成实验验证。" : "Evidence level marks confidence boundaries; it does not mean experimental validation is complete."}</div>
            </div>
          </div>
        )}
      </ResultLayer>

      <ResultLayer number="05" title={lang === "zh" ? "方法说明" : "Method Notes"}>
        <MethodDrawer title={lang === "zh" ? "第一版评分规则" : "First-version scoring rule"}>
          {lang === "zh" ? "当前 CatalysisLab 使用模拟数据和描述符规则：任务适配、活性位点线索、稳定性线索和证据等级。后续应替换为反应数据、转化率、选择性、TOF、循环稳定性和结构表征。" : "Current CatalysisLab uses mock data and descriptor rules: task fit, active-site cue, stability cue, and evidence level. It should later be replaced by reaction data, conversion, selectivity, TOF, cycling stability, and characterization."}
        </MethodDrawer>
      </ResultLayer>
    </div>
  )
}
