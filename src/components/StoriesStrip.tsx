import React from 'react';
import { Story } from '../types';
import { motion } from 'motion/react';
import { Tag, Sparkles, ShoppingBag, Ticket } from 'lucide-react';

interface StoriesStripProps {
    stories: Story[];
    onStoryClick: (storyIndex: number) => void;
}

export const StoriesStrip: React.FC<StoriesStripProps> = ({ stories, onStoryClick }) => {
    if (!stories || stories.length === 0) return null;

    return (
        <div className="w-full bg-white dark:bg-zinc-950 py-3.5 px-4 overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-white/5">
            <div className="flex gap-4 min-w-max px-2">
                {stories.map((story, index) => {
                    const titleText = story.title || story.offer_name || 'عرض مميز';
                    const isCoupon = story.story_type === 'coupon' || !!story.promo_code;
                    const isProduct = story.story_type === 'product' || !!story.product_id;

                    return (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.08 }}
                            key={story.id} 
                            onClick={() => onStoryClick(index)}
                            className="flex flex-col items-center gap-2 cursor-pointer group w-20"
                        >
                            <div className="relative w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 shadow-md group-hover:scale-105 group-active:scale-95 transition-all">
                                <div className="w-full h-full rounded-full border-2 border-white dark:border-zinc-950 overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative">
                                    <img src={story.image_url} alt={titleText} className="w-full h-full object-cover" />
                                </div>

                                {/* Story Type Badge */}
                                <div className="absolute -bottom-1 -right-1 bg-zinc-900 border border-white/20 text-amber-400 p-1 rounded-full shadow-lg">
                                    {isCoupon ? (
                                        <Ticket size={10} />
                                    ) : isProduct ? (
                                        <ShoppingBag size={10} />
                                    ) : (
                                        <Sparkles size={10} />
                                    )}
                                </div>
                            </div>
                            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 w-full text-center truncate group-hover:text-primary transition-colors">
                                {titleText}
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
