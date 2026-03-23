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
    if (dismissed && Date.now() - parseInt(dismissed) < 1000 * 60 * 60 * 24 * 7) { // 7 days
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
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 sm:pb-4 sm:p-6 pointer-events-none"
      >
        <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 p-5 pl-4 sm:p-6 pointer-events-auto relative overflow-hidden">
          
          <button 
            onClick={handleDismiss}
            className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-white/5 rounded-full transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col pr-12 text-right">
            <h3 className="font-extrabold text-lg text-gray-900 dark:text-white flex justify-end items-center gap-2">
              تثبيت المنيو <Download size={20} className="text-primary" />
            </h3>
            
            {isIOS ? (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                <p className="font-medium mb-3 relative z-10">
                  لوصول أسرع للوجبات، قم بتثبيت المنيو على شاشتك الرئيسية!
                </p>
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5 relative z-10">
                  <ol className="pr-4 space-y-3 font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-200">
                    <li className="flex items-center justify-end gap-3 text-right w-full">
                       اضغط على أيقونة المشاركة في المتصفح بالأسفل <Share size={16} className="text-blue-500 shrink-0" /> <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[10px] shrink-0 font-bold ml-1">1</span>
                    </li>
                    <li className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-white/10 text-right w-full">
                       اختر "إضافة للشاشة الرئيسية" <PlusSquare size={16} className="text-gray-900 dark:text-white shrink-0" /> <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[10px] shrink-0 font-bold ml-1">2</span>
                    </li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-4 relative z-10">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  لوصول أسرع للوجبات وتجربة أفضل، قم بتثبيت قائمة الطعام على جهازك!
                </p>
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-black py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5"
                >
                  تثبيت التطبيق الآن
                </button>
              </div>
            )}
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-400/5 rounded-full blur-2xl"></div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
