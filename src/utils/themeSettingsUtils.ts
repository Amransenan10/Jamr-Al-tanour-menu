import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { SeasonalEventSettings, EventPreset } from '../types';

export const DEFAULT_THEME_SETTINGS: SeasonalEventSettings = {
  event_active: false,
  event_preset: 'saudi_national_day',
  event_title: 'اليوم الوطني السعودي 🇸🇦',
  event_subtitle: 'نحتفل معكم باليوم الوطني! استمتع بأشهر الأطباق والوجبات بخصم خاص',
  event_promo_code: null, // Optional — admin can leave it empty
  event_show_confetti: true,
  event_show_modal: true,
  event_timestamp: Date.now()
};

/**
 * Fetch theme settings directly from native DB columns.
 * No CONFIG tag parsing — columns are the single source of truth.
 */
export const fetchThemeSettings = async (): Promise<SeasonalEventSettings> => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('event_active, event_preset, event_title, event_subtitle, event_promo_code, event_show_confetti, event_show_modal, event_timestamp')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data) {
      const settings: SeasonalEventSettings = {
        event_active: data.event_active === true,
        event_preset: (data.event_preset || 'saudi_national_day') as EventPreset,
        event_title: data.event_title || DEFAULT_THEME_SETTINGS.event_title,
        event_subtitle: data.event_subtitle || DEFAULT_THEME_SETTINGS.event_subtitle,
        event_promo_code: data.event_promo_code || null, // null = no promo code
        event_show_confetti: data.event_show_confetti ?? true,
        event_show_modal: data.event_show_modal ?? true,
        event_timestamp: data.event_timestamp || Date.now()
      };

      localStorage.setItem('jamr_theme_settings', JSON.stringify(settings));
      localStorage.setItem('jamr_app_settings', JSON.stringify(settings));
      return settings;
    }
  } catch (err) {
    console.error('[fetchThemeSettings] DB fetch error:', err);
  }

  // Fallback to local cache only if DB fetch failed
  const rawCache = localStorage.getItem('jamr_theme_settings') || localStorage.getItem('jamr_app_settings');
  if (rawCache) {
    try { return JSON.parse(rawCache); } catch (e) {}
  }
  return DEFAULT_THEME_SETTINGS;
};

/**
 * Save theme settings to native DB columns ONLY.
 * No popular_subtitle / CONFIG tag — that column does not exist.
 */
export const saveThemeSettings = async (settings: SeasonalEventSettings): Promise<SeasonalEventSettings> => {
  const isTargetActive = Boolean(settings.event_active);
  const timestamp = Date.now();

  const fullSettings: SeasonalEventSettings = {
    ...settings,
    event_active: isTargetActive,
    event_timestamp: timestamp
  };

  // Payload uses ONLY columns that actually exist in the schema
  const dbPayload = {
    id: 1,
    event_active: isTargetActive,
    event_preset: fullSettings.event_preset || 'saudi_national_day',
    event_title: fullSettings.event_title || DEFAULT_THEME_SETTINGS.event_title,
    event_subtitle: fullSettings.event_subtitle || DEFAULT_THEME_SETTINGS.event_subtitle,
    event_promo_code: fullSettings.event_promo_code || null, // null = no promo code (optional)
    event_show_confetti: Boolean(fullSettings.event_show_confetti ?? true),
    event_show_modal: Boolean(fullSettings.event_show_modal ?? true),
    event_timestamp: timestamp,
    updated_at: new Date().toISOString()
  };

  console.log('[saveThemeSettings] Saving to DB:', dbPayload);

  let dbSuccess = false;

  // Try admin client first (bypasses RLS)
  try {
    const { error } = await supabaseAdmin.from('app_settings').upsert(dbPayload);
    if (!error) {
      dbSuccess = true;
      console.log('[saveThemeSettings] Admin upsert SUCCESS → event_active =', isTargetActive);
    } else {
      console.error('[saveThemeSettings] Admin upsert FAILED:', error.message);
    }
  } catch (e) {
    console.error('[saveThemeSettings] Admin upsert exception:', e);
  }

  // Fallback to anon client
  if (!dbSuccess) {
    try {
      const { error } = await supabase.from('app_settings').upsert(dbPayload);
      if (!error) {
        dbSuccess = true;
        console.log('[saveThemeSettings] Anon upsert SUCCESS → event_active =', isTargetActive);
      } else {
        console.error('[saveThemeSettings] Anon upsert FAILED:', error.message);
      }
    } catch (e) {
      console.error('[saveThemeSettings] Anon upsert exception:', e);
    }
  }

  if (!dbSuccess) {
    console.error('[saveThemeSettings] ALL upsert attempts failed!');
  }

  // Always update local storage with what we intended to save
  localStorage.setItem('jamr_theme_settings', JSON.stringify(fullSettings));
  localStorage.setItem('jamr_app_settings', JSON.stringify(fullSettings));

  // Broadcast to all active sessions
  try {
    await supabase.channel('jamr_realtime_channel').send({
      type: 'broadcast',
      event: 'theme_changed',
      payload: fullSettings
    });
  } catch (bcErr) {
    console.warn('[saveThemeSettings] Broadcast error (non-fatal):', bcErr);
  }

  return fullSettings;
};
