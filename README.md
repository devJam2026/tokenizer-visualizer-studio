# Tokenizer Visualizer Studio

An interactive, responsive full-stack web application designed to analyze, visualize, and compare how different text tokenization algorithms (BPE for OpenAI, SentencePiece for LLaMA, and WordPiece for Google BERT) slice unstructured text into discrete numeric token IDs.

This studio serves as a diagnostic profiling workbench for software engineers to optimize prompt footprints, detect token script inflation overhead, and evaluate active API pricing scaling before executing LLM cloud roundtrips.

---

## 🚀 Quick Start Guide

To run the full-stack application locally, start both the backend FastAPI service and the frontend Next.js dev server:

### 1. Start the Python FastAPI Backend (Port 8000)
Open a terminal, navigate to the `backend` folder, and run:
```bash
# Navigate to the backend directory
cd backend

# Install dependencies (fastapi, uvicorn, tiktoken, transformers)
pip install -r requirements.txt

# Start the API server
python run.py
```
*The FastAPI backend will spin up on **http://127.0.0.1:8000** with reload enabled.*

### 2. Start the Next.js Frontend (Port 3000 / 3001)
Open a second terminal, navigate to the `frontend` folder, and run:
```bash
# Navigate to the frontend directory
cd frontend

# Launch Next.js dev server
npm run dev
```
*The React dashboard web app will boot up on **http://localhost:3000** (or **http://localhost:3001** if port 3000 is occupied).*

---

## 📁 Repository Structure

```
tokenizer-visualizer-studio/
├── README.md                 # Project quick-start, local startup commands, and guide.
├── .gitignore                # Filters node_modules, build artifacts, and caches.
├── .env.example              # Development environment configurations.
├── docs/
│   └── system_design.md      # In-depth system design, BPE math alignment, and fallback logic.
├── backend/
│   ├── requirements.txt      # Python dependencies (fastapi, uvicorn, tiktoken, transformers, openai).
│   ├── run.py                # Server execution entry point.
│   ├── main.py               # REST API endpoints, pricing metrics, and AI profiling routes.
│   ├── tokenizer_service.py  # Slicing engines and offline fallback heuristics.
│   └── openai_service.py     # OpenAI client wrapper for prompt optimizations.
└── frontend/
    ├── package.json          # Next.js npm dependencies.
    ├── next.config.ts        # Rewrites /api/* request proxies to localhost:8000.
    ├── tsconfig.json         # Module alias overrides.
    └── src/
        ├── app/
        │   ├── layout.tsx    # SEO metadata titles and layouts.
        │   ├── globals.css   # Custom Outfit typography, backgrounds, and scrollbars.
        │   └── page.tsx      # Central dashboard orchestrator.
        └── components/
            ├── MetricsGrid.tsx  # Character, Token, Ratio, and Cost statistic cards.
            ├── CompareBar.tsx   # Interactive horizontal comparative charts.
            ├── TokenCanvas.tsx  # Alternating token highlight chips and inspector tooltips.
            ├── ApiKeySettings.tsx # Secure client-side local storage API Key controller.
            ├── CostCalculator.tsx # Dynamic sliding prompt billing calculator and gauges.
            └── AIStudio.tsx     # Tabbed AI diagnostics and side-by-side prompt optimizations.
```

---

## 📚 Technical Documentation & System Design

For a deep dive into the underlying tokenization logic, sub-word BPE, WordPiece, and SentencePiece comparatives, and the **UTF-8 character-byte offset alignment mathematics**, open:
👉 **[docs/system_design.md](docs/system_design.md)**

---

## ⚡ Key Features

*   **Multi-Model Switch Selector:** Switch dynamically between OpenAI GPT-4, GPT-4o, Meta LLaMA 3, and Google BERT.
*   **Interactive Tokenized Canvas:** Chips automatically color-code alternating character splits with hovering tooltips inspect cards.
*   **Whitespace & Layout Debugger:** Renders layout dead-air like standard tabs (`⇥ `), returns (`↵`), and spaces (`·`) physically, helping you minify prompts.
*   **Live Tokenomics Report:** Computes character length, token metrics, compression ratios, and pricing per 1 Million API requests.
*   **Token Inflation Presets:** Includes instant mock loaders for Hindi, Bengali, Cyrillic, Emojis, and python code blocks.
*   **Offline Resilience Fallbacks:** Seamlessly runs native Python subword simulation splits if offline or if transformers download fails.
*   **🤖 Premium AI Diagnostics & Optimizer (V3):** Explains why a prompt has a high token footprint, analyzes structural waste, and optimizes prompt redundancy to save up to 45% of prompt tokens.
*   **🔒 Secure API Key Isolation:** OpenAI keys are processed client-side strictly inside standard `localStorage` and sent on the fly via request headers, eliminating server persistence.
*   **📶 Hybrid Rule-Based Diagnostic Engine:** Compiles high-quality tokenomics reports offline, checking whitespace density and BPE byte expansion script factors without needing a key.
*   **📊 Dynamic Cost Budget Planner:** Adjusts expected monthly queries and completion lengths using sliding controllers to estimate production costs in real-time.

