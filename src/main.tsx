import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/context/ThemeContext';
import { SessionProvider } from '@/context/SessionContext';
import { OrganizationProvider } from '@/context/OrganizationProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AppRoutes } from '@/routes/AppRoutes';
import { registerServiceWorker } from '@/pwa/pwaRegister';
import { PwaInstallPrompt } from '@/components/common/PwaInstallPrompt';


import '@/styles/main.css';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 60 * 1000,
      // Background freshness: re-sync when the user comes back or reconnects,
      // and when a screen mounts with stale data. Fresh data (<30s) is still
      // served from cache, so page switches stay request-free.
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403 || error?.status === 404) return false;
        return failureCount < 1;
      },
    },
    mutations: { retry: false },
  },
});


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-right" richColors closeButton />
        <PwaInstallPrompt />
        <BrowserRouter>
          <ThemeProvider>
            <SessionProvider>
              <OrganizationProvider>
                <AppRoutes />
              </OrganizationProvider>
            </SessionProvider>
          </ThemeProvider>
        </BrowserRouter>


      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);



registerServiceWorker();
