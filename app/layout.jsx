import "./globals.css";

export const metadata = {
  title: "ร้านแม่ — สั่งอาหาร",
  description: "สแกน QR เพื่อดูเมนูและสั่งอาหาร",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
