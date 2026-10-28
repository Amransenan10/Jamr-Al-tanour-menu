/**
 * Abandoned Cart Recovery Engine for Jamr Al Tanour
 * Tracks carts that were not converted into completed orders.
 * Generates 1-click WhatsApp recovery links with rehydration URLs.
 */

import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { getSavedTrafficAttribution } from './trafficAttribution';
import { normalizeSaudiPhone } from '../utils/phoneUtils';

export interface AbandonedCartRecord {
  id: string;
  customer_name?: string;
  phone: string;
  items: any[];
  items_count: number;
  total_price: number;
  source?: string;
  created_at: string;
  updated_at: string;
  recovered: boolean;
  notes?: string;
}

const STORAGE_LOCAL_ABANDONED_KEY = 'jamr_abandoned_carts_store';
const STORAGE_CURRENT_CART_SESSION = 'jamr_active_cart_session_id';

/** Save or update active cart for abandoned cart tracking */
export const syncActiveCartToRecovery = async (
  items: any[],
  totalPrice: number,
  phone?: string,
  customerName?: string
): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  const cleanPhone = normalizeSaudiPhone(phone || localStorage.getItem('jamr_customer_phone') || '');
  const name = customerName || localStorage.getItem('jamr_customer_name') || 'عميل عزيز';

  if (!items || items.length === 0) {
    // If cart was emptied, clear active session
    localStorage.removeItem(STORAGE_CURRENT_CART_SESSION);
    return null;
  }

  // We only track abandoned carts if we have at least a phone number or prior session
  if (!cleanPhone || cleanPhone.length < 9) {
    return null;
  }

  const attribution = getSavedTrafficAttribution();
  let cartId = localStorage.getItem(STORAGE_CURRENT_CART_SESSION);
  if (!cartId) {
    cartId = `cart_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    localStorage.setItem(STORAGE_CURRENT_CART_SESSION, cartId);
  }

  const now = new Date().toISOString();
  const itemsCount = items.reduce((acc, i) => acc + (i.quantity || 1), 0);

  const cartRecord: AbandonedCartRecord = {
    id: cartId,
    customer_name: name,
    phone: cleanPhone,
    items,
    items_count: itemsCount,
    total_price: Number(totalPrice || 0),
    source: attribution.source,
    created_at: now,
    updated_at: now,
    recovered: false
  };

  // 1. Save to local storage cache
  try {
    const raw = localStorage.getItem(STORAGE_LOCAL_ABANDONED_KEY);
    const list: AbandonedCartRecord[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(c => c.id === cartId || c.phone === cleanPhone);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...cartRecord, created_at: list[idx].created_at, updated_at: now };
    } else {
      list.unshift(cartRecord);
    }
    // Limit to latest 50
    localStorage.setItem(STORAGE_LOCAL_ABANDONED_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (e) {}

  // 2. Persist to Supabase abandoned_carts table if available
  try {
    const client = supabaseAdmin || supabase;
    const { error } = await client.from('abandoned_carts').upsert({
      id: cartRecord.id,
      customer_name: cartRecord.customer_name,
      phone: cartRecord.phone,
      items: cartRecord.items,
      total_price: cartRecord.total_price,
      source: cartRecord.source,
      recovered: false,
      updated_at: now
    });

    if (error && !error.message?.includes('relation "abandoned_carts" does not exist')) {
      console.warn('[AbandonedCart] Supabase upsert non-critical warning:', error.message);
    }
  } catch (e) {
    // Non-fatal fallback to localStorage
  }

  return cartId;
};

/** Mark a cart as successfully recovered when order is submitted */
export const markCartAsRecovered = async (cartId?: string, phone?: string): Promise<void> => {
  if (typeof window === 'undefined') return;

  const targetId = cartId || localStorage.getItem(STORAGE_CURRENT_CART_SESSION);
  const targetPhone = normalizeSaudiPhone(phone || localStorage.getItem('jamr_customer_phone') || '');

  localStorage.removeItem(STORAGE_CURRENT_CART_SESSION);

  // Update local storage
  try {
    const raw = localStorage.getItem(STORAGE_LOCAL_ABANDONED_KEY);
    if (raw) {
      const list: AbandonedCartRecord[] = JSON.parse(raw);
      const updated = list.map(c => {
        if ((targetId && c.id === targetId) || (targetPhone && c.phone === targetPhone)) {
          return { ...c, recovered: true, updated_at: new Date().toISOString() };
        }
        return c;
      });
      localStorage.setItem(STORAGE_LOCAL_ABANDONED_KEY, JSON.stringify(updated));
    }
  } catch (e) {}

  // Update Supabase
  try {
    const client = supabaseAdmin || supabase;
    if (targetId) {
      await client.from('abandoned_carts').update({ recovered: true }).eq('id', targetId);
    } else if (targetPhone) {
      await client.from('abandoned_carts').update({ recovered: true }).eq('phone', targetPhone);
    }
  } catch (e) {}
};

/** Get list of abandoned carts for the Admin Dashboard */
export const fetchAbandonedCarts = async (): Promise<AbandonedCartRecord[]> => {
  let list: AbandonedCartRecord[] = [];

  // 1. Try fetching from Supabase
  try {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('abandoned_carts')
      .select('*')
      .eq('recovered', false)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        customer_name: d.customer_name || 'عميل عزيز',
        phone: d.phone,
        items: d.items || [],
        items_count: Array.isArray(d.items) ? d.items.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0) : 1,
        total_price: Number(d.total_price || 0),
        source: d.source || 'مباشر',
        created_at: d.created_at || d.updated_at,
        updated_at: d.updated_at,
        recovered: Boolean(d.recovered)
      }));
    }
  } catch (e) {}

  // 2. Fallback to local storage list
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_LOCAL_ABANDONED_KEY);
      if (raw) {
        const localList: AbandonedCartRecord[] = JSON.parse(raw);
        list = localList.filter(c => !c.recovered);
      }
    } catch (e) {}
  }

  return list;
};

export const STORAGE_WHATSAPP_TEMPLATE_KEY = 'jamr_whatsapp_recovery_template';
export const STORAGE_RECOVERY_PROMO_KEY = 'jamr_whatsapp_recovery_promo';

export const DEFAULT_WHATSAPP_TEMPLATE = `يا هلا {customer_name}! 🌸
لاحظنا أنك تركت وجبتك اللذيذة في سلة *مطعم جمر التنور*

📋 أصنافك المحفوظة:
{items}
💰 الإجمالي: {total_price} ريال
{promo_section}
سلتك جاهزة، اضغط الرابط التالي لإكمال طلبك في ثوانٍ:
{recovery_link}`;

/** Fetch a specific cart by id for rehydration */
export const fetchCartById = async (cartId: string): Promise<AbandonedCartRecord | null> => {
  if (!cartId) return null;

  // 1. Try local storage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_LOCAL_ABANDONED_KEY);
      if (raw) {
        const list: AbandonedCartRecord[] = JSON.parse(raw);
        const found = list.find(c => c.id === cartId);
        if (found) return found;
      }
    } catch (e) {}
  }

  // 2. Try Supabase
  try {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('abandoned_carts')
      .select('*')
      .eq('id', cartId)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        customer_name: data.customer_name || 'عميل عزيز',
        phone: data.phone,
        items: data.items || [],
        items_count: Array.isArray(data.items) ? data.items.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0) : 1,
        total_price: Number(data.total_price || 0),
        source: data.source || 'مباشر',
        created_at: data.created_at || data.updated_at,
        updated_at: data.updated_at,
        recovered: Boolean(data.recovered)
      };
    }
  } catch (e) {}

  return null;
};

/** Encode cart items into compact URL-safe parameter for instant zero-DB cross-device recovery */
export const encodeCartPayload = (cart: AbandonedCartRecord): string => {
  try {
    const compact = (cart.items || []).map(i => ({
      i: i.id || '',
      p: i.productId || '',
      n: i.name || i.name_ar || (i as any).title || 'وجبة',
      pr: Number(i.price || 0),
      q: Number(i.quantity || 1),
      o: (i.options || []).map((o: any) => ({
        g: o.groupId || '',
        gn: o.groupName || '',
        id: o.itemId || '',
        in: o.itemName || '',
        p: Number(o.price || 0)
      })),
      r: i.removedIngredients || [],
      t: Number(i.totalPrice || i.price || 0),
      nt: i.notes || ''
    }));

    const json = JSON.stringify({ id: cart.id, c: compact });
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    return cart.id;
  }
};

/** Generate personalized WhatsApp Recovery URL */
export const generateWhatsAppRecoveryUrl = (
  cart: AbandonedCartRecord,
  customTemplate?: string,
  promoCode?: string
): string => {
  let cleaned = (cart.phone || '').replace(/\D/g, '');
  if (cleaned.startsWith('05')) {
    cleaned = '966' + cleaned.substring(1);
  } else if (cleaned.startsWith('5')) {
    cleaned = '966' + cleaned;
  }

  const customerName = cart.customer_name && cart.customer_name !== 'عميل عزيز' 
    ? `أ/ ${cart.customer_name}` 
    : 'بك';

  // Format first 3 items safely using name or name_ar
  const itemsSummary = (cart.items || [])
    .slice(0, 3)
    .map(i => `• ${i.name || i.name_ar || (i as any).title || 'صنف'} (x${i.quantity || 1})`)
    .join('\n');

  const moreCount = (cart.items || []).length > 3 ? `\n• + ${(cart.items || []).length - 3} أصناف أخرى` : '';
  const finalItemsList = `${itemsSummary}${moreCount}`;

  const cleanPromo = (promoCode || '').trim();
  const promoSection = cleanPromo 
    ? `\n🎁 استخدم كود الخصم الحصري: *${cleanPromo}* عند الطلب!` 
    : '';

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://jamr-al-tanour-menu.vercel.app';
  const recoveryPayload = encodeCartPayload(cart);
  const recoveryLink = `${siteUrl}/?recover_cart=${recoveryPayload}`;

  const template = customTemplate || (
    typeof window !== 'undefined' 
      ? localStorage.getItem(STORAGE_WHATSAPP_TEMPLATE_KEY) || DEFAULT_WHATSAPP_TEMPLATE 
      : DEFAULT_WHATSAPP_TEMPLATE
  );

  let message = template
    .replace(/{customer_name}/g, customerName)
    .replace(/{items}/g, finalItemsList)
    .replace(/{total_price}/g, `${cart.total_price}`)
    .replace(/{promo_code}/g, cleanPromo)
    .replace(/{promo_section}/g, promoSection)
    .replace(/{recovery_link}/g, recoveryLink);

  // Clean empty lines artifacts
  message = message.replace(/\n{3,}/g, '\n\n').trim();

  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
};
