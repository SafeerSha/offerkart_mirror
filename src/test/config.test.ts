import { describe, it, expect, vi, beforeEach } from 'vitest';
import { config } from '@/lib/config';

describe('config validation', () => {
  it('should have valid api config with defaults', () => {
    expect(config.api.upstreamBaseUrl).toBeDefined();
    expect(config.api.proxyPrefix).toBeDefined();
  });

  it('should have auth secret', () => {
    expect(typeof config.auth.secret).toBe('string');
    expect(config.auth.secret.length).toBeGreaterThan(0);
  });

  it('should have site url', () => {
    expect(config.site.url).toBeDefined();
  });

  it('should have external service configs', () => {
    expect('aiApiKey' in config.external).toBe(true);
    expect('hfToken' in config.external).toBe(true);
  });
});
