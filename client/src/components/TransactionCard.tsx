import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import type { Transaction } from '@shared/schema';

interface TransactionCardProps {
  transaction: Transaction;
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getIconColor = (type: string) => {
    return type === 'credit' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive';
  };

  return (
    <Link 
      href={`/wallet/transaction/${transaction.id}`}
      data-testid={`transaction-card-${transaction.id}`}
    >
      <div className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border transition-all duration-300 hover:shadow-md active:scale-[0.99] cursor-pointer">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", getIconColor(transaction.type))}>
          <span className="material-symbols-outlined">
            {transaction.icon || (transaction.type === 'credit' ? 'arrow_downward' : 'arrow_upward')}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-foreground truncate">{transaction.title}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDate(transaction.createdAt)}</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]",
              transaction.status === 'completed' 
                ? "bg-success/10 text-success" 
                : "bg-warning/10 text-warning"
            )}>
              {transaction.status}
            </span>
          </div>
        </div>
        
        <div className={cn(
          "font-extrabold text-lg",
          transaction.type === 'credit' ? 'text-success' : 'text-destructive'
        )}>
          {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </div>
      </div>
    </Link>
  );
}
