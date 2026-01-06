import { memo, useCallback } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { ArrowDownLeft, ArrowUpRight, Check, Clock } from 'lucide-react';
import type { Transaction } from '@shared/schema';

interface TransactionCardProps {
  transaction: Transaction;
  index?: number;
}

export const TransactionCard = memo(function TransactionCard({ transaction, index = 0 }: TransactionCardProps) {

  const formatDate = useCallback((date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  const isCredit = transaction.type === 'credit';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link 
        href={`/wallet/transaction/${transaction.id}`}
        data-testid={`transaction-card-${transaction.id}`}
      >
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-4 p-4 glass rounded-2xl cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center",
            isCredit ? "bg-success/15" : "bg-destructive/15"
          )}>
            {isCredit ? (
              <ArrowDownLeft className="w-5 h-5 text-success" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-destructive" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-foreground truncate">{transaction.title}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>{formatDate(transaction.createdAt)}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] flex items-center gap-1",
                transaction.status === 'completed' 
                  ? "bg-success/15 text-success" 
                  : "bg-warning/15 text-warning"
              )}>
                {transaction.status === 'completed' ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                {transaction.status}
              </span>
            </div>
          </div>
          
          <div className={cn(
            "font-extrabold text-lg",
            isCredit ? 'text-success' : 'text-destructive'
          )}>
            {isCredit ? '+' : '-'}{formatCurrency(transaction.amount, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2,
              locale: 'en'
            })}
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
});
