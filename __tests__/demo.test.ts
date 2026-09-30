import { describe, it, expect, beforeEach } from 'vitest';
import { DEMO_CARDS, DEMO_USER_ID, isDemoActive, setDemoActive, DEMO_STORAGE_KEY } from '../lib/demo';
import { CardSchema } from '../lib/schema';

describe('Demo Preview Mode Engine', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('contains curated valid dummy Philippine cards matching CardSchema', () => {
    expect(DEMO_CARDS.length).toBeGreaterThanOrEqual(4);

    const providers = DEMO_CARDS.map((c) => c.provider);
    expect(providers).toContain('GCash');
    expect(providers).toContain('Maya');
    expect(providers).toContain('BPI');

    // All demo cards should pass Zod validation
    DEMO_CARDS.forEach((card) => {
      const result = CardSchema.safeParse(card);
      expect(result.success).toBe(true);
      expect(card.payload).toBeTruthy();
      expect(card.holder).toBeTruthy();
      expect(card.number).toBeTruthy();
    });
  });

  it('tracks demo mode state in session storage correctly', () => {
    expect(isDemoActive()).toBe(false);

    setDemoActive(true);
    expect(isDemoActive()).toBe(true);
    expect(sessionStorage.getItem(DEMO_STORAGE_KEY)).toBe('true');

    setDemoActive(false);
    expect(isDemoActive()).toBe(false);
    expect(sessionStorage.getItem(DEMO_STORAGE_KEY)).toBeNull();
  });

  it('provides the correct demo user ID constant', () => {
    expect(DEMO_USER_ID).toBe('demo-preview-user');
  });
});
