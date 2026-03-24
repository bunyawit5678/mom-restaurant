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

// Config
const PROMPTPAY_PHONE = "0637305219";
const NUM_TABLES = 8;

function StatusBadge({ status }) {
    const map = {
        pending: { label: "รอชำระ",  bg: "#FEF3C7", text: "#D97706" },
        paid:    { label: "จ่ายแล้ว", bg: "#D1FAE5", text: "#059669" },
        done:    { label: "ปิดแล้ว",  bg: "#F3F4F6", text: "#6B7280" },
    };
    const { label, bg, text } = map[status] || { label: "ว่าง", bg: "#F3F4F6", text: "#6B7280" };
    return (
        <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', background: bg, color: text }}>
            {label}
        </span>
    );
}

function formatTime(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

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

function PromptPayQR({ amount, phone }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const payload = generatePromptPayPayload(phone, amount);

        import("qrcode").then((QRCode) => {
            QRCode.toCanvas(canvasRef.current, payload, {
                width:  200,
                margin: 2,
                color: { dark: "#111111", light: "#EDE9FE" },
            });
        });
    }, [amount, phone]);

    return (
        <div style={{background:'#EDE9FE',borderRadius:'12px',padding:'16px',display:'flex',flexDirection:'column',alignItems:'center'}}>
            <canvas ref={canvasRef} style={{borderRadius:'8px'}} />
            <p style={{marginTop:'8px',fontSize:'13px',color:'#7C3AED',fontWeight:600}}>สแกนเพื่อจ่าย ฿{amount.toLocaleString()}</p>
        </div>
    );
}

function TableModal({ tableNum, orders, onClose, onPaid, onDone }) {
    const items      = useMemo(() => mergeItems(orders), [orders]);
    const grandTotal = orders.reduce((s, o) => s + (o.total ?? 0), 0);
    const notes      = orders.map((o) => o.note).filter(Boolean);

    return (
        <>
            <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:40}} onClick={onClose} />
            <div style={{position:'fixed',bottom:0,left:0,right:0,background:'white',borderRadius:'20px 20px 0 0',zIndex:50,maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
                <div style={{padding:'12px',display:'flex',justifyContent:'center'}}>
                    <div style={{width:'32px',height:'4px',background:'#E5E7EB',borderRadius:'2px',marginBottom:'4px'}} />
                </div>
                
                <div style={{padding:'0 16px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <h2 style={{fontSize:'17px',fontWeight:700,margin:0}}>โต๊ะ {tableNum}</h2>
                    <button onClick={onClose} style={{background:'none',border:'none',fontSize:'20px',color:'#6B7280'}}>✕</button>
                </div>
                
                <div style={{overflowY:'auto',flex:1,padding:'0 16px 24px'}}>
                    {items.map((item, i) => (
                        <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F3F4F6'}}>
                            <div style={{flex:1}}>
                                <div style={{fontSize:'14px',fontWeight:500,color:'#111111'}}>{item.name}</div>
                                <div style={{fontSize:'13px',color:'#6B7280'}}>{item.qty} × ฿{item.price}</div>
                            </div>
                            <div style={{fontSize:'14px',fontWeight:600,color:'#111111'}}>฿{item.qty * item.price}</div>
                        </div>
                    ))}
                    
                    {notes.length > 0 && (
                        <div style={{background:'#FFFBEB',padding:'12px',borderRadius:'8px',marginTop:'16px'}}>
                            <div style={{fontSize:'12px',fontWeight:600,color:'#D97706',marginBottom:'4px'}}>หมายเหตุ</div>
                            {notes.map((n, i) => <div key={i} style={{fontSize:'13px',color:'#92400E'}}>{n}</div>)}
                        </div>
                    )}
                    
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'24px',marginBottom:'24px'}}>
                        <span style={{fontSize:'15px',color:'#374151'}}>รวมทั้งหมด</span>
                        <span style={{fontSize:'24px',fontWeight:700,color:'#7C3AED'}}>฿{grandTotal.toLocaleString()}</span>
                    </div>
                    
                    {orders.some(o => o.status === 'pending') && (
                        <div style={{display:'flex',justifyContent:'center',marginBottom:'24px'}}>
                            <PromptPayQR amount={grandTotal} phone={PROMPTPAY_PHONE} />
                        </div>
                    )}
                    
                    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                        <button onClick={onPaid} style={{width:'100%',padding:'14px',background:'#7C3AED',color:'white',borderRadius:'12px',border:'none',fontWeight:600,fontSize:'15px'}}>รับชำระ</button>
                        <button onClick={onDone} style={{width:'100%',padding:'14px',background:'white',color:'#10B981',borderRadius:'12px',border:'1.5px solid #10B981',fontWeight:600,fontSize:'15px'}}>ปิดโต๊ะ</button>
                        <button onClick={onClose} style={{width:'100%',padding:'14px',background:'#F3F4F6',color:'#6B7280',borderRadius:'12px',border:'none',fontWeight:600,fontSize:'15px'}}>ปิด</button>
                    </div>
                </div>
            </div>
        </>
    );
}

