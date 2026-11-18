import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2, ExternalLink, UtensilsCrossed } from 'lucide-react';

interface PlatformConfig {
  name: string;
  field: string;
  icon: string;
  badgeBg: string;
  buildUrl: (raw: string) => string;
}

const PLATFORMS: Record<string, PlatformConfig> = {
  // Instagram
  i: {
    name: 'إنستغرام',
    field: 'social_instagram',
    icon: '📸',
    badgeBg: 'from-amber-500 via-rose-500 to-purple-600',
    buildUrl: (raw) => {
      const clean = raw.trim().replace(/^@/, '');
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      return `https://www.instagram.com/${clean}`;
    }
  },
  ig: {
    name: 'إنستغرام',
    field: 'social_instagram',
    icon: '📸',
    badgeBg: 'from-amber-500 via-rose-500 to-purple-600',
    buildUrl: (raw) => PLATFORMS.i.buildUrl(raw)
  },
  insta: {
    name: 'إنستغرام',
    field: 'social_instagram',
    icon: '📸',
    badgeBg: 'from-amber-500 via-rose-500 to-purple-600',
    buildUrl: (raw) => PLATFORMS.i.buildUrl(raw)
  },
  instagram: {
    name: 'إنستغرام',
    field: 'social_instagram',
    icon: '📸',
    badgeBg: 'from-amber-500 via-rose-500 to-purple-600',
    buildUrl: (raw) => PLATFORMS.i.buildUrl(raw)
  },

  // TikTok
  t: {
    name: 'تيك توك',
    field: 'social_tiktok',
    icon: '🎵',
    badgeBg: 'from-zinc-900 to-black border border-white/20',
    buildUrl: (raw) => {
      const clean = raw.trim();
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      const handle = clean.startsWith('@') ? clean : `@${clean}`;
      return `https://www.tiktok.com/${handle}`;
    }
  },
  tt: {
    name: 'تيك توك',
    field: 'social_tiktok',
    icon: '🎵',
    badgeBg: 'from-zinc-900 to-black border border-white/20',
    buildUrl: (raw) => PLATFORMS.t.buildUrl(raw)
  },
  tiktok: {
    name: 'تيك توك',
    field: 'social_tiktok',
    icon: '🎵',
    badgeBg: 'from-zinc-900 to-black border border-white/20',
    buildUrl: (raw) => PLATFORMS.t.buildUrl(raw)
  },

  // Snapchat
  s: {
    name: 'سناب شات',
    field: 'social_snapchat',
    icon: '👻',
    badgeBg: 'from-yellow-400 to-amber-500 text-black',
    buildUrl: (raw) => {
      const clean = raw.trim().replace(/^@/, '');
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      return `https://www.snapchat.com/add/${clean}`;
    }
  },
  sc: {
    name: 'سناب شات',
    field: 'social_snapchat',
    icon: '👻',
    badgeBg: 'from-yellow-400 to-amber-500 text-black',
    buildUrl: (raw) => PLATFORMS.s.buildUrl(raw)
  },
  snap: {
    name: 'سناب شات',
    field: 'social_snapchat',
    icon: '👻',
    badgeBg: 'from-yellow-400 to-amber-500 text-black',
    buildUrl: (raw) => PLATFORMS.s.buildUrl(raw)
  },
  snapchat: {
    name: 'سناب شات',
    field: 'social_snapchat',
    icon: '👻',
    badgeBg: 'from-yellow-400 to-amber-500 text-black',
    buildUrl: (raw) => PLATFORMS.s.buildUrl(raw)
  },

  // WhatsApp
  w: {
    name: 'واتساب',
    field: 'social_whatsapp',
    icon: '💬',
    badgeBg: 'from-emerald-500 to-green-600',
    buildUrl: (raw) => {
      let digits = raw.trim().replace(/\D/g, '');
      if (digits.startsWith('05')) digits = '966' + digits.substring(1);
      else if (digits.startsWith('5')) digits = '966' + digits;
      return `https://wa.me/${digits}`;
    }
  },
  wa: {
    name: 'واتساب',
    field: 'social_whatsapp',
    icon: '💬',
    badgeBg: 'from-emerald-500 to-green-600',
    buildUrl: (raw) => PLATFORMS.w.buildUrl(raw)
  },
  whatsapp: {
    name: 'واتساب',
    field: 'social_whatsapp',
    icon: '💬',
    badgeBg: 'from-emerald-500 to-green-600',
    buildUrl: (raw) => PLATFORMS.w.buildUrl(raw)
  },

  // Twitter / X
  x: {
    name: 'منصة X',
    field: 'social_twitter',
    icon: '𝕏',
    badgeBg: 'from-zinc-900 to-black border border-white/20',
    buildUrl: (raw) => {
      const clean = raw.trim().replace(/^@/, '');
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      return `https://x.com/${clean}`;
    }
  },
  tw: {
    name: 'منصة X',
    field: 'social_twitter',
    icon: '𝕏',
    badgeBg: 'from-zinc-900 to-black border border-white/20',
    buildUrl: (raw) => PLATFORMS.x.buildUrl(raw)
  },
  twitter: {
    name: 'منصة X',
    field: 'social_twitter',
    icon: '𝕏',
    badgeBg: 'from-zinc-900 to-black border border-white/20',
    buildUrl: (raw) => PLATFORMS.x.buildUrl(raw)
  },

  // Google Maps
  g: {
    name: 'موقع المطعم على الخريطة',
    field: 'restaurant_location',
    icon: '📍',
    badgeBg: 'from-emerald-600 to-teal-700',
    buildUrl: (raw) => {
      if (raw && (raw.startsWith('http://') || raw.startsWith('https://'))) return raw;
      return 'https://www.google.com/maps/search/?api=1&query=مطعم+جمر+التنور';
    }
  },
  maps: {
    name: 'موقع المطعم على الخريطة',
    field: 'restaurant_location',
    icon: '📍',
    badgeBg: 'from-emerald-600 to-teal-700',
    buildUrl: (raw) => PLATFORMS.g.buildUrl(raw)
  }
};

