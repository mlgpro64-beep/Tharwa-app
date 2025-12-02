import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPolicyScreen = memo(function PrivacyPolicyScreen() {
  const { t } = useTranslation();

  const sections = [
    {
      title: t('privacy.dataCollection.title'),
      content: t('privacy.dataCollection.content')
    },
    {
      title: t('privacy.dataUsage.title'),
      content: t('privacy.dataUsage.content')
    },
    {
      title: t('privacy.dataSharing.title'),
      content: t('privacy.dataSharing.content')
    },
    {
      title: t('privacy.dataSecurity.title'),
      content: t('privacy.dataSecurity.content')
    },
    {
      title: t('privacy.userRights.title'),
      content: t('privacy.userRights.content')
    },
    {
      title: t('privacy.cookies.title'),
      content: t('privacy.cookies.content')
    },
    {
      title: t('privacy.changes.title'),
      content: t('privacy.changes.content')
    },
    {
      title: t('privacy.contact.title'),
      content: t('privacy.contact.content')
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pt-safe pb-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className="absolute top-40 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl rtl:-left-20 rtl:right-auto"
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
          <h1 className="text-2xl font-extrabold text-foreground">{t('privacy.title')}</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-5 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">{t('privacy.lastUpdated')}</p>
              <p className="text-sm text-muted-foreground">2024-12-01</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('privacy.intro')}
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

export default PrivacyPolicyScreen;
