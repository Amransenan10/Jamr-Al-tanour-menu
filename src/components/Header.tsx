import React from 'react';
import { Search, Moon, Sun, MapPin, ShoppingCart, ChevronDown, User, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { Branch } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface HeaderProps {
  selectedBranch: Branch | null;
  onBranchChange: (branch: Branch) => void;
  onCartOpen: () => void;
  onSearch: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedBranch,
  onBranchChange,
  onCartOpen,
  onSearch,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { totalItems } = useCart();
  const [isBranchMenuOpen, setIsBranchMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-charcoal/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden border border-gray-100 dark:border-white/10 p-1">
              <img src="/assets/logo.png" alt="جمر التنور" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-primary leading-tight">جمر التنور</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">يستقبل الطلبات</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/my-orders"
              title="طلباتي السابقة"
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              <FileText size={20} />
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Search & Branch */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ابحث عن وجبتك المفضلة..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-gray-100 dark:bg-white/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
              className="w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-100 dark:bg-white/5 rounded-2xl text-sm font-medium text-gray-700 dark:text-gray-200"
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
