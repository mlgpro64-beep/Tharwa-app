import { memo, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TransactionCard } from '@/components/TransactionCard';
import { CountUp } from '@/components/CountUp';
import { useQuery } from '@tanstack/react-query';
import { Skeleton, EmptyState } from '@/components/ui/animated';
import { Wallet, Plus, ArrowUpRight, Receipt, ArrowLeft, CreditCard, TrendingUp } from 'lucide-react';
import type { Transaction, User } from '@shared/schema';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const WalletScreen = memo(function WalletScreen() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const isAuthenticated = !!localStorage.getItem('userId');
  
  const { data: user } = useQuery<User>({
    queryKey: ['/api/users/me'],
    enabled: isAuthenticated,
  });

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: isAuthenticated,
  });

  const balance = useMemo(() => 
    user?.balance ? parseFloat(String(user.balance)) : 0,
    [user?.balance]
  );

  return (
    <div className="min-h-screen gradient-mesh pt-safe pb-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-primary/25 to-primary/5 rounded-full blur-3xl rtl:-left-24 rtl:right-auto"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ delay: 0.3 }}
          className="absolute top-60 -left-20 w-48 h-48 bg-gradient-to-tr from-accent/25 to-transparent rounded-full blur-3xl rtl:-right-20 rtl:left-auto"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 px-5 py-5"
      >
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-4 mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setLocation('/home')}
            className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
            data-testid="button-back-wallet"
          >
            <ArrowLeft className="w-5 h-5 text-foreground/80 rtl:rotate-180" />
          </motion.button>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{t('wallet.title')}</h1>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-[28px] mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary/90" />
          
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl rtl:left-0 rtl:right-auto rtl:-translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl rtl:right-0 rtl:left-auto rtl:translate-x-1/4" />
          </div>
          
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz48L2c+PC9zdmc+')] opacity-60" />
          
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-white/70 font-medium mb-1.5">{t('wallet.availableBalance')}</p>
                <p className="text-[44px] font-extrabold text-white tracking-tight leading-none">
                  $<CountUp end={balance} decimals={2} />
                </p>
              </div>
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.05 }}
                className="w-16 h-16 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20"
              >
                <Wallet className="w-8 h-8 text-white" />
              </motion.div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Link href="/wallet/add-card">
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 bg-white/20 backdrop-blur-sm hover:bg-white/25 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-white/20 text-white text-sm"
                  data-testid="button-add-funds"
                >
                  <Plus className="w-4 h-4" />
                  {t('wallet.addFunds')}
                </motion.button>
              </Link>
              <Link href="/wallet/withdraw">
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 bg-white/20 backdrop-blur-sm hover:bg-white/25 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-white/20 text-white text-sm"
                  data-testid="button-withdraw"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  {t('wallet.withdrawFunds')}
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass rounded-[20px] p-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center mb-2.5">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">{t('wallet.recentActivity')}</p>
            <p className="font-bold text-foreground">+$0.00</p>
          </div>
          <div className="glass rounded-[20px] p-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-2.5">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">{t('tasks.statuses.inProgress')}</p>
            <p className="font-bold text-foreground">$0.00</p>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between mb-4"
        >
          <h2 className="text-lg font-bold text-foreground">{t('wallet.transactionHistory')}</h2>
        </motion.div>

        <div className="space-y-2.5">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2.5"
              >
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass rounded-[18px] p-4 flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1.5 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                    <Skeleton className="h-5 w-14 rounded" />
                  </div>
                ))}
              </motion.div>
            ) : transactions && transactions.length > 0 ? (
              <motion.div
                key="transactions"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2.5"
              >
                {transactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    variants={itemVariants}
                  >
                    <TransactionCard transaction={transaction} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState
                  icon={<Receipt className="w-8 h-8" />}
                  title={t('wallet.noTransactions')}
                  description={t('wallet.transactionHistory')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
});

export default WalletScreen;
