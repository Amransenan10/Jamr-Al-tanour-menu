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

  // Extract CONFIG tag from popular_subtitle (or announcement_text as legacy)
  const subStr = data.popular_subtitle || data.announcement_text || '';
  if (typeof subStr === 'string' && subStr.includes('[CONFIG:')) {
    const startIdx = subStr.indexOf('[CONFIG:') + 8;
    const endIdx   = subStr.lastIndexOf(']');
    if (startIdx > 8 && endIdx > startIdx) {
      try {
        const extraConfig = JSON.parse(subStr.substring(startIdx, endIdx));
        // CONFIG TAG *WINS* — it is written by saveAppSettings with the latest merged state
        // Native columns can be stale, missing, or blocked by RLS
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
  // event_active: MUST be explicitly true — never default to true
  parsed.event_active        = parsed.event_active === true || String(parsed.event_active) === 'true';
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

  // ── 3. Build the CONFIG tag (single source of truth for all dynamic settings) ─
  const configObject = {
    announcement_active: merged.announcement_active,
    offers_active:       merged.offers_active,
    wheel_active:        merged.wheel_active,
    wheel_title:         merged.wheel_title  || 'عجلة الحظ والجوائز',
    wheel_prizes:        merged.wheel_prizes,
    event_active:        merged.event_active,
    event_preset:        merged.event_preset || 'saudi_national_day',
    event_title:         merged.event_title  || 'اليوم الوطني السعودي 🇸🇦',
    event_subtitle:      merged.event_subtitle || 'نحتفل معكم باليوم الوطني! استمتع بأشهى الأطباق بخصم حصري ومميز',
    event_promo_code:    merged.event_promo_code || 'SAUDI',
    event_show_confetti: merged.event_show_confetti,
    event_show_modal:    merged.event_show_modal,
    event_timestamp:     Date.now()          // always fresh timestamp
  };

  const configTag  = `[CONFIG:${JSON.stringify(configObject)}]`;
  const cleanSub   = (currentSettings.popular_subtitle || '').replace(/\[CONFIG:[\s\S]*?\]/g, '').trim();
  const updatedSub = cleanSub ? `${cleanSub} ${configTag}` : configTag;

  // ── 4. Full DB payload ───────────────────────────────────────────────────────
  const fullPayload: Record<string, any> = {
    id:                  1,
    announcement_text:   merged.announcement_text   || '',
    announcement_active: merged.announcement_active,
    popular_title:       merged.popular_title        || '',
    popular_subtitle:    updatedSub,               // CONFIG tag embedded here
    offers_title:        merged.offers_title         || '',
    offers_active:       merged.offers_active,
    event_active:        merged.event_active,       // native column (belt + suspenders)
    event_preset:        configObject.event_preset,
    event_title:         configObject.event_title,
    event_subtitle:      configObject.event_subtitle,
    event_promo_code:    configObject.event_promo_code,
    event_show_confetti: configObject.event_show_confetti,
    event_show_modal:    configObject.event_show_modal,
    updated_at:          new Date().toISOString()
  };

  // ── 5. Upsert (admin → anon fallback) ───────────────────────────────────────
  let res = await supabaseAdmin.from('app_settings').upsert(fullPayload);

  if (res.error) {
    console.warn('[saveAppSettings] Admin upsert failed, trying anon:', res.error.message);
    res = await supabase.from('app_settings').upsert(fullPayload);
  }

  // If native event columns don't exist in schema, drop them and retry
  if (res.error) {
    console.warn('[saveAppSettings] Full payload failed, trying schema-safe payload:', res.error.message);
    const safePayload: Record<string, any> = {
      id:                  1,
      announcement_text:   merged.announcement_text   || '',
      announcement_active: merged.announcement_active,
      popular_title:       merged.popular_title        || '',
      popular_subtitle:    updatedSub,
      offers_title:        merged.offers_title         || '',
      offers_active:       merged.offers_active,
      updated_at:          new Date().toISOString()
    };
    res = await supabaseAdmin.from('app_settings').upsert(safePayload);
    if (res.error) res = await supabase.from('app_settings').upsert(safePayload);
  }

  if (res.error) {
    throw new Error(`[saveAppSettings] All upsert attempts failed: ${res.error.message}`);
  }

  console.log(`[saveAppSettings] Success → event_active=${merged.event_active}`);

  // ── 6. Update local cache ────────────────────────────────────────────────────
  localStorage.setItem('jamr_app_settings', JSON.stringify(merged));

  // ── 7. Broadcast to all active sessions (realtime) ──────────────────────────
  try {
    await supabase.channel('jamr_realtime_channel').send({
      type:    'broadcast',
      event:   'settings_changed',
      payload: merged
    });
  } catch (bcErr) {
    console.warn('[saveAppSettings] Broadcast error (non-fatal):', bcErr);
  }

  return merged;
};
