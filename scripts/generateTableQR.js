// HOW TO USE
// 1. Install dependency: npm install qrcode --save-dev
// 2. Update BASE_URL below after deploying to Vercel
// 3. Run: node scripts/generateTableQR.js
// 4. Open public/qr/print.html in your browser and print

import QRCode       from "qrcode";
import { mkdirSync, existsSync } from "fs";

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL   = "https://mom-restaurant-87ht.vercel.app"; // ← change after Vercel deploy
const NUM_TABLES = 5;
const OUTPUT_DIR = "./public/qr";

// ── QR options ────────────────────────────────────────────────────────────────
const QR_OPTIONS = {
  width:  400,
  margin: 2,
  color: {
    dark:  "#1C1410",
    light: "#FFFFFF",
  },
};

// ── Ensure output directory exists ────────────────────────────────────────────
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁  Created directory: ${OUTPUT_DIR}`);
}

// ── Generate ──────────────────────────────────────────────────────────────────
console.log(`\n🍜  Generating ${NUM_TABLES} QR codes...\n`);

for (let table = 1; table <= NUM_TABLES; table++) {
  const url      = `${BASE_URL}/menu?table=${table}`;
  const filePath = `${OUTPUT_DIR}/table-${table}.png`;

  await QRCode.toFile(filePath, url, QR_OPTIONS);
  console.log(`  ✓ Table ${table}  →  ${filePath}`);
}

// ── Takeaway QR ───────────────────────────────────────────────────────────────
const takeawayUrl      = `${BASE_URL}/menu?table=takeaway`;
const takeawayFilePath = `${OUTPUT_DIR}/takeaway.png`;

await QRCode.toFile(takeawayFilePath, takeawayUrl, QR_OPTIONS);
console.log(`  ✓ Takeaway   →  ${takeawayFilePath}`);

console.log(`\n✓ Generated ${NUM_TABLES} table QR codes + 1 takeaway QR code in ${OUTPUT_DIR}/\n`);
