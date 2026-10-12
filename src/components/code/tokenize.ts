/**
 * A small syntax highlighter (017/D3): per language, an ordered list of regular expressions,
 * the first match at each position wins. Pure and cached by language and code, so drawing a
 * frame never tokenizes again.
 */

export type TokenType =
  | "plain"
  | "comment"
  | "string"
  | "keyword"
  | "number"
  | "function"
  | "type"
  | "punctuation";

export type Token = { type: TokenType; text: string };

export type Language = "js" | "python" | "json" | "bash" | "html" | "css";

export const LANGUAGES = [
  ["js", "JavaScript / TypeScript"],
  ["python", "Python"],
  ["json", "JSON"],
  ["bash", "Bash"],
  ["html", "HTML"],
  ["css", "CSS"],
] as const satisfies readonly (readonly [Language, string])[];

type Rule = [TokenType, RegExp];

const words = (list: string) =>
  new RegExp(`\\b(?:${list.split(" ").join("|")})\\b`, "y");

const STRINGS: Rule = ["string", /(["'`])(?:\\.|(?!\1)[^\\\n])*\1?/y];
const NUMBER: Rule = ["number", /\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b/iy];
const CALL: Rule = ["function", /[A-Za-z_$][\w$]*(?=\s*\()/y];
const PUNCT: Rule = ["punctuation", /[{}()[\];,.:=<>+\-*/%!&|?^~]/y];

const GRAMMARS: Record<Language, Rule[]> = {
  js: [
    ["comment", /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y],
    STRINGS,
    [
      "keyword",
      words(
        "const let var function return if else for while do switch case break continue new class extends import from export default async await try catch finally throw typeof instanceof in of this null undefined true false type interface as",
      ),
    ],
    ["type", /\b[A-Z][\w$]*/y],
    NUMBER,
    CALL,
    PUNCT,
  ],
  python: [
    ["comment", /#[^\n]*/y],
    ["string", /("""|''')[\s\S]*?(?:\1|$)|(["'])(?:\\.|(?!\2)[^\\\n])*\2?/y],
    [
      "keyword",
      words(
        "def return if elif else for while in not and or is import from as class with try except finally raise lambda yield pass break continue None True False async await self",
      ),
    ],
    ["type", /\b[A-Z][\w]*/y],
    NUMBER,
    CALL,
    PUNCT,
  ],
  json: [
    ["function", /"(?:\\.|[^"\\\n])*"(?=\s*:)/y],
    ["string", /"(?:\\.|[^"\\\n])*"?/y],
    ["keyword", words("true false null")],
    ["number", /-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/iy],
    PUNCT,
  ],
  bash: [
    ["comment", /#[^\n]*/y],
    STRINGS,
    [
      "keyword",
      words(
        "if then else fi for do done while case esac function in export echo cd sudo",
      ),
    ],
    ["type", /\$\{?[\w@#?*]+\}?/y],
    ["function", /(?<=^|\n|\|\s*|&&\s*)[\w.-]+/y],
    ["number", /\b\d+\b/y],
    ["punctuation", /--?[\w-]+|[|&;<>()]/y],
  ],
  html: [
    ["comment", /<!--[\s\S]*?(?:-->|$)/y],
    ["keyword", /<\/?[\w-]+|\/?>/y],
    ["function", /[\w-]+(?==)/y],
    STRINGS,
    ["punctuation", /=/y],
  ],
  css: [
    ["comment", /\/\*[\s\S]*?(?:\*\/|$)/y],
    STRINGS,
    ["function", /[\w-]+(?=\s*:)/y],
    ["keyword", /@[\w-]+|![\w]+/y],
    ["type", /[.#][\w-]+/y],
    [
      "number",
      /-?\d+(?:\.\d+)?(?:px|em|rem|%|s|ms|vh|vw|deg)?|#[\da-f]{3,8}\b/iy,
    ],
    ["punctuation", /[{}();:,>+~]/y],
  ],
};

/** `code` split into tokens; joined back, the texts are `code` exactly. */
export function tokenize(code: string, lang: Language): Token[] {
  const rules = GRAMMARS[lang];
  const out: Token[] = [];
  const push = (type: TokenType, text: string) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.text += text;
    else out.push({ type, text });
  };
  let i = 0;
  while (i < code.length) {
    let matched = false;
    for (const [type, re] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m && m[0].length > 0) {
        push(type, m[0]);
        i += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // a whole word at once, so a keyword is never found inside an identifier
      const word = /[\w$]+|\s+|./y;
      word.lastIndex = i;
      const m = word.exec(code) as RegExpExecArray;
      push("plain", m[0]);
      i += m[0].length;
    }
  }
  return out;
}

const cache = new Map<string, Token[]>();
const MAX_CACHED = 32;

/** `tokenize` remembered for the last few code blocks. */
export function tokensOf(code: string, lang: Language): Token[] {
  const key = `${lang}\n${code}`;
  let tokens = cache.get(key);
  if (!tokens) {
    if (cache.size >= MAX_CACHED) cache.clear();
    tokens = tokenize(code, lang);
    cache.set(key, tokens);
  }
  return tokens;
}
