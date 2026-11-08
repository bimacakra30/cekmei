/**
 * Fix pages to have default exports for lazy loading
 */
const fs = require("fs");
const path = require("path");

const fixes = {
  // Auth pages
  "pages/auth/RegisterPage.tsx": { from: "export function RegisterClient()", to: "export default function RegisterPage()" },
  "pages/auth/ForgotPasswordPage.tsx": { from: "export function ForgotPasswordClient()", to: "export default function ForgotPasswordPage()" },
  "pages/auth/ResetPasswordPage.tsx": { from: "export function ResetPasswordClient()", to: "export default function ResetPasswordPage()" },
  
  // Main pages - check what they export
  "pages/main/ProfilePage.tsx": { from: "export function ProfileClient()", to: "export default function ProfilePage()" },
  "pages/main/PaymentPage.tsx": { from: "export function PaymentClient()", to: "export default function PaymentPage()" },
  "pages/main/TermsPage.tsx": { from: "export function SyaratKetentuanClient()", to: "export default function TermsPage()" },
  
  // Pages that export default function XPage need no fix
  // Admin pages already use export default
  
  // Contact page
  "pages/ContactPage.tsx": { from: "export default function KontakPage()", to: "export default function ContactPage()" },
  
  // Not found
  "pages/NotFoundPage.tsx": { from: "export default function NotFound()", to: "export default function NotFoundPage()" },
};

const srcDir = path.join(__dirname, "..", "src");

for (const [relPath, fix] of Object.entries(fixes)) {
  const fullPath = path.join(srcDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log("SKIP (not found):", relPath);
    continue;
  }
  let content = fs.readFileSync(fullPath, "utf8");
  if (content.includes(fix.from)) {
    content = content.replace(fix.from, fix.to);
    fs.writeFileSync(fullPath, content, "utf8");
    console.log("Fixed:", relPath);
  } else {
    console.log("No match:", relPath, "- looking for:", fix.from.substring(0, 40));
  }
}

console.log("\nDone.");

