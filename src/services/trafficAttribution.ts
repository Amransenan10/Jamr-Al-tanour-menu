/**
 * Traffic Attribution & UTM Tracking Service for Jamr Al Tanour
 * Identifies where each customer came from (TikTok, Snapchat, Instagram, Google Maps, Table QR, etc.)
 * Persists attribution across sessions and embeds source tags in orders.
 */

export interface TrafficData {
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  tableNumber?: string;
  clickId?: string;
  referrer: string;
  landingPage: string;
  firstVisitAt: string;
  lastVisitAt: string;
}

const STORAGE_TRAFFIC_KEY = 'jamr_traffic_attribution';

/** Normalize raw platform strings to clean Arabic & English names */
export const normalizePlatformName = (rawSource: string, referrer: string = ''): string => {
  const s = (rawSource || '').toLowerCase().trim();
  const ref = (referrer || '').toLowerCase().trim();

  // Explicit table QR code
  if (s.startsWith('table_') || s.startsWith('qr_') || s === 'table' || s === 'qr') {
    return 'طاولة بالمطعم (QR)';
  }

  // TikTok
  if (s.includes('tiktok') || s.includes('tik_tok') || s === 'tt' || ref.includes('tiktok.com')) {
    return 'تيك توك (TikTok)';
  }

  // Snapchat
  if (s.includes('snapchat') || s.includes('snap') || s === 'sc' || ref.includes('snapchat.com')) {
    return 'سناب شات (Snapchat)';
  }

  // Meta (Instagram / Facebook)
  if (s.includes('instagram') || s.includes('insta') || s === 'ig' || ref.includes('instagram.com')) {
    return 'إنستغرام (Instagram)';
  }
  if (s.includes('facebook') || s.includes('fb') || s.includes('meta') || ref.includes('facebook.com')) {
    return 'فيسبوك / ميتا (Meta)';
  }

  // Google / Maps
  if (s.includes('google_maps') || s.includes('maps') || s.includes('gmb')) {
    return 'خرائط قوقل (Google Maps)';
  }
  if (s.includes('google') || s.includes('gads') || ref.includes('google.com') || ref.includes('google.sa')) {
    return 'إعلانات قوقل (Google Ads)';
  }

  // WhatsApp
  if (s.includes('whatsapp') || s.includes('wa') || ref.includes('whatsapp.com')) {
    return 'واتساب (WhatsApp)';
  }

  // X / Twitter
  if (s.includes('twitter') || s === 'x' || ref.includes('t.co') || ref.includes('x.com')) {
    return 'منصة إكس (X / Twitter)';
  }

  if (rawSource && rawSource.trim().length > 0) {
    return rawSource.trim();
  }

  return 'زيارة مباشرة (Direct)';
};

