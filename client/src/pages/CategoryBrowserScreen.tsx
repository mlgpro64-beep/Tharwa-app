import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { TASK_CATEGORIES_WITH_SUBS, type TaskCategoryId } from '@shared/schema';
import { 
  Sparkles, GraduationCap, Palette, HardHat, Star, MoreHorizontal,
  ArrowRight, ArrowLeft
} from 'lucide-react';

const categoryIcons: Record<TaskCategoryId, typeof Sparkles> = {
  beauty_fashion: Sparkles,
  teaching_education: GraduationCap,
  art: Palette,
  construction: HardHat,
  special: Star,
  other: MoreHorizontal,
};

const CategoryBrowserScreen = memo(function CategoryBrowserScreen() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const isArabic = i18n.language === 'ar';

  const handleCategorySelect = useCallback((categoryId: TaskCategoryId) => {
    setLocation(`/post-task/1?category=${categoryId}`);
  }, [setLocation]);

  const categories = Object.entries(TASK_CATEGORIES_WITH_SUBS) as [TaskCategoryId, typeof TASK_CATEGORIES_WITH_SUBS[TaskCategoryId]][];

  return (
    <div className={cn(
      "min-h-screen bg-background pb-32",
      isArabic && "rtl"
    )}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative pt-safe">
          <div className="px-6 pt-8 pb-6">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-foreground mb-2"
            >
              {isArabic ? 'اختر الفئة' : 'Choose Category'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground"
            >
              {isArabic ? 'حدد نوع الخدمة التي تحتاجها' : 'Select the type of service you need'}
            </motion.p>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {categories.map(([categoryId, category], index) => {
            const Icon = categoryIcons[categoryId];
            const name = isArabic ? category.nameAr : category.nameEn;
            const subcategoryCount = category.subcategories.length;
            const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

            return (
              <motion.button
                key={categoryId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleCategorySelect(categoryId)}
                className={cn(
                  "relative overflow-hidden rounded-3xl p-5 text-start transition-all",
                  "backdrop-blur-xl border border-white/10",
                  "bg-gradient-to-br from-white/10 to-white/5",
                  "hover:from-white/15 hover:to-white/8",
                  "active:scale-[0.98]"
                )}
                style={{
                  boxShadow: `0 8px 32px -8px ${category.colorHex}20`,
                }}
                whileTap={{ scale: 0.98 }}
                data-testid={`button-browse-category-${categoryId}`}
              >
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `linear-gradient(135deg, ${category.colorHex}30 0%, transparent 70%)`,
                  }}
                />
                
                <div className="relative">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
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
                  
                  <h3 className="text-base font-bold text-foreground mb-1 line-clamp-2">
                    {name}
                  </h3>
                  
                  {subcategoryCount > 0 && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {subcategoryCount} {isArabic ? 'تخصصات' : 'specialties'}
                    </p>
                  )}

                  <div 
                    className="flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: category.colorHex }}
                  >
                    <span>{isArabic ? 'اطلب الآن' : 'Request now'}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-5 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-1">
                {isArabic ? 'هل تحتاج مساعدة؟' : 'Need help?'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'اختر الفئة الأقرب لاحتياجك، ويمكنك وصف طلبك بالتفصيل في الخطوة التالية'
                  : 'Choose the closest category to your need, and you can describe your request in detail in the next step'
                }
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
});

export default CategoryBrowserScreen;
