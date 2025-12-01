import { memo, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { TransactionCard } from '@/components/TransactionCard';
import { CountUp } from '@/components/CountUp';
import { useQuery } from '@tanstack/react-query';
import { Skeleton, EmptyState } from '@/components/ui/animated';
import { Wallet, Plus, ArrowUpRight, Receipt, ArrowLeft } from 'lucide-react';
import type { Transaction, User } from '@shared/schema';

const WalletScreen = memo(function WalletScreen() {
  const [, setLocation] = useLocation();
  
  const { data: user } = useQuery<User>({
    queryKey: ['/api/users/me'],
  });

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const balance = useMemo(() => 
    user?.balance ? parseFloat(String(user.balance)) : 0,
    [user?.balance]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pt-safe pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ delay: 0.2 }}
          className="absolute top-60 -left-20 w-48 h-48 bg-accent/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation('/home')}
            className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-2xl font-extrabold text-foreground">Wallet</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="gradient-hero p-8 rounded-[2rem] text-white mb-8 shadow-2xl shadow-primary/30 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          
          <div className="flex items-center justify-between mb-8 relative">
            <div>
              <p className="text-sm opacity-80 font-medium mb-2">Available Balance</p>
              <p className="text-5xl font-extrabold tracking-tight">
                $<CountUp end={balance} decimals={2} />
              </p>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
              <Wallet className="w-10 h-10" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 relative">
            <Link href="/wallet/add-card">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-14 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-white/20"
                data-testid="button-add-funds"
              >
                <Plus className="w-5 h-5" />
                Add Funds
              </motion.button>
            </Link>
            <Link href="/wallet/withdraw">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-14 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-white/20"
                data-testid="button-withdraw"
              >
                <ArrowUpRight className="w-5 h-5" />
                Withdraw
              </motion.button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-6"
        >
          <h2 className="text-xl font-bold text-foreground">Recent Transactions</h2>
        </motion.div>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass rounded-2xl p-4 flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-2xl" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </motion.div>
            ) : transactions && transactions.length > 0 ? (
              <motion.div
                key="transactions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {transactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TransactionCard transaction={transaction} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState
                  icon={<Receipt className="w-8 h-8" />}
                  title="No transactions yet"
                  description="Your transaction history will appear here"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

export default WalletScreen;
