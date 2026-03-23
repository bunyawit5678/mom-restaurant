"use client";

import { useEffect, useRef } from "react";
import { generatePromptPayPayload } from "@/lib/promptpay";

/**
 * QRPayment
 * Props:
 *   amount      — number  (total to charge)
 *   phoneNumber — string  (PromptPay phone, e.g. "0812345678")
 */
export default function QRPayment({ amount, phoneNumber }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !amount || !phoneNumber) return;

    const payload = generatePromptPayPayload(phoneNumber, amount);

    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current, payload, {
        width:  200,
        margin: 2,
        color: {
          dark:  "#1C1410",
          light: "#FFFFFF",
        },
      });
    });
  }, [amount, phoneNumber]);

  return (
    <div
      className="flex flex-col items-center gap-2 py-4"
      style={{ fontFamily: "'Sarabun', sans-serif" }}
    >
      <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">
        สแกนรับชำระ — พร้อมเพย์
      </p>
      <canvas
        ref={canvasRef}
        className="rounded-2xl shadow-md border border-gray-100"
      />
      <p className="text-2xl font-bold text-[#C8411A] mt-1">
        ฿{amount.toLocaleString()}
      </p>
      <p className="text-sm text-gray-500">{phoneNumber}</p>
    </div>
  );
}
