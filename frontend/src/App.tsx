import { useEffect, useState } from 'react';
import AuthScreen from './components/AuthScreen';
import StudyApp from './components/StudyApp';
import { api, getToken, setToken } from './lib/api';
import type { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(Boolean(getToken()));
  useEffect(() => {
    if (!getToken()) return;
    api.me().then(({ user }) => { setUser(user); setAuthenticated(true); })
      .catch(() => setToken(null))
      .finally(() => setCheckingSession(false));
  }, []);
  function logout() { setToken(null); setUser(null); setAuthenticated(false); }
  if (checkingSession) return <div className="session-loading">Preparando seu espaço de estudos...</div>;
  if (!authenticated) return <AuthScreen onAuthenticated={(nextUser)=>{setUser(nextUser);setAuthenticated(true);}}/>;
  // JWT is intentionally not decoded client-side for authorization. The UI requests protected resources from the API.
  if (!user) return <AuthScreen onAuthenticated={nextUser=>{setUser(nextUser);setAuthenticated(true);}}/>;
  return <StudyApp user={user} onLogout={logout}/>;
}
