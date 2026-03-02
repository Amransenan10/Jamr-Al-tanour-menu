import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { Category, Product, Branch } from './types';
import { supabase } from './lib/supabaseClient';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, UtensilsCrossed } from 'lucide-react';
import { BranchSelectorModal } from './components/BranchSelectorModal';

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

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
      const [catsRes, prodsRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('products')
          .select('*')
          .eq('is_available', true)
      ]);

      if (catsRes.data) setCategories(catsRes.data);
      if (prodsRes.data) setProducts(prodsRes.data);
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
          <Header
            selectedBranch={selectedBranch}
            onBranchChange={handleBranchSelect}
            onCartOpen={() => setIsCartOpen(true)}
            onSearch={setSearchQuery}
          />

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
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
          />
        </div>
      </CartProvider>
    </ThemeProvider>
  );
}
