import { useMemo } from "react"
import { useT, useLang, useViewport, BrandMark } from "../../shared"
import { toolbarBtn } from "../../utils/styles"

export function HomeTab({ setActiveTab, onContactOpen }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()

  /* ── data ─────────────────────────────────────────────────────────── */

  const whatYouCanDo = useMemo(() => [
    {
      id: "screen",
      number: "01",
      title: lang === "zh" ? "筛选 MOF 候选材料" : "Screen MOF candidates",
      body: lang === "zh"
        ? "按吸附性能、可持续性或催化适配性判断候选优先级。"
        : "Prioritize candidates by adsorption performance, sustainability, or catalysis fit.",
      target: "performance",
    },
    {
      id: "inspect",
      number: "02",
      title: lang === "zh" ? "检查描述符完整性" : "Inspect descriptor completeness",
      body: lang === "zh"
        ? "查看哪些字段已整理、哪些待整理，以及证据等级是否明确。"
        : "See which fields are curated, pending, and supported by evidence levels.",
      target: "mofLibrary",
    },
    {
      id: "provenance",
      number: "03",
      title: lang === "zh" ? "追溯数据来源" : "Trace data provenance",
      body: lang === "zh"
        ? "查看描述符来源、测试条件和整理状态。"
        : "Review descriptor source, measurement condition, and curation status.",
      target: "data-quality-provenance",
    },
    {
      id: "compare",
      number: "04",
      title: lang === "zh" ? "对比候选材料" : "Compare candidates",
      body: lang === "zh"
        ? "选择 2–4 个 MOF 候选材料，横向比较描述符完整性、关键属性、证据等级和溯源覆盖情况。"
        : "Select 2–4 MOF candidates and compare descriptor completeness, key properties, evidence levels, and provenance coverage.",
      tag: lang === "zh" ? "决策支持" : "Decision support",
      target: "mofLibrary",
    },
  ], [lang])

  const coreModules = useMemo(() => [
    {
      id: "mofLibrary",
      hash: "library",
      name: lang === "zh" ? "MOF Library" : "MOF Library",
      desc: lang === "zh" ? "浏览候选材料、查看整理状态，并进入候选材料对比。" : "Browse candidates, inspect curation status, and launch candidate comparison.",
    },
    {
      id: "performance",
      hash: "performance",
      name: "Performance",
      desc: lang === "zh" ? "查看吸附相关候选优先级。" : "Explore adsorption-oriented candidate priority.",
    },
    {
      id: "gassep",
      hash: "gassep",
      name: lang === "zh" ? "气体分离" : "GasSep",
      desc: lang === "zh" ? "带条件说明的气体吸附与分离记录。" : "Condition-aware gas adsorption and separation records.",
    },
    {
      id: "ecoscreen",
      hash: "ecoscreen",
      name: "EcoScreen",
      desc: lang === "zh" ? "查看可持续性筛选信号。" : "Review sustainability screening signals.",
    },
    {
      id: "catalysis",
      hash: "catalysis",
      name: "CatalysisLab",
      desc: lang === "zh" ? "探索催化任务导向候选。" : "Explore catalysis-oriented candidates.",
    },
    {
      id: "methodology",
      hash: "methodology",
      name: lang === "zh" ? "Methods & Evidence" : "Methods & Evidence",
      desc: lang === "zh" ? "阅读评分、证据和限制说明。" : "Read scoring, evidence, and limitations.",
    },
    {
      id: "benchmark-references",
      hash: "benchmark-references",
      name: lang === "zh" ? "Benchmark References" : "Benchmark References",
      desc: lang === "zh" ? "理解常见标杆材料语境。" : "Understand contextual benchmark anchors.",
    },
  ], [lang])

  const forUsers = useMemo(() => [
    {
      id: "mof",
      role: lang === "zh" ? "MOF 研究者" : "MOF researchers",
      body: lang === "zh"
        ? "查看描述符、证据等级和来源。"
        : "Review descriptors, evidence levels, and provenance.",
    },
    {
      id: "lca",
      role: lang === "zh" ? "LCA 研究者" : "LCA researchers",
      body: lang === "zh"
        ? "探索早期筛选中的可持续性信号。"
        : "Explore sustainability signals in early-stage screening.",
    },
    {
      id: "ml",
      role: lang === "zh" ? "材料信息学 / ML 研究者" : "Materials informatics / ML researchers",
      body: lang === "zh"
        ? "检查透明规则优先级和整理结构。"
        : "Inspect transparent rule-based prioritization and curation structure.",
    },
    {
      id: "student",
      role: lang === "zh" ? "学生 / 作品集评审" : "Students / portfolio reviewers",
      body: lang === "zh"
        ? "理解 AI 辅助科研原型工作流。"
        : "Understand an AI-assisted research prototype workflow.",
    },
    {
      id: "collab",
      role: lang === "zh" ? "潜在合作者" : "Potential collaborators",
      body: lang === "zh"
        ? "发现整理、验证和 benchmark 合作机会。"
        : "Find curation, validation, and benchmarking opportunities.",
    },
  ], [lang])

  const workflowSteps = useMemo(() => [
    {
      number: "01",
      title: lang === "zh" ? "整理描述符" : "Curate descriptors",
      body: lang === "zh" ? "把候选材料记录整理为可审计字段。" : "Organize candidate records into auditable fields.",
    },
    {
      number: "02",
      title: lang === "zh" ? "查看溯源" : "Inspect provenance",
      body: lang === "zh" ? "检查来源、条件、证据等级和整理状态。" : "Check source, condition, evidence level, and curation status.",
    },
    {
      number: "03",
      title: lang === "zh" ? "判断候选优先级" : "Prioritize candidates",
      body: lang === "zh" ? "用透明规则辅助早期筛选和假设生成。" : "Use transparent rules for early screening and hypothesis generation.",
    },
  ], [lang])

  const cardBase = useMemo(() => ({
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    transition: "box-shadow 0.15s, border-color 0.15s",
  }), [t])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 30 : 42 }}>
      <section style={{ paddingTop: isMobile ? 24 : 52, paddingBottom: isMobile ? 8 : 16 }}>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 12 : 20,
          marginBottom: 20,
        }}>
          <BrandMark
            size={isMobile ? 52 : 64}
            radius={isMobile ? 13 : 15}
            style={{ boxShadow: t.shadowSm, flexShrink: 0 }}
          />
          <div>
            <h1 style={{
              margin: 0,
              color: t.textStrong,
              fontSize: isMobile ? 32 : 44,
              fontWeight: 700,
              letterSpacing: 0,
              lineHeight: 1.1,
            }}>
              EcoMOF-AI
            </h1>
            <p style={{ margin: "8px 0 0", color: t.textStrong, fontSize: isMobile ? 15 : 17, lineHeight: 1.5, maxWidth: 780 }}>
              Early-stage MOF candidate screening, sustainability evaluation, descriptor curation, and field-level provenance.
            </p>
            <p style={{ margin: "5px 0 0", color: t.muted, fontSize: isMobile ? 13 : 14, lineHeight: 1.55, maxWidth: 780 }}>
              {lang === "zh"
                ? "从这里进入候选材料筛选、对比、数据溯源与方法说明。"
                : "Explore candidate screening, comparison, provenance, and methods from one place."}
            </p>
          </div>
        </div>

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 999,
          padding: "6px 12px",
          marginBottom: 18,
          maxWidth: "100%",
        }}>
          <span style={{ color: t.muted, fontSize: 11, lineHeight: 1.45 }}>
            {lang === "zh"
              ? "非已验证预测引擎 · 透明优先级判断 · 描述符整理 · 字段级溯源"
              : "Not a validated prediction engine · Transparent prioritization · Descriptor curation · Field-level provenance"}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveTab("mofLibrary")}
            style={{
              ...toolbarBtn(t),
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 800,
              border: `1px solid ${t.accent}`,
              color: t.accentText,
            }}
          >
            {lang === "zh" ? "查看 MOF Library →" : "Explore MOF Library →"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mofLibrary")}
            style={{ ...toolbarBtn(t), padding: "9px 16px", fontSize: 13 }}
          >
            {lang === "zh" ? "候选材料对比" : "Compare Candidates"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("data-quality-provenance")}
            style={{ ...toolbarBtn(t), padding: "9px 16px", fontSize: 13 }}
          >
            {lang === "zh" ? "数据溯源" : "Inspect Data Provenance"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("methodology")}
            style={{ ...toolbarBtn(t), padding: "9px 16px", fontSize: 13 }}
          >
            {lang === "zh" ? "方法与证据" : "Methods & Evidence"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("benchmark-references")}
            style={{ ...toolbarBtn(t), padding: "9px 12px", fontSize: 12, color: t.subtle, borderColor: "transparent", background: "transparent" }}
          >
            {lang === "zh" ? "标杆材料参考" : "Benchmark References"}
          </button>
        </div>
      </section>

      <section>
        <div style={{
          color: t.faint,
          fontSize: 10,
          fontWeight: 850,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 14,
        }}>
          {lang === "zh" ? "你可以在这里做什么？" : "What can you do here?"}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))",
          gridAutoRows: "1fr",
          gap: 14,
        }}>
          {whatYouCanDo.map(card => (
            <button
              key={card.id}
              type="button"
              onClick={card.target ? () => setActiveTab(card.target) : undefined}
              aria-label={card.target ? card.title : undefined}
              className="content-card"
              style={{
                all: "unset",
                ...cardBase,
                padding: isMobile ? "18px 16px" : "22px 20px",
                borderTop: `3px solid ${t.accent}`,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minHeight: isMobile ? 0 : 154,
                cursor: card.target ? "pointer" : "default",
                boxSizing: "border-box",
              }}
            >
              <div style={{ color: t.accentText, fontSize: 12, fontWeight: 900, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {card.number}
              </div>
              <div style={{ color: t.textStrong, fontSize: isMobile ? 17 : 19, fontWeight: 850, lineHeight: 1.25 }}>
                {card.title}
              </div>
              <div style={{ color: t.muted, fontSize: 13, lineHeight: 1.6, flex: 1 }}>
                {card.body}
              </div>
              {card.tag && (
                <div style={{ color: t.accentText, fontSize: 11, fontWeight: 850, marginTop: 2 }}>
                  {card.tag} →
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div style={{
          color: t.faint,
          fontSize: 10,
          fontWeight: 850,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 14,
        }}>
          {lang === "zh" ? "核心模块" : "Core Modules"}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))",
          gap: 10,
        }}>
          {coreModules.map(mod => (
            <button
              key={mod.id}
              type="button"
              onClick={() => setActiveTab(mod.id)}
              style={{
                all: "unset",
                cursor: "pointer",
                ...cardBase,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                textAlign: "left",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = t.accent
                e.currentTarget.style.boxShadow = t.shadowSm
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = t.border
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 820, marginBottom: 3 }}>
                  {mod.name}
                </div>
                <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.5 }}>
                  {mod.desc}
                </div>
              </div>
              <span style={{ color: t.faint, fontSize: 14, flexShrink: 0 }}>→</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div style={{
          color: t.faint,
          fontSize: 10,
          fontWeight: 850,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 14,
        }}>
          {lang === "zh" ? "面向不同用户" : "For different users"}
        </div>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}>
          {forUsers.map(card => (
            <div
              key={card.id}
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 999,
                padding: "9px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flex: isNarrow ? "1 1 100%" : "1 1 260px",
                minWidth: 0,
              }}
            >
              <span style={{ color: t.accentText, fontSize: 11, fontWeight: 850, whiteSpace: "nowrap" }}>{card.role}</span>
              <span style={{ color: t.faint, fontSize: 11, lineHeight: 1.45, minWidth: 0 }}>{card.body}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div style={{
          color: t.faint,
          fontSize: 10,
          fontWeight: 850,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 14,
        }}>
          {lang === "zh" ? "筛选工作流" : "Screening Workflow"}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: 10,
        }}>
          {workflowSteps.map(step => (
            <div
              key={step.number}
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                padding: "13px 15px",
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 10,
                alignItems: "start",
              }}
            >
              <span style={{ color: t.faint, fontSize: 11, fontWeight: 900, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {step.number}
              </span>
              <span>
                <span style={{ display: "block", color: t.textStrong, fontSize: 13, fontWeight: 830, lineHeight: 1.3 }}>{step.title}</span>
                <span style={{ display: "block", color: t.muted, fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>{step.body}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        padding: isMobile ? "20px 18px" : "28px 32px",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 20,
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: t.faint,
            fontSize: 10,
            fontWeight: 850,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}>
            {lang === "zh" ? "合作联系" : "Collaboration & Contact"}
          </div>
          <div style={{ color: t.textStrong, fontSize: isMobile ? 16 : 18, fontWeight: 850, lineHeight: 1.2, marginBottom: 10 }}>
            {lang === "zh" ? "讨论数据整合或科研合作" : "Discuss data integration or research collaboration"}
          </div>
          <p style={{ margin: 0, color: t.muted, fontSize: 13, lineHeight: 1.65, maxWidth: 520 }}>
            {lang === "zh"
              ? "如果你希望将 EcoMOF-AI 用于 MOF 筛选、催化数据整理、LCA 评价或科研合作，可以留下联系方式并简述你的数据或研究问题。"
              : "Interested in using EcoMOF-AI for MOF screening, catalysis data curation, LCA evaluation, or research collaboration? Send a short message describing your dataset or research question."}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={onContactOpen}
            style={{
              ...toolbarBtn(t),
              padding: "10px 22px",
              border: `1px solid ${t.accent}`,
              color: t.accentText,
              fontSize: 13,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {lang === "zh" ? "联系 / 合作 →" : "Contact / Collaboration →"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("methodology")}
            style={{
              ...toolbarBtn(t),
              padding: "10px 22px",
              fontSize: 13,
              whiteSpace: "nowrap",
              textAlign: "center",
            }}
          >
            {lang === "zh" ? "阅读方法与证据" : "Read Methods & Evidence"}
          </button>
        </div>
      </section>

    </div>
  )
}
