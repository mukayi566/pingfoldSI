// ============================================================
// PingFold AI – Zambian Banking Platform Connectors
// Default connected banking platform: Absa Bank Zambia
// Other available commercial & enterprise banks in Zambia
// ============================================================

import type { BankConnector } from '../types';

export const INITIAL_CONNECTORS: BankConnector[] = [
  {
    id: 'absa-zm',
    bankCode: 'ABZA',
    bankName: 'Absa Bank Zambia PLC',
    shortName: 'Absa Bank Zambia',
    brandColor: '#B6004C', // Absa signature crimson
    brandTextColor: '#FFFFFF',
    status: 'connected',
    isDefault: true,
    connectionType: 'Absa Access Direct Host API (OAuth 2.0 / MT940 Feed)',
    lastSyncTime: 'Just now (1 min ago)',
    latencyMs: 38,
    accountCount: 2,
    description: 'Zambia commercial banking connector with real-time balance telemetry, automated MT940 statement sync, and direct T+0 clearing via Bank of Zambia payment rails.',
    supportedProtocols: ['Open Banking REST API', 'ISO 20022 XML', 'Real-Time Webhooks', 'ZECHL Direct'],
    features: {
      instantPay: true,
      statementSync: true,
      shieldMonitoring: true,
      realtimeBalance: true,
    },
    authPortalName: 'Absa Access Corporate & Business Banking',
    accounts: [
      {
        id: 'acc-absa-01',
        accountNumber: '0001-8849-2041',
        accountName: 'Primary Commercial Cheque',
        accountType: 'cheque',
        currency: 'ZMW',
        balance: 148500.0,
        availableBalance: 148500.0,
        isDefaultPaymentSource: true,
      },
      {
        id: 'acc-absa-02',
        accountNumber: '0001-2294-8110',
        accountName: 'Business Reserve High-Yield',
        accountType: 'savings',
        currency: 'ZMW',
        balance: 385200.0,
        availableBalance: 385200.0,
        isDefaultPaymentSource: false,
      },
    ],
  },
  {
    id: 'zanaco-zm',
    bankCode: 'ZNBZ',
    bankName: 'Zambia National Commercial Bank (Zanaco)',
    shortName: 'Zanaco',
    brandColor: '#D92318', // Zanaco Red
    brandTextColor: '#FFFFFF',
    status: 'available',
    isDefault: false,
    connectionType: 'Zanaco Xapit Corporate Open API',
    lastSyncTime: undefined,
    latencyMs: 44,
    accountCount: 0,
    description: 'Zambia\'s largest domestic commercial bank with extensive retail and corporate footprint. Instant T+0 transfer settlement and automated payroll feeds.',
    supportedProtocols: ['Zanaco Direct API', 'Xapit Gateway', 'ZECHL RTGS'],
    features: {
      instantPay: true,
      statementSync: true,
      shieldMonitoring: true,
      realtimeBalance: true,
    },
    authPortalName: 'Zanaco Business Internet Banking (BIB)',
    accounts: [],
  },
  {
    id: 'stanbic-zm',
    bankCode: 'SBIC',
    bankName: 'Stanbic Bank Zambia PLC',
    shortName: 'Stanbic Bank',
    brandColor: '#0033A0', // Stanbic Cobalt Blue
    brandTextColor: '#FFFFFF',
    status: 'available',
    isDefault: false,
    connectionType: 'Standard Bank Group Enterprise Host-to-Host',
    lastSyncTime: undefined,
    latencyMs: 32,
    accountCount: 0,
    description: 'Premier tier-1 corporate bank in Zambia. Enables high-volume treasury settlements, multi-currency accounts, and automated CAMT.053 reconciliation.',
    supportedProtocols: ['Host-to-Host SFTP', 'Open Banking REST', 'Real-Time Fraud API'],
    features: {
      instantPay: true,
      statementSync: true,
      shieldMonitoring: true,
      realtimeBalance: true,
    },
    authPortalName: 'Stanbic Enterprise Online (EOL)',
    accounts: [],
  },
  {
    id: 'fnb-zm',
    bankCode: 'FIRZ',
    bankName: 'First National Bank Zambia (FNB)',
    shortName: 'FNB Zambia',
    brandColor: '#00838F', // FNB Turquoise
    brandTextColor: '#FFFFFF',
    status: 'available',
    isDefault: false,
    connectionType: 'FNB Online Banking Enterprise (OBE) & InContact Webhook',
    lastSyncTime: undefined,
    latencyMs: 29,
    accountCount: 0,
    description: 'Digital-first enterprise banking connector. Supports real-time InContact balance notifications, eWallet merchant distribution, and automated batch file processing.',
    supportedProtocols: ['OBE Connect API', 'InContact Push Telemetry', 'ISO 20022'],
    features: {
      instantPay: true,
      statementSync: true,
      shieldMonitoring: true,
      realtimeBalance: true,
    },
    authPortalName: 'FNB Online Banking Enterprise',
    accounts: [],
  },
  {
    id: 'stanchart-zm',
    bankCode: 'STBZ',
    bankName: 'Standard Chartered Bank Zambia',
    shortName: 'Standard Chartered',
    brandColor: '#0076CE', // Standard Chartered Blue
    brandTextColor: '#FFFFFF',
    status: 'available',
    isDefault: false,
    connectionType: 'Straight2Bank Open Banking Gateway',
    lastSyncTime: undefined,
    latencyMs: 51,
    accountCount: 0,
    description: 'Straight2Bank next-generation open banking API for global transaction banking, corporate treasury, and cross-border settlement in Zambia.',
    supportedProtocols: ['Straight2Bank REST', 'OAuth 2.0 PKCE', 'SWIFT Alliance Gateway'],
    features: {
      instantPay: true,
      statementSync: true,
      shieldMonitoring: true,
      realtimeBalance: true,
    },
    authPortalName: 'Straight2Bank Corporate Web',
    accounts: [],
  },
  {
    id: 'access-zm',
    bankCode: 'ATMA',
    bankName: 'Access Bank Zambia (formerly Atlas Mara)',
    shortName: 'Access Bank Zambia',
    brandColor: '#E65100', // Access Bank Warm Amber/Orange
    brandTextColor: '#FFFFFF',
    status: 'available',
    isDefault: false,
    connectionType: 'AccessOnline Corporate Connect',
    lastSyncTime: undefined,
    latencyMs: 48,
    accountCount: 0,
    description: 'Corporate and SME banking rails following the merger of Access Bank and Atlas Mara Zambia. Unified business banking and merchant clearing.',
    supportedProtocols: ['AccessOnline Gateway', 'ZECHL Clearing', 'REST API'],
    features: {
      instantPay: true,
      statementSync: true,
      shieldMonitoring: false,
      realtimeBalance: true,
    },
    authPortalName: 'AccessOnline Zambia',
    accounts: [],
  },
  {
    id: 'indozambia-zm',
    bankCode: 'INZB',
    bankName: 'Indo-Zambia Bank',
    shortName: 'Indo-Zambia Bank',
    brandColor: '#0D47A1', // Indo-Zambia Navy
    brandTextColor: '#FFFFFF',
    status: 'available',
    isDefault: false,
    connectionType: 'IZB Corporate Net Banking Feed',
    lastSyncTime: undefined,
    latencyMs: 65,
    accountCount: 0,
    description: 'Joint venture between Indian commercial banks and the Government of Zambia. Strong focus on trade finance, agriculture, and SME commercial accounts.',
    supportedProtocols: ['Corporate NetBanking', 'MT940 Statement Batch'],
    features: {
      instantPay: true,
      statementSync: true,
      shieldMonitoring: false,
      realtimeBalance: true,
    },
    authPortalName: 'IZB Corporate Portal',
    accounts: [],
  },
  {
    id: 'ecobank-zm',
    bankCode: 'ECOZ',
    bankName: 'Ecobank Zambia',
    shortName: 'Ecobank Zambia',
    brandColor: '#005B94', // Ecobank Slate Blue
    brandTextColor: '#FFFFFF',
    status: 'available',
    isDefault: false,
    connectionType: 'Ecobank Omni Plus Gateway',
    lastSyncTime: undefined,
    latencyMs: 55,
    accountCount: 0,
    description: 'Pan-African corporate banking platform offering unified payment initiation and real-time treasury management across COMESA and SADC corridors.',
    supportedProtocols: ['Omni Plus API', 'ISO 20022 XML', 'Direct Clearing'],
    features: {
      instantPay: true,
      statementSync: true,
      shieldMonitoring: true,
      realtimeBalance: true,
    },
    authPortalName: 'Ecobank Omni Plus Online',
    accounts: [],
  },
];

// Helper to calculate total liquidity across all connected connectors
export function calculateConnectedLiquidity(connectors?: BankConnector[]): number {
  if (!connectors || !Array.isArray(connectors)) return 0;
  return connectors
    .filter((c) => c && c.status === 'connected')
    .reduce((sum, connector) => {
      const connTotal = (connector.accounts || []).reduce((accSum, acc) => accSum + (acc?.balance || 0), 0);
      return sum + connTotal;
    }, 0);
}
