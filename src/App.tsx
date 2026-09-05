import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import { AuthProvider, NotificationProvider, ErrorBoundary } from '@/app/providers';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
