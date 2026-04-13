import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Story, Product } from '../types';
import { X, ChevronRight, ChevronLeft, ShoppingCart } from 'lucide-react';

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
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const STORY_DURATION = 5000; // 5 seconds per story

    const currentStory = stories[currentIndex];
    const linkedProduct = currentStory?.product_id ? products.find(p => p.id === currentStory.product_id) : null;

    useEffect(() => {
        setProgress(0);
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

    const handleOrderClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // prevent navigation
        if (linkedProduct) {
            onClose();
            onProductSelect(linkedProduct.id);
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed inset-0 z-50 bg-black flex flex-col"
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
                    <button onClick={onClose} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors">
                        <X size={24} />
                    </button>
                    {/* Optionally add brand logo here */}
                </div>

                {/* Touch Areas for Navigation */}
                <div className="absolute inset-x-0 top-20 bottom-32 z-10 flex">
                    {/* Right side = Next (since Arabic is RTL, but typically left implies prev, right next. In RTL stories, clicking right is next) */}
                    <div className="flex-1" onClick={handleNext} />
                    {/* Left side = Prev */}
                    <div className="w-1/3" onClick={handlePrev} />
                </div>

                {/* Story Image */}
                <div className="flex-1 flex items-center justify-center bg-zinc-900">
                    <motion.img 
                        key={currentStory.id}
                        initial={{ opacity: 0.5, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        src={currentStory.image_url} 
                        alt="Story" 
                        className="w-full h-full object-contain md:object-cover max-w-md mx-auto"
                    />
                </div>

                {/* Footer Action */}
                {linkedProduct && (
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-center pb-8">
                        <button 
                            onClick={handleOrderClick}
                            className="w-full max-w-sm bg-white text-black font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all animate-bounce"
                            style={{ animationDuration: '2s' }}
                        >
                            <ShoppingCart size={24} />
                            <span>اطلب الآن - {linkedProduct.price} ر.س</span>
                        </button>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
