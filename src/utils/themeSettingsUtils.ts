import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { SeasonalEventSettings, EventPreset } from '../types';

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
 */
export const fetchThemeSettings = async (): Promise<SeasonalEventSettings> => {
  try {
    // 1. Try dedicated 'event_settings' table first
    const { data: dedicatedData, error: dedicatedErr } = await supabaseAdmin
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

    // 2. Fallback to app_settings CONFIG tag
    const { data: appData } = await supabaseAdmin
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    const raw = appData || (await supabase.from('app_settings').select('*').eq('id', 1).maybeSingle()).data;
    if (raw) {
      const subStr = raw.popular_subtitle || raw.announcement_text || '';
      if (typeof subStr === 'string' && subStr.includes('[CONFIG:')) {
        const startIdx = subStr.indexOf('[CONFIG:') + 8;
        const endIdx = subStr.lastIndexOf(']');
        if (startIdx > 8 && endIdx > startIdx) {
          try {
            const extraConfig = JSON.parse(subStr.substring(startIdx, endIdx));
            return {
              event_active: Boolean(extraConfig.event_active),
              event_preset: extraConfig.event_preset || 'saudi_national_day',
              event_title: extraConfig.event_title || DEFAULT_THEME_SETTINGS.event_title,
              event_subtitle: extraConfig.event_subtitle || DEFAULT_THEME_SETTINGS.event_subtitle,
              event_promo_code: extraConfig.event_promo_code || DEFAULT_THEME_SETTINGS.event_promo_code,
              event_show_confetti: extraConfig.event_show_confetti ?? true,
              event_show_modal: extraConfig.event_show_modal ?? true,
              event_timestamp: extraConfig.event_timestamp || Date.now()
            };
          } catch (e) {}
        }
      }
      if (raw.event_active !== undefined) {
        return {
          event_active: Boolean(raw.event_active),
          event_preset: raw.event_preset || 'saudi_national_day',
          event_title: raw.event_title || DEFAULT_THEME_SETTINGS.event_title,
          event_subtitle: raw.event_subtitle || DEFAULT_THEME_SETTINGS.event_subtitle,
          event_promo_code: raw.event_promo_code || DEFAULT_THEME_SETTINGS.event_promo_code,
          event_show_confetti: raw.event_show_confetti ?? true,
          event_show_modal: raw.event_show_modal ?? true,
          event_timestamp: Date.now()
        };
      }
    }
  } catch (err) {
    console.error('[fetchThemeSettings] Error:', err);
  }

  // Fallback to local storage or defaults
  const cached = localStorage.getItem('jamr_theme_settings');
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }

  return DEFAULT_THEME_SETTINGS;
};

/**
 * Save theme settings cleanly. Writes to both event_settings table and app_settings fallback,
 * updates local storage, and broadcasts realtime event.
 */
export const saveThemeSettings = async (settings: SeasonalEventSettings): Promise<SeasonalEventSettings> => {
  const fullSettings: SeasonalEventSettings = {
    ...settings,
    event_active: Boolean(settings.event_active),
    event_timestamp: Date.now()
  };

  // 1. Try upserting to dedicated 'event_settings' table
  try {
    const payload = {
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
    };
    await supabaseAdmin.from('event_settings').upsert(payload);
  } catch (err) {
    console.warn('[saveThemeSettings] event_settings upsert error:', err);
  }

  // 2. Also save to app_settings CONFIG tag for complete backward compatibility
  try {
    const configTag = `[CONFIG:${JSON.stringify(fullSettings)}]`;
    const { data: rawApp } = await supabaseAdmin.from('app_settings').select('popular_subtitle').eq('id', 1).maybeSingle();
    const cleanSub = (rawApp?.popular_subtitle || '').replace(/\[CONFIG:[\s\S]*?\]/g, '').trim();
    const updatedSub = cleanSub ? `${cleanSub} ${configTag}` : configTag;

    await supabaseAdmin.from('app_settings').upsert({
      id: 1,
      popular_subtitle: updatedSub,
      event_active: fullSettings.event_active,
      event_preset: fullSettings.event_preset,
      event_title: fullSettings.event_title,
      event_subtitle: fullSettings.event_subtitle,
      event_promo_code: fullSettings.event_promo_code,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[saveThemeSettings] app_settings sync error:', err);
  }

  // 3. Cache locally
  localStorage.setItem('jamr_theme_settings', JSON.stringify(fullSettings));
  localStorage.setItem('jamr_app_settings', JSON.stringify(fullSettings));

  // 4. Realtime Broadcast
  try {
    await supabase.channel('jamr_realtime_channel').send({
      type: 'broadcast',
      event: 'settings_changed',
      payload: fullSettings
    });
    await supabase.channel('jamr_realtime_channel').send({
      type: 'broadcast',
      event: 'theme_changed',
      payload: fullSettings
    });
  } catch (bcErr) {}

  return fullSettings;
};
