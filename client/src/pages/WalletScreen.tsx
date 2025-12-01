import { Link } from 'wouter';
import { Screen } from '@/components/layout/Screen';
import { TransactionCard } from '@/components/TransactionCard';
import { CountUp } from '@/components/CountUp';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import type { Transaction, User } from '@shared/schema';

export default function WalletScreen() {
  const { data: user } = useQuery<User>({
    queryKey: ['/api/users/me'],
  });

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const balance = user?.balance ? parseFloat(String(user.balance)) : 0;

  return (
    <Screen className="px-0">
      <div className="px-6 py-4">
        <h1 className="text-2xl font-extrabold text-foreground mb-6">Wallet</h1>

        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 rounded-3xl text-primary-foreground mb-6 shadow-lg shadow-primary/25">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm opacity-80 font-medium">Available Balance</p>
              <p className="text-4xl font-extrabold">
                $<CountUp end={balance} decimals={2} />
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Link href="/wallet/add-card">
              <button 
                className="w-full h-12 bg-white/20 hover:bg-white/30 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                data-testid="button-add-funds"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Add Funds
              </button>
            </Link>
            <Link href="/wallet/withdraw">
              <button 
                className="w-full h-12 bg-white/20 hover:bg-white/30 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                data-testid="button-withdraw"
              >
                <span className="material-symbols-outlined text-lg">arrow_upward</span>
                Withdraw
              </button>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Recent Transactions</h2>
        </div>
      </div>

      <div className="px-6 space-y-3 pb-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card p-4 rounded-2xl border border-border flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </>
        ) : transactions && transactions.length > 0 ? (
          transactions.map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))
        ) : (
          <div className="bg-card p-8 rounded-3xl border border-border text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-muted-foreground">receipt_long</span>
            </div>
            <h3 className="font-bold text-foreground mb-2">No transactions yet</h3>
            <p className="text-sm text-muted-foreground">
              Your transaction history will appear here
            </p>
          </div>
        )}
      </div>
    </Screen>
  );
}
