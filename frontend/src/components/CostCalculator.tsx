"use client";

import React, { useState } from "react";
import { Sliders, Info, TrendingUp, Cpu } from "lucide-react";

interface CostCalculatorProps {
  inputTokenCount: number;
}

interface ModelPricing {
  name: string;
  inputCost: number; // per 1M tokens
  outputCost: number; // per 1M tokens
}

const MODELS: Record<string, ModelPricing> = {
  gpt4o: { name: "GPT-4o", inputCost: 2.50, outputCost: 10.00 },
  gpt4_turbo: { name: "GPT-4 Turbo", inputCost: 10.00, outputCost: 30.00 },
  gpt35_turbo: { name: "GPT-3.5 Turbo", inputCost: 0.50, outputCost: 1.50 },
  custom: { name: "Custom pricing", inputCost: 5.00, outputCost: 15.00 }
};

export default function CostCalculator({ inputTokenCount }: CostCalculatorProps) {
  const [selectedModel, setSelectedModel] = useState<string>("gpt4o");
  const [expectedOutputTokens, setExpectedOutputTokens] = useState<number>(500);
  const [monthlyRequests, setMonthlyRequests] = useState<number>(25000);
  const [customInputRate, setCustomInputRate] = useState<number>(5.00);
  const [customOutputRate, setCustomOutputRate] = useState<number>(15.00);

  // pricing bounds
  const activePricing = MODELS[selectedModel];
  const inputRate = selectedModel === "custom" ? customInputRate : activePricing.inputCost;
  const outputRate = selectedModel === "custom" ? customOutputRate : activePricing.outputCost;

  // calculations
  const costPerInputReq = (inputTokenCount / 1_000_000) * inputRate;
  const costPerOutputReq = (expectedOutputTokens / 1_000_000) * outputRate;
  const totalCostPerReq = costPerInputReq + costPerOutputReq;

  const totalMonthlyCost = totalCostPerReq * monthlyRequests;
  const costPerMillionReqs = totalCostPerReq * 1_000_000;

  // calculate percentages for gauge
  const inputPct = totalCostPerReq > 0 ? (costPerInputReq / totalCostPerReq) * 100 : 50;
  const outputPct = totalCostPerReq > 0 ? (costPerOutputReq / totalCostPerReq) * 100 : 50;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col gap-5 max-w-sm w-full select-none font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Sliders className="w-4 h-4 text-indigo-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-slate-205 uppercase tracking-widest truncate">
            Prompt Cost Calculator
          </h3>
          <p className="text-[10px] text-slate-450 mt-0.5 truncate">
            Model input/output budget projections
          </p>
        </div>
      </div>

      {/* MODEL SELECTOR DROPDOWN (Prevents horizontal squishing) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <Cpu className="w-3 h-3 text-indigo-550" />
          Target LLM Model
        </label>
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-2.5 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer appearance-none pr-8 font-sans"
          >
            {Object.entries(MODELS).map(([key, val]) => (
              <option key={key} value={key} className="bg-slate-950 text-slate-200">
                {val.name} ({key === "custom" ? "Custom" : `$${val.inputCost.toFixed(2)} / $${val.outputCost.toFixed(2)}`})
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
            ▼
          </div>
        </div>
      </div>

      {/* CUSTOM PRICING INPUTS */}
      {selectedModel === "custom" && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950/60 border border-indigo-900/10">
          <div>
            <label className="text-[8px] font-bold text-indigo-305 uppercase tracking-widest block mb-1">
              Input $/1M Tok
            </label>
            <input
              type="number"
              value={customInputRate}
              onChange={(e) => setCustomInputRate(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              step="0.1"
              min="0"
            />
          </div>
          <div>
            <label className="text-[8px] font-bold text-indigo-305 uppercase tracking-widest block mb-1">
              Output $/1M Tok
            </label>
            <input
              type="number"
              value={customOutputRate}
              onChange={(e) => setCustomOutputRate(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              step="0.1"
              min="0"
            />
          </div>
        </div>
      )}

      {/* SLIDER 1: EXPECTED OUTPUT LENGTH */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Completion size
          </span>
          <span className="text-[10px] font-mono font-bold text-indigo-400 bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded">
            {expectedOutputTokens} tokens
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="4096"
          step="50"
          value={expectedOutputTokens}
          onChange={(e) => setExpectedOutputTokens(parseInt(e.target.value))}
          className="w-full h-1 bg-slate-950 rounded appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-[8px] font-bold text-slate-500 font-mono px-0.5">
          <span>Short (50)</span>
          <span>Medium (1K)</span>
          <span>Long (4K)</span>
        </div>
      </div>

      {/* SLIDER 2: MONTHLY INVOCATIONS */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Monthly Traffic
          </span>
          <span className="text-[10px] font-mono font-bold text-teal-400 bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded">
            {monthlyRequests.toLocaleString()} reqs
          </span>
        </div>
        <input
          type="range"
          min="1000"
          max="250000"
          step="5000"
          value={monthlyRequests}
          onChange={(e) => setMonthlyRequests(parseInt(e.target.value))}
          className="w-full h-1 bg-slate-950 rounded appearance-none cursor-pointer accent-teal-500"
        />
        <div className="flex justify-between text-[8px] font-bold text-slate-500 font-mono px-0.5">
          <span>1K reqs</span>
          <span>125K reqs</span>
          <span>250K reqs</span>
        </div>
      </div>

      {/* ESTIMATED BILLING PROJECTIONS CARD */}
      <div className="rounded-xl border border-slate-850 bg-slate-950/80 p-4 flex flex-col gap-4 shadow-inner">
        <div className="flex flex-col gap-2">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5 flex items-center justify-between">
            <span>Estimated Billing</span>
            <span className="flex items-center gap-0.5 text-teal-400">
              <TrendingUp className="w-3 h-3" /> Live
            </span>
          </div>

          {/* Main cost projection display */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">
              Estimated Monthly Cost:
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-100 bg-gradient-to-r from-slate-100 via-indigo-200 to-indigo-300 bg-clip-text text-transparent">
                ${totalMonthlyCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500">/mo</span>
            </div>
          </div>

          {/* Detailed grid pricing (Prevents overlap) */}
          <div className="grid grid-cols-2 gap-2 mt-1 border-t border-slate-900 pt-2 text-xs">
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] font-bold text-slate-500 uppercase truncate">
                Single query
              </span>
              <span className="text-xs font-bold text-slate-300 font-mono truncate">
                ${totalCostPerReq.toFixed(5)}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] font-bold text-slate-500 uppercase truncate">
                Per 1M queries
              </span>
              <span className="text-xs font-bold text-indigo-400 font-mono truncate">
                ${costPerMillionReqs.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Input vs Output proportions bar */}
        <div className="flex flex-col gap-1.5 border-t border-slate-900 pt-2.5">
          <div className="flex justify-between text-[8px] font-extrabold tracking-wide uppercase">
            <span className="text-indigo-400">Input ({inputPct.toFixed(0)}%)</span>
            <span className="text-teal-400">Output ({outputPct.toFixed(0)}%)</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden flex border border-slate-800/80">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${inputPct}%` }}
            ></div>
            <div 
              className="h-full bg-teal-500 transition-all duration-300"
              style={{ width: `${outputPct}%` }}
            ></div>
          </div>
          <div className="flex items-start gap-1 text-[8px] text-slate-500 leading-normal mt-0.5">
            <Info className="w-2.5 h-2.5 shrink-0 mt-0.5 text-slate-600" />
            <span>
              Input is {inputTokenCount} tokens (${inputRate.toFixed(2)}/1M). Output is simulated (${outputRate.toFixed(2)}/1M).
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
