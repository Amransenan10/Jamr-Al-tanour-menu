import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface AdTrackingConfig {
  source: string;
  campaign: string;
  label: string;
  icon: string;
}

const SHORTLINK_MAP: Record<string, AdTrackingConfig> = {
  t: { source: 'tiktok', campaign: 'ad1', label: 'تيك توك', icon: '🎵' },
  tiktok: { source: 'tiktok', campaign: 'ad1', label: 'تيك توك', icon: '🎵' },
  s: { source: 'snapchat', campaign: 'ad1', label: 'سناب شات', icon: '👻' },
  snap: { source: 'snapchat', campaign: 'ad1', label: 'سناب شات', icon: '👻' },
  snapchat: { source: 'snapchat', campaign: 'ad1', label: 'سناب شات', icon: '👻' },
  i: { source: 'instagram', campaign: 'bio', label: 'إنستغرام', icon: '📸' },
  ig: { source: 'instagram', campaign: 'bio', label: 'إنستغرام', icon: '📸' },
  instagram: { source: 'instagram', campaign: 'bio', label: 'إنستغرام', icon: '📸' },
  g: { source: 'google_maps', campaign: 'maps', label: 'خرائط جوجل', icon: '📍' },
  maps: { source: 'google_maps', campaign: 'maps', label: 'خرائط جوجل', icon: '📍' },
  w: { source: 'whatsapp', campaign: 'chat', label: 'واتساب', icon: '💬' },
  wa: { source: 'whatsapp', campaign: 'chat', label: 'واتساب', icon: '💬' },
};

export const AdTrackingRedirect: React.FC<{ channelKey?: string }> = ({ channelKey }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const rawKey = (
    channelKey ||
    location.pathname.replace(/^\/+/, '').split('/')[0] ||
    ''
  ).toLowerCase().trim();

  const config = SHORTLINK_MAP[rawKey] || { source: rawKey, campaign: 'shortcut', label: rawKey, icon: '🔗' };

  useEffect(() => {
    try {
      // 1. Record traffic attribution in localStorage so any order placed is tagged with this source
      const attribution = {
        source: config.source,
        medium: 'cpc',
        campaign: config.campaign,
        referrer: document.referrer || '',
        landingPage: location.pathname,
        firstVisitAt: new Date().toISOString(),
        lastVisitAt: new Date().toISOString()
      };
      localStorage.setItem('jamr_traffic_attribution', JSON.stringify(attribution));
    } catch (e) {
      console.warn('Could not store traffic attribution:', e);
    }

    // 2. Redirect cleanly to the menu without long query strings that trigger antivirus false-positives
    navigate('/', { replace: true });
  }, [config, navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mb-4 animate-pulse">
        {config.icon}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Loader2 size={18} className="animate-spin text-primary" />
        <p className="text-base font-black text-white">
          جاري فتح منيو جمر التنور عبر {config.label}...
        </p>
      </div>
      <p className="text-xs text-gray-400">أهلاً بك! يتم تسجيل التتبع وتجهيز قائمة الطعام...</p>
    </div>
  );
};
