"use client";

import React from "react";

interface AnalysisViewerProps {
  explanation: string;
}

export default function AnalysisViewer({ explanation }: AnalysisViewerProps) {
  if (!explanation) {
    return <p className="text-slate-500 italic text-xs">No analysis loaded. Write some text to profile.</p>;
  }

  const lines = explanation.split("\n");
  
  return (
    <div className="flex flex-col gap-2 overflow-y-auto pr-2 scrollbar-thin select-text font-sans flex-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        
        if (trimmed.startsWith("###")) {
          return (
            <h4 key={i} className="text-xs font-extrabold text-indigo-400 mt-3 mb-1 uppercase tracking-wide select-none">
              {trimmed.replace("###", "").trim()}
            </h4>
          );
        }
        
        if (trimmed.startsWith("- **")) {
          const boldRegex = /\*\*([^*]+)\*\*/g;
          const matches = [...trimmed.matchAll(boldRegex)];
          if (matches.length > 0) {
            const title = matches[0][1];
            const rest = trimmed.replace(`- **${title}**`, "");
            return (
              <div key={i} className="mt-1.5 flex items-start gap-1 text-[11px] text-slate-350 leading-relaxed pl-1">
                <span className="text-indigo-500 shrink-0 select-none">•</span>
                <span>
                  <strong className="text-slate-200">{title}</strong>
                  {rest}
                </span>
              </div>
            );
          }
        }
        
        if (trimmed.startsWith("**💡") || trimmed.startsWith("**Summary")) {
          return (
            <p key={i} className="mt-3 font-bold text-slate-205 border-t border-slate-900/60 pt-2 flex items-center gap-1 text-xs">
              {trimmed.replace(/\*\*/g, "")}
            </p>
          );
        }
        
        if (trimmed && !trimmed.startsWith("*")) {
          return (
            <p key={i} className="text-[11px] text-slate-400 leading-normal mt-1">
              {trimmed}
            </p>
          );
        }
        
        return <div key={i} className="h-0.5" />;
      })}
    </div>
  );
}
