// HOW TO RUN THIS SEED SCRIPT
// 1. Install admin SDK:       npm install firebase-admin --save-dev
// 2. Go to Firebase Console → Project Settings → Service Accounts
// 3. Click "Generate new private key" → save as scripts/serviceAccountKey.json
// 4. Make sure scripts/serviceAccountKey.json is in .gitignore (NEVER commit this file)
// 5. Run: node scripts/seedMenu.js

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore }                  from "firebase-admin/firestore";
import { createRequire }                 from "module";
import { resolve, dirname }              from "path";
import { fileURLToPath }                 from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

// ── Bootstrap firebase-admin ──────────────────────────────────────────────────
const keyPath = resolve(__dirname, "serviceAccountKey.json");
const serviceAccount = require(keyPath);

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// ── Import menu data (ES module → dynamic import) ─────────────────────────────
const { default: MENU, CATEGORIES } = await import("../data/menu.js");

// ── Seed menu items ──────────────────────────────────────────────────────────
async function seedMenuItems() {
  let added = 0, skipped = 0;

  for (let i = 0; i < MENU.length; i++) {
    const item   = MENU[i];
    const docRef = db.collection("menu").doc(String(item.id));
    const snap   = await docRef.get();

    if (snap.exists) {
      console.log(`  ⟳ Skipped: ${item.name} (already exists)`);
      skipped++;
    } else {
      await docRef.set({
        name:        item.name,
        price:       item.price,
        category:    item.category,
        emoji:       item.emoji,
        available:   item.available,
        sortOrder:   i,
        description: "",
        imageUrl:    "",
      });
      console.log(`  ✓ Added:   ${item.name}`);
      added++;
    }
  }

  return { added, skipped };
}

// ── Seed categories ───────────────────────────────────────────────────────────
async function seedCategories() {
  const keys = Object.keys(CATEGORIES);
  let added = 0, skipped = 0;

  for (let i = 0; i < keys.length; i++) {
    const key    = keys[i];
    const name   = CATEGORIES[key];
    const docRef = db.collection("categories").doc(key);
    const snap   = await docRef.get();

    if (snap.exists) {
      console.log(`  ⟳ Skipped category: ${key} (already exists)`);
      skipped++;
    } else {
      await docRef.set({ name, sortOrder: i });
      console.log(`  ✓ Added category:   ${key} → ${name}`);
      added++;
    }
  }

  return { added, skipped };
}

// ── Run ───────────────────────────────────────────────────────────────────────
console.log("\n🌱  Seeding Firestore for mom-restaurant-2a493...\n");

console.log("── Menu items ──");
const menuResult = await seedMenuItems();

console.log("\n── Categories ──");
const catResult  = await seedCategories();

const totalAdded   = menuResult.added   + catResult.added;
const totalSkipped = menuResult.skipped + catResult.skipped;
console.log(`\n✅  Done. ${totalAdded} item(s) added, ${totalSkipped} skipped.\n`);
