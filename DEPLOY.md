# EcoMOF-AI — Deployment Guide

Live URL: **https://linus-he.github.io/ecomof-ai**

---

## 1. 前端部署到 GitHub Pages（5 分钟）

### 第一步：创建 GitHub 仓库
```bash
# 在 GitHub 上创建新仓库: Linus-He/ecomof-ai
# 然后在本地:
cd ecomof-ai
git init
git add .
git commit -m "feat: initial EcoMOF-AI release"
git remote add origin https://github.com/Linus-He/ecomof-ai.git
git push -u origin main
```

### 第二步：开启 GitHub Pages
1. 进入仓库 → **Settings → Pages**
2. Source 选择 **GitHub Actions**
3. 保存 → 等待 2-3 分钟

首次 push 后 GitHub Actions 会自动构建并部署。

---

## 2. ML 后端部署到 Hugging Face Spaces（可选，提升精度）

### 第一步：注册 Hugging Face 账号
前往 https://huggingface.co 注册（免费）

### 第二步：创建 Space
1. 点击 **New Space**
2. 名称: `ecomof-ai`
3. SDK: **Docker**
4. Visibility: Public

### 第三步：上传 backend/ 文件夹内容
```bash
# 安装 huggingface_hub
pip install huggingface_hub

# 上传
from huggingface_hub import HfApi
api = HfApi()
api.upload_folder(
    folder_path="backend/",
    repo_id="YOUR_HF_USERNAME/ecomof-ai",
    repo_type="space"
)
```

需要添加 `Dockerfile` 到 backend/（见下方）

### 第四步：添加 Dockerfile
在 `backend/` 目录创建 `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
RUN python train_model.py
EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
```

### 第五步：配置 API URL
1. 获取你的 Space URL，格式为: `https://YOUR_HF_USERNAME-ecomof-ai.hf.space`
2. 在 GitHub 仓库 → Settings → Secrets → Actions → New repository secret
   - Name: `VITE_API_URL`
   - Value: `https://YOUR_HF_USERNAME-ecomof-ai.hf.space`
3. 重新 push 或手动触发 Actions → 前端自动连接后端

---

## 3. 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器 (http://localhost:5173/ecomof-ai/)
npm run dev

# 构建生产版本
npm run build

# 本地预览构建结果
npm run preview
```

---

## 4. 项目结构

```
ecomof-ai/
├── src/
│   ├── App.jsx          # 主界面（4个功能Tab）
│   ├── main.jsx         # React 入口
│   └── index.css        # 全局样式
├── backend/
│   ├── app.py           # FastAPI 后端
│   ├── train_model.py   # 模型训练脚本（CoRE-2019）
│   └── requirements.txt
├── .github/
│   └── workflows/
│       └── deploy.yml   # 自动部署
├── vite.config.js
├── package.json
└── DEPLOY.md
```

---

## 5. 技术栈与数据说明

| 层 | 技术 |
|---|---|
| 前端框架 | React 18 + Vite |
| 可视化 | Recharts |
| 数据来源 | Static JSON in `public/data/` |
| 评分模型 | Rule-based multi-criteria scoring |
| 部署：前端 | GitHub Pages (static, no real database API) |
| 可选后端 | FastAPI + Hugging Face Spaces (future-facing) |

### 数据模式说明

- **Demo Dataset** (`mof_candidates_demo.json`): 演示 / placeholder / rule-based 记录，是默认模式，保证现有展示效果。
- **Real Seed Dataset** (`mof_candidates_real_seed.json`): 真实数据接入框架，含少量 skeleton records，字段以 null / 待整理为主，不代表完整 MOF 数据库。
- **Catalysis Data Template CSV**: 前端生成，点击下载，无需后端。文件名 `catalysis_data_template.csv`。

### 机器学习后端说明（可选，未来）

可选后端需要满足以下条件才能启用 ML 评估：

- 足够数量的带标签实验或文献数据（labeled experimental or literature data）；
- 完整的特征描述符和目标标签对；
- 训练好的模型工件（model artifacts）。

当前版本不依赖真实数据库 API，不含已训练机器学习模型，不声明 ML 指标。

---

## 6. 引用

如在学术工作中使用，请引用：

```bibtex
@software{ecomof_ai_2024,
  author = {He, Linus},
  title  = {EcoMOF-AI: Staged MOF Decision Support Prototype},
  year   = {2024},
  url    = {https://github.com/Linus-He/ecomof-ai}
}
```

CoRE-2019 Database:
```bibtex
@article{chung2019core,
  title   = {CoRE MOF 2019},
  author  = {Chung, Yongchul G. and others},
  journal = {J. Chem. Eng. Data},
  year    = {2019},
  volume  = {64},
  pages   = {5985--5998}
}
```
