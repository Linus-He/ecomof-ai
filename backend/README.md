# EcoMOF-AI Backend

FastAPI scaffold for moving the static prototype toward a data-backed research tool.

## Install

```bash
cd backend
python -m pip install -r requirements.txt
```

## Run API

```bash
cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 7860
```

Then set the frontend environment variable:

```bash
VITE_API_URL=http://localhost:7860 npm run dev
```

## Train Models

```bash
cd backend
python train_model.py
```

The trainer reads:

- `../data/mof_structures.csv`
- `../data/adsorption_labels.csv`

It writes:

- `backend/models/ecomof_model.pkl`
- `backend/models/rf_model.pkl`
- `backend/models/gbm_model.pkl`
- `backend/models/training_manifest.json`

The bundled seed data is not publication-grade. Replace it with verified CoRE/QMOF descriptors and NIST/GCMC/literature adsorption labels before treating the model as scientific evidence.

## Key Endpoints

- `POST /predict`
- `GET /database/structures`
- `GET /database/adsorption-labels`
- `GET /database/lca-inventory`
- `GET /descriptors/schema`
- `POST /descriptors`
- `GET /report/template`
