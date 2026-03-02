import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Product, OptionGroup, OptionItem, Ingredient, CartItem } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [items, setItems] = useState<OptionItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<CartItem['options']>([]);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      fetchDetails();
      setQuantity(1);
      setSelectedOptions([]);
      setRemovedIngredients([]);
    }
  }, [product]);

  const fetchDetails = async () => {
    if (!product) return;
    setLoading(true);
    try {
      const [groupsRes, itemsRes, ingredientsRes] = await Promise.all([
        supabase.from('option_groups').select('*').eq('product_id', product.id),
        supabase.from('option_items').select('*'),
        supabase.from('ingredients').select('*').eq('product_id', product.id)
      ]);

      if (groupsRes.data) setGroups(groupsRes.data);
      if (itemsRes.data) setItems(itemsRes.data);
      if (ingredientsRes.data) setIngredients(ingredientsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionToggle = (group: OptionGroup, item: OptionItem) => {
    setSelectedOptions(prev => {
      const filtered = prev.filter(o => o.groupId !== group.id || group.max_selection > 1);
      const exists = prev.find(o => o.itemId === item.id);
      
      if (exists) {
        return prev.filter(o => o.itemId !== item.id);
      }
      
      const groupSelections = prev.filter(o => o.groupId === group.id);
      if (groupSelections.length >= group.max_selection && group.max_selection === 1) {
        return [...prev.filter(o => o.groupId !== group.id), {
          groupId: group.id,
          groupName: group.name_ar,
          itemId: item.id,
          itemName: item.name_ar,
          price: item.price
        }];
      }

      if (groupSelections.length < group.max_selection) {
        return [...prev, {
          groupId: group.id,
          groupName: group.name_ar,
          itemId: item.id,
          itemName: item.name_ar,
          price: item.price
        }];
      }

      return prev;
    });
  };

  const handleIngredientToggle = (id: string) => {
    setRemovedIngredients(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const optionsTotal = selectedOptions.reduce((sum, o) => sum + o.price, 0);
    return (product.price + optionsTotal) * quantity;
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Check required options
    for (const group of groups) {
      const selections = selectedOptions.filter(o => o.groupId === group.id);
      if (selections.length < group.min_selection) {
        alert(`يرجى اختيار ${group.min_selection} من ${group.name_ar}`);
        return;
      }
    }

    const cartItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      name: product.name_ar,
      price: product.price,
      quantity,
      options: selectedOptions,
      removedIngredients,
      totalPrice: calculateTotal()
    };

    addToCart(cartItem);
    onClose();
  };

  return (
    <AnimatePresence>
      {product && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh]"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="overflow-y-auto no-scrollbar flex-1">
              <div className="relative aspect-[16/9] sm:aspect-[21/9]">
                <img
                  src={product.image_url || 'https://picsum.photos/seed/food/800/400'}
                  alt={product.name_ar}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{product.name_ar}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{product.description_ar}</p>
                  </div>
                  <div className="text-primary font-black text-2xl">{product.price} ر.س</div>
                </div>

                {loading ? (
                  <div className="space-y-4 py-8">
                    <div className="h-8 bg-gray-100 dark:bg-white/5 animate-pulse rounded-xl w-1/3"></div>
                    <div className="h-24 bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl"></div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Option Groups */}
                    {groups.map(group => (
                      <div key={group.id} className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {group.name_ar}
                            {group.min_selection > 0 && (
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">إجباري</span>
                            )}
                          </h3>
                          <span className="text-xs text-gray-400">اختر {group.max_selection}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {items.filter(item => item.group_id === group.id).map(item => {
                            const isSelected = selectedOptions.some(o => o.itemId === item.id);
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleOptionToggle(group, item)}
                                className={cn(
                                  "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-right",
                                  isSelected 
                                    ? "border-primary bg-primary/5 text-primary" 
                                    : "border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300"
                                )}
                              >
                                <span className="font-bold text-sm">{item.name_ar}</span>
                                <span className="text-xs font-medium">+{item.price} ر.س</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Ingredients */}
                    {ingredients.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 dark:text-white">إزالة مكونات</h3>
                        <div className="flex flex-wrap gap-2">
                          {ingredients.map(ing => {
                            const isRemoved = removedIngredients.includes(ing.id);
                            return (
                              <button
                                key={ing.id}
                                onClick={() => handleIngredientToggle(ing.id)}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border-2",
                                  isRemoved
                                    ? "border-red-500/50 bg-red-500/10 text-red-500"
                                    : "border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                                )}
                              >
                                {isRemoved ? `بدون ${ing.name_ar}` : ing.name_ar}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-2xl p-1">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-3 text-gray-500 hover:text-primary transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="w-12 text-center font-black text-lg text-gray-900 dark:text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-3 text-gray-500 hover:text-primary transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <ShoppingBag size={22} />
                  إضافة {calculateTotal()} ر.س
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
