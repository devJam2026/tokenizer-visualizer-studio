"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Terminal, ArrowRight, Check, Copy, AlertTriangle, RefreshCw, Cpu } from "lucide-react";

interface AIStudioProps {
  inputText: string;
  apiKey: string;
  onApplyOptimized: (optimizedText: string) => void;
}

export default function AIStudio({ inputText, apiKey, onApplyOptimized }: AIStudioProps) {
  const [activeTab, setActiveTab] = useState<"explain" | "optimize">("explain");
  
  // Explanation state
  const [explanation, setExplanation] = useState<string>("");
  const [isAIExplain, setIsAIExplain] = useState<boolean>(false);
  const [isLoadingExplain, setIsLoadingExplain] = useState<boolean>(false);

  // Optimizer state
  const [optimizedText, setOptimizedText] = useState<string>("");
  const [optExplanation, setOptExplanation] = useState<string[]>([]);
  const [origTokenCount, setOrigTokenCount] = useState<number>(0);
  const [optTokenCount, setOptTokenCount] = useState<number>(0);
  const [savingsPercent, setSavingsPercent] = useState<number>(0);
  const [isLoadingOptimize, setIsLoadingOptimize] = useState<boolean>(false);
  const [optimizeError, setOptimizeError] = useState<string>("");

  // Copy state
  const [copiedExplain, setCopiedExplain] = useState(false);
  const [copiedOpt, setCopiedOpt] = useState(false);

  // Fetch explanation when active tab changes or input changes (with debounce/click)
  const loadExplanation = async () => {
    if (!inputText) return;
    setIsLoadingExplain(true);
    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "X-OpenAI-API-Key": apiKey } : {})
        },
        body: JSON.stringify({ text: inputText })
      });

      if (!response.ok) throw new Error("Explanation API failed");

      const data = await response.json();
      setExplanation(data.explanation);
      setIsAIExplain(data.isAI);
    } catch (err) {
      console.error(err);
      setExplanation("### ❌ Error Loading Explanation\nCould not fetch diagnostics from backend service.");
      setIsAIExplain(false);
    } finally {
      setIsLoadingExplain(false);
    }
  };

  const loadOptimization = async () => {
    if (!inputText) return;
    setIsLoadingOptimize(true);
    setOptimizeError("");
    try {
      const response = await fetch("/api/ai/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-OpenAI-API-Key": apiKey
        },
        body: JSON.stringify({ text: inputText })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "OpenAI API optimization failed");
      }

      const data = await response.json();
      setOptimizedText(data.optimizedText);
      setOptExplanation(data.explanation);
      setOrigTokenCount(data.originalTokenCount);
      setOptTokenCount(data.optimizedTokenCount);
      setSavingsPercent(data.savingsPercent);
    } catch (err: any) {
      console.error(err);
      setOptimizeError(err.message || "Failed to connect to prompt optimizer.");
    } finally {
      setIsLoadingOptimize(false);
    }
  };

  // Re-run diagnostic explain on text changes
  useEffect(() => {
    if (activeTab === "explain") {
      loadExplanation();
    }
  }, [inputText, apiKey]);

  // Handle manual trigger for optimizer to avoid spamming OpenAI
  const handleOptimizeClick = () => {
    loadOptimization();
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Very simple Markdown formatter helper for the terminal window
  const renderFormattedMarkdown = (md: string) => {
    if (!md) return <p className="text-slate-550 italic">No diagnostics loaded.</p>;

    const lines = md.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("###")) {
        return <h4 key={i} className="text-sm font-extrabold text-indigo-400 mt-4 mb-2 first:mt-0 font-sans tracking-wide uppercase">{line.replace("###", "").trim()}</h4>;
      }
      if (line.startsWith("- **")) {
        // highlight standard bold bullet
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const matches = [...line.matchAll(boldRegex)];
        if (matches.length > 0) {
          const title = matches[0][1];
          const rest = line.replace(`- **${title}**`, "");
          return (
            <div key={i} className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-300 leading-relaxed font-sans pl-1">
              <span className="text-indigo-500 shrink-0">•</span>
              <span>
                <strong className="text-slate-100">{title}</strong>
                {rest}
              </span>
            </div>
          );
        }
      }
      if (line.startsWith("**💡") || line.startsWith("**Summary")) {
        return <p key={i} className="mt-4 font-bold text-slate-205 border-t border-slate-900 pt-3 flex items-center gap-1.5 font-sans">{line.replace(/\*\*/g, "")}</p>;
      }
      if (line.trim() && !line.startsWith("*")) {
        return <p key={i} className="text-xs text-slate-350 leading-relaxed mt-1.5 font-sans">{line}</p>;
      }
      return <div key={i} className="h-1" />;
    });
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md flex flex-col gap-5">
      
      {/* Tab controls */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("explain")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "explain"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            AI Diagnostics & Heuristics
          </button>
          <button
            onClick={() => setActiveTab("optimize")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "optimize"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Prompt Optimizer
          </button>
        </div>
        
        {/* Connection status tag */}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
          apiKey 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
        }`}>
          <Cpu className="w-3 h-3" />
          {apiKey ? "OpenAI Connected" : "Local Heuristic Mode"}
        </span>
      </div>

      {/* Tab Content 1: Explain */}
      {activeTab === "explain" && (
        <div className="relative rounded-xl border border-slate-950 bg-slate-950 p-5 shadow-inner">
          <div className="absolute right-4 top-4">
            <button
              onClick={() => copyToClipboard(explanation, setCopiedExplain)}
              className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
              title="Copy explanation"
            >
              {copiedExplain ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin select-text">
            {isLoadingExplain ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400 font-sans">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-xs font-semibold">Running tokenomics compiler diagnostics...</p>
              </div>
            ) : (
              renderFormattedMarkdown(explanation)
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Optimize */}
      {activeTab === "optimize" && (
        <div className="flex flex-col gap-4">
          
          {/* Key Validation Warning if no OpenAI key configured */}
          {!apiKey && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-450 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-250">OpenAI API Key Required</h4>
                <p className="text-[11px] text-amber-300/80 leading-normal mt-0.5">
                  Dynamic semantic prompt refactoring requires access to a GPT model. Please supply an OpenAI key in the settings panel above to unlock the optimizer workbench.
                </p>
              </div>
            </div>
          )}

          {apiKey && !optimizedText && !isLoadingOptimize && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-10 text-center flex flex-col items-center gap-3">
              <Sparkles className="w-8 h-8 text-indigo-500/50 animate-pulse-glow" />
              <h4 className="text-sm font-bold text-slate-200">Optimize Prompt Footprint</h4>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Compress prompt redundancy, formatting spaces, and structural phrasing to save up to 40% of tokens while fully retaining prompt constraints.
              </p>
              <button
                onClick={handleOptimizeClick}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-900/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Cpu className="w-4 h-4" /> Run Prompt Optimizer
              </button>
            </div>
          )}

          {isLoadingOptimize && (
            <div className="rounded-xl border border-slate-850 bg-slate-950/40 p-16 text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs font-bold text-slate-300">Evaluating prompt structure and running LLM compression...</p>
              <p className="text-[10px] text-slate-500 italic">This usually takes about 2 to 4 seconds.</p>
            </div>
          )}

          {optimizeError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex gap-3 items-start text-xs">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-200">Optimizer Failed</h4>
                <p className="text-red-300/80 leading-normal mt-0.5">{optimizeError}</p>
                <button 
                  onClick={handleOptimizeClick}
                  className="mt-3 px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-205 font-bold cursor-pointer transition-colors"
                >
                  Retry Optimization
                </button>
              </div>
            </div>
          )}

          {/* Optimized Output displays */}
          {apiKey && optimizedText && !isLoadingOptimize && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 select-none font-sans">
              
              {/* Left Column: Original and Stats */}
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-inner flex-1 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Original Input</span>
                    <span className="text-xs font-mono text-slate-400 font-bold">{origTokenCount} tokens</span>
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-6 font-mono leading-relaxed select-text">
                    {inputText}
                  </div>
                </div>

                {/* Micro savings metrics */}
                <div className="rounded-xl border border-indigo-900/10 bg-indigo-500/5 p-4 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Calculated savings</span>
                    <span className="text-2xl font-extrabold text-indigo-200 mt-1 font-sans">
                      {origTokenCount - optTokenCount} tokens
                    </span>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-extrabold text-sm flex items-center gap-1 shadow-lg shadow-indigo-900/20">
                    <Sparkles className="w-4 h-4 animate-bounce" /> Save {savingsPercent}%!
                  </div>
                </div>
              </div>

              {/* Right Column: Optimized Results and Copy/Replace Actions */}
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-indigo-900/20 bg-slate-950 p-4 shadow-inner flex flex-col gap-3 flex-1">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" /> Optimized Prompt
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{optTokenCount} tokens</span>
                  </div>
                  <div className="text-[11px] text-slate-205 line-clamp-6 font-mono leading-relaxed bg-indigo-950/5 p-2 rounded border border-indigo-950/20 select-text">
                    {optimizedText}
                  </div>

                  {/* Highlights explanations list */}
                  {optExplanation.length > 0 && (
                    <div className="border-t border-slate-900 pt-3">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                        Compaction Actions:
                      </span>
                      <div className="flex flex-col gap-1">
                        {optExplanation.map((bullet, index) => (
                          <div key={index} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer action bar */}
                <div className="flex gap-3 mt-1.5">
                  <button
                    onClick={() => copyToClipboard(optimizedText, setCopiedOpt)}
                    className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-xs font-bold text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {copiedOpt ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    Copy
                  </button>
                  <button
                    onClick={() => onApplyOptimized(optimizedText)}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-900/25"
                  >
                    Replace Input Payload
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
