/**
 * Order Numbering and Formatting Utilities for Jamr Al-Tanour
 * Formats orders with #15 prefix followed by sequential order number.
 * e.g., order 1001 -> #151001
 */

import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';

/**
 * Format order number starting with #15 followed by the sequential order number.
 * Examples:
 * - 151001 -> #151001
 * - 1001   -> #151001
 * - Notes with [ORDER_NUM:151001] -> #151001
 */
export const formatOrderNumber = (
  order: { id?: string; order_number?: number | string | null; notes?: string | null } | null | undefined
): string => {
  if (!order) return '';

  // 1. Direct order_number column
  if (order.order_number !== undefined && order.order_number !== null) {
    const raw = String(order.order_number).trim();
    if (raw) {
      const numStr = raw.replace(/\D/g, '');
      if (numStr.startsWith('15') && numStr.length >= 6) {
        return `#${numStr}`;
      }
      return `#15${numStr}`;
    }
  }

  // 2. Check if order_number was encoded in notes: [ORDER_NUM:151001]
  if (order.notes) {
    const match = order.notes.match(/\[ORDER_NUM:(\d+)\]/);
    if (match && match[1]) {
      const numStr = match[1];
      if (numStr.startsWith('15')) return `#${numStr}`;
      return `#15${numStr}`;
    }
  }

  // 3. Check local storage if order.id is present
  if (order.id && typeof window !== 'undefined') {
    const cached = localStorage.getItem(`jamr_order_num_${order.id}`);
    if (cached) {
      if (cached.startsWith('15')) return `#${cached}`;
      return `#15${cached}`;
    }
  }

  // 4. Fallback from order.id (e.g. UUID)
  if (order.id) {
    const numericOnly = order.id.replace(/\D/g, '');
    if (numericOnly.length >= 4) {
      return `#15${numericOnly.slice(-4)}`;
    }
    return `#15${order.id.slice(0, 4).toUpperCase()}`;
  }

  return '#151001';
};

/**
 * Calculates next sequential order number starting from 151001 (representing order 1001 prefixed with 15).
 */
export const getNextOrderNumber = async (): Promise<number> => {
  const client = supabaseAdmin || supabase;

  try {
    // 1. Check highest existing order_number
    const { data: latestWithNum, error: numErr } = await client
      .from('orders')
      .select('order_number')
      .not('order_number', 'is', null)
      .order('order_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!numErr && latestWithNum && latestWithNum.order_number) {
      const parsed = Number(latestWithNum.order_number);
      if (!isNaN(parsed) && parsed >= 151001) {
        return parsed + 1;
      }
      if (!isNaN(parsed) && parsed >= 1000) {
        return 150000 + parsed + 1;
      }
    }

    // 2. Fallback: check count of total orders from supabase
    const { count, error: countErr } = await client
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (!countErr && typeof count === 'number') {
      // User requested starting at order 1001 with #15 -> 151001
      const baseCount = Math.max(1000, count);
      return 150000 + baseCount + 1;
    }
  } catch (e) {
    console.warn('Could not determine next order number from DB', e);
  }

  // 3. Fallback to localStorage counter
  let next = 151001;
  if (typeof window !== 'undefined') {
    const savedLast = Number(localStorage.getItem('jamr_last_order_num') || '151000');
    next = savedLast >= 151000 ? savedLast + 1 : 151001;
    localStorage.setItem('jamr_last_order_num', String(next));
  }
  return next;
};
