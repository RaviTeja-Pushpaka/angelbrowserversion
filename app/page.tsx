import LandingPage from '@/components/LandingPage';
import { AuthProvider } from '@/contexts/AuthContext';

export default function Page() {
  return (
    <AuthProvider>
      <LandingPage />
    </AuthProvider>
  );
}
