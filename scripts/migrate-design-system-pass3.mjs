#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SKIP = new Set(["node_modules", ".next", ".git"]);

const REPLACEMENTS = [
  [/\bring-neutral-\d+(?:\/\d+)?\b/g, "ring-[var(--color-text)]"],
  [/\bdivide-neutral-\d+\b/g, "divide-[var(--color-text)]"],
  [/\bfocus:ring-neutral-\d+\b/g, "focus:ring-[var(--color-text)]"],
  [/\baccent-neutral-\d+\b/g, "accent-[var(--color-text)]"],
  [/\bborder-t-neutral-\d+\b/g, "border-t-[var(--color-accent)]"],
  [/\bring-white\/\d+\b/g, "ring-[var(--color-bg)]"],
  [/\bring-zinc-\d+\b/g, "ring-[var(--color-text)]"],
  [/\bhover:ring-zinc-\d+\b/g, "hover:ring-[var(--color-text)]"],
  [/\boutline-black\/\d+\b/g, "outline-[var(--color-text)]"],
  [/\bfocus-visible:outline-black\/\d+\b/g, "focus-visible:outline-[var(--color-text)]"],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(css|tsx?|jsx?)$/.test(ent.name)) files.push(p);
  }
  return files;
}

const changed = [];
for (const file of walk(ROOT)) {
  const before = fs.readFileSync(file, "utf8");
  let after = before;
  for (const [re, rep] of REPLACEMENTS) after = after.replace(re, rep);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed.push(path.relative(ROOT, file));
  }
}
console.log(`Pass 3: ${changed.length} files`);
changed.forEach((f) => console.log(`  ${f}`));
