/**
 * Script to replace Next.js imports with React Router equivalents
 * in all .tsx/.ts files under cekbar-frontend/src/
 */
const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "..", "src");

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) results.push(full);
  }
  return results;
}

const replacements = [
  // Remove "use client" directives (not needed in Vite SPA)
  [/^"use client";\s*\n/m, ""],
  [/^'use client';\s*\n/m, ""],

  // next/link → react-router-dom Link
  [/import\s+Link\s+from\s+["']next\/link["'];?\s*\n/g, 'import { Link } from "react-router-dom";\n'],

  // next/navigation useRouter, usePathname, useSearchParams, useParams
  [/import\s*\{\s*useRouter\s*\}\s*from\s*["']next\/navigation["'];?\s*\n/g,
   'import { useNavigate } from "react-router-dom";\n'],
  [/import\s*\{\s*usePathname\s*\}\s*from\s*["']next\/navigation["'];?\s*\n/g,
   'import { useLocation } from "react-router-dom";\n'],
  [/import\s*\{\s*usePathname\s*,\s*useRouter\s*\}\s*from\s*["']next\/navigation["'];?\s*\n/g,
   'import { useLocation, useNavigate } from "react-router-dom";\n'],
  [/import\s*\{\s*useRouter\s*,\s*usePathname\s*\}\s*from\s*["']next\/navigation["'];?\s*\n/g,
   'import { useNavigate, useLocation } from "react-router-dom";\n'],
  [/import\s*\{\s*useSearchParams\s*\}\s*from\s*["']next\/navigation["'];?\s*\n/g,
   'import { useSearchParams } from "react-router-dom";\n'],
  [/import\s*\{\s*useSearchParams\s*,\s*useRouter\s*\}\s*from\s*["']next\/navigation["'];?\s*\n/g,
   'import { useSearchParams, useNavigate } from "react-router-dom";\n'],
  [/import\s*\{\s*useParams\s*,\s*useRouter\s*\}\s*from\s*["']next\/navigation["'];?\s*\n/g,
   'import { useParams, useNavigate } from "react-router-dom";\n'],
  [/import\s*\{\s*useRouter\s*,\s*useParams\s*\}\s*from\s*["']next\/navigation["'];?\s*\n/g,
   'import { useNavigate, useParams } from "react-router-dom";\n'],

  // next/image → plain img
  [/import\s+Image\s+from\s+["']next\/image["'];?\s*\n/g, ""],

  // next/dynamic → React.lazy (handled manually where needed)
  [/import\s+dynamic\s+from\s+["']next\/dynamic["'];?\s*\n/g, 'import { lazy, Suspense } from "react";\n'],

  // Remove next/font imports (handled in HTML)
  [/import\s*\{[^}]*\}\s*from\s*["']next\/font\/google["'];?\s*\n/g, ""],

  // Remove next metadata exports
  [/import\s+type\s*\{\s*Metadata\s*\}\s*from\s*["']next["'];?\s*\n/g, ""],
  [/export\s+const\s+metadata\s*:\s*Metadata\s*=\s*\{[\s\S]*?\};\s*\n/g, ""],

  // useRouter() → useNavigate()
  [/const\s+router\s*=\s*useRouter\(\)/g, "const navigate = useNavigate()"],

  // router.push("...") → navigate("...")
  [/router\.push\(/g, "navigate("],
  // router.replace("...") → navigate("...", { replace: true })
  [/router\.replace\(([^)]+)\)/g, "navigate($1, { replace: true })"],

  // usePathname() → useLocation().pathname
  [/const\s+pathname\s*=\s*usePathname\(\)/g, "const { pathname } = useLocation()"],

  // Link href= → Link to=
  [/<Link\s+href=/g, "<Link to="],

  // Image component → img tag
  [/<Image\s/g, "<img "],
  [/<\/Image>/g, "</img>"],
];

let filesChanged = 0;
for (const file of walk(srcDir)) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    filesChanged++;
    console.log("Updated:", path.relative(srcDir, file));
  }
}

console.log(`\nDone. ${filesChanged} files updated.`);
