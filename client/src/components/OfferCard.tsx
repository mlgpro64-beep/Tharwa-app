import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Briefcase, Clock, Check, X, DollarSign } from 'lucide-react';
import type { BidWithTasker } from '@shared/schema';

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
  const formatCurrency = useCallback((amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }, []);

  const getInitials = useCallback((name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const styles = {
      pending: { bg: 'bg-warning/15 text-warning border-warning/20', icon: Clock, label: 'Pending' },
      accepted: { bg: 'bg-success/15 text-success border-success/20', icon: Check, label: 'Accepted' },
      rejected: { bg: 'bg-destructive/15 text-destructive border-destructive/20', icon: X, label: 'Rejected' },
    };
    
    const style = styles[status as keyof typeof styles];
    if (!style) return null;
    
    const Icon = style.icon;
    return (
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 border",
        style.bg
      )}>
        <Icon className="w-3 h-3" />
        {style.label}
      </span>
    );
  }, []);

  const taskerName = offer.tasker?.name || 'Unknown Tasker';
  const taskerRating = offer.tasker?.rating ? parseFloat(String(offer.tasker.rating)) : 0;
  const taskerJobs = offer.tasker?.completedTasks || 0;

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      className="glass rounded-3xl p-5 transition-all hover:shadow-lg"
      data-testid={`offer-card-${offer.id}`}
    >
      <div className="flex items-start gap-4">
        <Avatar className="w-14 h-14 border-2 border-white/20 shadow-lg">
          <AvatarImage src={offer.tasker?.avatar || undefined} alt={taskerName} />
          <AvatarFallback className="gradient-primary text-white font-bold">
            {getInitials(taskerName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="font-bold text-foreground text-lg truncate">{taskerName}</h4>
            {getStatusBadge(offer.status)}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="font-bold">{taskerRating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              <span>{taskerJobs} jobs</span>
            </div>
          </div>

          {offer.message && (
            <div className="bg-white/30 dark:bg-white/5 rounded-xl p-3 mb-4">
              <p className="text-sm text-muted-foreground italic">
                "{offer.message}"
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-primary/10 px-4 py-2 rounded-xl">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-xl font-extrabold text-primary">
                {formatCurrency(offer.amount).replace('$', '')}
              </span>
            </div>

            {showActions && offer.status === 'pending' && (
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onReject?.(offer.id)}
                  className="px-5 py-2.5 rounded-xl glass-button font-bold text-sm"
                  data-testid={`button-reject-offer-${offer.id}`}
                >
                  Decline
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAccept?.(offer.id)}
                  className="px-5 py-2.5 rounded-xl gradient-primary text-white font-bold text-sm shadow-lg shadow-primary/25"
                  data-testid={`button-accept-offer-${offer.id}`}
                >
                  Accept
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
