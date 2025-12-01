import { useTranslation } from 'react-i18next';
import Logo from './Logo';

export function SplashScreen() {
  const { t } = useTranslation();
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-colors duration-500">
      <div className="relative flex flex-col items-center">
        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-8 animate-pulse-slow relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20"></div>
          <Logo size={64} className="relative z-10" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight animate-fade-in">
          {t('welcome.title')}
        </h1>
        <p 
          className="mt-4 text-muted-foreground font-medium animate-slide-up opacity-0" 
          style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
        >
          {t('welcome.subtitle')}
        </p>
      </div>

      <div 
        className="absolute bottom-12 flex flex-col items-center gap-3 opacity-0 animate-fade-in" 
        style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}
      >
        <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
