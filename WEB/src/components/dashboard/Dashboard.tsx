import React from 'react';
import { useUser } from '@/context/UserContext';
import { useApp } from '@/context/AppContext';
import Header from './Header';
import MicInterface from './MicInterface';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import EmergencyAlert from './EmergencyAlert';
import ProfileModal from './ProfileModal';
import MedicationModal from './MedicationModal';
import EmergencySettingsModal from './EmergencySettingsModal';
import VitalsModal from './VitalsModal';
import VitalsBackgroundSync from './VitalsBackgroundSync';
import CaretakerEmergencyMonitor from './CaretakerEmergencyMonitor';

export default function Dashboard() {
  const { isEmergencyMode } = useApp();
  const { profile } = useUser();
  const isCaretaker = profile.role === 'caretaker';
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [showMedicationModal, setShowMedicationModal] = React.useState(false);
  const [showEmergencySettings, setShowEmergencySettings] = React.useState(false);
  const [showVitalsModal, setShowVitalsModal] = React.useState(false);

  React.useEffect(() => {
    const handleOpenVitals = () => setShowVitalsModal(true);
    window.addEventListener('openVitalsModal', handleOpenVitals);
    return () => window.removeEventListener('openVitalsModal', handleOpenVitals);
  }, []);

  return (
    <div className={`min-h-screen bg-background flex flex-col relative overflow-hidden ${isEmergencyMode ? 'emergency-mode' : ''}`}>
      <Header
        onProfileClick={() => setShowProfileModal(true)}
        onSettingsClick={() => setShowMedicationModal(true)}
      />
      <VitalsBackgroundSync />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <MicInterface />
      </main>

      {/* Patient Only: Sidebars and Alerts */}
      {!isCaretaker && (
        <>
          <LeftSidebar />
          <RightSidebar
            onMedicationSettings={() => setShowMedicationModal(true)}
            onEmergencySettings={() => setShowEmergencySettings(true)}
          />
          {/* Modals */}
          <ProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} />
          <MedicationModal open={showMedicationModal} onClose={() => setShowMedicationModal(false)} />
          <EmergencySettingsModal open={showEmergencySettings} onClose={() => setShowEmergencySettings(false)} />
          <VitalsModal open={showVitalsModal} onClose={() => setShowVitalsModal(false)} />

          {/* Emergency Alert */}
          <EmergencyAlert />
        </>
      )}

      {/* Caretaker Only: Profile Modal and Emergency Monitor */}
      {isCaretaker && (
        <>
          <ProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} />
          <CaretakerEmergencyMonitor />
        </>
      )}
    </div>
  );
}
