import React from 'react';
import { Search, Moon, Sun, MapPin, ShoppingCart, ChevronDown, User, FileText, Menu, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { Branch, SeasonalEventSettings } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { getPresetDetails } from './SeasonalEventOverlay';

interface HeaderProps {
  selectedBranch: Branch | null;
  onBranchChange: (branch: Branch) => void;
  onCartOpen: () => void;
  onSearch: (query: string) => void;
  onSideMenuOpen: () => void;
  logoUrl?: string;
  eventSettings?: SeasonalEventSettings;
}

export const Header: React.FC<HeaderProps> = ({
  selectedBranch,
  onBranchChange,
  onCartOpen,
  onSearch,
  onSideMenuOpen,
  logoUrl,
  eventSettings
}) => {
  const { theme, toggleTheme } = useTheme();
  const { totalItems } = useCart();
  const [isBranchMenuOpen, setIsBranchMenuOpen] = React.useState(false);

  const isEventActive = Boolean(eventSettings?.event_active);
  const presetDetails = isEventActive ? getPresetDetails(eventSettings?.event_preset) : null;

  return (
    <header className={cn(
      "sticky top-0 z-40 backdrop-blur-md transition-all border-b",
      isEventActive 
        ? `bg-gradient-to-r ${presetDetails?.colors.gradient || 'from-emerald-950 via-zinc-900 to-emerald-950'} text-white border-b border-white/10 shadow-lg`
        : "bg-white/80 dark:bg-charcoal/80 border-gray-100 dark:border-white/5"
    )}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Name */}
          <div className="flex items-center gap-3 w-1/2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 shadow-sm border border-white/10 bg-black/20">
              <img
                src={logoUrl || '/assets/logo.png'}
                alt="جمر التنور"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-primary leading-tight">جمر التنور</h1>
                {isEventActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                    <span>{presetDetails?.icon || '🇸🇦'}</span>
                    <span className="hidden xs:inline">{eventSettings?.event_title || presetDetails?.badge}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className={cn(
                  "text-[10px] font-medium",
                  isEventActive ? "text-emerald-200/80" : "text-gray-500 dark:text-gray-400"
                )}>
                  يستقبل الطلبات
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 w-1/2">
            <button
              onClick={onSideMenuOpen}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors font-bold text-sm",
                isEventActive
                  ? "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                  : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10"
              )}
            >
              <Menu size={20} />
              <span>القائمة</span>
            </button>
            <button
              onClick={toggleTheme}
              className={cn(
                "p-2.5 rounded-xl transition-colors",
                isEventActive
                  ? "bg-white/10 hover:bg-white/20 text-amber-300 border border-white/10"
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
              )}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Search & Branch */}
        <div className="mt-3.5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ابحث عن وجبتك المفضلة..."
              onChange={(e) => onSearch(e.target.value)}
              className={cn(
                "w-full pr-10 pl-4 py-2.5 rounded-2xl text-sm transition-all outline-none border-none",
                isEventActive
                  ? "bg-black/30 focus:ring-2 focus:ring-emerald-400/50 text-white placeholder:text-gray-400"
                  : "bg-gray-100 dark:bg-white/5 focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white"
              )}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
              className={cn(
                "w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors",
                isEventActive
                  ? "bg-black/30 text-white border border-white/10 hover:bg-black/40"
                  : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200"
              )}
            >
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                <span>{selectedBranch ? `فرع ${selectedBranch}` : 'اختر الفرع'}</span>
              </div>
              <ChevronDown size={16} className={cn("transition-transform", isBranchMenuOpen && "rotate-180")} />
            </button>

            {isBranchMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden z-50"
              >
                {(['السويدي الغربي', 'طويق'] as Branch[]).map((branch) => (
                  <button
                    key={branch}
                    onClick={() => {
                      onBranchChange(branch);
                      setIsBranchMenuOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-right text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors",
                      selectedBranch === branch && "text-primary font-bold bg-primary/5"
                    )}
                  >
                    فرع {branch}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
