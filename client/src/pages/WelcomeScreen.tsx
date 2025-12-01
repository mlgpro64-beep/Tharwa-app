import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Sparkles } from 'lucide-react';

const WelcomeScreen = memo(function WelcomeScreen() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const tags = [
    { key: 'welcome.trusted' },
    { key: 'welcome.secure' },
    { key: 'welcome.local' }
  ];

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
          <div className="w-32 h-32 rounded-[2rem] gradient-primary flex items-center justify-center shadow-2xl shadow-primary/30">
            <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={2} />
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
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 gradient-text">
            {t('welcome.title')}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t('welcome.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-3 mt-8"
        >
          {tags.map((tag, i) => (
            <motion.div
              key={tag.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="px-4 py-2 rounded-full glass text-sm font-medium text-foreground/80 flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              {t(tag.key)}
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="px-8 pb-12 pb-safe space-y-4"
      >
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setLocation('/role')}
          className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-2"
          data-testid="button-get-started"
        >
          {t('auth.getStarted')}
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="rtl:rotate-180"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </motion.span>
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setLocation('/login')}
          className="w-full h-14 glass rounded-2xl font-bold text-lg text-foreground transition-all"
          data-testid="button-login"
        >
          {t('auth.alreadyHaveAccount')}
        </motion.button>

        <p className="text-xs text-muted-foreground text-center pt-4 leading-relaxed">
          {t('settings.terms')} {t('common.and')} {t('settings.privacy_policy')}
        </p>
      </motion.div>
    </div>
  );
});

export default WelcomeScreen;
