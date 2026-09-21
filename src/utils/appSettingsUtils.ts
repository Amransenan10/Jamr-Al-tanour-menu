import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';

export const parseAppSettings = (data: any) => {
  if (!data) return {};
  let parsed = { ...data };

  // Extract config JSON from popular_subtitle or announcement_text tag
  const subStr = data.popular_subtitle || data.announcement_text || '';
  if (typeof subStr === 'string' && subStr.includes('[CONFIG:')) {
    const startIdx = subStr.indexOf('[CONFIG:') + 8;
    const endIdx = subStr.lastIndexOf(']');
    if (startIdx > 8 && endIdx > startIdx) {
      const jsonStr = subStr.substring(startIdx, endIdx);
      try {
        const extraConfig = JSON.parse(jsonStr);
        // Merge extraConfig over raw DB columns
        parsed = { ...parsed, ...extraConfig };
      } catch (e) {
        console.error('Error parsing config tag JSON:', e);
      }
    }
  }

  // Clean popular_subtitle to remove the config tag string for display
  if (typeof parsed.popular_subtitle === 'string') {
    parsed.popular_subtitle = parsed.popular_subtitle.replace(/\[CONFIG:[\s\S]*?\]/, '').trim();
  }

  // Guarantee clear boolean defaults
  parsed.announcement_active = parsed.announcement_active === undefined ? true : Boolean(parsed.announcement_active);
  parsed.offers_active = parsed.offers_active === undefined ? true : Boolean(parsed.offers_active);
  parsed.wheel_active = parsed.wheel_active === undefined ? true : Boolean(parsed.wheel_active);
  parsed.event_active = parsed.event_active === undefined ? false : Boolean(parsed.event_active);
  parsed.event_show_confetti = parsed.event_show_confetti === undefined ? true : Boolean(parsed.event_show_confetti);
  parsed.event_show_modal = parsed.event_show_modal === undefined ? true : Boolean(parsed.event_show_modal);

  return parsed;
};

export const saveAppSettings = async (newPartial: Record<string, any>) => {
  // 1. Get current cached or DB settings first to merge and prevent losing any settings
  let currentSettings: any = {};
  const savedLocal = localStorage.getItem('jamr_app_settings');
  if (savedLocal) {
    try {
      currentSettings = JSON.parse(savedLocal);
    } catch {}
  }

  // Also try to read fresh from DB to be super safe
  try {
    const { data: dbData } = await supabase.from('app_settings').select('*').eq('id', 1).maybeSingle();
    if (dbData) {
      const parsedDb = parseAppSettings(dbData);
      currentSettings = { ...currentSettings, ...parsedDb };
    }
  } catch (err) {
    console.warn('Could not fetch app_settings during save, relying on cache/partial:', err);
  }

  // 2. Merge everything into unified object
  const merged = { ...currentSettings, ...newPartial };

  // Ensure boolean types
  merged.announcement_active = Boolean(merged.announcement_active);
  merged.offers_active = Boolean(merged.offers_active);
  merged.wheel_active = Boolean(merged.wheel_active);
  merged.event_active = Boolean(merged.event_active);
  merged.event_show_confetti = Boolean(merged.event_show_confetti);
  merged.event_show_modal = Boolean(merged.event_show_modal);

  // 3. Create full config tag representing ALL dynamic settings
  const configObject = {
    announcement_active: merged.announcement_active,
    offers_active: merged.offers_active,
    wheel_active: merged.wheel_active,
    wheel_title: merged.wheel_title || 'عجلة الحظ والجوائز',
    wheel_prizes: merged.wheel_prizes,
    event_active: merged.event_active,
    event_preset: merged.event_preset || 'saudi_national_day',
    event_title: merged.event_title || 'اليوم الوطني السعودي 🇸🇦',
    event_subtitle: merged.event_subtitle || 'نحتفل معكم باليوم الوطني! استمتع بأشهى الأطباق بخصم حصري ومميز',
    event_promo_code: merged.event_promo_code || 'SAUDI',
    event_show_confetti: merged.event_show_confetti,
    event_show_modal: merged.event_show_modal,
    event_timestamp: merged.event_timestamp || Date.now()
  };

  const configTag = `[CONFIG:${JSON.stringify(configObject)}]`;
  const cleanSub = (merged.popular_subtitle || '').replace(/\[CONFIG:[\s\S]*?\]/g, '').trim();
  const updatedSub = cleanSub ? `${cleanSub} ${configTag}` : configTag;

  // 4. Construct DB payload (including native columns AND fallback popular_subtitle)
  const fullPayload: any = {
    id: 1,
    announcement_text: merged.announcement_text || '',
    announcement_active: merged.announcement_active,
    popular_title: merged.popular_title || '',
    popular_subtitle: updatedSub,
    offers_title: merged.offers_title || '',
    offers_active: merged.offers_active,
    event_active: merged.event_active,
    event_preset: configObject.event_preset,
    event_title: configObject.event_title,
    event_subtitle: configObject.event_subtitle,
    event_promo_code: configObject.event_promo_code,
    event_show_confetti: configObject.event_show_confetti,
    event_show_modal: configObject.event_show_modal,
    updated_at: new Date().toISOString()
  };

  // Upsert into Supabase (Admin client first, then anon client as fallback)
  let res = await supabaseAdmin.from('app_settings').upsert(fullPayload);
  if (res.error) {
    console.warn('Admin upsert app_settings failed, trying anon client:', res.error);
    res = await supabase.from('app_settings').upsert(fullPayload);
  }

  // If column missing in DB (e.g. event_active column doesn't exist yet in PostgreSQL schema), retry with standard schema payload
  if (res.error) {
    console.warn('Full payload upsert failed (likely missing columns), falling back to standard schema payload:', res.error);
    const safePayload = {
      id: 1,
      announcement_text: merged.announcement_text || '',
      announcement_active: merged.announcement_active,
      popular_title: merged.popular_title || '',
      popular_subtitle: updatedSub,
      offers_title: merged.offers_title || '',
      offers_active: merged.offers_active,
      updated_at: new Date().toISOString()
    };
    res = await supabaseAdmin.from('app_settings').upsert(safePayload);
    if (res.error) {
      res = await supabase.from('app_settings').upsert(safePayload);
    }
  }

  // 5. Update local cache
  localStorage.setItem('jamr_app_settings', JSON.stringify(merged));

  // 6. Broadcast realtime update to ALL active sessions / customer devices instantly
  try {
    const channel = supabase.channel('jamr_realtime_channel');
    await channel.send({
      type: 'broadcast',
      event: 'settings_changed',
      payload: merged
    });
  } catch (bcErr) {
    console.warn('Realtime broadcast error:', bcErr);
  }

  return merged;
};
