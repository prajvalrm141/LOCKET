import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/auth';
import type { User, Session } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const sessionData = await auth.api.getSession({ headers: new Headers() });
    setSession(sessionData);
    setUser(sessionData?.user || null);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}