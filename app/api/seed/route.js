import { NextResponse } from 'next/server';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import MENU, { CATEGORIES } from '@/data/menu';

export async function GET() {
  let seededItemsCount = 0;
  let seededCategoriesCount = 0;

  try {
    const categoryKeys = Object.keys(CATEGORIES);
    for (let i = 0; i < categoryKeys.length; i++) {
      const key = categoryKeys[i];
      const name = CATEGORIES[key];
      
      const categoryRef = doc(db, 'categories', key);
      const categorySnap = await getDoc(categoryRef);
      
      if (!categorySnap.exists()) {
        await setDoc(categoryRef, {
          name: name,
          sortOrder: i
        });
        seededCategoriesCount++;
      }
    }

    for (let i = 0; i < MENU.length; i++) {
      const item = MENU[i];
      const docId = String(item.id);
      
      const itemRef = doc(db, 'menu', docId);
      const itemSnap = await getDoc(itemRef);
      
      if (!itemSnap.exists()) {
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
        seededItemsCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${seededItemsCount} menu items and ${seededCategoriesCount} categories`
    });
  } catch (error) {
    console.error("Error seeding data:", error);
    return NextResponse.json(
      { success: false, message: "Seed failed", error: error.message },
      { status: 500 }
    );
  }
}
