const fs = require('fs');

const globalsPath = 'C:\\Users\\user\\Desktop\\mom-restaurant-new\\app\\globals.css';
let css = fs.readFileSync(globalsPath, 'utf8');
const importStr = "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Serif+Display&display=swap');";
css = css.replace(importStr, '');
css = importStr + '\n' + css.trimStart();
fs.writeFileSync(globalsPath, css, 'utf8');

const jsxPath = 'C:\\Users\\user\\Desktop\\mom-restaurant-new\\app\\menu\\page.jsx';
let jsx = fs.readFileSync(jsxPath, 'utf8');
if (!jsx.includes('Suspense } from')) {
    jsx = jsx.replace('import { useState, useEffect, useMemo } from "react";', 'import { useState, useEffect, useMemo, Suspense } from "react";');
}
jsx = jsx.replace('export default function MenuPage() {', 'function MenuPageInner() {');

const wrapper = `\nexport default function MenuPage() {
  return (
    <Suspense fallback={
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F8F7FF'}}>
        <div style={{textAlign:'center',color:'#a78bfa'}}>
          <div style={{fontSize:32,marginBottom:8}}>🍜</div>
          <div style={{fontFamily:'DM Sans, sans-serif',fontSize:14}}>กำลังโหลด...</div>
        </div>
      </div>
    }>
      <MenuPageInner />
    </Suspense>
  )
}\n`;

if (!jsx.includes('export default function MenuPage()')) {
    jsx += wrapper;
}

fs.writeFileSync(jsxPath, jsx, 'utf8');
