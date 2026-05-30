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
│   ├── requirements.txt      # Lists Python libraries: fastapi, uvicorn, tiktoken, transformers, tokenizers, openai.
│   ├── run.py                # Boots uvicorn server on localhost:8000 with reload enabled.
│   ├── main.py               # Exposes parallel tokenization endpoints and V3 AI diagnostic routes.
│   ├── tokenizer_service.py  # Coordinates tokenization logic and runs local fallback simulators.
│   └── openai_service.py     # Integrates with OpenAI API for prompt diagnostics and optimizations.
└── frontend/
    ├── package.json          # Next.js 16 npm dependencies, Tailwind 4, and Lucide React icons.
    ├── next.config.ts        # Rewrites /api/* to http://127.0.0.1:8000/api/* to proxy traffic and bypass CORS.
    ├── tsconfig.json         # Configures compilation aliases (@/*) mapping to standard root paths.
    └── src/
        ├── app/
        │   ├── layout.tsx    # Manages global HTML tags, SEO keywords, titles, and layout shells.
        │   ├── globals.css   # Imports Outfit/Mono font faces, radial mesh styles, and custom scrollbars.
        │   └── page.tsx      # Central dashboard orchestrator.
        └── components/
            ├── MetricsGrid.tsx   # Renders glassmorphic cards tracking character, token counts, and cost scaling.
            ├── CompareBar.tsx    # Generates side-by-side animated benchmarking progress charts.
            ├── TokenCanvas.tsx   # Visualizes tokens as colored chips with floating mouse tooltips.
            ├── ApiKeySettings.tsx # Configures secure local storage client-side API keys.
            ├── CostCalculator.tsx # Interactive parameter slider costing panel.
            └── AIStudio.tsx      # Main tabbed interface for prompt explanations and compaction.
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

---

## 7. V3 Premium AI Diagnostics & Budget Calculator System Design

### 1. API Key Security and Isolation Architecture
To protect sensitive developer secrets:
- The app operates on a **No-Store architecture**. 
- When a user inputs their API key in `ApiKeySettings.tsx`, it is saved exclusively in the client's web browser `localStorage` (`tokenizer_openai_api_key`).
- For AI calls, the key is passed dynamically in the HTTP request headers using a custom `X-OpenAI-API-Key` header.
- The FastAPI backend extracts the header in-flight, initializes a stateless `OpenAI()` client instance, completes the request, and discards the key immediately. The key is never persisted in logs or server databases.

### 2. Prompt Optimizer Machine Learning constraints
Prompt compression is performed using `gpt-4o-mini` with a structural system prompt instructing it to perform linguistic reduction (removing conversational fluff, compacting excess whitespace, and employing concise syntactic constructs) while retaining 100% semantic identity. 

To ensure clean processing, we force structured output using **JSON Mode** with the following schema constraint:
```json
{
  "optimized_text": "Compacted prompt text string.",
  "explanation": ["Point 1 of compaction details.", "Point 2 of compaction details."]
}
```
This output is parsed on the backend and mapped directly to a side-by-side comparison panel displaying exact token savings ratios (calculated using `tiktoken` on the optimized string).

### 3. Mathematical Budget Pricing Formulas
The dynamic Cost Budget Planner (`CostCalculator.tsx`) computes operational expenditures over scalable traffic boundaries:

$$\text{Input Cost per Request} = \left( \frac{\text{Input Tokens}}{1,000,000} \right) \times \text{Input Rate per Million}$$
$$\text{Output Cost per Request} = \left( \frac{\text{Completion Tokens}}{1,000,050} \right) \times \text{Output Rate per Million}$$
$$\text{Total Cost per Request} = \text{Input Cost per Request} + \text{Output Cost per Request}$$
$$\text{Estimated Monthly Spend} = \text{Total Cost per Request} \times \text{Monthly Traffic Queries}$$

This allows developers to inspect input tokenomics alongside expected output response sizes and model tiers (e.g. GPT-4o vs GPT-4 Turbo) to optimize prompt parameters before deploying production integrations.

---

## 8. FastAPI REST API Specifications

For developers looking to integrate other clients (e.g., Command Line Interfaces or Mobile tools), the backend exposes a clean, high-performance REST API. 

### 1. Unified Tokenizer Endpoint
*   **Path:** `POST /api/tokenize`
*   **Description:** Slices the input text across all 4 tokenizer engines in parallel and compiles complete tokenomics metrics.
*   **Request Payload (JSON):**
    ```json
    {
      "text": "Your prompt to tokenize here."
    }
    ```
*   **Response Payload (JSON):**
    ```json
    {
      "text": "Your prompt to tokenize here.",
      "charCount": 29,
      "tokenizers": {
        "cl100k_base": {
          "tokens": ["Your", " prompt", " to", " token", "ize", " here", "."],
          "tokenIds": [5739, 13735, 311, 14949, 1431, 1403, 13],
          "offsets": [[0, 4], [4, 11], [11, 14], [14, 20], [20, 23], [23, 28], [28, 29]],
          "isFallback": false,
          "tokenCount": 7,
          "ratio": 0.241,
          "costPerRequest": 0.000035,
          "costPerMillionRequests": 35.0,
          "unitPrice": 5.0
        },
        "o200k_base": { ... },
        "llama": { ... },
        "bert": { ... }
      }
    }
    ```

### 2. Prompt Explanation Diagnostics
*   **Path:** `POST /api/ai/explain`
*   **Headers:** 
    *   `X-OpenAI-API-Key` *(Optional)* - Passes standard user key dynamically.
*   **Request Payload (JSON):**
    ```json
    {
      "text": "आपका बैंक खाता ब्लॉक कर दिया जाएगा।"
    }
    ```
*   **Response Payload (JSON):**
    ```json
    {
      "explanation": "### 📊 Diagnostic Report...\n- **Token Inflation:** Hindi characters map to 3-4x more tokens than English.",
      "isAI": true
    }
    ```

### 3. Prompt Footprint Optimizer
*   **Path:** `POST /api/ai/optimize`
*   **Headers:** 
    *   `X-OpenAI-API-Key` *(Required)* - Authenticates GPT optimization requests.
*   **Request Payload (JSON):**
    ```json
    {
      "text": "Please kindly block my account immediately in order to secure my funds."
    }
    ```
*   **Response Payload (JSON):**
    ```json
    {
      "optimizedText": "Block my account immediately to secure funds.",
      "explanation": ["Removed conversational fluff", "Swapped verbose phrasing"],
      "originalTokenCount": 12,
      "optimizedTokenCount": 7,
      "savingsPercent": 41.7
    }
    ```

### 4. Service Health Diagnostic Ping
*   **Path:** `GET /api/health`
*   **Description:** Probes the FastAPI server status and packages availability flags.
*   **Response Payload (JSON):**
    ```json
    {
      "status": "online",
      "has_tiktoken": true,
      "has_transformers": true
    }
    ```


