import React from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { AlertTriangle, Phone, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmergencyAlert() {
  const { isEmergencyMode, clearEmergency, emergencyStartTime } = useApp();
  const { profile } = useUser();
  const [countdown, setCountdown] = React.useState(300);

  const { triggerEmergencyAlert, updatePatientStatus } = useUser();
  const alertTriggeredRef = React.useRef(false);
  const [callInitiated, setCallInitiated] = React.useState(false);

  const handleCall = React.useCallback(() => {
    // Trigger call to Emergency Services (108)
    setCallInitiated(true);
    // Explicitly set status to EMERGENCY when call is made
    updatePatientStatus('emergency');
    window.location.href = "tel:108";
  }, [updatePatientStatus]);

  // Trigger backend alert
  React.useEffect(() => {
    if (isEmergencyMode && !alertTriggeredRef.current) {
      // When emergency mode starts (countdown), we set status to ALERT
      updatePatientStatus('alert');
      // triggerEmergencyAlert(); // We can still do this for backward compat or just rely on status
      alertTriggeredRef.current = true;
    }
    if (!isEmergencyMode) {
      if (alertTriggeredRef.current) {
        // If clearing emergency, set to NORMAL
        updatePatientStatus('normal');
      }
      alertTriggeredRef.current = false;
      setCallInitiated(false);
    }
  }, [isEmergencyMode, updatePatientStatus]);

  // Timer logic
  React.useEffect(() => {
    if (!isEmergencyMode || !emergencyStartTime || callInitiated) {
      if (callInitiated) setCountdown(0);
      return;
    }

    // Calculate initial remaining time
    const calculateRemaining = () => {
      const elapsed = Math.floor((Date.now() - emergencyStartTime) / 1000);
      const remaining = 300 - elapsed;
      return remaining > 0 ? remaining : 0;
    };

    // Set initial immediately
    setCountdown(calculateRemaining());

    const timer = setInterval(() => {
      setCountdown((prev) => {
        const remaining = calculateRemaining();
        if (remaining <= 0) {
          clearInterval(timer);
          if (prev > 0) handleCall();
          return 0;
        }
        return remaining;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isEmergencyMode, emergencyStartTime, handleCall, callInitiated]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isEmergencyMode && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-0 left-0 right-0 z-[100] p-4"
        >
          <div className="max-w-md mx-auto bg-destructive rounded-2xl shadow-emergency overflow-hidden">
            {/* Alert Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/20">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <AlertTriangle className="w-6 h-6 text-white" />
                </motion.div>
                <div className="flex flex-col">
                  <span className="font-bold text-white text-lg leading-none">EMERGENCY</span>
                  <span className="text-white/80 text-xs">
                    {callInitiated ? "Call Initiated" : `Calling in ${formatTime(countdown)}`}
                  </span>
                </div>
              </div>
              {/* Header Close removed as we have a main cancel button now, or keep both for safety? Keeping main cancel as requested. */}
            </div>

            {/* Alert Content */}
            <div className="p-4">
              <p className="text-white/90 text-center mb-6 text-lg">
                <span className="font-bold">{profile.name || 'User'}</span> needs help!
              </p>

              {/* Action Buttons */}
              <div className="flex gap-4 items-center">
                <button
                  onClick={handleCall}
                  className="flex-1 bg-white text-destructive font-bold py-4 px-4 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-white/90 transition-colors shadow-lg"
                >
                  <div className="flex items-center gap-2 text-lg">
                    <Phone className="w-6 h-6 fill-current" />
                    <span>{callInitiated ? "Calling..." : "Call Now"}</span>
                  </div>
                  <span className="text-xs opacity-70 font-normal">
                    {callInitiated ? " connecting..." : `Auto-calling in ${countdown}s`}
                  </span>
                </button>

                <button
                  onClick={clearEmergency}
                  className="bg-black/20 hover:bg-black/30 text-white p-4 rounded-xl flex items-center justify-center transition-colors shadow-lg backdrop-blur-sm"
                  title="Cancel Emergency"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
            </div>

            {/* Pulsing Bottom Bar */}
            <motion.div
              className="h-1.5 bg-white/50"
              animate={{ width: ["100%", "0%"] }}
              transition={{ duration: 300, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
