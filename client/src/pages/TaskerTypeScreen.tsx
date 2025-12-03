import { useState, memo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { ArrowLeft, Briefcase, Award, Check, ChevronLeft, Zap, Clock, FileCheck, Shield } from 'lucide-react';

type TaskerType = 'general' | 'specialized';

interface TaskerTypeOption {
  id: TaskerType;
  titleKey: string;
  subtitleKey: string;
  icon: typeof Briefcase;
  featuresKeys: string[];
  gradient: string;
  badgeKey: string;
  badgeColor: string;
}

const taskerTypes: TaskerTypeOption[] = [
  {
    id: 'general',
    titleKey: 'taskerType.general.title',
    subtitleKey: 'taskerType.general.subtitle',
    icon: Briefcase,
    featuresKeys: [
      'taskerType.general.features.anyTask',
      'taskerType.general.features.noCertificate',
      'taskerType.general.features.immediateActivation',
    ],
    gradient: 'from-emerald-500 to-teal-500',
    badgeKey: 'taskerType.general.badge',
    badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'specialized',
    titleKey: 'taskerType.specialized.title',
    subtitleKey: 'taskerType.specialized.subtitle',
    icon: Award,
    featuresKeys: [
      'taskerType.specialized.features.professional',
      'taskerType.specialized.features.uploadCertificate',
      'taskerType.specialized.features.pendingReview',
    ],
    gradient: 'from-amber-500 to-orange-500',
    badgeKey: 'taskerType.specialized.badge',
    badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  },
];

const featureIcons: Record<string, typeof Zap> = {
  'taskerType.general.features.anyTask': Briefcase,
  'taskerType.general.features.noCertificate': Shield,
  'taskerType.general.features.immediateActivation': Zap,
  'taskerType.specialized.features.professional': Award,
  'taskerType.specialized.features.uploadCertificate': FileCheck,
  'taskerType.specialized.features.pendingReview': Clock,
};

const TaskerTypeCard = memo(function TaskerTypeCard({
  option,
  isSelected,
  onSelect,
  t,
}: {
  option: TaskerTypeOption;
  isSelected: boolean;
  onSelect: () => void;
  t: (key: string) => string;
}) {
  const Icon = option.icon;

  return (
    <motion.button
      layout
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full text-start p-6 rounded-3xl transition-all duration-300 relative overflow-hidden",
        isSelected
          ? "glass-premium shadow-xl border-2 border-primary"
          : "glass hover:shadow-lg border-2 border-transparent"
      )}
      data-testid={`button-tasker-type-${option.id}`}
    >
      <div className="flex items-start gap-4 relative z-10">
        <motion.div
          animate={{
            scale: isSelected ? 1.05 : 1,
            rotate: isSelected ? 5 : 0,
          }}
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg",
            isSelected
              ? `bg-gradient-to-br ${option.gradient} text-white shadow-lg`
              : "bg-muted/50 text-muted-foreground"
          )}
        >
          <Icon className="w-7 h-7" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-xl font-bold text-foreground">{t(option.titleKey)}</h3>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", option.badgeColor)}>
              {t(option.badgeKey)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t(option.subtitleKey)}</p>

          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {option.featuresKeys.map((featureKey, idx) => {
                  const FeatureIcon = featureIcons[featureKey] || Check;
                  return (
                    <motion.div
                      key={featureKey}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3 text-sm text-foreground/80 rtl:flex-row-reverse rtl:text-right"
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                        isSelected && option.id === 'general' ? "bg-emerald-500/20" : "bg-amber-500/20"
                      )}>
                        <FeatureIcon className={cn(
                          "w-3.5 h-3.5",
                          isSelected && option.id === 'general' ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                        )} />
                      </div>
                      <span className="flex-1">{t(featureKey)}</span>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          animate={{
            scale: isSelected ? 1 : 0.8,
            opacity: isSelected ? 1 : 0.5,
          }}
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center transition-all",
            isSelected
              ? "bg-primary text-white shadow-lg shadow-primary/30"
              : "border-2 border-muted"
          )}
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              <Check className="w-4 h-4" />
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.button>
  );
});

const TaskerTypeScreen = memo(function TaskerTypeScreen() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<TaskerType | null>(null);

  const handleContinue = useCallback(() => {
    if (selectedType) {
      setLocation(`/register?taskerType=${selectedType}`);
    }
  }, [selectedType, setLocation]);

  const handleBack = useCallback(() => {
    setLocation('/role');
  }, [setLocation]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-primary/5 pt-safe">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </motion.button>

        <div className="flex gap-2">
          {[0, 1, 2].map((step) => (
            <motion.div
              key={step}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: step * 0.1 }}
              className={cn(
                "w-10 h-1.5 rounded-full transition-colors",
                step <= 1 ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="w-11" />
      </motion.div>

      <div className="flex-1 flex flex-col px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
            {t('taskerType.title')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('taskerType.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mt-8 flex-1"
        >
          {taskerTypes.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <TaskerTypeCard
                option={option}
                isSelected={selectedType === option.id}
                onSelect={() => setSelectedType(option.id)}
                t={t}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 pb-safe"
        >
          <motion.button
            whileHover={{ scale: selectedType ? 1.02 : 1 }}
            whileTap={{ scale: selectedType ? 0.98 : 1 }}
            onClick={handleContinue}
            disabled={!selectedType}
            className={cn(
              "w-full h-14 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2",
              selectedType
                ? "gradient-primary text-white shadow-xl shadow-primary/25"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            data-testid="button-continue"
          >
            {t('common.next')}
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
});

export default TaskerTypeScreen;
