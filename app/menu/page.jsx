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

// ─────────────────────────────────────────────────────────────────────────────
// MenuItem Card
// ─────────────────────────────────────────────────────────────────────────────
function MenuItemCard({ item, qty, onAdd, onRemove }) {
  const sold = !item.available;

  return (
    <div className={`relative bg-white flex flex-col overflow-hidden transition-all ${sold ? 'opacity-50' : ''}`}
         style={{
           border: "1px solid rgba(108,99,255,0.08)",
           borderRadius: "var(--radius-md)",
           boxShadow: "var(--shadow-sm)",
         }}>

      {/* Qty Bubble */}
      {qty > 0 && (
        <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[11px] shadow-sm"
             style={{ background: "var(--warning)" }}>
          {qty}
        </div>
      )}

      {/* Image Area */}
      <div className="w-full relative flex items-center justify-center h-[120px] max-[480px]:h-auto max-[480px]:aspect-[4/3] overflow-hidden"
           style={{ background: "linear-gradient(135deg, #f8f4ff, #e8f4fd)" }}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span style={{ fontSize: "48px" }}>{item.emoji}</span>
        )}

        {/* Unavailable Overlay */}
        {sold && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(2px)" }}>
            <span className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">หมด</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 justify-between gap-2" style={{ padding: "10px 12px" }}>
        <div>
          <p className="text-[13px] font-semibold leading-tight line-clamp-2" style={{ color: "var(--text-primary)" }}>{item.name}</p>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <p className="text-[14px] font-bold" style={{ color: "var(--primary)" }}>฿{item.price}</p>

          {!sold && (
            <div className="flex items-center gap-2">
              {qty > 0 ? (
                <div className="flex items-center bg-[var(--bg-secondary)] rounded-full p-0.5 border border-[var(--border)]">
                  <button
                    onClick={() => onRemove(item)}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-white text-gray-700 font-bold active:scale-95 shadow-sm"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-xs font-bold">{qty}</span>
                  <button
                    onClick={() => onAdd(item)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold active:scale-95 shadow-sm"
                    style={{ background: "var(--primary-gradient)" }}
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onAdd(item)}
                  className="w-[26px] h-[26px] rounded-lg text-white flex items-center justify-center text-lg leading-none active:scale-90 transition-transform"
                  style={{ background: "var(--primary-gradient)", borderRadius: "8px" }}
                >
                  +
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cart Drawer (Bottom Sheet)
// ─────────────────────────────────────────────────────────────────────────────
function CartDrawer({ cartItems, totalPrice, note, setNote, onClose, onSubmit, submitting }) {
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(26,26,46,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white flex flex-col shadow-2xl"
           style={{ borderRadius: "24px 24px 0 0", padding: "20px", maxHeight: "85vh" }}>

        {/* Handle */}
        <div className="mx-auto mb-4" style={{ width: "36px", height: "4px", background: "rgba(108,99,255,0.2)", borderRadius: "2px" }} />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
            รายการออเดอร์
          </h2>
          <button onClick={onClose} className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center">×</button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-4 pb-4 no-scrollbar">
          {/* Items */}
          {cartItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-3xl w-10 text-center select-none">{item.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate text-gray-800">{item.name}</p>
                <p className="text-[13px] font-bold" style={{ color: "var(--primary)" }}>฿{item.price * item.qty}</p>
              </div>
              <div className="font-bold text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                x{item.qty}
              </div>
            </div>
          ))}

          {/* Note Input */}
          <div className="pt-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="หมายเหตุ: เผ็ดน้อย, ไม่ใส่ผักชี..."
              rows={2}
              className="w-full text-sm outline-none resize-none transition-colors"
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "10px",
                fontFamily: "'DM Sans', sans-serif"
              }}
            />
          </div>

          <div className="flex justify-between items-center py-2 border-t border-gray-100">
            <span className="text-sm text-gray-500">รวมทั้งหมด</span>
            <span className="text-xl font-bold" style={{ color: "var(--primary)" }}>฿{totalPrice}</span>
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={submitting}
          className="w-full mt-2 font-bold text-white transition-transform active:scale-95 disabled:opacity-70 flex justify-center items-center h-[52px]"
          style={{ background: "var(--primary-gradient)", borderRadius: "var(--radius-md)" }}
        >
          {submitting ? "กำลังส่ง..." : "ยืนยันการสั่งอาหาร"}
        </button>
      </div>
    </>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
function MenuPageInner() {
  const searchParams = useSearchParams();
  const table = searchParams.get("table") ?? "?";

  // ── State ────────────────────────────────────────────────────────────────
  const [menuItems, setMenuItems]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeCategory, setCategory] = useState("all");
  const [cart, setCart]               = useState({});   // { [id]: { ...item, qty } }
  const [note, setNote]               = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCart, setShowCart]       = useState(false);

  // ── Firestore realtime listener ───────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = listenToMenu((items) => {
      setMenuItems(items);
      setLoading(false);
    });
    return () => unsubscribe(); // cleanup on unmount
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (activeCategory === "all") return menuItems;
    return menuItems.filter((i) => i.category === activeCategory);
  }, [menuItems, activeCategory]);

  const cartValues   = Object.values(cart);
  const totalItems   = cartValues.reduce((s, i) => s + i.qty, 0);
  const totalPrice   = cartValues.reduce((s, i) => s + i.price * i.qty, 0);
  const hasCart      = totalItems > 0;

  // Close cart if empty
  useEffect(() => {
    if (!hasCart && showCart) setShowCart(false);
  }, [hasCart, showCart]);

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const addToCart = (item) =>
    setCart((prev) => ({
      ...prev,
      [item.id]: prev[item.id]
        ? { ...prev[item.id], qty: prev[item.id].qty + 1 }
        : { ...item, qty: 1 },
    }));

  const removeFromCart = (item) =>
    setCart((prev) => {
      const current = prev[item.id];
      if (!current || current.qty <= 1) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: { ...current, qty: current.qty - 1 } };
    });

  // ── Submit order ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!hasCart || submitting) return;
    setSubmitting(true);
    try {
      const freshItems = Object.values(cart).map(({ id, name, price, emoji, qty }) => ({
        id, name, price, emoji, qty,
      }));
      const freshTotal = freshItems.reduce((s, i) => s + i.price * i.qty, 0);
      await addOrder({ table: Number(table), items: freshItems, total: freshTotal, note });
      setCart({});
      setNote("");
      setShowCart(false);
      setShowSuccess(true);
    } catch (err) {
      console.error("addOrder failed:", err);
      alert("เกิดข้อผิดพลาด กรุณาลองอีกครั้งนะคะ");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] flex flex-col relative w-full overflow-x-hidden">

      {/* ── Header Area ────────────────────────────────────────────────────── */}
      <div className="relative w-full z-20" style={{ background: "var(--primary-gradient)", padding: "20px 16px 36px" }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-white m-0 leading-none" style={{ fontFamily: "'DM Serif Display', serif", fontSize: "18px" }}>
              ร้านแม่
            </h1>
            <span
              className="px-3 py-1 text-white font-medium"
              style={{
                fontSize: "12px",
                borderRadius: "20px",
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.3)"
              }}
            >
              โต๊ะ {table}
            </span>
          </div>

          <button
            onClick={() => hasCart && setShowCart(true)}
            className="relative flex items-center justify-center h-9 w-9 active:scale-95 transition-transform"
            style={{
              borderRadius: "var(--radius-sm)",
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.3)"
            }}
          >
            <span className="text-lg">🛒</span>
            {hasCart && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center text-white"
                    style={{ background: "#FF6B6B", width: "16px", height: "16px", borderRadius: "50%", fontSize: "10px", fontWeight: "bold" }}>
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* ── Category Filter Bar ──────────────────────────────────────── */}
        <div className="w-full mt-5 max-w-md mx-auto">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar" style={{ scrollSnapType: "x mandatory" }}>
            {[["all", "ทั้งหมด"], ...Object.entries(CATEGORIES)].map(([key, label]) => {
              const isActive = activeCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className="whitespace-nowrap transition-all flex-shrink-0"
                  style={{
                    padding: "5px 14px",
                    fontSize: "12px",
                    borderRadius: "20px",
                    scrollSnapAlign: "start",
                    background: isActive ? "white" : "rgba(255,255,255,0.15)",
                    color: isActive ? "var(--primary)" : "rgba(255,255,255,0.85)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content Area ──────────────────────────────────────────────────── */}
      <main className="flex-1 w-full mx-auto max-w-md bg-[var(--bg)] relative z-10 px-4 pb-32"
            style={{ marginTop: "-20px", borderRadius: "20px 20px 0 0", paddingTop: "16px" }}>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full animate-spin"
                 style={{ border: "3px solid var(--border)", borderTopColor: "var(--primary)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>กำลังโหลดเมนู...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[10px]">
            {filtered.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                qty={cart[item.id]?.qty ?? 0}
                onAdd={addToCart}
                onRemove={removeFromCart}
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-sm" style={{ color: "var(--text-muted)" }}>
            ไม่มีรายการเมนูในหมวดหมู่นี้
          </div>
        )}
      </main>

      {/* ── View Cart Floating Bar ────────────────────────────────────────── */}
      {hasCart && !showCart && (
        <div className="fixed bottom-6 left-0 right-0 z-30 px-4 flex justify-center">
          <button
            onClick={() => setShowCart(true)}
            className="w-full max-w-md h-14 flex items-center justify-between px-5 text-white shadow-lg active:scale-[0.98] transition-all"
            style={{ background: "var(--text-primary)", borderRadius: "var(--radius-xl)", boxShadow: "0 8px 24px rgba(26,26,46,0.2)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "rgba(255,255,255,0.2)" }}>
                {totalItems}
              </div>
              <span className="font-semibold text-[15px]">ดูออเดอร์</span>
            </div>
            <span className="font-bold text-[15px]">฿{totalPrice}</span>
          </button>
        </div>
      )}

      {/* ── Contextual Nav/Modals ───────────────────────────────────────── */}
      {showCart && (
        <CartDrawer
          cartItems={cartValues}
          totalPrice={totalPrice}
          note={note}
          setNote={setNote}
          onClose={() => setShowCart(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {showSuccess && (
        <SuccessModal onClose={() => setShowSuccess(false)} />
      )}

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
