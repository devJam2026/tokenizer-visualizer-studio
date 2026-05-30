"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Terminal, 
  Layers, 
  BookOpen, 
  RefreshCw, 
  AlertTriangle,
  Code,
  LayoutGrid,
  TrendingUp,
  Settings,
  User,
  Workflow,
  Cpu,
  Share2,
  ListCollapse,
  ChevronDown,
  DollarSign
} from "lucide-react";
import MetricsGrid from "@/components/MetricsGrid";
import CompareBar from "@/components/CompareBar";
import TokenCanvas from "@/components/TokenCanvas";
import ApiKeySettings from "@/components/ApiKeySettings";
import CostCalculator from "@/components/CostCalculator";
import DocsReader from "@/components/DocsReader";

// Edge-case profiling presets for the user to inject
const PRESETS = {
  english: "Large Language Models process text using subword tokenization instead of reading raw characters or full words. This balanced approach allows neural networks to capture grammar, semantic patterns, and punctuation efficiently within a structured vocabulary dictionary.",
  englishComplex: "The luminous celestial bodies shimmered across the vast, velvety expanse of the nocturnal sky, casting a serene, ethereal glow upon the whispering willows below, while a gentle, nostalgic breeze carried the distant melody of a forgotten era.",
  bengali: "আপনার ব্যাংক অ্যাকাউন্ট আজ ব্লক করা হবে। অবিলম্বে এই লিঙ্কে ক্লিক করুন।",
  hindi: "आपका बैंक खाता आज ब्लॉक कर दिया जाएगा। तुरंत कार्रवाई करें।",
  cyrillic: "Ваш банковский счет заблокирован. Немедленно проверьте баланс.",
  emojis: "🚀🔥💡🤖✨ Python & Next.js are awesome! 😎🎉",
  python: `def preprocess_text(text):
    # Retrieve clean data entries
    data = get_dataset()
    results = tokenize(text, data)
    return results`,
  dbQuery: `def query_database(user_id: str):
    if not user_id:
        return None
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    return db.execute(query)`,
  reactCode: `import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}`,
  jsonPayload: `{
  "tokenizer": "byte-pair-encoding",
  "vocab_size": 32000,
  "special_tokens": {
    "bos": "<s>",
    "eos": "</s>",
    "unk": "<unk>"
  },
  "normalize": true
}`
};

