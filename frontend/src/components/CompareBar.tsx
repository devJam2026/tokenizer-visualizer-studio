"use client";

import React from "react";
import { Info, Sparkles, CheckCircle2 } from "lucide-react";

interface TokenizerStats {
  tokenCount: number;
  ratio: number;
  isFallback: boolean;
}

interface CompareBarProps {
  data: Record<string, TokenizerStats>;
}

export default function CompareBar({ data }: CompareBarProps) {
  // Extract token counts
  const cl100Count = data.cl100k_base?.tokenCount || 0;
  const o200Count = data.o200k_base?.tokenCount || 0;
  const llamaCount = data.llama?.tokenCount || 0;
  const bertCount = data.bert?.tokenCount || 0;

  const activeTokenizers = [
    {
      id: "cl100k_base",
      name: "OpenAI GPT-4",
      algorithm: "BPE (cl100k_base)",
      count: cl100Count,
      ratio: data.cl100k_base?.ratio || 0,
      isFallback: data.cl100k_base?.isFallback || false,
      color: "bg-blue-500",
      bg: "bg-blue-950/40 border-blue-900/30",
      accent: "text-blue-400"
    },
    {
      id: "o200k_base",
      name: "OpenAI GPT-4o",
      algorithm: "BPE (o200k_base)",
      count: o200Count,
      ratio: data.o200k_base?.ratio || 0,
      isFallback: data.o200k_base?.isFallback || false,
      color: "bg-indigo-500",
      bg: "bg-indigo-950/40 border-indigo-900/30",
      accent: "text-indigo-400"
    },
    {
      id: "llama",
      name: "LLaMA-style",
      algorithm: "SentencePiece-based",
      count: llamaCount,
      ratio: data.llama?.ratio || 0,
      isFallback: data.llama?.isFallback || false,
      color: "bg-teal-500",
      bg: "bg-teal-950/40 border-teal-900/30",
      accent: "text-teal-400"
    },
    {
      id: "bert",
      name: "Google BERT",
      algorithm: "WordPiece",
      count: bertCount,
      ratio: data.bert?.ratio || 0,
      isFallback: data.bert?.isFallback || false,
      color: "bg-purple-500",
      bg: "bg-purple-950/40 border-purple-900/30",
      accent: "text-purple-400"
    }
  ];

  // Find the most efficient tokenizer (minimum non-zero token count)
  const validCounts = activeTokenizers.map(t => t.count).filter(c => c > 0);
  const minCount = validCounts.length > 0 ? Math.min(...validCounts) : 0;
  const maxCount = validCounts.length > 0 ? Math.max(...validCounts) : 100;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Tokenizer Side-by-Side Comparison
            <span className="text-xs font-normal text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Fewer tokens = Lower API latency & cost
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing comparative efficiency over identical text. Green checks represent optimal vocabulary packaging.
          </p>
        </div>
        <div className="self-start sm:self-center text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          Lower is better
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeTokenizers.map((tok) => {
          const isWinner = minCount > 0 && tok.count === minCount;
          // Calculate percentage width of the progress bar
          // We normalize so the max token count corresponds to ~90% and scale others down, with min being 10%
          const pct = maxCount > 0 ? Math.max(15, Math.round((tok.count / maxCount) * 100)) : 0;

          return (
            <div
              key={tok.id}
              className={`rounded-xl border p-4 transition-all duration-300 ${tok.bg} hover:border-indigo-500/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.12)]`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-200">{tok.name}</span>
                    {isWinner && (
                      <span className="flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                        <Sparkles className="w-2.5 h-2.5" /> Winner
                      </span>
                    )}
                    {tok.isFallback && (
                      <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        simulated
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{tok.algorithm}</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className={`text-base font-extrabold ${tok.accent}`}>
                      {tok.count}
                    </span>
                    <span className="text-xs text-slate-400">tokens</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Ratio: {tok.ratio.toFixed(2)} tokens/char
                  </div>
                </div>
              </div>

              {/* Progress bar container */}
              <div className="mt-3 w-full bg-slate-950/60 rounded-full h-3 overflow-hidden p-[2px] border border-slate-800/80">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${tok.color} ${
                    isWinner ? "shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse" : ""
                  }`}
                  style={{ width: `${tok.count > 0 ? pct : 0}%` }}
                ></div>
              </div>

              {/* Detailed mini info */}
              <div className="mt-2.5 flex justify-between items-center text-[10px] text-slate-400">
                <span className="truncate">
                  {tok.id === "o200k_base"
                    ? "Upgraded vocabulary (200k items) for multi-lingual compression."
                    : tok.id === "cl100k_base"
                    ? "Industry-standard Tiktoken GPT-4 base representation."
                    : tok.id === "llama"
                    ? "SentencePiece-based LLaMA-compatible tokenizer (preserves layout)."
                    : "WordPiece subword slicing (classic lookup representation)."}
                </span>
                {isWinner && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
