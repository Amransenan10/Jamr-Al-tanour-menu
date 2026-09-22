import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';

/**
 * Parse app_settings row from Supabase.
 * Native DB columns used as primary source.
 */
export const parseAppSettings = (data: any) => {
  if (!data) return {};

  // Start with raw DB row
  let parsed = { ...data };
  let extraConfig: any = null;

  // Extract CONFIG tag from announcement_text
  const subStr = data.announcement_text || '';
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

  return parsed;
};

export const fetchAppSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('[fetchAppSettings] Error:', error);
      return null;
    }

    return parseAppSettings(data);
  } catch (err) {
    console.error('[fetchAppSettings] Catch:', err);
    return null;
  }
};

export const saveAppSettings = async (settings: any) => {
  try {
    const payload = {
      id: 1,
      ...settings,
      updated_at: new Date().toISOString()
    };
    // Ensure nonexistent column popular_subtitle is not included
    delete payload.popular_subtitle;

    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .upsert(payload)
      .select();

    if (error) {
      console.error('[saveAppSettings] Admin upsert error:', error);
      const { data: anonData, error: anonError } = await supabase
        .from('app_settings')
        .upsert(payload)
        .select();

      if (anonError) {
        console.error('[saveAppSettings] Anon upsert error:', anonError);
        return false;
      }
      return true;
    }
    return true;
  } catch (err) {
    console.error('[saveAppSettings] Exception:', err);
    return false;
  }
};
