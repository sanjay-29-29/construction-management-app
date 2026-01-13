import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router';

import { BackButtonHandler } from '@/components/BackButtonHandler';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PushNotificationsInit } from '@/components/PushNotificationListener';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/Auth';
import {
  HomePage,
  LoginPage,
  NotFoundPage,
  OrderApp,
  SiteApp,
  UserApp,
  VendorApp,
} from '@/pages';

function App() {
  const queryClient = new QueryClient();

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <PushNotificationsInit />
            <BackButtonHandler />
            <Routes>
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/sites/*" element={<SiteApp />} />
                <Route path="/vendors/*" element={<VendorApp />} />
                <Route path="/users/*" element={<UserApp />} />
                <Route path="/orders/*" element={<OrderApp />} />
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
      <Toaster position="top-right" richColors className="mt-10" />
    </>
  );
}

export default App;
