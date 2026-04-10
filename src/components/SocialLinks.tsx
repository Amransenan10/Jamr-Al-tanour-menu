import React from 'react';

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
    { name: 'سناب شات', url: snapchat, icon: '👻', color: 'bg-[#FFFC00] text-black', shadow: 'shadow-[#FFFC00]/30' },
    { name: 'تيك توك', url: tiktok, icon: '🎵', color: 'bg-black text-white dark:border dark:border-white/20', shadow: 'shadow-black/30' },
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
