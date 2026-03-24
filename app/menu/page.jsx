"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { listenToMenu, addOrder, listenToOptionGroups } from "@/lib/firestore";
import { CATEGORIES } from "@/data/menu";

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
  )
}

function MenuItemCard({ item, qty, onAdd, onRemove }) {
  const isAvailable = item.available !== false;
  return (
    <div style={{display:'flex',padding:'14px 16px',borderBottom:'1px solid #F3F4F6',opacity: isAvailable ? 1 : 0.45}}>
      <div style={{flex:1,marginRight:'12px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <div style={{fontSize:'15px',fontWeight:500,color:'#111111',marginBottom:'4px'}}>{item.name} {!isAvailable && '(หมด)'}</div>
        {item.description && <div style={{fontSize:'13px',color:'#6B7280',marginBottom:'6px'}}>{item.description}</div>}
        <div style={{fontSize:'15px',fontWeight:700,color:'#7C3AED'}}>฿{item.price}</div>
      </div>
      <div style={{width:'80px',height:'80px',borderRadius:'10px',overflow:'hidden',flexShrink:0,position:'relative',background:'#F3F4F6',display:'flex',alignItems:'center',justifyContent:'center'}}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
        ) : (
          <div style={{fontSize:'36px'}}>{item.emoji}</div>
        )}
        
        {qty > 0 && (
          <div style={{position:'absolute',top:'4px',right:'4px',background:'#7C3AED',color:'white',width:'20px',height:'20px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700}}>
            {qty}
          </div>
        )}

        {isAvailable && (
          <button 
            onClick={() => onAdd(item)}
            style={{position:'absolute',bottom:'4px',right:'4px',width:'28px',height:'28px',borderRadius:'14px',background:'#7C3AED',color:'white',border:'none',fontSize:'18px',display:'flex',alignItems:'center',justifyContent:'center',paddingBottom:'2px'}}
          >
            +
          </button>
        )}
      </div>
    </div>
  )
}

function ItemOptionsModal({ item, allGroups, onClose, onConfirm }) {
  const groupsToChoose = allGroups.filter(g => item.optionGroupIds?.includes(g.id));
  const [selections, setSelections] = useState(() => {
    const init = {};
    groupsToChoose.forEach(g => init[g.id] = 0);
    return init;
  });

  const addedPrice = groupsToChoose.reduce((sum, g) => sum + (g.options[selections[g.id]]?.price || 0), 0);
  const totalPrice = item.price + addedPrice;

  function handleSubmit() {
    const selectedOptions = groupsToChoose.map(g => g.options[selections[g.id]]);
    onConfirm(item, selectedOptions, addedPrice);
  }

  return (
    <>
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:60}} onClick={onClose} />
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'white',borderRadius:'20px 20px 0 0',zIndex:70,maxHeight:'80vh',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'12px',display:'flex',justifyContent:'center'}}><div style={{width:'32px',height:'4px',background:'#E5E7EB',borderRadius:'2px',marginBottom:'4px'}} /></div>
        <div style={{padding:'0 16px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <h2 style={{fontSize:'17px',fontWeight:700,margin:0}}>{item.name}</h2>
            <button onClick={onClose} style={{background:'none',border:'none',fontSize:'20px',color:'#6B7280'}}>✕</button>
        </div>
        <div style={{overflowY:'auto',flex:1,padding:'0 16px 24px',display:'flex',flexDirection:'column',gap:'20px'}}>
            {groupsToChoose.map(group => (
              <div key={group.id}>
                 <div style={{fontSize:'14px',fontWeight:700,color:'#374151',marginBottom:'12px'}}>{group.name} <span style={{fontSize:'12px',color:'#EF4444',fontWeight:500}}>(เลือก 1 อย่าง)</span></div>
                 {group.options.map((opt, idx) => (
                    <label key={idx} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px',border:'1px solid',borderColor: selections[group.id]===idx ? '#7C3AED' : '#E5E7EB',borderRadius:'12px',marginBottom:'8px',background: selections[group.id]===idx ? '#EDE9FE' : 'white'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                            <input type="radio" name={group.id} checked={selections[group.id]===idx} onChange={() => setSelections({...selections, [group.id]: idx})} style={{width:'18px',height:'18px',accentColor:'#7C3AED'}} />
                            <span style={{fontSize:'15px',fontWeight:500,color: selections[group.id]===idx ? '#7C3AED' : '#111111'}}>{opt.name}</span>
                        </div>
                        {opt.price > 0 && <span style={{fontSize:'14px',color:'#6B7280'}}>+฿{opt.price}</span>}
                    </label>
                 ))}
              </div>
            ))}
            
            <div style={{marginTop:'8px'}}>
              <button onClick={handleSubmit} style={{width:'100%',padding:'16px',background:'#7C3AED',color:'white',borderRadius:'12px',border:'none',fontWeight:600,fontSize:'16px',boxShadow:'0 4px 12px rgba(124,58,237,0.3)'}}>
                เพิ่มลงตะกร้า • ฿{totalPrice}
              </button>
            </div>
        </div>
      </div>
    </>
  )
}

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
  )
}

