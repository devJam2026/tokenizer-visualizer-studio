"use client";

import React, { useState, useEffect } from "react";
import { Key, Eye, EyeOff, Check, AlertCircle } from "lucide-react";

interface ApiKeySettingsProps {
  onKeyChange: (key: string) => void;
}

export default function ApiKeySettings({ onKeyChange }: ApiKeySettingsProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("tokenizer_openai_api_key") || "";
    setApiKey(savedKey);
    onKeyChange(savedKey);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("tokenizer_openai_api_key", apiKey);
    onKeyChange(apiKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClear = () => {
    localStorage.removeItem("tokenizer_openai_api_key");
    setApiKey("");
    onKeyChange("");
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md max-w-sm w-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-indigo-400" />
          OpenAI API Key
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
          Local Storage Only
        </span>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-2">
        <div className="relative rounded-lg bg-slate-950 border border-slate-850 p-1 flex items-center">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-proj-..."
            className="w-full bg-transparent px-2.5 py-1 text-xs text-slate-250 placeholder-slate-600 focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex gap-2 justify-end mt-1">
          {apiKey && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1 rounded bg-red-950/40 border border-red-900/40 hover:bg-red-900/30 text-[10px] font-bold text-red-300 transition-all cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="px-3 py-1 rounded bg-indigo-650 hover:bg-indigo-600 text-[10px] font-bold text-white transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-indigo-900/20"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-450" />
                Applied
              </>
            ) : (
              "Save Key"
            )}
          </button>
        </div>
      </form>

      <div className="mt-2.5 flex items-start gap-1.5 text-[10px] text-slate-450 leading-normal">
        <AlertCircle className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
        <span>
          Provides token diagnostics and prompt compression. If cleared, diagnostics fall back to a built-in static heuristics analyzer.
        </span>
      </div>
    </div>
  );
}