export const SocialRedirect: React.FC<{ platformKey?: string }> = ({ platformKey }) => {
  const location = useLocation();
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(true);

  // Extract path segment (e.g. "t", "i", "s", "tiktok", "instagram")
  const key = (
    platformKey ||
    location.pathname.replace(/^\/+/, '').split('/')[0] ||
    ''
  ).toLowerCase().trim();

  const platform = PLATFORMS[key] || {
    name: 'حساب التواصل',
    field: 'social_' + key,
    icon: '🔗',
    badgeBg: 'from-primary to-amber-600',
    buildUrl: (r: string) => r
  };

  useEffect(() => {
    let isCancelled = false;

    const findTarget = async () => {
      let rawValue: string | null = null;

      // 1. Check local storage cache
      try {
        const cached = localStorage.getItem('jamr_app_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed[platform.field]) {
            rawValue = parsed[platform.field];
          }
        }
      } catch (e) {}

      // 2. Fetch from Supabase
      if (!rawValue) {
        try {
          const { data } = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

          if (data && data[platform.field]) {
            rawValue = data[platform.field];
          }
        } catch (err) {
          console.error('Error fetching social setting:', err);
        }
      }

      if (isCancelled) return;

      if (rawValue && rawValue.trim()) {
        const finalUrl = platform.buildUrl(rawValue);
        setResolvedUrl(finalUrl);
        setIsSearching(false);
        // Instant redirect
        window.location.replace(finalUrl);
      } else if (key === 'g' || key === 'maps') {
        const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=مطعم+جمر+التنور';
        setResolvedUrl(mapsUrl);
        setIsSearching(false);
        window.location.replace(mapsUrl);
      } else {
        setIsSearching(false);
      }
    };

    findTarget();

    return () => {
      isCancelled = true;
    };
  }, [key, platform]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center select-none" dir="rtl">
      <div className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${platform.badgeBg} shadow-2xl flex items-center justify-center text-4xl mb-6 shadow-amber-500/20`}>
        {platform.icon}
      </div>

      <div className="flex items-center gap-2 mb-2">
        {isSearching && <Loader2 size={20} className="animate-spin text-primary" />}
        <h1 className="text-xl font-black text-white">
          {resolvedUrl ? `جاري نقلك إلى ${platform.name}...` : isSearching ? `جاري الاتصال بـ ${platform.name}...` : `رابط ${platform.name}`}
        </h1>
      </div>

      <p className="text-sm text-gray-400 mb-6">
        مطعم جمر التنور يرحب بك 🌟
      </p>

      {resolvedUrl ? (
        <a
          href={resolvedUrl}
          className="inline-flex items-center gap-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 transition-all"
        >
          <ExternalLink size={16} />
          <span>انقر هنا إذا لم يتم نقلك تلقائياً</span>
        </a>
      ) : !isSearching ? (
        <div className="bg-zinc-900 border border-white/10 p-5 rounded-2xl max-w-sm w-full space-y-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            لم يتم ضبط رابط حساب {platform.name} بعد في إعدادات المتجر. يمكنك تعيينه من لوحة الإدارة.
          </p>
          <div className="flex gap-2">
            <a
              href="/"
              className="flex-1 py-2.5 px-4 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <UtensilsCrossed size={14} />
              <span>قائمة الطعام</span>
            </a>
            <a
              href="/admin"
              className="flex-1 py-2.5 px-4 bg-zinc-800 text-gray-300 rounded-xl text-xs font-bold flex items-center justify-center"
            >
              <span>لوحة الإدارة</span>
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
};
