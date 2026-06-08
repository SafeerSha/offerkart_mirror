import { describe, it, expect, vi } from 'vitest';

// Mock server-only in test environments where React Server conditions are not present
vi.mock('server-only', () => ({}));

import { config as clientConfig } from '@/lib/config';
import { config as serverConfig } from '@/lib/config.server';

describe('config validation', () => {
  describe('client config', () => {
    it('should have valid api config with defaults', () => {
      expect(clientConfig.api.upstreamBaseUrl).toBeDefined();
      expect(clientConfig.api.proxyPrefix).toBeDefined();
    });

    it('should have site url', () => {
      expect(clientConfig.site.url).toBeDefined();
    });
  });

  describe('server config', () => {
    it('should have auth secret', () => {
      expect(typeof serverConfig.auth.secret).toBe('string');
      expect(serverConfig.auth.secret.length).toBeGreaterThan(0);
    });

    it('should have external service configs', () => {
      expect('aiApiKey' in serverConfig.external).toBe(true);
      expect('hfToken' in serverConfig.external).toBe(true);
    });
  });
});
