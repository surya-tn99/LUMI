import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { X, Activity, Heart, Footprints, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface VitalsModalProps {
    open: boolean;
    onClose: () => void;
}

interface VitalsData {
    heart_rate?: number;
    systolic?: number;
    diastolic?: number;
    steps?: number;
    timestamp: string;
}

export default function VitalsModal({ open, onClose }: VitalsModalProps) {
    const { saveVitals } = useUser();
    const [liveData, setLiveData] = useState<VitalsData[]>([]);
    const [currentHeartRate, setCurrentHeartRate] = useState(0);
    const [currentBP, setCurrentBP] = useState({ sys: 0, dia: 0 });
    const [currentSteps, setCurrentSteps] = useState(0);

    // Buffer to store data for batch upload
    const bufferRef = useRef<any[]>([]);

    // Function to fetch data from live API
    const fetchData = async () => {
        try {
            const res = await fetch(`http://${window.location.hostname}:8001/all`);
            const data = await res.json();

            const timestamp = new Date().toLocaleTimeString();
            const newDataPoint = {
                timestamp,
                heart_rate: data.heart_beat.heart_rate,
                systolic: data.blood_pressure.systolic,
                diastolic: data.blood_pressure.diastolic,
                steps: data.step_count.steps
            };

            // Update current stats
            setCurrentHeartRate(data.heart_beat.heart_rate);
            setCurrentBP({ sys: data.blood_pressure.systolic, dia: data.blood_pressure.diastolic });
            setCurrentSteps(data.step_count.steps);

            // Update graph data (keep last 20 points)
            setLiveData(prev => {
                const updated = [...prev, newDataPoint];
                if (updated.length > 30) return updated.slice(updated.length - 30);
                return updated;
            });

            // Add to buffer for upload
            bufferRef.current.push({
                metric_type: 'heart_rate',
                value: data.heart_beat.heart_rate.toString(),
                unit: 'bpm',
                timestamp: new Date().toISOString()
            });
            bufferRef.current.push({
                metric_type: 'blood_pressure',
                value: `${data.blood_pressure.systolic}/${data.blood_pressure.diastolic}`,
                unit: 'mmHg',
                timestamp: new Date().toISOString()
            });
            bufferRef.current.push({
                metric_type: 'steps',
                value: data.step_count.steps.toString(),
                unit: 'count',
                timestamp: new Date().toISOString()
            });

        } catch (err) {
            console.error("Failed to fetch live vitals. Is the health API running on port 8001?", err);
        }
    };

    // Poll for live data every 1 second
    useEffect(() => {
        if (!open) return;
        const interval = setInterval(fetchData, 1000);
        return () => clearInterval(interval);
    }, [open]);

    // Sync to server handled by VitalsBackgroundSync.tsx now
    // We only fetch for visualization here.
    /*
    useEffect(() => {
        if (!open) return;
        const interval = setInterval(() => {
            if (bufferRef.current.length > 0) {
                saveVitals([...bufferRef.current]); // Send copy
                bufferRef.current = []; // Clear buffer
                console.log("Synced vitals to server");
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [open]);
    */

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
                        className="fixed inset-4 md:inset-x-10 md:top-[5%] md:bottom-[5%] md:max-w-4xl mx-auto bg-card rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                <h2 className="text-xl font-bold text-foreground">Health Vitals (Live)</h2>
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-500 text-xs rounded-full animate-pulse">
                                    <Wifi className="w-3 h-3" />
                                    <span>Live</span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-accent rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1 hide-scrollbar grid gap-6 md:grid-cols-2">

                            {/* Heart Rate Card */}
                            <div className="care-card p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Heart className="w-5 h-5 text-destructive animate-pulse" />
                                        <h3 className="font-semibold">Heart Rate</h3>
                                    </div>
                                    <span className="text-2xl font-bold">{currentHeartRate} <span className="text-sm text-muted-foreground font-normal">bpm</span></span>
                                </div>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={liveData}>
                                            <defs>
                                                <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                            <XAxis dataKey="timestamp" hide />
                                            <YAxis domain={['auto', 'auto']} hide />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="heart_rate" stroke="#ef4444" fillOpacity={1} fill="url(#colorHr)" />
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
                                    <span className="text-2xl font-bold">{currentBP.sys}/{currentBP.dia} <span className="text-sm text-muted-foreground font-normal">mmHg</span></span>
                                </div>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={liveData}>
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
                                    <span className="text-2xl font-bold">{currentSteps} <span className="text-sm text-muted-foreground font-normal">steps</span></span>
                                </div>
                                <div className="h-[150px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={liveData}>
                                            <defs>
                                                <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                            <XAxis dataKey="timestamp" />
                                            <YAxis hide />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="steps" stroke="#f97316" fillOpacity={1} fill="url(#colorSteps)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
