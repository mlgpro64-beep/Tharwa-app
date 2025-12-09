// Enhanced Rating Component with detailed subcategories
import { Star, Wrench, Clock, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export function StarRating({ 
  rating, 
  onChange, 
  readonly = false, 
  size = 'md',
  showValue = false 
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  const handleClick = (star: number) => {
    if (!readonly && onChange) {
      onChange(star);
    }
  };
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          disabled={readonly}
          className={cn(
            "transition-transform",
            !readonly && "hover:scale-110 cursor-pointer",
            readonly && "cursor-default"
          )}
          data-testid={`star-${star}`}
        >
          <Star
            className={cn(
              sizeClasses[size],
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-muted-foreground"
            )}
          />
        </button>
      ))}
      {showValue && (
        <span className="text-sm text-muted-foreground mr-1">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
}

interface DetailedRatingCategory {
  key: 'quality' | 'speed' | 'communication';
  label: string;
  icon: typeof Wrench;
  rating: number;
}

interface DetailedRatingInputProps {
  overallRating: number;
  qualityRating: number;
  speedRating: number;
  communicationRating: number;
  onOverallChange: (rating: number) => void;
  onQualityChange: (rating: number) => void;
  onSpeedChange: (rating: number) => void;
  onCommunicationChange: (rating: number) => void;
}

export function DetailedRatingInput({
  overallRating,
  qualityRating,
  speedRating,
  communicationRating,
  onOverallChange,
  onQualityChange,
  onSpeedChange,
  onCommunicationChange,
}: DetailedRatingInputProps) {
  const categories: DetailedRatingCategory[] = [
    { key: 'quality', label: 'جودة العمل', icon: Wrench, rating: qualityRating },
    { key: 'speed', label: 'سرعة الإنجاز', icon: Clock, rating: speedRating },
    { key: 'communication', label: 'التواصل', icon: MessageCircle, rating: communicationRating },
  ];
  
  const handleCategoryChange = (key: string, value: number) => {
    switch (key) {
      case 'quality': onQualityChange(value); break;
      case 'speed': onSpeedChange(value); break;
      case 'communication': onCommunicationChange(value); break;
    }
  };
  
  return (
    <div className="space-y-4" data-testid="detailed-rating-input">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">التقييم العام</p>
        <div className="flex justify-center">
          <StarRating 
            rating={overallRating} 
            onChange={onOverallChange} 
            size="lg"
          />
        </div>
      </div>
      
      <div className="border-t pt-4 space-y-3">
        <p className="text-sm text-muted-foreground text-center">تقييم تفصيلي (اختياري)</p>
        
        {categories.map(({ key, label, icon: Icon, rating }) => (
          <div 
            key={key} 
            className="flex items-center justify-between"
            data-testid={`rating-category-${key}`}
          >
            <div className="flex items-center gap-2 text-sm">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span>{label}</span>
            </div>
            <StarRating 
              rating={rating} 
              onChange={(value) => handleCategoryChange(key, value)} 
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface DetailedRatingDisplayProps {
  overallRating: number;
  qualityRating?: number | null;
  speedRating?: number | null;
  communicationRating?: number | null;
  totalReviews?: number;
  compact?: boolean;
}

export function DetailedRatingDisplay({
  overallRating,
  qualityRating,
  speedRating,
  communicationRating,
  totalReviews,
  compact = false,
}: DetailedRatingDisplayProps) {
  const hasDetails = qualityRating || speedRating || communicationRating;
  
  if (compact) {
    return (
      <div className="flex items-center gap-1" data-testid="rating-display-compact">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{Number(overallRating).toFixed(1)}</span>
        {totalReviews !== undefined && (
          <span className="text-muted-foreground text-sm">({totalReviews})</span>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-3" data-testid="rating-display-full">
      <div className="flex items-center gap-2">
        <StarRating rating={Number(overallRating)} readonly size="md" />
        <span className="font-semibold text-lg">{Number(overallRating).toFixed(1)}</span>
        {totalReviews !== undefined && (
          <span className="text-muted-foreground">({totalReviews} تقييم)</span>
        )}
      </div>
      
      {hasDetails && (
        <div className="grid grid-cols-3 gap-2 text-sm">
          {qualityRating && (
            <div className="flex flex-col items-center" data-testid="detail-quality">
              <Wrench className="w-4 h-4 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">الجودة</span>
              <span className="font-medium">{qualityRating}</span>
            </div>
          )}
          {speedRating && (
            <div className="flex flex-col items-center" data-testid="detail-speed">
              <Clock className="w-4 h-4 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">السرعة</span>
              <span className="font-medium">{speedRating}</span>
            </div>
          )}
          {communicationRating && (
            <div className="flex flex-col items-center" data-testid="detail-communication">
              <MessageCircle className="w-4 h-4 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">التواصل</span>
              <span className="font-medium">{communicationRating}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
