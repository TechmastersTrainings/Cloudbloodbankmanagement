import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import PortalLayout from './components/PortalLayout';
import AppRouter from './routes/AppRouter';
import './App.css';

const PORTAL_PREFIXES = ['/admin', '/hospital', '/donor', '/receiver'];

function App() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('current_user');
      if (stored && stored !== 'undefined' && stored !== 'null') {
        const parsed = JSON.parse(stored);
        if (parsed?.email && parsed?.role) setUser(parsed);
        else throw new Error('Invalid user structure');
      }
    } catch (err) {
      console.error('Invalid user in localStorage:', err);
      localStorage.removeItem('current_user');
      setUser(null);
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    setUser(null);
  }, []);

  const isPortal = PORTAL_PREFIXES.some((p) => location.pathname.startsWith(p));

  if (isPortal && user) {
    return (
      <PortalLayout user={user} onLogout={handleLogout}>
        <AppRouter user={user} onLogin={setUser} />
      </PortalLayout>
    );
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="app-main public-main">
        <AppRouter user={user} onLogin={setUser} />
      </main>
      <Footer />
    </div>
  );
}

export default App;
