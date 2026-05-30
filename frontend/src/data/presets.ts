export const PRESETS = {
  english: "Large Language Models process text using subword tokenization instead of reading raw characters or full words. This balanced approach allows neural networks to capture grammar, semantic patterns, and punctuation efficiently within a structured vocabulary dictionary.",
  englishComplex: "The luminous celestial bodies shimmered across the vast, velvety expanse of the nocturnal sky, casting a serene, ethereal glow upon the whispering willows below, while a gentle, nostalgic breeze carried the distant melody of a forgotten era.",
  bengali: "আপনার ব্যাংক অ্যাকাউন্ট আজ ব্লক করা হবে। অবিলম্বে এই লিঙ্কে ক্লিক করুন।",
  hindi: "आपका बैंक खाता आज ब्लॉक कर दिया जाएगा। तुरंत कार्रवाई करें।",
  cyrillic: "Ваш банковский счет заблокирован. Немедленно проверьте баланс.",
  emojis: "🚀🔥💡🤖✨ Python & Next.js are awesome! 😎🎉",
  python: `def preprocess_text(text):
    # Retrieve clean data entries
    data = get_dataset()
    results = tokenize(text, data)
    return results`,
  dbQuery: `def query_database(user_id: str):
    if not user_id:
        return None
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    return db.execute(query)`,
  reactCode: `import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}`,
  jsonPayload: `{
  "tokenizer": "byte-pair-encoding",
  "vocab_size": 32000,
  "special_tokens": {
    "bos": "<s>",
    "eos": "</s>",
    "unk": "<unk>"
  },
  "normalize": true
}`
};
