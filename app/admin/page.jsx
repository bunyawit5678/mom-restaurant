"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
    listenToActiveOrders,
    listenToOrders,
    updateOrderStatus,
    updateOrder,
    listenToMenu,
    updateMenuAvailability,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    uploadMenuImage,
    listenToOptionGroups,
    addOptionGroup,
    updateOptionGroup,
    deleteOptionGroup
} from "@/lib/firestore";
import { generatePromptPayPayload } from "@/lib/promptpay";
import { CATEGORIES } from "@/data/menu";

// Config
const PROMPTPAY_PHONE = "0637305219";
const NUM_TABLES = 8;

function StatusBadge({ status }) {
    const map = {
        pending:   { label: "รอทำ",      bg: "#FEF3C7", text: "#D97706" },
        preparing: { label: "กำลังทำ",   bg: "#FFF7ED", text: "#EA580C" },
        ready:     { label: "พร้อมแล้ว", bg: "#D1FAE5", text: "#059669" },
        paid:      { label: "จ่ายแล้ว",  bg: "#D1FAE5", text: "#059669" },
        done:      { label: "ปิดแล้ว",   bg: "#F3F4F6", text: "#6B7280" },
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

function TableModal({ tableNum, orders, onClose, onClear }) {
    const grandTotal = orders.reduce((s, o) => s + (o.total ?? 0), 0);
    const notes      = orders.map((o) => o.note).filter(Boolean);

    const [customTotal, setCustomTotal] = useState(grandTotal);

    useEffect(() => {
        setCustomTotal(grandTotal);
    }, [grandTotal]);

    async function handleStatusChange(orderId, status) {
        try { await updateOrderStatus(orderId, status); } catch(e) { console.error(e); }
    }

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
                    {/* Per-order breakdown with status buttons */}
                    {orders.map((order) => (
                        <div key={order.id} style={{marginBottom:'16px',border:'1px solid #F3F4F6',borderRadius:'12px',overflow:'hidden'}}>
                            <div style={{background:'#FAFAFA',padding:'8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                    <StatusBadge status={order.status} />
                                    {order.customerName && (
                                        <span style={{fontSize:'12px',color:'#6B7280'}}>สั่งโดย: {order.customerName}</span>
                                    )}
                                </div>
                                <div style={{display:'flex',gap:'6px'}}>
                                    {order.status === 'pending' && (
                                        <button onClick={() => handleStatusChange(order.id,'preparing')} style={{fontSize:'11px',padding:'4px 10px',background:'#FFF7ED',color:'#EA580C',border:'1px solid #FDBA74',borderRadius:'8px',fontWeight:600,cursor:'pointer'}}>กำลังทำ</button>
                                    )}
                                    {order.status === 'preparing' && (
                                        <button onClick={() => handleStatusChange(order.id,'ready')} style={{fontSize:'11px',padding:'4px 10px',background:'#D1FAE5',color:'#059669',border:'1px solid #6EE7B7',borderRadius:'8px',fontWeight:600,cursor:'pointer'}}>พร้อมแล้ว</button>
                                    )}
                                </div>
                            </div>
                            {(order.items ?? []).map((item, i) => (
                                <div key={i} style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'8px 12px',borderTop:'1px solid #F3F4F6'}}>
                                    <div style={{flex:1}}>
                                        <div style={{fontSize:'14px',fontWeight:500,color:'#111111'}}>{item.name}</div>
                                        <div style={{fontSize:'13px',color:'#6B7280'}}>{item.qty} × ฿{item.price}</div>
                                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                                            <div style={{fontSize:'12px',color:'#9CA3AF',marginTop:'2px'}}>
                                                {item.selectedOptions.map((o, j) => (
                                                    <span key={j}>{j > 0 ? ' · ' : '• '}
                                                        {o.choiceLabel || o.name}{(o.priceAdd || o.price || 0) > 0 ? ` +฿${o.priceAdd || o.price}` : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{fontSize:'14px',fontWeight:600,color:'#111111'}}>฿{item.qty * item.price}</div>
                                </div>
                            ))}
                        </div>
                    ))}
                    
                    {notes.length > 0 && (
                        <div style={{background:'#FFFBEB',padding:'12px',borderRadius:'8px',marginTop:'16px'}}>
                            <div style={{fontSize:'12px',fontWeight:600,color:'#D97706',marginBottom:'4px'}}>หมายเหตุ</div>
                            {notes.map((n, i) => <div key={i} style={{fontSize:'13px',color:'#92400E'}}>{n}</div>)}
                        </div>
                    )}
                    
                    <div style={{marginTop:'24px',marginBottom:'24px',display:'flex',flexDirection:'column',gap:'12px'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                            <span style={{fontSize:'15px',color:'#374151',fontWeight:600}}>ยอดชำระเบื้องต้น</span>
                            <span style={{fontSize:'16px',color:'#6B7280'}}>฿{grandTotal.toLocaleString()}</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                            <span style={{fontSize:'15px',color:'#111111',fontWeight:700,width:'80px'}}>ยอดสุทธิ</span>
                            <input 
                                type="number" 
                                value={customTotal === '' ? '' : customTotal} 
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        setCustomTotal('');
                                    } else {
                                        const num = parseInt(val, 10);
                                        if (num >= 0) setCustomTotal(num);
                                    }
                                }}
                                style={{flex:1, padding:'12px', fontSize:'24px', fontWeight:700, color:'#7C3AED', border:'1px solid #E5E7EB', borderRadius:'12px', textAlign:'right', outline:'none', background:'#FAFAFA'}} 
                            />
                            <span style={{fontSize:'20px',fontWeight:700,color:'#7C3AED'}}>฿</span>
                        </div>
                        <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
                            <button onClick={() => setCustomTotal(prev => (Number(prev)||0) + 10)} style={{padding:'6px 16px', background:'#F3F4F6', color:'#374151', border:'1px solid #E5E7EB', borderRadius:'20px', fontSize:'13px', fontWeight:600, cursor:'pointer'}}>+10</button>
                            <button onClick={() => setCustomTotal(prev => (Number(prev)||0) + 15)} style={{padding:'6px 16px', background:'#F3F4F6', color:'#374151', border:'1px solid #E5E7EB', borderRadius:'20px', fontSize:'13px', fontWeight:600, cursor:'pointer'}}>+15</button>
                            <button onClick={() => setCustomTotal(prev => (Number(prev)||0) + 20)} style={{padding:'6px 16px', background:'#F3F4F6', color:'#374151', border:'1px solid #E5E7EB', borderRadius:'20px', fontSize:'13px', fontWeight:600, cursor:'pointer'}}>+20</button>
                        </div>
                    </div>
                    
                    {orders.some(o => o.status === 'pending') && (
                        <div style={{display:'flex',justifyContent:'center',marginBottom:'24px'}}>
                            <PromptPayQR amount={Number(customTotal) || 0} phone={PROMPTPAY_PHONE} />
                        </div>
                    )}
                    
                    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                        <button onClick={() => onClear(Number(customTotal) || 0)} style={{width:'100%',padding:'16px',background:'#10B981',color:'white',borderRadius:'12px',border:'none',fontWeight:700,fontSize:'16px'}}>รับชำระและปิดโต๊ะ (Clear Table)</button>
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
                    <div>
                        <h2 style={{fontSize:'17px',fontWeight:700,margin:0}}>โต๊ะ {order.table} <span style={{fontSize:'13px',fontWeight:400,color:'#6B7280',marginLeft:'8px'}}>{formatTime(order.createdAt)}</span></h2>
                        {order.customerName && <p style={{fontSize:'12px',color:'#6B7280',margin:'2px 0 0'}}>สั่งโดย: {order.customerName}</p>}
                    </div>
                    <button onClick={onClose} style={{background:'none',border:'none',fontSize:'20px',color:'#6B7280'}}>✕</button>
                </div>
                <div style={{overflowY:'auto',flex:1,padding:'0 16px 24px'}}>
                    {(order.items ?? []).map((item, i) => (
                        <div key={i} style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F3F4F6'}}>
                            <div style={{flex:1}}>
                                <div style={{fontSize:'14px',fontWeight:500,color:'#111111'}}>{item.name}</div>
                                <div style={{fontSize:'13px',color:'#6B7280'}}>{item.qty} × ฿{item.price}</div>
                                {item.selectedOptions && item.selectedOptions.length > 0 && (
                                    <div style={{fontSize:'12px',color:'#9CA3AF',marginTop:'2px'}}>
                                        {item.selectedOptions.map((o, j) => (
                                            <span key={j}>{j > 0 ? ' · ' : '• '}
                                                {o.choiceLabel || o.name}{(o.priceAdd || o.price || 0) > 0 ? ` +฿${o.priceAdd || o.price}` : ''}
                                            </span>
                                        ))}
                                    </div>
                                )}
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

function OptionGroupModal({ group, onClose }) {
    const [name, setName] = useState(group ? group.name : "");
    const [options, setOptions] = useState(group && group.options && group.options.length > 0 ? group.options : [{ name: "", price: 0 }]);
    const [saving, setSaving] = useState(false);

    function handleAddOption() {
        setOptions([...options, { name: "", price: 0 }]);
    }
    function handleRemoveOption(idx) {
        setOptions(options.filter((_, i) => i !== idx));
    }
    function handleOptionChange(idx, field, value) {
        const newOpts = [...options];
        newOpts[idx][field] = value;
        setOptions(newOpts);
    }
    async function handleSave(e) {
        e.preventDefault();
        if (!name.trim()) return;
        const validOptions = options.filter(o => o.name.trim()).map(o => ({ name: o.name.trim(), price: Number(o.price) || 0 }));
        if (validOptions.length === 0) return;
        setSaving(true);
        try {
            if (group) await updateOptionGroup(group.id, { name: name.trim(), options: validOptions });
            else await addOptionGroup({ name: name.trim(), options: validOptions });
            onClose();
        } finally {
            setSaving(false);
        }
    }
    async function handleDelete() {
        if (!group) return;
        if (!window.confirm("ต้องการลบกลุ่มตัวเลือกนี้หรือไม่?")) return;
        setSaving(true);
        await deleteOptionGroup(group.id);
        onClose();
    }

    return (
        <>
            <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:40}} onClick={!saving ? onClose : undefined} />
            <div style={{position:'fixed',bottom:0,left:0,right:0,background:'white',borderRadius:'20px 20px 0 0',zIndex:50,maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
                <div style={{padding:'12px',display:'flex',justifyContent:'center'}}><div style={{width:'32px',height:'4px',background:'#E5E7EB',borderRadius:'2px',marginBottom:'4px'}} /></div>
                <div style={{padding:'0 16px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <h2 style={{fontSize:'17px',fontWeight:700,margin:0}}>{group ? "แก้ไขกลุ่มตัวเลือก" : "เพิ่มกลุ่มตัวเลือก"}</h2>
                    <button onClick={onClose} disabled={saving} style={{background:'none',border:'none',fontSize:'20px',color:'#6B7280'}}>✕</button>
                </div>
                <form onSubmit={handleSave} style={{overflowY:'auto',flex:1,padding:'0 16px 24px',display:'flex',flexDirection:'column',gap:'16px'}}>
                    <div>
                        <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'8px'}}>ชื่อกลุ่ม (เช่น เนื้อสัตว์พื้นฐาน) *</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{width:'100%',borderRadius:'12px',padding:'12px',border:'1px solid #E5E7EB',fontSize:'15px',outline:'none'}} />
                    </div>
                    <div>
                        <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'8px'}}>ตัวเลือกย่อย</label>
                        {options.map((opt, i) => (
                            <div key={i} style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
                                <input type="text" value={opt.name} onChange={e => handleOptionChange(i, 'name', e.target.value)} placeholder="ชื่อ (เช่น หมู)" style={{flex:2,borderRadius:'12px',padding:'12px',border:'1px solid #E5E7EB',fontSize:'15px',outline:'none'}} />
                                <input type="number" value={opt.price} onChange={e => handleOptionChange(i, 'price', e.target.value)} placeholder="+ราคา" style={{flex:1,borderRadius:'12px',padding:'12px',border:'1px solid #E5E7EB',fontSize:'15px',outline:'none'}} />
                                <button type="button" onClick={() => handleRemoveOption(i)} style={{width:'44px',borderRadius:'12px',border:'1px solid #EF4444',background:'#FEF2F2',color:'#EF4444',fontSize:'16px'}}>✕</button>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddOption} style={{width:'100%',padding:'10px',background:'#F3F4F6',color:'#374151',borderRadius:'12px',border:'none',fontWeight:600,fontSize:'14px',marginTop:'4px'}}>+ เพิ่มตัวเลือก</button>
                    </div>
                    <div style={{paddingTop:'8px',display:'flex',gap:'12px'}}>
                        <button type="submit" disabled={saving} style={{flex:1,padding:'14px',background:'#7C3AED',color:'white',borderRadius:'12px',border:'none',fontWeight:600,fontSize:'15px'}}>บันทึก</button>
                        {group && <button type="button" onClick={handleDelete} disabled={saving} style={{padding:'14px',background:'#FEF2F2',color:'#EF4444',borderRadius:'12px',border:'none',fontWeight:600,fontSize:'15px'}}>ลบ</button>}
                    </div>
                </form>
            </div>
        </>
    );
}

function MenuItemFormModal({ onClose, optionGroups, editItem }) {
    const isEdit = !!editItem;
    const [name,       setName]       = useState(editItem?.name ?? "");
    const [price,      setPrice]      = useState(editItem?.price ?? "");
    const [category,   setCategory]   = useState(editItem?.category ?? "rice");
    const [emoji,      setEmoji]      = useState(editItem?.emoji ?? "🍛");
    const [description, setDescription] = useState(editItem?.description ?? "");
    const [available,  setAvailable]  = useState(editItem?.available ?? true);
    const [isRecommended, setIsRecommended] = useState(editItem?.isRecommended ?? false);
    const [imageFile,  setImageFile]  = useState(null);
    const [preview,    setPreview]    = useState(editItem?.imageUrl ?? null);
    const [saving,     setSaving]     = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error,      setError]      = useState("");
    const [selectedGroupIds, setSelectedGroupIds] = useState(editItem?.optionGroupIds ?? []);
    const fileInputRef = useRef(null);

    function toggleOptionGroup(id) {
        setSelectedGroupIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }

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
            const tempId = editItem?.id ?? `temp_${Date.now()}`;
            let imageUrl = editItem?.imageUrl ?? "";

            if (imageFile) {
                setUploadingImage(true);
                try {
                    imageUrl = await uploadMenuImage(imageFile, tempId);
                } catch (imgErr) {
                    console.error(imgErr);
                    setUploadingImage(false);
                    setError("อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่");
                    setSaving(false);
                    return;
                }
                setUploadingImage(false);
            }

            const data = {
                name: name.trim(),
                price: Number(price),
                category,
                emoji,
                imageUrl,
                available,
                isRecommended,
                description: description.trim(),
                optionGroupIds: selectedGroupIds,
            };

            if (isEdit) {
                await updateMenuItem(editItem.id, data);
            } else {
                await addMenuItem({ ...data, sortOrder: Date.now() });
            }

            onClose();
        } catch (err) {
            console.error(err);
            setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!editItem) return;
        if (!window.confirm(`ต้องการลบ "${editItem.name}" หรือไม่?`)) return;
        setSaving(true);
        try {
            await deleteMenuItem(editItem.id);
            onClose();
        } catch(err) {
            console.error(err);
            setError("ลบไม่สำเร็จ");
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
                    <h2 style={{fontSize:'17px',fontWeight:700,margin:0}}>{isEdit ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h2>
                    <button onClick={onClose} disabled={saving} style={{background:'none',border:'none',fontSize:'20px',color:'#6B7280'}}>✕</button>
                </div>
                
                <form onSubmit={handleSubmit} style={{overflowY:'auto',flex:1,padding:'0 16px 24px',display:'flex',flexDirection:'column',gap:'16px'}}>
                    <div>
                        <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'8px'}}>รูปภาพ</label>
                        <button type="button" onClick={() => fileInputRef.current?.click()} style={{width:'100%',height:'140px',borderRadius:'12px',border:'2px dashed #E5E7EB',background:'#FAFAFA',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',color:'#6B7280'}}>
                            {preview ? (
                                <img src={preview} alt="preview" style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',objectFit:'cover'}} />
                            ) : (
                                <>
                                    <div style={{fontSize:'28px'}}>📷</div>
                                    <div style={{fontSize:'13px',marginTop:'6px'}}>แตะเพื่อเพิ่มรูป</div>
                                </>
                            )}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handleFileChange} />
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

                    <div>
                        <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'8px'}}>คำอธิบาย</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="คำอธิบายเมนู (ถ้ามี)" rows={2} style={{width:'100%',borderRadius:'12px',padding:'12px',border:'1px solid #E5E7EB',fontSize:'15px',outline:'none',resize:'none'}} />
                    </div>

                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <label style={{fontSize:'13px',fontWeight:600,color:'#374151'}}>สถานะ (เปิดขาย)</label>
                        <button type="button" onClick={() => setAvailable(v => !v)} style={{width:'44px',height:'24px',borderRadius:'12px',background: available ? '#7C3AED' : '#D1D5DB',border:'none',position:'relative',cursor:'pointer'}}>
                            <div style={{width:'20px',height:'20px',borderRadius:'10px',background:'white',position:'absolute',top:'2px',left: available ? '22px' : '2px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}} />
                        </button>
                    </div>

                    <label style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px',border:'1px solid',borderColor: isRecommended ? '#F97316' : '#E5E7EB',borderRadius:'12px',background: isRecommended ? '#FFF7ED' : 'white',cursor:'pointer'}}>
                        <input
                            type="checkbox"
                            checked={isRecommended}
                            onChange={e => setIsRecommended(e.target.checked)}
                            style={{width:'18px',height:'18px',accentColor:'#F97316',flexShrink:0}}
                        />
                        <div>
                            <div style={{fontSize:'14px',fontWeight:600,color: isRecommended ? '#EA580C' : '#111111'}}>⭐ เมนูแนะนำ (Bestseller)</div>
                            <div style={{fontSize:'12px',color:'#6B7280',marginTop:'2px'}}>แสดงป้าย“⭐ แนะนำ” บนการ์ดเมนูสำหรับลูกค้า</div>
                        </div>
                    </label>

                    {optionGroups && optionGroups.length > 0 && (
                        <div>
                            <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'8px'}}>กลุ่มตัวเลือก (ตัวเลือกเสริม)</label>
                            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                                {optionGroups.map((group) => (
                                    <label key={group.id} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'14px',color:'#111111'}}>
                                        <input type="checkbox" checked={selectedGroupIds.includes(group.id)} onChange={() => toggleOptionGroup(group.id)} style={{width:'18px',height:'18px',accentColor:'#7C3AED'}} />
                                        {group.name} 
                                        <span style={{fontSize:'12px',color:'#6B7280'}}>({group.options.map(o => o.name).join(', ')})</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && <div style={{fontSize:'13px',fontWeight:600,color:'#EF4444',padding:'12px',background:'#FEF2F2',borderRadius:'8px'}}>{error}</div>}

                    <div style={{paddingTop:'8px',display:'flex',gap:'10px'}}>
                        <button type="submit" disabled={saving || uploadingImage} style={{flex:1,padding:'14px',background:'#7C3AED',color:'white',borderRadius:'12px',border:'none',fontWeight:600,fontSize:'15px',opacity: (saving || uploadingImage) ? 0.7 : 1}}>
                            {uploadingImage ? 'กำลังอัปโหลดรูป...' : (saving ? 'กำลังบันทึก...' : 'บันทึกเมนู')}
                        </button>
                        {isEdit && (
                            <button type="button" onClick={handleDelete} disabled={saving} style={{padding:'14px',background:'#FEF2F2',color:'#EF4444',borderRadius:'12px',border:'1px solid #FCA5A5',fontWeight:600,fontSize:'15px',whiteSpace:'nowrap'}}>ลบเมนู</button>
                        )}
                    </div>
                </form>
            </div>
        </>
    );
}

// Keep old name as alias for backward compat
function AddMenuModal({ onClose, optionGroups }) {
    return <MenuItemFormModal onClose={onClose} optionGroups={optionGroups} editItem={null} />;
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
    const [editMenuItem,  setEditMenuItem]  = useState(null);
    const [optionGroups,  setOptionGroups]  = useState([]);
    const [showEditGroup, setShowEditGroup] = useState(null);

    useEffect(() => {
        const unsub = listenToOptionGroups((groups) => setOptionGroups(groups));
        return () => unsub();
    }, []);

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

    async function handleClearTable(tableNum, finalTotal) {
        const orders = tableOrders(tableNum);
        if (orders.length === 0) return;

        const originalTotal = tableTotal(orders);
        const diff = finalTotal - originalTotal;
        
        if (diff !== 0) {
            const latestOrder = [...orders].sort((a,b)=>(b.createdAt?.toDate?.()||new Date()) - (a.createdAt?.toDate?.()||new Date()))[0];
            await updateOrder(latestOrder.id, { total: (latestOrder.total || 0) + diff });
        }

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
                <div style={{fontWeight:700,fontSize:'17px',color:'#111111'}}>แดชบอร์ด ครัวตุ๊กตาอาหารตามสั่ง</div>
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
                <button onClick={() => setActiveTab('options')} style={{flex:1,padding:'12px',background:'none',border:'none',borderBottom: activeTab === 'options' ? '2px solid #7C3AED' : '2px solid transparent',color: activeTab === 'options' ? '#7C3AED' : '#6B7280',fontWeight: activeTab === 'options' ? 600 : 500,fontSize:'15px'}}>กลุ่มตัวเลือก</button>
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
                                        <div style={{width:'48px',height:'48px',borderRadius:'8px',overflow:'hidden',background:'#F3F4F6',display:'flex',alignItems:'center',justifyContent:'center',marginRight:'12px',flexShrink:0}}>
                                            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <div style={{fontSize:'24px'}}>{item.emoji}</div>}
                                        </div>
                                        <div style={{flex:1,minWidth:0}}>
                                            <div style={{fontSize:'15px',fontWeight:500,color:'#111111',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:'6px'}}>
                                                {item.name}
                                                {item.isRecommended && (
                                                    <span style={{fontSize:'10px',fontWeight:700,color:'white',background:'linear-gradient(135deg,#F97316,#EF4444)',padding:'1px 6px',borderRadius:'10px',flexShrink:0}}>⭐ แนะนำ</span>
                                                )}
                                            </div>
                                            <div style={{fontSize:'14px',fontWeight:700,color:'#7C3AED'}}>฿{item.price}</div>
                                        </div>
                                        <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
                                            <button
                                                onClick={() => setEditMenuItem(item)}
                                                style={{padding:'6px 12px',fontSize:'12px',fontWeight:600,background:'#F3F4F6',color:'#374151',border:'1px solid #E5E7EB',borderRadius:'8px',cursor:'pointer'}}
                                            >✏️ แก้ไข</button>
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

                {activeTab === 'options' && (
                    <div>
                        {optionGroups.length === 0 ? <div style={{textAlign:'center',padding:'32px',color:'#6B7280'}}>ไม่มีกลุ่มตัวเลือก</div> : (
                            optionGroups.map(group => (
                                <button key={group.id} onClick={() => setShowEditGroup(group)} style={{width:'100%',textAlign:'left',background:'white',border:'1px solid #E5E7EB',borderRadius:'12px',padding:'16px',marginBottom:'8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                    <div>
                                        <div style={{fontSize:'15px',fontWeight:600,color:'#111111',marginBottom:'4px'}}>{group.name}</div>
                                        <div style={{fontSize:'13px',color:'#6B7280'}}>{group.options.map(o => `${o.name} (+฿${o.price})`).join(", ")}</div>
                                    </div>
                                    <div style={{color:'#7C3AED',fontSize:'18px'}}>›</div>
                                </button>
                            ))
                        )}
                        <button onClick={() => setShowEditGroup("new")} style={{position:'fixed',bottom:'24px',right:'24px',width:'56px',height:'56px',borderRadius:'28px',background:'#7C3AED',color:'white',border:'none',fontSize:'28px',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(124,58,237,0.3)',zIndex:30}}>
                            +
                        </button>
                    </div>
                )}
            </div>

            {selectedTable !== null && <TableModal tableNum={selectedTable} orders={tableOrders(selectedTable)} onClose={() => setSelectedTable(null)} onClear={(total) => handleClearTable(selectedTable, total)} />}
            {historyOrder && <HistoryModal order={historyOrder} onClose={() => setHistoryOrder(null)} />}
            {showAddMenu && <AddMenuModal optionGroups={optionGroups} onClose={() => setShowAddMenu(false)} />}
            {editMenuItem && <MenuItemFormModal optionGroups={optionGroups} editItem={editMenuItem} onClose={() => setEditMenuItem(null)} />}
            {showEditGroup && <OptionGroupModal group={showEditGroup === "new" ? null : showEditGroup} onClose={() => setShowEditGroup(null)} />}
        </div>
    );
}
