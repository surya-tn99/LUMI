import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { X, User, Phone, MapPin, Droplet, Heart, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { profile, updateProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(profile);

  // Update edit form when profile changes or modal opens
  React.useEffect(() => {
    if (open) {
      setEditForm(profile);
    }
  }, [open, profile]);

  const handleSave = async () => {
    await updateProfile(editForm);
    setIsEditing(false);
  };

  const profileItems = [
    { icon: User, label: 'Name', value: profile.name || 'Not set', key: 'name' },
    { icon: User, label: 'Age', value: profile.age ? `${profile.age} years` : 'Not set', key: 'age' },
    { icon: Phone, label: 'Phone', value: profile.phone || 'Not set', key: 'phone', readOnly: true },
    { icon: MapPin, label: 'Address', value: profile.address || 'Not set', key: 'address' },
    { icon: Droplet, label: 'Blood Group', value: profile.bloodGroup || 'Not set', key: 'bloodGroup' },
    { icon: Heart, label: 'Health Issues', value: profile.healthIssues || 'None listed', key: 'healthIssues' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] max-w-md mx-auto bg-card rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">My Profile</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isEditing
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                >
                  {isEditing ? 'Save' : 'Edit'}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-accent rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1 hide-scrollbar space-y-3">
              {/* Avatar */}
              <div className="flex flex-col items-center py-4">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold mb-2">
                  {profile.name ? profile.name[0].toUpperCase() : 'U'}
                </div>
                <p className="text-lg font-semibold text-foreground">{profile.name || 'User'}</p>
                <p className="text-sm text-muted-foreground capitalize">{profile.role || 'Patient'}</p>
              </div>

              {/* Profile Items */}
              {profileItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                    {isEditing && !item.readOnly ? (
                      <input
                        type="text"
                        value={editForm[item.key as keyof typeof editForm] as string || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, [item.key]: e.target.value }))}
                        className="care-input text-sm py-1"
                        placeholder={`Enter ${item.label}`}
                      />
                    ) : (
                      <p className="font-medium text-foreground">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
