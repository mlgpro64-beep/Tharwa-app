import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Briefcase, Clock, Check, X } from 'lucide-react';
import type { BidWithTasker } from '@shared/schema';
import { useTranslation } from 'react-i18next';

interface OfferCardProps {
  offer: BidWithTasker;
  onAccept?: (offerId: string) => void;
  onReject?: (offerId: string) => void;
  showActions?: boolean;
}

export const OfferCard = memo(function OfferCard({
  offer,
  onAccept,
  onReject,
  showActions = true
}: OfferCardProps) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const getInitials = useCallback((name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  const getStatusConfig = useCallback((status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-amber-500/10 text-amber-400', icon: Clock, label: isArabic ? 'معلق' : 'Pending' };
      case 'accepted':
        return { color: 'bg-emerald-500/10 text-emerald-400', icon: Check, label: isArabic ? 'مقبول' : 'Accepted' };
      case 'rejected':
        return { color: 'bg-red-500/10 text-red-400', icon: X, label: isArabic ? 'مرفوض' : 'Rejected' };
      default:
        return null;
    }
  }, [isArabic]);

  // Only render if tasker exists and is valid
  if (!offer.tasker || !offer.tasker.id) {
    return null;
  }

  const taskerName = offer.tasker.name || (isArabic ? 'منفذ غير معروف' : 'Unknown Tasker');
  const taskerRating = offer.tasker.rating ? parseFloat(String(offer.tasker.rating)) : 0;
  const taskerJobs = offer.tasker.completedTasks || 0;
  const statusConfig = getStatusConfig(offer.status);

  return (
    <motion.div
      whileTap={{ scale: 0.995 }}
      className="rounded-2xl bg-zinc-900/50 p-4 transition-all"
      data-testid={`offer-card-${offer.id}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="w-11 h-11 ring-2 ring-zinc-800">
          <AvatarImage src={offer.tasker?.avatar || undefined} alt={taskerName} />
          <AvatarFallback className="bg-zinc-800 text-white font-semibold text-sm">
            {getInitials(taskerName)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-semibold text-white truncate">{taskerName}</h4>
            {statusConfig && (
              <span className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
                statusConfig.color
              )}>
                <statusConfig.icon className="w-3 h-3" />
                {statusConfig.label}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-zinc-400 font-medium">{taskerRating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1 text-zinc-500">
              <Briefcase className="w-3.5 h-3.5" />
              <span>{taskerJobs} {isArabic ? 'مهمة' : 'jobs'}</span>
            </div>
          </div>

          {/* Message */}
          {offer.message && (
            <p className="text-sm text-zinc-500 mb-3 line-clamp-2">
              "{offer.message}"
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            {/* Offer Amount */}
            <span className="text-lg font-bold text-white">
              {formatCurrency(offer.amount, { locale: isArabic ? 'ar' : 'en' })}
            </span>

            {/* Actions */}
            {showActions && offer.status === 'pending' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onReject?.(offer.id)}
                  className="h-9 px-4 rounded-xl bg-zinc-800 text-zinc-400 text-sm font-medium transition-colors hover:bg-zinc-700"
                  data-testid={`button-reject-offer-${offer.id}`}
                >
                  {isArabic ? 'رفض' : 'Decline'}
                </button>
                <button
                  onClick={() => onAccept?.(offer.id)}
                  className="h-9 px-4 rounded-xl bg-white text-black text-sm font-medium transition-transform active:scale-[0.98]"
                  data-testid={`button-accept-offer-${offer.id}`}
                >
                  {isArabic ? 'قبول' : 'Accept'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
