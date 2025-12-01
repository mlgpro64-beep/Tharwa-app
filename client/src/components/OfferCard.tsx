import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { BidWithTasker } from '@shared/schema';

interface OfferCardProps {
  offer: BidWithTasker;
  onAccept?: (offerId: string) => void;
  onReject?: (offerId: string) => void;
  showActions?: boolean;
}

export function OfferCard({ offer, onAccept, onReject, showActions = true }: OfferCardProps) {
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-warning/10 text-warning">Pending</span>;
      case 'accepted':
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-success/10 text-success">Accepted</span>;
      case 'rejected':
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Rejected</span>;
      default:
        return null;
    }
  };

  const taskerName = offer.tasker?.name || 'Unknown Tasker';
  const taskerRating = offer.tasker?.rating ? parseFloat(String(offer.tasker.rating)) : 0;
  const taskerJobs = offer.tasker?.completedTasks || 0;

  return (
    <div 
      className="bg-card p-4 rounded-2xl border border-border transition-all duration-300 hover:shadow-md"
      data-testid={`offer-card-${offer.id}`}
    >
      <div className="flex items-start gap-4">
        <Avatar className="w-14 h-14 border-2 border-border">
          <AvatarImage src={offer.tasker?.avatar || undefined} alt={taskerName} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            {getInitials(taskerName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-bold text-foreground truncate">{taskerName}</h4>
            {getStatusBadge(offer.status)}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined material-symbols-filled text-warning text-sm">star</span>
              <span className="font-bold">{taskerRating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">work</span>
              <span>{taskerJobs} jobs</span>
            </div>
          </div>

          {offer.message && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              "{offer.message}"
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-primary">
              {formatCurrency(offer.amount)}
            </span>

            {showActions && offer.status === 'pending' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onReject?.(offer.id)}
                  className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-bold text-sm hover:bg-muted/80 active:scale-95 transition-all"
                  data-testid={`button-reject-offer-${offer.id}`}
                >
                  Decline
                </button>
                <button
                  onClick={() => onAccept?.(offer.id)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-primary/25"
                  data-testid={`button-accept-offer-${offer.id}`}
                >
                  Accept
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
