import React, { useState, useEffect } from 'react';
// Version: 2026-03-13-22-40
import { Header } from './components/Header';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { InstallPWA } from './components/InstallPWA';
import { Category, Product, Branch } from './types';
import { supabase } from './lib/supabaseClient';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, UtensilsCrossed, Navigation } from 'lucide-react';
import { BranchSelectorModal } from './components/BranchSelectorModal';
import { Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [storeStatus, setStoreStatus] = useState<'open' | 'busy' | 'closed'>('open');

  useEffect(() => {
    const statusChannel = supabase.channel('store-status-app')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, 
        (payload) => {
          const newRow = payload.new as any;
          if (newRow && newRow.branch_name === selectedBranch && newRow.status) {
            setStoreStatus(newRow.status);
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(statusChannel); }
  }, []);

  useEffect(() => {
    const savedBranch = localStorage.getItem('jamr_al_tannour_branch') as Branch;
    if (savedBranch) setSelectedBranch(savedBranch);
    fetchData();
  }, []);

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    localStorage.setItem('jamr_al_tannour_branch', branch);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, prodsRes, statusRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('products')
          .select('*')
          .eq('is_available', true),
        supabase.from('store_settings')
          .select('status')
          .eq('branch_name', selectedBranch || 'السويدي الغربي')
          .single()
      ]);

      if (catsRes.data) setCategories(catsRes.data);
      if (prodsRes.data) setProducts(prodsRes.data);
      if (statusRes.data) setStoreStatus(statusRes.data.status);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategoryId ? p.category_id === activeCategoryId : true;
    const matchesSearch = p.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name_en.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <ThemeProvider>
      <CartProvider>
        <div className="min-h-screen pb-20">
          <Toaster />
          <Header
            selectedBranch={selectedBranch}
            onBranchChange={handleBranchSelect}
            onCartOpen={() => setIsCartOpen(true)}
            onSearch={setSearchQuery}
          />

          {storeStatus === 'closed' && (
              <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 dark:text-red-400 py-3 px-4 text-center text-sm font-bold flex items-center justify-center gap-2">
                  🔴 عذراً، المطعم مغلق حالياً. لا يمكننا استقبال طلبات جديدة.
              </div>
          )}
          {storeStatus === 'busy' && (
              <div className="bg-orange-500/10 border-b border-orange-500/20 text-orange-600 dark:text-orange-400 py-3 px-4 text-center text-sm font-bold flex items-center justify-center gap-2">
                  🟠 نواجه ضغطاً في الطلبات حالياً. قد يتأخر تحضير طلبك قليلاً، شكراً لتفهمك!
              </div>
          )}

          <BranchSelectorModal
            isOpen={selectedBranch === null}
            onSelect={handleBranchSelect}
          />

          <CategoryBar
            categories={categories}
            activeCategoryId={activeCategoryId}
            onCategoryChange={setActiveCategoryId}
          />

          <main className="container mx-auto px-4 py-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 size={48} className="text-primary animate-spin" />
                <p className="text-gray-500 font-medium">جاري تحضير المنيو...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={setSelectedProduct}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 text-gray-300">
                  <UtensilsCrossed size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد نتائج</h3>
                <p className="text-gray-500">لم نجد ما تبحث عنه، جرب كلمات أخرى</p>
              </div>
            )}
          </main>

          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />

          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            branch={selectedBranch || 'السويدي الغربي'}
            storeStatus={storeStatus}
          />

          {/* Active Order Banner */}
          <AnimatePresence>
            {activeOrderId && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-4 right-4 z-40 mx-auto max-w-sm"
              >
                <Link
                  to={`/track/${activeOrderId}`}
                  className="bg-primary text-white p-4 rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-between hover:scale-[1.02] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Navigation size={20} />
                    </div>
                    <div>
                      <p className="font-bold">لديك طلب جاري تحضيره 🛵</p>
                      <p className="text-xs text-white/80">اضغط هنا لتتبع حالة الطلب</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          <InstallPWA />
        </div>
      </CartProvider>
    </ThemeProvider>
  );
}
