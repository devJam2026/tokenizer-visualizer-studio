# Tokenizer Visualizer Studio

An interactive, responsive full-stack web application designed to analyze, visualize, and compare how different text tokenization algorithms (BPE for OpenAI, SentencePiece for LLaMA, and WordPiece for Google BERT) slice unstructured text into discrete numeric token IDs.

This studio serves as a diagnostic profiling workbench for software engineers to optimize prompt footprints, detect token script inflation overhead, and evaluate active API pricing scaling before executing LLM cloud roundtrips.

<img width="1920" height="1410" alt="image" src="https://github.com/user-attachments/assets/72298e9d-7add-4340-97dd-b9b36071aff0" />

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
│   ├── comprehensive_guide.md # High-level guide on how tokenizers and pricing calculations work.
│   ├── learning_insights.md   # GenAI learning path curriculum and hands-on developer exercises.
│   ├── system_design.md      # In-depth system design, parallel tokenization, and fallback simulators.
│   └── images/               # Directory containing system diagrams and visual assets.
├── backend/
│   ├── requirements.txt      # Python dependencies (fastapi, uvicorn, tiktoken, transformers, openai).
│   ├── run.py                # Server execution entry point.
│   ├── main.py               # REST API endpoints, pricing metrics, and AI profiling routes.
│   ├── openai_service.py     # OpenAI client wrapper for prompt optimizations.
│   ├── test_report.txt       # Performance profile run logs and debug outputs.
│   └── tokenizer_service/    # Modular tokenization packages with simulators and alignments.
│       ├── __init__.py       # Package exports exposing primary interfaces and package flags.
│       ├── tokenizer_service.py # Orchestrator dividing and running standard or fallback tokenizers.
│       ├── tiktoken_tokenizer.py # Byte-to-character offset alignment algorithms for GPT-4/GPT-4o.
│       ├── llama_tokenizer.py # Hugging Face or mock simulation split routines for LLaMA 3.
│       ├── bert_tokenizer.py  # WordPiece subword slicing engines for Google BERT.
│       └── heuristic_analyzer.py # Off-line BPE inflation metrics and diagnostic calculators.
└── frontend/
    ├── package.json          # Next.js npm dependencies.
    ├── next.config.ts        # Rewrites /api/* request proxies to localhost:8000.
    ├── tsconfig.json         # Module alias overrides.
    ├── eslint.config.mjs     # ESLint rules configuration.
    ├── postcss.config.mjs    # PostCSS rules configuration.
    └── src/
        ├── app/
        │   ├── layout.tsx    # SEO metadata titles and layouts.
        │   ├── globals.css   # Custom Outfit typography, backgrounds, and scrollbars.
        │   ├── favicon.ico   # Studio browser tab brand icon.
        │   └── page.tsx      # Central dashboard orchestrator.
        ├── components/
        │   ├── MetricsGrid.tsx  # Character, Token, Ratio, and Cost statistic cards.
        │   ├── CompareBar.tsx   # Interactive horizontal comparative charts.
        │   ├── TokenCanvas.tsx  # Alternating token highlight chips and inspector tooltips.
        │   ├── ApiKeySettings.tsx # Secure client-side local storage API Key controller.
        │   ├── CostCalculator.tsx # Dynamic sliding prompt billing calculator and gauges.
        │   ├── AIStudio.tsx     # Tabbed AI diagnostics and side-by-side prompt optimizations.
        │   ├── DocsReader.tsx   # In-app interactive reader for documentation markdown.
        │   ├── PresetSelector.tsx # Natural language and code presets configuration panels.
        │   ├── ModelSelector.tsx # Model quick selector grid, vocab parameters, and toggles.
        │   ├── TokenFrequencyChart.tsx # SVG sequence length frequency histogram charts.
        │   └── AnalysisViewer.tsx # Custom markdown formatter for in-app diagnostics.
        └── data/
            ├── docsData.ts   # Local catalog source definitions for in-app docs pages.
            └── presets.ts    # Standard edge-case programming language and multilingual prompt presets.
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
*   **📊 Dynamic Cost Budget Planner:** Adjusts expected monthly queries and completion lengths using sliding controllers to estimate production costs in real-time. *(Note: The cost calculator is an educational estimation layer. It helps developers understand how token count translates into API cost at scale. It does not fetch live billing data or charge users.)*

