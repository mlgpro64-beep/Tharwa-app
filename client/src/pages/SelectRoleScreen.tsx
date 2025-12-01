import { useState, memo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { ArrowLeft, Users, Wrench, Check, ChevronRight, ChevronLeft } from 'lucide-react';

type Role = 'client' | 'tasker';

interface RoleOption {
  id: Role;
  titleKey: string;
  subtitleKey: string;
  icon: typeof Users;
  featuresKeys: string[];
  gradient: string;
}

const roles: RoleOption[] = [
  {
    id: 'client',
    titleKey: 'roles.client',
    subtitleKey: 'roles.clientDesc',
    icon: Users,
    featuresKeys: ['tasks.postTask', 'tasks.bids', 'wallet.deposit'],
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'tasker',
    titleKey: 'roles.tasker',
    subtitleKey: 'roles.taskerDesc',
    icon: Wrench,
    featuresKeys: ['tasks.feed', 'tasks.placeBid', 'wallet.withdraw'],
    gradient: 'from-purple-500 to-pink-500',
  },
];

const RoleCard = memo(function RoleCard({ 
  role, 
  isSelected, 
  onSelect,
  t
}: { 
  role: RoleOption; 
  isSelected: boolean; 
  onSelect: () => void;
  t: (key: string) => string;
}) {
  const Icon = role.icon;
  
  return (
    <motion.button
      layout
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full text-right p-6 rounded-3xl transition-all duration-300 relative overflow-hidden",
        isSelected
          ? "glass-premium shadow-xl"
          : "glass hover:shadow-lg"
      )}
      data-testid={`button-role-${role.id}`}
    >
      {isSelected && (
        <motion.div
          layoutId="selectedBorder"
          className="absolute inset-0 rounded-3xl gradient-border"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <motion.div 
          animate={{ 
            scale: isSelected ? 1.05 : 1,
            rotate: isSelected ? 5 : 0
          }}
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg",
            isSelected 
              ? `bg-gradient-to-br ${role.gradient} text-white shadow-lg` 
              : "bg-muted/50 text-muted-foreground"
          )}
        >
          <Icon className="w-7 h-7" />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-foreground mb-1">{t(role.titleKey)}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t(role.subtitleKey)}</p>
          
          <AnimatePresence>
            {isSelected && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {role.featuresKeys.map((featureKey, idx) => (
                  <motion.div 
                    key={featureKey}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2 text-sm text-foreground/80"
                  >
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    {t(featureKey)}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <motion.div 
          animate={{ 
            scale: isSelected ? 1 : 0.8,
            opacity: isSelected ? 1 : 0.5
          }}
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center transition-all",
            isSelected
              ? "bg-primary text-white shadow-lg shadow-primary/30"
              : "border-2 border-muted"
          )}
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              <Check className="w-4 h-4" />
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.button>
  );
});

const SelectRoleScreen = memo(function SelectRoleScreen() {
  const [, setLocation] = useLocation();
  const { switchRole } = useApp();
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleContinue = useCallback(() => {
    if (selectedRole) {
      switchRole(selectedRole);
      setLocation('/register');
    }
  }, [selectedRole, switchRole, setLocation]);

  const handleBack = useCallback(() => {
    setLocation('/');
  }, [setLocation]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-primary/5 pt-safe">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-4"
      >
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </motion.button>
        
        <div className="flex gap-2">
          {[0, 1, 2].map((step) => (
            <motion.div 
              key={step}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: step * 0.1 }}
              className={cn(
                "w-10 h-1.5 rounded-full transition-colors",
                step === 0 ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        
        <div className="w-11" />
      </motion.div>

      <div className="flex-1 flex flex-col px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
            {t('roles.title')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('common.next')}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mt-8 flex-1"
        >
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <RoleCard
                role={role}
                isSelected={selectedRole === role.id}
                onSelect={() => setSelectedRole(role.id)}
                t={t}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 pb-safe"
        >
          <motion.button
            whileHover={{ scale: selectedRole ? 1.02 : 1 }}
            whileTap={{ scale: selectedRole ? 0.98 : 1 }}
            onClick={handleContinue}
            disabled={!selectedRole}
            className={cn(
              "w-full h-14 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2",
              selectedRole
                ? "gradient-primary text-white shadow-xl shadow-primary/25"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            data-testid="button-continue"
          >
            {t('common.next')}
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
});

export default SelectRoleScreen;
