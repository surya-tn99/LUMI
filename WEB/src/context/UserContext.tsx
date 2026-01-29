import { createContext, useContext } from 'react';

export interface Medication {
  id: number;
  name: string;
  dosage: string;
  scheduled_time: string;
  start_date: string;
  end_date?: string;
  taken?: boolean;
}

export interface UserProfile {
  role: 'patient' | 'caretaker' | null;
  name: string;
  fullname: string;
  age: string;
  phone: string;
  address: string;
  bloodGroup: string;
  healthIssues: string;
  nomineeName: string;
  nomineePhone: string;
  otp?: string;
}

export interface Nominee {
  id: number;
  name: string;
  relationship: string;
  phone: string;
}

export interface UserContextType {
  isAuthenticated: boolean;
  profile: UserProfile;
  medications: Medication[];
  nominees: Nominee[];
  dailyProgress: number;
  setAuthenticated: (value: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addMedication: (medication: Omit<Medication, 'id' | 'taken'>) => void;
  updateMedication: (id: number, updates: Partial<Omit<Medication, 'id'>>) => void;
  removeMedication: (id: number) => void;
  toggleMedicationTaken: (id: number) => void;
  addNominee: (nominee: { name: string; phone: string; relationship: string }) => void;
  updateNominee: (id: number, updates: { name?: string; phone?: string; relationship?: string }) => void;
  removeNominee: (id: number) => void;
  saveVitals: (metrics: { metric_type: string; value: string; unit: string; timestamp: string }[]) => Promise<void>;
  logout: () => void;
  login: (phone: string, otp: string) => Promise<boolean>;
  register: (profile: UserProfile) => Promise<boolean>;
  checkUser: (phone: string) => Promise<boolean>;
  // Caretaker methods
  fetchPatientMedications: (patientId: number) => Promise<Medication[]>;
  addPatientMedication: (patientId: number, med: any) => Promise<void>;
  updatePatientMedication: (patientId: number, medId: number, updates: any) => Promise<void>;
  removePatientMedication: (patientId: number, medId: number) => Promise<void>;
  fetchPatientNominees: (patientId: number) => Promise<Nominee[]>;
  addPatientNominee: (patientId: number, nominee: any) => Promise<void>;
  updatePatientNominee: (patientId: number, nomineeId: number, updates: any) => Promise<void>;
  removePatientNominee: (patientId: number, nomineeId: number) => Promise<void>;

  triggerEmergencyAlert: () => Promise<number | void>;
  resolveEmergencyAlert: (alertId: number) => Promise<void>;
  updatePatientStatus: (status: string) => Promise<void>;
  fetchActiveAlerts: () => Promise<any[]>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
