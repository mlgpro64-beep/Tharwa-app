import { useState, memo, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Skeleton, EmptyState } from '@/components/ui/animated';
import { ProfessionalBadgeList } from '@/components/ProfessionalBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { PROFESSIONAL_CATEGORIES, type ProfessionalCategoryId } from '@shared/schema';
import {
  Search, SearchX, X, Filter, Star, CheckCircle,
  ArrowLeft, Shield, ChevronRight, Users, Award
} from 'lucide-react';
import type { User, ProfessionalRole, UserProfessionalRole } from '@shared/schema';

type TaskerWithRoles = User & {
  professionalRoles?: (UserProfessionalRole & { role: ProfessionalRole })[];
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const TaskerCard = memo(function TaskerCard({
  tasker,
  index
}: {
  tasker: TaskerWithRoles;
  index: number;
}) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const getInitials = useCallback((name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  const isVerified = tasker.verificationStatus === 'approved';
  const rating = tasker.rating ? parseFloat(String(tasker.rating)).toFixed(1) : '0.0';
  const completedTasks = tasker.completedTasks || 0;
  const bioPreview = tasker.bio
    ? tasker.bio.length > 80
      ? `${tasker.bio.slice(0, 80)}...`
      : tasker.bio
    : null;

  return (
    <Link href={`/profile/${tasker.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="glass-premium rounded-3xl p-5 cursor-pointer transition-all duration-200"
        data-testid={`card-tasker-${tasker.id}`}
      >
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar className="w-16 h-16 border-2 border-white/30 shadow-lg">
              <AvatarImage src={tasker.avatar || undefined} alt={tasker.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-bold text-lg">
                {getInitials(tasker.name)}
              </AvatarFallback>
            </Avatar>
            {isVerified && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center shadow-lg shadow-success/30"
              >
                <Shield className="w-3.5 h-3.5 text-white" />
              </motion.div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-foreground text-lg truncate" data-testid={`text-tasker-name-${tasker.id}`}>
                {tasker.name}
              </h3>
            </div>

            <div className="flex items-center gap-3 mb-2.5">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="text-sm font-semibold text-foreground" data-testid={`text-tasker-rating-${tasker.id}`}>
                  {rating}
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-medium" data-testid={`text-tasker-completed-${tasker.id}`}>
                  {completedTasks} {isArabic ? 'مهمة' : 'tasks'}
                </span>
              </div>
            </div>

            {tasker.professionalRoles && tasker.professionalRoles.length > 0 && (
              <div className="mb-2.5" data-testid={`list-tasker-badges-${tasker.id}`}>
                <ProfessionalBadgeList
                  roles={tasker.professionalRoles}
                  size="sm"
                  maxDisplay={2}
                />
              </div>
            )}

            {bioPreview && (
              <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-tasker-bio-${tasker.id}`}>
                {bioPreview}
              </p>
            )}
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1 rtl:rotate-180" />
        </div>
      </motion.div>
    </Link>
  );
});

const TaskerCardSkeleton = memo(function TaskerCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-3xl p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="w-16 h-16 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <div className="flex gap-3">
                <Skeleton className="h-4 w-14 rounded-lg" />
                <Skeleton className="h-4 w-20 rounded-lg" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

const SearchTaskersScreen = memo(function SearchTaskersScreen() {
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    return params.toString();
  }, [searchQuery]);

  const { data: taskers, isLoading } = useQuery<TaskerWithRoles[]>({
    queryKey: ['/api/taskers/search', queryParams],
    queryFn: async () => {
      const response = await fetch(`/api/taskers/search?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch taskers');
      return response.json();
    },
  });

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
  }, []);

  const taskerCount = taskers?.length || 0;

  return (
    <div className="min-h-screen gradient-mesh pt-safe pb-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-primary/25 to-primary/5 rounded-full blur-3xl rtl:-left-24 rtl:right-auto"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ delay: 0.3 }}
          className="absolute top-60 -left-20 w-48 h-48 bg-gradient-to-tr from-accent/25 to-transparent rounded-full blur-3xl rtl:-right-20 rtl:left-auto"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 px-5 py-5"
      >
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-4 mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setLocation('/home')}
            className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
            data-testid="button-back-search"
          >
            <ArrowLeft className="w-5 h-5 text-foreground/80 rtl:rotate-180" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              {t('taskers.title', 'Find Taskers')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {taskerCount} {t('taskers.available', 'taskers available')}
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="relative mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60 rtl:right-4 rtl:left-auto" />
            <input
              type="search"
              placeholder={t('taskers.searchPlaceholder', 'Search by name or skill...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 ps-12 pe-12 rounded-2xl glass-input text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium shadow-sm"
              data-testid="input-search-taskers"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-muted/90 hover:bg-muted transition-all rtl:left-4 rtl:right-auto"
                  data-testid="button-clear-search"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      <div className="relative z-10 px-5">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TaskerCardSkeleton count={4} />
            </motion.div>
          ) : taskers && taskers.length > 0 ? (
            <motion.div
              key="taskers"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {taskers.map((tasker, index) => (
                <motion.div key={tasker.id} variants={itemVariants}>
                  <TaskerCard tasker={tasker} index={index} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <EmptyState
                icon={<Users className="w-8 h-8" />}
                title={t('taskers.empty.title', 'No taskers found')}
                description={t('taskers.empty.description', 'Try adjusting your filters or search terms')}
                action={
                  searchQuery && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleClearFilters}
                      className="glass-premium text-foreground px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
                      data-testid="button-clear-filters"
                    >
                      <X className="w-4 h-4" />
                      {t('taskers.clearFilters', 'Clear filters')}
                    </motion.button>
                  )
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default SearchTaskersScreen;
