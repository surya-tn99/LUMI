import React from 'react';
import { useUser } from '@/context/UserContext';
import { User, Heart } from 'lucide-react';

interface RoleSelectProps {
  onNext: () => void;
}

export default function RoleSelect({ onNext }: RoleSelectProps) {
  const { profile, updateProfile } = useUser();

  const handleSelect = (role: 'patient' | 'caretaker') => {
    updateProfile({ role });
    setTimeout(() => {
      onNext();
    }, 100);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary">Welcome to LUMI</h2>
        <p className="text-muted-foreground">Select your role to get started</p>
      </div>

      <div className="flex-1 flex flex-col gap-4 max-w-md mx-auto w-full justify-center">
        <button
          onClick={() => handleSelect('patient')}
          className="selection-card py-8 hover:bg-muted/50 transition-all hover:scale-[1.02]"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground">I'm a Patient</h3>
            <p className="text-muted-foreground text-sm mt-1">
              I need health monitoring and care assistance
            </p>
          </div>
        </button>

        <button
          onClick={() => handleSelect('caretaker')}
          className="selection-card py-8 hover:bg-muted/50 transition-all hover:scale-[1.02]"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground">I'm a Caretaker</h3>
            <p className="text-muted-foreground text-sm mt-1">
              I want to monitor and care for someone
            </p>
          </div>
        </button>
      </div>
    </div>
  );

}