/** Initialize and capture traffic parameters on initial arrival */
export const captureTrafficAttribution = (): TrafficData => {
  if (typeof window === 'undefined') {
    return {
      source: 'Direct',
      referrer: '',
      landingPage: '/',
      firstVisitAt: new Date().toISOString(),
      lastVisitAt: new Date().toISOString()
    };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const now = new Date().toISOString();

  // Check URL parameters
  const utmSource = urlParams.get('utm_source') || urlParams.get('source') || urlParams.get('src') || urlParams.get('ref') || '';
  const utmMedium = urlParams.get('utm_medium') || urlParams.get('medium') || '';
  const utmCampaign = urlParams.get('utm_campaign') || urlParams.get('campaign') || '';
  const utmContent = urlParams.get('utm_content') || '';
  const utmTerm = urlParams.get('utm_term') || '';
  const table = urlParams.get('table') || urlParams.get('t') || '';
  const clickId = urlParams.get('fbclid') || urlParams.get('ttclid') || urlParams.get('sclick') || urlParams.get('gclid') || '';
  const referrer = document.referrer || '';
  const landingPage = window.location.pathname + window.location.search;

  // Retrieve existing attribution from storage
  let existingData: TrafficData | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_TRAFFIC_KEY);
    if (raw) existingData = JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading traffic attribution cache', e);
  }

  // If new incoming campaign parameters exist, record as new touchpoint
  if (utmSource || table || clickId || (!existingData && referrer)) {
    const rawSource = table ? `table_${table}` : utmSource;
    const cleanSource = normalizePlatformName(rawSource, referrer);

    const newAttribution: TrafficData = {
      source: cleanSource,
      medium: utmMedium || (table ? 'qr_scan' : (clickId ? 'paid_ad' : (referrer ? 'referral' : 'organic'))),
      campaign: utmCampaign || (table ? `طاولة ${table}` : undefined),
      content: utmContent || undefined,
      term: utmTerm || undefined,
      tableNumber: table || undefined,
      clickId: clickId || undefined,
      referrer,
      landingPage,
      firstVisitAt: existingData?.firstVisitAt || now,
      lastVisitAt: now
    };

    try {
      localStorage.setItem(STORAGE_TRAFFIC_KEY, JSON.stringify(newAttribution));
    } catch (e) {}

    return newAttribution;
  }

  // Return existing or default direct
  if (existingData) {
    existingData.lastVisitAt = now;
    try {
      localStorage.setItem(STORAGE_TRAFFIC_KEY, JSON.stringify(existingData));
    } catch (e) {}
    return existingData;
  }

  const directAttribution: TrafficData = {
    source: normalizePlatformName('', referrer),
    referrer,
    landingPage,
    firstVisitAt: now,
    lastVisitAt: now
  };

  try {
    localStorage.setItem(STORAGE_TRAFFIC_KEY, JSON.stringify(directAttribution));
  } catch (e) {}

  return directAttribution;
};

/** Get the current saved attribution data */
export const getSavedTrafficAttribution = (): TrafficData => {
  if (typeof window === 'undefined') {
    return {
      source: 'Direct',
      referrer: '',
      landingPage: '/',
      firstVisitAt: new Date().toISOString(),
      lastVisitAt: new Date().toISOString()
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_TRAFFIC_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return captureTrafficAttribution();
};

/** Format attribution tag to safely append to order notes without schema breaks */
export const formatTrafficTagForOrderNotes = (): string => {
  const data = getSavedTrafficAttribution();
  const parts: string[] = [];

  if (data.source) parts.push(`SRC:${data.source}`);
  if (data.campaign) parts.push(`CAMP:${data.campaign}`);
  if (data.tableNumber) parts.push(`TBL:${data.tableNumber}`);

  return parts.length > 0 ? `[TRAFFIC:${parts.join('|')}]` : '';
};

/** Parse source from order notes or order object */
export const parseTrafficSourceFromOrder = (order: any): { source: string; campaign?: string; tableNumber?: string } => {
  if (!order) return { source: 'غير محدد' };

  if (order.traffic_source) {
    return {
      source: order.traffic_source,
      campaign: order.traffic_campaign,
      tableNumber: order.table_number
    };
  }

  const notes = String(order.notes || '');
  const match = notes.match(/\[TRAFFIC:([^\]]+)\]/);
  if (match && match[1]) {
    const raw = match[1];
    let src = 'غير محدد';
    let camp: string | undefined = undefined;
    let tbl: string | undefined = undefined;

    raw.split('|').forEach(part => {
      if (part.startsWith('SRC:')) src = part.substring(4);
      else if (part.startsWith('CAMP:')) camp = part.substring(5);
      else if (part.startsWith('TBL:')) tbl = part.substring(4);
    });

    return { source: src, campaign: camp, tableNumber: tbl };
  }

  // Check legacy format
  const sourceMatch = notes.match(/\[SOURCE:([^\]]+)\]/);
  if (sourceMatch && sourceMatch[1]) {
    return { source: sourceMatch[1] };
  }

  return { source: 'زيارة مباشرة (Direct)' };
};
