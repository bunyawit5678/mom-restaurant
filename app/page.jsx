'use client'
import Link from 'next/link'

export default function Home() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px',background:'#FAFAFA'}}>
      
      {/* Logo */}
      <div style={{width:72,height:72,borderRadius:20,background:'#7C3AED',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,marginBottom:16,boxShadow:'0 8px 24px rgba(124,58,237,0.3)'}}>
        🍜
      </div>
      
      <h1 style={{fontSize:28,fontWeight:700,color:'#111111',marginBottom:4}}>ครัวตุ๊กตาอาหารตามสั่ง</h1>
      <p style={{fontSize:14,color:'#6B7280',marginBottom:40}}>ระบบสั่งอาหาร QR Code</p>
      
      <div style={{width:'100%',maxWidth:320,display:'flex',flexDirection:'column',gap:12}}>
        <Link href="/menu?table=1" style={{display:'block',padding:'16px',background:'#7C3AED',color:'white',borderRadius:14,textAlign:'center',fontSize:15,fontWeight:600,textDecoration:'none',boxShadow:'0 4px 12px rgba(124,58,237,0.3)'}}>
          เปิดเมนู (ลูกค้า)
        </Link>
        <Link href="/admin" style={{display:'block',padding:'16px',background:'white',color:'#7C3AED',border:'1.5px solid #7C3AED',borderRadius:14,textAlign:'center',fontSize:15,fontWeight:600,textDecoration:'none'}}>
          แดชบอร์ดร้าน
        </Link>
      </div>
      
      <p style={{marginTop:32,fontSize:12,color:'#9CA3AF',textAlign:'center'}}>หน้านี้สำหรับทดสอบเท่านั้น</p>
    </div>
  )
}
