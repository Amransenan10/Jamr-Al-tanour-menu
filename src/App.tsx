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
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const storeStatus = storeSettings?.status || 'open';

  // Debugging & Resilience: Anti-hang timeout
  useEffect(() => {
    console.log('DEBUG: App mounted. Current state:', { selectedBranch, loading });
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('DEBUG: Loading taking too long (10s). Forcing loading state to false.');
        setLoading(false);
        setError('استغرق التحميل وقتاً طويلاً. يرجى التحقق من اتصالك بالإنترنت أو إعدادات قاعدة البيانات.');
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (!supabase) {
      console.error('DEBUG: Supabase client is UNDEFINED!');
      return;
    }

    console.log('DEBUG: Initializing Real-time for branch:', selectedBranch);
    try {
      const statusChannel = supabase.channel('store-status-app')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, 
          (payload) => {
            console.log('DEBUG: Store status changed:', payload);
            const newRow = payload.new as any;
            if (newRow && newRow.branch_name === selectedBranch) {
              setStoreSettings(newRow);
            }
          }
        ).subscribe((status) => {
          console.log('DEBUG: Store status subscription status:', status);
        });

      // Real-time synchronization for products and categories
      const menuChannel = supabase.channel('menu-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          console.log('DEBUG: Product changed, refetching...');
          fetchData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
        .subscribe();

      return () => { 
        console.log('DEBUG: Cleaning up real-time channels');
        supabase.removeChannel(statusChannel); 
        supabase.removeChannel(menuChannel);
      }
    } catch (err) {
      console.error('DEBUG: Real-time initialization error:', err);
    }
  }, [selectedBranch]);

  useEffect(() => {
    const savedBranch = localStorage.getItem('jamr_al_tannour_branch') as Branch;
    if (savedBranch) setSelectedBranch(savedBranch);
    
    const savedOrderId = localStorage.getItem('jamr_active_order');
    if (savedOrderId) setActiveOrderId(savedOrderId);

    // Stale-While-Revalidate: Load cache first for instant display
    const cachedCats = localStorage.getItem('jamr_cats_cache');
    const cachedProds = localStorage.getItem('jamr_prods_cache');
    if (cachedCats && cachedProds) {
      try {
        setCategories(JSON.parse(cachedCats));
        setProducts(JSON.parse(cachedProds));
        setLoading(false);
      } catch (e) { console.error('Cache parsing error', e); }
    }

    fetchData(savedBranch || 'السويدي الغربي');
  }, []);

  const handleBranchSelect = async (branch: Branch) => {
    setSelectedBranch(branch);
    localStorage.setItem('jamr_al_tannour_branch', branch);
    
    // Refetch the selected branch store_settings to fix branch interference bug
    const { data } = await supabase.from('store_settings').select('*').eq('branch_name', branch).single();
    if (data) setStoreSettings(data);
  };

  const fetchData = async (overrideBranch?: string) => {
    console.log('DEBUG: Starting fetchData...');
    setLoading(true);
    setError(null);
    try {
      const startTime = Date.now();
      const [catsRes, prodsRes, statusRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('products')
          .select('*, option_groups(id, min_selection, max_selection, option_items(price))')
          .eq('is_available', true),
        supabase.from('store_settings')
          .select('*')
          .eq('branch_name', overrideBranch || selectedBranch || 'السويدي الغربي')
          .single()
      ]);

      console.log(`DEBUG: fetchData completed in ${Date.now() - startTime}ms`, {
        categories: catsRes.data?.length,
        products: prodsRes.data?.length,
        status: statusRes.data ? 'found' : 'missing',
        errors: { cats: catsRes.error, prods: prodsRes.error, status: statusRes.error }
      });

      if (catsRes.data) {
        setCategories(catsRes.data);
        localStorage.setItem('jamr_cats_cache', JSON.stringify(catsRes.data));
      }
      if (prodsRes.data) {
        const processedProducts = prodsRes.data.map((p: any) => {
          if (p.price === 0 && p.option_groups && p.option_groups.length > 0) {
            const requiredGroups = p.option_groups.filter((g: any) => g.min_selection > 0);
            if (requiredGroups.length > 0) {
              const firstGroup = requiredGroups[0];
              if (firstGroup.option_items && firstGroup.option_items.length > 0) {
                const minPrice = Math.min(...firstGroup.option_items.map((i: any) => i.price));
                return { ...p, starting_price: minPrice };
              }
            }
          }
          return p;
        });
        setProducts(processedProducts);
        localStorage.setItem('jamr_prods_cache', JSON.stringify(processedProducts));
      }
      if (statusRes.data) setStoreSettings(statusRes.data);
    } catch (e: any) {
      console.error('DEBUG: ERROR in fetchData:', e);
      setError(e.message || 'حدث خطأ غير متوقع عند تحميل المنيو');
    } finally {
      console.log('DEBUG: Setting loading to false');
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
          {storeStatus === 'prayer' && (
              <div className="bg-indigo-500/10 border-b border-indigo-500/20 text-indigo-600 dark:text-indigo-400 py-3 px-4 text-center text-sm font-bold flex items-center justify-center gap-2">
                  🕌 طاقم المطعم في وقت صلاة. يمكنك إتمام طلبك وسنبدأ بالتحضير فوراً بعد الصلاة.
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
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-500">
                  <Navigation size={40} className="rotate-45" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">تعذر الاتصال بقاعدة البيانات</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <button 
                  onClick={() => fetchData()}
                  className="px-6 py-2 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-colors"
                >
                  إعادة المحاولة
                </button>
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
            storeSettings={storeSettings}
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
