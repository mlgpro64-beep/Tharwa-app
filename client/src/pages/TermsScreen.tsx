import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText } from 'lucide-react';

const TermsScreen = memo(function TermsScreen() {
  const { t } = useTranslation();

  const sections = [
    {
      title: t('terms.acceptance.title'),
      content: t('terms.acceptance.content')
    },
    {
      title: t('terms.eligibility.title'),
      content: t('terms.eligibility.content')
    },
    {
      title: t('terms.accounts.title'),
      content: t('terms.accounts.content')
    },
    {
      title: t('terms.services.title'),
      content: t('terms.services.content')
    },
    {
      title: t('terms.payments.title'),
      content: t('terms.payments.content')
    },
    {
      title: t('terms.conduct.title'),
      content: t('terms.conduct.content')
    },
    {
      title: t('terms.liability.title'),
      content: t('terms.liability.content')
    },
    {
      title: t('terms.termination.title'),
      content: t('terms.termination.content')
    },
    {
      title: t('terms.disputes.title'),
      content: t('terms.disputes.content')
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pt-safe pb-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className="absolute top-40 -left-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl rtl:-right-20 rtl:left-auto"
        />
      </div>

      <div className="relative z-10 px-6 py-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </motion.button>
          <h1 className="text-2xl font-extrabold text-foreground">{t('terms.title')}</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-5 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="font-bold text-foreground">{t('terms.lastUpdated')}</p>
              <p className="text-sm text-muted-foreground">2024-12-01</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('terms.intro')}
          </p>
        </motion.div>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <h2 className="font-bold text-foreground mb-3">{section.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default TermsScreen;
