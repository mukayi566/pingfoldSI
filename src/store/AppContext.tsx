// ============================================================
// PingFold AI – Global App Store (React Context)
// ============================================================

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type {
  AppModule,
  ChatMessage,
  AuditEvent,
  AuditEventType,
  AppSettings,
  ShieldAnalysisResult,
  ReconciliationResult,
  SimulatedTransaction,
  PaymentFormData,
  PaymentValidationResult,
  BankConnector,
  BankAccount,
} from '../types';
import { DEFAULT_SETTINGS, generateId } from '../data/demoData';
import { INITIAL_CONNECTORS } from '../data/connectorsData';
import { INITIAL_CHAT_LOGS } from '../data/adminMessagesData';

// ─── State ────────────────────────────────────────────────────
export interface AppState {
  activeModule: AppModule;
  sidebarOpen: boolean;
  messages: ChatMessage[];
  chatLogs: ChatMessage[];
  auditLog: AuditEvent[];
  settings: AppSettings;
  // Connectors
  connectors: BankConnector[];
  defaultConnectorId: string;
  syncingConnectorId: string | null;
  // Shield
  shieldResult: ShieldAnalysisResult | null;
  shieldLoading: boolean;
  // Pay
  paymentForm: PaymentFormData;
  paymentValidation: PaymentValidationResult | null;
  paymentLoading: boolean;
  pendingTransaction: SimulatedTransaction | null;
  // Business
  reconciliationResult: ReconciliationResult | null;
  businessLoading: boolean;
  // UI
  detailPanelOpen: boolean;
  detailPanelContent: string | null;
}

const INITIAL_PAYMENT_FORM: PaymentFormData = {
  recipientName: '',
  recipientIdentifier: '',
  amount: '',
  currency: 'ZMW',
  reference: '',
  note: '',
};

const initialState: AppState = {
  activeModule: 'home',
  sidebarOpen: false,
  messages: [],
  chatLogs: INITIAL_CHAT_LOGS,
  auditLog: [],
  settings: DEFAULT_SETTINGS,
  connectors: INITIAL_CONNECTORS,
  defaultConnectorId: 'absa-zm',
  syncingConnectorId: null,
  shieldResult: null,
  shieldLoading: false,
  paymentForm: INITIAL_PAYMENT_FORM,
  paymentValidation: null,
  paymentLoading: false,
  pendingTransaction: null,
  reconciliationResult: null,
  businessLoading: false,
  detailPanelOpen: false,
  detailPanelContent: null,
};

