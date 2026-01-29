import React from 'react';
import { useApp } from '@/context/AppContext';
import { X, Pill, Shield, Settings2, Bell, Volume2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RightSidebarProps {
  onMedicationSettings: () => void;
  onEmergencySettings: () => void;
}

export default function RightSidebar({ onMedicationSettings, onEmergencySettings }: RightSidebarProps) {
  const { rightSidebarOpen, setRightSidebarOpen } = useApp();
  const [voiceFeedback, setVoiceFeedback] = React.useState(true);
  const [volume, setVolume] = React.useState(70);
  const [speechSpeed, setSpeechSpeed] = React.useState(50);

  const settingsItems = [
    {
      icon: Pill,
      label: 'Medication Settings',
      description: 'Add, edit, or remove medications',
      onClick: () => {
        onMedicationSettings();
        setRightSidebarOpen(false);
      },
    },
    {
      icon: Shield,
      label: 'Emergency Settings',
      description: 'Update emergency contacts',
      onClick: () => {
        onEmergencySettings();
        setRightSidebarOpen(false);
      },
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {rightSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setRightSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {rightSidebarOpen && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-card shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Settings</h2>
              <button
                onClick={() => setRightSidebarOpen(false)}
                className="p-2 hover:bg-accent rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
              {/* Quick Settings */}
              {settingsItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="care-card-sm w-full text-left hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </button>
              ))}

              {/* Device Preferences */}
              <div className="care-card-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Settings2 className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">Device Preferences</span>
                </div>

                <div className="space-y-4">
                  {/* Volume Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Volume</span>
                      </div>
                      <span className="text-sm font-medium text-primary">{volume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    />
                  </div>

                  {/* Speech Speed Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Speech Speed</span>
                      </div>
                      <span className="text-sm font-medium text-primary">{speechSpeed}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={speechSpeed}
                      onChange={(e) => setSpeechSpeed(Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    />
                  </div>
                </div>
              </div>

            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
