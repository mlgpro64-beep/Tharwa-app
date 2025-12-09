// Tasker Level System
// Levels: bronze → silver → gold → platinum → diamond

export type TaskerLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface LevelInfo {
  level: TaskerLevel;
  nameAr: string;
  nameEn: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  icon: string;
  benefits: string[];
}

export const LEVELS: LevelInfo[] = [
  {
    level: 'bronze',
    nameAr: 'برونزي',
    nameEn: 'Bronze',
    minPoints: 0,
    maxPoints: 99,
    color: 'amber-700',
    icon: 'award',
    benefits: ['الوصول للمهام الأساسية'],
  },
  {
    level: 'silver',
    nameAr: 'فضي',
    nameEn: 'Silver',
    minPoints: 100,
    maxPoints: 299,
    color: 'gray-400',
    icon: 'star',
    benefits: ['أولوية في العروض', 'شارة مميزة'],
  },
  {
    level: 'gold',
    nameAr: 'ذهبي',
    nameEn: 'Gold',
    minPoints: 300,
    maxPoints: 599,
    color: 'yellow-500',
    icon: 'trophy',
    benefits: ['ظهور في أعلى نتائج البحش', 'عمولة مخفضة 4%'],
  },
  {
    level: 'platinum',
    nameAr: 'بلاتيني',
    nameEn: 'Platinum',
    minPoints: 600,
    maxPoints: 999,
    color: 'purple-500',
    icon: 'crown',
    benefits: ['شارة بلاتينية', 'عمولة مخفضة 3%', 'دعم أولوية'],
  },
  {
    level: 'diamond',
    nameAr: 'ماسي',
    nameEn: 'Diamond',
    minPoints: 1000,
    maxPoints: Infinity,
    color: 'cyan-500',
    icon: 'diamond',
    benefits: ['شارة ماسية', 'عمولة مخفضة 2%', 'دعم VIP', 'مكافآت حصرية'],
  },
];

// Points earned for different actions
export const POINT_VALUES = {
  taskCompleted: 10,
  fiveStarRating: 5,
  fourStarRating: 3,
  threeStarRating: 1,
  repeatClient: 5,
  fastCompletion: 3, // Completed before scheduled time
  directRequest: 2,
};

// Calculate level from experience points
export function calculateLevel(experiencePoints: number): TaskerLevel {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (experiencePoints >= LEVELS[i].minPoints) {
      return LEVELS[i].level;
    }
  }
  return 'bronze';
}

// Get level info
export function getLevelInfo(level: TaskerLevel): LevelInfo {
  return LEVELS.find(l => l.level === level) || LEVELS[0];
}

// Calculate progress to next level
export function calculateProgress(experiencePoints: number): {
  currentLevel: LevelInfo;
  nextLevel: LevelInfo | null;
  progressPercent: number;
  pointsToNext: number;
} {
  const currentLevel = getLevelInfo(calculateLevel(experiencePoints));
  const currentIndex = LEVELS.findIndex(l => l.level === currentLevel.level);
  const nextLevel = currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;
  
  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      progressPercent: 100,
      pointsToNext: 0,
    };
  }
  
  const levelRange = nextLevel.minPoints - currentLevel.minPoints;
  const pointsInLevel = experiencePoints - currentLevel.minPoints;
  const progressPercent = Math.min(100, Math.round((pointsInLevel / levelRange) * 100));
  const pointsToNext = nextLevel.minPoints - experiencePoints;
  
  return {
    currentLevel,
    nextLevel,
    progressPercent,
    pointsToNext,
  };
}

// Get commission rate based on level
export function getCommissionRate(level: TaskerLevel): number {
  switch (level) {
    case 'diamond': return 0.02;
    case 'platinum': return 0.03;
    case 'gold': return 0.04;
    default: return 0.05; // 5% default
  }
}
