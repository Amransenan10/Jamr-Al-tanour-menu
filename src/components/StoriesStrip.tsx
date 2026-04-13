import React from 'react';
import { Story } from '../types';
import { motion } from 'motion/react';

interface StoriesStripProps {
    stories: Story[];
    onStoryClick: (storyIndex: number) => void;
}

export const StoriesStrip: React.FC<StoriesStripProps> = ({ stories, onStoryClick }) => {
    if (!stories || stories.length === 0) return null;

    return (
        <div className="w-full bg-white dark:bg-zinc-950 py-4 px-4 overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-white/5">
            <div className="flex gap-4 min-w-max">
                {stories.map((story, index) => (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        key={story.id} 
                        onClick={() => onStoryClick(index)}
                        className="flex flex-col items-center gap-2 cursor-pointer group w-20"
                    >
                        <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-primary via-orange-500 to-purple-500 shadow-lg group-active:scale-95 transition-transform">
                            <div className="w-full h-full rounded-full border-2 border-white dark:border-zinc-950 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                <img src={story.image_url} alt="Story" className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 w-full text-center truncate">
                            عروضنا
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
