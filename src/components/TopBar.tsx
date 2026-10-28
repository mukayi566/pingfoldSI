// ============================================================
// TopBar Component with Multi-Language Switcher
// ============================================================
import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, Globe, Check, ChevronDown } from 'lucide-react';
import { Logo } from './Logo';
import { useApp } from '../store/AppContext';
import { useTranslation } from '../i18n/LanguageContext';
import type { AnalysisLanguage } from '../types';

export function TopBar() {
  const { state, dispatch, navigateTo } = useApp();
  const { language, setLanguage, t, languages, currentMeta } = useTranslation();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    if (langMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [langMenuOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && langMenuOpen) {
        setLangMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [langMenuOpen]);

  const activeModuleTitle =
    t.topbar.moduleTitles[state.activeModule as keyof typeof t.topbar.moduleTitles] ||
    (state.activeModule === 'home' ? '' : 'PingFold');

  return (
    <header className="topbar" role="banner">
      <div className="topbar-left">
        {state.activeModule === 'home' ? (
          <Logo size="sm" />
        ) : (
          <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--pf-navy)' }}>
            {activeModuleTitle}
          </span>
        )}
      </div>

      <div className="topbar-right">
        {/* Language Selector Dropdown */}
        <div className="topbar-lang-dropdown-wrap" ref={langMenuRef}>
          <button
            className={`topbar-lang-btn ${langMenuOpen ? 'active' : ''}`}
            onClick={() => setLangMenuOpen((prev) => !prev)}
            aria-label={`${t.topbar.selectLanguage}: ${currentMeta.nativeName}`}
            aria-haspopup="listbox"
            aria-expanded={langMenuOpen}
            title={t.topbar.selectLanguage}
            id="topbar-language-selector"
          >
            <Globe style={{ width: 15, height: 15, color: 'var(--pf-blue)' }} />
            <span className="topbar-lang-badge">{currentMeta.flag}</span>
            <span className="topbar-lang-name">{currentMeta.nativeName}</span>
            <ChevronDown
              style={{
                width: 13,
                height: 13,
                opacity: 0.7,
                transition: 'transform 0.2s ease',
                transform: langMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {langMenuOpen && (
            <div className="topbar-lang-menu" role="listbox" aria-label={t.topbar.selectLanguage}>
              <div className="topbar-lang-menu-header">
                <span>{t.topbar.selectLanguage}</span>
                <span className="topbar-lang-menu-sub">Zambian Languages</span>
              </div>
              <div className="topbar-lang-menu-list">
                {languages.map((lang) => {
                  const isSelected = lang.code === language;
                  return (
                    <button
                      key={lang.code}
                      className={`topbar-lang-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setLanguage(lang.code as AnalysisLanguage);
                        dispatch({
                          type: 'UPDATE_SETTINGS',
                          settings: { language: lang.code as AnalysisLanguage },
                        });
                        setLangMenuOpen(false);
                      }}
                      role="option"
                      aria-selected={isSelected}
                      id={`lang-opt-${lang.code}`}
                    >
                      <span className="topbar-lang-item-flag">{lang.flag}</span>
                      <div className="topbar-lang-item-text">
                        <div className="topbar-lang-item-title">
                          {lang.nativeName}
                          {lang.code !== 'en' && (
                            <span className="topbar-lang-item-en"> ({lang.name})</span>
                          )}
                        </div>
                        <div className="topbar-lang-item-desc">{lang.region}</div>
                      </div>
                      {isSelected && (
                        <Check style={{ width: 16, height: 16, color: 'var(--pf-blue)', flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-icon"
            aria-label={t.topbar.notifications}
            title={`${t.topbar.notifications} (demo)`}
          >
            <Bell />
            {state.auditLog.length > 0 && <span className="notif-dot" />}
          </button>
        </div>

        {/* Settings button */}
        <button
          className="btn-icon"
          onClick={() => navigateTo('settings')}
          aria-label={t.topbar.settings}
          title={t.topbar.settings}
        >
          <Settings />
        </button>

        {/* User avatar menu toggle */}
        <button
          className="avatar"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          aria-label={t.topbar.userMenu}
          style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit', fontSize: '0.8125rem' }}
        >
          MK
        </button>
      </div>
    </header>
  );
}
