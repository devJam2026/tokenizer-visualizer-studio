import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tokenizer Visualizer Studio - LLM Token Profiler & Cost Estimator",
  description: "An interactive full-stack visualization studio comparing tiktoken, LLaMA SentencePiece, and BERT WordPiece tokenization logic, offsets, and financial scale footprints.",
  keywords: ["LLM", "Tokenization", "Byte-Pair Encoding", "WordPiece", "SentencePiece", "tiktoken", "FastAPI", "Next.js", "Tailwind CSS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased">
      <body className="min-h-full flex flex-col bg-[#030712] text-slate-100">
        {children}
      </body>
    </html>
  );
}
