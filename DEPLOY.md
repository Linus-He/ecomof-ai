# ecomof-ai — Deployment Guide

Live URL: **https://linus-he.github.io/ecomof-ai**

---

## Current architecture

The live version is a **static React + Vite SPA** deployed on GitHub Pages.

- No real database API required
- No complex backend required
- All data is static JSON in `public/data/`
- Rule-based scoring runs entirely in the browser
- Real Seed Dataset is a static JSON framework (`mof_candidates_real_seed.json`)
- Catalysis Data Template CSV download is a frontend-only feature

---

## 1. Deploy to GitHub Pages (5 minutes)

### Step 1 — Clone and install

```bash
git clone https://github.com/Linus-He/ecomof-ai.git
cd ecomof-ai
npm install
```

### Step 2 — Push to GitHub

GitHub Actions automatically builds and deploys on every push to `main`.

The workflow file is at `.github/workflows/deploy.yml`.

### Step 3 — Enable GitHub Pages

1. Go to the repository → **Settings → Pages**
2. Source: **GitHub Actions**
3. Save — first deploy takes 2–3 minutes

---

## 2. Local development

```bash
npm install           # install dependencies
npm run dev           # start dev server at http://localhost:5173/ecomof-ai/
npm run build         # production build to dist/
npm run preview       # preview the build locally
```

---

## 3. Project structure

```
ecomof-ai/
├── public/
│   └── data/                   # static JSON data files
│       ├── mof_candidates_demo.json
│       ├── mof_candidates_real_seed.json
│       ├── catalysis_tasks.json
│       ├── evidence_levels.json
│       └── scoring_weights.json
├── src/
│   ├── App.jsx                 # root layout and routing
│   ├── shared.js               # barrel re-exports
│   ├── components/
│   │   ├── tabs/               # one file per module tab
│   │   ├── charts/             # reusable chart components
│   │   ├── ui/                 # shared UI components
│   │   └── layout/
│   ├── contexts/               # React contexts (theme, lang, viewport)
│   ├── constants/
│   └── utils/                  # scoring, prediction, labels, etc.
├── .github/workflows/deploy.yml
├── vite.config.js
└── package.json
```

---

## 4. Tech stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite |
| Visualization | Recharts |
| Data | Static JSON in `public/data/` |
| Scoring model | Rule-based multi-criteria scoring (browser-side) |
| Dataset modes | Demo Dataset / Real Seed Dataset toggle |
| CSV template | Browser-generated via Blob (no backend) |
| Deploy: frontend | GitHub Pages (static, no server) |

---

## 5. Data modes

| Mode | File | Description |
|---|---|---|
| Demo Dataset | `mof_candidates_demo.json` | Demo / placeholder / rule-based records. Default. |
| Real Seed Dataset | `mof_candidates_real_seed.json` | Skeleton records for future curation. Null fields display as "Pending curation". |

Both modes are toggled in the browser. No rebuild or server change is required.

---

## 6. Optional future ML backend

An ML backend is **not required** for the current deployed version.

If a real ML backend is added in the future, it requires:

- Sufficient labeled experimental or literature data
- Trained model artifacts (not placeholder scripts)
- A real inference API endpoint served separately from the static frontend

Until labeled experimental or literature data are available, ML evaluation remains a placeholder. The platform does not and should not display fabricated model metrics.

---

## 7. Citation

```bibtex
@software{ecomof_ai_2025,
  author = {He, Linus},
  title  = {ecomof-ai: Research-oriented MOF screening prototype},
  year   = {2025},
  url    = {https://github.com/Linus-He/ecomof-ai}
}
```
