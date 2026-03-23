import { NextResponse } from 'next/server';
import { doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import MENU, { CATEGORIES } from '@/data/menu';

export async function GET() {
  try {
    for (let i = 0; i < MENU.length; i++) {
        const item = MENU[i];
        const docId = String(item.id);
        const itemRef = doc(db, 'menu', docId);
        const snap = await getDoc(itemRef);
        if (snap.exists()) {
            await deleteDoc(itemRef);
        }
        await setDoc(itemRef, {
            name: item.name,
            price: item.price,
            category: item.category,
            emoji: item.emoji,
            available: item.available,
            sortOrder: i,
            description: "",
            imageUrl: ""
        });
    }

    const entries = Object.entries(CATEGORIES);
    for (let i = 0; i < entries.length; i++) {
        const [key, name] = entries[i];
        const catRef = doc(db, 'categories', key);
        const snap = await getDoc(catRef);
        if (snap.exists()) {
            await deleteDoc(catRef);
        }
        await setDoc(catRef, {
            name: name,
            sortOrder: i
        });
    }

    return NextResponse.json({
        success: true,
        message: `Seeded ${MENU.length} items and ${entries.length} categories`
    });
  } catch (error) {
    return NextResponse.json(
        { success: false, message: "Seed failed", error: error.message },
        { status: 500 }
    );
  }
}
