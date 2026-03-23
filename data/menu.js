export const CATEGORIES = {
  rice:    "ข้าวจาน",
  noodle:  "เส้น",
  stirfry: "ผัด / ทอด",
  soup:    "แกง / ต้ม",
  drink:   "เครื่องดื่ม",
};

const MENU = [
  // ── Rice ──────────────────────────────────────────────────────────
  { id:  1, name: "ข้าวผัดกุ้ง",          price: 60, category: "rice",    emoji: "🍤", available: true  },
  { id:  2, name: "ข้าวผัดหมู",           price: 50, category: "rice",    emoji: "🍚", available: true  },
  { id:  3, name: "ข้าวหมูแดง",           price: 55, category: "rice",    emoji: "🥩", available: true  },
  { id:  4, name: "ข้าวมันไก่",           price: 55, category: "rice",    emoji: "🍗", available: true  },

  // ── Noodle ────────────────────────────────────────────────────────
  { id:  5, name: "ผัดไทยกุ้ง",           price: 70, category: "noodle",  emoji: "🍜", available: true  },
  { id:  6, name: "บะหมี่หมูแดงแห้ง",    price: 55, category: "noodle",  emoji: "🍝", available: true  },
  { id:  7, name: "เส้นใหญ่ราดหน้าหมู",  price: 60, category: "noodle",  emoji: "🥢", available: true  },
  { id:  8, name: "ก๋วยเตี๋ยวเรือ",       price: 50, category: "noodle",  emoji: "🛶", available: false },

  // ── Stir-fry / Fried ──────────────────────────────────────────────
  { id:  9, name: "ผัดกะเพราหมูสับ",     price: 55, category: "stirfry", emoji: "🌿", available: true  },
  { id: 10, name: "ผัดกะเพราไก่ไข่ดาว",  price: 60, category: "stirfry", emoji: "🍳", available: true  },
  { id: 11, name: "ปลาทอดราดพริก",       price: 90, category: "stirfry", emoji: "🐟", available: true  },
  { id: 12, name: "ไก่ทอดกระเทียมพริกไทย", price: 65, category: "stirfry", emoji: "🍗", available: true  },

  // ── Soup / Curry ──────────────────────────────────────────────────
  { id: 13, name: "แกงเขียวหวานไก่",     price: 65, category: "soup",    emoji: "🥘", available: true  },
  { id: 14, name: "ต้มยำกุ้ง",           price: 80, category: "soup",    emoji: "🦐", available: true  },
  { id: 15, name: "ต้มข่าไก่",           price: 70, category: "soup",    emoji: "🍲", available: true  },
  { id: 16, name: "แกงมัสมั่นเนื้อ",    price: 85, category: "soup",    emoji: "🫕", available: false },

  // ── Drinks ────────────────────────────────────────────────────────
  { id: 17, name: "น้ำเปล่า",            price: 10, category: "drink",   emoji: "💧", available: true  },
  { id: 18, name: "ชาไทยเย็น",           price: 25, category: "drink",   emoji: "🧋", available: true  },
  { id: 19, name: "โอเลี้ยง",            price: 20, category: "drink",   emoji: "☕", available: true  },
  { id: 20, name: "น้ำส้มคั้นสด",        price: 30, category: "drink",   emoji: "🍊", available: true  },
];

export default MENU;
