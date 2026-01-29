import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, MapPin, Check, HeartPulse } from 'lucide-react';
import { audioCacheManager } from '@/lib/audioCache';

export default function CaretakerEmergencyMonitor() {
    const { fetchActiveAlerts, resolveEmergencyAlert, profile } = useUser();
    const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
    const [acknowledgedIds, setAcknowledgedIds] = useState<number[]>([]);
    const [noticedIds, setNoticedIds] = useState<number[]>([]); // Track which alerts have been noticed
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const vibrationIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
    const [audioReady, setAudioReady] = useState(false);
    const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
    const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

    // Preload audio on component mount
    useEffect(() => {
        const preloadAudio = async () => {
            try {
                console.log('🎵 Preloading emergency audio...');
                const audio = await audioCacheManager.createAudioElement('/emergency.mp3');
                audio.volume = 1.0; // Full volume
                audioRef.current = audio;
                setAudioReady(true);
                console.log('✅ Emergency audio preloaded and ready');

                // Show permission prompt after audio is loaded
                setShowPermissionPrompt(true);
            } catch (e) {
                console.error('❌ Failed to preload audio:', e);
            }
        };

        if (profile.role === 'caretaker') {
            preloadAudio();
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [profile.role]);

    // Function to request audio permission
    const requestAudioPermission = async () => {
        if (audioRef.current) {
            try {
                // Play and immediately pause to "unlock" audio
                await audioRef.current.play();
                audioRef.current.pause();
                audioRef.current.currentTime = 0;

                setAudioPermissionGranted(true);
                setShowPermissionPrompt(false);
                console.log('✅ Audio permission granted');
            } catch (e) {
                console.error('❌ Audio permission denied:', e);
            }
        }
    };

    useEffect(() => {
        if (profile.role !== 'caretaker') return;

        const syncAlerts = async () => {
            const alerts = await fetchActiveAlerts();

            // Clean up acknowledgedIds - remove IDs that are no longer active
            setAcknowledgedIds(prev => {
                const activeIds = alerts.map((a: any) => a.id);
                return prev.filter(id => activeIds.includes(id));
            });

            // Clean up noticedIds as well
            setNoticedIds(prev => {
                const activeIds = alerts.map((a: any) => a.id);
                return prev.filter(id => activeIds.includes(id));
            });

            setActiveAlerts(alerts);
            processAlerts(alerts);
        };

        const processAlerts = (alerts: any[]) => {
            // Filter out acknowledged ones for notification trigger
            const newAlerts = alerts.filter((a: any) => !acknowledgedIds.includes(a.id));
            const unnoticedAlerts = newAlerts.filter((a: any) => !noticedIds.includes(a.id));

            // Separate emergency and alert statuses
            const emergencyAlerts = unnoticedAlerts.filter((a: any) => a.status === 'emergency');
            const alertOnlyAlerts = unnoticedAlerts.filter((a: any) => a.status === 'alert');

            console.log(`🚨 Processing alerts: ${unnoticedAlerts.length} unnoticed (${emergencyAlerts.length} emergency, ${alertOnlyAlerts.length} alert)`);

            if (unnoticedAlerts.length > 0) {
                // Continuous Vibration - for both alert and emergency
                if (navigator.vibrate) {
                    // Clear any existing vibration interval
                    if (vibrationIntervalRef.current) {
                        clearInterval(vibrationIntervalRef.current);
                    }

                    // Start continuous vibration pattern
                    const vibratePattern = () => {
                        navigator.vibrate([500, 200, 500, 200, 500]); // Long vibration pattern
                    };

                    vibratePattern(); // Immediate first vibration
                    vibrationIntervalRef.current = setInterval(vibratePattern, 3000); // Repeat every 3 seconds
                }

                // Audio - ONLY for emergency status
                if (emergencyAlerts.length > 0 && audioRef.current) {
                    // Only attempt to play if audio is actually paused
                    if (audioRef.current.paused) {
                        console.log('🔊 Emergency detected - starting audio playback');
                        console.log('   Audio volume:', audioRef.current.volume);

                        audioRef.current.play()
                            .then(() => {
                                console.log('✅ Audio playing successfully');
                                console.log('   Duration:', audioRef.current!.duration, 'seconds');
                            })
                            .catch(e => {
                                console.error("❌ Audio playback failed:", e);
                            });
                    }
                    // If already playing, don't do anything (avoid interrupting playback)
                } else {
                    // If only alerts (no emergency), stop audio
                    if (audioRef.current && !audioRef.current.paused) {
                        console.log('⚠️ Stopping audio - no emergency alerts');
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                    }
                }
            } else {
                // Stop vibration when no unnoticed alerts
                if (vibrationIntervalRef.current) {
                    clearInterval(vibrationIntervalRef.current);
                    vibrationIntervalRef.current = null;
                }
                if (navigator.vibrate) {
                    navigator.vibrate(0); // Stop any ongoing vibration
                }

                // Audio continues playing - it will only stop when emergency is resolved (acknowledged)
            }
        };

        // Initial fetch
        syncAlerts();

        // Listen for Real-time WS Events (EMERGENCY_TRIGGER)
        const handleEmergencyEvent = (e: any) => {
            const alertData = e.detail;
            console.log("🚨 REAL-TIME EMERGENCY RECEIVED", alertData);

            const newAlert = {
                id: alertData.alert_id,
                user_id: alertData.data.user_id,
                user_name: alertData.data.user_name,
                user_phone: alertData.data.user_phone,
                blood_group: alertData.data.blood_group,
                address: alertData.data.address,
                health_issues: alertData.data.health_issues,
                triggered_at: alertData.data.triggered_at,
                nominee_phone: alertData.data.nominee_phone,
                status: 'emergency'
            };

            setActiveAlerts(prev => {
                if (prev.find(a => a.id === newAlert.id)) return prev;
                const updated = [...prev, newAlert];
                processAlerts(updated);
                return updated;
            });
        };

        // Listen for STATUS_UPDATE events
        const handleStatusUpdate = (e: any) => {
            const msg = e.detail;
            console.log("📊 STATUS UPDATE", msg);

            // Refresh alerts to get latest status
            syncAlerts();
        };

        window.addEventListener('emergency-alert', handleEmergencyEvent);
        window.addEventListener('status-update', handleStatusUpdate);

        // Backup Poll (slower, 30s) just in case WS drops
        const interval = setInterval(syncAlerts, 30000);

        return () => {
            window.removeEventListener('emergency-alert', handleEmergencyEvent);
            window.removeEventListener('status-update', handleStatusUpdate);
            clearInterval(interval);

            // Clean up vibration
            if (vibrationIntervalRef.current) {
                clearInterval(vibrationIntervalRef.current);
            }
            if (navigator.vibrate) {
                navigator.vibrate(0);
            }

            // Keep audio element for reuse, just pause it
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, [profile.role, acknowledgedIds, noticedIds]);

    const handleNoticed = (alertId: number) => {
        // Mark as noticed - stops vibration but keeps audio for emergency
        setNoticedIds(prev => [...prev, alertId]);

        // Keep audio playing if this is an emergency alert
        const alert = activeAlerts.find(a => a.id === alertId);
        if (alert && alert.status === 'emergency' && audioRef.current) {
            // Ensure audio continues playing
            if (audioRef.current.paused) {
                console.log('🔊 Ensuring audio continues for emergency');
                audioRef.current.play().catch(e => console.error('Audio play error:', e));
            }
        }
    };

    const handleAcknowledge = async (alertId: number) => {
        if (navigator.vibrate) navigator.vibrate(0); // Stop vibration

        await resolveEmergencyAlert(alertId);
        setAcknowledgedIds(prev => [...prev, alertId]);

        // Optimistically remove from view
        setActiveAlerts(prev => {
            const remaining = prev.filter(a => a.id !== alertId);

            // Stop audio if no more emergency alerts
            const hasEmergency = remaining.some(a => a.status === 'emergency');
            if (!hasEmergency && audioRef.current && !audioRef.current.paused) {
                console.log('🔇 Stopping audio - emergency resolved');
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            return remaining;
        });
    };

    return (
        <>
            {/* Audio Permission Prompt */}
            <AnimatePresence>
                {showPermissionPrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-card rounded-3xl shadow-2xl p-8 max-w-md w-full border-2 border-primary/20"
                        >
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                                    <AlertTriangle className="w-10 h-10 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground">Enable Emergency Alerts</h2>
                                <p className="text-muted-foreground">
                                    To receive audio alerts for patient emergencies, please enable sound notifications.
                                </p>
                                <button
                                    onClick={requestAudioPermission}
                                    className="w-full btn-primary bg-primary hover:bg-primary/90 py-4 text-lg font-semibold"
                                >
                                    Enable Audio Alerts
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Emergency Alerts */}
            <AnimatePresence>
                {activeAlerts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-destructive/90 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <div className="w-full max-w-lg space-y-4">
                            {activeAlerts.map(alert => (
                                <motion.div
                                    key={alert.id}
                                    layout
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    className="bg-card rounded-3xl shadow-2xl overflow-hidden border-2 border-white/20"
                                >
                                    <div className="bg-red-600 p-6 flex items-center gap-4 text-white">
                                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                                            <AlertTriangle className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">EMERGENCY WARNING</h2>
                                            <p className="text-white/80">
                                                {new Date(alert.triggered_at.endsWith('Z') ? alert.triggered_at : alert.triggered_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Patient needs assistance
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center font-bold text-xl text-primary">
                                                {alert.user_name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-foreground">{alert.user_name}</h3>
                                                <p className="text-muted-foreground">{alert.user_phone}</p>
                                            </div>
                                        </div>

                                        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <HeartPulse className="w-5 h-5 text-red-500" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Blood Group</p>
                                                    <p className="font-medium">{alert.blood_group}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-5 h-5 text-blue-500" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Location / Address</p>
                                                    <p className="font-medium text-sm">{alert.address}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {alert.health_issues && (
                                            <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg">
                                                <p className="text-xs text-orange-600 font-bold mb-1">KNOWN CONDITIONS</p>
                                                <p className="text-sm text-orange-800">{alert.health_issues}</p>
                                            </div>
                                        )}

                                        <div className="space-y-3 pt-2">
                                            {/* Noticed Button - Shows if not yet noticed */}
                                            {!noticedIds.includes(alert.id) && (
                                                <button
                                                    onClick={() => handleNoticed(alert.id)}
                                                    className="w-full btn-primary bg-yellow-600 hover:bg-yellow-700 py-4 flex items-center justify-center gap-2 animate-pulse"
                                                >
                                                    <AlertTriangle className="w-5 h-5" />
                                                    I NOTICED - Stop Vibration
                                                </button>
                                            )}

                                            {/* Action Buttons - Show after noticed */}
                                            {noticedIds.includes(alert.id) && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => window.open(`tel:${alert.user_phone}`, '_blank')}
                                                        className="btn-secondary py-4 flex items-center justify-center gap-2"
                                                    >
                                                        <Phone className="w-5 h-5" />
                                                        Call Patient
                                                    </button>
                                                    <button
                                                        onClick={() => handleAcknowledge(alert.id)}
                                                        className="btn-primary bg-red-600 hover:bg-red-700 py-4 flex items-center justify-center gap-2"
                                                    >
                                                        <Check className="w-5 h-5" />
                                                        Start Assist
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
