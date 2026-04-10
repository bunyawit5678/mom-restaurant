"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { listenToMenu, addOrder } from "@/lib/firestore";
import { CATEGORIES } from "@/data/menu";

// ─────────────────────────────────────────────────────────────────────────────
// Success Modal
// ─────────────────────────────────────────────────────────────────────────────
function SuccessModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl" style={{ borderRadius: "var(--radius-xl)" }}>
        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-4xl mb-6 shadow-md"
             style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }}>
          ✓
        </div>
        <h2 className="font-serif text-2xl text-gray-900 mb-2 mt-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
          ส่งออเดอร์ให้แม่ครัวแล้ว!
        </h2>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
          กรุณารอรับอาหาร ทางร้านกำลังเตรียมให้นะคะ
        </p>
        <button
          onClick={onClose}
          className="w-full py-4 text-white font-bold text-base active:scale-95 transition-transform"
          style={{ background: "var(--primary-gradient)", borderRadius: "var(--radius-md)" }}
        >
          ตกลง — สั่งเพิ่ม
        </button>
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F8F7FF'}}><div style={{textAlign:'center',color:'#a78bfa'}}><div style={{fontSize:32}}>🍜</div><div>กำลังโหลด...</div></div></div>}>
      <MenuPageInner />
    </Suspense>
  )
}
