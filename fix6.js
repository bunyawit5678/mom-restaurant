const fs = require('fs');
const src = 'C:\\Users\\user\\Desktop\\mom-restaurant\\app\\menu\\page.jsx';
const dest = 'C:\\Users\\user\\Desktop\\mom-restaurant-new\\app\\menu\\page.jsx';

let jsx = fs.readFileSync(src, 'utf8');

const compactWrapper = `export default function MenuPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F8F7FF'}}><div style={{textAlign:'center',color:'#a78bfa'}}><div style={{fontSize:32}}>🍜</div><div>กำลังโหลด...</div></div></div>}>
      <MenuPageInner />
    </Suspense>
  )
}`;

const startIdx = jsx.indexOf('export default function MenuPage() {');
if (startIdx !== -1) {
    jsx = jsx.substring(0, startIdx) + compactWrapper + '\n';
}

fs.writeFileSync(dest, jsx, 'utf8');
