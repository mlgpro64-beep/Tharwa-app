import { Link, useLocation } from 'wouter';
import { useApp } from '@/context/AppContext';
import { Screen } from '@/components/layout/Screen';
import { cn } from '@/lib/utils';

export default function SettingsScreen() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme, userRole, switchRole, logout } = useApp();

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: 'person', label: 'Edit Profile', path: '/profile/edit' },
        { icon: 'lock', label: 'Change Password', action: () => {} },
        { icon: 'notifications', label: 'Notifications', action: () => {} },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: theme === 'dark' ? 'dark_mode' : 'light_mode', 
          label: 'Dark Mode', 
          toggle: true, 
          value: theme === 'dark',
          action: toggleTheme 
        },
        { 
          icon: 'swap_horiz', 
          label: `Switch to ${userRole === 'client' ? 'Tasker' : 'Client'} Mode`, 
          action: () => switchRole(userRole === 'client' ? 'tasker' : 'client')
        },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: 'help', label: 'Help Center', path: '/help' },
        { icon: 'description', label: 'Terms of Service', path: '/terms' },
        { icon: 'privacy_tip', label: 'Privacy Policy', path: '/privacy' },
      ]
    },
  ];

  return (
    <Screen className="px-6">
      <div className="flex items-center gap-4 py-4 mb-4">
        <button 
          onClick={() => window.history.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors active:scale-90"
          data-testid="button-back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-extrabold text-foreground">Settings</h1>
      </div>

      <div className="space-y-6">
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              {group.title}
            </h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {group.items.map((item, idx) => {
                const content = (
                  <div 
                    className={cn(
                      "flex items-center justify-between p-4 transition-all hover:bg-muted active:bg-muted/80",
                      idx < group.items.length - 1 && "border-b border-border"
                    )}
                    data-testid={`button-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">{item.icon}</span>
                      </div>
                      <span className="font-medium text-foreground">{item.label}</span>
                    </div>
                    {item.toggle ? (
                      <button
                        onClick={item.action}
                        className={cn(
                          "w-12 h-7 rounded-full transition-all relative",
                          item.value ? "bg-primary" : "bg-muted"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                          item.value ? "right-1" : "left-1"
                        )} />
                      </button>
                    ) : (
                      <span className="material-symbols-outlined text-muted-foreground">chevron_right</span>
                    )}
                  </div>
                );

                if (item.path) {
                  return <Link key={item.label} href={item.path}>{content}</Link>;
                }
                
                return (
                  <button key={item.label} onClick={item.action} className="w-full text-left">
                    {content}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={handleLogout}
          className="w-full h-14 bg-destructive/10 text-destructive rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-destructive/20 active:scale-[0.98] transition-all mt-8"
          data-testid="button-logout"
        >
          <span className="material-symbols-outlined">logout</span>
          Sign Out
        </button>

        <p className="text-center text-xs text-muted-foreground py-4">
          TaskField v1.0.0
        </p>
      </div>
    </Screen>
  );
}
