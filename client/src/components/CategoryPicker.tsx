import { useState, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TASK_CATEGORIES_WITH_SUBS, type TaskCategoryId } from '@shared/schema';
import { 
  Sparkles, GraduationCap, Palette, HardHat, Star, MoreHorizontal,
  ChevronDown, Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CategoryPickerProps {
  selected: string | null;
  onSelect: (category: string) => void;
}

const categoryIcons: Record<TaskCategoryId, typeof Sparkles> = {
  beauty_fashion: Sparkles,
  teaching_education: GraduationCap,
  art: Palette,
  construction: HardHat,
  special: Star,
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
  
  if (selected === 'other') return 'other';
  
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
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const Icon = categoryIcons[categoryId];
  const name = isArabic ? category.nameAr : category.nameEn;
  const hasSubcategories = category.subcategories.length > 0;
  
  const mainCategoryOfSelection = useMemo(() => findCategoryForSelection(selectedValue), [selectedValue]);
  const isSelected = mainCategoryOfSelection === categoryId;
  
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
      className="overflow-visible"
    >
      <motion.button
        onClick={handleClick}
        className={cn(
          "relative w-full overflow-hidden rounded-[24px] transition-all duration-300",
          "backdrop-blur-2xl border border-white/10",
          isExpanded 
            ? "bg-gradient-to-br from-white/15 to-white/5 shadow-2xl" 
            : "bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/8",
          isSelected && !isExpanded && "ring-2 ring-primary shadow-lg shadow-primary/20"
        )}
        style={{
          boxShadow: isExpanded 
            ? `0 20px 40px -15px ${category.colorHex}30` 
            : undefined,
        }}
        whileTap={{ scale: 0.98 }}
        data-testid={`button-category-${categoryId}`}
      >
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(135deg, ${category.colorHex}40 0%, transparent 60%)`,
          }}
        />
        
        <div className="relative p-5">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${category.colorHex}30 0%, ${category.colorHex}10 100%)`,
                boxShadow: `0 8px 24px -8px ${category.colorHex}40`,
              }}
            >
              <Icon 
                className="w-7 h-7"
                style={{ color: category.colorHex }}
              />
            </div>
            
            <div className="flex-1 text-start">
              <h3 className="text-lg font-bold text-foreground mb-0.5">
                {name}
              </h3>
              {hasSubcategories && (
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
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${category.colorHex}30` }}
              >
                <Check className="w-5 h-5" style={{ color: category.colorHex }} />
              </div>
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

  return (
    <motion.div 
      className="space-y-3"
      layout
    >
      {categories.map(([categoryId, category]) => (
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
