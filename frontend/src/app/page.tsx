"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Terminal, 
  Layers, 
  BookOpen, 
  RefreshCw, 
  AlertTriangle,
  Code
} from "lucide-react";
import MetricsGrid from "@/components/MetricsGrid";
import CompareBar from "@/components/CompareBar";
import TokenCanvas from "@/components/TokenCanvas";

// =====================================================================
// PRESET TEMPLATES FOR EDGE-CASE PROFILING
// =====================================================================
// Preconfigured payloads designed to illustrate specific properties:
// - English: Standard baseline.
// - Bengali/Hindi: Illustrates "Token Inflation" in non-English alphabets.
// - Cyrillic: Demonstrates multi-byte expansion in Slavic scripts.
// - Code Blocks: Highlights spacing wastes (tabs vs space indentation).
// - Emojis: Visualizes multi-byte segmentation issues in emojis.
// =====================================================================
const PRESETS = {
  english: "Your bank account will be blocked today. Click this link immediately.",
  bengali: "আপনার ব্যাংক অ্যাকাউন্ট আজ ব্লক করা হবে। অবিলম্বে এই লিঙ্কে ক্লিক করুন।",
  hindi: "आपका बैंक खाता आज ब्लॉक कर दिया जाएगा। इस लिंक पर तुरंत क्लिक करें।",
  cyrillic: "Ваш банковский счет будет заблокирован сегодня. Немедленно нажмите на эту ссылку.",
  code: `def query_database(user_id: str):
    # Spaces vs tab indentation waste footprint
    if not user_id:
        return None
        
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    return db.execute(query)`,
  emojis: "🚀🔥💡🤖✨ Python & Next.js are awesome! 😎🎉🙌"
};

const DEFAULT_TEXT = PRESETS.english;

