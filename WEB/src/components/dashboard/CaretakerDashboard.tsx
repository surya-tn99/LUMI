import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Activity, Heart, Footprints, Users, ChevronDown, Check, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import MedicationModal from './MedicationModal';

interface Patient {
    id: number;
    fullname: string;
    phone: string;
    last_active_at?: string;
    status?: string;
}

interface HealthMetric {
    metric_type: string;
    value: string;
    unit: string;
    timestamp: string;
}

// Helper to check online status (within 15 seconds)
const isOnline = (dateString?: string) => {
    if (!dateString) return false;
    // Assume dateString from server is UTC but might lack 'Z'
    // If it doesn't end in Z, append it to force UTC parsing
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const diff = new Date().getTime() - new Date(utcString).getTime();
    return diff < 15000; // 15 seconds threshold
};

interface ProcessedVitals {
    heart_rate: number;
    systolic: number;
    diastolic: number;
    steps: number;
    timestamp: string;
}

export default function CaretakerDashboard() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [vitalsData, setVitalsData] = useState<ProcessedVitals[]>([]);
    const [currentVitals, setCurrentVitals] = useState({ heart_rate: 0, sys: 0, dia: 0, steps: 0 });
    const [loading, setLoading] = useState(true);
    const [showPatientMenu, setShowPatientMenu] = useState(false);
    const [medsModalOpen, setMedsModalOpen] = useState(false);

    const [medicationData, setMedicationData] = useState<any[]>([]);

    // Fetch Patients & Poll for Status
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await api.get('/users/patients');
                setPatients(res.data);
                // Select first patient if none selected
                if (!selectedPatientId && res.data.length > 0) {
                    setSelectedPatientId(res.data[0].id);
                }
            } catch (e) {
                console.error("Failed to fetch patients", e);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();

        // Poll patient list every 5 seconds to update online status
        const interval = setInterval(fetchPatients, 5000);
        return () => clearInterval(interval);
    }, [selectedPatientId]);

    // Poll Vitals & Medications
    useEffect(() => {
        if (!selectedPatientId) return;

        // Reset data immediately on switch
        setVitalsData([]);
        setCurrentVitals({ heart_rate: 0, sys: 0, dia: 0, steps: 0 });
        setMedicationData([]);

        let isActive = true;

        const fetchVitalsAndMeds = async () => {
            try {
                // Fetch Vitals
                const vitalsRes = await api.get(`/vitals/${selectedPatientId}?limit=100`);

                // Fetch Medication Logs (Last 7 Days)
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 6); // Last 7 days including today
                const startStr = start.toISOString().split('T')[0];
                const endStr = end.toISOString().split('T')[0];

                const medsRes = await api.get(`/medications/${selectedPatientId}/logs?start_date=${startStr}&end_date=${endStr}`);

                if (!isActive) return;

                // --- Process Vitals ---
                const metrics: HealthMetric[] = vitalsRes.data;
                const grouped: Record<string, any> = {};

                metrics.forEach(m => {
                    const utcString = m.timestamp.endsWith('Z') ? m.timestamp : m.timestamp + 'Z';
                    const localDate = new Date(utcString);
                    const timeKey = localDate.toLocaleTimeString();

                    if (!grouped[timeKey]) {
                        grouped[timeKey] = { timestamp: timeKey };
                    }

                    if (m.metric_type === 'heart_rate') {
                        grouped[timeKey].heart_rate = parseFloat(m.value);
                        grouped[timeKey].raw_ts = localDate.getTime();
                    } else if (m.metric_type === 'blood_pressure') {
                        const [sys, dia] = m.value.split('/');
                        grouped[timeKey].systolic = parseInt(sys);
                        grouped[timeKey].diastolic = parseInt(dia);
                    } else if (m.metric_type === 'steps') {
                        grouped[timeKey].steps = parseInt(m.value);
                    }
                });

                const sortedData = Object.values(grouped).sort((a: any, b: any) => a.raw_ts - b.raw_ts);
                // Filter for last 2 minutes for the CHART
                const cutoffTime = Date.now() - 120000;
                const recentData = sortedData.filter((d: any) => d.raw_ts > cutoffTime);
                setVitalsData(recentData);

                // Use the LATEST available data for the "Current Value" display (even if older than 30s)
                if (sortedData.length > 0) {
                    const latest = sortedData[sortedData.length - 1];
                    setCurrentVitals({
                        heart_rate: latest.heart_rate || 0,
                        sys: latest.systolic || 0,
                        dia: latest.diastolic || 0,
                        steps: latest.steps || 0
                    });
                } else {
                    setCurrentVitals({ heart_rate: 0, sys: 0, dia: 0, steps: 0 });
                }

                // --- Process Medications ---
                // Group by date: { "2024-01-01": { taken: 5, total: 8 } }
                const logs = medsRes.data;
                const medStats: Record<string, { date: string, taken: number, total: number }> = {};

                // Initialize last 7 days empty
                for (let i = 0; i < 7; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dStr = d.toISOString().split('T')[0];
                    // Only Month/Day for display e.g. "Jan 29"
                    const displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    medStats[dStr] = { date: displayDate, taken: 0, total: 0 };
                }

                logs.forEach((log: any) => {
                    if (medStats[log.date]) {
                        medStats[log.date].total += 1;
                        if (log.status === 'Taken') {
                            medStats[log.date].taken += 1;
                        }
                    }
                });

                // Convert to array and reverse (oldest to newest)
                const chartData = Object.values(medStats).reverse();
                setMedicationData(chartData);

            } catch (e) {
                console.error("Failed to fetch dashboard data", e);
            }
        };

        fetchVitalsAndMeds();
        const interval = setInterval(fetchVitalsAndMeds, 3000); // 3s Poll for dashboard
        return () => {
            isActive = false;
            clearInterval(interval);
        };
    }, [selectedPatientId]);

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    if (loading) return <div className="text-muted-foreground">Loading patients...</div>;
    if (patients.length === 0) return <div className="text-muted-foreground">No patients assigned.</div>;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">

            {/* Patient Selector */}
            <div className="relative z-20 flex items-center gap-2">
                <button
                    onClick={() => setShowPatientMenu(!showPatientMenu)}
                    className="flex items-center gap-3 bg-card border border-border px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all flex-1 md:flex-none md:min-w-[250px] justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-muted-foreground">Monitoring Patient</p>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-foreground">{selectedPatient?.fullname || "Select Patient"}</p>
                                {selectedPatient && (
                                    <>
                                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${isOnline(selectedPatient.last_active_at) ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${isOnline(selectedPatient.last_active_at) ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                                            {isOnline(selectedPatient.last_active_at) ? 'Active' : 'Offline'}
                                        </div>

                                        {/* Health Status Badge */}
                                        {selectedPatient.status && selectedPatient.status !== 'normal' && (
                                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                                                ${selectedPatient.status === 'emergency' ? 'bg-red-500 text-white animate-pulse' :
                                                    selectedPatient.status === 'alert' ? 'bg-orange-500 text-white' :
                                                        selectedPatient.status === 'warning' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'}`}>
                                                {selectedPatient.status}
                                            </div>
                                        )}
                                        {selectedPatient.status === 'normal' && (
                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-500">
                                                Normal
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showPatientMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Patient Settings Button */}
                {selectedPatientId && (
                    <button
                        onClick={() => setMedsModalOpen(true)}
                        className="bg-card border border-border p-3 rounded-xl shadow-sm hover:shadow-md hover:bg-accent transition-all h-[66px] w-[66px] flex items-center justify-center"
                        title="Manage Patient Medications"
                    >
                        <Settings className="w-6 h-6 text-foreground" />
                    </button>
                )}

                <AnimatePresence>
                    {showPatientMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full mt-2 w-full md:w-[250px] bg-card border border-border rounded-xl shadow-xl overflow-hidden py-1"
                        >
                            {patients.map(patient => (
                                <button
                                    key={patient.id}
                                    onClick={() => {
                                        setSelectedPatientId(patient.id);
                                        setShowPatientMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center justify-between"
                                >
                                    <span className={patient.id === selectedPatientId ? 'font-medium text-primary' : 'text-foreground'}>
                                        {patient.fullname}
                                    </span>
                                    {patient.id === selectedPatientId && <Check className="w-4 h-4 text-primary" />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <MedicationModal
                open={medsModalOpen}
                onClose={() => setMedsModalOpen(false)}
                patientId={selectedPatientId}
            />

            {/* Vitals Grid */}
            <div className="grid gap-6 md:grid-cols-2">

                {/* Heart Rate Card */}
                <div className="care-card p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-destructive animate-pulse" />
                            <h3 className="font-semibold">Heart Rate</h3>
                        </div>
                        <span className="text-2xl font-bold">{currentVitals.heart_rate} <span className="text-sm text-muted-foreground font-normal">bpm</span></span>
                    </div>
                    <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={vitalsData}>
                                <defs>
                                    <linearGradient id="colorHrCaretaker" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="timestamp" hide />
                                <YAxis domain={['auto', 'auto']} hide />
                                <Tooltip />
                                <Area type="monotone" dataKey="heart_rate" stroke="#ef4444" fillOpacity={1} fill="url(#colorHrCaretaker)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* BP Card */}
                <div className="care-card p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">Blood Pressure</h3>
                        </div>
                        <span className="text-2xl font-bold">{currentVitals.sys}/{currentVitals.dia} <span className="text-sm text-muted-foreground font-normal">mmHg</span></span>
                    </div>
                    <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={vitalsData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="timestamp" hide />
                                <YAxis domain={['auto', 'auto']} hide />
                                <Tooltip />
                                <Line type="monotone" dataKey="systolic" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="diastolic" stroke="#6366f1" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Steps Card */}
                <div className="care-card p-4 space-y-4 md:col-span-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Footprints className="w-5 h-5 text-orange-500" />
                            <h3 className="font-semibold">Steps Today</h3>
                        </div>
                        <span className="text-2xl font-bold">{currentVitals.steps} <span className="text-sm text-muted-foreground font-normal">steps</span></span>
                    </div>
                    <div className="h-[150px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={vitalsData}>
                                <defs>
                                    <linearGradient id="colorStepsCaretaker" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="timestamp" />
                                <YAxis hide />
                                <Tooltip />
                                <Area type="monotone" dataKey="steps" stroke="#f97316" fillOpacity={1} fill="url(#colorStepsCaretaker)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Medication Adherence Chart */}
                <div className="care-card p-4 space-y-4 md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-500" />
                        </div>
                        <h3 className="font-semibold">Medication Adherence (Last 7 Days)</h3>
                    </div>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={medicationData}>
                                <defs>
                                    <linearGradient id="colorMeds" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} width={30} />
                                <Tooltip />
                                <Area type="monotone" dataKey="taken" name="Doses Taken" stroke="#22c55e" fillOpacity={1} fill="url(#colorMeds)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
