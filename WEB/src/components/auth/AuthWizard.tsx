import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import RoleSelect from './RoleSelect';
import PhoneVerify from './PhoneVerify';
import ProfileForm from './ProfileForm';
import HealthNomineeForm from './HealthNomineeForm';
import { motion, AnimatePresence } from 'framer-motion';

const steps = ['role', 'phone', 'profile', 'health'] as const;
type Step = typeof steps[number];

export default function AuthWizard() {
  const [currentStep, setCurrentStep] = useState<Step>('role');
  const { setAuthenticated } = useUser();

  const stepIndex = steps.indexOf(currentStep);
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const nextStep = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    } else {
      setAuthenticated(true);
    }
  };

  const prevStep = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      <div className="flex-1 px-6 py-8 overflow-y-auto hide-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {currentStep === 'role' && <RoleSelect onNext={nextStep} />}
            {currentStep === 'phone' && <PhoneVerify onNext={nextStep} onBack={prevStep} />}
            {currentStep === 'profile' && <ProfileForm onNext={nextStep} onBack={prevStep} />}
            {currentStep === 'health' && <HealthNomineeForm onNext={nextStep} onBack={prevStep} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
