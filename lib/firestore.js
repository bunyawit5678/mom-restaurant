import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";

// ─────────────────────────────────────────────────────────────────────────────
// Collection names
// ─────────────────────────────────────────────────────────────────────────────
const ORDERS     = "orders";
const MENU       = "menu";
const CATEGORIES = "categories";
const OPTION_GROUPS = "optionGroups";

// ═════════════════════════════════════════════════════════════════════════════
// ORDERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Add a new order document.
 * @param {{ table: number, customerName: string, items: {name,qty,price,emoji,imageUrl,selectedOptions}[], total: number, note: string }} orderData
 * @returns {Promise<string>} New document ID
 */
export async function addOrder(orderData) {
  const ref = await addDoc(collection(db, ORDERS), {
    ...orderData,
    status:    "pending",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Realtime listener — all orders, newest first.
 * @param {(orders: object[]) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function listenToOrders(callback) {
  const q = query(collection(db, ORDERS), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

/**
 * Realtime listener — active orders only (status != "done"), newest first.
 * @param {(orders: object[]) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function listenToActiveOrders(callback) {
  const q = query(
    collection(db, ORDERS),
    where("status", "!=", "done"),
    orderBy("status"),          // required companion field when using != filter
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

/**
 * Update the status of a single order.
 * @param {string} orderId
 * @param {"pending" | "preparing" | "ready" | "paid" | "done"} status
 * @returns {Promise<void>}
 */
export async function updateOrderStatus(orderId, status) {
  await updateDoc(doc(db, ORDERS, orderId), { status });
}

/**
 * Realtime listener for a set of order IDs (used by customer order-status sheet).
 * @param {string[]} orderIds
 * @param {(orders: object[]) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function listenToOrdersByIds(orderIds, callback) {
  if (!orderIds || orderIds.length === 0) {
    callback([]);
    return () => {};
  }
  // Subscribe individually and merge — simple approach for small sets
  const results = {};
  const unsubs = orderIds.map((id) =>
    onSnapshot(doc(db, ORDERS, id), (snap) => {
      if (snap.exists()) {
        results[id] = { id: snap.id, ...snap.data() };
      }
      callback(Object.values(results));
    })
  );
  return () => unsubs.forEach((u) => u());
}

export async function updateOrder(orderId, updates) {
  await updateDoc(doc(db, ORDERS, orderId), updates);
}

// ═════════════════════════════════════════════════════════════════════════════
// MENU CRUD
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Realtime listener — all menu items ordered by sortOrder ascending.
 * @param {(items: object[]) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function listenToMenu(callback) {
  const q = query(collection(db, MENU), orderBy("sortOrder", "asc"));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

/**
 * Add a new menu item document.
 * @param {{ name: string, price: number, category: string, description: string, emoji: string, imageUrl: string, available: boolean, sortOrder: number }} itemData
 * @returns {Promise<string>} New document ID
 */
export async function addMenuItem(itemData) {
  const ref = await addDoc(collection(db, MENU), itemData);
  return ref.id;
}

/**
 * Partially update a menu item.
 * @param {string} itemId   Firestore document ID
 * @param {Partial<MenuItemData>} updates  Fields to update
 * @returns {Promise<void>}
 */
export async function updateMenuItem(itemId, updates) {
  await updateDoc(doc(db, MENU, itemId), updates);
}

/**
 * Delete a menu item document (does NOT delete its Storage image).
 * @param {string} itemId
 * @returns {Promise<void>}
 */
export async function deleteMenuItem(itemId) {
  await deleteDoc(doc(db, MENU, itemId));
}

/**
 * Toggle availability of a menu item.
 * @param {string} itemId
 * @param {boolean} available
 * @returns {Promise<void>}
 */
export async function updateMenuAvailability(itemId, available) {
  await updateDoc(doc(db, MENU, itemId), { available });
}

// ═════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Realtime listener — all categories ordered by sortOrder ascending.
 * @param {(categories: object[]) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function listenToCategories(callback) {
  const q = query(collection(db, CATEGORIES), orderBy("sortOrder", "asc"));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

/**
 * Add a new category.
 * @param {string} name  Display name of the category
 * @returns {Promise<string>} New document ID
 */
export async function addCategory(name) {
  const docRef = await addDoc(collection(db, CATEGORIES), {
    name,
    sortOrder: Date.now(),
  });
  return docRef.id;
}

/**
 * Delete a category document.
 * @param {string} categoryId
 * @returns {Promise<void>}
 */
export async function deleteCategory(categoryId) {
  await deleteDoc(doc(db, CATEGORIES, categoryId));
}

// ═════════════════════════════════════════════════════════════════════════════
// OPTION GROUPS
// ═════════════════════════════════════════════════════════════════════════════

export function listenToOptionGroups(callback) {
  const q = query(collection(db, OPTION_GROUPS), orderBy("sortOrder", "asc"));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

export async function addOptionGroup(data) {
  const docRef = await addDoc(collection(db, OPTION_GROUPS), {
    ...data,
    sortOrder: Date.now(),
  });
  return docRef.id;
}

export async function updateOptionGroup(id, data) {
  await updateDoc(doc(db, OPTION_GROUPS, id), data);
}

export async function deleteOptionGroup(id) {
  await deleteDoc(doc(db, OPTION_GROUPS, id));
}

// ═════════════════════════════════════════════════════════════════════════════
// STORAGE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Upload a menu image to Firebase Storage.
 * @param {File} file    Image file from an <input type="file">
 * @param {string} itemId  Used to namespace the storage path
 * @returns {Promise<string>} Public download URL
 */
export async function uploadMenuImage(file, itemId) {
  const path      = `menu-images/${itemId}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  const snapshot  = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

/**
 * Delete a menu image from Firebase Storage using its full download URL.
 * @param {string} imageUrl  The full HTTPS download URL (from getDownloadURL)
 * @returns {Promise<void>}
 */
export async function deleteMenuImage(imageUrl) {
  const storageRef = ref(storage, imageUrl);
  await deleteObject(storageRef);
}
