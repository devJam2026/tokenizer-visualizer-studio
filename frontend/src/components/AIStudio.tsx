"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Terminal, ArrowRight, Check, Copy, AlertTriangle, RefreshCw, Cpu } from "lucide-react";

interface AIStudioProps {
  inputText: string;
  apiKey: string;
  onApplyOptimized: (optimizedText: string) => void;
  onRedirectToSettings?: () => void;
}

export default function AIStudio({ inputText, apiKey, onApplyOptimized, onRedirectToSettings }: AIStudioProps) {
  // Optimizer state
  const [optimizedText, setOptimizedText] = useState<string>("");
  const [optExplanation, setOptExplanation] = useState<string[]>([]);
  const [origTokenCount, setOrigTokenCount] = useState<number>(0);
  const [optTokenCount, setOptTokenCount] = useState<number>(0);
  const [savingsPercent, setSavingsPercent] = useState<number>(0);
  const [isLoadingOptimize, setIsLoadingOptimize] = useState<boolean>(false);
  const [optimizeError, setOptimizeError] = useState<string>("");
  const [lastOptimizedInputText, setLastOptimizedInputText] = useState<string>("");

  // Copy state
  const [copiedOpt, setCopiedOpt] = useState(false);

  // Clear states if text is empty
  useEffect(() => {
    if (!inputText) {
      setOptimizedText("");
      setOptExplanation([]);
      setOrigTokenCount(0);
      setOptTokenCount(0);
      setSavingsPercent(0);
      setLastOptimizedInputText("");
    }
  }, [inputText]);

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
      setLastOptimizedInputText(inputText);
    } catch (err: any) {
      console.error(err);
      setOptimizeError(err.message || "Failed to connect to prompt optimizer.");
    } finally {
      setIsLoadingOptimize(false);
    }
  };

  // Handle manual trigger for optimizer to avoid spamming OpenAI
  const handleOptimizeClick = () => {
    loadOptimization();
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 flex-1 w-full">
      
      {/* Title & Connection status tag */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          AI Prompt Optimizer
        </h4>
        
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 select-none ${
          apiKey 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
        }`}>
          <Cpu className="w-3 h-3" />
          {apiKey ? "OpenAI Connected" : "Local Heuristic Mode"}
        </span>
      </div>

      {/* Optimizer main layout block */}
      <div className="flex flex-col gap-4">
        
        {/* Key Validation Warning if no OpenAI key configured */}
        {!apiKey && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col gap-3 select-none animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-450 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-250">OpenAI API Key Required</h4>
                <p className="text-[11px] text-amber-300/80 leading-normal mt-0.5">
                  Dynamic semantic prompt refactoring requires access to a GPT model. Please supply an OpenAI key in the settings panel above to unlock the optimizer workbench.
                </p>
              </div>
            </div>
            {onRedirectToSettings && (
              <button
                onClick={onRedirectToSettings}
                className="self-start px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                Configure OpenAI API Key
              </button>
            )}
          </div>
        )}

        {apiKey && !optimizedText && !isLoadingOptimize && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-10 text-center flex flex-col items-center gap-3 select-none">
            <Sparkles className="w-8 h-8 text-indigo-500/50 animate-pulse-glow" />
            <h4 className="text-sm font-bold text-slate-200">Optimize Prompt Footprint</h4>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Compress prompt redundancy, formatting spaces, and structural phrasing to save up to 40% of tokens while fully retaining prompt constraints.
            </p>
            <button
              onClick={handleOptimizeClick}
              className="mt-2 px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-indigo-900/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Cpu className="w-4 h-4" /> Run Prompt Optimizer
            </button>
          </div>
        )}

        {isLoadingOptimize && (
          <div className="rounded-xl border border-slate-850 bg-slate-950/40 p-16 text-center flex flex-col items-center justify-center gap-3 select-none">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs font-bold text-slate-300">Evaluating prompt structure and running LLM compression...</p>
            <p className="text-[10px] text-slate-500 italic">This usually takes about 2 to 4 seconds.</p>
          </div>
        )}

        {optimizeError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex gap-3 items-start text-xs select-none">
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

        {/* Prompt modification warning banner */}
        {apiKey && optimizedText && !isLoadingOptimize && inputText !== lastOptimizedInputText && (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 flex items-center justify-between gap-3 text-xs text-indigo-300 select-none">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
              <span>Input text has been modified since the last optimization.</span>
            </span>
            <button 
              onClick={handleOptimizeClick}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-650/15"
            >
              <RefreshCw className="w-3 h-3" />
              Re-run Now
            </button>
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
                  {lastOptimizedInputText}
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
                <div className="px-3.5 py-2 rounded-xl bg-indigo-650 text-white font-extrabold text-sm flex items-center gap-1 shadow-lg shadow-indigo-900/20">
                  <Sparkles className="w-4 h-4 animate-bounce" /> Save {savingsPercent}%!
                </div>
              </div>
            </div>

            {/* Right Column: Optimized Results and Copy/Replace Actions */}
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-indigo-900/20 bg-slate-950 p-4 shadow-inner flex flex-col gap-3 flex-1">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Optimized Prompt
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
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-xs font-bold text-slate-350 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  title="Copy optimized text"
                >
                  {copiedOpt ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  Copy
                </button>
                <button
                  onClick={handleOptimizeClick}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 hover:text-white text-xs font-bold text-slate-350 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  title="Re-run prompt optimization"
                >
                  <RefreshCw className="w-4 h-4" />
                  Re-run
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
    </div>
  );
}
