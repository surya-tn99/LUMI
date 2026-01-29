import { useUser } from '@/context/UserContext';
import { UserProvider } from '@/context/UserProvider';
import { AppProvider } from '@/context/AppContext';
import AuthWizard from '@/components/auth/AuthWizard';
import Dashboard from '@/components/dashboard/Dashboard';

function AppContent() {
  const { isAuthenticated } = useUser();

  return isAuthenticated ? <Dashboard /> : <AuthWizard />;
}

const Index = () => {
  return (
    <UserProvider>
      <AppProvider>
        <div className="min-h-screen bg-background hide-scrollbar">
          <AppContent />
        </div>
      </AppProvider>
    </UserProvider>
  );
};

export default Index;
