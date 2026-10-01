import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';

/**
 * Parse app_settings row from Supabase.
 * PRIORITY (highest to lowest):
 *   1. CONFIG tag embedded in popular_subtitle  ← most reliably written by admin
 *   2. Native DB columns                         ← used as fallback / for non-event settings
 */
export const parseAppSettings = (data: any) => {
  if (!data) return {};

  // Start with raw DB row
  let parsed = { ...data };
  let extraConfig: any = null;

  // Extract CONFIG tag from popular_subtitle (or announcement_text as legacy)
  const subStr = data.popular_subtitle || data.announcement_text || '';
  if (typeof subStr === 'string' && subStr.includes('[CONFIG:')) {
    const startIdx = subStr.indexOf('[CONFIG:') + 8;
    const endIdx   = subStr.lastIndexOf(']');
    if (startIdx > 8 && endIdx > startIdx) {
      try {
        extraConfig = JSON.parse(subStr.substring(startIdx, endIdx));
        parsed = { ...parsed, ...extraConfig };
      } catch (e) {
        console.error('[parseAppSettings] Failed to parse CONFIG tag:', e);
      }
    }
  }

  // Clean the display value of popular_subtitle
  if (typeof parsed.popular_subtitle === 'string') {
    parsed.popular_subtitle = parsed.popular_subtitle.replace(/\[CONFIG:[\s\S]*?\]/, '').trim();
  }

  // Force correct boolean types with safe defaults
  parsed.announcement_active = parsed.announcement_active === undefined ? true  : Boolean(parsed.announcement_active);
  parsed.offers_active       = parsed.offers_active === undefined       ? true  : Boolean(parsed.offers_active);
  parsed.wheel_active        = parsed.wheel_active === undefined        ? true  : Boolean(parsed.wheel_active);

  // event_active: True if native column is true OR if CONFIG tag specifies event_active = true
  const nativeActive = data.event_active === true || String(data.event_active) === 'true';
  const configActive = extraConfig ? (extraConfig.event_active === true || String(extraConfig.event_active) === 'true') : false;
  
  // If either source has explicitly set event_active to true, it is active
  parsed.event_active = Boolean(configActive || nativeActive);

  parsed.event_show_confetti = parsed.event_show_confetti === undefined ? true  : Boolean(parsed.event_show_confetti);
  parsed.event_show_modal    = parsed.event_show_modal === undefined    ? true  : Boolean(parsed.event_show_modal);

  return parsed;
};

/**
 * Save (merge) partial app settings to Supabase.
 * Always reads the current state from DB first so nothing is accidentally lost.
 */
export const saveAppSettings = async (newPartial: Record<string, any>) => {
  // ── 1. Load current state from DB (supabaseAdmin bypasses RLS) ──────────────
  let currentSettings: any = {};
  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data) {
      currentSettings = parseAppSettings(data);
    } else {
      // Anon-client fallback
      const { data: anonData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (anonData) currentSettings = parseAppSettings(anonData);
    }
  } catch (e) {
    console.warn('[saveAppSettings] Could not read current settings, proceeding with partial only:', e);
  }

  // ── 2. Merge: newPartial always wins ────────────────────────────────────────
  const merged: any = { ...currentSettings, ...newPartial };

  // Enforce correct types after merge
  merged.announcement_active = Boolean(merged.announcement_active);
  merged.offers_active       = Boolean(merged.offers_active);
  merged.wheel_active        = Boolean(merged.wheel_active);
  merged.event_active        = merged.event_active === true || String(merged.event_active) === 'true';
  merged.event_show_confetti = Boolean(merged.event_show_confetti ?? true);
  merged.event_show_modal    = Boolean(merged.event_show_modal ?? true);

  console.log(`[saveAppSettings] Writing → event_active=${merged.event_active}`);

  // ── 3. Full DB payload using ONLY columns that exist in the schema ────────────
  // NOTE: popular_subtitle does NOT exist in app_settings — never include it!
  const fullPayload: Record<string, any> = {
    id:                  1,
    announcement_text:   merged.announcement_text   || '',
    announcement_active: merged.announcement_active,
    offers_active:       merged.offers_active,
    wheel_active:        merged.wheel_active,
    wheel_title:         merged.wheel_title   || 'دَوّر واكسب جوائز المنيو!',
    wheel_prizes:        merged.wheel_prizes  || [],
    event_active:        merged.event_active,
    event_preset:        merged.event_preset  || 'saudi_national_day',
    event_title:         merged.event_title   || 'اليوم الوطني السعودي 🇸🇦',
    event_subtitle:      merged.event_subtitle || 'نحتفل معكم باليوم الوطني!',
    event_promo_code:    merged.event_promo_code || null, // null = optional, no promo code
    event_show_confetti: Boolean(merged.event_show_confetti ?? true),
    event_show_modal:    Boolean(merged.event_show_modal ?? true),
    updated_at:          new Date().toISOString()
  };

  // ── 4. Upsert (admin → anon fallback) ────────────────────────────────────────
  let res = await supabaseAdmin.from('app_settings').upsert(fullPayload);

  if (res.error) {
    console.warn('[saveAppSettings] Admin upsert failed, trying anon:', res.error.message);
    res = await supabase.from('app_settings').upsert(fullPayload);
  }

  if (res.error) {
    throw new Error(`[saveAppSettings] All upsert attempts failed: ${res.error.message}`);
  }

  console.log(`[saveAppSettings] Success → event_active=${merged.event_active}`);

  // ── 6. Update local cache ────────────────────────────────────────────────────
  localStorage.setItem('jamr_app_settings', JSON.stringify(merged));
  localStorage.setItem('jamr_theme_settings', JSON.stringify(merged));

  // ── 7. Broadcast to all active sessions (realtime) ──────────────────────────
  try {
    await supabase.channel('jamr_realtime_channel').send({
      type:    'broadcast',
      event:   'settings_changed',
      payload: merged
    });
    await supabase.channel('jamr_realtime_channel').send({
      type:    'broadcast',
      event:   'theme_changed',
      payload: merged
    });
  } catch (bcErr) {
    console.warn('[saveAppSettings] Broadcast error (non-fatal):', bcErr);
  }

  return merged;
};
