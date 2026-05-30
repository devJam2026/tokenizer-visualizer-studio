"use client";

import React, { useState } from "react";
import { DOCS_DATA, DocItem } from "@/data/docsData";
import { 
  BookOpen, 
  GraduationCap, 
  Cpu, 
  Layers, 
  ChevronRight, 
  Search, 
  CheckCircle,
  FileText,
  HelpCircle
} from "lucide-react";

export default function DocsReader() {
  const [selectedDocId, setSelectedDocId] = useState<string>("learning_insights");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const selectedDoc = DOCS_DATA[selectedDocId] || DOCS_DATA.learning_insights;

  // Filter docs
  const docList = Object.values(DOCS_DATA);
  const categories = ["all", ...Array.from(new Set(docList.map(doc => doc.category)))];

  const filteredDocs = docList.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      GraduationCap: <GraduationCap className="w-4 h-4 text-indigo-400" />,
      Cpu: <Cpu className="w-4 h-4 text-teal-400" />,
      Layers: <Layers className="w-4 h-4 text-pink-400" />,
      HelpCircle: <HelpCircle className="w-4 h-4 text-purple-400" />
    };
    return icons[iconName] || <FileText className="w-4 h-4 text-indigo-400" />;
  };

  // Render markdown tags dynamically into gorgeous premium HTML blocks
  const renderParsedMarkdown = (mdContent: string) => {
    if (!mdContent) return null;
    const lines = mdContent.split("\n");
    return lines.map((line, i) => {
      const trimmed = line.trim();

      // Heading 1 (# title)
      if (trimmed.startsWith("# ")) {
        return (
          <h2 key={i} className="text-lg font-black text-slate-100 mt-6 mb-4 pb-2 border-b border-slate-900 bg-gradient-to-r from-slate-100 to-indigo-200 bg-clip-text text-transparent tracking-tight">
            {trimmed.replace("# ", "")}
          </h2>
        );
      }

      // Heading 2 (## subtitle)
      if (trimmed.startsWith("## ")) {
        return (
          <h3 key={i} className="text-sm font-extrabold text-indigo-400 mt-5 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            {trimmed.replace("## ", "")}
          </h3>
        );
      }

      // Heading 3 (### inner heading)
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={i} className="text-xs font-bold text-teal-300 mt-4 mb-2 tracking-wide">
            {trimmed.replace("### ", "")}
          </h4>
        );
      }

      // Separator (---)
      if (trimmed === "---") {
        return <hr key={i} className="my-6 border-slate-900" />;
      }

      // Bold list items (- **title**)
      if (trimmed.startsWith("- **") || trimmed.startsWith("* **")) {
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const matches = [...trimmed.matchAll(boldRegex)];
        if (matches.length > 0) {
          const title = matches[0][1];
          const rest = trimmed.replace(/[-*]\s*\*\*([^*]+)\*\*/g, "");
          return (
            <div key={i} className="mt-2 pl-4 flex items-start gap-2 text-xs text-slate-350 leading-relaxed">
              <span className="text-indigo-500 shrink-0 mt-1.5">•</span>
              <span>
                <strong className="text-slate-100">{title}</strong>
                {rest}
              </span>
            </div>
          );
        }
      }

      // Simple list items (- item)
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <div key={i} className="mt-1.5 pl-4 flex items-start gap-2 text-xs text-slate-350 leading-relaxed">
            <span className="text-teal-500 shrink-0 mt-1.5">•</span>
            <span>{trimmed.replace(/^[-*]\s*/, "")}</span>
          </div>
        );
      }

      // Numbered lists (1. item)
      if (/^\d+\.\s+/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (match) {
          return (
            <div key={i} className="mt-1.5 pl-4 flex items-start gap-2 text-xs text-slate-350 leading-relaxed">
              <span className="text-indigo-400 font-mono font-bold shrink-0">{match[1]}.</span>
              <span>{match[2]}</span>
            </div>
          );
        }
      }

      // Mermaid blocks (skip graph definitions but draw a simulated representation)
      if (trimmed.startsWith("```mermaid") || trimmed.startsWith("```")) {
        return null; // Handle code boxes below
      }

      // Code blocks (e.g. Python CLI scratch blocks)
      if (trimmed.startsWith("```python") || trimmed.startsWith("```json") || (trimmed.startsWith("```") && i > 0)) {
        return null;
      }

      // If we are inside code block representations, we render them inside stylized containers
      if (line.startsWith("    ") && (lines[i-1]?.startsWith("    ") || lines[i+1]?.startsWith("    "))) {
        return (
          <pre key={i} className="bg-slate-950 px-4 py-1 text-[10px] font-mono text-indigo-300 border-x border-slate-900 leading-normal select-all overflow-x-auto scrollbar-none">
            {line}
          </pre>
        );
      }

      // Paragraph text
      if (trimmed) {
        // Quick bold inline highlighting
        let processedText = trimmed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        processedText = processedText.replace(/`([^`]+)`/g, "<code class='bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900 text-indigo-300 font-mono text-[10px]'>$1</code>");
        processedText = processedText.replace(/➔/g, "<span class='text-teal-400 font-bold'>➔</span>");
        
        return (
          <p 
            key={i} 
            className="text-xs text-slate-350 leading-relaxed mt-2.5 font-sans select-text"
            dangerouslySetInnerHTML={{ __html: processedText }}
          />
        );
      }

      return <div key={i} className="h-1.5" />;
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch w-full animate-in fade-in duration-300">
      
      {/* LEFT NAVIGATION: Documents Index Sidebar (col-span-4) */}
      <div className="xl:col-span-4 flex flex-col gap-4 h-full">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md flex flex-col gap-4 shadow-lg hover:shadow-indigo-500/5 transition-all flex-1 h-full select-none">
          
          {/* Index Header */}
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <BookOpen className="w-4 h-4 text-indigo-400 animate-pulse" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
              Documentation Index
            </h4>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search concepts, guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-xs font-medium text-slate-300 placeholder-slate-550 focus:outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded-lg border text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-indigo-650 text-white border-indigo-600/30"
                    : "bg-slate-950/60 text-slate-400 border-slate-850 hover:text-slate-200"
                }`}
              >
                {cat === "all" ? "Show All" : cat}
              </button>
            ))}
          </div>

          {/* Document list */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[360px] scrollbar-thin pr-1 mt-2">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs italic">
                No matching documents found.
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isActive = selectedDocId === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex gap-3 ${
                      isActive
                        ? "bg-indigo-650/15 border-indigo-500/40 shadow-inner"
                        : "bg-slate-950/30 border-slate-850 hover:border-slate-700 hover:bg-slate-900/30"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-md ${
                      isActive ? "bg-indigo-600 text-white" : "bg-slate-900/60"
                    }`}>
                      {getIconComponent(doc.icon)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                          {doc.category}
                        </span>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      </div>
                      <h5 className={`text-xs font-extrabold truncate mt-0.5 ${
                        isActive ? "text-slate-100" : "text-slate-300"
                      }`}>
                        {doc.title}
                      </h5>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {doc.summary}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT VIEWPORT: Markdown reading pane (col-span-8) */}
      <div className="xl:col-span-8 flex flex-col h-full">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md flex flex-col gap-4 shadow-lg hover:shadow-indigo-500/5 transition-all flex-1 h-full">
          
          {/* Viewport Header */}
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 select-none">
            <span className="text-xs font-bold text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
              {getIconComponent(selectedDoc.icon)}
              {selectedDoc.title}
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-950 border border-slate-850 text-slate-500">
              Offline Loaded
            </span>
          </div>

          {/* Viewport Body */}
          <div className="flex-1 overflow-y-auto max-h-[500px] pr-2.5 scrollbar-thin">
            <article className="prose prose-invert max-w-none">
              {renderParsedMarkdown(selectedDoc.content)}
            </article>
          </div>

          {/* Interactive footer lesson hint */}
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1 select-none border-t border-slate-900/80 pt-3 mt-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              Tip: Read the active exercises inside the guide to run real hands-on token audits!
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
