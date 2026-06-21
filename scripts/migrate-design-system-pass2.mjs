#!/usr/bin/env node
/** Second pass: replace Tailwind semantic color classes with design-system tokens. */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SKIP = new Set(["node_modules", ".next", ".git"]);

const REPLACEMENTS = [
  [/\bbg-(?:red|green|emerald|blue|sky|amber|yellow|orange|violet|purple|pink|rose|teal|cyan|lime|indigo|fuchsia)-\d+(?:\/\d+)?\b/g, "bg-[var(--color-accent)]"],
  [/\btext-(?:red|green|emerald|blue|sky|amber|yellow|orange|violet|purple|pink|rose|teal|cyan|lime|indigo|fuchsia)-\d+(?:\/\d+)?\b/g, "text-[var(--color-accent)]"],
  [/\bborder-(?:red|green|emerald|blue|sky|amber|yellow|orange|violet|purple|pink|rose|teal|cyan|lime|indigo|fuchsia)-\d+(?:\/\d+)?\b/g, "border-[var(--color-accent)]"],
  [/\bring-(?:red|green|emerald|blue|sky|amber|yellow|orange|violet|purple|pink|rose|teal|cyan|lime|indigo|fuchsia)-\d+(?:\/\d+)?\b/g, "ring-[var(--color-accent)]"],
  [/\bhover:bg-(?:red|green|emerald|blue|sky|amber|yellow|orange|violet|purple|pink|rose|teal|cyan|lime|indigo|fuchsia)-\d+(?:\/\d+)?\b/g, "hover:bg-[var(--color-accent)]"],
  [/\bhover:text-(?:red|green|emerald|blue|sky|amber|yellow|orange|violet|purple|pink|rose|teal|cyan|lime|indigo|fuchsia)-\d+(?:\/\d+)?\b/g, "hover:text-[var(--color-accent)]"],
  [/\bhover:border-(?:red|green|emerald|blue|sky|amber|yellow|orange|violet|purple|pink|rose|teal|cyan|lime|indigo|fuchsia)-\d+(?:\/\d+)?\b/g, "hover:border-[var(--color-accent)]"],
  [/\bfocus:border-(?:red|green|emerald|blue|sky|amber|yellow|orange|violet|purple|pink|rose|teal|cyan|lime|indigo|fuchsia)-\d+(?:\/\d+)?\b/g, "focus:border-[var(--color-accent)]"],
  [/\bprose-a:text-(?:red|green|emerald|blue|sky|amber|yellow|orange|violet|purple|pink|rose|teal|cyan|lime|indigo|fuchsia)-\d+\b/g, "prose-a:text-[var(--color-accent)]"],
  [/hover:text-\[#555\]/g, "hover:text-[var(--color-text)]"],
  [/text-\[#555\]/g, "text-[var(--color-text)]"],
  [/text-\[#777\]/g, "text-[var(--color-text)]"],
  [/text-\[#ef4444\]/g, "text-[var(--color-accent)]"],
  [/hover:text-\[#ef4444\]/g, "hover:text-[var(--color-accent)]"],
  [/bg-\[#111\]/g, "bg-[var(--color-text)]"],
  [/border-\[#3a3a38\]/g, "border-[var(--color-text)]"],
  [/bg-\[#ececea\]/g, "bg-[var(--color-bg)]"],
  [/border-\[#d4d4d4\]/g, "border-[var(--color-text)]"],
  [/color: #555/g, "color: var(--color-text)"],
  [/color: #15803d/g, "color: var(--color-accent)"],
  [/border-color: #d4d4d4/g, "border-color: var(--color-text)"],
  [/box-shadow: 0 0 0 1px rgba\(34, 197, 94, 0\.35\)/g, "box-shadow: 0 0 0 1px var(--color-accent)"],
  [/background: rgba\(34, 197, 94, 0\.12\)/g, "background: var(--color-bg)"],
  [/#111\b/g, "var(--color-text)"],
  [/#ddd\b/g, "var(--color-text)"],
  [/#cccccc\b/gi, "var(--color-text)"],
  [/"#111"/g, '"var(--color-text)"'],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(css|tsx?|jsx?)$/.test(ent.name) && !ent.name.includes("migrate-design-system")) files.push(p);
  }
  return files;
}

const changed = [];
for (const file of walk(ROOT)) {
  if (file.endsWith("globals.css")) continue;
  const before = fs.readFileSync(file, "utf8");
  let after = before;
  for (const [re, rep] of REPLACEMENTS) after = after.replace(re, rep);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed.push(path.relative(ROOT, file));
  }
}
console.log(`Pass 2: ${changed.length} files`);
changed.sort().forEach((f) => console.log(`  ${f}`));
