import Link from "next/link";

export default function Home() {
  return (
    <main
      className="flex flex-col items-center justify-center gap-6 px-6 text-center"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        backgroundImage: "radial-gradient(ellipse at 30% 20%, rgba(108,99,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(167,139,250,0.06) 0%, transparent 60%)",
      }}
    >
      <div className="flex flex-col items-center mb-2">
        <div style={{
          width: 64, height: 64,
          borderRadius: "var(--radius-lg)",
          background: "var(--primary-gradient)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32,
          marginBottom: 16
        }}>
          🍜
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: "var(--text-primary)" }}>
          ร้านแม่
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>ระบบสั่งอาหาร</p>
      </div>

      <div style={{ width: "100%", maxWidth: 360, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <Link
          href="/menu?table=1"
          style={{
            display: "block",
            width: "100%",
            background: "var(--primary-gradient)",
            color: "white",
            borderRadius: "var(--radius-md)",
            padding: "16px",
            fontSize: "15px",
            fontWeight: 600,
            border: "none",
          }}
          className="hover:-translate-y-px active:scale-95 transition-all shadow-md"
        >
          เปิดเมนู
        </Link>

        <Link
          href="/admin"
          style={{
            display: "block",
            width: "100%",
            background: "rgba(108,99,255,0.08)",
            color: "var(--primary)",
            border: "1px solid rgba(108,99,255,0.2)",
            borderRadius: "var(--radius-md)",
            padding: "16px",
            fontSize: "15px",
            fontWeight: 600,
          }}
          className="hover:-translate-y-px active:scale-95 transition-all"
        >
          แดชบอร์ดแม่
        </Link>
      </div>

      <p style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 360, marginTop: 16 }}>
        หน้านี้สำหรับทดสอบเท่านั้น — ใช้ QR code สำหรับลูกค้าจริง
      </p>
    </main>
  );
}
