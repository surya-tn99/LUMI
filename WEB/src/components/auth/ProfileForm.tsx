import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { ArrowLeft, User } from 'lucide-react';

interface ProfileFormProps {
  onNext: () => void;
  onBack: () => void;
}

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfileForm({ onNext, onBack }: ProfileFormProps) {
  const { profile, updateProfile } = useUser();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!profile.name.trim()) newErrors.name = 'Name is required';
    if (!profile.age || isNaN(Number(profile.age))) newErrors.age = 'Valid age is required';
    if (!profile.address.trim()) newErrors.address = 'Address is required';
    if (!profile.bloodGroup) newErrors.bloodGroup = 'Blood group is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
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
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Your Profile</h2>
        <p className="text-muted-foreground">Tell us about yourself</p>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full space-y-4 overflow-y-auto hide-scrollbar">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => updateProfile({ name: e.target.value })}
            placeholder="John Doe"
            className="care-input"
          />
          {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Age</label>
          <input
            type="number"
            value={profile.age}
            onChange={(e) => updateProfile({ age: e.target.value })}
            placeholder="65"
            className="care-input"
          />
          {errors.age && <p className="text-destructive text-sm mt-1">{errors.age}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Address</label>
          <textarea
            value={profile.address}
            onChange={(e) => updateProfile({ address: e.target.value })}
            placeholder="123 Care Street, City, State"
            className="care-input min-h-[80px] resize-none"
          />
          {errors.address && <p className="text-destructive text-sm mt-1">{errors.address}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Blood Group</label>
          <select
            value={profile.bloodGroup}
            onChange={(e) => updateProfile({ bloodGroup: e.target.value })}
            className="care-input"
          >
            <option value="">Select Blood Group</option>
            {bloodGroups.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
          {errors.bloodGroup && <p className="text-destructive text-sm mt-1">{errors.bloodGroup}</p>}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button onClick={handleNext} className="btn-primary w-full">
          Continue
        </button>
      </div>
    </div>
  );
}
