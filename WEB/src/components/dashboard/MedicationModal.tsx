
import React, { useState } from 'react';
import { useUser, Medication, Nominee } from '@/context/UserContext';
import { X, Pill, Plus, Trash2, Clock, Pencil, Check, XCircle, Calendar, Shield, Phone, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MedicationModalProps {
    open: boolean;
    onClose: () => void;
    patientId?: number | null;
}

export default function MedicationModal({ open, onClose, patientId }: MedicationModalProps) {
    const {
        medications: myMeds,
        addMedication,
        updateMedication,
        removeMedication,
        fetchPatientMedications,
        addPatientMedication,
        updatePatientMedication,
        removePatientMedication,
        // Nominees
        nominees: myNominees,
        addNominee,
        updateNominee,
        removeNominee,
        fetchPatientNominees,
        addPatientNominee,
        updatePatientNominee,
        removePatientNominee
    } = useUser();

    const [activeTab, setActiveTab] = useState<'medications' | 'contacts'>('medications');

    const [localMeds, setLocalMeds] = useState<Medication[]>([]);
    const [localNominees, setLocalNominees] = useState<Nominee[]>([]);
    const [loading, setLoading] = useState(false);

    // If patientId is provided, we use local state populated from fetch
    // If not, we use context data
    const medsToDisplay = patientId ? localMeds : myMeds;
    const nomineesToDisplay = patientId ? localNominees : myNominees;

    React.useEffect(() => {
        if (open && patientId) {
            setLoading(true);
            Promise.all([
                fetchPatientMedications(patientId),
                fetchPatientNominees(patientId)
            ])
                .then(([meds, noms]) => {
                    setLocalMeds(meds);
                    setLocalNominees(noms);
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [open, patientId, fetchPatientMedications, fetchPatientNominees]);

    // --- Medication State ---
    const [newMedName, setNewMedName] = useState('');
    const [newMedTime, setNewMedTime] = useState('');
    const [newMedDosage, setNewMedDosage] = useState('');
    const [newMedStartDate, setNewMedStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [newMedEndDate, setNewMedEndDate] = useState('');
    const [medError, setMedError] = useState('');

    const [editingMedId, setEditingMedId] = useState<number | null>(null);
    const [editMedName, setEditMedName] = useState('');
    const [editMedTime, setEditMedTime] = useState('');
    const [editMedDosage, setEditMedDosage] = useState('');
    const [editMedStartDate, setEditMedStartDate] = useState('');
    const [editMedEndDate, setEditMedEndDate] = useState('');

    // --- Nominee State ---
    const [newNomName, setNewNomName] = useState('');
    const [newNomPhone, setNewNomPhone] = useState('');
    const [newNomRel, setNewNomRel] = useState('');
    const [nomError, setNomError] = useState('');

    const [editingNomId, setEditingNomId] = useState<number | null>(null);
    const [editNomName, setEditNomName] = useState('');
    const [editNomPhone, setEditNomPhone] = useState('');
    const [editNomRel, setEditNomRel] = useState('');


    const formatTimeForDisplay = (time24: string) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    // --- Medication Handlers ---
    const handleAddMed = async () => {
        if (!newMedName.trim()) {
            setMedError('Please enter medication name');
            return;
        }
        if (!newMedTime) {
            setMedError('Please select a time');
            return;
        }

        const medData = {
            name: newMedName.trim(),
            scheduled_time: newMedTime,
            dosage: newMedDosage || "1 pill",
            start_date: newMedStartDate || new Date().toISOString().split('T')[0],
            end_date: newMedEndDate || undefined
        };

        if (patientId) {
            await addPatientMedication(patientId, medData);
            // Refresh local list
            const updated = await fetchPatientMedications(patientId);
            setLocalMeds(updated);
        } else {
            addMedication(medData);
        }

        setNewMedName('');
        setNewMedTime('');
        setNewMedDosage('');
        setNewMedStartDate(new Date().toISOString().split('T')[0]);
        setNewMedEndDate('');
        setMedError('');
    };

    const startEditingMed = (med: Medication) => {
        setEditingMedId(med.id);
        setEditMedName(med.name);
        setEditMedTime(med.scheduled_time);
        setEditMedDosage(med.dosage);
        setEditMedStartDate(med.start_date);
        setEditMedEndDate(med.end_date || '');
    };

    const cancelEditingMed = () => {
        setEditingMedId(null);
        setEditMedName('');
        setEditMedTime('');
        setEditMedDosage('');
        setEditMedStartDate('');
        setEditMedEndDate('');
    };

    const saveEditMed = async () => {
        if (editingMedId === null) return;
        if (!editMedName.trim()) return;
        if (!editMedTime) return;

        const updates = {
            name: editMedName.trim(),
            scheduled_time: editMedTime,
            dosage: editMedDosage,
            start_date: editMedStartDate || undefined,
            end_date: editMedEndDate || undefined
        };

        if (patientId) {
            await updatePatientMedication(patientId, editingMedId, updates);
            const updated = await fetchPatientMedications(patientId);
            setLocalMeds(updated);
        } else {
            updateMedication(editingMedId, updates);
        }

        cancelEditingMed();
    };

    const handleDeleteMed = async (id: number) => {
        if (patientId) {
            await removePatientMedication(patientId, id);
            const updated = await fetchPatientMedications(patientId);
            setLocalMeds(updated);
        } else {
            removeMedication(id);
        }
    };

    // --- Nominee Handlers ---
    const handleAddNominee = async () => {
        if (!newNomName.trim() || !newNomPhone.trim() || !newNomRel.trim()) {
            setNomError("All fields are required");
            return;
        }
        const nomData = { name: newNomName, phone: newNomPhone, relationship: newNomRel };

        if (patientId) {
            await addPatientNominee(patientId, nomData);
            const updated = await fetchPatientNominees(patientId);
            setLocalNominees(updated);
        } else {
            addNominee(nomData);
        }
        setNewNomName(''); setNewNomPhone(''); setNewNomRel('');
        setNomError('');
    };

    const startEditingNom = (nom: Nominee) => {
        setEditingNomId(nom.id);
        setEditNomName(nom.name);
        setEditNomPhone(nom.phone);
        setEditNomRel(nom.relationship);
    };

    const saveEditNom = async () => {
        if (!editingNomId) return;

        const updates = { name: editNomName, phone: editNomPhone, relationship: editNomRel };

        if (patientId) {
            await updatePatientNominee(patientId, editingNomId, updates);
            const updated = await fetchPatientNominees(patientId);
            setLocalNominees(updated);
        } else {
            updateNominee(editingNomId, updates);
        }
        setEditingNomId(null);
    };

    const handleDeleteNom = async (id: number) => {
        if (patientId) {
            await removePatientNominee(patientId, id);
            const updated = await fetchPatientNominees(patientId);
            setLocalNominees(updated);
        } else {
            removeNominee(id);
        }
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
                        className="fixed inset-0 z-50"
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
                        <div className="flex items-center justify-between p-4 border-b border-border bg-card z-10">
                            <div className="flex gap-2 bg-muted/50 p-1 rounded-xl w-full mr-4">
                                <button
                                    onClick={() => setActiveTab('medications')}
                                    className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'medications' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                                >
                                    <Pill className="w-4 h-4" />
                                    Medications
                                </button>
                                <button
                                    onClick={() => setActiveTab('contacts')}
                                    className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'contacts' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                                >
                                    <Shield className="w-4 h-4" />
                                    Contacts
                                </button>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-accent rounded-xl transition-colors flex-shrink-0"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 overflow-y-auto flex-1 hide-scrollbar space-y-4">

                            {loading && patientId && <p className="text-center text-muted-foreground">Loading...</p>}

                            {activeTab === 'medications' && (
                                <>
                                    {/* Add New Medication */}
                                    <div className="care-card-sm bg-accent/30 border-primary/30">
                                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <Plus className="w-4 h-4" />
                                            Add New Medication
                                        </h3>
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={newMedName}
                                                onChange={(e) => {
                                                    setNewMedName(e.target.value);
                                                    setMedError('');
                                                }}
                                                placeholder="Medication name"
                                                className="care-input"
                                            />
                                            <input
                                                type="text"
                                                value={newMedDosage}
                                                onChange={(e) => setNewMedDosage(e.target.value)}
                                                placeholder="Dosage (e.g., 500mg)"
                                                className="care-input"
                                            />
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                                <input
                                                    type="time"
                                                    value={newMedTime}
                                                    onChange={(e) => {
                                                        setNewMedTime(e.target.value);
                                                        setMedError('');
                                                    }}
                                                    className="care-input flex-1"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-muted-foreground">From</label>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                        <input
                                                            type="date"
                                                            value={newMedStartDate}
                                                            onChange={(e) => setNewMedStartDate(e.target.value)}
                                                            className="care-input text-sm p-2"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-muted-foreground">To (Optional)</label>
                                                    <input
                                                        type="date"
                                                        value={newMedEndDate}
                                                        onChange={(e) => setNewMedEndDate(e.target.value)}
                                                        className="care-input text-sm p-2"
                                                    />
                                                </div>
                                            </div>
                                            {medError && <p className="text-destructive text-sm">{medError}</p>}
                                            <button onClick={handleAddMed} className="btn-primary w-full">
                                                Add Medication
                                            </button>
                                        </div>
                                    </div>

                                    {/* Medication List */}
                                    <div>
                                        <h3 className="font-semibold text-foreground mb-3">Current Medications</h3>
                                        {medsToDisplay.length === 0 && !loading ? (
                                            <p className="text-muted-foreground text-center py-8">
                                                No medications added yet
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {medsToDisplay.map((med) => (
                                                    <motion.div
                                                        key={med.id}
                                                        layout
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20 }}
                                                        className="p-3 bg-muted/50 rounded-xl"
                                                    >
                                                        {editingMedId === med.id ? (
                                                            /* Edit Mode */
                                                            <div className="space-y-2">
                                                                <input
                                                                    type="text"
                                                                    value={editMedName}
                                                                    onChange={(e) => setEditMedName(e.target.value)}
                                                                    placeholder="Medication name"
                                                                    className="care-input text-sm"
                                                                    autoFocus
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={editMedDosage}
                                                                    onChange={(e) => setEditMedDosage(e.target.value)}
                                                                    placeholder="Dosage"
                                                                    className="care-input text-sm"
                                                                />
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                    <input
                                                                        type="time"
                                                                        value={editMedTime}
                                                                        onChange={(e) => setEditMedTime(e.target.value)}
                                                                        className="care-input flex-1 text-sm"
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] text-muted-foreground">From</label>
                                                                        <input
                                                                            type="date"
                                                                            value={editMedStartDate}
                                                                            onChange={(e) => setEditMedStartDate(e.target.value)}
                                                                            className="care-input text-xs p-1 h-8"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] text-muted-foreground">To</label>
                                                                        <input
                                                                            type="date"
                                                                            value={editMedEndDate}
                                                                            onChange={(e) => setEditMedEndDate(e.target.value)}
                                                                            className="care-input text-xs p-1 h-8"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={saveEditMed}
                                                                        className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-1"
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                        Save
                                                                    </button>
                                                                    <button
                                                                        onClick={cancelEditingMed}
                                                                        className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center gap-1"
                                                                    >
                                                                        <XCircle className="w-4 h-4" />
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* Display Mode */
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="font-medium text-foreground">{med.name} <span className="text-xs text-muted-foreground">({med.dosage})</span></p>
                                                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {formatTimeForDisplay(med.scheduled_time)}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        {med.start_date} {med.end_date ? `- ${med.end_date}` : ''}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => startEditingMed(med)}
                                                                        className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
                                                                        title="Edit medication"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteMed(med.id)}
                                                                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                                                                        title="Delete medication"
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
                                </>
                            )}


                            {activeTab === 'contacts' && (
                                <>
                                    {/* Add Nominee */}
                                    <div className="care-card-sm bg-accent/30 border-primary/30">
                                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <Plus className="w-4 h-4" />
                                            Add New Contact
                                        </h3>
                                        <div className="space-y-3">
                                            <input type="text" value={newNomName} onChange={e => setNewNomName(e.target.value)} placeholder="Full Name" className="care-input" />
                                            <input type="tel" value={newNomPhone} onChange={e => setNewNomPhone(e.target.value)} placeholder="Phone Number" className="care-input" />
                                            <input type="text" value={newNomRel} onChange={e => setNewNomRel(e.target.value)} placeholder="Relationship (e.g. Son, Doctor)" className="care-input" />

                                            {nomError && <p className="text-destructive text-sm">{nomError}</p>}
                                            <button onClick={handleAddNominee} className="btn-primary w-full">Add Contact</button>
                                        </div>
                                    </div>

                                    {/* Nominees List */}
                                    <div>
                                        <h3 className="font-semibold text-foreground mb-3">Emergency Contacts</h3>
                                        {nomineesToDisplay.length === 0 && !loading ? (
                                            <p className="text-muted-foreground text-center py-8">
                                                No emergency contacts added yet
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {nomineesToDisplay.map(nom => (
                                                    <motion.div
                                                        key={nom.id}
                                                        layout
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20 }}
                                                        className="p-3 bg-muted/50 rounded-xl"
                                                    >
                                                        {editingNomId === nom.id ? (
                                                            <div className="space-y-2">
                                                                <input value={editNomName} onChange={e => setEditNomName(e.target.value)} className="care-input text-sm" placeholder="Full Name" />
                                                                <input value={editNomPhone} onChange={e => setEditNomPhone(e.target.value)} className="care-input text-sm" placeholder="Phone Number" />
                                                                <input value={editNomRel} onChange={e => setEditNomRel(e.target.value)} className="care-input text-sm" placeholder="Relationship" />
                                                                <div className="flex gap-2">
                                                                    <button onClick={saveEditNom} className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-1">
                                                                        <Check className="w-4 h-4" />
                                                                        Save
                                                                    </button>
                                                                    <button onClick={() => setEditingNomId(null)} className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center gap-1">
                                                                        <XCircle className="w-4 h-4" />
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                                        <UserIcon className="w-4 h-4 text-primary" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-foreground">{nom.name}</p>
                                                                        <p className="text-xs text-muted-foreground">{nom.relationship} • {nom.phone}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={() => startEditingNom(nom)}
                                                                        className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
                                                                        title="Edit contact"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteNom(nom.id)}
                                                                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                                                                        title="Delete contact"
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
                                </>

                            )}

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
