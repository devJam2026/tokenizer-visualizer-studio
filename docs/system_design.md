# Tokenizer Visualizer Studio - System Design & Implementation Guide

This document provides a comprehensive technical overview of the architecture, data structures, sub-word tokenization algorithms, and interface mechanics implemented in the **Tokenizer Visualizer Studio**.

---

## 1. System Architecture Overview

The application is structured as a decoupled, full-stack single-page application (SPA). The frontend handles real-time visual rendering and UX interactions, while the backend compiles and processes high-performance token boundaries in parallel.

```mermaid
graph TB
    subgraph Client Layer (React / Next.js)
        UI[page.tsx: Dashboard Control]
        Canvas[TokenCanvas.tsx: Visual Color Chips]
        Metrics[MetricsGrid.tsx: Cost & Ratio Cards]
        Chart[CompareBar.tsx: Side-by-Side Benchmarks]
        
        UI --> Canvas
        UI --> Metrics
        UI --> Chart
    end

    subgraph Transport Layer
        HTTP[JSON over HTTP]
    end

    subgraph Server Layer (FastAPI Python)
        API[main.py: REST Router]
        Svc[tokenizer_service.py: Tokenizer Coordinator]
        
        subgraph Real Tokenization Engines
            Tiktoken[tiktoken: cl100k & o200k]
            HuggingFace[transformers: BERT & LLaMA]
        end
        
        subgraph Resilience Fallback Engines
            BPESim[BPE Regex Simulator]
            WPSim[WordPiece Simulator]
            SPSim[SentencePiece Simulator]
        end
    end

    %% Relations
    UI -- "Debounced POST /api/tokenize" --> HTTP
    HTTP --> API
    API --> Svc
    
    Svc -- "Primary (If installed)" --> Real Tokenization Engines
    Svc -- "Fallback (If offline/uninstalled)" --> Resilience Fallback Engines
    
    Real Tokenization Engines --> Align[Byte-to-Char Index Alignment]
    Resilience Fallback Engines --> Align
    Align --> API
    API -- "HTTP 200 JSON Response" --> UI
```

---

## 2. Directory & Component Mapping

Below is the complete file layout of the project, detailing the architectural purpose of each module:

```
tokenizer-visualizer-studio/
├── README.md                 # Project quick-start, local startup commands, and guide.
├── .gitignore                # Filters node_modules, .next builds, Python caches, and environments.
├── docs/
│   └── system_design.md      # Detailed system architecture, algorithms deep dive, and designs.
├── backend/
│   ├── requirements.txt      # Lists Python libraries: fastapi, uvicorn, tiktoken, transformers, tokenizers.
│   ├── run.py                # Boots uvicorn server on localhost:8000 with reload enabled.
│   ├── main.py               # Exposes POST /api/tokenize (parallel parsing) and GET /api/health (status logs).
│   └── tokenizer_service.py  # Coordinates tokenization logic and runs local fallback simulators.
└── frontend/
    ├── package.json          # Bundles Next.js 16+, typescript dev types, Tailwind 4, and Lucide React icons.
    ├── next.config.ts        # Rewrites /api/* to http://127.0.0.1:8000/api/* to proxy traffic and bypass CORS.
    ├── tsconfig.json         # Configures compilation aliases (@/* and @@/*) mapping to standard root paths.
    └── src/
        ├── app/
        │   ├── layout.tsx    # Manages global HTML tags, SEO keywords, titles, and layout shells.
        │   ├── globals.css   # Imports Outfit/Mono font faces, radial mesh styles, and custom scrollbars.
        │   └── page.tsx      # Main state machine, handling presets, theme tags, and connection diagnostics.
        └── components/
            ├── MetricsGrid.tsx # Renders glassmorphic cards tracking character, token counts, and cost scaling.
            ├── CompareBar.tsx  # Generates side-by-side animated benchmarking progress charts.
            └── TokenCanvas.tsx # Visualizes tokens as colored chips with floating mouse tooltips.
```

---

## 3. High-Fidelity Data Flow

When a user interacts with the visualizer, the data flows through these sequential phases:

```
[User Input Event]
        │
        ▼ (Debounce 300ms)
[POST /api/tokenize] ──► [FastAPI CORS Middleware]
                               │
                               ▼
                    [Parallel Processing]
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
  [Tiktoken BPE]       [LLaMA SentencePiece]  [BERT WordPiece]
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               ▼
               [Byte-to-Char Index Alignment]
                               │
                               ▼
             [Retail API Financial Calculations]
                               │
                               ▼
                  [Unified JSON Response]
                               │
                               ▼
             [Next.js Component Reflow & Render]
```

