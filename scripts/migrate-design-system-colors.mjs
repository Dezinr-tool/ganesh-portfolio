#!/usr/bin/env node
/**
 * One-time migration: map legacy colors → strict 3-token design system.
 * Allowed: var(--color-bg), var(--color-text), var(--color-accent), transparent, currentColor, inherit
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SKIP = new Set(["node_modules", ".next", ".git", "migrate-design-system-colors.mjs"]);

const VAR_MAP = [
  [/var\(--color-bg-dark\)/g, "var(--color-bg)"],
  [/var\(--color-bg-footer\)/g, "var(--color-bg)"],
  [/var\(--color-bg-muted\)/g, "var(--color-bg)"],
  [/var\(--color-bg-card-dark-hover\)/g, "var(--color-bg)"],
  [/var\(--color-bg-card-dark\)/g, "var(--color-bg)"],
  [/var\(--color-text-muted\)/g, "var(--color-text)"],
  [/var\(--color-text-secondary\)/g, "var(--color-text)"],
  [/var\(--color-text-subtle\)/g, "var(--color-text)"],
  [/var\(--color-text-on-dark-muted\)/g, "var(--color-bg)"],
  [/var\(--color-text-reveal-muted\)/g, "var(--color-text)"],
  [/var\(--color-border-subtle\)/g, "var(--color-text)"],
  [/var\(--color-border\)/g, "var(--color-text)"],
  [/var\(--color-accent-hover\)/g, "var(--color-accent)"],
  [/var\(--color-accent-soft\)/g, "var(--color-accent)"],
  [/var\(--color-accent-coral\)/g, "var(--color-accent)"],
  [/var\(--color-linkedin-hover\)/g, "var(--color-accent)"],
  [/var\(--color-linkedin-soft\)/g, "var(--color-accent)"],
  [/var\(--color-linkedin\)/g, "var(--color-accent)"],
  [/var\(--color-success\)/g, "var(--color-accent)"],
  [/var\(--glass-border-dark\)/g, "var(--color-text)"],
  [/var\(--glass-border\)/g, "var(--color-text)"],
  [/var\(--glass-bg-dark\)/g, "var(--color-bg)"],
  [/var\(--glass-bg\)/g, "var(--color-bg)"],
  [/var\(--loader-bg\)/g, "var(--color-bg)"],
  [/var\(--loader-text\)/g, "var(--color-text)"],
  [/var\(--fw-red\)/g, "var(--color-accent)"],
  [/var\(--fw-text-muted\)/g, "var(--color-text)"],
  [/var\(--fw-divider\)/g, "var(--color-text)"],
  [/var\(--fw-bg\)/g, "var(--color-bg)"],
  [/var\(--fw-text\)/g, "var(--color-text)"],
  [/var\(--zoox-ink-dark\)/g, "var(--color-text)"],
  [/var\(--zoox-ink\)/g, "var(--color-text)"],
  [/var\(--zoox-mint\)/g, "var(--color-bg)"],
  [/var\(--zoox-white\)/g, "var(--color-bg)"],
  [/var\(--tree-line\)/g, "var(--color-text)"],
  [/var\(--tree-accent\)/g, "var(--color-text)"],
];

const HEX_MAP = [
  [/#0[aA]0[aA]0[aA]\b/g, "var(--color-text)"],
  [/#111111\b/gi, "var(--color-text)"],
  [/#000000\b/g, "var(--color-text)"],
  [/#000\b/g, "var(--color-text)"],
  [/#1[aA]1[aA]1[aA]\b/g, "var(--color-text)"],
  [/#333333\b/gi, "var(--color-text)"],
  [/#333\b/g, "var(--color-text)"],
  [/#444\b/g, "var(--color-text)"],
  [/#666\b/g, "var(--color-text)"],
  [/#888\b/g, "var(--color-text)"],
  [/#999\b/g, "var(--color-text)"],
  [/#aaa\b/gi, "var(--color-text)"],
  [/#bbb\b/gi, "var(--color-text)"],
  [/#ccc\b/gi, "var(--color-text)"],
  [/#c4c4c4\b/gi, "var(--color-text)"],
  [/#ffffff\b/gi, "var(--color-bg)"],
  [/#fff\b/g, "var(--color-bg)"],
  [/#fafafa\b/gi, "var(--color-bg)"],
  [/#f5f5f5\b/gi, "var(--color-bg)"],
  [/#f4f4f5\b/gi, "var(--color-bg)"],
  [/#f0f0f0\b/gi, "var(--color-bg)"],
  [/#f8f8f8\b/gi, "var(--color-bg)"],
  [/#e8e8e8\b/gi, "var(--color-bg)"],
  [/#e0e0e0\b/gi, "var(--color-bg)"],
  [/#e4e4e7\b/gi, "var(--color-bg)"],
  [/#dcdcdc\b/gi, "var(--color-bg)"],
  [/#d3e4df\b/gi, "var(--color-bg)"],
  [/#0[dD]0[dD]0[dD]\b/g, "var(--color-text)"],
  [/#18181[bB]\b/g, "var(--color-text)"],
  [/#ff1[eE]00\b/g, "var(--color-accent)"],
  [/#FF3366\b/gi, "var(--color-accent)"],
  [/#d4ff00\b/gi, "var(--color-accent)"],
  [/#16[aA]34[aA]\b/g, "var(--color-accent)"],
  [/#22[cC]55[eE]\b/g, "var(--color-accent)"],
  [/#4[aA][dD][eE]80\b/g, "var(--color-accent)"],
  [/#f59[eE]0[bB]\b/g, "var(--color-accent)"],
  [/#60[aA]5[fF][aA]\b/g, "var(--color-accent)"],
  [/#0[aA]66[cC]2\b/g, "var(--color-accent)"],
  [/#E8D9CF\b/g, "var(--color-text)"],
];

const TAILWIND_MAP = [
  [/\bbg-white\b/g, "bg-[var(--color-bg)]"],
  [/\btext-white\b/g, "text-[var(--color-bg)]"],
  [/\bbg-black\b/g, "bg-[var(--color-text)]"],
  [/\btext-black\b/g, "text-[var(--color-text)]"],
  [/\bborder-white\b/g, "border-[var(--color-bg)]"],
  [/\bborder-black\b/g, "border-[var(--color-text)]"],
  [/\bbg-zinc-\d+\b/g, "bg-[var(--color-bg)]"],
  [/\bbg-zinc-\d+\/\d+\b/g, "bg-[var(--color-bg)]"],
  [/\btext-zinc-\d+\b/g, "text-[var(--color-text)]"],
  [/\btext-zinc-\d+\/\d+\b/g, "text-[var(--color-text)]"],
  [/\bborder-zinc-\d+\b/g, "border-[var(--color-text)]"],
  [/\bborder-zinc-\d+\/\d+\b/g, "border-[var(--color-text)]"],
  [/\bbg-neutral-\d+\b/g, "bg-[var(--color-bg)]"],
  [/\btext-neutral-\d+\b/g, "text-[var(--color-text)]"],
  [/\bborder-neutral-\d+\b/g, "border-[var(--color-text)]"],
  [/\bbg-gray-\d+\b/g, "bg-[var(--color-bg)]"],
  [/\btext-gray-\d+\b/g, "text-[var(--color-text)]"],
  [/\bborder-gray-\d+\b/g, "border-[var(--color-text)]"],
  [/\bbg-slate-\d+\b/g, "bg-[var(--color-bg)]"],
  [/\btext-slate-\d+\b/g, "text-[var(--color-text)]"],
  [/\bbg-\[#141414\]/g, "bg-[var(--color-text)]"],
  [/\bbg-\[#0[dD]0[dD]0[dD]\]/g, "bg-[var(--color-text)]"],
];

const RGBA_MAP = [
  [/rgba\(0,\s*0,\s*0,\s*[^)]+\)/g, "var(--color-text)"],
  [/rgba\(255,\s*255,\s*255,\s*[^)]+\)/g, "var(--color-bg)"],
  [/rgb\(0,\s*0,\s*0\)/g, "var(--color-text)"],
  [/rgb\(255,\s*255,\s*255\)/g, "var(--color-bg)"],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(css|tsx?|jsx?)$/.test(ent.name) && ent.name !== "globals.css") files.push(p);
  }
  return files;
}

function migrate(content, file) {
  if (file.endsWith("globals.css")) return content;
  let out = content;
  for (const [re, rep] of VAR_MAP) out = out.replace(re, rep);
  for (const [re, rep] of TAILWIND_MAP) out = out.replace(re, rep);
  for (const [re, rep] of HEX_MAP) out = out.replace(re, rep);
  for (const [re, rep] of RGBA_MAP) out = out.replace(re, rep);
  return out;
}

const changed = [];
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (rel === "scripts/migrate-design-system-colors.mjs") continue;
  const before = fs.readFileSync(file, "utf8");
  const after = migrate(before, rel);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed.push(rel);
  }
}

console.log(`Updated ${changed.length} files`);
changed.sort().forEach((f) => console.log(`  ${f}`));