function HistoryModal({ order, onClose }) {
    if (!order) return null;
    return (
        <>
            <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:40}} onClick={onClose} />
            <div style={{position:'fixed',bottom:0,left:0,right:0,background:'white',borderRadius:'20px 20px 0 0',zIndex:50,maxHeight:'85vh',display:'flex',flexDirection:'column'}}>
                <div style={{padding:'12px',display:'flex',justifyContent:'center'}}>
                    <div style={{width:'32px',height:'4px',background:'#E5E7EB',borderRadius:'2px',marginBottom:'4px'}} />
                </div>
                <div style={{padding:'0 16px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <h2 style={{fontSize:'17px',fontWeight:700,margin:0}}>โต๊ะ {order.table} <span style={{fontSize:'13px',fontWeight:400,color:'#6B7280',marginLeft:'8px'}}>{formatTime(order.createdAt)}</span></h2>
                    <button onClick={onClose} style={{background:'none',border:'none',fontSize:'20px',color:'#6B7280'}}>✕</button>
                </div>
                <div style={{overflowY:'auto',flex:1,padding:'0 16px 24px'}}>
                    {(order.items ?? []).map((item, i) => (
                        <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F3F4F6'}}>
                            <div style={{flex:1}}>
                                <div style={{fontSize:'14px',fontWeight:500,color:'#111111'}}>{item.name}</div>
                                <div style={{fontSize:'13px',color:'#6B7280'}}>{item.qty} × ฿{item.price}</div>
                            </div>
                            <div style={{fontSize:'14px',fontWeight:600,color:'#111111'}}>฿{item.qty * item.price}</div>
                        </div>
                    ))}
                    {order.note && (
                        <div style={{background:'#F3F4F6',padding:'12px',borderRadius:'8px',marginTop:'16px',fontSize:'13px',color:'#374151'}}>{order.note}</div>
                    )}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'24px'}}>
                        <StatusBadge status={order.status} />
                        <span style={{fontSize:'20px',fontWeight:700,color:'#7C3AED'}}>฿{order.total.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </>
    );
}

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
            <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:40}} onClick={!saving ? onClose : undefined} />
            <div style={{position:'fixed',bottom:0,left:0,right:0,background:'white',borderRadius:'20px 20px 0 0',zIndex:50,maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
                <div style={{padding:'12px',display:'flex',justifyContent:'center'}}>
                    <div style={{width:'32px',height:'4px',background:'#E5E7EB',borderRadius:'2px',marginBottom:'4px'}} />
                </div>
                <div style={{padding:'0 16px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <h2 style={{fontSize:'17px',fontWeight:700,margin:0}}>เพิ่มเมนูใหม่</h2>
                    <button onClick={onClose} disabled={saving} style={{background:'none',border:'none',fontSize:'20px',color:'#6B7280'}}>✕</button>
                </div>
                
                <form onSubmit={handleSubmit} style={{overflowY:'auto',flex:1,padding:'0 16px 24px',display:'flex',flexDirection:'column',gap:'16px'}}>
                    <div>
                        <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'8px'}}>รูปภาพ (ถ้ามี)</label>
                        <button type="button" onClick={() => fileInputRef.current?.click()} style={{width:'100%',height:'120px',borderRadius:'12px',border:'2px dashed #E5E7EB',background:'#FAFAFA',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',color:'#6B7280'}}>
                            {preview ? (
                                <img src={preview} alt="preview" style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',objectFit:'cover'}} />
                            ) : (
                                <>
                                    <div style={{fontSize:'24px'}}>📷</div>
                                    <div style={{fontSize:'13px'}}>แตะเพื่อเลือกรูป</div>
                                </>
                            )}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFileChange} />
                    </div>

                    <div>
                        <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'8px'}}>Emoji</label>
                        <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                            {EMOJI_OPTIONS.map((em) => (
                                <button key={em} type="button" onClick={() => setEmoji(em)} style={{fontSize:'20px',width:'44px',height:'44px',borderRadius:'12px',border: emoji === em ? '2px solid #7C3AED' : '1px solid #E5E7EB',background: emoji === em ? '#EDE9FE' : 'white',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                    {em}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'8px'}}>ชื่อเมนู *</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น ข้าวราดกะเพรา" style={{width:'100%',borderRadius:'12px',padding:'12px',border:'1px solid #E5E7EB',fontSize:'15px',outline:'none'}} />
                    </div>

                    <div>
                        <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'8px'}}>ราคา (บาท) *</label>
                        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="50" min="1" style={{width:'100%',borderRadius:'12px',padding:'12px',border:'1px solid #E5E7EB',fontSize:'15px',outline:'none'}} />
                    </div>

                    <div>
                        <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'8px'}}>หมวดหมู่ *</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{width:'100%',borderRadius:'12px',padding:'12px',border:'1px solid #E5E7EB',fontSize:'15px',outline:'none',background:'white'}}>
                            {Object.entries(CATEGORIES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {error && <div style={{fontSize:'13px',fontWeight:600,color:'#EF4444',padding:'12px',background:'#FEF2F2',borderRadius:'8px'}}>{error}</div>}

                    <div style={{paddingTop:'8px'}}>
                        <button type="submit" disabled={saving} style={{width:'100%',padding:'14px',background:'#7C3AED',color:'white',borderRadius:'12px',border:'none',fontWeight:600,fontSize:'15px',opacity: saving ? 0.7 : 1}}>
                            {saving ? 'กำลังบันทึก...' : 'บันทึกเมนู'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

export default function AdminPage() {
    const [activeTab,     setActiveTab]     = useState("tables");
    const [activeOrders,  setActiveOrders]  = useState([]);
    const [allOrders,     setAllOrders]     = useState([]);
    const [menuItems,     setMenuItems]     = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [selectedTable, setSelectedTable] = useState(null);
    const [historyOrder,  setHistoryOrder]  = useState(null);
    const [showAddMenu,   setShowAddMenu]   = useState(false);

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

    const today = new Date().toDateString();
    const todayOrders = allOrders.filter((o) => {
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt ?? 0);
        return d.toDateString() === today;
    });
    const revenue = todayOrders
        .filter((o) => o.status === "paid" || o.status === "done")
        .reduce((s, o) => s + (o.total ?? 0), 0);
    const pendingCount = activeOrders.filter((o) => o.status === "pending").length;

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

    const menuGrouped = useMemo(() => {
        const groups = {};
        for (const item of menuItems) {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        }
        return groups;
    }, [menuItems]);

    return (
        <div style={{minHeight:'100vh',background:'#FAFAFA',paddingBottom:'80px'}}>
            {/* TOP BAR */}
            <div style={{background:'white',borderBottom:'1px solid #E5E7EB',height:'56px',padding:'0 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{fontWeight:700,fontSize:'17px',color:'#111111'}}>แดชบอร์ด</div>
                <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'13px',fontWeight:600,color:'#10B981'}}>
                    <div style={{width:'8px',height:'8px',borderRadius:'4px',background:'#10B981',animation:'pulse 2s infinite'}} />
                    Live
                </div>
            </div>

            {/* STATS ROW */}
            <div style={{display:'flex',padding:'12px 16px',background:'#FAFAFA',borderBottom:'1px solid #E5E7EB',gap:'12px'}}>
                <div style={{flex:1,background:'white',padding:'12px',borderRadius:'12px',border:'1px solid #E5E7EB',display:'flex',flexDirection:'column',alignItems:'center'}}>
                    <div style={{fontSize:'11px',color:'#6B7280',marginBottom:'4px'}}>ออเดอร์</div>
                    <div style={{fontSize:'22px',fontWeight:700,color:'#7C3AED'}}>{todayOrders.length}</div>
                </div>
                <div style={{flex:1,background:'white',padding:'12px',borderRadius:'12px',border:'1px solid #E5E7EB',display:'flex',flexDirection:'column',alignItems:'center'}}>
                    <div style={{fontSize:'11px',color:'#6B7280',marginBottom:'4px'}}>รายได้ (฿)</div>
                    <div style={{fontSize:'22px',fontWeight:700,color:'#111111'}}>{revenue}</div>
                </div>
                <div style={{flex:1,background:'white',padding:'12px',borderRadius:'12px',border:'1px solid #E5E7EB',display:'flex',flexDirection:'column',alignItems:'center'}}>
                    <div style={{fontSize:'11px',color:'#6B7280',marginBottom:'4px'}}>รอชำระ</div>
                    <div style={{fontSize:'22px',fontWeight:700,color:'#EF4444'}}>{pendingCount}</div>
                </div>
            </div>

            {/* TAB BAR */}
            <div style={{display:'flex',background:'white',borderBottom:'1px solid #E5E7EB'}}>
                <button onClick={() => setActiveTab('tables')} style={{flex:1,padding:'12px',background:'none',border:'none',borderBottom: activeTab === 'tables' ? '2px solid #7C3AED' : '2px solid transparent',color: activeTab === 'tables' ? '#7C3AED' : '#6B7280',fontWeight: activeTab === 'tables' ? 600 : 500,fontSize:'15px'}}>โต๊ะ</button>
                <button onClick={() => setActiveTab('history')} style={{flex:1,padding:'12px',background:'none',border:'none',borderBottom: activeTab === 'history' ? '2px solid #7C3AED' : '2px solid transparent',color: activeTab === 'history' ? '#7C3AED' : '#6B7280',fontWeight: activeTab === 'history' ? 600 : 500,fontSize:'15px'}}>ประวัติ</button>
                <button onClick={() => setActiveTab('menu')} style={{flex:1,padding:'12px',background:'none',border:'none',borderBottom: activeTab === 'menu' ? '2px solid #7C3AED' : '2px solid transparent',color: activeTab === 'menu' ? '#7C3AED' : '#6B7280',fontWeight: activeTab === 'menu' ? 600 : 500,fontSize:'15px'}}>เมนู</button>
            </div>

            <div style={{padding:'16px'}}>
                {activeTab === 'tables' && (
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                        {loading ? <div style={{gridColumn:'1 / -1',textAlign:'center',padding:'32px',color:'#6B7280'}}>กำลังโหลด...</div> : (
                            Array.from({ length: NUM_TABLES }, (_, i) => i + 1).map((tableNum) => {
                                const orders = tableOrders(tableNum);
                                const status = tableStatus(orders);
                                const total  = tableTotal(orders);

                                return (
                                    <button
                                        key={tableNum}
                                        onClick={() => status !== "empty" && setSelectedTable(tableNum)}
                                        disabled={status === "empty"}
                                        style={{
                                            background:'white',
                                            border:'1px solid #E5E7EB',
                                            borderRadius:'12px',
                                            padding:'12px',
                                            display:'flex',
                                            flexDirection:'column',
                                            textAlign:'left',
                                            borderLeft: status === 'pending' ? '3px solid #F59E0B' : status === 'paid' ? '3px solid #10B981' : '1px solid #E5E7EB',
                                            opacity: status === 'empty' ? 0.6 : 1
                                        }}
                                    >
                                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',width:'100%',marginBottom:'12px'}}>
                                            <div style={{fontSize:'15px',fontWeight:700,color:'#111111'}}>โต๊ะ {tableNum}</div>
                                            <StatusBadge status={status === 'empty' ? 'empty' : (status === 'pending' ? 'pending' : 'paid')} />
                                        </div>
                                        {status !== 'empty' && (
                                            <>
                                                <div style={{fontSize:'12px',color:'#6B7280',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',width:'100%'}}>{tableSummary(orders)}</div>
                                                <div style={{fontSize:'14px',fontWeight:700,color:'#7C3AED',marginTop:'6px'}}>฿{total.toLocaleString()}</div>
                                            </>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div>
                        {allOrders.length === 0 ? <div style={{textAlign:'center',padding:'32px',color:'#6B7280'}}>ไม่มีประวัติออเดอร์</div> : (
                            allOrders.sort((a,b)=>(b.createdAt?.toDate?.()||new Date()) - (a.createdAt?.toDate?.()||new Date())).map(order => (
                                <button key={order.id} onClick={() => setHistoryOrder(order)} style={{width:'100%',textAlign:'left',background:'white',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'12px',marginBottom:'8px',display:'flex',flexDirection:'column'}}>
                                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',marginBottom:'8px'}}>
                                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                            <div style={{fontSize:'14px',fontWeight:700,color:'#111111'}}>โต๊ะ {order.table}</div>
                                            <div style={{fontSize:'12px',color:'#6B7280'}}>{formatTime(order.createdAt)}</div>
                                        </div>
                                        <StatusBadge status={order.status} />
                                    </div>
                                    <div style={{fontSize:'13px',color:'#6B7280',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',width:'100%',marginBottom:'6px'}}>
                                        {(order.items ?? []).map((i) => `${i.name} ×${i.qty}`).join(", ")}
                                    </div>
                                    <div style={{fontSize:'15px',fontWeight:700,color:'#111111'}}>฿{order.total.toLocaleString()}</div>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'menu' && (
                    <div>
                        {Object.entries(menuGrouped).map(([cat, items]) => (
                            <div key={cat} style={{marginBottom:'24px'}}>
                                <div style={{fontSize:'12px',fontWeight:600,color:'#7C3AED',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'12px'}}>{CATEGORIES[cat] ?? cat}</div>
                                {items.map(item => (
                                    <div key={item.id} style={{display:'flex',padding:'14px 16px',background:'white',border:'1px solid #E5E7EB',borderRadius:'12px',marginBottom:'8px',alignItems:'center'}}>
                                        <div style={{width:'48px',height:'48px',borderRadius:'8px',overflow:'hidden',background:'#F3F4F6',display:'flex',alignItems:'center',justifyContent:'center',marginRight:'12px'}}>
                                            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <div style={{fontSize:'24px'}}>{item.emoji}</div>}
                                        </div>
                                        <div style={{flex:1}}>
                                            <div style={{fontSize:'15px',fontWeight:500,color:'#111111'}}>{item.name}</div>
                                            <div style={{fontSize:'14px',fontWeight:700,color:'#7C3AED'}}>฿{item.price}</div>
                                        </div>
                                        <div>
                                            <button 
                                                onClick={() => updateMenuAvailability(item.id, !item.available)}
                                                style={{width:'44px',height:'24px',borderRadius:'12px',background: item.available ? '#7C3AED' : '#D1D5DB',border:'none',position:'relative',transition:'background 0.2s',cursor:'pointer'}}
                                            >
                                                <div style={{width:'20px',height:'20px',borderRadius:'10px',background:'white',position:'absolute',top:'2px',left: item.available ? '22px' : '2px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}

                        <button onClick={() => setShowAddMenu(true)} style={{position:'fixed',bottom:'24px',right:'24px',width:'56px',height:'56px',borderRadius:'28px',background:'#7C3AED',color:'white',border:'none',fontSize:'28px',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(124,58,237,0.3)',zIndex:30}}>
                            +
                        </button>
                    </div>
                )}
            </div>

            {selectedTable !== null && <TableModal tableNum={selectedTable} orders={tableOrders(selectedTable)} onClose={() => setSelectedTable(null)} onPaid={() => handlePaid(selectedTable)} onDone={() => handleDone(selectedTable)} />}
            {historyOrder && <HistoryModal order={historyOrder} onClose={() => setHistoryOrder(null)} />}
            {showAddMenu && <AddMenuModal onClose={() => setShowAddMenu(false)} />}
        </div>
    );
}
