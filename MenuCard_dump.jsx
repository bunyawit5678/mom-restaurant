"use client";

/**
 * MenuCard
 * Props:
 *   item    — { id, name, price, emoji, imageUrl, available }
 *   qty     — number (default 0), shows red bubble if > 0
 *   onAdd   — () => void, called when + is tapped
 */
export default function MenuCard({ item, qty = 0, onAdd }) {
    const sold = item.available === false;

    return (
        <div className={`relative bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col transition-all duration-300
            ${sold ? "opacity-60" : "hover:-translate-y-1 hover:shadow-md"}`}
            style={{ border: "1px solid var(--border)" }}
        >
            {/* Qty bubble */}
            {qty > 0 && (
                <span className="absolute top-2 left-2 z-10 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-in zoom-in"
                      style={{ background: "var(--primary-gradient)" }}>
                    {qty}
                </span>
            )}

            {/* Image / Emoji */}
            <div className="w-full flex items-center justify-center overflow-hidden relative h-[120px] max-[480px]:h-auto max-[480px]:aspect-[4/3]" style={{ background: "var(--bg-secondary)" }}>
                {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                ) : (
                    <span className="text-[48px] select-none filter drop-shadow-sm transition-transform duration-500 hover:scale-110">{item.emoji}</span>
                )}
                {/* Subtle glass reflection overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent flex to-white/20 pointer-events-none" />
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between gap-1 relative bg-white" style={{ padding: "10px 12px" }}>
                <p className="text-[14px] font-semibold leading-snug line-clamp-2" style={{ color: "var(--text-primary)" }}>
                    {item.name}
                </p>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-[15px] font-bold" style={{ color: "var(--primary)" }}>฿{item.price}</p>
                    <button
                        onClick={onAdd}
                        disabled={sold}
                        className="w-8 h-8 rounded-full text-white text-xl font-bold flex items-center justify-center active:scale-90 transition-all shadow-sm"
                        style={{ background: sold ? "var(--text-muted)" : "var(--primary)" }}
                        aria-label={`เพิ่ม ${item.name}`}
                    >
                        +
                    </button>
                </div>
            </div>

            {/* หมด overlay */}
            {sold && (
                <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: "rgba(255,255,255,0.4)", backdropFilter: "blur(2px)" }}>
                    <span className="text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-sm" style={{ background: "rgba(26, 26, 46, 0.8)", backdropFilter: "blur(4px)" }}>
                        หมด
                    </span>
                </div>
            )}
        </div>
    );
}
