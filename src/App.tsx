import React, { useState, useEffect, useRef } from 'react';
// Version: 2026-03-13-22-40
import { Header } from './components/Header';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { InstallPWA } from './components/InstallPWA';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { SocialLinks } from './components/SocialLinks';
import { SideMenuDrawer } from './components/SideMenuDrawer';
import { StoriesStrip } from './components/StoriesStrip';
import { StoryViewerModal } from './components/StoryViewerModal';
import { Category, Product, Branch, Story } from './types';
import { supabase } from './lib/supabaseClient';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, UtensilsCrossed, Navigation } from 'lucide-react';
import { BranchSelectorModal } from './components/BranchSelectorModal';
import { FloatingCartButton } from './components/FloatingCartButton';
import { useBackButton } from './hooks/useBackButton';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { notifyCustomerStatusChange } from './utils/customerNotifications';
import { PushSubscriptionBanner } from './components/PushSubscriptionBanner';
import { showSystemNotification } from './utils/pushSubscription';

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<{ id: string; status: string; order_type?: string } | null>(null);
  const prevAppOrderStatusRef = useRef<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [appSettings, setAppSettings] = useState<any>(null);
  const storeStatus = storeSettings?.status || 'open';

  // Hardware Back Button Handlers
  useBackButton(isCartOpen, () => setIsCartOpen(false), 'cart');
  useBackButton(isSideMenuOpen, () => setIsSideMenuOpen(false), 'menu');
  useBackButton(selectedProduct !== null, () => setSelectedProduct(null), 'product');
  useBackButton(activeStoryIndex !== null, () => setActiveStoryIndex(null), 'story');

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

  // Real-time broadcast notification listener for marketing messages
  useEffect(() => {
    const broadcastChannel = supabase
      .channel('public:broadcast_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcast_notifications' }, (payload) => {
        const newNotif = payload.new as any;
        if (newNotif && newNotif.title) {
          showSystemNotification(newNotif.title, newNotif.message, newNotif.url);
          toast.custom(
            (t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-zinc-900 text-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-amber-500/30 p-4 border border-amber-500/20`}>
                <div className="flex-1 w-0">
                  <div className="flex items-start">
                    <div className="shrink-0 pt-0.5 text-2xl">🔔</div>
                    <div className="mr-3 flex-1 text-right">
                      <p className="text-sm font-black text-amber-400">{newNotif.title}</p>
                      <p className="mt-1 text-xs text-gray-200 leading-relaxed">{newNotif.message}</p>
                      {newNotif.promo_code && (
                        <span className="inline-block mt-2 text-[11px] bg-amber-500/20 text-amber-300 font-mono font-black px-2.5 py-1 rounded-lg border border-amber-500/30">
                          كود الخصم: {newNotif.promo_code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ),
            { duration: 8000 }
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(broadcastChannel);
    };
  }, []);

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

      const settingsChannel = supabase.channel('app-settings-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, 
          (payload) => {
            console.log('DEBUG: App settings changed:', payload);
            setAppSettings(payload.new);
          }
        ).subscribe();

      return () => { 
        console.log('DEBUG: Cleaning up real-time channels');
        supabase.removeChannel(statusChannel); 
        supabase.removeChannel(menuChannel);
        supabase.removeChannel(settingsChannel);
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
    const cachedStories = localStorage.getItem('jamr_stories_cache');
    if (cachedCats && cachedProds) {
      try {
        setCategories(JSON.parse(cachedCats));
        setProducts(JSON.parse(cachedProds));
        if (cachedStories) setStories(JSON.parse(cachedStories));
        setLoading(false);
      } catch (e) { console.error('Cache parsing error', e); }
    }

    fetchData(savedBranch || 'السويدي الغربي');
  }, []);

  // Real-time listener & fast polling for active order status updates on customer menu
  useEffect(() => {
    const processActiveOrderUpdate = (newOrder: any, isInitial = false) => {
      setActiveOrder(newOrder);

      if (['completed', 'cancelled'].includes(newOrder.status)) {
        setTimeout(() => {
          localStorage.removeItem('jamr_active_order');
          setActiveOrderId(null);
          setActiveOrder(null);
        }, 6000);
      }

      if (!isInitial && prevAppOrderStatusRef.current && prevAppOrderStatusRef.current !== newOrder.status) {
        const statusLabels: Record<string, string> = {
          new: 'تم استلام طلبك 📝',
          accepted: 'تم قبول الطلب ✅',
          preparing: 'جاري التحضير في المطبخ 👨‍🍳',
          ready: newOrder.order_type === 'delivery' ? 'المندوب في الطريق إليك 🛵' : 'طلبك جاهز للاستلام! 🎉',
          completed: 'تم تسليم الطلب ✨',
          cancelled: 'تم إلغاء الطلب ❌'
        };
        const label = statusLabels[newOrder.status] || 'تحديث جديد في طلبك';

        // Fire sound, vibration, and push notification
        notifyCustomerStatusChange(newOrder.status, label, newOrder.id);

        toast.success(`تحديث الطلب: ${label}`, {
          duration: 5000,
          icon: '🔔',
        });
      }

      prevAppOrderStatusRef.current = newOrder.status;
    };

    const savedOrderId = localStorage.getItem('jamr_active_order');
    if (!savedOrderId) {
      setActiveOrderId(null);
      setActiveOrder(null);
      return;
    }

    setActiveOrderId(savedOrderId);

    // Initial & Polling fetch of active order status
    const fetchActiveOrder = async (isSilent = false) => {
      const { data } = await supabase
        .from('orders')
        .select('id, status, order_type')
        .eq('id', savedOrderId)
        .single();

      if (data) {
        if (['completed', 'cancelled'].includes(data.status)) {
          localStorage.removeItem('jamr_active_order');
          setActiveOrderId(null);
          setActiveOrder(null);
        } else {
          processActiveOrderUpdate(data, prevAppOrderStatusRef.current === null);
        }
      }
    };

    fetchActiveOrder(false);

    const pollInterval = setInterval(() => {
      const currentSavedId = localStorage.getItem('jamr_active_order');
      if (currentSavedId !== activeOrderId) {
        setActiveOrderId(currentSavedId);
      } else if (currentSavedId) {
        fetchActiveOrder(true);
      }
    }, 3000);

    const channel = supabase
      .channel(`active-order-menu-${savedOrderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${savedOrderId}` },
        (payload) => {
          const newOrder = payload.new as any;
          if (newOrder) {
            processActiveOrderUpdate(newOrder, false);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [activeOrderId]);

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
      const [catsRes, prodsRes, statusRes, appSettingsRes, storiesRes] = await Promise.all([
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
          .single(),
        supabase.from('app_settings').select('*').single(),
        (async () => {
          try {
            const res = await supabase.from('stories').select('*').eq('is_active', true).order('created_at', { ascending: false });
            return res;
          } catch (e) {
            return { data: [], error: null };
          }
        })()
      ]);

      console.log(`DEBUG: fetchData completed in ${Date.now() - startTime}ms`, {
        categories: catsRes.data?.length,
        products: prodsRes.data?.length,
        stories: storiesRes.data?.length,
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
      if (appSettingsRes.data) setAppSettings(appSettingsRes.data);
      if (storiesRes.data) {
        setStories(storiesRes.data);
        localStorage.setItem('jamr_stories_cache', JSON.stringify(storiesRes.data));
      }
    } catch (e: any) {
      console.error('DEBUG: ERROR in fetchData:', e);
      setError(e.message || 'حدث خطأ غير متوقع عند تحميل المنيو');
    } finally {
      console.log('DEBUG: Setting loading to false');
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (p.is_hidden) return false;
    const matchesCategory = activeCategoryId ? p.category_id === activeCategoryId : true;
    const matchesSearch = p.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name_en.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const topPopularProducts = React.useMemo(() => {
    if (products.length === 0) return [];
    
    // Step 1: Group by category
    const categoryMap: Record<string, Product[]> = {};
    products.forEach(p => {
      if (p.is_hidden) return;
      if (!categoryMap[p.category_id]) categoryMap[p.category_id] = [];
      categoryMap[p.category_id].push(p);
    });

    // Step 2: Pick top 3 from each category to ensure diversity
    const diversePopular: Product[] = [];
    Object.values(categoryMap).forEach(catProds => {
      const topInCat = [...catProds]
        .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
        .slice(0, 3);
      diversePopular.push(...topInCat);
    });

    // Step 3: Combine with overall top sellers, then unique, then limit to 14
    const overallTop = [...products]
      .filter(p => !p.is_hidden)
      .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
      .slice(0, 14);

    const combinedSet = new Set([...diversePopular.map(p => p.id), ...overallTop.map(p => p.id)]);
    const finalPopular = Array.from(combinedSet)
      .map(id => products.find(p => p.id === id)!)
      .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
      .slice(0, 14);

    return finalPopular;
  }, [products]);

  const isShowingPopular = activeCategoryId === null && !searchQuery;
  const displayProducts = isShowingPopular ? topPopularProducts : filteredProducts;

  return (
    <ThemeProvider>
      <CartProvider>
        <div className="min-h-screen pb-20">
          <Toaster />
          <AnnouncementBanner text={appSettings?.announcement_text} isActive={appSettings?.announcement_active} />
          
          <Header
            selectedBranch={selectedBranch}
            onBranchChange={handleBranchSelect}
            onCartOpen={() => setIsCartOpen(true)}
            onSearch={setSearchQuery}
            onSideMenuOpen={() => setIsSideMenuOpen(true)}
            logoUrl={appSettings?.logo_url || ''}
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
                  🕌 عذراً مغلق للصلاة. يمكنك إرسال طلبك وسيتم تحضيره بعد الصلاة.
              </div>
          )}

          <BranchSelectorModal
            isOpen={selectedBranch === null}
            onSelect={handleBranchSelect}
          />

          <StoriesStrip 
            stories={stories} 
            onStoryClick={(index) => setActiveStoryIndex(index)} 
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
            ) : displayProducts.length > 0 ? (
              <div className="space-y-8">
                {isShowingPopular && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1.5 bg-primary rounded-full" />
                      <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">الاكثر طلباً 🔥</h2>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base font-medium mr-4">
                      إليك ما يفضله عملاؤنا، مختار بعناية من كل قسم
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
                  <AnimatePresence mode="popLayout">
                    {displayProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelect={setSelectedProduct}
                        isPopular={isShowingPopular || topPopularProducts.some(p => p.id === product.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
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

          <SocialLinks 
            instagram={appSettings?.social_instagram}
            snapchat={appSettings?.social_snapchat}
            twitter={appSettings?.social_twitter}
            tiktok={appSettings?.social_tiktok}
            whatsapp={appSettings?.social_whatsapp}
          />

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

          <SideMenuDrawer
            isOpen={isSideMenuOpen}
            onClose={() => setIsSideMenuOpen(false)}
            appSettings={appSettings}
          />

          {activeStoryIndex !== null && (
            <StoryViewerModal
              stories={stories}
              initialIndex={activeStoryIndex}
              onClose={() => setActiveStoryIndex(null)}
              products={products}
              onProductSelect={(productId) => {
                const p = products.find(prod => prod.id === productId);
                if (p) setSelectedProduct(p);
              }}
            />
          )}

          {/* Active Order Banner */}
          <AnimatePresence>
            {activeOrderId && (
              <motion.div
                initial={{ y: 100, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 100, opacity: 0, scale: 0.9 }}
                className="fixed bottom-6 left-4 right-4 z-40 mx-auto max-w-sm"
              >
                <Link
                  to={`/track/${activeOrderId}`}
                  className="bg-zinc-900 dark:bg-zinc-800 text-white p-4 rounded-3xl shadow-2xl border border-white/10 flex items-center justify-between hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/10 pointer-events-none" />
                  <div className="flex items-center gap-3.5 relative z-10">
                    <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg shadow-primary/30 group-hover:rotate-12 transition-transform shrink-0">
                      {activeOrder?.status === 'ready' ? (activeOrder.order_type === 'delivery' ? '🛵' : '🎉') : activeOrder?.status === 'preparing' ? '👨‍🍳' : activeOrder?.status === 'accepted' ? '✅' : '📝'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-white">
                          {activeOrder?.status === 'ready'
                            ? (activeOrder.order_type === 'delivery' ? 'المندوب في الطريق إليك! 🛵' : 'طلبك جاهز الآن للاستلام! 🎉')
                            : activeOrder?.status === 'preparing'
                            ? 'جاري تحضير وجبتك في المطبخ 👨‍🍳'
                            : activeOrder?.status === 'accepted'
                            ? 'تم قبول طلبك، ستبدأ تحضيره قريباً ✅'
                            : 'تم استلام طلبك وجاري مراجعته 📝'}
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 font-medium flex items-center gap-1">
                        <span>اضغط لتتبع الطلب بالوقت الفعلي</span>
                        <Navigation size={12} className="rotate-45 text-primary" />
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          <FloatingCartButton 
            storeStatus={storeStatus} 
            onClick={() => setIsCartOpen(true)} 
            hasActiveOrder={!!activeOrderId} 
          />

          <InstallPWA />
          <PushSubscriptionBanner />
        </div>
      </CartProvider>
    </ThemeProvider>
  );
}
