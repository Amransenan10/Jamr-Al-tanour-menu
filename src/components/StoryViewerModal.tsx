import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Story, Product } from '../types';
import { X, ChevronRight, ChevronLeft, ShoppingBag, Ticket, ExternalLink, Copy, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

interface StoryViewerModalProps {
    stories: Story[];
    initialIndex: number;
    onClose: () => void;
    onProductSelect: (productId: string) => void;
    products: Product[];
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({ 
    stories, initialIndex, onClose, onProductSelect, products 
}) => {
    const { addToCart } = useCart();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const [isCopied, setIsCopied] = useState(false);
    const STORY_DURATION = 5000; // 5 seconds per story

    const currentStory = stories[currentIndex];
    const linkedProduct = currentStory?.product_id ? products.find(p => p.id === currentStory.product_id) : null;
    const promoCode = currentStory?.promo_code;

    useEffect(() => {
        setProgress(0);
        setIsCopied(false);
        const startTime = Date.now();
        let animationFrame: number;

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const newProgress = (elapsed / STORY_DURATION) * 100;
            
            if (newProgress >= 100) {
                handleNext();
            } else {
                setProgress(newProgress);
                animationFrame = requestAnimationFrame(updateProgress);
            }
        };

        animationFrame = requestAnimationFrame(updateProgress);

        return () => cancelAnimationFrame(animationFrame);
    }, [currentIndex]);

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
            setProgress(0);
        }
    };

    const handleCopyCode = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (promoCode) {
            navigator.clipboard.writeText(promoCode);
            setIsCopied(true);
            toast.success(`تم نسخ كود الخصم (${promoCode}) بنجاح!`);
            setTimeout(() => setIsCopied(false), 3000);
        }
    };

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (promoCode) {
            handleCopyCode(e);
            return;
        }

        if (currentStory.offer_name && currentStory.offer_price) {
            addToCart({
                id: Math.random().toString(36).substr(2, 9),
                productId: `story_offer_${currentStory.id}`,
                name: currentStory.offer_name,
                price: currentStory.offer_price,
                quantity: 1,
                options: [],
                removedIngredients: [],
                totalPrice: currentStory.offer_price,
                notes: 'من عروض الاستوري'
            });
            toast.success(`تم إضافة ${currentStory.offer_name} للسلة`);
            onClose();
        } else if (linkedProduct) {
            onClose();
            onProductSelect(linkedProduct.id);
        } else if (currentStory.action_url) {
            window.open(currentStory.action_url, '_blank');
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed inset-0 z-50 bg-black flex flex-col dir-rtl"
            >
                {/* Progress Bars */}
                <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 pt-4 bg-gradient-to-b from-black/80 to-transparent">
                    {stories.map((s, idx) => (
                        <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                            <div 
                                className="h-full bg-white transition-all duration-100 ease-linear"
                                style={{ 
                                    width: idx === currentIndex ? `${progress}%` : 
                                           idx < currentIndex ? '100%' : '0%' 
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header Controls */}
                <div className="absolute top-6 left-0 right-0 z-20 flex justify-between items-center px-4">
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors">
                            <X size={20} />
                        </button>
                        {currentStory.title && (
                            <span className="text-white text-xs font-bold bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                {currentStory.title}
                            </span>
                        )}
                    </div>
                </div>

                {/* Touch Areas for Navigation */}
                <div className="absolute inset-x-0 top-20 bottom-32 z-10 flex">
                    <div className="flex-1" onClick={handleNext} />
                    <div className="w-1/3" onClick={handlePrev} />
                </div>

                {/* Story Image */}
                <div className="flex-1 flex items-center justify-center bg-zinc-950 relative">
                    <motion.img 
                        key={currentStory.id}
                        initial={{ opacity: 0.5, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        src={currentStory.image_url} 
                        alt="Story" 
                        className="w-full h-full object-contain md:object-cover max-w-md mx-auto"
                    />

                    {/* Promo Code Floating Banner if exists */}
                    {promoCode && (
                        <div className="absolute top-24 inset-x-4 z-20 mx-auto max-w-xs bg-zinc-900/90 backdrop-blur-md border border-amber-500/40 p-3 rounded-2xl flex items-center justify-between text-white shadow-2xl">
                            <div className="flex items-center gap-2">
                                <Ticket size={18} className="text-amber-400" />
                                <div>
                                    <p className="text-[10px] text-gray-400">كود الخصم الخاص</p>
                                    <p className="font-mono font-black text-amber-400 text-sm">{promoCode}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCopyCode}
                                className="px-3 py-1.5 bg-amber-500 text-black font-bold text-xs rounded-xl flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all"
                            >
                                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                <span>{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Action Button */}
                {(currentStory.offer_name || linkedProduct || promoCode || currentStory.button_text || currentStory.action_url) && (
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-center pb-8">
                        <button 
                            onClick={handleActionClick}
                            className="w-full max-w-sm bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all"
                        >
                            {promoCode ? (
                                <>
                                    <Ticket size={20} />
                                    <span>{isCopied ? 'تم نسخ كود الخصم' : `استخدم الكود (${promoCode})`}</span>
                                </>
                            ) : linkedProduct ? (
                                <>
                                    <ShoppingBag size={20} />
                                    <span>اطلب {linkedProduct.name_ar} - {linkedProduct.price} ر.س</span>
                                </>
                            ) : currentStory.offer_name ? (
                                <>
                                    <ShoppingBag size={20} />
                                    <span>اطلب الآن - {currentStory.offer_price} ر.س</span>
                                </>
                            ) : (
                                <>
                                    <ExternalLink size={20} />
                                    <span>{currentStory.button_text || 'عرض التفاصيل'}</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
