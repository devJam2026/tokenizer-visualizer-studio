"use client";

import React from "react";
import { Hash, AlignLeft, Percent, DollarSign } from "lucide-react";

interface MetricsGridProps {
  charCount: number;
  tokenCount: number;
  ratio: number;
  costPerRequest: number;
  costPerMillionRequests: number;
  modelName: string;
}

export default function MetricsGrid({
  charCount,
  tokenCount,
  ratio,
  costPerRequest,
  costPerMillionRequests,
  modelName
}: MetricsGridProps) {
  // Format model names for beautiful display
  const modelLabels: Record<string, string> = {
    cl100k_base: "GPT-4 (cl100k)",
    o200k_base: "GPT-4o (o200k)",
    llama: "LLaMA (SentencePiece)",
    bert: "BERT (WordPiece)"
  };

  const activeModelLabel = modelLabels[modelName] || modelName;

  const metrics = [
    {
      id: "metric-char-count",
      title: "Characters",
      value: charCount,
      subtitle: "Raw text length",
      icon: AlignLeft,
      color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-400",
      iconBg: "bg-blue-500/20 text-blue-300"
    },
    {
      id: "metric-token-count",
      title: "Tokens",
      value: tokenCount,
      subtitle: activeModelLabel,
      icon: Hash,
      color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400",
      iconBg: "bg-emerald-500/20 text-emerald-300"
    },
    {
      id: "metric-token-ratio",
      title: "Ratio",
      value: ratio.toFixed(2),
      subtitle: "Tokens per character",
      icon: Percent,
      color: "from-purple-500/10 to-fuchsia-500/10 border-purple-500/20 text-purple-400",
      iconBg: "bg-purple-500/20 text-purple-300"
    },
    {
      id: "metric-cost",
      title: "Est. Cost / 1M Requests",
      value: `$${costPerMillionRequests.toFixed(2)}`,
      subtitle: `Per request: $${costPerRequest.toFixed(6)}`,
      icon: DollarSign,
      color: "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400",
      iconBg: "bg-amber-500/20 text-amber-300"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {metrics.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.id}
            id={item.id}
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${item.color} p-6 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/5 group`}
          >
            {/* Ambient Background Glow Effect */}
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-current opacity-[0.03] blur-xl group-hover:scale-125 transition-transform duration-500"></div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  {item.title}
                </p>
                <h3 className="mt-2 text-3xl font-bold font-sans text-slate-100 tracking-tight transition-all duration-300">
                  {item.value}
                </h3>
              </div>
              <div className={`p-3 rounded-xl ${item.iconBg} transition-transform duration-300 group-hover:rotate-6`}>
                <IconComponent className="w-6 h-6" />
              </div>
            </div>
            
            <div className="mt-4 flex items-center text-xs text-slate-400 font-medium">
              <span className="truncate">{item.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
