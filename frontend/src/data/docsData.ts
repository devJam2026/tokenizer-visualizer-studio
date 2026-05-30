export interface DocItem {
  id: string;
  title: string;
  category: string;
  icon: string;
  summary: string;
  content: string;
}

export const DOCS_DATA: Record<string, DocItem> = {
  learning_insights: {
    id: "learning_insights",
    title: "LLM Learning Insights & Curriculum",
    category: "LLM Path",
    icon: "GraduationCap",
    summary: "Curriculum blueprint detailing subword tokenization, token inflation bottlenecks, and byte-to-character alignment.",
    content: `# Learning Insights: LLM & Generative AI Learning Curriculum

This document outlines the detailed architectural concepts, engineering insights, and practical methodologies you can master by studying this **Tokenizer Visualizer Studio** codebase. It is designed to act as a structured guide for your **LLM and Generative AI Learning Path**.

---

## 🗺️ Conceptual Learning Blueprint

\`\`\`
                     [Linguistic Inputs]
                              │
         ┌────────────────────┴────────────────────┐
         ▼                                         ▼
[Conceptual Level]                        [Engineering Level]
- Subword Tokenization algorithms         - Debounced REST communication
- UTF-8 Multi-byte scripts inflation       - Parallel API processing
- Whitespace formatting footprints        - Byte-to-Char offset boundaries
- Lossless Prompt Compaction logic        - Strict JSON Mode schema outputs
\`\`\`

---

## 📘 Module 1: Subword Tokenization Algorithms

Standard programming languages treat strings as sequences of characters. Large Language Models (LLMs), however, process text in **subword segments (Tokens)**. This is the single most critical building block of NLP and GenAI.

### 🔍 Concepts You Are Learning:
1. **Vocabulary Constraints:** Why models use a pre-defined dictionary (typically 32,000 to 200,000 unique token IDs) to strike a balance between vocabulary size and memory footprint.
2. **Handling Out-of-Vocabulary (OOV):** Understanding why older character-based methods split unknown words into slow characters, while BPE models degrade gracefully by falling back to UTF-8 raw bytes.
3. **Algorithmic Differences:**
   * **Byte-Pair Encoding (BPE):** Used by OpenAI's GPT models. Slices raw bytes, merging most frequent byte pairs. Outstanding resilience but splits emojis and special scripts.
   * **SentencePiece:** Used by Meta's LLaMA. Treats whitespace as an explicit, safe character (U+2581 \` \`). Excellent at preserving structural layouts and indentation formats.
   * **WordPiece:** Used by Google's BERT. Searches vocabulary matching from the beginning of words and marks trailing pieces with the standard \`##\` prefix.

---

## 📕 Module 2: The Multi-Byte Script Bottleneck (Token Inflation)

One of the most eye-opening lessons of this project is the **Token Inflation Trap**—the economic asymmetry in LLM processing for different languages.

### 🔍 Concepts You Are Learning:
1. **Training Data Bias:** LLM training corpora are heavily English-centric (~90%+ English). Consequently, English words map to 1 single token.
2. **Byte-Expansion Math:** Non-Latin scripts (Hindi, Bengali, Arabic, Cyrillic, etc.) require multiple bytes per character in UTF-8. Because the tokenizer vocabulary doesn't contain entries for multi-byte characters, each character is forced to split into **2 to 5 separate byte-tokens**.
3. **The Real-World Financial Impact:**
   * English Prompt: \`"Your bank account is blocked."\` ➔ **6 Tokens** ($0.000030)
   * Bengali Prompt: \`"আপনার ব্যাংক অ্যাকাউন্ট আজ ব্লক করা হবে।"\` ➔ **33 Tokens** ($0.000165)
   * *Result:* Saying the exact same thing in Bengali costs **550% more** and fills the model's context window **5x faster**!
4. **How to Solve It:** Learning how modern, updated tokenizers like GPT-4o's \`o200k_base\` address this by expanding the vocabulary specifically for multi-lingual script efficiency.

---

## 📙 Module 3: Byte-to-Character Alignment Engineering

If you look at \`backend/tokenizer_service/tiktoken_tokenizer.py\`, you will see the implementation of the **Byte-Level Bidirectional Alignment Algorithm**. 

This solves a legendary problem in GenAI user interface development.

### 🔍 The Engineering Problem:
When you call \`tiktoken.encode()\`, it returns standard token IDs. When you decode those IDs back, you get raw bytes. If you have an emoji like 🚀 (which is 4 UTF-8 bytes) or non-English scripts, a token can end in the middle of a multi-byte sequence. 
If you try to map token bytes directly to characters using simple \`split()\` operations, your character highlight indexes will drift, causing highlight chips to overlap or mismatch on the frontend.

### 🔍 Concepts You Are Learning:
Our alignment algorithm teaches you how to map byte slices back to valid character positions programmatically:
1. Convert the full input string into raw UTF-8 bytes.
2. Slice the byte stream according to the tokenizer piece length.
3. Safely decode the prefix byte arrays up to the current index.
4. Compute the valid decoded string length to find the exact character coordinate boundaries:
   \`\`\`python
   start_char = len(text_bytes[:start_byte].decode('utf-8', errors='ignore'))
   end_char = len(text_bytes[:end_byte].decode('utf-8', errors='ignore'))
   \`\`\`
5. Pass these \`[start, end]\` ranges to the React frontend to render color-coded highlights flawlessly.

---

## 📒 Module 4: Prompt Economics & Lossless Compaction

LLM prompt engineering is not just about writing creative copy—it is a **cost and performance optimization drill**. Study \`openai_service.py\` to learn prompt optimization.

### 🔍 Concepts You Are Learning:
1. **Linguistic Redundancy:** Removing conversational filler words (e.g., *"Please do this in order to..."* ➔ *"Do this to..."*) without losing the prompt context, variables, or system constraints.
2. **Whitespace Overhead:** Visualizing how spaces and indentation consume token allocations.
3. **Strict JSON Schema Enforcement:** Forcing the LLM to output a strictly formatted JSON structure using OpenAI's **JSON Mode** with precise system formatting constraints. This guarantees that your backend parser never throws formatting exceptions.

---

## 🏁 Summary of Mastery

By studying this codebase, you are acquiring the skills of a **Senior LLM Platform Engineer**:
* You understand **how models read text** down to the raw byte level.
* You know **how to model and forecast costs** for real-time applications.
* You master **API security practices** (Secure isolation using browser-side storage).
* You write **clean, modular, package-level code** designed to be easily extensible.`,
  },
  comprehensive_guide: {
    id: "comprehensive_guide",
    title: "Comprehensive Guide: How the Studio Works",
    category: "Application Math",
    icon: "Cpu",
    summary: "Deep dive into the application data flow, debouncing, parallel tokenization, and resilience backend fallbacks.",
    content: `# Comprehensive Guide: How Tokenizer Visualizer Studio Works & Its Benefits

Welcome to the **Tokenizer Visualizer Studio** learning portal! This document is designed to teach you exactly how the application works behind the scenes, the high-value benefits it brings to engineering teams, and how the real-time financial budget engine runs its calculations.

---

## 1. What is Tokenization? (Core Concept)

Before diving into the code, it is vital to understand the fundamental concept of **Tokenization**.

Large Language Models (LLMs) like GPT-4, LLaMA, or BERT do not process text the way humans do (reading words) or the way standard computers do (reading ASCII/Unicode characters). Instead, they process text as numeric codes corresponding to **sub-word segments** called **Tokens**.

### The Character-Byte-Token Relationship
1. **Characters:** The raw symbols you type (e.g., letters, punctuation, spaces, or emojis).
2. **Bytes:** The underlying binary representation in memory (e.g., UTF-8 character encoding). A standard English letter consumes **1 byte**, whereas Cyrillic, Hindi, or emojis consume **2 to 4 bytes** per character.
3. **Tokens:** The dictionary segments that the model understands. The model's "vocabulary" maps token IDs (numbers) to specific byte strings.

#### Example:
* Text: \`"tokenization"\`
* OpenAI \`cl100k_base\` (GPT-4) chops this single word into **2 tokens**:
  * Token ID \`11375\` ➔ \`"token"\`
  * Token ID \`2186\` ➔ \`"ization"\`

---

## 2. How the Entire Application Works (Data Flow)

The application is built as a highly decoupled, full-stack Single Page Application (SPA) designed for zero lag and local execution.

### Phase 1: Debounced Frontend Input (\`frontend/src/app/page.tsx\`)
When you type in the text box, a React \`useRef\` timer waits for you to pause typing for **300 milliseconds** before sending a request. This **debouncing** prevents freezing the UI or sending hundreds of useless requests to the server while you are in the middle of a sentence.

### Phase 2: Next.js API Rewrite (\`frontend/next.config.ts\`)
To prevent Cross-Origin Resource Sharing (CORS) security issues and bypass having to hardcode port numbers, the Next.js development server proxies all \`/api/*\` requests on the fly to \`http://127.0.0.1:8000/api/*\` where the Python backend is listening.

### Phase 3: Parallel Python Tokenization Engine (\`backend/main.py\`)
Rather than making multiple sequential requests for each model, the Python FastAPI backend processes **four models in parallel** in a single call:
1. **GPT-4 (\`cl100k_base\`)** - Using the official C++ binary wrapper \`tiktoken\`.
2. **GPT-4o (\`o200k_base\`)** - Using the updated token dictionary from \`tiktoken\`.
3. **LLaMA 3** - Sliced using the HuggingFace \`transformers\` library (SentencePiece).
4. **Google BERT** - Sliced using HuggingFace's WordPiece algorithm.

### Phase 4: Offline Fallback Resilience
If you are working offline, behind a corporate firewall, or don't have HuggingFace packages installed, standard tokenizers will crash trying to download model dictionaries. 
To guarantee a **100% crash-free experience**, the studio implements **Local Regex Fallback Simulators**:
* *BPE Simulator:* Deterministically splits text into syllables.
* *WordPiece Simulator:* Slices prefixes and suffixes, appending BERT's signature \`##\` indicators (e.g., \`['blo', '##cked']\`).
* *SentencePiece Simulator:* Prepends explicit SentencePiece spacing symbols (\` \`).
* *Hash Identifiers:* Generates identical, reproducible Token IDs for the same characters.

---

## 3. High-Value Benefits You Get From This Tool

### Benefit 1: Defeat the \"Token Inflation Tax\"
LLM training sets are overwhelmingly English-centric. Because of this, English words map cleanly to 1 token, whereas Asian, Slavic, and Middle-Eastern characters expand into multi-byte UTF-8 streams.
* **The Shocking Truth:** The word *"blocked"* is 1 token in English. But the Bengali translation \`"ব্লক"\` consumes **5 tokens**!
* **The Benefit:** By profiling prompts in different languages, you can see how much faster foreign prompts hit context window limits and cost-optimize translations.

### Benefit 2: Audit and Minify Structural Whitespace Waste
Developers often write prompts containing long, indented code blocks or double line breaks.
* **The Whitespace Trap:** Standard BPE treats spaces individually. If you have 4 spaces of indentation, it could take up **2 to 4 separate tokens** instead of 1.
* **The Benefit:** The **Whitespace Debugger** visualizes hidden layout overhead (like tabs \`⇥ \` and double returns \`↵\`). You can easily spot if changing tab-indents to space-indents reduces your prompt size.

### Benefit 3: Save Up to 40% of Production Costs via AI Optimization
Our **AI Prompt Optimizer** uses a specialized model loop to analyze prompt fluff.
* It strips conversational fillers (e.g., *"Please kindly do this and make sure to..."* ➔ *"Ensure..."*).
* It retains 100% of variables, formatting rules, and strict instructions.
* **The Benefit:** Swapping the optimized prompt into your production code directly shaves off up to 40% of your input expenses!`,
  },
  system_design: {
    id: "system_design",
    title: "System Design & REST API Specifications",
    category: "Architecture",
    icon: "Layers",
    summary: "Complete system blueprints, component design patterns, and FastAPI REST endpoint schemas for mobile and CLI clients.",
    content: `# Tokenizer Visualizer Studio - System Design & Implementation Guide

This document provides a comprehensive technical overview of the architecture, data structures, sub-word tokenization algorithms, and interface mechanics implemented in the **Tokenizer Visualizer Studio**.

---

## 1. System Architecture Overview

The application is structured as a decoupled, full-stack single-page application (SPA). The frontend handles real-time visual rendering and UX interactions, while the backend compiles and processes high-performance token boundaries in parallel.

### 🌐 High-Level Core Flow:
* **Client Layer (React / Next.js):** Manages user states (editor text, active models, slider bounds, API keys) and triggers debounced server communications.
* **Transport Layer:** Securely tunnels JSON payloads between Next.js and FastAPI over HTTP.
* **Server Layer (FastAPI Python):** Coordinates four parallel tokenization pipelines, byte alignment algorithms, and prompt optimizations.

---

## 2. Backend REST API Specifications

The FastAPI backend exposes the following standard REST endpoints to allow mobile clients, CLI tools, and background scripts to leverage our tokenization and prompt compaction services directly.

### 🔌 1. Tokenization Endpoint: \`POST /api/tokenize\`
Tokenizes raw input text across all 4 supporting engines in parallel, returning exact byte offsets, visual character coordinate boundaries, and financial pricing metrics.

#### Request Headers:
* \`Content-Type: application/json\`

#### Request Payload:
\`\`\`json
{
  "text": "def preprocess_text(text):\\\\n  return text"
}
\`\`\`

#### Response Structure (200 OK):
\`\`\`json
{
  "text": "def preprocess_text(text):\\\\n  return text",
  "charCount": 38,
  "tokenizers": {
    "cl100k_base": {
      "tokenIds": [123, 456, 789],
      "tokens": ["def", " preprocess", "_text"],
      "offsets": [[0, 3], [3, 14], [14, 19]],
      "tokenCount": 3,
      "ratio": 0.079,
      "costPerRequest": 0.000015,
      "costPerMillionRequests": 15.00
    }
  }
}
\`\`\`

---

### 🔌 2. AI Diagnostics Endpoint: \`POST /api/ai/explain\`
Analyzes input text to diagnose prompt inflation, highlighting character-to-byte ratios and linguistic inefficiencies.

#### Request Headers:
* \`Content-Type: application/json\`
* \`X-OpenAI-API-Key: sk-proj-... \` *(Optional. If omitted, falls back to rule-based heuristics)*

#### Request Payload:
\`\`\`json
{
  "text": "Your bank account has been blocked."
}
\`\`\`

---

### 🔌 3. Prompt Optimizer Endpoint: \`POST /api/ai/optimize\`
Slices prompt redundancy, conversational fluff, and layout gaps to output a highly compressed, token-efficient prompt payload.

#### Request Headers:
* \`Content-Type: application/json\`
* \`X-OpenAI-API-Key: sk-proj-... \` *(Required)*

#### Request Payload:
\`\`\`json
{
  "text": "Please write an extremely thorough summary of this article in order to help me understand..."
}
\`\`\`

#### Response Structure (200 OK):
\`\`\`json
{
  "optimizedText": "Write a thorough summary of this article to help me understand...",
  "explanation": [
    "Removed conversational fillers ('Please')",
    "Condensed phrasing ('in order to' -> 'to')"
  ],
  "originalTokenCount": 16,
  "optimizedTokenCount": 11,
  "savingsPercent": 31.2
}
\`\`\`

---

## 3. Client State Management

The React client utilizes standard state synchronization patterns to coordinate global variables across decoupled components.

* **Text Stream Synchronizer:** Debounces editor inputs to prevent UI lockups, coordinating text changes across \`TokenCanvas\`, \`MetricsGrid\`, and \`CompareBar\` at a constant rate.
* **Storage Isolation Broker:** Securely isolated from global servers, API keys are kept entirely inside the user's browser local storage, safeguarding sensitive credentials.`,
  },
};
