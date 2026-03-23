// ─────────────────────────────────────────────────────────────────────────────
// PromptPay QR Payload Generator
// Follows the EMVCo QR Code Specification used by Thai banking apps.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise a Thai mobile number to the 11-digit PromptPay format.
 * "0812345678" (10 digits) → "66812345678" (11 digits)
 * "66812345678" is returned as-is.
 * @param {string} phone
 * @returns {string}
 */
export function formatPhone(phone) {
  const digits = phone.replace(/\D/g, ""); // strip non-digits
  if (digits.startsWith("66")) return digits;
  if (digits.startsWith("0"))  return "66" + digits.slice(1);
  return "66" + digits; // already without leading 0
}

// ─────────────────────────────────────────────────────────────────────────────
// EMVCo TLV helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build one EMVCo TLV field: ID (2 chars) + length (2 chars, zero-padded) + value.
 */
function f(id, value) {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CRC-16/CCITT-FALSE
// Poly: 0x1021 | Init: 0xFFFF | RefIn: false | RefOut: false | XorOut: 0x0000
// ─────────────────────────────────────────────────────────────────────────────

function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a PromptPay EMVCo QR payload string.
 *
 * @param {string} phoneNumber  Thai mobile number in any common format
 * @param {number} amount       Amount in THB (e.g. 250 or 250.50)
 * @returns {string}            Raw payload string — pass directly to a QR library
 */
export function generatePromptPayPayload(phoneNumber, amount) {
  const phone = formatPhone(phoneNumber);

  // Field 29 — Merchant Account Information (PromptPay)
  const merchantAccount = f("00", "A000000677010111") + f("01", phone);

  // Build payload body (everything before the CRC field)
  const body =
    f("00", "01") +                                        // Payload format indicator
    f("01", "12") +                                        // Point of initiation (dynamic)
    f("29", merchantAccount) +                             // PromptPay merchant account
    f("54", amount.toFixed(2)) +                           // Transaction amount
    f("58", "TH") +                                        // Country code
    f("59", "PromptPay") +                                 // Merchant name
    f("60", "Bangkok") +                                   // Merchant city
    "6304";                                                // Field 63 ID + length placeholder

  // Append 4-character CRC checksum
  return body + crc16(body);
}
