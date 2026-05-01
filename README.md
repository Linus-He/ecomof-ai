# ecomof-ai

**ecomof-ai is a research-oriented MOF AI prototype platform for early-stage candidate screening, sustainability evaluation, and task-oriented application exploration.**

**ecomof-ai 是一个面向科研合作的 MOF AI 原型平台，用于早期候选材料筛选、可持续性评价和任务导向应用探索。**

[Live demo / 在线工具](https://Linus-He.github.io/ecomof-ai/)

## Project overview

The platform is designed for early research discussion, candidate prioritization, hypothesis generation, and decision support. It keeps the scientific workflow transparent: data source, descriptor meaning, score breakdown, evidence level, limitations, and recommended next validation step should be visible together.

本项目不是最终科研结论生成器，而是一个原型平台：帮助研究者在早期把 MOF 性能线索、可持续性线索和任务适配线索放到同一个可解释界面中，形成下一轮验证优先级。

## Core modules

- **Overview**: platform positioning, module entry, and workflow summary.
- **Performance**: CO2 uptake, selectivity, thermodynamic interpretation, confidence, and validation-oriented next steps.
- **EcoScreen**: LCA / LCC proxy signals, toxicity, cost, robustness, Eco Score ranking, and sustainability explanation.
- **CatalysisLab**: rule-based MOF catalysis candidate prioritization for CO2 conversion, biomass conversion, photocatalysis, electrocatalysis, and custom tasks.
- **MOF Library**: baseline material data, source fields, descriptors, and expandable record details.
- **Methodology**: data contracts, descriptor meaning, scoring rules, Evidence Level, ML evaluation placeholder, limitations, and disclaimer.

## What the platform does

- Supports **Early-stage Screening** and **Candidate Ranking** for MOF candidates.
- Combines performance, stability, sustainability, application fit, and Evidence Level into transparent rule-based scores.
- Shows why a candidate is ranked high, what data supports the ranking, and what should be validated next.
- Preserves existing adsorption, Eco, LCA/LCC, sensitivity, validation, and data-source workflows.

## What the platform does not claim

- It does not replace experimental validation.
- It does not replace rigorous GCMC or strict IAST.
- It does not replace complete industrial LCA or supplier-grade cost assessment.
- It does not provide final catalytic activity, conversion, selectivity, TOF, or durability conclusions.
- Current data may include demo / placeholder / seed records.

## Data structure

Static browser data live in `public/data/`. Current templates include:

- `mof_candidates_demo.json`: demo MOF candidate records with formula, source, metal nodes, topology, pore descriptors, CO2 uptake, band gap, stability, cost/toxicity, catalysis hypotheses, Evidence Level, and limitations.
- `catalysis_tasks.json`: task definitions for CatalysisLab.
- `catalysis_rules.json`: rule descriptions and interpretation boundaries.
- `evidence_levels.json`: Evidence Level meanings and prototype use.
- `scoring_weights.json`: demo weights for the general score and Catalysis Potential Score.
- Existing seed data: `mof_structures.json`, `adsorption_labels.json`, `lca_inventory.json`, `isotherms.json`, and `training_manifest.json`.

All demo data must remain clearly marked as demo / placeholder / rule-based / needs validation.

## Rule-based scoring model

Unified candidate-priority formula:

```text
Final Score =
w1 × Performance
+ w2 × Stability
+ w3 × Sustainability
+ w4 × Application Fit
+ w5 × Evidence Confidence
```

CatalysisLab formula:

```text
Catalysis Potential Score =
w1 × CO2 Affinity
+ w2 × Active Site Potential
+ w3 × Pore Accessibility
+ w4 × Stability
+ w5 × Electronic Property
+ w6 × Sustainability
+ w7 × Evidence Confidence
```

CatalysisLab currently provides rule-based candidate prioritization. The score expresses potential and ranking priority, not final performance prediction.

## ML evaluation plan

The Methodology page reserves placeholder sections for:

- Predicted vs Actual
- Residual Plot
- Feature Importance
- R2 / MAE / RMSE

ML evaluation requires labeled experimental or literature data. If real labels are not available, the interface must not display real-looking model metrics. Any mock visualization must be labeled Demo only / Placeholder.

## Limitations

- Results indicate candidate priority, not final material performance.
- Catalytic performance depends strongly on reaction conditions.
- Sustainability scores do not replace full industrial LCA.
- Adsorption results do not replace rigorous GCMC or IAST.
- Experimental validation is required.

## Development

```bash
npm install
npm run dev
npm run build
```

Optional backend scaffolding exists for future experiments, but the current frontend does not require a real database API or complex backend to run.

## Roadmap

- Replace seed records with validated experimental, literature, or GCMC labels.
- Add auditable data-ingestion workflows for CoRE MOF, QMOF, and curated literature records.
- Train task-specific models only after labeled datasets and validation splits are available.
- Add uncertainty and applicability-domain diagnostics for each task line.
- Replace proxy LCA/LCC assumptions with citable inventory and price datasets.
- Expand CatalysisLab from rule-based prioritization to validated task-specific models when reaction labels exist.

## Contact

- GitHub: [@Linus-He](https://github.com/Linus-He)
- Email: square.hwh@gmail.com