export default function TokenizerVisualizerStudio() {
  // -------------------------------------------------------------------
  // REACT STATE SLICES
  // -------------------------------------------------------------------
  // - text: Holds the user's input payload.
  // - selectedModel: Tracks the active tokenizer selected in the selector.
  // - isApiOnline: Toggles whether the FastAPI local server is online.
  // - isLoading: Sets the spinner states during async network fetches.
  // - apiData: The full analysis payload received from the FastAPI parser.
  // -------------------------------------------------------------------
  const [text, setText] = useState<string>(DEFAULT_TEXT);
  const [selectedModel, setSelectedModel] = useState<string>("cl100k_base");
  const [isApiOnline, setIsApiOnline] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiData, setApiData] = useState<any>(null);

  // -------------------------------------------------------------------
  // REACT REF HOOKS
  // -------------------------------------------------------------------
  // We use a ref to track the debouncing timer. Because page updates
  // occur as the user types, a ref preserves the timeout reference
  // across re-renders without triggering extra layout loops.
  // -------------------------------------------------------------------
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------------------------------------------------
  // INITIAL DIAGNOSTIC CHECK (ON MOUNT)
  // -------------------------------------------------------------------
  // Runs once when the component mounts to check if the Python FastAPI
  // server is running at localhost:8000.
  // -------------------------------------------------------------------
  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setIsApiOnline(data.status === "online");
      })
      .catch(() => {
        // If fetch fails, show the connection warning banner
        setIsApiOnline(false);
      });
  }, []);

  // -------------------------------------------------------------------
  // ASYNC SERVICE FETCH
  // -------------------------------------------------------------------
  // Sends the text payload to the FastAPI parallel processing endpoint.
  // Querying all 4 tokenizers in one call prevents sync issues on the UI.
  // -------------------------------------------------------------------
  const fetchTokenization = async (inputText: string) => {
    if (!inputText) {
      setApiData(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/tokenize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error("Tokenization API error");
      }

      const data = await response.json();
      setApiData(data);
      setIsApiOnline(true); // Toggle backend as connected
    } catch (err) {
      console.error(err);
      setIsApiOnline(false); // Alert user if server disconnects
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // DEBOUCE TYPING WATCHER (EFFECT LOOP)
  // -------------------------------------------------------------------
  // Triggers whenever text changes, waiting 300ms after typing stops
  // before querying the API. This reduces database / processor strain.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchTokenization(text);
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [text]);

  // -------------------------------------------------------------------
  // BUTTON CLICK PRESET HANDLER
  // -------------------------------------------------------------------
  const handlePresetInject = (key: keyof typeof PRESETS) => {
    setText(PRESETS[key]);
  };

  // -------------------------------------------------------------------
  // DYNAMIC VALUE RESOLUTIONS FOR METRICS & CHARTS
  // -------------------------------------------------------------------
  const charCount = text.length;
  
  // Extract tokenization details of the currently selected model
  const activeModelData = apiData?.tokenizers?.[selectedModel] || {
    tokens: [],
    tokenIds: [],
    offsets: [],
    isFallback: true,
    tokenCount: 0,
    ratio: 0.0,
    costPerRequest: 0.0,
    costPerMillionRequests: 0.0
  };

  // Extract other models' data for side-by-side benchmark bar charts
  const compareData = apiData?.tokenizers || {
    cl100k_base: { tokenCount: 0, ratio: 0.0, isFallback: true },
    o200k_base: { tokenCount: 0, ratio: 0.0, isFallback: true },
    llama: { tokenCount: 0, ratio: 0.0, isFallback: true },
    bert: { tokenCount: 0, ratio: 0.0, isFallback: true }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-6 select-none font-sans">
      
      {/* 1. APP HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-8 h-8 text-indigo-500 animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 bg-gradient-to-r from-slate-100 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              Tokenizer Visualizer Studio
            </h1>
          </div>
          <p className="text-xs md:text-sm font-medium text-slate-400 mt-1.5">
            Analyze, profiling, and cost estimation of BPE, WordPiece, and SentencePiece tokenizers.
          </p>
        </div>

        {/* MODEL SELECTOR MATRIX */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mr-1 hidden sm:inline">
            Active Model:
          </span>
          <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            {[
              { id: "cl100k_base", label: "GPT-4" },
              { id: "o200k_base", label: "GPT-4o" },
              { id: "llama", label: "LLaMA 3" },
              { id: "bert", label: "BERT" }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  selectedModel === m.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 2. DIAGNOSTIC API OFFLINE BANNER */}
      {/* If connection is lost or if the Python backend hasn't booted,
          we block gently with a highly structured, educational Red Alert Card
          showing the user exactly what command to run. */}
      {!isApiOnline && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 flex flex-col md:flex-row items-start gap-4">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-red-200">
              FastAPI Backend Server Offline
            </h4>
            <p className="text-xs text-red-300/80 mt-1 max-w-3xl leading-relaxed">
              We cannot establish a live connection to your python backend at `localhost:8000`. To activate high-fidelity tiktoken parses and live HF model processing, launch your local backend server.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                Start command:
              </span>
              <code className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300 select-all flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                cd backend; python run.py
              </code>
            </div>
          </div>
          <button 
            onClick={() => fetchTokenization(text)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/20 transition-all cursor-pointer self-stretch md:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Retry Connection
          </button>
        </div>
      )}

      {/* 3. INPUT BLOCK (LEFT) & LEARNING INSIGHTS PANEL (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* INPUT BOX */}
        <div className="lg:col-span-2 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
              Input Text payload
            </label>
            <span className="text-xs font-mono text-slate-400">
              {charCount} characters
            </span>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste payload here..."
            className="w-full min-h-[160px] max-h-[350px] p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all duration-300 resize-y scrollbar-thin shadow-inner"
          />

          {/* TEMPLATE INJECTORS */}
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
              Inject Profiling Presets
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "english", label: "English" },
                { id: "bengali", label: "Bengali (Inflation)" },
                { id: "hindi", label: "Hindi (Inflation)" },
                { id: "cyrillic", label: "Cyrillic" },
                { id: "code", label: "Code Indents" },
                { id: "emojis", label: "Emojis / Symbols" }
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetInject(preset.id as any)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/60 text-xs font-bold text-slate-300 transition-all cursor-pointer hover:border-slate-600"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STRUCTURAL LEARNING ACCORDION SHEET */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-md">
          <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800/80 pb-3">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Structural Learning
          </h3>
          
          <div className="flex flex-col gap-4 text-xs leading-relaxed text-slate-300">
            <div>
              <span className="font-extrabold text-indigo-400">Byte-Pair Encoding (BPE):</span>
              <p className="mt-1 text-slate-400">
                Used by OpenAI (cl100k/o200k). It iteratively merges frequent character pairs. It slices raw bytes, making it highly robust against unknown symbols, though multi-byte emojis get split.
              </p>
            </div>
            <div>
              <span className="font-extrabold text-teal-400">SentencePiece:</span>
              <p className="mt-1 text-slate-400">
                Used by LLaMA. Treats spaces as a special character (U+2581 ` `) so space groupings are kept directly inside tokens. Outstanding at preserving layout and script alignment.
              </p>
            </div>
            <div>
              <span className="font-extrabold text-purple-400">WordPiece:</span>
              <p className="mt-1 text-slate-400">
                Used by Google BERT. Slices words into sub-word chunks and prefixes trailing pieces with `##` (e.g., `##ing`), checking maximum likelihood against a fixed training vocabulary dictionary.
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3">
              <span className="font-extrabold text-amber-400 flex items-center gap-1">
                ⚠️ The Token Inflation Trap
              </span>
              <p className="mt-1 text-[11px] text-amber-300/80 leading-normal">
                Notice how Hindi and Bengali text explodes into 3–5x more tokens than English for the same meaning. Because training corpora are heavily English-centric, multi-byte languages consume prompt windows faster and cost exponentially more!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. VISUAL TOKEN STREAM DISPLAY */}
      {/* Renders the alternating pastel colored sub-word chips with mouse tooltip hooks. */}
      <TokenCanvas data={activeModelData} />

      {/* 5. METRICS PANEL (LIVE TOKENOMICS REPORT) */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">
          Active Tokenomics Report
        </div>
        <MetricsGrid
          charCount={charCount}
          tokenCount={activeModelData.tokenCount}
          ratio={activeModelData.ratio}
          costPerRequest={activeModelData.costPerRequest}
          costPerMillionRequests={activeModelData.costPerMillionRequests}
          modelName={selectedModel}
        />
      </div>

      {/* 6. COMPARATIVE CHART SYSTEM */}
      {/* Benchmarks cl100k, o200k, BERT, and LLaMA side-by-side using responsive progress bars. */}
      <CompareBar data={compareData} />
      
      {/* FOOTER */}
      <footer className="text-center text-[10px] text-slate-500 font-medium py-4 mt-6 border-t border-slate-900">
        Tokenizer Visualizer Studio • Bridging UI engineering with Large Language Model fundamentals.
      </footer>
    </main>
  );
}
