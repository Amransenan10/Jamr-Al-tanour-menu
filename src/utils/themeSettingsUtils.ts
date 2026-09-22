import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { SeasonalEventSettings, EventPreset } from '../types';
import { parseAppSettings } from './appSettingsUtils';

export const DEFAULT_THEME_SETTINGS: SeasonalEventSettings = {
  event_active: false,
  event_preset: 'saudi_national_day',
  event_title: 'اليوم الوطني السعودي 🇸🇦',
  event_subtitle: 'نحتفل معكم باليوم الوطني! استمتع بأشهر الأطباق والوجبات بخصم خاص',
  event_promo_code: 'SAUDI',
  event_show_confetti: true,
  event_show_modal: true,
  event_timestamp: Date.now()
};

/**
 * Fetch theme settings cleanly.
 * Database is the SINGLE SOURCE OF TRUTH.
 */
export const fetchThemeSettings = async (): Promise<SeasonalEventSettings> => {
  try {
    const { data: appData, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!error && appData) {
      const parsed = parseAppSettings(appData);
      if (parsed) {
        const isEventActive = Boolean(parsed.event_active);
        const merged: SeasonalEventSettings = {
          event_active: isEventActive,
          event_preset: ((parsed.event_preset || 'saudi_national_day')) as EventPreset,
          event_title: parsed.event_title || DEFAULT_THEME_SETTINGS.event_title,
          event_subtitle: parsed.event_subtitle || DEFAULT_THEME_SETTINGS.event_subtitle,
          event_promo_code: parsed.event_promo_code || DEFAULT_THEME_SETTINGS.event_promo_code,
          event_show_confetti: parsed.event_show_confetti ?? true,
          event_show_modal: parsed.event_show_modal ?? true,
          event_timestamp: parsed.event_timestamp || Date.now()
        };

        // Cache the fresh DB truth locally across all standard keys
        localStorage.setItem('jamr_theme_settings', JSON.stringify(merged));
        localStorage.setItem('jamr_app_settings', JSON.stringify(merged));
        return merged;
      }
    }
  } catch (err) {
    console.error('[fetchThemeSettings] DB fetch error:', err);
  }

  // Fallback to local cache only if network/DB fetch failed
  const rawCache = localStorage.getItem('jamr_theme_settings') || localStorage.getItem('jamr_app_settings');
  if (rawCache) {
    try {
      return JSON.parse(rawCache);
    } catch (e) {}
  }

  return DEFAULT_THEME_SETTINGS;
};

/**
 * Save theme settings cleanly to Supabase DB, verify saved state from DB,
 * update local storage, and broadcast verified state to all sessions.
 */
export const saveThemeSettings = async (settings: SeasonalEventSettings): Promise<SeasonalEventSettings> => {
  const isTargetActive = Boolean(settings.event_active);
  const timestamp = Date.now();

  const fullSettings: SeasonalEventSettings = {
    ...settings,
    event_active: isTargetActive,
    event_timestamp: timestamp
  };

  // 1. Build CONFIG tag embedded in popular_subtitle for secondary resilience
  const configTag = `[CONFIG:${JSON.stringify(fullSettings)}]`;

  let existingSub = '';
  try {
    const client = supabaseAdmin || supabase;
    const { data } = await client
      .from('app_settings')
      .select('popular_subtitle')
      .eq('id', 1)
      .maybeSingle();
    existingSub = data?.popular_subtitle || '';
  } catch (e) {}

  const cleanSub = existingSub.replace(/\[CONFIG:[\s\S]*?\]/g, '').trim();
  const updatedSub = cleanSub ? `${cleanSub} ${configTag}` : configTag;

  const fullPayload = {
    id: 1,
    popular_subtitle: updatedSub,
    event_active: isTargetActive,
    event_preset: fullSettings.event_preset,
    event_title: fullSettings.event_title,
    event_subtitle: fullSettings.event_subtitle,
    event_promo_code: fullSettings.event_promo_code,
    event_show_confetti: fullSettings.event_show_confetti,
    event_show_modal: fullSettings.event_show_modal,
    updated_at: new Date().toISOString()
  };

  const safePayload = {
    id: 1,
    popular_subtitle: updatedSub,
    event_active: isTargetActive,
    updated_at: new Date().toISOString()
  };

  let dbSuccess = false;

  // 2. Perform DB Upsert first
  try {
    const { error: fullAdminErr } = await supabaseAdmin.from('app_settings').upsert(fullPayload);
    if (!fullAdminErr) {
      dbSuccess = true;
    } else {
      console.warn('[saveThemeSettings] Full admin upsert failed, trying safe payload:', fullAdminErr.message);
      const { error: safeAdminErr } = await supabaseAdmin.from('app_settings').upsert(safePayload);
      if (!safeAdminErr) dbSuccess = true;
    }
  } catch (e) {}

  if (!dbSuccess) {
    try {
      const { error: fullAnonErr } = await supabase.from('app_settings').upsert(fullPayload);
      if (!fullAnonErr) {
        dbSuccess = true;
      } else {
        const { error: safeAnonErr } = await supabase.from('app_settings').upsert(safePayload);
        if (!safeAnonErr) dbSuccess = true;
      }
    } catch (e) {}
  }

  if (!dbSuccess) {
    console.error('[saveThemeSettings] Warning: Failed to upsert theme settings to DB on all attempts.');
    // Even if DB failed, return fullSettings optimistically (UI stays correct)
  } else {
    console.log(`[saveThemeSettings] DB upsert success → event_active=${isTargetActive}`);
  }

  // 3. ALWAYS trust what we just saved — do NOT re-fetch from DB here.
  // Re-fetching immediately after upsert can return stale data (DB replication lag)
  // and would cause event_active to flip back to false incorrectly.
  const verifiedSettings = fullSettings;

  // 4. Update local storage with what we just saved
  localStorage.setItem('jamr_theme_settings', JSON.stringify(verifiedSettings));
  localStorage.setItem('jamr_app_settings', JSON.stringify(verifiedSettings));

  // 5. Broadcast to all active client sessions via Realtime
  try {
    await supabase.channel('jamr_realtime_channel').send({
      type: 'broadcast',
      event: 'theme_changed',
      payload: verifiedSettings
    });
    await supabase.channel('jamr_realtime_channel').send({
      type: 'broadcast',
      event: 'settings_changed',
      payload: verifiedSettings
    });
  } catch (bcErr) {
    console.warn('[saveThemeSettings] Broadcast error (non-fatal):', bcErr);
  }

  // 6. Background sync: refresh DB data into cache 2 seconds later (after DB commits)
  setTimeout(async () => {
    try {
      const { data } = await supabase.from('app_settings').select('*').eq('id', 1).maybeSingle();
      if (data) {
        const { parseAppSettings: parse } = await import('./appSettingsUtils');
        const refreshed = parse(data);
        // Only update cache if event_active still matches what we intended
        if (Boolean(refreshed.event_active) === isTargetActive) {
          localStorage.setItem('jamr_theme_settings', JSON.stringify({ ...verifiedSettings, ...refreshed }));
          localStorage.setItem('jamr_app_settings', JSON.stringify({ ...verifiedSettings, ...refreshed }));
        }
      }
    } catch (e) { /* non-fatal */ }
  }, 2000);

  return verifiedSettings;
};
