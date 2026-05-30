"use client";

import React from "react";
import { Workflow, Cpu, Layers, ChevronDown, RefreshCw } from "lucide-react";

interface ModelSelectorProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  vocabPreset: string;
  setVocabPreset: (preset: string) => void;
  writePreset: string;
  setWritePreset: (strategy: string) => void;
  spacingToggle: boolean;
  setSpacingToggle: (toggle: boolean) => void;
  sizeCounter: number;
  setSizeCounter: React.Dispatch<React.SetStateAction<number>>;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function ModelSelector({
  selectedModel,
  setSelectedModel,
  vocabPreset,
  setVocabPreset,
  writePreset,
  setWritePreset,
  spacingToggle,
  setSpacingToggle,
  sizeCounter,
  setSizeCounter,
  isLoading,
  onRefresh
}: ModelSelectorProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md flex flex-col gap-4 shadow-lg hover:shadow-indigo-500/5 transition-all select-none">
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
          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">
            VOCAB PRESET
          </label>
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
          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">
            WRITE STRATEGY
          </label>
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
            onClick={onRefresh}
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
  );
}
