"use client";

import React, { useState } from "react";
import { Sparkles, Eye, Code, Info, RefreshCw, AlertTriangle } from "lucide-react";
import AIStudio from "./AIStudio";

interface TokenData {
  tokenIds: number[];
  tokens: string[];
  offsets: number[][];
  isFallback: boolean;
  tokenCount: number;
  ratio: number;
  costPerRequest: number;
  costPerMillionRequests: number;
}

interface TokenCanvasProps {
  data: TokenData;
  explanation?: string;
  isLoadingExplain?: boolean;
  selectedModelName: string;
  spacingToggle: boolean;
  
  // Optimizer props to support the new "Optimize" Tab 4
  inputText: string;
  apiKey: string;
  onApplyOptimized: (optimizedText: string) => void;
  onRedirectToSettings?: () => void;
  activeCanvasTab: "tokenize" | "visualize" | "analyze" | "optimize";
  setActiveCanvasTab: (tab: "tokenize" | "visualize" | "analyze" | "optimize") => void;
}

// Upgraded premium pill chip colors with matching neon glow shadows
const CHIP_THEMES = [
  {
    bg: "bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 border-sky-400/30 hover:border-sky-400 hover:shadow-[0_0_15px_rgba(14,165,233,0.35)]",
    bubble: "bg-sky-950 border-sky-400/40 text-sky-300 shadow-[0_0_10px_rgba(14,165,233,0.2)]"
  },
  {
    bg: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 border-purple-400/30 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.35)]",
    bubble: "bg-purple-950 border-purple-400/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
  },
  {
    bg: "bg-teal-500/10 hover:bg-teal-500/20 text-teal-200 border-teal-400/30 hover:border-teal-400 hover:shadow-[0_0_15px_rgba(20,184,166,0.35)]",
    bubble: "bg-teal-950 border-teal-400/40 text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.2)]"
  },
  {
    bg: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border-amber-400/30 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)]",
    bubble: "bg-amber-950 border-amber-400/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
  },
  {
    bg: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 border-rose-400/30 hover:border-rose-400 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)]",
    bubble: "bg-rose-950 border-rose-400/40 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
  },
  {
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 border-emerald-400/30 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.35)]",
    bubble: "bg-emerald-950 border-emerald-400/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
  }
];

