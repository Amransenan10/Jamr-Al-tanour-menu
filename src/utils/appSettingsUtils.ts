import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';

/**
 * Strip [CONFIG: ...] tag cleanly without leaving any orphan brackets
 */
export const stripConfigTag = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  const startIdx = text.indexOf('[CONFIG:');
  const endIdx = text.lastIndexOf(']');
  if (startIdx !== -1 && endIdx > startIdx) {
    const before = text.substring(0, startIdx).trim();
    const after = text.substring(endIdx + 1).trim();
    return `${before} ${after}`.replace(/(?:\s*\}\])+/g, '').replace(/\s+/g, ' ').trim();
  }
  return text.replace(/\[CONFIG:[\s\S]*?\]/g, '').replace(/(?:\s*\}\])+/g, '').replace(/\s+/g, ' ').trim();
};

/**
 * Parse app_settings row from Supabase.
 * PRIORITY (highest to lowest):
 *   1. CONFIG tag embedded in popular_subtitle or announcement_text
 *   2. Native DB columns
 */
export const parseAppSettings = (data: any) => {
  if (!data) return {};

  // Start with raw DB row
  let parsed = { ...data };
  let extraConfig: any = null;

  // Extract CONFIG tag from announcement_text OR popular_subtitle (whichever contains it)
  const candidateFields = [data.announcement_text, data.popular_subtitle];
  for (const field of candidateFields) {
    if (typeof field === 'string' && field.includes('[CONFIG:')) {
      const startIdx = field.indexOf('[CONFIG:') + 8;
      const endIdx = field.lastIndexOf(']');
      if (startIdx > 8 && endIdx > startIdx) {
        try {
          extraConfig = JSON.parse(field.substring(startIdx, endIdx));
          parsed = { ...parsed, ...extraConfig };
          break;
        } catch (e) {
          console.error('[parseAppSettings] Failed to parse CONFIG tag:', e);
        }
      }
    }
  }

  // Clean the display value of popular_subtitle and announcement_text
  if (typeof parsed.popular_subtitle === 'string') {
    parsed.popular_subtitle = stripConfigTag(parsed.popular_subtitle);
  }
  if (typeof parsed.announcement_text === 'string') {
    parsed.announcement_text = stripConfigTag(parsed.announcement_text);
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

  parsed.authorized_pos_devices = Array.isArray(parsed.authorized_pos_devices) ? parsed.authorized_pos_devices : [];

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
  // Clean announcement text from any previous CONFIG tags using robust stripConfigTag
  const cleanAnnouncement = stripConfigTag(merged.announcement_text || '');
  const extraConfig: any = {};
  if (merged.marketing_pixels) extraConfig.marketing_pixels = merged.marketing_pixels;
  if (merged.welcome_offer) extraConfig.welcome_offer = merged.welcome_offer;
  if (merged.whatsapp_recovery_template) extraConfig.whatsapp_recovery_template = merged.whatsapp_recovery_template;
  if (merged.whatsapp_recovery_promo !== undefined) extraConfig.whatsapp_recovery_promo = merged.whatsapp_recovery_promo;
  if (merged.authorized_pos_devices !== undefined) extraConfig.authorized_pos_devices = merged.authorized_pos_devices;
  if (merged.seo_settings !== undefined) extraConfig.seo_settings = merged.seo_settings;
  if (merged.seo_articles !== undefined) extraConfig.seo_articles = merged.seo_articles;

  const hasExtra = Object.keys(extraConfig).length > 0;
  const packedAnnouncement = hasExtra
    ? `${cleanAnnouncement} [CONFIG:${JSON.stringify(extraConfig)}]`.trim()
    : cleanAnnouncement;

  const fullPayload: Record<string, any> = {
    id:                  1,
    announcement_text:   packedAnnouncement,
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

  // ── 4. Save to DB (update existing id=1 or upsert fallback) ───────────────────
  let res = await supabaseAdmin.from('app_settings').update(fullPayload).eq('id', 1);

  if (res.error) {
    console.warn('[saveAppSettings] Admin update failed, trying anon update:', res.error.message);
    res = await supabase.from('app_settings').update(fullPayload).eq('id', 1);
  }

  if (res.error) {
    console.warn('[saveAppSettings] Update failed, trying upsert:', res.error.message);
    res = await supabaseAdmin.from('app_settings').upsert(fullPayload);
    if (res.error) {
      res = await supabase.from('app_settings').upsert(fullPayload);
    }
  }

  // Guaranteed minimal fallback: update announcement_text specifically
  if (res.error) {
    console.warn('[saveAppSettings] Full upsert failed, attempting safe minimal update:', res.error.message);
    const minPayload = { announcement_text: packedAnnouncement, updated_at: new Date().toISOString() };
    const minRes = await supabaseAdmin.from('app_settings').update(minPayload).eq('id', 1);
    if (!minRes.error) {
      res = minRes;
    } else {
      res = await supabase.from('app_settings').update(minPayload).eq('id', 1);
    }
  }

  if (res.error) {
    throw new Error(`[saveAppSettings] All update attempts failed: ${res.error.message}`);
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
