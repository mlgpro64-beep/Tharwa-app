import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
}

interface GlassTabBarProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function GlassTabBar({ tabs, activeTab, onChange, className }: GlassTabBarProps) {
  return (
    <div className={cn("flex items-center justify-center p-1", className)}>
      <div className="relative flex items-center bg-white/10 backdrop-blur-xl rounded-full p-1.5 border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] shadow-lg">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative px-6 py-2 text-sm font-medium transition-colors duration-300 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                isActive ? "text-white" : "text-white/60 hover:text-white/80"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-glass"
                  className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}








