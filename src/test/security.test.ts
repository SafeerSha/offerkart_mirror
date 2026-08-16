import { describe, it, expect } from 'vitest';
import { sanitizeInput, sanitizePayload, hasSuspiciousPattern, sanitizeErrorMessage } from '@/lib/security';

describe('sanitizeInput', () => {
  it('should strip HTML tags and escape remaining entities', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('alert(1)');
  });

  it('should escape quotes and ampersands', () => {
    expect(sanitizeInput(`It's a "test" & more`)).toBe(`It&#039;s a &quot;test&quot; &amp; more`);
  });

  it('should strip tags', () => {
    expect(sanitizeInput('<b>bold</b>')).toBe('bold');
  });

  it('should handle mixed content', () => {
    expect(sanitizeInput('<p>Hello & "world"</p>')).toBe('Hello &amp; &quot;world&quot;');
  });

  it('should return non-strings unchanged', () => {
    expect(sanitizeInput(123 as any)).toBe(123);
    expect(sanitizeInput(null as any)).toBe(null);
  });

  it('should strip script tags while preserving text', () => {
    expect(sanitizeInput('Safe <script>alert(1)</script> text')).toBe('Safe alert(1) text');
  });
});

describe('hasSuspiciousPattern', () => {
  it('should detect SQL injection patterns', () => {
    expect(hasSuspiciousPattern("' OR '1'='1")).toBe(true);
    expect(hasSuspiciousPattern("UNION SELECT * FROM users")).toBe(true);
    expect(hasSuspiciousPattern("DROP TABLE shops")).toBe(true);
    expect(hasSuspiciousPattern("DELETE FROM offers")).toBe(true);
  });

  it('should allow normal text', () => {
    expect(hasSuspiciousPattern('Normal shop name')).toBe(false);
    expect(hasSuspiciousPattern('Special Offer: 50% off')).toBe(false);
  });
});

describe('sanitizePayload', () => {
  it('should sanitize strings recursively', () => {
    const payload = {
      name: 'Test <script>',
      description: 'A "great" deal',
    };
    const result = sanitizePayload(payload);
    expect(result.name).toBe('Test ');
    expect((result as any).description).toBe('A &quot;great&quot; deal');
  });

  it('should skip sanitization for rawDesigner field', () => {
    const payload = { rawDesigner: '<svg>...</svg>' };
    expect(sanitizePayload(payload).rawDesigner).toBe('<svg>...</svg>');
  });

  it('should handle arrays', () => {
    const payload = { tags: ['<b>tag1</b>', 'normal'] };
    const result = sanitizePayload(payload);
    expect((result as any).tags[0]).toBe('tag1');
    expect((result as any).tags[1]).toBe('normal');
  });

  it('should preserve numbers', () => {
    const payload = { count: 42 };
    const result = sanitizePayload(payload);
    expect((result as any).count).toBe(42);
  });
});

describe('sanitizeErrorMessage', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should return generic message in production', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Database connection string with password: postgresql://admin:secret@db.internal:5432');
    const sanitized = sanitizeErrorMessage(error, 'Failed to fetch resource');
    expect(sanitized).toBe('Failed to fetch resource');
  });

  it('should return detailed error message in non-production environments', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Explicit syntax error at line 42');
    const sanitized = sanitizeErrorMessage(error, 'Default fallback');
    expect(sanitized).toBe('Explicit syntax error at line 42');
  });
});

