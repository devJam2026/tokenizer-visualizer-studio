"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, Sliders, Server, Info, TrendingUp } from "lucide-react";

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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Sliders className="w-4.5 h-4.5 text-indigo-400" />
            Interactive Prompt Cost Calculator
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Model input/output cost projections based on production query scaling.
          </p>
        </div>
        <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          {Object.entries(MODELS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setSelectedModel(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedModel === key
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {val.name}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs sliders and sliders panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Custom rates (only visible if custom model selected) */}
          {selectedModel === "custom" && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-indigo-900/10">
              <div>
                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block mb-1.5">
                  Input Cost / 1M Tokens ($)
                </label>
                <input
                  type="number"
                  value={customInputRate}
                  onChange={(e) => setCustomInputRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-105 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block mb-1.5">
                  Output Cost / 1M Tokens ($)
                </label>
                <input
                  type="number"
                  value={customOutputRate}
                  onChange={(e) => setCustomOutputRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-105 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          )}

          {/* Slider 1: Expected Output Length */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1">
                Expected Completion Tokens:
                <span className="text-[10px] font-medium text-slate-400 uppercase font-sans border border-slate-800 px-1.5 py-0.5 rounded-md bg-slate-950">
                  {expectedOutputTokens} tokens
                </span>
              </span>
              <span className="text-[10px] text-slate-500">Output model size</span>
            </div>
            <input
              type="range"
              min="50"
              max="4096"
              step="50"
              value={expectedOutputTokens}
              onChange={(e) => setExpectedOutputTokens(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[9px] font-semibold text-slate-500 px-1 font-mono">
              <span>Short (50)</span>
              <span>Medium (1000)</span>
              <span>Long (4096)</span>
            </div>
          </div>

          {/* Slider 2: Monthly Invocations */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1">
                Estimated Monthly Queries:
                <span className="text-[10px] font-medium text-slate-400 uppercase font-sans border border-slate-800 px-1.5 py-0.5 rounded-md bg-slate-950">
                  {monthlyRequests.toLocaleString()} reqs
                </span>
              </span>
              <span className="text-[10px] text-slate-500">Traffic volume scale</span>
            </div>
            <input
              type="range"
              min="1000"
              max="500000"
              step="5000"
              value={monthlyRequests}
              onChange={(e) => setMonthlyRequests(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-[9px] font-semibold text-slate-500 px-1 font-mono">
              <span>1K</span>
              <span>250K</span>
              <span>500K</span>
            </div>
          </div>
        </div>

        {/* Financial reports display (Right Card) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 flex flex-col justify-between gap-4 shadow-inner">
          <div className="flex flex-col gap-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5 flex items-center justify-between">
              <span>ESTIMATED BILLING</span>
              <span className="flex items-center gap-0.5 text-teal-400">
                <TrendingUp className="w-3 h-3" /> Live
              </span>
            </div>

            {/* Main monthly projection cost display */}
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-400">Estimated Monthly Cost:</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-slate-100 to-indigo-300 bg-clip-text text-transparent">
                  ${totalMonthlyCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
            </div>

            {/* Secondary pricing metrics */}
            <div className="grid grid-cols-2 gap-3 mt-2 border-t border-slate-900 pt-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Single Query</span>
                <span className="text-sm font-extrabold text-slate-205 font-mono">
                  ${totalCostPerReq.toFixed(5)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Per 1M Runs</span>
                <span className="text-sm font-extrabold text-indigo-400 font-mono">
                  ${costPerMillionReqs.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Input vs Output gauge breakdown */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[9px] font-bold text-slate-400">
              <span className="text-indigo-400">Input ({inputPct.toFixed(0)}%)</span>
              <span className="text-teal-400">Output ({outputPct.toFixed(0)}%)</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${inputPct}%` }}
              ></div>
              <div 
                className="h-full bg-teal-500 transition-all duration-300"
                style={{ width: `${outputPct}%` }}
              ></div>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-1 leading-normal">
              <Info className="w-3 h-3 shrink-0" />
              <span>Input prompt is {inputTokenCount} tokens ($ {inputRate.toFixed(2)}/1M). Completion is simulated ($ {outputRate.toFixed(2)}/1M).</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
