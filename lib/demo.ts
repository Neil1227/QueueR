import { Card } from './schema';

export const DEMO_USER_ID = 'demo-preview-user';
export const DEMO_STORAGE_KEY = 'queuer_demo_mode_active';

/**
 * Curated dummy Philippine payment cards for Demo Preview Mode.
 */
export const DEMO_CARDS: Card[] = [
  {
    id: 'demo-card-gcash',
    provider: 'GCash',
    color: '#007DFE',
    holder: 'Juan Dela Cruz',
    number: '0917 123 4567',
    label: 'Personal Pocket',
    category: 'personal',
    payload: '00020101021126510014ph.ppmi.p2pqr0111GCASHXXXXXX02159999999999999995204601653036085802PH5914JUAN DELA CRUZ6006MANILA6304A1B2',
    isDefault: true,
    useCount: 14,
    lastUsedAt: Date.now() - 3600000 * 2,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 3600000 * 2,
    v: 1,
  },
  {
    id: 'demo-card-maya',
    provider: 'Maya',
    color: '#00D665',
    holder: 'Juan Dela Cruz',
    number: '0918 987 6543',
    label: 'Online Store / Shop',
    category: 'business',
    payload: '00020101021126510014ph.ppmi.p2pqr0110MAYAXXXXXX02159999999999999995204601653036085802PH5914JUAN DELA CRUZ6006MANILA6304B2C3',
    isDefault: false,
    useCount: 8,
    lastUsedAt: Date.now() - 3600000 * 8,
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 3600000 * 8,
    v: 1,
  },
  {
    id: 'demo-card-bpi',
    provider: 'BPI',
    color: '#B11116',
    holder: 'Juan Dela Cruz',
    number: '1234 5678 90',
    label: 'Savings Vault',
    category: 'savings',
    payload: '00020101021126510014ph.ppmi.p2pqr0111BOPIPHM2XXX02159999999999999995204601653036085802PH5914JUAN DELA CRUZ6006MANILA6304C3D4',
    isDefault: false,
    useCount: 5,
    lastUsedAt: Date.now() - 86400000 * 1,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 1,
    v: 1,
  },
  {
    id: 'demo-card-seabank',
    provider: 'SeaBank',
    color: '#FF5722',
    holder: 'Juan Dela Cruz',
    number: '1098 7654 3210',
    label: 'Freelance Payouts',
    category: 'freelance',
    payload: '00020101021126510014ph.ppmi.p2pqr0111SEABPHM2XXX02159999999999999995204601653036085802PH5914JUAN DELA CRUZ6006MANILA6304D4E5',
    isDefault: false,
    useCount: 3,
    lastUsedAt: Date.now() - 86400000 * 3,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 3,
    v: 1,
  },
  {
    id: 'demo-card-gotyme',
    provider: 'GoTyme',
    color: '#00C6D7',
    holder: 'Juan Dela Cruz',
    number: '0917 555 1234',
    label: 'Travel & Dining',
    category: 'other',
    payload: '00020101021126510014ph.ppmi.p2pqr0111GOTYPHM2XXX02159999999999999995204601653036085802PH5914JUAN DELA CRUZ6006MANILA6304E5F6',
    isDefault: false,
    useCount: 2,
    lastUsedAt: Date.now() - 86400000 * 4,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 4,
    v: 1,
  },
];

/**
 * Checks if current browser session is in Demo Mode.
 */
export function isDemoActive(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(DEMO_STORAGE_KEY) === 'true';
}

/**
 * Enables or disables Demo Mode in session storage.
 */
export function setDemoActive(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  if (enabled) {
    sessionStorage.setItem(DEMO_STORAGE_KEY, 'true');
  } else {
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
  }
}
