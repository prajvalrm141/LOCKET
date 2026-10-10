import '@tanstack/react-router';

declare module '@tanstack/react-router' {
  interface Register {
    router: any;
  }
  
  function useLoaderData<T = any>(): T;
}