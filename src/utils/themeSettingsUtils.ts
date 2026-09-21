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
 * Uses standard supabase client so it works for unauthenticated customer devices.
 */
export const fetchThemeSettings = async (): Promise<SeasonalEventSettings> => {
  try {
    // 1. Try dedicated 'event_settings' table if created
    const client = supabaseAdmin || supabase;
    const { data: dedicatedData, error: dedicatedErr } = await client
      .from('event_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!dedicatedErr && dedicatedData) {
      return {
        event_active: Boolean(dedicatedData.event_active),
        event_preset: (dedicatedData.event_preset as EventPreset) || 'saudi_national_day',
        event_title: dedicatedData.event_title || DEFAULT_THEME_SETTINGS.event_title,
        event_subtitle: dedicatedData.event_subtitle || DEFAULT_THEME_SETTINGS.event_subtitle,
        event_promo_code: dedicatedData.event_promo_code || DEFAULT_THEME_SETTINGS.event_promo_code,
        event_show_confetti: dedicatedData.event_show_confetti ?? true,
        event_show_modal: dedicatedData.event_show_modal ?? true,
        event_timestamp: dedicatedData.event_timestamp || Date.now()
      };
    }

    // 2. Fetch app_settings via standard client (accessible to all customers)
    const { data: appData } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (appData) {
      const parsed = parseAppSettings(appData);
      if (parsed && (parsed.event_active !== undefined || parsed.event_title)) {
        return {
          event_active: Boolean(parsed.event_active),
          event_preset: (parsed.event_preset as EventPreset) || 'saudi_national_day',
          event_title: parsed.event_title || DEFAULT_THEME_SETTINGS.event_title,
          event_subtitle: parsed.event_subtitle || DEFAULT_THEME_SETTINGS.event_subtitle,
          event_promo_code: parsed.event_promo_code || DEFAULT_THEME_SETTINGS.event_promo_code,
          event_show_confetti: parsed.event_show_confetti ?? true,
          event_show_modal: parsed.event_show_modal ?? true,
          event_timestamp: parsed.event_timestamp || Date.now()
        };
      }
    }
  } catch (err) {
    console.error('[fetchThemeSettings] Error:', err);
  }

  // 3. Fallback to local storage
  const cached = localStorage.getItem('jamr_theme_settings') || localStorage.getItem('jamr_app_settings');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && (parsed.event_title || parsed.event_active !== undefined)) {
        return parsed;
      }
    } catch (e) {}
  }

  return DEFAULT_THEME_SETTINGS;
};

/**
 * Save theme settings cleanly. Schema-safe: writes popular_subtitle with CONFIG tag to app_settings,
 * updates local storage, and broadcasts realtime event.
 */
export const saveThemeSettings = async (settings: SeasonalEventSettings): Promise<SeasonalEventSettings> => {
  const fullSettings: SeasonalEventSettings = {
    ...settings,
    event_active: Boolean(settings.event_active),
    event_timestamp: Date.now()
  };

  const configTag = `[CONFIG:${JSON.stringify(fullSettings)}]`;

  // 1. Get existing popular_subtitle
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

  // 2. Schema-safe upsert to app_settings (only standard columns, guaranteed to succeed)
  const safePayload = {
    id: 1,
    popular_subtitle: updatedSub,
    updated_at: new Date().toISOString()
  };

  let writeErr: any = null;
  if (supabaseAdmin) {
    const res = await supabaseAdmin.from('app_settings').upsert(safePayload);
    writeErr = res.error;
  }
  if (!supabaseAdmin || writeErr) {
    await supabase.from('app_settings').upsert(safePayload);
  }

  // 3. Try dedicated event_settings table if available
  try {
    const client = supabaseAdmin || supabase;
    await client.from('event_settings').upsert({
      id: 1,
      event_active: fullSettings.event_active,
      event_preset: fullSettings.event_preset,
      event_title: fullSettings.event_title,
      event_subtitle: fullSettings.event_subtitle,
      event_promo_code: fullSettings.event_promo_code,
      event_show_confetti: fullSettings.event_show_confetti,
      event_show_modal: fullSettings.event_show_modal,
      event_timestamp: fullSettings.event_timestamp,
      updated_at: new Date().toISOString()
    });
  } catch (e) {}

  // 4. Update local cache
  localStorage.setItem('jamr_theme_settings', JSON.stringify(fullSettings));
  localStorage.setItem('jamr_app_settings', JSON.stringify(fullSettings));

  // 5. Broadcast to all active client devices
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

  return fullSettings;
};
