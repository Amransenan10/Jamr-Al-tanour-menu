import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export const InstallPWA: React.FC = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  useEffect(() => {
    // Check if the prompt was dismissed recently
    const dismissed = localStorage.getItem('jamr_pwa_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 1000 * 60 * 60 * 24) { // 1 day
      return;
    }

    // Check if running in standalone (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      return;
    }

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    if (isIOSDevice) {
        setIsIOS(true);
        // Delay showing prompt slightly so it's not too aggressive
        setTimeout(() => setShowPrompt(true), 3000);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowPrompt(false);
    } else {
      console.log('User dismissed the install prompt');
      handleDismiss();
    }
    
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('jamr_pwa_dismissed', Date.now().toString());
  };

  if (!showPrompt || (!canInstall && !isIOS)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-40 pointer-events-none flex justify-center"
      >
        <div className="w-full max-w-[320px] bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 pointer-events-auto overflow-hidden flex flex-col">
          
          <div className="flex items-center justify-between p-3 px-4 border-b border-gray-100 dark:border-white/5">
             <button onClick={handleDismiss} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 dark:bg-white/5 rounded-full transition-colors">
               <X size={16} />
             </button>

             <div className="flex-1 flex flex-col items-end mr-3">
               <span className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                  تثبيت المنيو <Download size={14} className="text-primary" />
               </span>
               <span className="text-[10px] text-gray-500 font-bold">لوصول أسرع في المرة القادمة</span>
             </div>
          </div>

          <div className="px-4 py-3">
             {isIOS ? (
               <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                 <p className="text-[10px] text-gray-600 dark:text-gray-400 font-bold text-center mb-2.5 flex items-center justify-center">
                   في أجهزة آبل، اتبع الخطوتين لتثبيت التطبيق:
                 </p>
                 <div className="flex items-center justify-between gap-1.5 text-[10px] text-gray-700 dark:text-gray-300 font-black">
                   <div className="flex flex-col items-center gap-1.5 flex-1 text-center bg-white dark:bg-zinc-900 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-white/5">
                      <span className="w-4 h-4 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[9px] text-gray-500">2</span>
                      <span>إضافة للشاشة</span>
                      <PlusSquare size={14} className="text-gray-900 dark:text-white" />
                   </div>
                   <div className="text-gray-300 dark:text-gray-600 font-bold text-xs">⬅</div>
                   <div className="flex flex-col items-center gap-1.5 flex-1 text-center bg-white dark:bg-zinc-900 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-white/5">
                      <span className="w-4 h-4 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[9px] text-gray-500">1</span>
                      <span>زر المشاركة</span>
                      <Share size={14} className="text-blue-500" />
                   </div>
                 </div>
               </div>
             ) : (
               <button
                 onClick={handleInstallClick}
                 className="w-full bg-primary hover:bg-primary/90 text-white font-black py-2.5 px-4 rounded-xl transition-all shadow-md mt-1 active:scale-95 text-sm"
               >
                 تثبيت التطبيق الآن
               </button>
             )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
