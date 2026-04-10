const fs = require('fs');
const pagePath = 'C:\\Users\\user\\Desktop\\mom-restaurant-new\\app\\menu\\page.jsx';
let jsx = fs.readFileSync(pagePath, 'utf8');

jsx = jsx.replace(/import\s*\{\s*Suspense\s*\}\s*from\s*['"]react['"];?\r?\n?g/, '');
jsx = jsx.replace(/import\s*\{\s*useState,\s*useEffect,\s*useMemo\s*\}\s*from\s*["']react["'];?/g, 'import { useState, useEffect, useMemo, Suspense } from "react";');

// In case the standalone Suspense import is still there:
jsx = jsx.split('\n').filter(line => !line.includes("import { Suspense } from 'react'")).join('\n');

const endBlock = '    </div>\n  );\n}';
const endBlockCRLF = '    </div>\r\n  );\r\n}';
let endIdx = jsx.indexOf(endBlock);
let endIdxCRLF = jsx.indexOf(endBlockCRLF);

let chopIdx = -1;
if (endIdx !== -1) chopIdx = endIdx + endBlock.length;
if (endIdxCRLF !== -1) chopIdx = endIdxCRLF + endBlockCRLF.length;

if (chopIdx !== -1) {
    jsx = jsx.substring(0, chopIdx);
    jsx += `\n\nexport default function MenuPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F8F7FF'}}><div style={{textAlign:'center',color:'#a78bfa'}}><div style={{fontSize:32}}>🍜</div><div>กำลังโหลด...</div></div></div>}>
      <MenuPageInner />
    </Suspense>
  )
}\n`;
} else {
    // If not found, use a regex fallback for the last div closing
    const match = jsx.match(/    <\/div>\r?\n  \);\r?\n\}/);
    if (match) {
        chopIdx = match.index + match[0].length;
        jsx = jsx.substring(0, chopIdx);
        jsx += `\n\nexport default function MenuPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F8F7FF'}}><div style={{textAlign:'center',color:'#a78bfa'}}><div style={{fontSize:32}}>🍜</div><div>กำลังโหลด...</div></div></div>}>
      <MenuPageInner />
    </Suspense>
  )
}\n`;
    }
}

fs.writeFileSync(pagePath, jsx, 'utf8');
