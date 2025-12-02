import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, ChevronDown, MessageCircle, Phone, Mail, 
  HelpCircle, Wallet, Shield, Users, ClipboardList, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
  icon: typeof HelpCircle;
}

const HelpScreen = memo(function HelpScreen() {
  const { t } = useTranslation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      question: t('help.faq.howToPost.question'),
      answer: t('help.faq.howToPost.answer'),
      icon: ClipboardList
    },
    {
      question: t('help.faq.howToEarn.question'),
      answer: t('help.faq.howToEarn.answer'),
      icon: Wallet
    },
    {
      question: t('help.faq.platformFee.question'),
      answer: t('help.faq.platformFee.answer'),
      icon: Wallet
    },
    {
      question: t('help.faq.howToSwitch.question'),
      answer: t('help.faq.howToSwitch.answer'),
      icon: Users
    },
    {
      question: t('help.faq.verification.question'),
      answer: t('help.faq.verification.answer'),
      icon: Shield
    },
    {
      question: t('help.faq.rating.question'),
      answer: t('help.faq.rating.answer'),
      icon: Star
    },
  ];

  const contactMethods = [
    {
      icon: MessageCircle,
      title: t('help.contact.whatsapp'),
      subtitle: '+966 50 000 0000',
      color: 'bg-success/15 text-success',
      action: () => window.open('https://wa.me/966500000000', '_blank')
    },
    {
      icon: Mail,
      title: t('help.contact.email'),
      subtitle: 'support@tharwa.app',
      color: 'bg-primary/15 text-primary',
      action: () => window.location.href = 'mailto:support@tharwa.app'
    },
    {
      icon: Phone,
      title: t('help.contact.phone'),
      subtitle: '+966 11 000 0000',
      color: 'bg-accent/15 text-accent',
      action: () => window.location.href = 'tel:+966110000000'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pt-safe pb-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className="absolute top-40 -right-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl rtl:-left-20 rtl:right-auto"
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
            onClick={() => window.history.back()}
            className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </motion.button>
          <h1 className="text-2xl font-extrabold text-foreground">{t('help.title')}</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
            {t('help.contactUs')}
          </h2>
          <div className="space-y-3">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <motion.button
                  key={method.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={method.action}
                  className="w-full glass rounded-2xl p-4 flex items-center gap-4 text-start"
                  data-testid={`button-contact-${index}`}
                >
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", method.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{method.title}</p>
                    <p className="text-sm text-muted-foreground">{method.subtitle}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
            {t('help.faqTitle')}
          </h2>
          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const Icon = item.icon;
              const isExpanded = expandedIndex === index;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="glass rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="w-full p-4 flex items-center justify-between text-start"
                    data-testid={`button-faq-${index}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground text-sm">{item.question}</span>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 ms-2" />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0">
                          <div className="p-4 bg-muted/50 rounded-xl">
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
});

export default HelpScreen;
