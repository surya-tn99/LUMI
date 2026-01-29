import React, { useState } from 'react';
import { useUser, Nominee } from '@/context/UserContext';
import { X, Shield, Save, Plus, Pencil, Trash2, Check, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmergencySettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EmergencySettingsModal({ open, onClose }: EmergencySettingsModalProps) {
  const { nominees, addNominee, updateNominee, removeNominee } = useUser();

  // Add State
  const [newNomineeName, setNewNomineeName] = useState('');
  const [newNomineePhone, setNewNomineePhone] = useState('');
  const [newNomineeRel, setNewNomineeRel] = useState('Family');

  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRel, setEditRel] = useState('');

  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!newNomineeName.trim()) {
      setError('Please enter nominee name');
      return;
    }
    if (!newNomineePhone || newNomineePhone.length < 10) {
      setError('Please enter valid phone number');
      return;
    }

    await addNominee({
      name: newNomineeName,
      phone: newNomineePhone,
      relationship: newNomineeRel
    });

    setNewNomineeName('');
    setNewNomineePhone('');
    setError('');
  };

  const startEditing = (nominee: Nominee) => {
    setEditingId(nominee.id);
    setEditName(nominee.name);
    setEditPhone(nominee.phone);
    setEditRel(nominee.relationship);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditPhone('');
    setEditRel('');
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    if (!editName.trim()) {
      // Optionally set an error for editing as well
      return;
    }

    await updateNominee(editingId, {
      name: editName,
      phone: editPhone,
      relationship: editRel
    });
    cancelEditing();
  };

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
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-destructive" />
                <h2 className="text-xl font-bold text-foreground">Emergency Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1 hide-scrollbar space-y-6">

              {/* Add New Nominee */}
              <div className="care-card-sm bg-destructive/5 border-destructive/20">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Contact
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newNomineeName}
                    onChange={(e) => {
                      setNewNomineeName(e.target.value);
                      setError('');
                    }}
                    placeholder="Name (e.g. Jane Doe)"
                    className="care-input"
                  />
                  <input
                    type="tel"
                    value={newNomineePhone}
                    onChange={(e) => {
                      setNewNomineePhone(e.target.value);
                      setError('');
                    }}
                    placeholder="Phone Number"
                    className="care-input"
                  />
                  <select
                    value={newNomineeRel}
                    onChange={(e) => setNewNomineeRel(e.target.value)}
                    className="care-input"
                  >
                    <option value="Family">Family</option>
                    <option value="Friend">Friend</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Other">Other</option>
                  </select>

                  {error && <p className="text-destructive text-sm">{error}</p>}

                  <button onClick={handleAdd} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" />
                    Add Contact
                  </button>
                </div>
              </div>

              {/* Nominee List */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Saved Contacts</h3>
                {nominees.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No emergency contacts added yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {nominees.map((nominee) => (
                      <motion.div
                        key={nominee.id}
                        layout
                        className="p-3 bg-muted/50 rounded-xl"
                      >
                        {editingId === nominee.id ? (
                          // Edit Mode
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="care-input text-sm"
                              placeholder="Name"
                            />
                            <input
                              type="tel"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="care-input text-sm"
                              placeholder="Phone"
                            />
                            <select
                              value={editRel}
                              onChange={(e) => setEditRel(e.target.value)}
                              className="care-input text-sm"
                            >
                              <option value="Family">Family</option>
                              <option value="Friend">Friend</option>
                              <option value="Doctor">Doctor</option>
                              <option value="Other">Other</option>
                            </select>
                            <div className="flex gap-2">
                              <button
                                onClick={saveEdit}
                                className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-1"
                              >
                                <Check className="w-4 h-4" />
                                Save
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center gap-1"
                              >
                                <XCircle className="w-4 h-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Display Mode
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{nominee.name}</p>
                              <p className="text-sm text-muted-foreground">{nominee.phone} • {nominee.relationship}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditing(nominee)}
                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeNominee(nominee.id)}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
