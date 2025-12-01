import { Link } from 'wouter';
import { Screen } from '@/components/layout/Screen';

export default function WelcomeScreen() {
  return (
    <Screen safeAreaBottom={false} className="justify-center items-center px-8">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping opacity-50"></div>
          <span className="material-symbols-outlined text-6xl text-primary">task_alt</span>
        </div>
        
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-3">
          TaskField
        </h1>
        <p className="text-muted-foreground text-lg mb-12 leading-relaxed">
          Your community marketplace for everyday tasks
        </p>

        <div className="w-full space-y-4">
          <Link href="/role">
            <button 
              className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all"
              data-testid="button-get-started"
            >
              Get Started
            </button>
          </Link>
          
          <Link href="/login">
            <button 
              className="w-full h-14 bg-muted text-foreground rounded-2xl font-bold text-lg hover:bg-muted/80 active:scale-[0.98] transition-all"
              data-testid="button-login"
            >
              I already have an account
            </button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-8 leading-relaxed">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-primary font-bold">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-primary font-bold">Privacy Policy</Link>
        </p>
      </div>
    </Screen>
  );
}