// ─── Actions ──────────────────────────────────────────────────
type Action =
  | { type: 'SET_MODULE'; module: AppModule }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; open: boolean }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'CLEAR_CHAT_LOGS' }
  | { type: 'SEED_CHAT_LOGS'; logs: ChatMessage[] }
  | { type: 'CONNECT_BANK'; bankId: string; accounts: BankAccount[] }
  | { type: 'DISCONNECT_BANK'; bankId: string }
  | { type: 'SET_DEFAULT_CONNECTOR'; bankId: string }
  | { type: 'START_SYNC_CONNECTOR'; bankId: string }
  | { type: 'FINISH_SYNC_CONNECTOR'; bankId: string; lastSyncTime: string }
  | { type: 'ADD_BANK_ACCOUNT'; bankId: string; account: BankAccount }
  | { type: 'SET_SHIELD_LOADING'; loading: boolean }
  | { type: 'SET_SHIELD_RESULT'; result: ShieldAnalysisResult | null }
  | { type: 'SET_PAYMENT_FORM'; form: Partial<PaymentFormData> }
  | { type: 'SET_PAYMENT_VALIDATION'; result: PaymentValidationResult | null }
  | { type: 'SET_PAYMENT_LOADING'; loading: boolean }
  | { type: 'SET_PENDING_TRANSACTION'; tx: SimulatedTransaction | null }
  | { type: 'SET_RECONCILIATION'; result: ReconciliationResult | null }
  | { type: 'SET_BUSINESS_LOADING'; loading: boolean }
  | { type: 'ADD_AUDIT_EVENT'; event: AuditEvent }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<AppSettings> }
  | { type: 'SET_DETAIL_PANEL'; open: boolean; content?: string | null }
  | { type: 'RESET_DEMO' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_MODULE':
      return { ...state, activeModule: action.module };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.open };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.message],
        chatLogs: [...(state.chatLogs || INITIAL_CHAT_LOGS), action.message],
      };
    case 'CLEAR_CHAT_LOGS':
      return { ...state, chatLogs: [] };
    case 'SEED_CHAT_LOGS':
      return { ...state, chatLogs: action.logs };
    case 'CONNECT_BANK': {
      const updated = state.connectors.map((c) => {
        if (c.id === action.bankId) {
          return {
            ...c,
            status: 'connected' as const,
            accounts: action.accounts.length > 0 ? action.accounts : [
              {
                id: `acc-${action.bankId}-01`,
                accountNumber: `000${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
                accountName: `${c.shortName} Commercial Cheque`,
                accountType: 'cheque' as const,
                currency: 'ZMW' as const,
                balance: 75000.0,
                availableBalance: 75000.0,
                isDefaultPaymentSource: false,
              },
            ],
            accountCount: action.accounts.length > 0 ? action.accounts.length : 1,
            lastSyncTime: 'Just now',
          };
        }
        return c;
      });
      return { ...state, connectors: updated };
    }
    case 'DISCONNECT_BANK': {
      const isDefault = state.defaultConnectorId === action.bankId;
      const updated = state.connectors.map((c) => {
        if (c.id === action.bankId) {
          return {
            ...c,
            status: 'available' as const,
            isDefault: false,
            accounts: [],
            accountCount: 0,
            lastSyncTime: undefined,
          };
        }
        // If we disconnected default, restore Absa as default
        if (isDefault && c.id === 'absa-zm') {
          return { ...c, isDefault: true };
        }
        return c;
      });
      return {
        ...state,
        connectors: updated,
        defaultConnectorId: isDefault ? 'absa-zm' : state.defaultConnectorId,
      };
    }
    case 'SET_DEFAULT_CONNECTOR': {
      const updated = state.connectors.map((c) => ({
        ...c,
        isDefault: c.id === action.bankId,
      }));
      return { ...state, connectors: updated, defaultConnectorId: action.bankId };
    }
    case 'START_SYNC_CONNECTOR':
      return { ...state, syncingConnectorId: action.bankId };
    case 'FINISH_SYNC_CONNECTOR': {
      const updated = state.connectors.map((c) =>
        c.id === action.bankId
          ? { ...c, lastSyncTime: action.lastSyncTime }
          : c
      );
      return { ...state, connectors: updated, syncingConnectorId: null };
    }
    case 'ADD_BANK_ACCOUNT': {
      const updated = state.connectors.map((c) => {
        if (c.id === action.bankId) {
          return {
            ...c,
            accounts: [...c.accounts, action.account],
            accountCount: (c.accountCount || 0) + 1,
          };
        }
        return c;
      });
      return { ...state, connectors: updated };
    }
    case 'SET_SHIELD_LOADING':
      return { ...state, shieldLoading: action.loading };
    case 'SET_SHIELD_RESULT':
      return { ...state, shieldResult: action.result };
    case 'SET_PAYMENT_FORM':
      return { ...state, paymentForm: { ...state.paymentForm, ...action.form } };
    case 'SET_PAYMENT_VALIDATION':
      return { ...state, paymentValidation: action.result };
    case 'SET_PAYMENT_LOADING':
      return { ...state, paymentLoading: action.loading };
    case 'SET_PENDING_TRANSACTION':
      return { ...state, pendingTransaction: action.tx };
    case 'SET_RECONCILIATION':
      return { ...state, reconciliationResult: action.result };
    case 'SET_BUSINESS_LOADING':
      return { ...state, businessLoading: action.loading };
    case 'ADD_AUDIT_EVENT':
      return { ...state, auditLog: [action.event, ...state.auditLog] };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'SET_DETAIL_PANEL':
      return { ...state, detailPanelOpen: action.open, detailPanelContent: action.content ?? null };
    case 'RESET_DEMO':
      return {
        ...initialState,
        auditLog: [
          ...state.auditLog,
          createAuditEvent('demo_reset', 'success', 'Demo data has been reset to initial state.'),
        ],
      };
    default:
      return state;
  }
}

function createAuditEvent(
  type: AuditEventType,
  outcome: AuditEvent['outcome'],
  summary: string,
  details?: Record<string, unknown>,
  demoRef?: string
): AuditEvent {
  return {
    id: generateId(),
    eventId: `EVT-${Date.now()}`,
    type,
    timestamp: new Date(),
    outcome,
    summary,
    details,
    demoRef,
  };
}

// ─── Context ──────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addMessage: (role: ChatMessage['role'], content: string, metadata?: ChatMessage['metadata']) => void;
  addAuditEvent: (
    type: AuditEventType,
    outcome: AuditEvent['outcome'],
    summary: string,
    details?: Record<string, unknown>,
    demoRef?: string
  ) => void;
  navigateTo: (module: AppModule) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addMessage = useCallback(
    (role: ChatMessage['role'], content: string, metadata?: ChatMessage['metadata']) => {
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: generateId(),
          role,
          content,
          timestamp: new Date(),
          metadata,
        },
      });
    },
    []
  );

  const addAuditEvent = useCallback(
    (
      type: AuditEventType,
      outcome: AuditEvent['outcome'],
      summary: string,
      details?: Record<string, unknown>,
      demoRef?: string
    ) => {
      dispatch({
        type: 'ADD_AUDIT_EVENT',
        event: createAuditEvent(type, outcome, summary, details, demoRef),
      });
    },
    []
  );

  const navigateTo = useCallback((module: AppModule) => {
    dispatch({ type: 'SET_MODULE', module });
    dispatch({ type: 'SET_SIDEBAR', open: false });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, addMessage, addAuditEvent, navigateTo }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
