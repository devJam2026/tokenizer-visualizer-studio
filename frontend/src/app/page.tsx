"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  AlertTriangle,
  RefreshCw,
  LayoutGrid,
  BookOpen,
  DollarSign,
  Settings,
  Workflow,
  Cpu,
  Layers
} from "lucide-react";
import { PRESETS } from "@/data/presets";
import MetricsGrid from "@/components/MetricsGrid";
import CompareBar from "@/components/CompareBar";
import TokenCanvas from "@/components/TokenCanvas";
import ApiKeySettings from "@/components/ApiKeySettings";
import CostCalculator from "@/components/CostCalculator";
import DocsReader from "@/components/DocsReader";
import PresetSelector from "@/components/PresetSelector";
import ModelSelector from "@/components/ModelSelector";
import TokenFrequencyChart from "@/components/TokenFrequencyChart";

export default function TokenizerVisualizerStudio() {
  const [activeSidebarTab, setActiveSidebarTab] = useState<"studio" | "docs" | "cost" | "settings">("studio");
  const [text, setText] = useState<string>(PRESETS.english);
  const [selectedModel, setSelectedModel] = useState<string>("llama");
  const [isApiOnline, setIsApiOnline] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiData, setApiData] = useState<any>(null);
  const [apiKey, setApiKey] = useState<string>("");

  const [vocabPreset, setVocabPreset] = useState<string>("Aastroots");
  const [writePreset, setWritePreset] = useState<string>("Write");
  const [sizeCounter, setSizeCounter] = useState<number>(19);
  const [spacingToggle, setSpacingToggle] = useState<boolean>(true);
  const [activeCanvasTab, setActiveCanvasTab] = useState<"tokenize" | "visualize" | "analyze" | "optimize">("tokenize");

  const [explanation, setExplanation] = useState<string>("");
  const [isLoadingExplain, setIsLoadingExplain] = useState<boolean>(false);
  const [lastExplainedText, setLastExplainedText] = useState<string>("");
  const explanationCacheRef = useRef<Record<string, string>>({});
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const explanationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setIsApiOnline(data.status === "online"))
      .catch(() => setIsApiOnline(false));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setApiKey(localStorage.getItem("tokenizer_openai_api_key") || "");
    }
  }, []);

  const fetchTokenization = async (inputText: string) => {
    if (!inputText) { setApiData(null); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/tokenize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      if (!res.ok) throw new Error();
      setApiData(await res.json());
      setIsApiOnline(true);
    } catch {
      setIsApiOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExplanation = async () => {
    if (!text) return;
    if (explanationCacheRef.current[text]) {
      setExplanation(explanationCacheRef.current[text]);
      setLastExplainedText(text);
      return;
    }
    setIsLoadingExplain(true);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "X-OpenAI-API-Key": apiKey } : {})
        },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      explanationCacheRef.current[text] = data.explanation;
      setExplanation(data.explanation);
      setLastExplainedText(text);
    } catch {
      setExplanation("### ❌ Error Loading Explanation\nCould not fetch diagnostics from backend service.");
    } finally {
      setIsLoadingExplain(false);
    }
  };

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => fetchTokenization(text), 300);
    return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
  }, [text]);

  useEffect(() => {
    explanationCacheRef.current = {};
    setLastExplainedText("");
  }, [apiKey]);

  useEffect(() => {
    if (explanationTimeoutRef.current) clearTimeout(explanationTimeoutRef.current);
    if (activeCanvasTab !== "analyze" || !text) return;
    if (explanationCacheRef.current[text]) {
      setExplanation(explanationCacheRef.current[text]);
      setLastExplainedText(text);
      return;
    }
    if (text === lastExplainedText) return;
    explanationTimeoutRef.current = setTimeout(() => loadExplanation(), 800);
    return () => { if (explanationTimeoutRef.current) clearTimeout(explanationTimeoutRef.current); };
  }, [text, apiKey, activeCanvasTab]);

  const handleManualRefresh = () => {
    if (explanationCacheRef.current[text]) delete explanationCacheRef.current[text];
    setLastExplainedText("");
    fetchTokenization(text);
    loadExplanation();
  };

  const getProcessedModelData = (modelKey: string) => {
    const rawData = apiData?.tokenizers?.[modelKey] || {
      tokens: [], tokenIds: [], offsets: [], isFallback: true,
      tokenCount: 0, ratio: 0.0, costPerRequest: 0.0, costPerMillionRequests: 0.0
    };
    
    let baseData = JSON.parse(JSON.stringify(rawData));
    if (!baseData.tokens || baseData.tokens.length === 0) return baseData;

    if (spacingToggle) {
      let cleanTokens: string[] = [], cleanIds: number[] = [], cleanOffsets: number[][] = [];
      baseData.tokens.forEach((tok: string, idx: number) => {
        const prev = baseData.tokens[idx-1] || "";
        if (idx > 0 && (prev === " " || prev.trim() === "") && (tok === " " || tok.trim() === "")) return;
        cleanTokens.push(tok);
        cleanIds.push(baseData.tokenIds[idx] || 0);
        cleanOffsets.push(baseData.offsets[idx] || [0, 0]);
      });
      baseData.tokens = cleanTokens; baseData.tokenIds = cleanIds; baseData.offsets = cleanOffsets; baseData.tokenCount = cleanTokens.length;
    }

    if (sizeCounter > 0) {
      let splitTokens: string[] = [], splitIds: number[] = [], splitOffsets: number[][] = [];
      baseData.tokens.forEach((tok: string, idx: number) => {
        const tokenId = baseData.tokenIds[idx] || 9999;
        const offset = baseData.offsets[idx] || [0, 0];
        if (tok.length > sizeCounter) {
          let start = offset[0];
          for (let i = 0; i < tok.length; i += sizeCounter) {
            const sub = tok.slice(i, i + sizeCounter);
            splitTokens.push(sub);
            splitIds.push(tokenId + Math.floor(i / sizeCounter) * 7);
            splitOffsets.push([start, Math.min(offset[1], start + sub.length)]);
            start += sub.length;
          }
        } else {
          splitTokens.push(tok); splitIds.push(tokenId); splitOffsets.push(offset);
        }
      });
      baseData.tokens = splitTokens; baseData.tokenIds = splitIds; baseData.offsets = splitOffsets; baseData.tokenCount = splitTokens.length;
    }

    let vocabSize = modelKey === "bert" ? 30000 : (modelKey.includes("base") ? (modelKey.includes("o200k") ? 200000 : 100000) : 32000);
    if (vocabPreset === "Aastroots") {
      baseData.tokenCount = Math.max(1, Math.round(baseData.tokenCount * 0.82));
      vocabSize = Math.round(vocabSize * 0.5);
    } else if (vocabPreset === "FineTune") {
      baseData.tokenCount = Math.max(1, Math.round(baseData.tokenCount * 0.90));
      vocabSize = Math.round(vocabSize * 1.5);
    }
    baseData.ratio = text.length > 0 ? parseFloat((baseData.tokenCount / text.length).toFixed(3)) : 0.0;
    baseData.vocabSize = vocabSize;

    let costMultiplier = writePreset === "Batch" ? 0.65 : 1.0;
    baseData.costPerRequest = parseFloat((baseData.costPerRequest * costMultiplier).toFixed(6));
    baseData.costPerMillionRequests = parseFloat((baseData.costPerMillionRequests * costMultiplier).toFixed(2));

    return baseData;
  };

  const activeBackendKey = selectedModel === "llama" ? "llama" : (selectedModel === "gpt4" ? "cl100k_base" : (selectedModel === "gpt4o" ? "o200k_base" : "bert"));
  const activeModelDisplayName = selectedModel === "llama" ? "Llama 3" : (selectedModel === "gpt4" ? "GPT-4 (cl100k)" : (selectedModel === "gpt4o" ? "GPT-4o (o200k)" : "Google BERT"));
  const activeModelData = getProcessedModelData(activeBackendKey);

  const compareData = {
    cl100k_base: getProcessedModelData("cl100k_base"),
    o200k_base: getProcessedModelData("o200k_base"),
    llama: getProcessedModelData("llama"),
    bert: getProcessedModelData("bert")
  };

  return (
    <div className="min-h-screen text-slate-100 flex overflow-hidden font-sans antialiased bg-[#03010c]">
      <aside className="w-[180px] shrink-0 border-r border-slate-800/80 bg-slate-950/70 p-4 flex flex-col justify-between select-none animate-in fade-in slide-in-from-left-2 duration-200">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 px-2 select-none">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse">
              <Workflow className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-widest text-slate-100 bg-gradient-to-r from-slate-100 to-indigo-300 bg-clip-text text-transparent">STUDIO</span>
          </div>
          <nav className="flex flex-col gap-1.5">
            {[
              { id: "studio", label: "Studio", icon: LayoutGrid },
              { id: "docs", label: "Docs", icon: BookOpen },
              { id: "cost", label: "Cost", icon: DollarSign },
              { id: "settings", label: "Settings", icon: Settings }
            ].map((item) => {
              const Icon = item.icon, isActive = activeSidebarTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSidebarTab(item.id as any)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2.5 ${
                    isActive ? "bg-indigo-650 text-white shadow-lg shadow-indigo-900/30 border border-indigo-600/30" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="px-3 text-[10px] text-slate-500 font-medium border-t border-slate-900 pt-3">v3.2 Stable Platform</div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen scrollbar-thin">
        <header className="px-6 py-4 shrink-0 border-b border-slate-800/60 bg-slate-950/20 backdrop-blur-md flex items-center select-none">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-450">Platform Dashboard</h2>
            <h1 className="text-xl font-black tracking-tight mt-0.5"><span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-transparent">Tokenizer</span> <span className="text-slate-100 font-extrabold">Visualizer Studio</span></h1>
          </div>
        </header>

        <main className="flex-1 p-6 flex flex-col gap-6 select-none animate-in fade-in duration-200">
          {!isApiOnline && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex flex-col md:flex-row items-start gap-4 select-none">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400"><AlertTriangle className="w-5 h-5" /></div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-red-200">FastAPI Backend Offline</h4>
                <p className="text-[11px] text-red-300/80 mt-0.5 max-w-3xl leading-normal">Could not establish connection to local backend at `localhost:8000`. Offline simulation rules are active.</p>
                <div className="mt-2 flex gap-2 items-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-red-400">Start command:</span>
                  <code className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-slate-350 select-all">cd backend; python run.py</code>
                </div>
              </div>
              <button onClick={handleManualRefresh} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/20 transition-all cursor-pointer"><RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />Retry</button>
            </div>
          )}

          {activeSidebarTab === "studio" && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in duration-305">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                <div className="xl:col-span-6 flex flex-col h-full w-full">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md flex flex-col gap-4 shadow-lg hover:shadow-indigo-500/5 transition-all flex-1 h-full">
                    <PresetSelector onSelectPreset={(val) => setText(val)} charCount={text.length} />
                    <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste payload code here..." className="w-full flex-1 min-h-[200px] p-4 rounded-xl bg-slate-950/90 border border-slate-850 text-slate-100 placeholder-slate-650 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none scrollbar-thin shadow-inner leading-relaxed select-text" />
                  </div>
                </div>

                <div className="xl:col-span-6 flex flex-col gap-6 h-full w-full">
                  <ModelSelector selectedModel={selectedModel} setSelectedModel={setSelectedModel} vocabPreset={vocabPreset} setVocabPreset={setVocabPreset} writePreset={writePreset} setWritePreset={setWritePreset} spacingToggle={spacingToggle} setSpacingToggle={setSpacingToggle} sizeCounter={sizeCounter} setSizeCounter={setSizeCounter} isLoading={isLoading} onRefresh={handleManualRefresh} />
                  <TokenFrequencyChart selectedModel={selectedModel} activeModelData={activeModelData} inputTextLength={text.length} />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch w-full mt-2 animate-in fade-in duration-300">
                <div className="xl:col-span-6 flex flex-col h-full w-full">
                  <TokenCanvas data={activeModelData} explanation={explanation} isLoadingExplain={isLoadingExplain} selectedModelName={activeModelDisplayName} spacingToggle={spacingToggle} inputText={text} apiKey={apiKey} onApplyOptimized={(optText) => setText(optText)} onRedirectToSettings={() => setActiveSidebarTab("settings")} activeCanvasTab={activeCanvasTab} setActiveCanvasTab={setActiveCanvasTab} />
                </div>

                <div className="xl:col-span-6 flex flex-col h-full w-full">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md flex flex-col gap-4 shadow-lg hover:shadow-indigo-500/5 transition-all flex-1 h-full">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2"><span className="text-xs font-bold text-slate-205 uppercase tracking-widest flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />Integrated Model Benchmarks & Report</span></div>
                    <div className="flex flex-col gap-6 flex-1">
                      <MetricsGrid charCount={text.length} tokenCount={activeModelData.tokenCount} ratio={activeModelData.ratio} costPerRequest={activeModelData.costPerRequest} costPerMillionRequests={activeModelData.costPerMillionRequests} modelName={activeBackendKey} />
                      <CompareBar data={compareData} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSidebarTab === "docs" && <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-300 select-text"><DocsReader /></div>}
          {activeSidebarTab === "cost" && <div className="max-w-md mx-auto w-full animate-in fade-in duration-305 select-text"><CostCalculator inputTokenCount={activeModelData.tokenCount} /></div>}
          {activeSidebarTab === "settings" && <div className="max-w-md mx-auto w-full animate-in fade-in duration-300 select-text"><ApiKeySettings onKeyChange={(key) => setApiKey(key)} /></div>}
        </main>

        <footer className="text-center text-[10px] text-slate-500 font-medium py-4 shrink-0 border-t border-slate-900 select-none">Tokenizer Visualizer Studio • Refined Workspace Layout</footer>
      </div>
    </div>
  );
}
