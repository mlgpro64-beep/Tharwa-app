import { memo, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, User, Lock, Bell, Moon, Sun, ArrowLeftRight, 
  HelpCircle, FileText, Shield, LogOut, ChevronRight, Languages 
} from 'lucide-react';

interface SettingItem {
  icon: typeof User;
  label: string;
  path?: string;
  action?: () => void;
  toggle?: boolean;
  value?: boolean;
}

interface SettingGroup {
  title: string;
  items: SettingItem[];
}

const SettingsScreen = memo(function SettingsScreen() {
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, userRole, switchRole, logout } = useApp();
  
  const isArabic = i18n.language === 'ar';

  const handleLogout = useCallback(() => {
    logout();
    setLocation('/');
  }, [logout, setLocation]);
  
  const toggleLanguage = useCallback(() => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  }, [i18n]);

  const settingsGroups: SettingGroup[] = useMemo(() => [
    {
      title: t('settings.account'),
      items: [
        { icon: User, label: t('profile.editProfile'), path: '/profile/edit' },
        { icon: Lock, label: t('settings.changePassword', 'Change Password'), action: () => {} },
        { icon: Bell, label: t('settings.notifications'), action: () => {} },
      ]
    },
    {
      title: t('settings.preferences', 'Preferences'),
      items: [
        { 
          icon: Languages, 
          label: t('settings.language'), 
          toggle: true, 
          value: isArabic,
          action: toggleLanguage 
        },
        { 
          icon: theme === 'dark' ? Moon : Sun, 
          label: t('settings.darkMode'), 
          toggle: true, 
          value: theme === 'dark',
          action: toggleTheme 
        },
        { 
          icon: ArrowLeftRight, 
          label: userRole === 'client' 
            ? t('settings.switchToTasker', 'Switch to Tasker Mode')
            : t('settings.switchToClient', 'Switch to Client Mode'), 
          action: () => switchRole(userRole === 'client' ? 'tasker' : 'client')
        },
      ]
    },
    {
      title: t('settings.support'),
      items: [
        { icon: HelpCircle, label: t('settings.help'), path: '/help' },
        { icon: FileText, label: t('settings.terms'), path: '/terms' },
        { icon: Shield, label: t('settings.privacy_policy'), path: '/privacy' },
      ]
    },
  ], [t, theme, toggleTheme, userRole, switchRole, isArabic, toggleLanguage]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pt-safe pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className="absolute top-40 -right-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl"
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
          <h1 className="text-2xl font-extrabold text-foreground">{t('settings.title')}</h1>
        </motion.div>

        <div className="space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <motion.div 
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
                {group.title}
              </h2>
              <div className="glass rounded-3xl overflow-hidden">
                {group.items.map((item, idx) => {
                  const Icon = item.icon;
                  const itemClasses = cn(
                    "flex items-center justify-between p-4 transition-all hover:bg-white/5 w-full",
                    idx < group.items.length - 1 && "border-b border-white/10"
                  );
                  
                  const itemContent = (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-primary/15 rounded-2xl flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground text-start">{item.label}</span>
                      </div>
                      {item.toggle ? (
                        <div
                          className={cn(
                            "w-14 h-8 rounded-full transition-all relative flex-shrink-0",
                            item.value ? "gradient-primary shadow-lg shadow-primary/30" : "bg-muted"
                          )}
                        >
                          <motion.div 
                            animate={{ x: item.value ? 24 : 4 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-sm"
                          />
                        </div>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground rtl:rotate-180" />
                      )}
                    </>
                  );

                  if (item.path) {
                    return (
                      <Link key={item.label} href={item.path}>
                        <motion.div 
                          whileTap={{ scale: 0.98 }}
                          className={itemClasses}
                          data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {itemContent}
                        </motion.div>
                      </Link>
                    );
                  }
                  
                  return (
                    <motion.button 
                      key={item.label} 
                      onClick={item.action} 
                      whileTap={{ scale: 0.98 }}
                      className={itemClasses}
                      data-testid={`button-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {itemContent}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full h-14 bg-destructive/15 text-destructive rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-destructive/25 transition-all mt-8 border border-destructive/20"
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5" />
            {t('settings.logout')}
          </motion.button>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-muted-foreground py-4"
          >
            {t('welcome.title')} v1.0.0
          </motion.p>
        </div>
      </div>
    </div>
  );
});

export default SettingsScreen;
