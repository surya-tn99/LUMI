import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { ArrowLeft, Heart, Shield } from 'lucide-react';

interface HealthNomineeFormProps {
  onNext: () => void;
  onBack: () => void;
}

export default function HealthNomineeForm({ onNext, onBack }: HealthNomineeFormProps) {
  const { profile, updateProfile, register } = useUser();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!profile.nomineeName.trim()) newErrors.nomineeName = 'Nominee name is required';
    if (!profile.nomineePhone || profile.nomineePhone.length < 10) {
      newErrors.nomineePhone = 'Valid nominee phone is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = async () => {
    if (validate()) {
      setLoading(true);
      const success = await register(profile);
      if (success) {
        onNext();
      } else {
        // Handle error (maybe show toast or error message)
        console.error("Registration failed");
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground mb-6 hover:text-foreground transition-colors">
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Health & Emergency</h2>
        <p className="text-muted-foreground">Add health info and emergency contacts</p>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full space-y-4 overflow-y-auto hide-scrollbar">
        {/* Health Section */}
        <div className="care-card-sm">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Health Information</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Existing Health Issues (Optional)
            </label>
            <textarea
              value={profile.healthIssues}
              onChange={(e) => updateProfile({ healthIssues: e.target.value })}
              placeholder="Diabetes, Hypertension, Arthritis..."
              className="care-input min-h-[80px] resize-none"
            />
          </div>
        </div>

        {/* Emergency Nominee Section */}
        <div className="care-card-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-foreground">Emergency Contact</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nominee Name
              </label>
              <input
                type="text"
                value={profile.nomineeName}
                onChange={(e) => updateProfile({ nomineeName: e.target.value })}
                placeholder="Jane Doe"
                className="care-input"
              />
              {errors.nomineeName && (
                <p className="text-destructive text-sm mt-1">{errors.nomineeName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nominee Phone
              </label>
              <input
                type="tel"
                value={profile.nomineePhone}
                onChange={(e) => updateProfile({ nomineePhone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="care-input"
              />
              {errors.nomineePhone && (
                <p className="text-destructive text-sm mt-1">{errors.nomineePhone}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button onClick={handleComplete} disabled={loading} className="btn-primary w-full disabled:opacity-70">
          {loading ? 'Creating Account...' : 'Complete Setup'}
        </button>
      </div>
    </div>
  );
}
