"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  listenToMenu,
  addOrder,
  listenToOptionGroups,
  listenToOrdersByIds,
} from "@/lib/firestore";
import { CATEGORIES } from "@/data/menu";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_KEY = "sessionOrderIds";
const NAME_KEY = "customerName";

function getSessionOrderIds() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "[]");
  } catch {
    return [];
  }
}

function pushSessionOrderId(id) {
  const ids = getSessionOrderIds();
  if (!ids.includes(id)) ids.push(id);
  localStorage.setItem(SESSION_KEY, JSON.stringify(ids));
}

// ─────────────────────────────────────────────────────────────────────────────
// NameScreen — Feature 1
// ─────────────────────────────────────────────────────────────────────────────

function NameScreen({ table, onDone }) {
  const [name, setName] = useState("");
  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    localStorage.setItem(NAME_KEY, name.trim());
    onDone(name.trim());
  }
  return (
    <div style={{position:'fixed',inset:0,background:'white',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <div style={{width:'100%',maxWidth:'360px',textAlign:'center'}}>
        <div style={{fontSize:'64px',marginBottom:'16px'}}>🍜</div>
        <h1 style={{fontSize:'26px',fontWeight:800,color:'#111111',marginBottom:'6px'}}>ร้านแม่</h1>
        <p style={{fontSize:'14px',color:'#7C3AED',fontWeight:600,marginBottom:'32px'}}>โต๊ะ {table}</p>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          <input
            autoFocus
            type="text"
            placeholder="ชื่อของคุณ"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{border:'1px solid #E5E7EB',borderRadius:'10px',padding:'12px 16px',fontSize:'16px',width:'100%',outline:'none',boxSizing:'border-box',textAlign:'center'}}
          />
          <button
            type="submit"
            disabled={!name.trim()}
            style={{width:'100%',background:'#7C3AED',color:'white',borderRadius:'12px',padding:'14px',fontWeight:700,fontSize:'16px',border:'none',opacity: name.trim() ? 1 : 0.5,transition:'opacity 0.2s'}}
          >
            เริ่มสั่งอาหาร →
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status colors
// ─────────────────────────────────────────────────────────────────────────────

function statusInfo(status) {
  switch (status) {
    case "preparing": return { label: "กำลังทำ", color: "#F59E0B", pulse: true };
    case "ready":     return { label: "พร้อมแล้ว", color: "#10B981", pulse: false };
    default:          return { label: "รอทำ", color: "#9CA3AF", pulse: false };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OrderStatusSheet — Feature 5
// ─────────────────────────────────────────────────────────────────────────────

function OrderStatusSheet({ table, customerName, onClose }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const ids = getSessionOrderIds();
    const unsub = listenToOrdersByIds(ids, setOrders);
    return unsub;
  }, []);

  const allItems = orders.flatMap((o) =>
    (o.items ?? []).map((item) => ({ ...item, orderStatus: o.status, orderId: o.id }))
  );

  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:70}} onClick={onClose} />
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'white',borderRadius:'20px 20px 0 0',zIndex:80,maxHeight:'80vh',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'12px',display:'flex',justifyContent:'center'}}>
          <div style={{width:'32px',height:'4px',background:'#E5E7EB',borderRadius:'2px'}} />
        </div>
        <div style={{padding:'0 16px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <h2 style={{fontSize:'17px',fontWeight:700,margin:0}}>รายการของคุณ</h2>
            <p style={{fontSize:'13px',color:'#6B7280',margin:'2px 0 0'}}>โต๊ะ {table} · {customerName}</p>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:'20px',color:'#6B7280'}}>✕</button>
        </div>
        <div style={{overflowY:'auto',flex:1,padding:'0 16px 24px'}}>
          {allItems.length === 0 ? (
            <div style={{textAlign:'center',padding:'32px',color:'#6B7280',fontSize:'14px'}}>ยังไม่มีรายการ</div>
          ) : (
            allItems.map((item, i) => {
              const { label, color, pulse } = statusInfo(item.orderStatus);
              return (
                <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #F3F4F6'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'14px',fontWeight:500,color:'#111111'}}>{item.name} × {item.qty}</div>
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <div style={{fontSize:'12px',color:'#6B7280',marginTop:'2px'}}>
                        {item.selectedOptions.map((o, j) => (
                          <span key={j}>{j > 0 ? ' · ' : ''}{o.choiceLabel}{o.priceAdd > 0 ? ` +฿${o.priceAdd}` : ''}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <div style={{
                      width:'8px',height:'8px',borderRadius:'4px',background:color,
                      animation: pulse ? 'pulse 1.5s infinite' : 'none'
                    }} />
                    <span style={{fontSize:'13px',color,fontWeight:600}}>{label}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SuccessModal
// ─────────────────────────────────────────────────────────────────────────────

function SuccessModal({ onClose }) {
  return (
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)',padding:'16px'}}>
      <div style={{background:'white',borderRadius:'24px',padding:'32px',width:'100%',maxWidth:'320px',textAlign:'center'}}>
        <div style={{fontSize:'64px',marginBottom:'16px'}}>✅</div>
        <h2 style={{fontSize:'20px',fontWeight:700,marginBottom:'8px'}}>ส่งออเดอร์ให้แม่ครัวแล้ว!</h2>
        <p style={{fontSize:'14px',color:'#6B7280',marginBottom:'24px'}}>กรุณารอรับอาหาร ทางร้านกำลังเตรียมให้นะคะ</p>
        <button onClick={onClose} style={{width:'100%',padding:'14px',background:'#F3F4F6',color:'#374151',fontWeight:600,borderRadius:'12px',border:'none'}}>
          กลับไปหน้าเมนู
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MenuItemCard
// ─────────────────────────────────────────────────────────────────────────────

function MenuItemCard({ item, qty, onAdd, onRemove }) {
  const isAvailable = item.available !== false;
  const hasOptions = (item.options && item.options.length > 0) || 
                     (item.optionGroupIds && item.optionGroupIds.length > 0);
  return (
    <div
      onClick={() => isAvailable && hasOptions && onAdd(item)}
      style={{display:'flex',padding:'14px 16px',borderBottom:'1px solid #F3F4F6',opacity: isAvailable ? 1 : 0.45,cursor: isAvailable && hasOptions ? 'pointer' : 'default'}}
    >
      <div style={{flex:1,marginRight:'12px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px',flexWrap:'wrap'}}>
          <span style={{fontSize:'15px',fontWeight:500,color:'#111111'}}>{item.name} {!isAvailable && '(หมด)'}</span>
          {item.isRecommended && (
            <span style={{
              fontSize:'10px',fontWeight:700,color:'white',
              background:'linear-gradient(135deg,#F97316,#EF4444)',
              padding:'2px 7px',borderRadius:'20px',
              letterSpacing:'0.3px',whiteSpace:'nowrap',flexShrink:0
            }}>⭐ แนะนำ</span>
          )}
        </div>
        {item.description && <div style={{fontSize:'13px',color:'#6B7280',marginBottom:'6px'}}>{item.description}</div>}
        <div style={{fontSize:'15px',fontWeight:700,color:'#7C3AED'}}>฿{item.price}</div>
      </div>
      <div style={{position:'relative', flexShrink:0}}>
        {item.imageUrl && item.imageUrl.trim() !== "" ? (
          <img src={item.imageUrl} alt={item.name} style={{width:'56px', height:'56px', objectFit:'cover', borderRadius:'12px'}} />
        ) : (
          <div style={{width:'56px',height:'56px',borderRadius:'12px',background:'#F3F4F6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px'}}>
            {item.emoji}
          </div>
        )}

        {/* Bestseller badge — top-left corner of thumbnail */}
        {item.isRecommended && (
          <div style={{
            position:'absolute',top:'-4px',left:'-4px',
            background:'linear-gradient(135deg,#F97316,#EF4444)',
            color:'white',fontSize:'9px',fontWeight:800,
            padding:'2px 5px',borderRadius:'6px',
            boxShadow:'0 1px 4px rgba(239,68,68,0.4)',
            lineHeight:'1.4',whiteSpace:'nowrap'
          }}>⭐</div>
        )}
        
        {qty > 0 && (
          <div style={{position:'absolute',top:'-6px',right:'-6px',background:'#7C3AED',color:'white',width:'20px',height:'20px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700}}>
            {qty}
          </div>
        )}

        {isAvailable && !hasOptions && (
          <button 
            onClick={(e) => { e.stopPropagation(); onAdd(item); }}
            style={{position:'absolute',bottom:'-6px',right:'-6px',width:'24px',height:'24px',borderRadius:'12px',background:'#7C3AED',color:'white',border:'none',fontSize:'16px',display:'flex',alignItems:'center',justifyContent:'center',paddingBottom:'2px',boxShadow:'0 2px 4px rgba(0,0,0,0.1)'}}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ItemOptionsModal — Feature 2 (supports inline options + optionGroupIds)
// ─────────────────────────────────────────────────────────────────────────────

function ItemOptionsModal({ item, allGroups, onClose, onConfirm }) {
  // Build unified option groups array
  // Priority: item.options (new inline schema) then fallback to optionGroupIds
  const inlineOptions = item.options && item.options.length > 0 ? item.options : null;
  const legacyGroups = !inlineOptions
    ? allGroups.filter((g) => item.optionGroupIds?.includes(g.id))
    : [];

  // selections: for inline options: { [optId]: Set<choiceId> | choiceId }
  // for legacy groups: { [groupId]: index }
  const [inlineSelections, setInlineSelections] = useState(() => {
    if (!inlineOptions) return {};
    const init = {};
    inlineOptions.forEach((opt) => {
      init[opt.id] = opt.type === "checkbox" ? new Set() : null;
    });
    return init;
  });
  const [legacySelections, setLegacySelections] = useState(() => {
    const init = {};
    legacyGroups.forEach((g) => (init[g.id] = 0));
    return init;
  });
  const [qty, setQty] = useState(1);

  // Compute added price
  let addedPrice = 0;
  if (inlineOptions) {
    inlineOptions.forEach((opt) => {
      if (opt.type === "radio") {
        const sel = inlineSelections[opt.id];
        if (sel) {
          const choice = opt.choices.find((c) => c.id === sel);
          if (choice) addedPrice += choice.priceAdd || 0;
        }
      } else if (opt.type === "checkbox") {
        const selSet = inlineSelections[opt.id];
        opt.choices.forEach((c) => {
          if (selSet && selSet.has(c.id)) addedPrice += c.priceAdd || 0;
        });
      }
    });
  } else {
    legacyGroups.forEach((g) => {
      addedPrice += g.options[legacySelections[g.id]]?.price || 0;
    });
  }

  const unitPrice = item.price + addedPrice;
  const totalPrice = unitPrice * qty;

  // Required validation
  const isValid = inlineOptions
    ? inlineOptions.filter((o) => o.required && o.type === "radio").every((o) => inlineSelections[o.id] !== null)
    : true;

  function handleSubmit() {
    let selectedOptions = [];
    if (inlineOptions) {
      inlineOptions.forEach((opt) => {
        if (opt.type === "radio") {
          const sel = inlineSelections[opt.id];
          if (sel) {
            const choice = opt.choices.find((c) => c.id === sel);
            if (choice) selectedOptions.push({ optionLabel: opt.label, choiceLabel: choice.label, priceAdd: choice.priceAdd || 0 });
          }
        } else if (opt.type === "checkbox") {
          const selSet = inlineSelections[opt.id];
          opt.choices.forEach((c) => {
            if (selSet && selSet.has(c.id)) {
              selectedOptions.push({ optionLabel: opt.label, choiceLabel: c.label, priceAdd: c.priceAdd || 0 });
            }
          });
        }
      });
    } else {
      selectedOptions = legacyGroups.map((g) => g.options[legacySelections[g.id]]);
    }
    onConfirm(item, selectedOptions, addedPrice, qty);
  }

  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:60}} onClick={onClose} />
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'white',borderRadius:'20px 20px 0 0',zIndex:70,maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
        {/* Handle */}
        <div style={{padding:'12px',display:'flex',justifyContent:'center'}}>
          <div style={{width:'32px',height:'4px',background:'#E5E7EB',borderRadius:'2px'}} />
        </div>

        {/* Image / emoji hero */}
        {item.imageUrl && item.imageUrl.trim() !== "" ? (
          <img src={item.imageUrl} alt={item.name} style={{width:'100%',height:'200px',objectFit:'cover'}} />
        ) : (
          <div style={{width:'100%',height:'120px',background:'#F3F4F6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'64px'}}>
            {item.emoji}
          </div>
        )}

        {/* Header */}
        <div style={{padding:'16px 16px 0',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
          <div>
            <h2 style={{fontSize:'20px',fontWeight:700,margin:'0 0 4px'}}>{item.name}</h2>
            {item.description && <p style={{fontSize:'13px',color:'#6B7280',margin:'0 0 4px'}}>{item.description}</p>}
            <p style={{fontSize:'15px',fontWeight:700,color:'#7C3AED',margin:0}}>฿{item.price}</p>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:'20px',color:'#6B7280',flexShrink:0}}>✕</button>
        </div>

        {/* Scrollable options */}
        <div style={{overflowY:'auto',flex:1,padding:'16px',display:'flex',flexDirection:'column',gap:'20px'}}>
          {/* Inline options (new schema) */}
          {inlineOptions && inlineOptions.map((opt) => (
            <div key={opt.id}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
                <span style={{fontSize:'14px',fontWeight:700,color:'#374151'}}>{opt.label}</span>
                {opt.required && (
                  <span style={{fontSize:'11px',color:'white',background:'#EF4444',padding:'2px 8px',borderRadius:'10px',fontWeight:600}}>ต้องการ</span>
                )}
              </div>
              {opt.choices.map((choice) => {
                const isSelected = opt.type === "radio"
                  ? inlineSelections[opt.id] === choice.id
                  : inlineSelections[opt.id]?.has(choice.id);
                return (
                  <label key={choice.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px',border:'1px solid',borderColor: isSelected ? '#7C3AED' : '#E5E7EB',borderRadius:'12px',marginBottom:'8px',background: isSelected ? '#EDE9FE' : 'white',cursor:'pointer'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <input
                        type={opt.type === "radio" ? "radio" : "checkbox"}
                        name={opt.id}
                        checked={!!isSelected}
                        onChange={() => {
                          if (opt.type === "radio") {
                            setInlineSelections((p) => ({ ...p, [opt.id]: choice.id }));
                          } else {
                            setInlineSelections((p) => {
                              const prev = new Set(p[opt.id]);
                              prev.has(choice.id) ? prev.delete(choice.id) : prev.add(choice.id);
                              return { ...p, [opt.id]: prev };
                            });
                          }
                        }}
                        style={{width:'18px',height:'18px',accentColor:'#7C3AED'}}
                      />
                      <span style={{fontSize:'15px',fontWeight:500,color: isSelected ? '#7C3AED' : '#111111'}}>{choice.label}</span>
                    </div>
                    {(choice.priceAdd || 0) > 0 && (
                      <span style={{fontSize:'13px',color:'#6B7280'}}>+฿{choice.priceAdd}</span>
                    )}
                  </label>
                );
              })}
            </div>
          ))}

          {/* Legacy option groups */}
          {legacyGroups.map((group) => (
            <div key={group.id}>
              <div style={{fontSize:'14px',fontWeight:700,color:'#374151',marginBottom:'12px'}}>
                {group.name} <span style={{fontSize:'12px',color:'#EF4444',fontWeight:500}}>(เลือก 1 อย่าง)</span>
              </div>
              {group.options.map((opt, idx) => (
                <label key={idx} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px',border:'1px solid',borderColor: legacySelections[group.id]===idx ? '#7C3AED' : '#E5E7EB',borderRadius:'12px',marginBottom:'8px',background: legacySelections[group.id]===idx ? '#EDE9FE' : 'white',cursor:'pointer'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <input type="radio" name={group.id} checked={legacySelections[group.id]===idx} onChange={() => setLegacySelections({...legacySelections, [group.id]: idx})} style={{width:'18px',height:'18px',accentColor:'#7C3AED'}} />
                    <span style={{fontSize:'15px',fontWeight:500,color: legacySelections[group.id]===idx ? '#7C3AED' : '#111111'}}>{opt.name}</span>
                  </div>
                  {opt.price > 0 && <span style={{fontSize:'14px',color:'#6B7280'}}>+฿{opt.price}</span>}
                </label>
              ))}
            </div>
          ))}

          {/* Qty stepper */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'20px',padding:'8px 0'}}>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{width:'36px',height:'36px',borderRadius:'18px',background:'#F3F4F6',border:'none',fontSize:'20px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
            <span style={{fontSize:'18px',fontWeight:700,minWidth:'24px',textAlign:'center'}}>{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} style={{width:'36px',height:'36px',borderRadius:'18px',background:'#7C3AED',color:'white',border:'none',fontSize:'20px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
          </div>

          {/* Add to cart button */}
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            style={{width:'100%',padding:'16px',background:'#7C3AED',color:'white',borderRadius:'12px',border:'none',fontWeight:700,fontSize:'16px',opacity: isValid ? 1 : 0.5,boxShadow:'0 4px 12px rgba(124,58,237,0.3)'}}
          >
            เพิ่มลงตะกร้า ฿{totalPrice}
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CartDrawer
// ─────────────────────────────────────────────────────────────────────────────

function CartDrawer({ cartItems, totalPrice, note, setNote, onClose, onSubmit, submitting }) {
  return (
    <>
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',zIndex:40}} onClick={onClose} />
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'white',borderRadius:'20px 20px 0 0',zIndex:50,maxHeight:'85vh',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'12px',display:'flex',justifyContent:'center'}}>
          <div style={{width:'32px',height:'4px',background:'#E5E7EB',borderRadius:'2px',marginBottom:'4px'}} />
        </div>
        <div style={{padding:'0 16px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h2 style={{fontSize:'17px',fontWeight:700,margin:0}}>รายการที่สั่ง</h2>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:'20px',color:'#6B7280'}}>✕</button>
        </div>
        <div style={{overflowY:'auto',flex:1,padding:'0 16px',paddingBottom:'24px',display:'flex',flexDirection:'column',gap:'16px'}}>
          {cartItems.map((item, i) => (
            <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:'15px',fontWeight:500,color:'#111111'}}>{item.name}</div>
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                  <div style={{fontSize:'12px',color:'#6B7280',marginTop:'2px'}}>
                    {item.selectedOptions.map((o, j) => (
                      <span key={j}>{j > 0 ? ' · ' : ''}
                        {o.choiceLabel || o.name}{(o.priceAdd || o.price || 0) > 0 ? ` +฿${o.priceAdd || o.price}` : ''}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{fontSize:'14px',fontWeight:700,color:'#7C3AED'}}>฿{item.price * item.qty}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'12px',background:'#F3F4F6',padding:'4px',borderRadius:'20px'}}>
                <button onClick={() => item.onRemove()} style={{width:'28px',height:'28px',borderRadius:'14px',background:'white',border:'none',fontWeight:600}}>−</button>
                <div style={{fontSize:'14px',fontWeight:600}}>{item.qty}</div>
                <button onClick={() => item.onAdd()} style={{width:'28px',height:'28px',borderRadius:'14px',background:'white',border:'none',fontWeight:600}}>+</button>
              </div>
            </div>
          ))}
          
          <div style={{marginTop:'8px'}}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="หมายเหตุ (ถ้ามี)"
              style={{width:'100%',padding:'12px',border:'1px solid #E5E7EB',borderRadius:'10px',fontSize:'14px',resize:'none',outline:'none'}}
              rows={2}
            />
          </div>
          
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'1px solid #F3F4F6',paddingTop:'16px'}}>
            <span style={{fontSize:'15px',color:'#374151'}}>รวมทั้งหมด</span>
            <span style={{fontSize:'18px',fontWeight:700,color:'#7C3AED'}}>฿{totalPrice}</span>
          </div>
          
          <button 
            onClick={onSubmit}
            disabled={submitting}
            style={{width:'100%',padding:'16px',background:'#7C3AED',color:'white',borderRadius:'12px',border:'none',fontWeight:600,fontSize:'16px',opacity:submitting ? 0.7 : 1}}
          >
            {submitting ? 'กำลังส่ง...' : 'ยืนยันสั่งอาหาร'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MenuPageInner — main component
// ─────────────────────────────────────────────────────────────────────────────

function MenuPageInner() {
  const searchParams = useSearchParams();
  const table = searchParams.get("table") ?? "?";

  // ── Feature 1: Customer Name ─────────────────────────────────────────────
  const [customerName, setCustomerName] = useState(null); // null = not yet checked

  useEffect(() => {
    const saved = localStorage.getItem(NAME_KEY);
    setCustomerName(saved || "");
  }, []);

  // ── State ────────────────────────────────────────────────────────────────
  const [menuItems, setMenuItems]         = useState([]);
  const [optionGroups, setOptionGroups]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeCategory, setCategory]     = useState("all");
  const [cart, setCart]                   = useState({});
  const [note, setNote]                   = useState("");
  const [submitting, setSubmitting]       = useState(false);
  const [showSuccess, setShowSuccess]     = useState(false);
  const [showCart, setShowCart]           = useState(false);
  const [selectedItem, setSelectedItem]   = useState(null);

  // ── Feature 3: Search ───────────────────────────────────────────────────
  const [searchOpen, setSearchOpen]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const searchInputRef                    = useRef(null);

  // ── Feature 5: Order Status ─────────────────────────────────────────────
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [sessionOrderCount, setSessionOrderCount] = useState(() => getSessionOrderIds().length);

  // ── Firestore listeners ──────────────────────────────────────────────────
  useEffect(() => {
    const unsubMenu = listenToMenu((items) => {
      setMenuItems(items);
      setLoading(false);
    });
    const unsubOpts = listenToOptionGroups((groups) => {
      setOptionGroups(groups);
    });
    return () => { unsubMenu(); unsubOpts(); };
  }, []);

  // ── Derived cart values ──────────────────────────────────────────────────
  const cartValues = Object.values(cart);
  const totalItems = cartValues.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cartValues.reduce((s, i) => s + i.price * i.qty, 0);
  const hasCart = totalItems > 0;

  useEffect(() => {
    if (!hasCart && showCart) setShowCart(false);
  }, [hasCart, showCart]);

  // ── Feature 3: search open effect ───────────────────────────────────────
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    if (!searchOpen) setSearchQuery("");
  }, [searchOpen]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleItemClick = (item) => {
    const hasOptions = (item.options && item.options.length > 0) ||
                       (item.optionGroupIds && item.optionGroupIds.length > 0);
    if (hasOptions) {
      setSelectedItem(item);
    } else {
      addToCart(item, [], 0, 1);
    }
  };

  const addToCart = (baseItem, selectedOptions = [], addedPrice = 0, qty = 1) => {
    // Build a stable cart key from name + options
    const optionsKey = selectedOptions
      .map((o) => o.choiceLabel || o.name || "")
      .join("|");
    const cartItemId = optionsKey ? `${baseItem.id}_${optionsKey}` : baseItem.id;
    const nameWithOpts = selectedOptions.length > 0
      ? `${baseItem.name} (${selectedOptions.map((o) => o.choiceLabel || o.name).join(", ")})`
      : baseItem.name;

    setCart((prev) => ({
      ...prev,
      [cartItemId]: prev[cartItemId]
        ? { ...prev[cartItemId], qty: prev[cartItemId].qty + qty }
        : {
            baseId: baseItem.id,
            id: cartItemId,
            name: nameWithOpts,
            price: baseItem.price + addedPrice,
            emoji: baseItem.emoji,
            imageUrl: baseItem.imageUrl,
            qty,
            category: baseItem.category,
            selectedOptions,
          },
    }));
    setSelectedItem(null);
  };

  const handleAddCartItem = (cartItemId) =>
    setCart((prev) => ({ ...prev, [cartItemId]: { ...prev[cartItemId], qty: prev[cartItemId].qty + 1 } }));

  const removeFromCart = (cartItemId) => {
    setCart((prev) => {
      const current = prev[cartItemId];
      if (!current || current.qty <= 1) {
        const next = { ...prev };
        delete next[cartItemId];
        return next;
      }
      return { ...prev, [cartItemId]: { ...current, qty: current.qty - 1 } };
    });
  };

  const handleSubmit = async () => {
    if (!hasCart || submitting) return;
    setSubmitting(true);
    try {
      const freshItems = Object.values(cart).map(({ id, name, price, emoji, qty, selectedOptions }) => ({
        id, name, price, emoji, qty,
        selectedOptions: selectedOptions || [],
      }));
      const freshTotal = freshItems.reduce((s, i) => s + i.price * i.qty, 0);
      const orderId = await addOrder({
        table: Number(table),
        customerName: customerName || "",
        items: freshItems,
        total: freshTotal,
        note,
      });
      // Feature 5: save order ID to session
      pushSessionOrderId(orderId);
      setSessionOrderCount(getSessionOrderIds().length);
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

  // ── Feature 3: Filtered menu ─────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const q = searchQuery.toLowerCase();
    return menuItems.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    );
  }, [menuItems, searchQuery]);

  // ── Category grouping ────────────────────────────────────────────────────
  const categoriesToRender = useMemo(() => {
    const itemsToGroup = searchQuery.trim() ? filteredItems : menuItems;

    if (activeCategory !== "all") {
      return [{
        id: activeCategory,
        label: CATEGORIES[activeCategory] || activeCategory,
        items: itemsToGroup.filter((i) => i.category === activeCategory),
      }];
    }

    const grouped = {};
    Object.keys(CATEGORIES).forEach((k) => (grouped[k] = []));
    itemsToGroup.forEach((item) => {
      if (grouped[item.category]) {
        grouped[item.category].push(item);
      } else {
        if (!grouped["other"]) grouped["other"] = [];
        grouped["other"].push(item);
      }
    });

    return Object.keys(grouped)
      .filter((k) => grouped[k].length > 0)
      .map((k) => ({ id: k, label: CATEGORIES[k] || "อื่นๆ", items: grouped[k] }));
  }, [menuItems, filteredItems, activeCategory, searchQuery]);

  // ── Wait until localStorage is read ─────────────────────────────────────
  if (customerName === null) return null;

  // ── Feature 1: Show name screen ──────────────────────────────────────────
  if (customerName === "") {
    return <NameScreen table={table} onDone={setCustomerName} />;
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:'100vh',paddingBottom: hasCart ? '80px' : '0',position:'relative'}}>
      {/* ── STICKY HEADER + SEARCH + CATEGORY BAR ── */}
      <div style={{position:'sticky',top:0,zIndex:30}}>
        {/* HEADER */}
        <div style={{background:'white',borderBottom:'1px solid #E5E7EB',height:'56px',padding:'0 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontWeight:700,fontSize:'17px',color:'#111111'}}>
            ครัวตุ๊กตาอาหารตามสั่ง{' '}
            <span style={{fontSize:'13px',color:'#6B7280',fontWeight:400,marginLeft:'4px'}}>โต๊ะ {table}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            {/* Feature 1: customer name */}
            <span style={{fontSize:'13px',color:'#9CA3AF',fontWeight:400,maxWidth:'80px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{customerName}</span>
            {/* Feature 3: search icon */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              style={{background:'none',border:'none',fontSize:'20px',color: searchOpen ? '#7C3AED' : '#6B7280',padding:0}}
              aria-label="ค้นหาเมนู"
            >
              🔍
            </button>
            {/* Cart icon */}
            <button onClick={() => hasCart && setShowCart(true)} style={{position:'relative',background:'none',border:'none',fontSize:'24px',color:'#7C3AED',padding:0}}>
              🛒
              {hasCart && (
                <div style={{position:'absolute',top:'-4px',right:'-6px',background:'#7C3AED',color:'white',width:'18px',height:'18px',borderRadius:'9px',fontSize:'10px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {totalItems}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Feature 3: SEARCH BAR (animated expand) */}
        <div style={{
          background:'white',
          overflow:'hidden',
          height: searchOpen ? '48px' : '0',
          transition:'height 0.25s ease',
          borderBottom: searchOpen ? '1px solid #E5E7EB' : 'none',
        }}>
          <div style={{display:'flex',alignItems:'center',padding:'0 16px',height:'48px',gap:'8px'}}>
            <span style={{fontSize:'16px',color:'#9CA3AF'}}>🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเมนู..."
              style={{flex:1,border:'none',outline:'none',fontSize:'15px',color:'#111111',background:'transparent'}}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{background:'none',border:'none',fontSize:'18px',color:'#9CA3AF'}}>✕</button>
            )}
          </div>
        </div>

        {/* CATEGORY BAR — hide when search active */}
        {!searchOpen && (
          <div style={{background:'white',borderBottom:'1px solid #E5E7EB',height:'48px',display:'flex',alignItems:'center',padding:'0 16px',gap:'8px',overflowX:'auto',scrollbarWidth:'none'}}>
            <button
              onClick={() => setCategory("all")}
              style={{padding:'6px 16px',borderRadius:'20px',fontSize:'13px',fontWeight:500,border:'none',whiteSpace:'nowrap',
                background: activeCategory === "all" ? "#7C3AED" : "#F3F4F6",
                color: activeCategory === "all" ? "white" : "#374151",
              }}
            >ทั้งหมด</button>
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                style={{padding:'6px 16px',borderRadius:'20px',fontSize:'13px',fontWeight:500,border:'none',whiteSpace:'nowrap',
                  background: activeCategory === key ? "#7C3AED" : "#F3F4F6",
                  color: activeCategory === key ? "white" : "#374151",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── MENU LIST ── */}
      <div style={{background:'white'}}>
        {loading ? (
          <div style={{padding:'24px 16px'}}>
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} style={{display:'flex',marginBottom:'16px'}}>
                <div style={{flex:1,marginRight:'12px'}}>
                  <div style={{height:'18px',background:'#F3F4F6',borderRadius:'4px',width:'60%',marginBottom:'8px',animation:'pulse 2s infinite'}} />
                  <div style={{height:'14px',background:'#F3F4F6',borderRadius:'4px',width:'40%',animation:'pulse 2s infinite'}} />
                </div>
                <div style={{width:'56px',height:'56px',background:'#F3F4F6',borderRadius:'12px',animation:'pulse 2s infinite'}} />
              </div>
            ))}
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
          </div>
        ) : searchQuery.trim() && filteredItems.length === 0 ? (
          <div style={{textAlign:'center',padding:'48px 24px',color:'#6B7280',fontSize:'15px'}}>
            <div style={{fontSize:'40px',marginBottom:'12px'}}>🔍</div>
            ไม่พบเมนูที่ค้นหา
          </div>
        ) : (
          categoriesToRender.map((cat) => (
            <div key={cat.id}>
              {(activeCategory === "all" || searchQuery.trim()) && cat.items.length > 0 && (
                <div style={{background:'#FAFAFA',padding:'12px 16px 6px',fontSize:'12px',fontWeight:600,color:'#7C3AED',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                  {cat.label}
                </div>
              )}
              {cat.items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  qty={cartValues.filter((c) => c.baseId === item.id).reduce((s, c) => s + c.qty, 0)}
                  onAdd={handleItemClick}
                  onRemove={() => {}}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* ── FLOATING ZONE ── */}

      {/* Feature 5: Order status pill — sits above the cart bar */}
      {sessionOrderCount > 0 && !showCart && (
        <div style={{
          position:'fixed',
          bottom: hasCart ? '84px' : '16px',
          left:'50%',transform:'translateX(-50%)',
          zIndex:29,
          transition:'bottom 0.2s ease'
        }}>
          <button
            onClick={() => setShowStatusSheet(true)}
            style={{background:'white',color:'#374151',padding:'9px 18px',borderRadius:'24px',border:'1px solid #E5E7EB',display:'flex',alignItems:'center',gap:'8px',boxShadow:'0 2px 12px rgba(0,0,0,0.14)',fontWeight:600,fontSize:'13px',whiteSpace:'nowrap'}}
          >
            📋 ดูรายการที่สั่ง ({sessionOrderCount} รายการ)
          </button>
        </div>
      )}

      {/* ── STICKY FLOATING CART BAR — always visible when cart has items ── */}
      {hasCart && !showCart && (
        <div style={{
          position:'fixed',
          bottom:0,left:0,right:0,
          zIndex:30,
          padding:'10px 16px',
          paddingBottom:'calc(10px + env(safe-area-inset-bottom, 0px))',
          background:'rgba(255,255,255,0.85)',
          backdropFilter:'blur(12px)',
          borderTop:'1px solid rgba(229,231,235,0.6)',
          boxShadow:'0 -4px 24px rgba(0,0,0,0.08)',
        }}>
          <button
            onClick={() => setShowCart(true)}
            style={{
              width:'100%',
              background:'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              color:'white',
              padding:'14px 20px',
              borderRadius:'16px',
              border:'none',
              display:'flex',
              alignItems:'center',
              justifyContent:'space-between',
              boxShadow:'0 4px 16px rgba(124,58,237,0.35)',
              cursor:'pointer',
            }}
          >
            {/* Left: badge + label */}
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={{
                background:'rgba(255,255,255,0.25)',
                width:'28px',height:'28px',borderRadius:'14px',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:'13px',fontWeight:800,
                boxShadow:'inset 0 0 0 1.5px rgba(255,255,255,0.3)'
              }}>{totalItems}</div>
              <span style={{fontSize:'15px',fontWeight:700,letterSpacing:'0.1px'}}>ดูตะกร้าสินค้า</span>
            </div>
            {/* Right: total */}
            <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
              <span style={{fontSize:'16px',fontWeight:800}}>฿{totalPrice.toLocaleString()}</span>
              <span style={{fontSize:'16px',opacity:0.7}}>›</span>
            </div>
          </button>
        </div>
      )}

      {/* ── MODALS / SHEETS ── */}
      {showCart && (
        <CartDrawer
          cartItems={cartValues.map((i) => ({ ...i, onAdd: () => handleAddCartItem(i.id), onRemove: () => removeFromCart(i.id) }))}
          totalPrice={totalPrice}
          note={note}
          setNote={setNote}
          onClose={() => setShowCart(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}

      {selectedItem && (
        <ItemOptionsModal
          item={selectedItem}
          allGroups={optionGroups}
          onClose={() => setSelectedItem(null)}
          onConfirm={addToCart}
        />
      )}

      {showStatusSheet && (
        <OrderStatusSheet
          table={table}
          customerName={customerName}
          onClose={() => setShowStatusSheet(false)}
        />
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div style={{padding:'24px',textAlign:'center',color:'#6B7280'}}>กำลังโหลด...</div>}>
      <MenuPageInner />
    </Suspense>
  );
}
