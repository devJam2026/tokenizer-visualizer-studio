"use client";

import React, { useState } from "react";
import { Sparkles, Eye, Code } from "lucide-react";

interface TokenData {
  tokenIds: number[];
  tokens: string[];
  offsets: number[][];
  isFallback: boolean;
}

interface TokenCanvasProps {
  data: TokenData;
}

// Alternating chip theme classes (pastel glassmorphism)
const CHIP_THEMES = [
  {
    bg: "bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 border-sky-500/30",
    glow: "shadow-sky-500/10"
  },
  {
    bg: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border-amber-500/30",
    glow: "shadow-amber-500/10"
  },
  {
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
    glow: "shadow-emerald-500/10"
  },
  {
    bg: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 border-rose-500/30",
    glow: "shadow-rose-500/10"
  },
  {
    bg: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 border-purple-500/30",
    glow: "shadow-purple-500/10"
  },
  {
    bg: "bg-teal-500/10 hover:bg-teal-500/20 text-teal-200 border-teal-500/30",
    glow: "shadow-teal-500/10"
  }
];

export default function TokenCanvas({ data }: TokenCanvasProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const { tokens, tokenIds, offsets } = data;

  if (!tokens || tokens.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center text-slate-400">
        <Sparkles className="w-8 h-8 text-indigo-500/40 mx-auto mb-3 animate-pulse" />
        <p className="text-sm font-medium">Visualization canvas is ready.</p>
        <p className="text-xs text-slate-500 mt-1">Start entering text above to slice it into token chips.</p>
      </div>
    );
  }

  // Formatting utility to make layout characters (spaces, tabs, newlines) visually apparent
  const formatTokenRepresentation = (tok: string): string => {
    if (tok === " ") return " "; // preserve space display
    
    // Replace tabs, returns, newlines with visible symbols for debugging
    let formatted = tok;
    formatted = formatted.replace(/\n/g, "↵\n");
    formatted = formatted.replace(/\t/g, "⇥ ");
    
    // If it's pure spaces, show them clearly
    if (formatted.match(/^ +$/)) {
      return "·".repeat(formatted.length);
    }
    
    return formatted;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Get mouse position relative to window for tooltip
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div 
      className="relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md"
      onMouseMove={handleMouseMove}
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <Eye className="w-4.5 h-4.5 text-indigo-400" />
          Interactive Tokenized Stream
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-900/40">
          {tokens.length} {tokens.length === 1 ? "token" : "tokens"}
        </span>
      </div>

      {/* Grid mapping out tokens */}
      <div className="flex flex-wrap gap-2 leading-relaxed min-h-[120px] max-h-[300px] overflow-y-auto p-4 rounded-xl bg-slate-950/50 border border-slate-900 shadow-inner scrollbar-thin select-none">
        {tokens.map((tok, idx) => {
          const theme = CHIP_THEMES[idx % CHIP_THEMES.length];
          const isHovered = hoveredIdx === idx;
          const tokenId = tokenIds[idx];
          const charSpan = offsets[idx] || [0, 0];

          return (
            <div
              key={`${tok}-${idx}`}
              className={`px-3 py-1.5 rounded-lg border text-sm font-semibold tracking-wide transition-all duration-150 cursor-pointer select-none ${theme.bg} ${
                isHovered ? `scale-105 shadow-md ${theme.glow} ring-2 ring-indigo-500/20` : ""
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Display visual spaces and formats */}
              <span className="font-mono whitespace-pre-wrap">
                {formatTokenRepresentation(tok)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Instructions footer */}
      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
        <Code className="w-3.5 h-3.5 text-indigo-400" />
        <span>Hover over individual colored token chips to inspect the raw String, Token ID, and placing details.</span>
      </div>

      {/* Dynamic Hover Tooltip Popup (absolute portal position) */}
      {hoveredIdx !== null && tooltipPos && (
        <div
          className="fixed z-50 pointer-events-none rounded-xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md min-w-[200px] flex flex-col gap-2 transition-opacity duration-150 animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${tooltipPos.x + 15}px`,
            top: `${tooltipPos.y + 15}px`,
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              Token Inspector
            </span>
            <span className="text-[10px] font-mono bg-indigo-950/60 text-indigo-300 border border-indigo-900/40 px-1.5 py-0.5 rounded">
              Index #{hoveredIdx}
            </span>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">String:</span>
              <span className="font-mono text-slate-100 font-bold bg-slate-950 px-1 py-0.5 rounded border border-slate-800/80 max-w-[120px] truncate">
                {tokens[hoveredIdx] === " " 
                  ? '" "' 
                  : `"${tokens[hoveredIdx].replace(/\n/g, "\\n").replace(/\t/g, "\\t")}"`}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-400">Token ID:</span>
              <span className="font-mono text-emerald-400 font-extrabold">
                {tokenIds[hoveredIdx]}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-400">Char Span:</span>
              <span className="font-mono text-indigo-400">
                [{offsets[hoveredIdx]?.[0]} - {offsets[hoveredIdx]?.[1]}]
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
