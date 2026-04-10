const fs = require('fs');

const globalsPath = 'C:\\Users\\user\\Desktop\\mom-restaurant-new\\app\\globals.css';
let css = fs.readFileSync(globalsPath, 'utf8');

// Find Google Fonts import
const fontImportRegex = /@import url\('https:\/\/fonts\.googleapis\.com[^']+'\);\r?\n?/;
const match = css.match(fontImportRegex);
if (match) {
    // Remove it from current location
    css = css.replace(match[0], '');
    // Prepend it as absolute first line
    css = match[0].trim() + '\n' + css.trimStart();
    fs.writeFileSync(globalsPath, css, 'utf8');
}

const pagePath = 'C:\\Users\\user\\Desktop\\mom-restaurant-new\\app\\menu\\page.jsx';
let jsx = fs.readFileSync(pagePath, 'utf8');

// Add Suspense import after 'use client'
if (!jsx.includes("import { Suspense } from 'react'") && !jsx.includes("import { Suspense } from \"react\"")) {
    jsx = jsx.replace(/("use client";|'use client';)\r?\n/, "$1\nimport { Suspense } from 'react';\n");
}

// Rename component
jsx = jsx.replace('export default function MenuPage() {', 'function MenuPageInner() {');

// Add new default export wrapped in Suspense
const wrapper = `
export default function MenuPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F8F7FF'}}><div style={{textAlign:'center',color:'#a78bfa'}}><div style={{fontSize:32}}>🍜</div><div>กำลังโหลด...</div></div></div>}>
      <MenuPageInner />
    </Suspense>
  )
}
`;

if (!jsx.includes('export default function MenuPage()')) {
    jsx += wrapper;
}
fs.writeFileSync(pagePath, jsx, 'utf8');
