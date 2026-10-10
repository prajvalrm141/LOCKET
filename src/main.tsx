import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '@/routes/__root';

declare global {
  interface Window {
    __ROUTER__: typeof router;
  }
  interface ImportMetaEnv {
    readonly DEV: boolean;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

if (import.meta.env.DEV) {
  window.__ROUTER__ = router;
}

function App() {
  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);