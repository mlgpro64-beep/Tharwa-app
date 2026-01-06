import { useState, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TASK_CATEGORIES_WITH_SUBS, type TaskCategoryId } from '@shared/schema';
import { 
  Heart, Sparkles, GraduationCap, Palette, HardHat, Star, MoreHorizontal, Car,
  ChevronDown, Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CategoryPickerProps {
  selected: string | null;
  onSelect: (category: string) => void;
}

const categoryIcons: Record<TaskCategoryId, typeof Sparkles> = {
  pampering: Heart,
  beauty_fashion: Sparkles,
  teaching_education: GraduationCap,
  art: Palette,
  construction: HardHat,
  special: Star,
  car_care: Car,
  other: MoreHorizontal,
};

const getAllSubcategoryIds = (): Set<string> => {
  const ids = new Set<string>();
  Object.values(TASK_CATEGORIES_WITH_SUBS).forEach(cat => {
    cat.subcategories.forEach(sub => ids.add(sub.id));
  });
  return ids;
};

const findCategoryForSelection = (selected: string | null): TaskCategoryId | null => {
  if (!selected) return null;
  
  if (selected === 'other' || selected === 'pampering') return selected as TaskCategoryId;
  
  for (const [catId, cat] of Object.entries(TASK_CATEGORIES_WITH_SUBS)) {
    if (cat.subcategories.some(sub => sub.id === selected)) {
      return catId as TaskCategoryId;
    }
  }
  
  return null;
};

const CategoryCard = memo(function CategoryCard({
  categoryId,
  category,
  isExpanded,
  selectedValue,
  onToggleExpand,
  onSelectCategory,
}: {
  categoryId: TaskCategoryId;
  category: typeof TASK_CATEGORIES_WITH_SUBS[TaskCategoryId];
  isExpanded: boolean;
  selectedValue: string | null;
  onToggleExpand: () => void;
  onSelectCategory: (value: string) => void;
}) {
  // Ensure category exists
  if (!category) {
    return null;
  }
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const Icon = categoryIcons[categoryId];
  
  // Ensure Icon exists
  if (!Icon) {
    return null;
  }
  
  const name = isArabic ? category.nameAr : category.nameEn;
  const hasSubcategories = category.subcategories.length > 0;
  
  const mainCategoryOfSelection = useMemo(() => findCategoryForSelection(selectedValue), [selectedValue]);
  const isSelected = mainCategoryOfSelection === categoryId;
  const isPampering = categoryId === 'pampering';
  
  const handleClick = useCallback(() => {
    if (hasSubcategories) {
      onToggleExpand();
    } else {
      onSelectCategory(categoryId);
    }
  }, [hasSubcategories, onToggleExpand, onSelectCategory, categoryId]);

  return (
    <motion.div
      layout
      className={cn("overflow-visible", isPampering && "mb-1")}
      initial={isPampering ? { scale: 0.95, opacity: 0 } : false}
      animate={isPampering ? { scale: 1, opacity: 1 } : {}}
      transition={isPampering ? { duration: 0.4, ease: [0.4, 0, 0.2, 1] } : {}}
    >
      <motion.button
        onClick={handleClick}
        className={cn(
          "relative w-full overflow-hidden transition-all duration-300",
          "backdrop-blur-2xl border",
          isPampering 
            ? "rounded-[28px] border-2" 
            : "rounded-[24px] border border-white/10",
          isExpanded 
            ? "bg-gradient-to-br from-white/15 to-white/5 shadow-2xl" 
            : isPampering
            ? "bg-gradient-to-br from-pink-500/30 via-pink-400/20 to-purple-500/15 hover:from-pink-500/35 hover:via-pink-400/25 hover:to-purple-500/20"
            : "bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/8",
          isPampering && !isExpanded && "border-pink-400/50 shadow-2xl",
          isSelected && !isExpanded && !isPampering && "ring-2 ring-primary shadow-lg shadow-primary/20"
        )}
        style={{
          boxShadow: isExpanded 
            ? `0 20px 40px -15px ${category.colorHex}30` 
            : isPampering
            ? `0 20px 50px -10px ${category.colorHex}50, 0 0 40px -10px ${category.colorHex}30, inset 0 1px 0 0 rgba(255,255,255,0.2)`
            : undefined,
        }}
        whileHover={isPampering ? { scale: 1.02, y: -2 } : {}}
        whileTap={{ scale: isPampering ? 0.98 : 0.98 }}
        data-testid={`button-category-${categoryId}`}
      >
        {isPampering && (
          <>
            <motion.div 
              className="absolute inset-0 opacity-30"
              style={{
                background: `radial-gradient(circle at 30% 50%, ${category.colorHex}60 0%, transparent 70%)`,
              }}
              animate={{
                opacity: [0.3, 0.4, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div 
              className="absolute inset-0 opacity-20"
              style={{
                background: `linear-gradient(135deg, ${category.colorHex}80 0%, transparent 60%)`,
              }}
            />
          </>
        )}
        {!isPampering && (
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(135deg, ${category.colorHex}40 0%, transparent 60%)`,
            }}
          />
        )}
        
        <div className={cn("relative", isPampering ? "p-6" : "p-5")}>
          <div className="flex items-center gap-4">
            <motion.div 
              className={cn(
                "rounded-2xl flex items-center justify-center shrink-0",
                isPampering ? "w-16 h-16" : "w-14 h-14"
              )}
              style={{
                background: isPampering
                  ? `linear-gradient(135deg, ${category.colorHex}40 0%, ${category.colorHex}20 100%)`
                  : `linear-gradient(135deg, ${category.colorHex}30 0%, ${category.colorHex}10 100%)`,
                boxShadow: isPampering
                  ? `0 12px 32px -8px ${category.colorHex}60, inset 0 1px 0 0 rgba(255,255,255,0.3)`
                  : `0 8px 24px -8px ${category.colorHex}40`,
              }}
              whileHover={isPampering ? { scale: 1.1, rotate: 5 } : {}}
              transition={{ duration: 0.2 }}
            >
              <Icon 
                className={cn(isPampering ? "w-8 h-8" : "w-7 h-7")}
                style={{ color: category.colorHex }}
              />
            </motion.div>
            
            <div className="flex-1 text-start">
              <h3 className={cn(
                "font-bold text-foreground mb-0.5",
                isPampering ? "text-xl" : "text-lg"
              )}>
                {name}
              </h3>
              {categoryId === 'pampering' && (
                <p className={cn(
                  "font-medium",
                  isPampering ? "text-sm text-foreground/90" : "text-xs text-muted-foreground"
                )}>
                  {isArabic ? 'اطلب اللي في خاطرك' : 'Request what\'s on your mind'}
                </p>
              )}
              {hasSubcategories && categoryId !== 'pampering' && (
                <p className="text-xs text-muted-foreground">
                  {category.subcategories.length} {isArabic ? 'تصنيفات' : 'subcategories'}
                </p>
              )}
            </div>
            
            {hasSubcategories ? (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            ) : isSelected ? (
              <motion.div 
                className={cn(
                  "rounded-xl flex items-center justify-center",
                  isPampering ? "w-12 h-12" : "w-10 h-10"
                )}
                style={{ backgroundColor: `${category.colorHex}30` }}
                initial={false}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3 }}
              >
                <Check className={cn(isPampering ? "w-6 h-6" : "w-5 h-5")} style={{ color: category.colorHex }} />
              </motion.div>
            ) : isPampering ? (
              <motion.div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${category.colorHex}20 0%, ${category.colorHex}10 100%)`,
                  boxShadow: `0 4px 16px -4px ${category.colorHex}40`,
                }}
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Heart className="w-6 h-6" style={{ color: category.colorHex }} />
              </motion.div>
            ) : null}
          </div>
        </div>
      </motion.button>
      
      <AnimatePresence>
        {isExpanded && hasSubcategories && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.2 }
            }}
            className="overflow-hidden"
          >
            <div className="pt-3 px-1">
              <div className="grid grid-cols-2 gap-2">
                {category.subcategories.map((sub, index) => {
                  const isSubSelected = selectedValue === sub.id;
                  const subName = isArabic ? sub.nameAr : sub.nameEn;
                  
                  return (
                    <motion.button
                      key={sub.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => onSelectCategory(sub.id)}
                      className={cn(
                        "relative p-4 rounded-2xl text-start transition-all",
                        "backdrop-blur-xl border",
                        isSubSelected 
                          ? "border-white/20 bg-white/15" 
                          : "border-white/5 bg-white/5 hover:bg-white/10"
                      )}
                      style={{
                        boxShadow: isSubSelected 
                          ? `0 8px 20px -8px ${category.colorHex}40, inset 0 0 0 1px ${category.colorHex}30` 
                          : undefined,
                      }}
                      whileTap={{ scale: 0.97 }}
                      data-testid={`button-subcategory-${sub.id}`}
                    >
                      {isSubSelected && (
                        <motion.div
                          layoutId="subcategory-selected"
                          className="absolute inset-0 rounded-2xl"
                          style={{
                            background: `linear-gradient(135deg, ${category.colorHex}20 0%, transparent 50%)`,
                          }}
                        />
                      )}
                      
                      <div className="relative flex items-center gap-3">
                        <div 
                          className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                            isSubSelected ? "scale-100" : "scale-90 opacity-70"
                          )}
                          style={{
                            backgroundColor: isSubSelected 
                              ? `${category.colorHex}30` 
                              : `${category.colorHex}15`,
                          }}
                        >
                          {isSubSelected ? (
                            <Check 
                              className="w-4 h-4" 
                              style={{ color: category.colorHex }}
                            />
                          ) : (
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: category.colorHex }}
                            />
                          )}
                        </div>
                        
                        <span className={cn(
                          "font-semibold text-sm flex-1",
                          isSubSelected ? "text-foreground" : "text-foreground/80"
                        )}>
                          {subName}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export const CategoryPicker = memo(function CategoryPicker({ 
  selected, 
  onSelect 
}: CategoryPickerProps) {
  const [expandedCategory, setExpandedCategory] = useState<TaskCategoryId | null>(null);
  
  const handleToggleExpand = useCallback((categoryId: TaskCategoryId) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  }, []);
  
  const handleSelectCategory = useCallback((value: string) => {
    onSelect(value);
    setTimeout(() => setExpandedCategory(null), 200);
  }, [onSelect]);

  const categories = Object.entries(TASK_CATEGORIES_WITH_SUBS) as [TaskCategoryId, typeof TASK_CATEGORIES_WITH_SUBS[TaskCategoryId]][];
  
  // Sort categories to put pampering first
  const sortedCategories = useMemo(() => {
    const pamperingIndex = categories.findIndex(([id]) => id === 'pampering');
    if (pamperingIndex === -1) return categories;
    
    const pampering = categories[pamperingIndex];
    const others = categories.filter((_, index) => index !== pamperingIndex);
    return [pampering, ...others];
  }, [categories]);

  return (
    <motion.div 
      className="space-y-3"
      layout
    >
      {sortedCategories.map(([categoryId, category]) => (
        <CategoryCard
          key={categoryId}
          categoryId={categoryId}
          category={category}
          isExpanded={expandedCategory === categoryId}
          selectedValue={selected}
          onToggleExpand={() => handleToggleExpand(categoryId)}
          onSelectCategory={handleSelectCategory}
        />
      ))}
    </motion.div>
  );
});

export { findCategoryForSelection, getAllSubcategoryIds };
