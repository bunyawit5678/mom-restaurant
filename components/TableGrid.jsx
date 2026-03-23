"use client";

/**
 * TableGrid
 * Props:
 *   orders       — array of order objects (active orders only)
 *   numTables    — number (default 8)
 *   onTableClick — (tableNum: number) => void
 */

const STATUS_BORDER = {
  empty:   "border-gray-200 bg-white cursor-default",
  pending: "border-[#E8650A] bg-white cursor-pointer active:scale-95",
  paid:    "border-[#2D6A4F] bg-white cursor-pointer active:scale-95",
};

const STATUS_BADGE = {
  pending: { label: "รอชำระ",   cls: "bg-[#E8650A] text-white" },
  paid:    { label: "จ่ายแล้ว", cls: "bg-[#2D6A4F] text-white" },
};

function tableStatus(orders) {
  if (orders.length === 0) return "empty";
  if (orders.some((o) => o.status === "pending")) return "pending";
  return "paid";
}

function tableSummary(orders) {
  const names = orders.flatMap((o) => (o.items ?? []).map((i) => i.name)).join(", ");
  return names.length > 40 ? names.slice(0, 40) + "…" : names;
}

export default function TableGrid({ orders = [], numTables = 8, onTableClick }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 px-3 py-4"
      style={{ fontFamily: "'Sarabun', sans-serif" }}
    >
      {Array.from({ length: numTables }, (_, i) => i + 1).map((tableNum) => {
        const tableOrders = orders.filter((o) => o.table === tableNum);
        const status      = tableStatus(tableOrders);
        const grandTotal  = tableOrders.reduce((s, o) => s + (o.total ?? 0), 0);
        const hasNew      = tableOrders.some((o) => o.isNew);
        const badge       = STATUS_BADGE[status];

        return (
          <button
            key={tableNum}
            onClick={() => status !== "empty" && onTableClick?.(tableNum)}
            disabled={status === "empty"}
            className={`relative text-left rounded-2xl p-3 border-2 transition-all min-h-[110px]
              flex flex-col justify-between ${STATUS_BORDER[status]}`}
          >
            {/* "ใหม่" badge */}
            {hasNew && (
              <span className="absolute top-2 right-2 bg-[#C8411A] text-white text-[10px]
                font-bold px-1.5 py-0.5 rounded-full">
                ใหม่
              </span>
            )}

            <div>
              <p className={`text-base font-bold ${status === "empty" ? "text-gray-400" : "text-gray-800"}`}>
                โต๊ะ {tableNum}
              </p>

              {status === "empty" ? (
                <p className="text-xs text-gray-400 mt-1">ว่าง</p>
              ) : (
                <>
                  {badge && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                  <p className="text-[11px] text-gray-500 mt-1 leading-tight">
                    {tableSummary(tableOrders)}
                  </p>
                </>
              )}
            </div>

            {status !== "empty" && (
              <p className="text-base font-bold text-[#C8411A]">฿{grandTotal}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
