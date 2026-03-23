"use client";

/**
 * OrderCard
 * Props:
 *   order    — { id, table, items, total, note, status, createdAt }
 *   onClick  — () => void
 */

const STATUS_MAP = {
  pending: { label: "รอชำระ",   cls: "bg-[#E8650A] text-white" },
  paid:    { label: "จ่ายแล้ว", cls: "bg-blue-500 text-white"   },
  done:    { label: "เสร็จแล้ว", cls: "bg-[#2D6A4F] text-white" },
};

function formatTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export default function OrderCard({ order, onClick }) {
  const { label, cls } = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
  const summary = (order.items ?? [])
    .map((i) => `${i.name} ×${i.qty}`)
    .join(", ");

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl px-4 py-3 shadow-sm
        border border-[#F0E8DC] active:scale-[0.98] transition-all min-h-[72px]"
      style={{ fontFamily: "'Sarabun', sans-serif" }}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-bold text-gray-800">โต๊ะ {order.table}</p>
            <p className="text-xs text-gray-400">{formatTime(order.createdAt)}</p>
          </div>
          <p className="text-xs text-gray-500 truncate">{summary}</p>
        </div>
        {/* Right */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>
            {label}
          </span>
          <p className="text-sm font-bold text-[#C8411A]">฿{order.total}</p>
        </div>
      </div>
    </button>
  );
}
