// ============================================================
// PingFold AI – Main Application Shell
// ============================================================
import { useEffect } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { LanguageProvider, useTranslation } from './i18n/LanguageContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { HomeScreen } from './pages/HomeScreen';
import { ShieldPage } from './pages/ShieldPage';
import { PayPage } from './pages/PayPage';
import { BusinessPage } from './pages/BusinessPage';
import { ConnectorsPage } from './pages/ConnectorsPage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import type { AppModule } from './types';
import './index.css';

function LanguageSync() {
  const { state, dispatch } = useApp();
  const { language, setLanguage } = useTranslation();

  // If settings.language changes from AppContext (e.g. SettingsPage), update LanguageContext
  useEffect(() => {
    if (state.settings.language && state.settings.language !== language) {
      setLanguage(state.settings.language);
    }
  }, [state.settings.language, language, setLanguage]);

  // If LanguageContext changes (e.g. TopBar), update AppContext
  useEffect(() => {
    if (language && language !== state.settings.language) {
      dispatch({ type: 'UPDATE_SETTINGS', settings: { language } });
    }
  }, [language, state.settings.language, dispatch]);

  return null;
}

function PageRouter() {
  const { state } = useApp();
  const module: AppModule = state.activeModule;

  return (
    <div className="page-content">
      {module === 'home'       && <HomeScreen />}
      {module === 'shield'     && <ShieldPage />}
      {module === 'pay'        && <PayPage />}
      {module === 'business'   && <BusinessPage />}
      {module === 'connectors' && <ConnectorsPage />}
      {module === 'activity'   && <ActivityPage />}
      {module === 'settings'   && <SettingsPage />}
      {module === 'admin'      && <AdminPage />}
    </div>
  );
}

function AppShell() {
  const { state, navigateTo } = useApp();
  const collapsed = state.sidebarOpen; // sidebarOpen now means collapsed

  // Secure sublink direct hash access (#admin)
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        if (state.activeModule !== 'admin') {
          navigateTo('admin');
        }
      } else if (state.activeModule === 'admin') {
        navigateTo('home');
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [navigateTo, state.activeModule]);

  // When admin module is active or URL hash is #admin:
  // Render as a completely separate standalone page (no main app sidebar, no user topbar)
  if (state.activeModule === 'admin' || (typeof window !== 'undefined' && window.location.hash === '#admin')) {
    return (
      <div className="admin-standalone-app">
        <LanguageSync />
        <AdminPage />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <LanguageSync />
      <Sidebar />
      <div className={`main-area${collapsed ? ' sidebar-collapsed' : ''}`}>
        <TopBar />
        <PageRouter />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <LanguageProvider>
        <AppShell />
      </LanguageProvider>
    </AppProvider>
  );
}
