import React from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { X, Pill, TrendingUp, Shield, Camera, ChevronDown, ChevronUp, Check, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeftSidebar() {
  const { leftSidebarOpen, setLeftSidebarOpen, isEmergencyMode } = useApp();
  const { medications, dailyProgress, toggleMedicationTaken, profile } = useUser();
  const [expandedSection, setExpandedSection] = React.useState<string | null>('medications');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {leftSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setLeftSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {leftSidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-card shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">My Health</h2>
              <button
                onClick={() => setLeftSidebarOpen(false)}
                className="p-2 hover:bg-accent rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">

              {/* Health Vitals */}
              {profile.role !== 'caretaker' && ( // Assuming Vitals are primarily for patients or visible to all? Code didn't have check before. Keeping as adds value.
                <div className="care-card-sm">
                  <button
                    onClick={() => toggleSection('vitals')}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-orange-500" />
                      </div>
                      <span className="font-semibold text-foreground">Health Vitals</span>
                    </div>
                    {expandedSection === 'vitals' ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedSection === 'vitals' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4">
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('openVitalsModal'));
                            }}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                          >
                            <Activity className="w-4 h-4" />
                            View Live Vitals
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Medications Accordion */}
              <div className="care-card-sm">
                <button
                  onClick={() => toggleSection('medications')}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">Medications</span>
                  </div>
                  {expandedSection === 'medications' ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedSection === 'medications' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 space-y-3">
                        {medications.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No medications added yet
                          </p>
                        ) : (
                          medications.map((med) => (
                            <div
                              key={med.id}
                              className={`flex items-center justify-between p-3 rounded-xl border ${med.taken ? 'bg-success/10 border-success/30' : 'bg-muted/50 border-border'
                                }`}
                            >
                              <div>
                                <p className={`font-medium ${med.taken ? 'text-success' : 'text-foreground'}`}>
                                  {med.name}
                                </p>
                                <p className="text-sm text-muted-foreground">{med.scheduled_time}</p>
                              </div>
                              <button
                                onClick={() => toggleMedicationTaken(med.id)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${med.taken
                                  ? 'bg-success text-white'
                                  : 'bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary'
                                  }`}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Daily Progress */}
              <div className="care-card-sm">
                <button
                  onClick={() => toggleSection('progress')}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">Daily Progress</span>
                  </div>
                  {expandedSection === 'progress' ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedSection === 'progress' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Medications taken</span>
                          <span className="font-bold text-primary">{dailyProgress}%</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${dailyProgress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Emergency Status */}
              <div className="care-card-sm">
                <button
                  onClick={() => toggleSection('emergency')}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEmergencyMode ? 'bg-destructive/10' : 'bg-success/10'}`}>
                      <Shield className={`w-5 h-5 ${isEmergencyMode ? 'text-destructive' : 'text-success'}`} />
                    </div>
                    <span className="font-semibold text-foreground">Emergency Status</span>
                  </div>
                  {expandedSection === 'emergency' ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedSection === 'emergency' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
                        <div className={`p-3 rounded-xl flex items-center gap-3 ${isEmergencyMode ? 'bg-destructive/10' : 'bg-success/10'}`}>
                          <div className={`w-3 h-3 rounded-full ${isEmergencyMode ? 'bg-destructive animate-pulse' : 'bg-success'}`} />
                          <span className={`font-medium ${isEmergencyMode ? 'text-destructive' : 'text-success'}`}>
                            {isEmergencyMode ? 'ALERT ACTIVE' : 'All Safe'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Camera Access - Only for caretakers */}
              {profile.role === 'caretaker' && (
                <div className="care-card-sm">
                  <button
                    onClick={() => toggleSection('camera')}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">Camera Access</span>
                    </div>
                    {expandedSection === 'camera' ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedSection === 'camera' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4">
                          <button className="btn-secondary w-full flex items-center justify-center gap-2">
                            <Camera className="w-4 h-4" />
                            Connect Camera
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
