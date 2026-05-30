"use client";

import React from "react";
import { Code } from "lucide-react";
import { PRESETS } from "../data/presets";

interface PresetSelectorProps {
  onSelectPreset: (text: string) => void;
  charCount: number;
}

export default function PresetSelector({ onSelectPreset, charCount }: PresetSelectorProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
        <span className="text-xs font-bold text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
          <Code className="w-3.5 h-3.5 text-indigo-400" />
          Input Text / Code
        </span>
        <span className="text-[10px] font-mono text-slate-500">
          {charCount} characters
        </span>
      </div>

      <div className="flex flex-col gap-3.5 pt-1">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 mb-2 flex items-center gap-1.5 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
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
                onClick={() => onSelectPreset(PRESETS[preset.id as keyof typeof PRESETS])}
                className="px-2 py-1 rounded-lg bg-slate-800/40 hover:bg-indigo-950/40 hover:text-indigo-200 border border-slate-700/50 hover:border-indigo-800/50 text-[10px] font-medium text-slate-300 transition-all cursor-pointer shadow-sm"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1.5 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
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
                onClick={() => onSelectPreset(PRESETS[preset.id as keyof typeof PRESETS])}
                className="px-2 py-1 rounded-lg bg-slate-800/40 hover:bg-emerald-950/40 hover:text-emerald-200 border border-slate-700/50 hover:border-emerald-800/50 text-[10px] font-medium text-slate-300 transition-all cursor-pointer shadow-sm"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
