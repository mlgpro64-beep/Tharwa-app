import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MapPin, Bell, Clock } from 'lucide-react';
import Logo from './Logo';

interface ComingSoonProps {
  onNotifyMe?: () => void;
}

const ComingSoon = memo(function ComingSoon({ onNotifyMe }: ComingSoonProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-primary/5 pt-safe">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1.5 }}
          className="absolute top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl rtl:-left-20 rtl:right-auto"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute bottom-40 -left-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl rtl:-right-20 rtl:left-auto"
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: 0.1 
          }}
          className="relative mb-10"
        >
          <div className="w-28 h-28 rounded-[2rem] glass flex items-center justify-center shadow-2xl shadow-primary/30 border border-white/20">
            <Logo size={64} />
          </div>
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-[2rem] bg-primary/20 blur-xl -z-10"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center max-w-sm"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="w-6 h-6 text-accent" />
            <span className="text-accent font-semibold text-lg">{t('location.comingSoon')}</span>
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 gradient-text">
            {t('welcome.title')}
          </h1>
          
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            {t('location.comingSoonDesc')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="glass rounded-2xl p-6 max-w-sm w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('location.currentlyAvailable')}</p>
              <p className="font-bold text-foreground">{t('location.riyadh')}</p>
            </div>
          </div>
          
          <div className="h-px bg-border my-4" />
          
          <p className="text-sm text-muted-foreground text-center">
            {t('location.expandingSoon')}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="px-8 pb-12 pb-safe"
      >
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNotifyMe}
          className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-2"
          data-testid="button-notify-me"
        >
          <Bell className="w-5 h-5" />
          {t('location.notifyMe')}
        </motion.button>
      </motion.div>
    </div>
  );
});

export default ComingSoon;
