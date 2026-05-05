import { useT, useLang, useViewport, BasisBadge, BrandMark, CopyLinkButton } from "../../shared"
import { toolbarBtn } from "../../utils/styles"

export function HomeTab({ setActiveTab, onContactOpen }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()

  /* ── data ─────────────────────────────────────────────────────────── */

  const whatYouCanDo = [
    {
      id: "screen",
      icon: "🔍",
      tag: lang === "zh" ? "原型" : "Prototype",
      title: lang === "zh" ? "筛选 MOF 候选材料" : "Screen MOF candidates",
      body: lang === "zh"
        ? "按吸附性能、可持续性或催化适配性对候选材料进行优先级排序。分数反映候选优先级，不代表验证结论。"
        : "Rank candidates by adsorption performance, sustainability, or catalysis fit. Scores express candidate priority, not validated predictions.",
    },
    {
      id: "inspect",
      icon: "📋",
      tag: lang === "zh" ? "整理" : "Curation",
      title: lang === "zh" ? "检查描述符完整性" : "Inspect descriptor completeness",
      body: lang === "zh"
        ? "查看哪些字段已整理、哪些待整理，以及每个描述符携带的证据等级。"
        : "See which fields are curated, which are pending, and what evidence level each descriptor carries.",
    },
    {
      id: "provenance",
      icon: "🔗",
      tag: lang === "zh" ? "溯源" : "Provenance",
      title: lang === "zh" ? "追溯数据来源" : "Trace data provenance",
      body: lang === "zh"
        ? "了解每个描述符来自哪里：来源类型、数据库引用、测量条件和整理状态。"
        : "Know where each descriptor comes from: source type, database reference, measurement condition, and curation state.",
    },
  ]

  const coreModules = [
    {
      id: "mofLibrary",
      hash: "library",
      name: lang === "zh" ? "MOF Library" : "MOF Library",
      desc: lang === "zh" ? "描述符整理与字段级溯源" : "Descriptor curation & field-level provenance",
    },
    {
      id: "ecoscreen",
      hash: "ecoscreen",
      name: "EcoScreen",
      desc: lang === "zh" ? "可持续性与 Eco Score 筛选" : "Sustainability & eco-score screening",
    },
    {
      id: "performance",
      hash: "performance",
      name: "Performance",
      desc: lang === "zh" ? "吸附性能与候选排序" : "Adsorption performance & candidate ranking",
    },
    {
      id: "catalysis",
      hash: "catalysis",
      name: "CatalysisLab",
      desc: lang === "zh" ? "催化任务导向候选优先级" : "Catalysis task-oriented prioritization",
    },
    {
      id: "methodology",
      hash: "methodology",
      name: lang === "zh" ? "Methodology" : "Methodology",
      desc: lang === "zh" ? "评分公式、证据等级与限制说明" : "Scoring formulas, evidence levels & limitations",
    },
    {
      id: "benchmark-references",
      hash: "benchmark-references",
      name: lang === "zh" ? "Benchmark References" : "Benchmark References",
      desc: lang === "zh" ? "上下文参考材料（UiO-66、ZIF-8、MIL-53）" : "Contextual anchors: UiO-66, ZIF-8, MIL-53(Al)",
    },
  ]

  const forUsers = [
    {
      id: "mof",
      tag: lang === "zh" ? "Research" : "Research",
      role: lang === "zh" ? "MOF 研究者" : "MOF researchers",
      body: lang === "zh"
        ? "早期候选材料优先级筛选，含字段级数据溯源和透明评分假设。结果须经独立实验验证。"
        : "Early-stage candidate prioritization with field-level data provenance and transparent scoring assumptions. Results require independent experimental validation.",
    },
    {
      id: "lca",
      tag: lang === "zh" ? "Sustainability" : "Sustainability",
      role: lang === "zh" ? "LCA 研究者" : "LCA researchers",
      body: lang === "zh"
        ? "可持续性导向筛选，含 Eco Score 分项、限制说明和候选比较——不替代完整工业 LCA。"
        : "Sustainability-oriented screening with eco-score components, limitations, and candidate comparisons — not a replacement for full industrial LCA.",
    },
    {
      id: "ml",
      tag: lang === "zh" ? "Informatics" : "Informatics",
      role: lang === "zh" ? "ML / 信息学研究者" : "ML / informatics researchers",
      body: lang === "zh"
        ? "探索描述符整理框架、数据模式分离和溯源追踪，作为未来数据接入的基础。当前不是已训练的预测模型。"
        : "Explore the descriptor curation framework, data mode separation, and provenance tracking as a foundation for future data ingestion. Not a trained predictive model.",
    },
    {
      id: "student",
      tag: lang === "zh" ? "Portfolio" : "Portfolio",
      role: lang === "zh" ? "学生 / 作品集展示" : "Students / portfolio",
      body: lang === "zh"
        ? "与展示 MOF 筛选工作流、评分透明度和数据限制说明的真实科研原型交互。"
        : "Interact with a real-world prototype showing MOF screening workflow, scoring transparency, and explicit data limitations.",
    },
    {
      id: "collab",
      tag: lang === "zh" ? "Collaboration" : "Collaboration",
      role: lang === "zh" ? "潜在合作者" : "Potential collaborators",
      body: lang === "zh"
        ? "在讨论数据提交或联合开发之前，查看平台的当前范围、数据结构和方法说明。"
        : "Review the platform's current scope, data structure, and methodology before discussing data submissions or joint development.",
    },
  ]

  /* ── shared card base ─────────────────────────────────────────────── */
  const cardBase = {
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    transition: "box-shadow 0.15s, border-color 0.15s",
  }

  /* ── gradient accent color ───────────────────────────────────────── */
  const featureGradient = `linear-gradient(90deg, ${t.accent}55 0%, ${t.accent}22 60%, transparent 100%)`

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 32 : 44 }}>

      {/* ═══════════════════════════════════════════════════════════════
          1. HERO
      ═══════════════════════════════════════════════════════════════ */}
      <section style={{ paddingTop: isMobile ? 20 : 36, paddingBottom: isMobile ? 4 : 8 }}>
        {/* brand + title */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 12 : 20,
          marginBottom: 18,
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
              fontSize: isMobile ? 26 : 32,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
            }}>
              EcoMOF-AI
            </h1>
            <p style={{ margin: "5px 0 0", color: t.muted, fontSize: isMobile ? 14 : 15, lineHeight: 1.5 }}>
              {lang === "zh"
                ? "面向科研合作的 MOF 候选材料早期筛选与数据溯源原型平台"
                : "Early-stage MOF candidate screening, sustainability evaluation & field-level data provenance"}
            </p>
          </div>
        </div>

        {/* trust cue pill */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: t.badgeInfoBg,
          border: `1px solid ${t.accent}44`,
          borderRadius: 999,
          padding: "5px 12px",
          marginBottom: 20,
        }}>
          <span style={{ color: t.accentText, fontSize: 11, fontWeight: 800, letterSpacing: "0.04em" }}>
            {lang === "zh" ? "研究原型" : "RESEARCH PROTOTYPE"}
          </span>
          <span style={{ color: t.muted, fontSize: 11 }}>·</span>
          <span style={{ color: t.muted, fontSize: 11 }}>
            {lang === "zh"
              ? "透明假设 · 描述符完整性 · 字段级溯源"
              : "Transparent assumptions · Descriptor completeness · Field-level provenance"}
          </span>
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
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
            {lang === "zh" ? "方法说明" : "Read Methodology"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("benchmark-references")}
            style={{ ...toolbarBtn(t), padding: "9px 16px", fontSize: 13, color: t.muted }}
          >
            {lang === "zh" ? "标杆材料参考" : "Benchmark References"}
          </button>
        </div>

        {/* platform boundary note + copy link */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <p style={{
            margin: 0,
            color: t.subtle,
            fontSize: 11,
            lineHeight: 1.6,
            fontStyle: "italic",
            maxWidth: 660,
          }}>
            {lang === "zh"
              ? "平台结果用于早期筛选与假设生成，不替代实验验证、严格 GCMC / IAST 模拟或完整工业 LCA。"
              : "Results are for early-stage screening and hypothesis generation, not a replacement for experimental validation, rigorous GCMC / IAST simulation, or full industrial LCA."}
          </p>
          <CopyLinkButton hash="overview" ariaLabel={lang === "zh" ? "复制 Overview 链接" : "Copy Overview link"} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          2. WHAT CAN YOU DO HERE?
      ═══════════════════════════════════════════════════════════════ */}
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
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: 14,
        }}>
          {whatYouCanDo.map(card => (
            <div
              key={card.id}
              className="content-card"
              style={{
                ...cardBase,
                padding: isMobile ? "18px 16px" : "22px 20px",
                borderTop: `3px solid ${t.accent}`,
                backgroundImage: featureGradient,
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 3px",
                backgroundPosition: "top",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{card.icon}</span>
                <BasisBadge tone="info">{card.tag}</BasisBadge>
              </div>
              <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 820, lineHeight: 1.3 }}>
                {card.title}
              </div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.7, flex: 1 }}>
                {card.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. CORE MODULES
      ═══════════════════════════════════════════════════════════════ */}
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
          gridTemplateColumns: isNarrow ? "1fr" : isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
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

      {/* ═══════════════════════════════════════════════════════════════
          4. FOR DIFFERENT USERS
      ═══════════════════════════════════════════════════════════════ */}
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
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))",
          gap: 10,
        }}>
          {forUsers.map(card => (
            <div
              key={card.id}
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                padding: "13px 15px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: t.accentText, fontSize: 12, fontWeight: 850 }}>{card.role}</span>
                <BasisBadge tone="calc">{card.tag}</BasisBadge>
              </div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65 }}>{card.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          5. CONTACT / COLLABORATION
      ═══════════════════════════════════════════════════════════════ */}
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
            {lang === "zh" ? "阅读方法说明" : "Read Methodology"}
          </button>
        </div>
      </section>

    </div>
  )
}
