/**
 * Fix remaining TypeScript errors after migration
 */
const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "..", "src");

function fix(relPath, search, replace) {
  const fullPath = path.join(srcDir, relPath);
  let content = fs.readFileSync(fullPath, "utf8");
  if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(fullPath, content, "utf8");
    console.log("Fixed:", relPath);
  } else {
    console.log("SKIP:", relPath, "- not found:", search.substring(0, 50));
  }
}

function fixAll(relPath, search, replace) {
  const fullPath = path.join(srcDir, relPath);
  let content = fs.readFileSync(fullPath, "utf8");
  const newContent = content.split(search).join(replace);
  if (content !== newContent) {
    fs.writeFileSync(fullPath, newContent, "utf8");
    console.log("Fixed:", relPath);
  }
}

// 1. Link href= → Link to= (remaining ones the regex missed)
const linkFiles = [
  "components/admin/admin-sidebar.tsx",
  "components/layout/sidebar.tsx",
];
for (const f of linkFiles) {
  fixAll(f, ' href=', ' to=');
}

// 2. service-order-page.tsx: fix import path and router reference
fix(
  "components/service-order/service-order-page.tsx",
  `from "@/app/(main)/syarat-ketentuan/page-client"`,
  `from "@/pages/main/TermsPage"`
);

// Fix `router` → `navigate` in service-order-page.tsx
fixAll("components/service-order/service-order-page.tsx", "router(", "navigate(");

// 3. AdminDashboardPage: fix `dynamic` → proper lazy imports
{
  const f = path.join(srcDir, "pages/admin/AdminDashboardPage.tsx");
  let c = fs.readFileSync(f, "utf8");
  // Replace dynamic imports with lazy
  c = c.replace(
    /import \{ lazy, Suspense \} from "react";\n/,
    ""
  );
  // Add lazy import at top
  if (!c.includes("import { lazy")) {
    c = `import { lazy, Suspense } from "react";\n` + c;
  }
  // Replace dynamic() calls
  c = c.replace(
    /const RevenueChart = dynamic\(\(\) => import\("\.\/admin-charts"\)\.then\(m => \(\{ default: m\.RevenueChart \}\)\), \{[^}]+\}\);/,
    `const RevenueChart = lazy(() => import("./admin-charts").then(m => ({ default: m.RevenueChart })));`
  );
  c = c.replace(
    /const StatusPieChart = dynamic\(\(\) => import\("\.\/admin-charts"\)\.then\(m => \(\{ default: m\.StatusPieChart \}\)\), \{[^}]+\}\);/,
    `const StatusPieChart = lazy(() => import("./admin-charts").then(m => ({ default: m.StatusPieChart })));`
  );
  c = c.replace(
    /const TopServicesChart = dynamic\(\(\) => import\("\.\/admin-charts"\)\.then\(m => \(\{ default: m\.TopServicesChart \}\)\), \{[^}]+\}\);/,
    `const TopServicesChart = lazy(() => import("./admin-charts").then(m => ({ default: m.TopServicesChart })));`
  );
  fs.writeFileSync(f, c, "utf8");
  console.log("Fixed: pages/admin/AdminDashboardPage.tsx (dynamic→lazy)");
}

// 4. use-order-history.ts: fix useSearchParams usage (react-router returns [params, setParams])
{
  const f = path.join(srcDir, "hooks/use-order-history.ts");
  let c = fs.readFileSync(f, "utf8");
  // Replace searchParams.get → searchParams[0].get pattern
  // First, find how searchParams is destructured
  c = c.replace(
    /const searchParams = useSearchParams\(\)/,
    "const [searchParams, setSearchParams] = useSearchParams()"
  );
  // Fix router reference
  c = c.replace(/\brouter\(/g, "navigate(");
  // Need to add useNavigate if not present
  if (c.includes("useNavigate") && !c.includes("const navigate")) {
    c = c.replace(
      "export function useOrderHistory",
      "export function useOrderHistory"
    );
    // Add navigate inside the hook
    c = c.replace(
      /const \[searchParams, setSearchParams\] = useSearchParams\(\)/,
      "const navigate = useNavigate();\n  const [searchParams, setSearchParams] = useSearchParams()"
    );
  }
  // Fix setSearchParams usage: router.push with params → setSearchParams
  // This needs manual review, but let's fix the basic pattern
  fs.writeFileSync(f, c, "utf8");
  console.log("Fixed: hooks/use-order-history.ts");
}

// 5. ResetPasswordPage: fix searchParams.get
{
  const f = path.join(srcDir, "pages/auth/ResetPasswordPage.tsx");
  let c = fs.readFileSync(f, "utf8");
  c = c.replace(
    /const searchParams = useSearchParams\(\)/,
    "const [searchParams] = useSearchParams()"
  );
  fs.writeFileSync(f, c, "utf8");
  console.log("Fixed: pages/auth/ResetPasswordPage.tsx");
}

// 6. PaymentPage: fix `router` leftover and `unoptimized` prop
{
  const f = path.join(srcDir, "pages/main/PaymentPage.tsx");
  let c = fs.readFileSync(f, "utf8");
  c = c.replace(/\brouter\(/g, "navigate(");
  // Check if navigate is declared
  if (c.includes("navigate(") && !c.includes("const navigate")) {
    c = c.replace(
      "export default function PaymentPage() {",
      "export default function PaymentPage() {\n  const navigate = useNavigate();"
    );
    if (!c.includes("useNavigate")) {
      c = `import { useNavigate } from "react-router-dom";\n` + c;
    }
  }
  // Remove unoptimized prop from img tags
  c = c.replace(/ unoptimized={?true}?/g, "");
  c = c.replace(/ unoptimized/g, "");
  fs.writeFileSync(f, c, "utf8");
  console.log("Fixed: pages/main/PaymentPage.tsx");
}

// 7. CSS module import for globals.css
{
  const f = path.join(srcDir, "vite-env.d.ts");
  if (!fs.existsSync(f)) {
    fs.writeFileSync(f, '/// <reference types="vite/client" />\n', "utf8");
    console.log("Created: vite-env.d.ts");
  }
}

console.log("\nAll fixes applied.");

