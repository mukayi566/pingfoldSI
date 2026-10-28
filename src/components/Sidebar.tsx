// ============================================================
// Sidebar – Persistent fixed panel with collapse toggle (Localized)
// ============================================================
import {
  Home, Send, Shield, BarChart3, Landmark,
  Clock, Settings, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Logo } from './Logo';
import { useApp } from '../store/AppContext';
import { useTranslation } from '../i18n/LanguageContext';
import type { AppModule } from '../types';

export function Sidebar() {
  const { state, dispatch, navigateTo } = useApp();
  const { t } = useTranslation();
  // Re-use sidebarOpen as "collapsed" — true = collapsed rail, false = full
  const collapsed = state.sidebarOpen;
  const { activeModule } = state;

  const toggle = () => dispatch({ type: 'TOGGLE_SIDEBAR' });

  const navSections = [
    {
      key: 'workspace',
      title: t.nav.workspace,
      items: [
        { id: 'home' as AppModule, label: t.nav.home, icon: <Home /> },
      ],
    },
    {
      key: 'capabilities',
      title: t.nav.capabilities,
      items: [
        { id: 'pay' as AppModule, label: t.nav.pay, icon: <Send /> },
        { id: 'shield' as AppModule, label: t.nav.shield, icon: <Shield /> },
        { id: 'business' as AppModule, label: t.nav.business, icon: <BarChart3 /> },
        { id: 'connectors' as AppModule, label: t.nav.connectors, icon: <Landmark /> },
      ],
    },
    {
      key: 'account',
      title: t.nav.account,
      items: [
        { id: 'activity' as AppModule, label: t.nav.activity, icon: <Clock /> },
        { id: 'settings' as AppModule, label: t.nav.settings, icon: <Settings /> },
      ],
    },
  ];

  return (
    <nav
      className={`sidebar-fixed ${collapsed ? 'collapsed' : ''}`}
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="sidebar-fixed-header">
        {!collapsed && <Logo />}
        <button
          className="btn-icon sidebar-collapse-btn"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.key} className="nav-section">
            {!collapsed && <div className="nav-section-label">{section.title}</div>}
            {section.items.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeModule === item.id ? 'active' : ''}`}
                onClick={() => navigateTo(item.id)}
                aria-current={activeModule === item.id ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                id={`sidebar-nav-${item.id}`}
              >
                {item.icon}
                {!collapsed && item.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="avatar" style={{ flexShrink: 0 }}>MK</div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Mukayi Zhou
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--pf-text-secondary)' }}>
              {t.nav.demoAccount}
            </div>
          </div>
        )}
        <button className="btn-icon" title={`${t.nav.signOut} (demo)`} aria-label={t.nav.signOut}>
          <LogOut style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </nav>
  );
}