export default function TokenizerVisualizerStudio() {
  // -------------------------------------------------------------------
  // DASHBOARD LAYOUT STATES
  // -------------------------------------------------------------------
  const [activeSidebarTab, setActiveSidebarTab] = useState<"studio" | "docs" | "cost" | "settings">("studio");

  // -------------------------------------------------------------------
  // REACT CORE SERVICE STATES
  // -------------------------------------------------------------------
  const [text, setText] = useState<string>(PRESETS.english);
  const [selectedModel, setSelectedModel] = useState<string>("llama");
  const [isApiOnline, setIsApiOnline] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiData, setApiData] = useState<any>(null);
  const [apiKey, setApiKey] = useState<string>("");

  // For model sub-parameters in Llama / GPT controls (mock parameters from design screenshot)
  const [vocabPreset, setVocabPreset] = useState<string>("Aastroots");
  const [writePreset, setWritePreset] = useState<string>("Write");
  const [sizeCounter, setSizeCounter] = useState<number>(19);
  const [spacingToggle, setSpacingToggle] = useState<boolean>(true);

  // Lifted Canvas active tab state
  const [activeCanvasTab, setActiveCanvasTab] = useState<"tokenize" | "visualize" | "analyze" | "optimize">("tokenize");

  // Explanation diagnostics states (shared with TokenCanvas analyze tab)
  const [explanation, setExplanation] = useState<string>("");
  const [isLoadingExplain, setIsLoadingExplain] = useState<boolean>(false);
  const [lastExplainedText, setLastExplainedText] = useState<string>("");
  const explanationCacheRef = useRef<Record<string, string>>({});

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const explanationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------------------------------------------------
  // DIAGNOSTIC API HEALTH CHECK
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
        setIsApiOnline(false);
      });
  }, []);

  // Load saved API key from localStorage on mount to prevent page reload state-loss
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("tokenizer_openai_api_key") || "";
      setApiKey(savedKey);
    }
  }, []);

  // -------------------------------------------------------------------
  // ASYNC SERVICE FETCH (ALL 4 TOKENIZERS IN PARALLEL)
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
      setIsApiOnline(true);
    } catch (err) {
      console.error(err);
      setIsApiOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // ASYNC DIAGNOSTIC REPORT FETCH FOR THE "ANALYZE" CANVAS TAB
  // -------------------------------------------------------------------
  const loadExplanation = async () => {
    if (!text) return;

    // Check cache first to avoid triggering again for existing texts
    if (explanationCacheRef.current[text]) {
      setExplanation(explanationCacheRef.current[text]);
      setLastExplainedText(text);
      return;
    }

    setIsLoadingExplain(true);
    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "X-OpenAI-API-Key": apiKey } : {})
        },
        body: JSON.stringify({ text })
      });
      if (!response.ok) throw new Error("Explanation API failed");
      const data = await response.json();
      
      // Cache explanation text lookup results
      explanationCacheRef.current[text] = data.explanation;
      
      setExplanation(data.explanation);
      setLastExplainedText(text);
    } catch (err) {
      console.error(err);
      setExplanation("### ❌ Error Loading Explanation\nCould not fetch diagnostics from backend service.");
    } finally {
      setIsLoadingExplain(false);
    }
  };

  // -------------------------------------------------------------------
  // DEBOUNCE WATCHER (300MS)
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

  // Clear explanation cache if apiKey changes
  useEffect(() => {
    explanationCacheRef.current = {};
    setLastExplainedText("");
  }, [apiKey]);

  // Load explanation report with 800ms debounce only when on the Analyze tab
  useEffect(() => {
    if (explanationTimeoutRef.current) {
      clearTimeout(explanationTimeoutRef.current);
    }

    // Only run if active tab is analyze and there is input text
    if (activeCanvasTab !== "analyze" || !text) {
      return;
    }

    // Cache hits run synchronously for instant UX
    if (explanationCacheRef.current[text]) {
      setExplanation(explanationCacheRef.current[text]);
      setLastExplainedText(text);
      return;
    }

    if (text === lastExplainedText) {
      return;
    }

    // Debounce actual API requests to prevent typing-spam OpenAI costs
    explanationTimeoutRef.current = setTimeout(() => {
      loadExplanation();
    }, 800);

    return () => {
      if (explanationTimeoutRef.current) {
        clearTimeout(explanationTimeoutRef.current);
      }
    };
  }, [text, apiKey, activeCanvasTab]);

  const handlePresetInject = (key: keyof typeof PRESETS) => {
    setText(PRESETS[key]);
  };

  const handleManualRefresh = () => {
    // Clear cache entry for current text to force a real backend refresh!
    if (explanationCacheRef.current[text]) {
      delete explanationCacheRef.current[text];
    }
    setLastExplainedText("");
    
    fetchTokenization(text);
    loadExplanation();
  };

  // Map selector values to actual backend keys
  const getBackendModelKey = (localId: string): string => {
    if (localId === "llama") return "llama";
    if (localId === "gpt4") return "cl100k_base";
    if (localId === "gpt4o") return "o200k_base";
    if (localId === "bert") return "bert";
    return "cl100k_base";
  };

  // Map backend key to display name in visual chips header
  const getModelDisplayName = (localId: string): string => {
    if (localId === "llama") return "Llama 3";
    if (localId === "gpt4") return "GPT-4 (cl100k)";
    if (localId === "gpt4o") return "GPT-4o (o200k)";
    if (localId === "bert") return "Google BERT";
    return "GPT-4";
  };

  const activeBackendKey = getBackendModelKey(selectedModel);
  const activeModelDisplayName = getModelDisplayName(selectedModel);

  // -------------------------------------------------------------------
  // DYNAMIC PLAYGROUND SIMULATION ENGINE
  // -------------------------------------------------------------------
  const getProcessedModelData = (modelKey: string) => {
    const rawData = apiData?.tokenizers?.[modelKey] || {
      tokens: [],
      tokenIds: [],
      offsets: [],
      isFallback: true,
      tokenCount: 0,
      ratio: 0.0,
      costPerRequest: 0.0,
      costPerMillionRequests: 0.0
    };
    
    // Deep copy to prevent mutating the original API response
    let baseData = JSON.parse(JSON.stringify(rawData));
    if (!baseData.tokens || baseData.tokens.length === 0) return baseData;

    // 1. SPACE ALIGN SIMULATION: if spacingToggle is enabled, collapse duplicate spaces in the simulated chips
    if (spacingToggle) {
      let cleanTokens: string[] = [];
      let cleanIds: number[] = [];
      let cleanOffsets: number[][] = [];
      
      baseData.tokens.forEach((tok: string, idx: number) => {
        const prev = baseData.tokens[idx-1] || "";
        const isPrevSpace = idx > 0 && (prev === " " || prev === " " || prev.trim() === "");
        const isCurrentSpace = tok === " " || tok === " " || tok.trim() === "";
        
        // Skip if it represents a redundant space
        if (isPrevSpace && isCurrentSpace) {
          return;
        }
        
        cleanTokens.push(tok);
        cleanIds.push(baseData.tokenIds[idx] || 0);
        cleanOffsets.push(baseData.offsets[idx] || [0, 0]);
      });
      
      baseData.tokens = cleanTokens;
      baseData.tokenIds = cleanIds;
      baseData.offsets = cleanOffsets;
      baseData.tokenCount = cleanTokens.length;
    }

    // 2. SIZE COUNTER SIMULATION: Simulated Max Token Character Length segmenter
    // Demonstration: if any token exceeds 'sizeCounter', it is split into sub-tokens of maximum length sizeCounter!
    if (sizeCounter > 0) {
      let splitTokens: string[] = [];
      let splitIds: number[] = [];
      let splitOffsets: number[][] = [];
      
      baseData.tokens.forEach((tok: string, idx: number) => {
        const tokenId = baseData.tokenIds[idx] || 9999;
        const offset = baseData.offsets[idx] || [0, 0];
        
        if (tok.length > sizeCounter) {
          let start = offset[0];
          for (let i = 0; i < tok.length; i += sizeCounter) {
            const sub = tok.slice(i, i + sizeCounter);
            splitTokens.push(sub);
            splitIds.push(tokenId + Math.floor(i / sizeCounter) * 7); // simulated ID
            splitOffsets.push([start, Math.min(offset[1], start + sub.length)]);
            start += sub.length;
          }
        } else {
          splitTokens.push(tok);
          splitIds.push(tokenId);
          splitOffsets.push(offset);
        }
      });
      
      baseData.tokens = splitTokens;
      baseData.tokenIds = splitIds;
      baseData.offsets = splitOffsets;
      baseData.tokenCount = splitTokens.length;
    }

    // 3. VOCAB PRESET SIMULATION: adjust vocab size, token count, and ratios
    let vocabSize = 32000;
    if (modelKey === "cl100k_base" || modelKey === "o200k_base") {
      vocabSize = modelKey === "cl100k_base" ? 100000 : 200000;
    } else if (modelKey === "bert") {
      vocabSize = 30000;
    }

    if (vocabPreset === "Aastroots") {
      baseData.tokenCount = Math.max(1, Math.round(baseData.tokenCount * 0.82));
      vocabSize = Math.round(vocabSize * 0.5); // smaller custom base vocab
    } else if (vocabPreset === "FineTune") {
      baseData.tokenCount = Math.max(1, Math.round(baseData.tokenCount * 0.90));
      vocabSize = Math.round(vocabSize * 1.5); // fine-tuned vocabulary extension
    }
    baseData.ratio = text.length > 0 ? parseFloat((baseData.tokenCount / text.length).toFixed(3)) : 0.0;
    baseData.vocabSize = vocabSize;

    // 4. WRITE STRATEGY SIMULATION: Latency / cost multiplier
    let costMultiplier = 1.0;
    if (writePreset === "Batch") {
      costMultiplier = 0.65; // Simulated 35% cost discount for offline batch processing
    }
    baseData.costPerRequest = parseFloat((baseData.costPerRequest * costMultiplier).toFixed(6));
    baseData.costPerMillionRequests = parseFloat((baseData.costPerMillionRequests * costMultiplier).toFixed(2));

    return baseData;
  };

  const activeModelData = getProcessedModelData(activeBackendKey);

  const compareData = {
    cl100k_base: getProcessedModelData("cl100k_base"),
    o200k_base: getProcessedModelData("o200k_base"),
    llama: getProcessedModelData("llama"),
    bert: getProcessedModelData("bert")
  };

  return (
    <div className="min-h-screen text-slate-100 flex overflow-hidden font-sans antialiased bg-[#03010c]">
      
      {/* ==========================================
          LEFT SIDEBAR NAVIGATION
          ========================================== */}
      <aside className="w-[180px] shrink-0 border-r border-slate-800/80 bg-slate-950/70 p-4 flex flex-col justify-between select-none animate-in fade-in slide-in-from-left-2 duration-200">
        <div className="flex flex-col gap-6">
          {/* Dashboard Logo */}
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Workflow className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-widest text-slate-100 bg-gradient-to-r from-slate-100 to-indigo-300 bg-clip-text text-transparent">
              STUDIO
            </span>
          </div>

          {/* Menu Items (Studio, Docs, Cost, Settings) */}
          <nav className="flex flex-col gap-1.5">
            {[
              { id: "studio", label: "Studio", icon: LayoutGrid },
              { id: "docs", label: "Docs", icon: BookOpen },
              { id: "cost", label: "Cost", icon: DollarSign },
              { id: "settings", label: "Settings", icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeSidebarTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSidebarTab(item.id as any)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2.5 ${
                    isActive
                      ? "bg-indigo-650 text-white shadow-lg shadow-indigo-900/30 border border-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Platform Info (No Preferences Button) */}
        <div className="px-3 text-[10px] text-slate-500 font-medium border-t border-slate-900 pt-3">
          v3.2 Stable Platform
        </div>
      </aside>

      {/* ==========================================
          MAIN AREA & TOP BAR
          ========================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen scrollbar-thin">
        
        {/* TOP HEADER BAR */}
        <header className="px-6 py-4 shrink-0 border-b border-slate-800/60 bg-slate-950/20 backdrop-blur-md flex items-center select-none">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-450">
              Platform Dashboard
            </h2>
            <h1 className="text-xl font-black tracking-tight mt-0.5 select-none">
              <span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-transparent">
                Tokenizer
              </span>{" "}
              <span className="text-slate-100 font-extrabold">
                Visualizer Studio
              </span>
            </h1>
          </div>
        </header>

        {/* MAIN DISPLAY WORKSPACE CONTENT */}
        <main className="flex-1 p-6 flex flex-col gap-6 select-none animate-in fade-in duration-200">

          {/* Backend Offline banner if FastAPI is not reachable */}
          {!isApiOnline && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex flex-col md:flex-row items-start gap-4">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-red-200">
                  FastAPI Backend Offline
                </h4>
                <p className="text-[11px] text-red-300/80 mt-0.5 max-w-3xl leading-normal">
                  Could not establish connection to local backend at `localhost:8000`. Offline simulation rules are active. Launch uvicorn locally to enable high-fidelity tiktoken.
                </p>
                <div className="mt-2 flex gap-2 items-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-red-400">Start command:</span>
                  <code className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-slate-350 select-all">
                    cd backend; python run.py
                  </code>
                </div>
              </div>
              <button 
                onClick={handleManualRefresh}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/20 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Retry
              </button>
            </div>
          )}

          {/* ========================================================
              TAB CONTENT 1: STUDIO TAB (THE REFINE WORKSPACE GRID)
              ======================================================== */}
          {activeSidebarTab === "studio" && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
              
              {/* TOP SPLIT GRID (Equalized Height) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                
                {/* LEFT COLUMN: Input Text / Code Card (col-span-6) */}
                <div className="xl:col-span-6 flex flex-col h-full w-full">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md flex flex-col gap-4 shadow-lg hover:shadow-indigo-500/5 transition-all flex-1 h-full">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                      <span className="text-xs font-bold text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-indigo-400" />
                        Input Text / Code
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {text.length} characters
                      </span>
                    </div>

                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Type or paste payload code here..."
                      className="w-full flex-1 min-h-[285px] p-4 rounded-xl bg-slate-950/90 border border-slate-850 text-slate-100 placeholder-slate-650 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none scrollbar-thin shadow-inner leading-relaxed"
                    />

                    {/* PRESET INJECTOR TAGS */}
                    <div className="flex flex-col gap-3.5 pt-1">
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 mb-2 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse"></span>
                          Natural Language Presets
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { id: "english", label: "English Prose" },
                            { id: "englishComplex", label: "English Complex" },
                            { id: "bengali", label: "Bengali (বাংলা)" },
                            { id: "hindi", label: "Hindi (हिन्दी)" },
                            { id: "cyrillic", label: "Cyrillic (Русский)" },
                            { id: "emojis", label: "Symbols & Emojis" }
                          ].map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => handlePresetInject(preset.id as any)}
                              className="px-2 py-1 rounded-lg bg-slate-800/40 hover:bg-indigo-950/40 hover:text-indigo-200 border border-slate-700/50 hover:border-indigo-800/50 text-[10px] font-medium text-slate-300 transition-all cursor-pointer shadow-sm"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                          Program Code Presets
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { id: "python", label: "Python Block" },
                            { id: "dbQuery", label: "SQL Query" },
                            { id: "reactCode", label: "React JS" },
                            { id: "jsonPayload", label: "JSON Config" }
                          ].map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => handlePresetInject(preset.id as any)}
                              className="px-2 py-1 rounded-lg bg-slate-800/40 hover:bg-emerald-950/40 hover:text-emerald-200 border border-slate-700/50 hover:border-emerald-800/50 text-[10px] font-medium text-slate-300 transition-all cursor-pointer shadow-sm"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Model Selection & Token Frequency (col-span-6) */}
                <div className="xl:col-span-6 flex flex-col gap-6 h-full w-full">
                  
                  {/* Model Selection widgets */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md flex flex-col gap-4 shadow-lg hover:shadow-indigo-500/5 transition-all">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                      <span className="text-xs font-bold text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
                        <Workflow className="w-3.5 h-3.5 text-indigo-400" />
                        Model Selection
                      </span>
                    </div>

                    {/* Quick Select Buttons - 4 Active Models */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: "llama", label: "Llama 3", icon: Workflow },
                        { id: "gpt4", label: "GPT-4", icon: Cpu },
                        { id: "gpt4o", label: "GPT-4o", icon: Cpu },
                        { id: "bert", label: "BERT", icon: Layers }
                      ].map((model) => {
                        const Icon = model.icon;
                        const isActive = selectedModel === model.id;
                        return (
                          <button
                            key={model.id}
                            onClick={() => setSelectedModel(model.id)}
                            className={`py-2 rounded-xl text-[9px] font-extrabold border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1 ${
                              isActive
                                ? "bg-indigo-650 text-white shadow-md shadow-indigo-600/10 border-indigo-600/30"
                                : "bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-slate-200"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {model.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Parameters dropdowns (mock tags from design mockup) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">
                            VOCAB PRESET
                          </label>
                        </div>
                        <div className="relative">
                          <select
                            value={vocabPreset}
                            onChange={(e) => setVocabPreset(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800/80 text-slate-305 rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none cursor-pointer appearance-none pr-6"
                          >
                            <option value="Aastroots">Aastroots</option>
                            <option value="Custom">Custom Base</option>
                            <option value="FineTune">FineTune Vocab</option>
                          </select>
                          <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">
                            WRITE STRATEGY
                          </label>
                        </div>
                        <div className="relative">
                          <select
                            value={writePreset}
                            onChange={(e) => setWritePreset(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800/80 text-slate-305 rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none cursor-pointer appearance-none pr-6"
                          >
                            <option value="Write">Write</option>
                            <option value="Read">Read-Heavy</option>
                            <option value="Batch">Batch Process</option>
                          </select>
                          <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Toggles, counters, and utilities */}
                    <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-900">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleManualRefresh}
                          className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200 cursor-pointer animate-in fade-in"
                          title="Refresh tokenization boundaries"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        </button>

                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="text-[9px] font-bold text-slate-450 uppercase">Space Align</span>
                          <button
                            onClick={() => setSpacingToggle(!spacingToggle)}
                            className={`w-7.5 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                              spacingToggle ? "bg-indigo-600" : "bg-slate-800"
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                              spacingToggle ? "translate-x-3" : "translate-x-0"
                            }`} />
                          </button>
                        </div>
                      </div>

                      {/* Count increment counter */}
                      <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800/80">
                        <button 
                          onClick={() => setSizeCounter(prev => Math.max(1, prev - 1))}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900/60 rounded-md cursor-pointer hover:bg-slate-850"
                        >
                          -
                        </button>
                        <span className="px-2 text-[10px] font-mono font-bold text-slate-350">
                          {sizeCounter}
                        </span>
                        <button 
                          onClick={() => setSizeCounter(prev => prev + 1)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900/60 rounded-md cursor-pointer hover:bg-slate-850"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Token Frequency & Details SVG chart (placed cleanly in top right column) */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md flex flex-col gap-4 shadow-lg hover:shadow-indigo-500/5 transition-all flex-1 flex flex-col">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
                      <span className="text-xs font-bold text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                        Token Frequency & Details
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-widest">
                        Sequence Stats: {activeModelData.tokenCount} Tokens, {text.length} Chars, Vocab size: {selectedModel === "llama" ? "32000" : selectedModel === "bert" ? "30000" : "100000"}
                      </span>
                    </div>

                    {/* Dynamic SVG Histogram Bar Chart */}
                    <div className="w-full bg-slate-950/70 border border-slate-900 p-3.5 rounded-xl flex items-end justify-center min-h-[110px] shadow-inner select-none overflow-x-auto scrollbar-thin flex-1">
                      <svg className="w-full min-w-[320px] h-full min-h-[80px] flex" viewBox="0 0 500 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ec4899" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#14b8a6" />
                          </linearGradient>
                          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        {/* Background grid lines */}
                        <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                        <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                        <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                        <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

                        {/* Dynamic rect mapping based on token lengths */}
                        {activeModelData.tokens.map((tok: string, idx: number) => {
                          const count = activeModelData.tokens.length;
                          const colWidth = 500 / count;
                          const barWidth = Math.max(4, colWidth - 5);
                          const x = idx * colWidth + 2;

                          // Height based on character length of the token
                          const maxLen = Math.max(...activeModelData.tokens.map((t: string) => t.length), 1);
                          const normalizedHeight = Math.max(12, (tok.length / maxLen) * 75);
                          const y = 90 - normalizedHeight;

                          return (
                            <g key={`bar-${idx}`}>
                              <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={normalizedHeight}
                                rx="2"
                                fill="url(#neonGradient)"
                                opacity="0.85"
                                className="transition-all duration-200 cursor-pointer hover:opacity-100 hover:scale-x-105"
                              />
                              <text
                                x={x + barWidth / 2}
                                y="98"
                                textAnchor="middle"
                                fill="#64748b"
                                className="text-[6px] font-bold font-mono transition-colors hover:fill-[#ec4899]"
                              >
                                {tok.trim().slice(0, 2) || tok.slice(0, 1) || " "}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                </div>

              </div>

              {/* BOTTOM SPLIT GRID (Tokenized Output and Benchmark Report side-by-side!) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch w-full mt-2 animate-in fade-in duration-300">
                
                {/* LEFT COLUMN: Tokenized Output Card (col-span-6) */}
                <div className="xl:col-span-6 flex flex-col h-full w-full">
                  <TokenCanvas 
                    data={activeModelData} 
                    explanation={explanation} 
                    isLoadingExplain={isLoadingExplain}
                    selectedModelName={activeModelDisplayName}
                    spacingToggle={spacingToggle}
                    inputText={text}
                    apiKey={apiKey}
                    onApplyOptimized={(optText) => setText(optText)}
                    onRedirectToSettings={() => setActiveSidebarTab("settings")}
                    activeCanvasTab={activeCanvasTab}
                    setActiveCanvasTab={setActiveCanvasTab}
                  />
                </div>

                {/* RIGHT COLUMN: Model Benchmark Report Card (col-span-6) */}
                <div className="xl:col-span-6 flex flex-col h-full w-full">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md flex flex-col gap-4 shadow-lg hover:shadow-indigo-500/5 transition-all flex-1 h-full">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 select-none">
                      <span className="text-xs font-bold text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                        Integrated Model Benchmarks & Report
                      </span>
                    </div>

                    <div className="flex flex-col gap-6 flex-1">
                      <MetricsGrid
                        charCount={text.length}
                        tokenCount={activeModelData.tokenCount}
                        ratio={activeModelData.ratio}
                        costPerRequest={activeModelData.costPerRequest}
                        costPerMillionRequests={activeModelData.costPerMillionRequests}
                        modelName={activeBackendKey}
                      />
                      <CompareBar data={compareData} />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================
              TAB CONTENT 2: DOCS TAB (MULTI-DOC VIEWPORT PORTAL)
              ======================================================== */}
          {activeSidebarTab === "docs" && (
            <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-300 select-text">
              <DocsReader />
            </div>
          )}

          {/* ========================================================
              TAB CONTENT 3: COST TAB (DEDICATED BILLING CALCULATOR)
              ======================================================== */}
          {activeSidebarTab === "cost" && (
            <div className="max-w-md mx-auto w-full animate-in fade-in duration-300 select-text">
              <CostCalculator inputTokenCount={activeModelData.tokenCount} />
            </div>
          )}

          {/* ========================================================
              TAB CONTENT 4: SETTINGS TAB (API KEY CONFIG)
              ======================================================== */}
          {activeSidebarTab === "settings" && (
            <div className="max-w-md mx-auto w-full animate-in fade-in duration-300 select-text">
              <ApiKeySettings onKeyChange={(key) => setApiKey(key)} />
            </div>
          )}

        </main>

        {/* FOOTER */}
        <footer className="text-center text-[10px] text-slate-500 font-medium py-4 shrink-0 border-t border-slate-900 select-none">
          Tokenizer Visualizer Studio • Refined Workspace Layout
        </footer>
      </div>

    </div>
  );
}
