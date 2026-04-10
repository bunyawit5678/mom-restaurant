const fs = require('fs');
const filepath = 'C:\\Users\\user\\Desktop\\mom-restaurant-new\\app\\menu\\page.jsx';
const lines = fs.readFileSync(filepath, 'utf8').split(/\r?\n/);

const newLines = [];
let insideRedundantInner = false;
let foundInnerCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim() === "import { Suspense } from 'react';") {
        continue;
    }
    
    if (line.trim() === "function MenuPageInner() {") {
        foundInnerCount++;
        if (foundInnerCount > 1) {
            insideRedundantInner = true;
            continue;
        }
    }
    
    if (insideRedundantInner) {
        if (line.trim() === "export default function MenuPage() {") {
            insideRedundantInner = false;
        } else {
            continue;
        }
    }
    
    newLines.push(line);
}

fs.writeFileSync(filepath, newLines.join('\n'), 'utf8');
