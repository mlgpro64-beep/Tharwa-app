import { memo, useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { 
  ArrowLeft, Upload, Camera, CheckCircle, AlertCircle, 
  FileText, User, Clock, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

type VerificationStep = 'intro' | 'id-front' | 'id-back' | 'selfie' | 'pending' | 'verified';

const VerifyIdentityScreen = memo(function VerifyIdentityScreen() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { userRole } = useApp();
  const [step, setStep] = useState<VerificationStep>('intro');
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);

  if (userRole !== 'tasker') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pt-safe pb-32 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-8 text-center max-w-sm"
        >
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t('verification.taskerOnly')}</h2>
          <p className="text-muted-foreground text-sm mb-6">{t('verification.taskerOnlyDesc')}</p>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => window.history.back()}
            className="w-full py-3 rounded-2xl gradient-primary text-white font-bold"
            data-testid="button-go-back"
          >
            {t('common.back')}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const handleFileUpload = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setter(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    setStep('pending');
  };

  const steps = [
    { id: 'id-front', label: t('verification.steps.idFront'), done: !!idFront },
    { id: 'id-back', label: t('verification.steps.idBack'), done: !!idBack },
    { id: 'selfie', label: t('verification.steps.selfie'), done: !!selfie },
  ];

  const renderContent = () => {
    switch (step) {
      case 'intro':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass rounded-3xl p-6 text-center">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/30">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{t('verification.title')}</h2>
              <p className="text-muted-foreground text-sm">{t('verification.description')}</p>
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="font-bold text-foreground mb-4">{t('verification.requirements')}</h3>
              <div className="space-y-3">
                {[
                  { icon: FileText, text: t('verification.req.validId') },
                  { icon: Camera, text: t('verification.req.clearPhoto') },
                  { icon: User, text: t('verification.req.selfie') },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep('id-front')}
              className="w-full py-4 rounded-2xl gradient-primary text-white font-bold shadow-lg shadow-primary/30"
              data-testid="button-start-verification"
            >
              {t('verification.startVerification')}
            </motion.button>
          </motion.div>
        );

      case 'id-front':
      case 'id-back':
      case 'selfie':
        const isIdFront = step === 'id-front';
        const isIdBack = step === 'id-back';
        const isSelfie = step === 'selfie';
        const currentImage = isIdFront ? idFront : isIdBack ? idBack : selfie;
        const setCurrentImage = isIdFront ? setIdFront : isIdBack ? setIdBack : setSelfie;
        const stepTitle = isIdFront 
          ? t('verification.steps.idFront') 
          : isIdBack 
            ? t('verification.steps.idBack') 
            : t('verification.steps.selfie');
        const stepDesc = isIdFront 
          ? t('verification.uploadIdFront') 
          : isIdBack 
            ? t('verification.uploadIdBack') 
            : t('verification.uploadSelfie');

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-center gap-2 mb-4">
              {steps.map((s, index) => (
                <div
                  key={s.id}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    s.done || step === s.id ? "w-10 gradient-primary" : "w-10 bg-muted"
                  )}
                />
              ))}
            </div>

            <div className="glass rounded-3xl p-6 text-center">
              <h2 className="text-lg font-bold text-foreground mb-2">{stepTitle}</h2>
              <p className="text-muted-foreground text-sm">{stepDesc}</p>
            </div>

            <div className="glass rounded-3xl p-4">
              {currentImage ? (
                <div className="relative">
                  <img 
                    src={currentImage} 
                    alt="Uploaded" 
                    className="w-full h-56 object-cover rounded-2xl"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentImage(null)}
                    className="absolute top-3 right-3 w-8 h-8 bg-destructive text-white rounded-full flex items-center justify-center"
                  >
                    <span className="text-sm">X</span>
                  </motion.button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    capture={isSelfie ? "user" : "environment"}
                    onChange={handleFileUpload(setCurrentImage)}
                    className="hidden"
                    data-testid={`input-upload-${step}`}
                  />
                  <div className="h-56 border-2 border-dashed border-muted-foreground/30 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors hover:border-primary/50">
                    <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
                      {isSelfie ? <Camera className="w-7 h-7 text-primary" /> : <Upload className="w-7 h-7 text-primary" />}
                    </div>
                    <p className="text-muted-foreground text-sm">{t('verification.tapToUpload')}</p>
                  </div>
                </label>
              )}
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (isIdFront) setStep('intro');
                  else if (isIdBack) setStep('id-front');
                  else setStep('id-back');
                }}
                className="flex-1 py-4 rounded-2xl glass font-bold text-foreground"
                data-testid="button-back-step"
              >
                {t('common.back')}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (isIdFront && idFront) setStep('id-back');
                  else if (isIdBack && idBack) setStep('selfie');
                  else if (isSelfie && selfie) handleSubmit();
                }}
                disabled={!currentImage}
                className={cn(
                  "flex-1 py-4 rounded-2xl font-bold transition-all",
                  currentImage 
                    ? "gradient-primary text-white shadow-lg shadow-primary/30" 
                    : "bg-muted text-muted-foreground"
                )}
                data-testid="button-next-step"
              >
                {isSelfie ? t('verification.submit') : t('common.next')}
              </motion.button>
            </div>
          </motion.div>
        );

      case 'pending':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="glass rounded-3xl p-8">
              <div className="w-20 h-20 rounded-full bg-warning/15 flex items-center justify-center mx-auto mb-5">
                <Clock className="w-10 h-10 text-warning" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{t('verification.pending.title')}</h2>
              <p className="text-muted-foreground text-sm">{t('verification.pending.description')}</p>
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                <p className="text-sm text-muted-foreground text-start">{t('verification.pending.note')}</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation('/profile')}
              className="w-full py-4 rounded-2xl gradient-primary text-white font-bold shadow-lg shadow-primary/30"
              data-testid="button-back-to-profile"
            >
              {t('verification.backToProfile')}
            </motion.button>
          </motion.div>
        );

      case 'verified':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="glass rounded-3xl p-8">
              <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{t('verification.verified.title')}</h2>
              <p className="text-muted-foreground text-sm">{t('verification.verified.description')}</p>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation('/profile')}
              className="w-full py-4 rounded-2xl gradient-primary text-white font-bold shadow-lg shadow-primary/30"
              data-testid="button-back-to-profile"
            >
              {t('verification.backToProfile')}
            </motion.button>
          </motion.div>
        );
    }
  };

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
          <h1 className="text-2xl font-extrabold text-foreground">{t('verification.pageTitle')}</h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default VerifyIdentityScreen;
