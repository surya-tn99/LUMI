import React, { useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { useApp } from '@/context/AppContext';

export default function VitalsBackgroundSync() {
    const { saveVitals, isAuthenticated, profile } = useUser();
    const { triggerEmergency } = useApp();
    const bufferRef = useRef<any[]>([]);

    useEffect(() => {
        // Only run for authenticated patients
        if (!isAuthenticated || profile.role !== 'patient') return;

        const fetchData = async () => {
            try {
                const res = await fetch(`http://${window.location.hostname}:8001/all`);
                const data = await res.json();

                // Extract vital signs
                const heartRate = data.heart_beat.heart_rate;
                const systolic = data.blood_pressure.systolic;
                const diastolic = data.blood_pressure.diastolic;

                // Check for emergency conditions
                const isHeartRateEmergency = heartRate < 50 || heartRate > 120;
                const isBloodPressureLow = systolic < 90 && diastolic < 60;
                const isBloodPressureHigh = systolic > 140 && diastolic > 90;
                const isBloodPressureEmergency = isBloodPressureLow || isBloodPressureHigh;

                // Trigger emergency if any condition is met
                if (isHeartRateEmergency || isBloodPressureEmergency) {
                    console.warn('🚨 EMERGENCY: Critical vital signs detected!', {
                        heartRate,
                        bloodPressure: `${systolic}/${diastolic}`,
                        reason: isHeartRateEmergency ? 'Heart rate out of range' : 'Blood pressure critical'
                    });
                    triggerEmergency();
                }

                const payload = [
                    {
                        metric_type: 'heart_rate',
                        value: heartRate.toString(),
                        unit: 'bpm',
                        timestamp: new Date().toISOString()
                    },
                    {
                        metric_type: 'blood_pressure',
                        value: `${systolic}/${diastolic}`,
                        unit: 'mmHg',
                        timestamp: new Date().toISOString()
                    },
                    {
                        metric_type: 'steps',
                        value: data.step_count.steps.toString(),
                        unit: 'count',
                        timestamp: new Date().toISOString()
                    }
                ];

                // Sync immediately without buffering
                await saveVitals(payload);
                console.log("Background: Synced vitals to server");

            } catch (err) {
                // Silent failure in background
                // console.warn("Background vitals fetch failed", err);
            }
        };

        const interval = setInterval(fetchData, 1000);
        return () => clearInterval(interval);
    }, [isAuthenticated, profile.role, saveVitals, triggerEmergency]);

    /* Removed Buffered Sync Loop */

    return null; // Invisible component
}
