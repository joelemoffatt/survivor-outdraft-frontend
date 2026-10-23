#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const indexPath = "dist/index.html";
if (!existsSync(indexPath)) {
  console.error(`[patch-pwa-head] ${indexPath} missing — did expo export run?`);
  process.exit(1);
}

const html = readFileSync(indexPath, "utf8");
if (html.includes("manifest.webmanifest")) {
  console.log("[patch-pwa-head] already patched");
  process.exit(0);
}

const inject = `<meta name="theme-color" content="#09BC8A" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="OutDraft" />
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="icon" type="image/png" sizes="192x192" href="/pwa-192.png" />
<link rel="icon" type="image/png" sizes="512x512" href="/pwa-512.png" />
</head>`;

writeFileSync(indexPath, html.replace("</head>", inject));
console.log("[patch-pwa-head] injected PWA tags");
