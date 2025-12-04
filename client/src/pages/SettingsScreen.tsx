import { memo, useCallback, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, User, Lock, Bell, Moon, Sun, ArrowLeftRight, 
  HelpCircle, FileText, Shield, LogOut, ChevronRight, Languages,
  BadgeCheck, Check
} from 'lucide-react';

interface SettingItem {
  icon: typeof User;
  label: string;
  path?: string;
  action?: () => void;
  toggle?: boolean;
  value?: boolean;
  rightText?: string;
  destructive?: boolean;
  iconColor?: string;
}

interface SettingGroup {
  title: string;
  items: SettingItem[];
}

const SettingsScreen = memo(function SettingsScreen() {
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, userRole, switchRole, logout, user } = useApp();
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  
  const isArabic = i18n.language === 'ar';
  const currentLanguage = isArabic ? t('settings.arabic') : t('settings.english');

  const handleLogout = useCallback(() => {
    logout();
    setLocation('/');
  }, [logout, setLocation]);
  
  const handleLanguageChange = useCallback((lang: string) => {
    i18n.changeLanguage(lang);
    setShowLanguageSheet(false);
  }, [i18n]);

  const handleSwitchRole = useCallback(() => {
    switchRole(userRole === 'client' ? 'tasker' : 'client');
  }, [switchRole, userRole]);

  const accountItems: SettingItem[] = useMemo(() => [
    { icon: User, label: t('profile.editProfile'), path: '/profile/edit' },
    { icon: Lock, label: t('settings.changePassword'), action: () => {} },
    { icon: Bell, label: t('settings.notifications'), action: () => {} },
    ...(userRole === 'tasker' ? [{ icon: BadgeCheck, label: t('settings.verifyIdentity'), path: '/verify', iconColor: 'text-accent' }] : []),
  ], [t, userRole]);

  const preferencesItems: SettingItem[] = useMemo(() => [
    { 
      icon: Languages, 
      label: t('settings.language'), 
      rightText: currentLanguage,
      action: () => setShowLanguageSheet(true)
    },
  ], [t, currentLanguage]);

  const supportItems: SettingItem[] = useMemo(() => [
    { icon: HelpCircle, label: t('settings.help'), path: '/help' },
    { icon: FileText, label: t('settings.terms'), path: '/terms' },
    { icon: Shield, label: t('settings.privacy_policy'), path: '/privacy' },
  ], [t]);

  const adminItems: SettingItem[] = useMemo(() => 
    user?.isAdmin ? [
      { icon: Shield, label: isArabic ? 'لوحة الأدمن' : 'Admin Panel', path: '/admin', iconColor: 'text-amber-500' },
    ] : []
  , [user?.isAdmin, isArabic]);

  const renderSettingItem = (item: SettingItem, idx: number, total: number) => {
    const Icon = item.icon;
    const itemClasses = cn(
      "flex items-center justify-between p-4 transition-all hover:bg-white/5 w-full",
      idx < total - 1 && "border-b border-white/10"
    );
    
    const itemContent = (
      <>
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-11 h-11 rounded-2xl flex items-center justify-center",
            item.destructive ? "bg-destructive/15" : "bg-primary/15"
          )}>
            <Icon className={cn(
              "w-5 h-5",
              item.iconColor || (item.destructive ? "text-destructive" : "text-primary")
            )} />
          </div>
          <span className={cn(
            "font-medium text-start",
            item.destructive ? "text-destructive" : "text-foreground"
          )}>
            {item.label}
          </span>
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
        ) : item.rightText ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">{item.rightText}</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground rtl:rotate-180" />
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pt-safe pb-40">
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
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
              {t('settings.account')}
            </h2>
            <div className="glass rounded-3xl overflow-hidden">
              {accountItems.map((item, idx) => renderSettingItem(item, idx, accountItems.length))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
              {t('settings.preferences')}
            </h2>
            <div className="glass rounded-3xl overflow-hidden">
              {preferencesItems.map((item, idx) => renderSettingItem(item, idx, preferencesItems.length))}
              <motion.button 
                onClick={toggleTheme}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-between p-4 transition-all hover:bg-white/5 w-full"
                data-testid="button-theme-toggle"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-primary/15">
                    {theme === 'dark' ? (
                      <Moon className="w-5 h-5 text-primary" />
                    ) : (
                      <Sun className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <span className="font-medium text-foreground text-start">
                    {t('settings.darkMode')}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-1 rounded-full bg-muted/50">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); if (theme === 'dark') toggleTheme(); }}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                      theme === 'light' 
                        ? "gradient-primary text-white shadow-lg" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Sun className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); if (theme === 'light') toggleTheme(); }}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                      theme === 'dark' 
                        ? "gradient-primary text-white shadow-lg" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Moon className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.button>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSwitchRole}
            className="w-full p-4 bg-primary/10 border-2 border-primary/30 rounded-2xl flex items-center justify-between transition-all hover:bg-primary/15"
            data-testid="button-switch-mode"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-primary/20 rounded-2xl flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
              </div>
              <div className="text-start">
                <span className="font-bold text-foreground block">
                  {userRole === 'client' ? t('settings.switchToTasker') : t('settings.switchToClient')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('settings.switchModeDesc')}
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-primary rtl:rotate-180" />
          </motion.button>

          {adminItems.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
            >
              <h2 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3 px-1">
                {isArabic ? 'الإدارة' : 'Administration'}
              </h2>
              <div className="glass rounded-3xl overflow-hidden border border-amber-500/30">
                {adminItems.map((item, idx) => renderSettingItem(item, idx, adminItems.length))}
              </div>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
              {t('settings.support')}
            </h2>
            <div className="glass rounded-3xl overflow-hidden">
              {supportItems.map((item, idx) => renderSettingItem(item, idx, supportItems.length))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <motion.button 
              onClick={handleLogout}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 glass rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-white/5"
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5 text-foreground" />
              <span className="font-bold text-foreground">{t('auth.logout')}</span>
            </motion.button>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-muted-foreground pt-6 pb-8"
          >
            {t('welcome.title')} v1.0.0
          </motion.p>
        </div>
      </div>

      <AnimatePresence>
        {showLanguageSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLanguageSheet(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 z-50 bg-card rounded-t-3xl p-6 pb-safe"
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold mb-4">{t('settings.language')}</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleLanguageChange('ar')}
                  className={cn(
                    "w-full p-4 rounded-2xl flex items-center justify-between transition-all",
                    isArabic ? "bg-primary/15 border-2 border-primary" : "bg-muted/50 border-2 border-transparent"
                  )}
                  data-testid="button-language-arabic"
                >
                  <span className={cn("font-medium", isArabic && "text-primary")}>{t('settings.arabic')}</span>
                  {isArabic && <Check className="w-5 h-5 text-primary" />}
                </button>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={cn(
                    "w-full p-4 rounded-2xl flex items-center justify-between transition-all",
                    !isArabic ? "bg-primary/15 border-2 border-primary" : "bg-muted/50 border-2 border-transparent"
                  )}
                  data-testid="button-language-english"
                >
                  <span className={cn("font-medium", !isArabic && "text-primary")}>{t('settings.english')}</span>
                  {!isArabic && <Check className="w-5 h-5 text-primary" />}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
});

export default SettingsScreen;
