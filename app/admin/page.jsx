"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
    listenToActiveOrders,
    listenToOrders,
    updateOrderStatus,
    listenToMenu,
    updateMenuAvailability,
    addMenuItem,
    uploadMenuImage,
} from "@/lib/firestore";
import { generatePromptPayPayload } from "@/lib/promptpay";
import { CATEGORIES } from "@/data/menu";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const PROMPTPAY_PHONE = "0637305219";
const NUM_TABLES = 8;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        pending: { label: "รอชำระ",  bg: "rgba(255, 107, 107, 0.15)", text: "var(--warning)" },
        paid:    { label: "จ่ายแล้ว", bg: "rgba(74, 222, 128, 0.15)", text: "var(--success)" },
        done:    { label: "ปิดแล้ว",  bg: "rgba(107, 107, 138, 0.15)", text: "var(--text-secondary)" },
    };
    const { label, bg, text } = map[status] ?? map.pending;
    return (
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: bg, color: text }}>
            {label}
        </span>
    );
}

function formatTime(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

/** Merge items from multiple orders — sum qty for identical names */
function mergeItems(orders) {
    const map = {};
    for (const order of orders) {
        for (const item of order.items ?? []) {
            if (map[item.name]) {
                map[item.name].qty += item.qty;
            } else {
                map[item.name] = { ...item };
            }
        }
    }
    return Object.values(map);
}

// ─────────────────────────────────────────────────────────────────────────────
// PromptPay QR canvas component
// ─────────────────────────────────────────────────────────────────────────────
function PromptPayQR({ amount, phone }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const payload = generatePromptPayPayload(phone, amount);

        import("qrcode").then((QRCode) => {
            QRCode.toCanvas(canvasRef.current, payload, {
                width:  200,
                margin: 2,
                color: { dark: "#1a1a2e", light: "#FFFFFF" },
            });
        });
    }, [amount, phone]);

    return (
        <div className="flex flex-col items-center gap-2 py-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm" style={{ border: "1px solid var(--border)" }}>
                <canvas ref={canvasRef} className="rounded-xl" />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>พร้อมเพย์ · {phone}</p>
            <p className="text-3xl font-bold" style={{ color: "var(--primary)" }}>฿{amount.toLocaleString()}</p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Table Modal (bottom sheet)
// ─────────────────────────────────────────────────────────────────────────────
function TableModal({ tableNum, orders, onClose, onPaid, onDone }) {
    const items      = useMemo(() => mergeItems(orders), [orders]);
    const grandTotal = orders.reduce((s, o) => s + (o.total ?? 0), 0);
    const notes      = orders.map((o) => o.note).filter(Boolean);

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" style={{ background: "rgba(26,26,46,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose} />

            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white flex flex-col shadow-2xl"
                 style={{ borderRadius: "24px 24px 0 0", maxHeight: "90vh" }}>
                {/* Handle */}
                <div className="flex justify-center pt-4 pb-2">
                    <div style={{ width: "36px", height: "4px", background: "rgba(108,99,255,0.2)", borderRadius: "2px" }} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pb-4">
                    <h2 className="text-xl" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
                        โต๊ะ {tableNum} — รายการทั้งหมด
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 text-2xl leading-none w-8 h-8 flex items-center justify-center -mr-2"
                    >
                        ×
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 space-y-3 pb-6 no-scrollbar">
                    {/* Item list */}
                    {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                            <span className="text-2xl w-10 text-center">{item.emoji}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.qty} × ฿{item.price}</p>
                            </div>
                            <p className="text-[15px] font-bold" style={{ color: "var(--primary)" }}>฿{item.qty * item.price}</p>
                        </div>
                    ))}

                    {/* Notes */}
                    {notes.length > 0 && (
                        <div className="rounded-xl p-3 mt-4" style={{ background: "rgba(255, 107, 107, 0.05)", border: "1px solid rgba(255, 107, 107, 0.1)" }}>
                            <p className="text-xs font-bold mb-1" style={{ color: "var(--warning)" }}>หมายเหตุ</p>
                            {notes.map((n, i) => <p key={i} className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{n}</p>)}
                        </div>
                    )}

                    {/* Grand total */}
                    <div className="flex justify-between items-center py-4">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>รวมทั้งหมด</p>
                        <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>฿{grandTotal}</p>
                    </div>

                    {/* PromptPay QR */}
                    <div className="rounded-2xl overflow-hidden mt-2 p-4 flex flex-col items-center justify-center bg-[var(--bg)]" style={{ border: "1px solid var(--border)" }}>
                        <p className="text-center text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>สแกนรับชำระเงิน</p>
                        <PromptPayQR amount={grandTotal} phone={PROMPTPAY_PHONE} />
                    </div>
                </div>

                {/* Action buttons */}
                <div className="px-6 pb-8 pt-4 border-t flex gap-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <button
                        onClick={onDone}
                        className="flex-1 py-3.5 rounded-xl font-bold text-[14px] active:scale-95 transition-all text-gray-500"
                        style={{ border: "1px solid var(--border)", background: "transparent" }}
                    >
                        ปิดโต๊ะ
                    </button>
                    <button
                        onClick={onPaid}
                        className="flex-[2] py-3.5 rounded-xl text-white font-bold text-[15px] active:scale-95 transition-all shadow-md"
                        style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }}
                    >
                        รับชำระแล้ว ✓
                    </button>
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// History Detail Modal
// ─────────────────────────────────────────────────────────────────────────────
function HistoryModal({ order, onClose }) {
    if (!order) return null;
    return (
        <>
            <div className="fixed inset-0 z-40" style={{ background: "rgba(26,26,46,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white flex flex-col shadow-2xl"
                 style={{ borderRadius: "24px 24px 0 0", maxHeight: "85vh" }}>
                <div className="flex justify-center pt-4 pb-2">
                    <div style={{ width: "36px", height: "4px", background: "rgba(108,99,255,0.2)", borderRadius: "2px" }} />
                </div>
                <div className="flex items-center justify-between px-6 pb-4">
                    <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                        โต๊ะ {order.table} <span className="text-gray-400 font-normal ml-2 text-sm">{formatTime(order.createdAt)}</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center -mr-2">×</button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 space-y-3 pb-8 no-scrollbar">
                    {(order.items ?? []).map((item, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                            <span className="text-2xl w-10 text-center">{item.emoji}</span>
                            <div className="flex-1">
                                <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.qty} × ฿{item.price}</p>
                            </div>
                            <p className="text-[15px] font-bold" style={{ color: "var(--primary)" }}>฿{item.qty * item.price}</p>
                        </div>
                    ))}
                    {order.note && (
                        <div className="rounded-xl p-3 mt-4" style={{ background: "rgba(255, 107, 107, 0.05)", border: "1px solid rgba(255, 107, 107, 0.1)" }}>
                            <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{order.note}</p>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-4 mt-2">
                        <StatusBadge status={order.status} />
                        <p className="font-bold text-2xl" style={{ color: "var(--primary)" }}>฿{order.total}</p>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
const EMOJI_OPTIONS = ["🍛","🍲","🍝","🍜","🍚","🍳","🥘","🫕","🥗","💧","🧊","🍹","🥤"];

function AddMenuModal({ onClose }) {
    const [name,       setName]       = useState("");
    const [price,      setPrice]      = useState("");
    const [category,   setCategory]   = useState("rice");
    const [emoji,      setEmoji]      = useState("🍛");
    const [imageFile,  setImageFile]  = useState(null);
    const [preview,    setPreview]    = useState(null);
    const [saving,     setSaving]     = useState(false);
    const [error,      setError]      = useState("");
    const fileInputRef = useRef(null);

    function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setPreview(URL.createObjectURL(file));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim()) { setError("กรุณาใส่ชื่อเมนู"); return; }
        if (!price || isNaN(Number(price)) || Number(price) <= 0) { setError("กรุณาใส่ราคาที่ถูกต้อง"); return; }

        setSaving(true);
        setError("");

        try {
            const tempId = `temp_${Date.now()}`;
            let imageUrl = "";

            if (imageFile) {
                imageUrl = await uploadMenuImage(imageFile, tempId);
            }

            await addMenuItem({
                name:      name.trim(),
                price:     Number(price),
                category,
                emoji,
                imageUrl,
                available: true,
                sortOrder: Date.now(),
                description: "",
            });

            onClose();
        } catch (err) {
            console.error(err);
            setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 transition-opacity" style={{ background: "rgba(26,26,46,0.6)", backdropFilter: "blur(6px)" }} onClick={!saving ? onClose : undefined} />

            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white flex flex-col shadow-2xl transition-transform"
                 style={{ borderRadius: "24px 24px 0 0", maxHeight: "92vh" }}>
                {/* Handle */}
                <div className="flex justify-center pt-4 pb-2">
                    <div style={{ width: "36px", height: "4px", background: "rgba(108,99,255,0.2)", borderRadius: "2px" }} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pb-2">
                    <h2 className="text-xl" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>+ เพิ่มเมนูใหม่</h2>
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center disabled:opacity-40 -mr-2"
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 pb-6 mt-4 space-y-5 no-scrollbar">

                    {/* Image upload */}
                    <div>
                        <label className="block text-[13px] font-bold mb-2 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>รูปภาพ (ถ้ามี)</label>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-sm active:scale-[0.98] transition-all overflow-hidden relative"
                            style={{ borderColor: "var(--border)", background: "rgba(108,99,255,0.02)", color: "var(--text-muted)" }}
                        >
                            {preview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={preview} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <>
                                    <span className="text-3xl mb-1">📷</span>
                                    <span className="font-medium">แตะเพื่อเลือกรูป</span>
                                </>
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Emoji picker */}
                    <div>
                        <label className="block text-[13px] font-bold mb-2 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Emoji</label>
                        <div className="flex flex-wrap gap-2">
                            {EMOJI_OPTIONS.map((em) => (
                                <button
                                    key={em}
                                    type="button"
                                    onClick={() => setEmoji(em)}
                                    className={`text-2xl w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center`}
                                    style={emoji === em ? { borderColor: "var(--primary)", background: "var(--bg-secondary)", transform: "scale(1.05)" } : { borderColor: "var(--border)", background: "var(--surface)" }}
                                >
                                    {em}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-[13px] font-bold mb-2 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>ชื่อเมนู *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="เช่น ข้าวราดกะเพรา"
                            className="w-full rounded-xl px-4 py-3.5 text-[15px] outline-none transition-all placeholder:text-gray-300"
                            style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)" }}
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-[13px] font-bold mb-2 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>ราคา (บาท) *</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="50"
                            min="1"
                            className="w-full rounded-xl px-4 py-3.5 text-[15px] outline-none transition-all placeholder:text-gray-300"
                            style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)" }}
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-[13px] font-bold mb-2 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>หมวดหมู่ *</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full rounded-xl px-4 py-3.5 text-[15px] outline-none transition-all"
                            style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)" }}
                        >
                            {Object.entries(CATEGORIES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-[13px] font-semibold p-3 rounded-xl mt-2" style={{ color: "var(--warning)", background: "rgba(255, 107, 107, 0.1)" }}>{error}</p>
                    )}
                </form>

                {/* Submit */}
                <div className="px-6 pb-8 pt-4 border-t" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="w-full py-4 rounded-xl text-white font-bold text-[15px] active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
                        style={{ background: "var(--primary-gradient)" }}
                    >
                        {saving ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                กำลังอัปโหลด...
                            </>
                        ) : (
                            "บันทึกเมนู"
                        )}
                    </button>
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPage() {
    const [activeTab,     setActiveTab]     = useState("tables");
    const [activeOrders,  setActiveOrders]  = useState([]);
    const [allOrders,     setAllOrders]     = useState([]);
    const [menuItems,     setMenuItems]     = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [selectedTable, setSelectedTable] = useState(null); // table number
    const [historyOrder,  setHistoryOrder]  = useState(null); // order object
    const [showAddMenu,   setShowAddMenu]   = useState(false);

    // ── Realtime listeners ─────────────────────────────────────────────────
    useEffect(() => {
        const unsub = listenToActiveOrders((orders) => {
            setActiveOrders(orders);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const unsub = listenToOrders((orders) => setAllOrders(orders));
        return () => unsub();
    }, []);

    useEffect(() => {
        const unsub = listenToMenu((items) => setMenuItems(items));
        return () => unsub();
    }, []);

    // ── Stats ──────────────────────────────────────────────────────────────
    const today = new Date().toDateString();
    const todayOrders = allOrders.filter((o) => {
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt ?? 0);
        return d.toDateString() === today;
    });
    const revenue = todayOrders
        .filter((o) => o.status === "paid" || o.status === "done")
        .reduce((s, o) => s + (o.total ?? 0), 0);
    const pendingCount = activeOrders.filter((o) => o.status === "pending").length;

    // ── Table helpers ──────────────────────────────────────────────────────
    function tableOrders(tableNum) {
        return activeOrders.filter((o) => o.table === tableNum);
    }

    function tableStatus(orders) {
        if (orders.length === 0) return "empty";
        if (orders.some((o) => o.status === "pending")) return "pending";
        return "paid";
    }

    function tableTotal(orders) {
        return orders.reduce((s, o) => s + (o.total ?? 0), 0);
    }

    function tableSummary(orders) {
        const names = orders.flatMap((o) => (o.items ?? []).map((i) => i.name)).join(", ");
        return names.length > 40 ? names.slice(0, 40) + "…" : names;
    }

    // ── Order actions ──────────────────────────────────────────────────────
    async function handlePaid(tableNum) {
        const orders = tableOrders(tableNum);
        await Promise.all(orders.map((o) => updateOrderStatus(o.id, "paid")));
        setSelectedTable(null);
    }

    async function handleDone(tableNum) {
        const orders = tableOrders(tableNum);
        await Promise.all(orders.map((o) => updateOrderStatus(o.id, "done")));
        setSelectedTable(null);
    }

    // ── Menu grouped ───────────────────────────────────────────────────────
    const menuGrouped = useMemo(() => {
        const groups = {};
        for (const item of menuItems) {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        }
        return groups;
    }, [menuItems]);

    // ─────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-[100dvh] bg-[var(--bg)] flex flex-col relative w-full overflow-x-hidden">

            {/* ── Top Header & Stats Area ───────────────────────────────────── */}
            <div className="relative w-full z-20" style={{ background: "var(--text-primary)", padding: "20px 16px 24px" }}>
                <div className="max-w-md mx-auto">
                    {/* Nav Bar */}
                    <header className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <h1 className="text-white m-0 leading-none" style={{ fontFamily: "'DM Serif Display', serif", fontSize: "20px" }}>
                                ร้านแม่
                            </h1>
                            <span className="flex items-center gap-1.5 px-2.5 py-1 font-medium"
                                  style={{ background: "rgba(74, 222, 128, 0.15)", color: "var(--success)", borderRadius: "12px", fontSize: "11px", border: "1px solid rgba(74, 222, 128, 0.2)" }}>
                                <span className="w-1.5 h-1.5 bg-[var(--success)] rounded-full animate-pulse" />
                                LIVE
                            </span>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: "ออเดอร์", value: todayOrders.length, unit: "รายการ" },
                            { label: "รายได้วันนี้",  value: `฿${revenue}`,      unit: ""       },
                            { label: "รอชำระ",        value: pendingCount,        unit: "โต๊ะ"  },
                        ].map(({ label, value, unit }) => (
                            <div key={label} className="rounded-2xl p-3 flex flex-col items-center justify-center text-center"
                                 style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
                                <p className="text-white font-bold text-xl leading-none mb-1">{value}</p>
                                <p className="text-[10px] tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>{label} {unit}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex bg-black/20 p-1 rounded-2xl mt-6">
                        {[
                            { key: "tables",  label: "Live Orders" },
                            { key: "history", label: "History" },
                            { key: "menu",    label: "Menu" },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all"
                                style={activeTab === key ? { background: "var(--surface)", color: "var(--text-primary)", boxShadow: "var(--shadow-sm)" } : { color: "var(--text-muted)" }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Content Area ──────────────────────────────────────────────── */}
            <main className="flex-1 w-full mx-auto max-w-md bg-[var(--bg)] relative z-10 px-4 pb-28 pt-6"
                  style={{ marginTop: "-20px", borderRadius: "20px 20px 0 0" }}>

                {/* ── TAB: โต๊ะ (Live Orders) ───────────────────────────────── */}
                {activeTab === "tables" && (
                    <div>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <div className="w-8 h-8 rounded-full animate-spin"
                                     style={{ border: "3px solid var(--border)", borderTopColor: "var(--primary)" }} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {Array.from({ length: NUM_TABLES }, (_, i) => i + 1).map((tableNum) => {
                                    const orders = tableOrders(tableNum);
                                    const status = tableStatus(orders);
                                    const total  = tableTotal(orders);
                                    const hasPending = orders.some((o) => o.status === "pending");
                                    const hasNew = orders.some((o) => !o.items || o.items.length > 0); // Simplified new check

                                    return (
                                        <button
                                            key={tableNum}
                                            onClick={() => status !== "empty" && setSelectedTable(tableNum)}
                                            disabled={status === "empty"}
                                            className={`relative text-left rounded-2xl p-4 transition-all min-h-[120px] flex flex-col justify-between overflow-hidden shadow-sm hover:-translate-y-px
                                                ${status === "empty" ? "bg-white/60 cursor-default" : "bg-white cursor-pointer active:scale-95"}
                                            `}
                                            style={{
                                                border: status === "empty" ? "1px dashed rgba(108,99,255,0.15)"
                                                      : status === "pending" ? "1px solid var(--warning)"
                                                      : "1px solid var(--success)",
                                                boxShadow: status === "pending" ? "0 4px 12px rgba(255, 107, 107, 0.15)" : "var(--shadow-sm)"
                                            }}
                                        >
                                            {/* Top Row: Table Num & Badge */}
                                            <div className="flex justify-between items-start w-full">
                                                <p className={`text-[17px] font-bold ${status === "empty" ? "text-gray-400" : "text-gray-900"}`}>
                                                    โต๊ะ {tableNum}
                                                </p>
                                                {status !== "empty" ? (
                                                    <StatusBadge status={orders[0]?.status} />
                                                ) : (
                                                    <span className="text-[11px] font-medium text-gray-400 px-2.5 py-1 rounded-full bg-gray-50">ว่าง</span>
                                                )}
                                            </div>

                                            {/* Middle/Bottom Row: Summary & Total */}
                                            {status !== "empty" && (
                                                <div className="mt-3">
                                                    <p className="text-[12px] leading-tight mb-2 opacity-80 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                                                        {tableSummary(orders)}
                                                    </p>
                                                    <p className="text-[16px] font-bold" style={{ color: "var(--primary)" }}>฿{total.toLocaleString()}</p>
                                                </div>
                                            )}

                                            {/* Blinking Glow for Pending */}
                                            {hasPending && (
                                                <div className="absolute inset-0 border-2 rounded-2xl pointer-events-none animate-pulse" style={{ borderColor: "rgba(255, 107, 107, 0.4)" }} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: ประวัติ (History) ────────────────────────────────── */}
                {activeTab === "history" && (
                    <div className="space-y-3">
                        {allOrders.length === 0 ? (
                            <p className="text-center py-16 text-sm" style={{ color: "var(--text-muted)" }}>ยังไม่มีออเดอร์</p>
                        ) : (
                            allOrders.map((order) => (
                                <button
                                    key={order.id}
                                    onClick={() => setHistoryOrder(order)}
                                    className="w-full text-left bg-white rounded-2xl p-4 transition-all shadow-sm active:scale-[0.98]"
                                    style={{ border: "1px solid var(--border)" }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>โต๊ะ {order.table}</p>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-gray-50" style={{ color: "var(--text-muted)" }}>
                                                {formatTime(order.createdAt)}
                                            </span>
                                        </div>
                                        <StatusBadge status={order.status} />
                                    </div>
                                    <p className="text-[13px] truncate mb-2" style={{ color: "var(--text-secondary)" }}>
                                        {(order.items ?? []).map((i) => `${i.name} ×${i.qty}`).join(", ")}
                                    </p>
                                    <p className="text-[15px] font-bold" style={{ color: "var(--primary)" }}>฿{order.total.toLocaleString()}</p>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* ── TAB: เมนู (Menu) ──────────────────────────────────────── */}
                {activeTab === "menu" && (
                    <div>
                        <button
                            onClick={() => setShowAddMenu(true)}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold mb-6 text-white text-[14px] shadow-sm active:scale-[0.98] transition-all"
                            style={{ background: "var(--primary-gradient)" }}
                        >
                            + เพิ่มเมนูใหม่
                        </button>

                        {Object.entries(menuGrouped).map(([cat, items]) => (
                            <div key={cat} className="mb-6">
                                <h3 className="text-[12px] font-bold tracking-widest uppercase mb-3 px-1" style={{ color: "var(--text-muted)" }}>
                                    {CATEGORIES[cat] ?? cat}
                                </h3>
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm transition-all"
                                            style={{ border: "1px solid var(--border)", opacity: item.available ? 1 : 0.6 }}
                                        >
                                            {item.imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "var(--bg-secondary)" }}>
                                                    {item.emoji}
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                                                    {item.name}
                                                </p>
                                                <p className="text-[13px] font-bold" style={{ color: "var(--primary)" }}>฿{item.price}</p>
                                            </div>

                                            <button
                                                onClick={() => updateMenuAvailability(item.id, !item.available)}
                                                className="relative w-12 h-7 rounded-full transition-colors flex-shrink-0"
                                                style={{ background: item.available ? "var(--success)" : "rgba(107, 107, 138, 0.2)" }}
                                            >
                                                <span
                                                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${item.available ? "left-[22px]" : "left-1"}`}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {menuItems.length === 0 && (
                            <p className="text-center py-16 text-sm" style={{ color: "var(--text-muted)" }}>ยังไม่มีเมนูในระบบ</p>
                        )}
                    </div>
                )}
            </main>

            {/* ── Modals ────────────────────────────────────────────────────── */}
            {selectedTable !== null && (
                <TableModal
                    tableNum={selectedTable}
                    orders={tableOrders(selectedTable)}
                    onClose={() => setSelectedTable(null)}
                    onPaid={() => handlePaid(selectedTable)}
                    onDone={() => handleDone(selectedTable)}
                />
            )}

            {historyOrder && (
                <HistoryModal
                    order={historyOrder}
                    onClose={() => setHistoryOrder(null)}
                />
            )}

            {showAddMenu && (
                <AddMenuModal onClose={() => setShowAddMenu(false)} />
            )}
        </div>
    );
}
