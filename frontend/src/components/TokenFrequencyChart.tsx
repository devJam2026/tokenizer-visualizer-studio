"use client";

import React from "react";
import { TrendingUp } from "lucide-react";

interface TokenFrequencyChartProps {
  selectedModel: string;
  activeModelData: {
    tokenCount: number;
    tokens: string[];
  };
  inputTextLength: number;
}

export default function TokenFrequencyChart({
  selectedModel,
  activeModelData,
  inputTextLength
}: TokenFrequencyChartProps) {
  const getVocabDisplaySize = (model: string): string => {
    if (model === "llama") return "32000";
    if (model === "bert") return "30000";
    return "100000";
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md flex flex-col gap-4 shadow-lg hover:shadow-indigo-500/5 transition-all flex-1 h-full select-none">
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
        <span className="text-xs font-bold text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          Token Frequency & Details
        </span>
        <span className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-widest">
          Sequence Stats: {activeModelData.tokenCount} Tokens, {inputTextLength} Chars, Vocab size: {getVocabDisplaySize(selectedModel)}
        </span>
      </div>

      {/* Dynamic SVG Histogram Bar Chart */}
      <div className="w-full bg-slate-950/70 border border-slate-900 p-3.5 rounded-xl flex items-end justify-center min-h-[110px] shadow-inner overflow-x-auto scrollbar-thin flex-1">
        {activeModelData.tokens && activeModelData.tokens.length > 0 ? (
          <svg className="w-full min-w-[320px] h-full min-h-[80px] flex" viewBox="0 0 500 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
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
        ) : (
          <div className="text-[10px] text-slate-500 italic flex items-center justify-center h-full w-full">
            No active tokens to benchmark
          </div>
        )}
      </div>
    </div>
  );
}
