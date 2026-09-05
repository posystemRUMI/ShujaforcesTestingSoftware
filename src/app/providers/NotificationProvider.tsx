import React from 'react';
import { Toaster } from 'sonner';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0E1B2A',
            color: '#FFFFFF',
            border: '1px solid #D4D9DF',
            borderRadius: '4px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
          },
          className: 'forces-toast',
        }}
      />
    </>
  );
};
