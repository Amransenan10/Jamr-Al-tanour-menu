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
 * Merges DB settings with local storage so stale DB responses never override user's active theme.
 */
export const fetchThemeSettings = async (): Promise<SeasonalEventSettings> => {
  // 1. Check local storage first
  let cached: SeasonalEventSettings | null = null;
  const rawCache = localStorage.getItem('jamr_theme_settings') || localStorage.getItem('jamr_app_settings');
  if (rawCache) {
    try {
      cached = JSON.parse(rawCache);
    } catch (e) {}
  }

  try {
    // 2. Fetch app_settings from Supabase
    const { data: appData } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (appData) {
      const parsed = parseAppSettings(appData);
      if (parsed) {
        // If DB has explicit event_active = true, force true.
        // Otherwise trust cached state if set by Admin recently.
        const dbActive = parsed.event_active === true;
        const cachedActive = cached?.event_active === true;
        const finalActive = dbActive || cachedActive;

        const merged: SeasonalEventSettings = {
          event_active: finalActive,
          event_preset: ((cachedActive ? cached?.event_preset : parsed.event_preset) || 'saudi_national_day') as EventPreset,
          event_title: (cachedActive ? cached?.event_title : parsed.event_title) || DEFAULT_THEME_SETTINGS.event_title,
          event_subtitle: (cachedActive ? cached?.event_subtitle : parsed.event_subtitle) || DEFAULT_THEME_SETTINGS.event_subtitle,
          event_promo_code: (cachedActive ? cached?.event_promo_code : parsed.event_promo_code) || DEFAULT_THEME_SETTINGS.event_promo_code,
          event_show_confetti: (cachedActive ? cached?.event_show_confetti : parsed.event_show_confetti) ?? true,
          event_show_modal: (cachedActive ? cached?.event_show_modal : parsed.event_show_modal) ?? true,
          event_timestamp: cached?.event_timestamp || Date.now()
        };

        return merged;
      }
    }
  } catch (err) {
    console.error('[fetchThemeSettings] Error:', err);
  }

  return cached || DEFAULT_THEME_SETTINGS;
};

/**
 * Save theme settings cleanly. Writes to local storage first, broadcasts to all sessions,
 * and attempts DB upsert.
 */
export const saveThemeSettings = async (settings: SeasonalEventSettings): Promise<SeasonalEventSettings> => {
  const fullSettings: SeasonalEventSettings = {
    ...settings,
    event_active: Boolean(settings.event_active),
    event_timestamp: Date.now()
  };

  // 1. Immediately update local storage (instant local persistence)
  localStorage.setItem('jamr_theme_settings', JSON.stringify(fullSettings));
  localStorage.setItem('jamr_app_settings', JSON.stringify(fullSettings));

  // 2. Broadcast immediately to all open client sessions
  try {
    await supabase.channel('jamr_realtime_channel').send({
      type: 'broadcast',
      event: 'theme_changed',
      payload: fullSettings
    });
    await supabase.channel('jamr_realtime_channel').send({
      type: 'broadcast',
      event: 'settings_changed',
      payload: fullSettings
    });
  } catch (bcErr) {}

  // 3. Schema-safe DB upsert
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

  const safePayload = {
    id: 1,
    popular_subtitle: updatedSub,
    event_active: fullSettings.event_active,
    updated_at: new Date().toISOString()
  };

  try {
    if (supabaseAdmin) {
      await supabaseAdmin.from('app_settings').upsert(safePayload);
    } else {
      await supabase.from('app_settings').upsert(safePayload);
    }
  } catch (err) {
    console.warn('[saveThemeSettings] DB upsert notice:', err);
  }

  return fullSettings;
};