### 1. Frontend Debouncing (300ms)
To prevent flooding the Python backend during rapid typing, the dashboard uses a `useRef` based timer in `page.tsx`. Every keystroke resets the 300ms timer. Once the user pauses typing for 300ms, a single HTTP POST request containing `{ "text": "..." }` is sent.

### 2. Parallel Tokenization Analysis
Rather than making multiple network requests for different tokenizers, `main.py` processes all four tokenizer variants (`cl100k_base`, `o200k_base`, `llama`, `bert`) in parallel on the backend in a single request. This ensures that the comparison charts and metrics panel are updated in perfect synchronization.

---

## 4. Sub-word Tokenization Algorithms Compared

Modern LLMs process text as sub-word units to balance vocabulary size with syntactic representation. The studio compares the three primary algorithms:

| Dimension | Byte-Pair Encoding (BPE) | WordPiece | SentencePiece |
| :--- | :--- | :--- | :--- |
| **Active Models** | GPT-4 (`cl100k`), GPT-4o (`o200k`) | Google BERT | Meta LLaMA 3 |
| **Whitespaces** | Handled as standard byte characters | Stripped; words sliced independently | Preserved using explicit U+2581 ` ` symbols |
| **Subword Prefix** | None (spliced directly) | Trailing pieces prefixed with `##` | Leading spacing attached to first piece |
| **Vocabulary Size** | ~100,000 to 200,000 | ~30,000 | ~32,000 to 128,000 |
| **Out-of-Vocab** | Extremely rare (bytes are fallback) | Replaces unknown words with `[UNK]` | No unknown tokens (falls back to bytes) |

---

## 5. The Byte-to-Character Alignment Algorithm

The core engineering challenge in building a token visualizer is **accurately mapping token IDs back to their exact character coordinates (character spans)** in the original input string. Since BPE operates over UTF-8 bytes and emojis/non-English scripts consume multiple bytes per character, simple string splitting fails.

We solved this in `tokenizer_service.py` using a **Byte-Level Bidirectional Alignment Algorithm**:

```python
def tokenize_tiktoken(self, text: str, model_name: str) -> Dict[str, Any]:
    encoding = self.tiktoken_encodings.get(model_name)
    ids = encoding.encode(text)
    
    offsets = []
    tokens_decoded = []
    
    # 1. Convert original text into raw UTF-8 bytes to align with token boundaries
    text_bytes = text.encode('utf-8')
    current_byte_idx = 0
    
    for token_id in ids:
        # 2. Extract the exact, raw byte sequence for this specific token ID
        token_byte_piece = encoding.decode_single_token_bytes(token_id)
        length = len(token_byte_piece)
        
        start_byte = current_byte_idx
        end_byte = current_byte_idx + length
        current_byte_idx = end_byte
        
        # 3. Decode sub-slices of the original bytes back into characters safely
        start_char = len(text_bytes[:start_byte].decode('utf-8', errors='ignore'))
        end_char = len(text_bytes[:end_byte].decode('utf-8', errors='ignore'))
        
        # 4. Map the exact slice to get the token string representation
        token_str = text[start_char:end_char]
        
        tokens_decoded.append(token_str)
        offsets.append([start_char, end_char])
        
    return {
        "tokenIds": ids,
        "tokens": tokens_decoded,
        "offsets": offsets
    }
```
This guarantees that **no matter how complex the multi-byte characters or emojis are, character index bounds are perfectly calculated**, preventing any offset drift or text highlight mismatch on the frontend.

---

## 6. Local Fallback Resilience Design

If a user is running offline, behind a corporate proxy, or doesn't have the Hugging Face cache initialized, downloading `bert-base-uncased` or LLaMA tokenizers (which can fail due to API rate limits or auth keys) will fail.

To ensure the studio is **100% resilient and always active**, we implemented high-fidelity fallback simulators in `tokenizer_service.py` under the `FallbackTokenizer` class:

*   **BPE Simulation:** Slices strings using whitespace and word-boundary regular expressions, splitting long words in half to mimic byte-pair merge behavior.
*   **WordPiece Simulation:** Tokenizes words and matches them against common word-structure suffixes (e.g., `ing`, `tion`, `er`, `s`). Trailing fragments are automatically prefixed with standard `##` symbols (e.g., `blocked` -> `['blo', '##cked']`).
*   **SentencePiece Simulation:** Replaces standard spaces with standard U+2581 ` ` symbols, attaching leading spaces to word prefixes and slicing longer strings.
*   **Deterministic ID Generation:** Slices deterministic hashes to generate token IDs between `1000` and `50000`, ensuring the same token string always yields the identical ID!

This design guarantees the studio **never crashes** and behaves exactly like the real deep-learning models even in strict offline environments.