export default function TokenCanvas({ 
  data, 
  explanation = "", 
  isLoadingExplain = false, 
  selectedModelName,
  spacingToggle,
  inputText,
  apiKey,
  onApplyOptimized,
  onRedirectToSettings,
  activeCanvasTab,
  setActiveCanvasTab
}: TokenCanvasProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { tokens, tokenIds } = data;

  if (!tokens || tokens.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-16 text-center text-slate-400 h-full flex flex-col items-center justify-center select-none">
        <Sparkles className="w-8 h-8 text-indigo-500/30 mb-3 animate-pulse" />
        <p className="text-sm font-semibold text-slate-350">Visualization Canvas Ready</p>
        <p className="text-xs text-slate-500 mt-1">Start entering code or prompt payloads on the left to slice text into glowing tokens.</p>
      </div>
    );
  }

  // Formatting utility to make layout space characters visually apparent inside chips
  const formatTokenRepresentation = (tok: string, showDeadAir: boolean = false): string => {
    if (tok === " ") {
      if (spacingToggle) return " "; // SentencePiece representation block indicator
      return showDeadAir ? "·" : " ";
    } 
    
    let formatted = tok;
    if (showDeadAir) {
      formatted = formatted.replace(/\n/g, "↵\n");
      formatted = formatted.replace(/\t/g, "⇥ ");
    } else {
      formatted = formatted.replace(/\n/g, "↵");
      formatted = formatted.replace(/\t/g, "⇥ ");
    }
    
    if (formatted.match(/^ +$/)) {
      return "·".repeat(formatted.length);
    }
    
    return formatted;
  };

  // Simple markdown renderer for the analysis tab
  const renderFormattedAnalysis = (md: string) => {
    if (!md) return <p className="text-slate-500 italic text-xs">No analysis loaded. Write some text to profile.</p>;
    const lines = md.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("###")) {
        return <h4 key={i} className="text-xs font-extrabold text-indigo-400 mt-3 mb-1 uppercase tracking-wide">{line.replace("###", "").trim()}</h4>;
      }
      if (line.startsWith("- **")) {
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const matches = [...line.matchAll(boldRegex)];
        if (matches.length > 0) {
          const title = matches[0][1];
          const rest = line.replace(`- **${title}**`, "");
          return (
            <div key={i} className="mt-1.5 flex items-start gap-1 text-[11px] text-slate-350 leading-relaxed pl-1">
              <span className="text-indigo-500 shrink-0">•</span>
              <span>
                <strong className="text-slate-200">{title}</strong>
                {rest}
              </span>
            </div>
          );
        }
      }
      if (line.startsWith("**💡") || line.startsWith("**Summary")) {
        return <p key={i} className="mt-3 font-bold text-slate-200 border-t border-slate-900 pt-2 flex items-center gap-1 text-xs">{line.replace(/\*\*/g, "")}</p>;
      }
      if (line.trim() && !line.startsWith("*")) {
        return <p key={i} className="text-[11px] text-slate-400 leading-normal mt-1">{line}</p>;
      }
      return <div key={i} className="h-0.5" />;
    });
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md flex flex-col gap-4 shadow-lg hover:shadow-indigo-500/5 transition-all w-full animate-in fade-in duration-200 flex-1 h-full">
      
      {/* Card Header & Canvas Tabs (Starts with tabs only!) */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-1 select-none">
        {/* 4 Tabs: Tokenize, Visualize, Analyze, Optimizer */}
        <div className="inline-flex rounded-lg bg-slate-950 border border-slate-850 p-0.5">
          {[
            { id: "tokenize", label: "Tokenize", color: "bg-teal-500 text-slate-950 font-extrabold" },
            { id: "visualize", label: "Visualize", color: "bg-pink-500 text-slate-950 font-extrabold" },
            { id: "analyze", label: "Analyze", color: "bg-indigo-650 text-white font-extrabold" },
            { id: "optimize", label: "Optimizer", color: "bg-purple-650 text-white font-extrabold" }
          ].map((tab) => {
            const isActive = activeCanvasTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCanvasTab(tab.id as any)}
                className={`px-3 py-1 rounded-md text-[10px] tracking-wide transition-all cursor-pointer ${
                  isActive 
                    ? tab.color 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Model Identifier on the top right */}
        <div className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-widest bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-850/60 flex items-center gap-1.5 shadow-inner">
          <Eye className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Active: {selectedModelName}</span>
        </div>
      </div>

      {/* The Dynamic Viewport Content */}
      <div className="min-h-[200px] max-h-[390px] overflow-y-auto p-5 rounded-xl bg-slate-950/70 border border-slate-900 shadow-inner scrollbar-thin relative flex-1 flex flex-col">
        
        {/* 1. TOKENIZE VIEW (Standard Pills) */}
        {activeCanvasTab === "tokenize" && (
          <div className="flex flex-wrap gap-x-3 gap-y-5 leading-relaxed items-center">
            {tokens.map((tok, idx) => {
              const theme = CHIP_THEMES[idx % CHIP_THEMES.length];
              const isHovered = hoveredIdx === idx;
              const tokenId = tokenIds[idx];

              return (
                <div 
                  key={`tok-${idx}`}
                  className="relative inline-block"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <div
                    className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold tracking-wide transition-all duration-150 cursor-pointer select-none ${theme.bg} ${
                      isHovered ? "scale-[1.04] text-white" : "text-slate-200"
                    }`}
                  >
                    <span className="font-mono whitespace-pre-wrap">
                      {formatTokenRepresentation(tok, false)}
                    </span>
                  </div>

                  {isHovered && (
                    <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-40 px-2 py-0.5 rounded-md border text-[9px] font-mono font-extrabold flex items-center gap-1 backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-150 whitespace-nowrap pointer-events-none ${theme.bubble}`}>
                      <span className="opacity-60 text-[8px]">📍</span>
                      {tokenId}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 2. VISUALIZE VIEW (Dead Air Whitespace highlighting) */}
        {activeCanvasTab === "visualize" && (
          <div className="flex flex-wrap gap-x-2 gap-y-4 leading-relaxed items-center">
            {tokens.map((tok, idx) => {
              const isHovered = hoveredIdx === idx;
              const isLayout = tok === " " || tok === "\t" || tok === "\n" || tok.includes(" ") || tok.includes("\n") || tok.includes("\t");

              return (
                <div
                  key={`vis-${idx}`}
                  className={`px-3.5 py-2 rounded-lg border text-sm font-semibold tracking-wide transition-all select-none cursor-pointer ${
                    isLayout 
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.15)]" 
                      : "bg-slate-900/50 border-slate-800 text-slate-400"
                  } ${isHovered ? "scale-[1.03] border-indigo-500" : ""}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  title={isLayout ? "Indentation / Whitespace Token" : "Word Token"}
                >
                  <span className="font-mono whitespace-pre-wrap">
                    {formatTokenRepresentation(tok, true)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. ANALYZE VIEW (Direct diagnostics inside the Canvas) */}
        {activeCanvasTab === "analyze" && (
          <div className="flex flex-col gap-2 overflow-y-auto pr-2 scrollbar-thin select-text font-sans flex-1">
            {/* Key Validation Warning if no OpenAI key configured in Analyze Tab */}
            {!apiKey && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col gap-3 select-none mb-2">
                <div className="flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-amber-450 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-250">OpenAI API Key Not Configured</h4>
                    <p className="text-[11px] text-amber-300/80 leading-normal mt-0.5">
                      Currently utilizing local heuristic offline diagnostics. Supply an OpenAI key in the settings panel to activate advanced GPT-4 LLM tokenomics compiler reports.
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
            
            {isLoadingExplain ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400 font-sans animate-pulse">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                <p className="text-[11px] font-semibold">Generating live model diagnostics...</p>
              </div>
            ) : (
              renderFormattedAnalysis(explanation)
            )}
          </div>
        )}

        {/* 4. OPTIMIZE VIEW (Embedded AI Compaction Workbench!) */}
        {activeCanvasTab === "optimize" && (
          <div className="animate-in fade-in duration-300 select-text">
            <AIStudio 
              inputText={inputText}
              apiKey={apiKey}
              onApplyOptimized={onApplyOptimized}
              onRedirectToSettings={onRedirectToSettings}
            />
          </div>
        )}
      </div>

      {/* Interactive instructions footer */}
      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1 select-none">
        <Info className="w-3.5 h-3.5 text-indigo-500" />
        <span>
          {activeCanvasTab === "tokenize" && "Hover over chips to reveal raw String, Token ID, and placing details."}
          {activeCanvasTab === "visualize" && "Red items represent layout indentation and whitespace tokens."}
          {activeCanvasTab === "analyze" && "Offline-resilient heuristic diagnostic compiler report."}
          {activeCanvasTab === "optimize" && "Lossless AI compaction console to compress prompts up to 45%."}
        </span>
      </div>
    </div>
  );
}
