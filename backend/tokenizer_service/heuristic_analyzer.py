import re

class HeuristicAnalyzer:
    """
    Sub-engine responsible for compiling local rule-based diagnostic reports.
    Permits the studio's diagnostic framework to function 100% offline or
    without a configured OpenAI API Key.
    """
    
    @staticmethod
    def analyze(text: str) -> str:
        """
        Runs linguistic heuristic parsing on the input text.
        Identifies spacing densities, non-Latin script token inflation, emoji splits,
        and provides concise, actionable optimization recommendations.
        """
        if not text:
            return "No text provided to analyze."

        char_count = len(text)
        spaces = len(re.findall(r' ', text))
        tabs = len(re.findall(r'\t', text))
        newlines = len(re.findall(r'\n', text))
        non_ascii = len([c for c in text if ord(c) > 127])
        emojis = len(re.findall(r'[\U00010000-\U0010ffff]', text))
        
        # Calculate text density ratios
        whitespace_ratio = (spaces + tabs + newlines) / char_count if char_count > 0 else 0
        non_ascii_ratio = non_ascii / char_count if char_count > 0 else 0

        # Construct beautiful offline profiling report
        report = []
        report.append("### 📊 Local Heuristic Diagnostic Report")
        report.append("*(Note: Offline heuristic mode active. Enter an OpenAI API key in settings to unlock automated AI refactoring and recommendations.)*\n")
        
        # 1. Whitespace Bloat Analysis
        if whitespace_ratio > 0.2:
            report.append(
                f"- **⚠️ Whitespace Density ({whitespace_ratio:.1%}):** "
                f"Your text contains {spaces} spaces, {tabs} tabs, and {newlines} newlines. "
                "For code blocks or high-indentation text, this 'dead air' creates significant footprint inflation. "
                "**Optimization:** Compact consecutive spacing or convert double-spaces to single-spaces to immediately compress prompts."
            )
        else:
            report.append("- **✅ Layout Efficiency:** Whitespace characters occupy only a small fraction of your text. No major indentation compaction is needed.")

        # 2. Multilingual Token Inflation checks
        if non_ascii_ratio > 0.1:
            report.append(
                f"- **🚨 Severe Token Inflation Detected ({non_ascii_ratio:.1%}):** "
                f"Found {non_ascii} non-ASCII multi-byte characters. "
                "Because standard LLM tokenizers (BPE, SentencePiece) are trained primarily on English web text, "
                "non-Latin scripts (Hindi, Bengali, Cyrillic, Arabic, etc.) do not have single-token vocabulary entries. "
                "Each multi-byte character gets forced to split into 2-4 individual byte-tokens! "
                "This consumes your prompt context window **3x to 5x faster** than English, scaling your costs exponentially."
            )
        else:
            report.append("- **✅ Latin Script Optimization:** Your text is primarily composed of standard ASCII characters, matching optimal tokenizer vocabulary weights.")

        # 3. Emojis and Special Symbol checking
        if emojis > 0:
            report.append(
                f"- **⚡ Emoji Splitting ({emojis} found):** "
                "Emojis are complex 4-byte Unicode characters. Standard BPE tokenizers (like GPT-4's `cl100k`) "
                "almost always slice single emojis into 2 to 4 numeric sub-tokens. "
                "**Optimization:** Minimize emoji density in critical developer prompts to preserve token budgets."
            )

        # 4. Sentence length & general sizing
        if char_count > 400:
            report.append(
                "- **📖 Large Context Payload:** "
                f"Your prompt is {char_count} characters long. "
                "Ensure standard system guidelines are compact. Slicing complex system contexts into clear "
                "sub-prompts or using JSON key-value templates can shave off significant framing overhead."
            )

        report.append("\n**💡 Summary Recommendation:**")
        if non_ascii_ratio > 0.1:
            report.append("If deploying in multi-lingual systems, consider using modern tokenizers like **GPT-4o (o200k_base)** or **LLaMA 3**, which have upgraded, larger vocabularies specifically designed to reduce non-English token inflation.")
        elif whitespace_ratio > 0.2:
            report.append("Compact your code blocks or format your prompts into single-line segments where possible to reduce layout whitespace tokens.")
        else:
            report.append("Your prompt is structurally well-proportioned for token economy.")

        return "\n".join(report)