function MenuPageInner() {
  const searchParams = useSearchParams();
  const table = searchParams.get("table") ?? "?";

  // ── State ────────────────────────────────────────────────────────────────
  const [menuItems, setMenuItems]     = useState([]);
  const [optionGroups, setOptionGroups] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeCategory, setCategory] = useState("all");
  const [cart, setCart]               = useState({});   // { [cartItemId]: { ...item, qty } }
  const [note, setNote]               = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCart, setShowCart]       = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ── Firestore realtime listener ───────────────────────────────────────────
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

  const cartValues = Object.values(cart);
  const totalItems = cartValues.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cartValues.reduce((s, i) => s + i.price * i.qty, 0);
  const hasCart = totalItems > 0;

  useEffect(() => {
    if (!hasCart && showCart) setShowCart(false);
  }, [hasCart, showCart]);

  const handleItemClick = (item) => {
    if (item.optionGroupIds && item.optionGroupIds.length > 0) {
      setSelectedItem(item);
    } else {
      addToCart(item, [], 0);
    }
  };

  const addToCart = (baseItem, selectedOptions = [], addedPrice = 0) => {
    const optionsText = selectedOptions.map(o => o.name).join(", ");
    const nameWithOpts = optionsText ? `${baseItem.name} (${optionsText})` : baseItem.name;
    const cartItemId = optionsText ? `${baseItem.id}_${optionsText}` : baseItem.id;

    setCart(prev => ({
      ...prev,
      [cartItemId]: prev[cartItemId]
        ? { ...prev[cartItemId], qty: prev[cartItemId].qty + 1 }
        : { 
            baseId: baseItem.id, 
            id: cartItemId,
            name: nameWithOpts, 
            price: baseItem.price + addedPrice, 
            emoji: baseItem.emoji, 
            imageUrl: baseItem.imageUrl,
            qty: 1,
            category: baseItem.category,
            optionsText
          }
    }));
    setSelectedItem(null);
  };

  const handleAddCartItem = (cartItemId) => setCart(prev => ({...prev, [cartItemId]: {...prev[cartItemId], qty: prev[cartItemId].qty + 1}}));

  const removeFromCart = (cartItemId) => {
    setCart(prev => {
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

  // Group menu by category
  const categoriesToRender = useMemo(() => {
    if (activeCategory !== 'all') {
      return [{
        id: activeCategory,
        label: CATEGORIES[activeCategory] || activeCategory,
        items: menuItems.filter(i => i.category === activeCategory)
      }];
    }
    
    // activeCategory === 'all'
    const grouped = {};
    Object.keys(CATEGORIES).forEach(k => grouped[k] = []);
    menuItems.forEach(item => {
      if (grouped[item.category]) {
        grouped[item.category].push(item);
      } else {
        if (!grouped['other']) grouped['other'] = [];
        grouped['other'].push(item);
      }
    });
    
    return Object.keys(grouped).filter(k => grouped[k].length > 0).map(k => ({
      id: k,
      label: CATEGORIES[k] || 'อื่นๆ',
      items: grouped[k]
    }));
  }, [menuItems, activeCategory]);

  return (
    <div style={{minHeight:'100vh',paddingBottom:hasCart ? '80px' : '0',position:'relative'}}>
      <div style={{position:'sticky',top:0,zIndex:30}}>
        {/* HEADER */}
        <div style={{background:'white',borderBottom:'1px solid #E5E7EB',height:'56px',padding:'0 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontWeight:700,fontSize:'17px',color:'#111111'}}>ครัวตุ๊กตาอาหารตามสั่ง <span style={{fontSize:'13px',color:'#6B7280',fontWeight:400,marginLeft:'4px'}}>โต๊ะ {table}</span></div>
          <button onClick={() => hasCart && setShowCart(true)} style={{position:'relative',background:'none',border:'none',fontSize:'24px',color:'#7C3AED'}}>
            🛒
            {hasCart && (
              <div style={{position:'absolute',top:'-4px',right:'-6px',background:'#7C3AED',color:'white',width:'18px',height:'18px',borderRadius:'9px',fontSize:'10px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {totalItems}
              </div>
            )}
          </button>
        </div>

        {/* CATEGORY BAR */}
        <div style={{background:'white',borderBottom:'1px solid #E5E7EB',height:'48px',display:'flex',alignItems:'center',padding:'0 16px',gap:'8px',overflowX:'auto',scrollbarWidth:'none'}}>
          <button 
            onClick={() => setCategory('all')}
            style={{padding:'6px 16px',borderRadius:'20px',fontSize:'13px',fontWeight:500,border:'none',whiteSpace:'nowrap',
              background: activeCategory === 'all' ? '#7C3AED' : '#F3F4F6',
              color: activeCategory === 'all' ? 'white' : '#374151'
            }}
          >ทั้งหมด</button>
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              style={{padding:'6px 16px',borderRadius:'20px',fontSize:'13px',fontWeight:500,border:'none',whiteSpace:'nowrap',
                background: activeCategory === key ? '#7C3AED' : '#F3F4F6',
                color: activeCategory === key ? 'white' : '#374151'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{background:'white'}}>
        {loading ? (
          <div style={{padding:'24px 16px'}}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{display:'flex',marginBottom:'16px'}}>
                <div style={{flex:1,marginRight:'12px'}}>
                  <div style={{height:'18px',background:'#F3F4F6',borderRadius:'4px',width:'60%',marginBottom:'8px',animation:'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'}} />
                  <div style={{height:'14px',background:'#F3F4F6',borderRadius:'4px',width:'40%',animation:'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'}} />
                </div>
                <div style={{width:'80px',height:'80px',background:'#F3F4F6',borderRadius:'10px',animation:'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'}} />
              </div>
            ))}
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
          </div>
        ) : (
          categoriesToRender.map(cat => (
            <div key={cat.id}>
              {activeCategory === 'all' && cat.items.length > 0 && (
                <div style={{background:'#FAFAFA',padding:'12px 16px 6px',fontSize:'12px',fontWeight:600,color:'#7C3AED',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                  {cat.label}
                </div>
              )}
              {cat.items.map(item => (
                <MenuItemCard 
                  key={item.id} 
                  item={item} 
                  qty={cartValues.filter(c => c.baseId === item.id).reduce((s, c) => s + c.qty, 0)}
                  onAdd={handleItemClick}
                  onRemove={() => {}}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {hasCart && !showCart && (
        <div style={{position:'fixed',bottom:'16px',left:'16px',right:'16px',zIndex:30}}>
          <button 
            onClick={() => setShowCart(true)}
            style={{width:'100%',background:'#7C3AED',color:'white',padding:'16px',borderRadius:'16px',border:'none',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 4px 12px rgba(124,58,237,0.3)',fontWeight:600,fontSize:'16px'}}
          >
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <div style={{background:'rgba(255,255,255,0.2)',padding:'2px 8px',borderRadius:'12px',fontSize:'14px'}}>{totalItems}</div>
              ดูออเดอร์
            </div>
            <span>฿{totalPrice}</span>
          </button>
        </div>
      )}

      {showCart && (
        <CartDrawer
          cartItems={cartValues.map(i => ({...i, onAdd: () => handleAddCartItem(i.id), onRemove: () => removeFromCart(i.id)}))}
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
    </div>
  )
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div style={{padding:'24px',textAlign:'center',color:'#6B7280'}}>กำลังโหลด...</div>}>
      <MenuPageInner />
    </Suspense>
  )
}
