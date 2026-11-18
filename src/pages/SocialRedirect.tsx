import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2, ExternalLink, ArrowRight } from 'lucide-react';

interface PlatformInfo {
  name: string;
  field: string;
  icon: string;
  color: string;
  defaultPlaceholder?: string;
}

const PLATFORM_MAP: Record<string, PlatformInfo> = {
  // TikTok
  t: { name: 'تيك توك', field: 'social_tiktok', icon: '🎵', color: 'bg-black text-white' },
  tiktok: { name: 'تيك توك', field: 'social_tiktok', icon: '🎵', color: 'bg-black text-white' },
  
  // Instagram
  i: { name: 'انستغرام', field: 'social_instagram', icon: '📸', color: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white' },
  ig: { name: 'انستغرام', field: 'social_instagram', icon: '📸', color: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white' },
  instagram: { name: 'انستغرام', field: 'social_instagram', icon: '📸', color: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white' },
  insta: { name: 'انستغرام', field: 'social_instagram', icon: '📸', color: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white' },
  
  // Snapchat
  s: { name: 'سناب شات', field: 'social_snapchat', icon: '👻', color: 'bg-yellow-400 text-black' },
  snap: { name: 'سناب شات', field: 'social_snapchat', icon: '👻', color: 'bg-yellow-400 text-black' },
  snapchat: { name: 'سناب شات', field: 'social_snapchat', icon: '👻', color: 'bg-yellow-400 text-black' },
  
  // WhatsApp
  w: { name: 'واتساب', field: 'social_whatsapp', icon: '💬', color: 'bg-emerald-500 text-white' },
  wa: { name: 'واتساب', field: 'social_whatsapp', icon: '💬', color: 'bg-emerald-500 text-white' },
  whatsapp: { name: 'واتساب', field: 'social_whatsapp', icon: '💬', color: 'bg-emerald-500 text-white' },
  
  // Twitter / X
  x: { name: 'منصة X', field: 'social_twitter', icon: '𝕏', color: 'bg-zinc-900 text-white' },
  tw: { name: 'منصة X', field: 'social_twitter', icon: '𝕏', color: 'bg-zinc-900 text-white' },
  twitter: { name: 'منصة X', field: 'social_twitter', icon: '𝕏', color: 'bg-zinc-900 text-white' },
};

export const SocialRedirect: React.FC<{ platformKey?: string }> = ({ platformKey }) => {
  const { shortcut } = useParams<{ shortcut?: string }>();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'not_found'>('loading');
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  // Determine platform key from prop, param, or pathname
  const rawKey = (
    platformKey ||
    shortcut ||
    location.pathname.replace(/^\/+/, '').split('/')[0] ||
    ''
  ).toLowerCase().trim();

  const platform = PLATFORM_MAP[rawKey];

  useEffect(() => {
    if (!platform) {
      setStatus('not_found');
      return;
    }

    const resolveUrl = async () => {
      let finalUrl: string | null = null;

      // 1. Try local cache first for instant speed
      try {
        const cached = localStorage.getItem('jamr_app_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed[platform.field]) {
            finalUrl = parsed[platform.field];
          }
        }
      } catch (e) {}

      // 2. Fetch from Supabase if not found in cache
      if (!finalUrl) {
        try {
          const { data } = await supabase
            .from('app_settings')
            .select('*')
            .maybeSingle();

          if (data && data[platform.field]) {
            finalUrl = data[platform.field];
          }
        } catch (err) {
          console.error('Error resolving social redirect:', err);
        }
      }

      // Format WhatsApp number if needed
      if (finalUrl && platform.field === 'social_whatsapp') {
        const cleanPhone = finalUrl.replace(/\D/g, '');
        if (cleanPhone) {
          finalUrl = `https://wa.me/${cleanPhone}`;
        }
      }

      if (finalUrl && (finalUrl.startsWith('http://') || finalUrl.startsWith('https://'))) {
        setTargetUrl(finalUrl);
        setStatus('redirecting');
        // Small delay so user sees smooth transition, then redirect
        setTimeout(() => {
          window.location.replace(finalUrl as string);
        }, 300);
      } else {
        setStatus('not_found');
      }
    };

    resolveUrl();
  }, [rawKey, platform]);

  if (!platform || status === 'not_found') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mb-4">
          {platform ? platform.icon : '🔗'}
        </div>
        <h1 className="text-xl font-black mb-2 text-white">
          {platform ? `رابط ${platform.name} غير متوفر حالياً` : 'الرابط غير صحيح'}
        </h1>
        <p className="text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">
          {platform
            ? `لم يتم إضافة رابط حساب ${platform.name} في إعدادات المتجر بعد. يمكنك تعديله من لوحة الإدارة.`
            : 'الرابط المختصر المطلوب غير مسجل في النظام.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <a
            href="/"
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-2xl text-center text-sm transition-all shadow-lg shadow-primary/20"
          >
            الذهاب لقائمة الطعام 🍔
          </a>
          <a
            href="/admin"
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-gray-200 font-bold py-3 px-6 rounded-2xl text-center text-sm border border-white/5 transition-all"
          >
            لوحة الإدارة ⚙️
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center select-none" dir="rtl">
      <div className={`w-20 h-20 rounded-3xl ${platform.color} shadow-2xl flex items-center justify-center text-4xl mb-6 animate-bounce`}>
        {platform.icon}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Loader2 size={20} className="animate-spin text-primary" />
        <h1 className="text-xl font-black text-white">
          جاري تحويلك إلى {platform.name}...
        </h1>
      </div>

      <p className="text-sm text-gray-400 mb-6">
        مطعم جمر التنور يرحب بك 🌟
      </p>

      {targetUrl && (
        <a
          href={targetUrl}
          className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline bg-primary/10 px-4 py-2.5 rounded-xl border border-primary/20"
        >
          <ExternalLink size={14} />
          اضغط هنا إذا لم يتم نقلك تلقائياً
        </a>
      )}
    </div>
  );
};
