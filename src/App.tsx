import { useEffect } from 'react';
import { systemService } from './services/systemService';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppRoutes } from './routes/RouteConfig';

export default function App() {
  useEffect(() => {
    systemService.checkConnection();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
