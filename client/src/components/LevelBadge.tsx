// Tasker Level Badge Component
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, Star, Award, Crown, Diamond } from "lucide-react";

type TaskerLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface LevelInfo {
  level: TaskerLevel;
  nameAr: string;
  nameEn: string;
  color: string;
  bgClass: string;
  textClass: string;
}

const LEVELS: LevelInfo[] = [
  {
    level: 'bronze',
    nameAr: 'برونزي',
    nameEn: 'Bronze',
    color: '#CD7F32',
    bgClass: 'bg-amber-700/20 dark:bg-amber-800/30',
    textClass: 'text-amber-700 dark:text-amber-500',
  },
  {
    level: 'silver',
    nameAr: 'فضي',
    nameEn: 'Silver',
    color: '#C0C0C0',
    bgClass: 'bg-gray-400/20 dark:bg-gray-500/30',
    textClass: 'text-gray-600 dark:text-gray-300',
  },
  {
    level: 'gold',
    nameAr: 'ذهبي',
    nameEn: 'Gold',
    color: '#FFD700',
    bgClass: 'bg-yellow-500/20 dark:bg-yellow-600/30',
    textClass: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    level: 'platinum',
    nameAr: 'بلاتيني',
    nameEn: 'Platinum',
    color: '#E5E4E2',
    bgClass: 'bg-purple-500/20 dark:bg-purple-600/30',
    textClass: 'text-purple-600 dark:text-purple-400',
  },
  {
    level: 'diamond',
    nameAr: 'ماسي',
    nameEn: 'Diamond',
    color: '#B9F2FF',
    bgClass: 'bg-cyan-500/20 dark:bg-cyan-600/30',
    textClass: 'text-cyan-600 dark:text-cyan-400',
  },
];

const LevelIcon = ({ level, className }: { level: TaskerLevel; className?: string }) => {
  const iconProps = { className: cn("w-4 h-4", className) };
  
  switch (level) {
    case 'bronze': return <Award {...iconProps} />;
    case 'silver': return <Star {...iconProps} />;
    case 'gold': return <Trophy {...iconProps} />;
    case 'platinum': return <Crown {...iconProps} />;
    case 'diamond': return <Diamond {...iconProps} />;
    default: return <Award {...iconProps} />;
  }
};

interface LevelBadgeProps {
  level: TaskerLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LevelBadge({ level, showLabel = true, size = 'md', className }: LevelBadgeProps) {
  const levelInfo = LEVELS.find(l => l.level === level) || LEVELS[0];
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  };
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 border-0",
        levelInfo.bgClass,
        levelInfo.textClass,
        sizeClasses[size],
        className
      )}
      data-testid={`badge-level-${level}`}
    >
      <LevelIcon level={level} />
      {showLabel && <span>{levelInfo.nameAr}</span>}
    </Badge>
  );
}

interface LevelProgressProps {
  experiencePoints: number;
  className?: string;
}

export function LevelProgress({ experiencePoints, className }: LevelProgressProps) {
  const getCurrentLevel = (points: number): LevelInfo => {
    if (points >= 1000) return LEVELS[4]; // diamond
    if (points >= 600) return LEVELS[3]; // platinum
    if (points >= 300) return LEVELS[2]; // gold
    if (points >= 100) return LEVELS[1]; // silver
    return LEVELS[0]; // bronze
  };
  
  const getNextLevel = (current: TaskerLevel): LevelInfo | null => {
    const idx = LEVELS.findIndex(l => l.level === current);
    return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  };
  
  const getProgress = (points: number): { percent: number; toNext: number } => {
    if (points >= 1000) return { percent: 100, toNext: 0 };
    
    const thresholds = [0, 100, 300, 600, 1000];
    let currentIdx = 0;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (points >= thresholds[i]) {
        currentIdx = i;
        break;
      }
    }
    
    const currentMin = thresholds[currentIdx];
    const nextMin = thresholds[currentIdx + 1] || 1000;
    const range = nextMin - currentMin;
    const pointsInLevel = points - currentMin;
    
    return {
      percent: Math.round((pointsInLevel / range) * 100),
      toNext: nextMin - points,
    };
  };
  
  const currentLevel = getCurrentLevel(experiencePoints);
  const nextLevel = getNextLevel(currentLevel.level);
  const { percent, toNext } = getProgress(experiencePoints);
  
  return (
    <div className={cn("space-y-2", className)} data-testid="level-progress">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LevelBadge level={currentLevel.level} size="sm" />
          <span className="text-sm text-muted-foreground">
            {experiencePoints} نقطة
          </span>
        </div>
        {nextLevel && (
          <span className="text-xs text-muted-foreground">
            {toNext} نقطة للـ{nextLevel.nameAr}
          </span>
        )}
      </div>
      
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", currentLevel.bgClass)}
          style={{ width: `${percent}%`, backgroundColor: currentLevel.color }}
          data-testid="progress-bar"
        />
      </div>
    </div>
  );
}
