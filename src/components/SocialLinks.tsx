import React from 'react';

const TiktokIcon = ({ size = 20, className = "" }) => (
  <svg viewBox="0 0 448 512" width={size} height={size} className={className} fill="currentColor">
    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
  </svg>
);

const SnapchatIcon = ({ size = 20, className = "" }) => (
  <svg viewBox="0 0 448 512" width={size} height={size} className={className} fill="currentColor">
    <path d="M424.2 301.3c-4.4-6.3-22.3-25.7-65.4-36.9-6.3-1.6-13.8 2-16.7 8.3-2 4.1-1.2 9 2.2 12.3 22.3 22.3 24 45.4 24.3 49.3.4 5.9-2.9 11.2-8.3 13.5-13.7 5.7-41 12.5-62 10.7-3.9-.3-7.6-2.5-9.6-5.9-10.7-18.4-23.3-33-33.3-43.8-19.1-20.7-36.6-32.9-57-32.9s-37.9 12.2-57 32.9c-10 10.8-22.6 25.4-33.3 43.8-2 3.4-5.7 5.6-9.6 5.9-21 1.8-48.3-5-62-10.7-5.4-2.3-8.7-7.6-8.3-13.5.3-3.9 2-27 24.3-49.3 3.4-3.3 4.2-8.2 2.2-12.3-2.9-6.3-10.4-9.9-16.7-8.3-43.1 11.2-61 30.6-65.4 36.9-4.7 6.7-5 15.6-1 22.6 15 25.4 46.5 56.6 96.6 70.8 13.8 4 29.5 5.6 38.6 6.3 3.3.3 6.3 1.9 8.3 4.5l14 17.6c5.8 7.3 14.8 11.6 24.3 11.6s18.5-4.3 24.3-11.6l14.1-17.6c2-2.6 5-4.2 8.3-4.5 9.1-.7 24.8-2.3 38.6-6.3 50.1-14.2 81.6-45.4 96.6-70.8 4-7 3.7-15.9-1-22.6zm-126.9-119c-10.7-16-24-21.7-24-34 0-14 27.6-21.3 50.4-38 12.4-9.1 20-30.8 16.3-45C334 40.8 312.3 20 286 6.7 266.3-3.4 233.1-2 224 5c-9.1-7-42.3-8.3-62 1.7-26.3 13.3-48 34.1-54 58.6-3.7 14.3 3.9 36 16.3 45 22.8 16.7 50.4 24 50.4 38 0 12.3-13.3 18-24 34-11 16.6-13 42.1-4.7 66 5 14.4 15.7 6.6 22 1.4 6-5 13-9.5 22.1-13.5 10.5-4.5 23-7.5 33.9-7.5s23.4 3 33.9 7.5c9.1 4 16.1 8.5 22.1 13.5 6.3 5.3 17 13.1 22-1.4 8.3-23.9 6.3-49.4-4.7-66z" />
  </svg>
);

interface SocialLinksProps {
  instagram?: string | null;
  snapchat?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  whatsapp?: string | null;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({ instagram, snapchat, tiktok, twitter, whatsapp }) => {
  const formatWhatsappUrl = (number: string) => {
    // Basic cleanup: remove everything except digits
    const cleaned = number.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleaned}`;
  };

  const links = [
    { name: 'واتساب', url: whatsapp ? formatWhatsappUrl(whatsapp) : null, icon: '💬', color: 'bg-[#25D366] text-white', shadow: 'shadow-[#25D366]/30' },
    { name: 'انستجرام', url: instagram, icon: '📸', color: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white', shadow: 'shadow-[#dc2743]/30' },
    { name: 'سناب شات', url: snapchat, icon: <SnapchatIcon size={24} />, color: 'bg-[#FFFC00] text-black', shadow: 'shadow-[#FFFC00]/30' },
    { name: 'تيك توك', url: tiktok, icon: <TiktokIcon size={24} />, color: 'bg-black text-white dark:border dark:border-white/20', shadow: 'shadow-black/30' },
    { name: 'إكس (تويتر)', url: twitter, icon: '𝕏', color: 'bg-black text-white dark:border dark:border-white/20', shadow: 'shadow-black/30' },

  ].filter(link => link.url && link.url.trim().length > 0);

  if (links.length === 0) return null;

  return (
    <div className="pt-8 pb-32 flex flex-col items-center justify-center border-t border-gray-100 dark:border-white/5 mt-8 max-w-lg mx-auto w-full px-4">
      <h3 className="text-sm font-bold text-gray-500 mb-5 relative flex items-center justify-center w-full">
        <span className="bg-gray-100 dark:bg-zinc-800 h-[1px] flex-1"></span>
        <span className="px-4">تواصل معنا وتابع أحدث عروضنا</span>
        <span className="bg-gray-100 dark:bg-zinc-800 h-[1px] flex-1"></span>
      </h3>
      <div className="flex items-center gap-4 flex-wrap justify-center">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.url as string}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg hover:-translate-y-1 active:translate-y-0 transition-all ${link.color} ${link.shadow}`}
            title={link.name}
          >
            <span className="text-xl font-bold">{link.icon}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
