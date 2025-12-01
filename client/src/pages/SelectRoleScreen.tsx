import { useState, memo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { ArrowLeft, Users, Wrench, Check, ChevronRight } from 'lucide-react';

type Role = 'client' | 'tasker';

interface RoleOption {
  id: Role;
  title: string;
  subtitle: string;
  icon: typeof Users;
  features: string[];
  gradient: string;
}

const roles: RoleOption[] = [
  {
    id: 'client',
    title: 'I need help',
    subtitle: 'Post tasks and find local help',
    icon: Users,
    features: ['Post tasks in minutes', 'Get competitive offers', 'Pay securely'],
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'tasker',
    title: 'I want to help',
    subtitle: 'Earn money completing tasks',
    icon: Wrench,
    features: ['Browse local tasks', 'Set your own rates', 'Get paid quickly'],
    gradient: 'from-purple-500 to-pink-500',
  },
];

const RoleCard = memo(function RoleCard({ 
  role, 
  isSelected, 
  onSelect 
}: { 
  role: RoleOption; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  const Icon = role.icon;
  
  return (
    <motion.button
      layout
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full text-left p-6 rounded-3xl transition-all duration-300 relative overflow-hidden",
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
          <h3 className="text-xl font-bold text-foreground mb-1">{role.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{role.subtitle}</p>
          
          <AnimatePresence>
            {isSelected && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {role.features.map((feature, idx) => (
                  <motion.div 
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2 text-sm text-foreground/80"
                  >
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    {feature}
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
          <ArrowLeft className="w-5 h-5" />
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
            How will you use <span className="gradient-text">TaskField</span>?
          </h1>
          <p className="text-muted-foreground text-lg">
            You can always switch roles later
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
            Continue
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
});

export default SelectRoleScreen;
