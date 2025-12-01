import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useApp } from '@/context/AppContext';
import { Screen } from '@/components/layout/Screen';
import { cn } from '@/lib/utils';

type Role = 'client' | 'tasker';

export default function SelectRoleScreen() {
  const [, setLocation] = useLocation();
  const { switchRole } = useApp();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      switchRole(selectedRole);
      setLocation('/register');
    }
  };

  const roles = [
    {
      id: 'client' as Role,
      title: 'I need help',
      subtitle: 'Post tasks and find local help',
      icon: 'person_search',
      features: ['Post tasks in minutes', 'Get competitive offers', 'Pay securely'],
    },
    {
      id: 'tasker' as Role,
      title: 'I want to help',
      subtitle: 'Earn money completing tasks',
      icon: 'handyman',
      features: ['Browse local tasks', 'Set your own rates', 'Get paid quickly'],
    },
  ];

  return (
    <Screen className="px-6">
      <div className="flex items-center justify-between py-4">
        <button 
          onClick={() => setLocation('/')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors active:scale-90"
          data-testid="button-back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex gap-1.5">
          <div className="w-8 h-1.5 rounded-full bg-primary"></div>
          <div className="w-8 h-1.5 rounded-full bg-muted"></div>
          <div className="w-8 h-1.5 rounded-full bg-muted"></div>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col py-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
          How will you use TaskField?
        </h1>
        <p className="text-muted-foreground mb-8">
          You can always switch roles later
        </p>

        <div className="space-y-4 flex-1">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              data-testid={`button-role-${role.id}`}
              className={cn(
                "w-full text-left p-6 rounded-3xl border-2 transition-all duration-300 active:scale-[0.98]",
                selectedRole === role.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/50"
                  : "border-transparent bg-card hover:bg-card/80"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                  selectedRole === role.id ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <span className="material-symbols-outlined text-2xl">{role.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-1">{role.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{role.subtitle}</p>
                  <div className="space-y-1.5">
                    {role.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="material-symbols-outlined text-success text-sm">check_circle</span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  selectedRole === role.id
                    ? "border-primary bg-primary"
                    : "border-muted"
                )}>
                  {selectedRole === role.id && (
                    <span className="material-symbols-outlined text-primary-foreground text-sm">check</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none mt-6"
          data-testid="button-continue"
        >
          Continue
        </button>
      </div>
    </Screen>
  );
}
