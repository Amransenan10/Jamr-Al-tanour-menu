import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, ArrowRight } from 'lucide-react';
import { Branch } from '../types';

interface BranchSelectorModalProps {
  onSelect: (branch: Branch) => void;
  isOpen: boolean;
}

export const BranchSelectorModal: React.FC<BranchSelectorModalProps> = ({ onSelect, isOpen }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal p-4 sm:p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5 pointer-events-none" />
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[3rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="relative text-center space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 mx-auto mb-6 transform -rotate-6">
                  <span className="text-white font-black text-3xl">JT</span>
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">أهلاً بك في جمر التنور</h2>
                <p className="text-gray-500 dark:text-gray-400">يرجى اختيار الفرع لتصفح المنيو والطلب</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {(['السويدي الغربي', 'طويق'] as Branch[]).map((branch) => (
                  <button
                    key={branch}
                    onClick={() => onSelect(branch)}
                    className="group flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 hover:bg-primary hover:text-white rounded-[2rem] transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
                  >
                    <div className="flex items-center gap-4 text-right">
                      <div className="w-12 h-12 bg-white/10 dark:bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <MapPin size={24} className="group-hover:text-white" />
                      </div>
                      <div>
                        <span className="block font-black text-lg">فرع {branch}</span>
                        <span className="block text-sm opacity-60">مفتوح الآن</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-current flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight size={20} />
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Jamr Al-Tannour Experience</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
