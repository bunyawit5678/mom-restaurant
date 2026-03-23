"use client";

import { useState } from "react";

/**
 * CartDrawer
 * Props:
 *   cart         — { [itemId]: { ...item, qty } }
 *   onUpdateQty  — (item, newQty) => void  (newQty 0 = remove)
 *   onClose      — () => void
 *   onSubmit     — (note: string) => void
 *   tableNum     — number
 */
export default function CartDrawer({ cart, onUpdateQty, onClose, onSubmit, tableNum }) {
    const [note, setNote] = useState("");

    const items      = Object.values(cart);
    const totalPrice = items.reduce((s, i) => s + i.price * i.qty, 0);
    const isEmpty    = items.length === 0;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 transition-opacity" style={{ background: "rgba(26,26,46,0.6)", backdropFilter: "blur(6px)" }} onClick={onClose} />

            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white flex flex-col shadow-2xl transition-transform"
                 style={{ borderRadius: "24px 24px 0 0", maxHeight: "88vh" }}>

                {/* Handle */}
                <div className="flex justify-center pt-4 pb-2 flex-shrink-0">
                    <div style={{ width: "36px", height: "4px", background: "rgba(108,99,255,0.2)", borderRadius: "2px" }} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-xl m-0 leading-tight" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>ตะกร้าของคุณ</h2>
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 inline-block" style={{ background: "var(--bg-secondary)", color: "var(--primary)" }}>โต๊ะ {tableNum}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center -mr-2"
                        aria-label="ปิด"
                    >
                        ×
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 no-scrollbar">
                    {isEmpty ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: "var(--bg-secondary)" }}>🛒</div>
                            <p className="font-medium" style={{ color: "var(--text-muted)" }}>ยังไม่มีรายการในตะกร้า</p>
                        </div>
                    ) : (
                        <>
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: "var(--bg-secondary)" }}>
                                        {item.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                                        <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>฿{item.price}</p>
                                    </div>
                                    {/* Qty controls */}
                                    <div className="flex items-center gap-3 flex-shrink-0 bg-[var(--bg)] px-2.5 py-1 rounded-full border border-[var(--border)]">
                                        <button
                                            onClick={() => onUpdateQty(item, item.qty - 1)}
                                            className="w-6 h-6 rounded-full text-[16px] flex items-center justify-center active:scale-90 transition-all"
                                            style={{ color: "var(--text-secondary)" }}
                                            aria-label={`ลด ${item.name}`}
                                        >
                                            −
                                        </button>
                                        <span className="w-4 text-center font-bold text-[14px]" style={{ color: "var(--text-primary)" }}>{item.qty}</span>
                                        <button
                                            onClick={() => onUpdateQty(item, item.qty + 1)}
                                            className="w-6 h-6 rounded-full text-[16px] flex items-center justify-center active:scale-90 transition-all"
                                            style={{ color: "var(--primary)" }}
                                            aria-label={`เพิ่ม ${item.name}`}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <p className="text-[15px] font-bold w-12 text-right flex-shrink-0" style={{ color: "var(--text-primary)" }}>
                                        ฿{item.price * item.qty}
                                    </p>
                                </div>
                            ))}

                            {/* Note */}
                            <div className="pt-2">
                                <label className="block text-[12px] font-bold uppercase tracking-wider mb-2 mt-2 px-1" style={{ color: "var(--text-muted)" }}>หมายเหตุถึงซัพพอร์ต</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="เช่น ไม่เผ็ด, เผ็ดน้อย, ไม่ใส่ผักชี..."
                                    rows={2}
                                    className="w-full bg-[var(--surface)] rounded-xl px-4 py-3 border border-[var(--border)] text-[14px] outline-none transition-all placeholder-gray-300 resize-none shadow-sm"
                                    style={{ color: "var(--text-primary)" }}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 pb-8 pt-4 border-t space-y-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <div className="flex justify-between items-center px-1">
                        <p className="text-[14px] font-semibold" style={{ color: "var(--text-secondary)" }}>{items.length} รายการ (รวม)</p>
                        <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>฿{totalPrice}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3.5 rounded-xl font-bold text-[14px] active:scale-95 transition-all outline-none"
                            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "transparent" }}
                        >
                            ปิด
                        </button>
                        <button
                            onClick={() => !isEmpty && onSubmit(note)}
                            disabled={isEmpty}
                            className="flex-1 py-3.5 rounded-xl text-white font-bold text-[15px] shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 outline-none disabled:opacity-50 disabled:active:scale-100"
                            style={{ background: "var(--primary-gradient)" }}
                        >
                            <span>ส่งออเดอร์</span>
                            <span>🛎️</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
