import { describe, it, expect } from 'vitest';
import { MagnetParser } from './magnetParser';

describe('MagnetParser', () => {
  describe('parse', () => {
    it('should parse a valid magnet URI', () => {
      const magnetUri = 'magnet:?xt=urn:btih:1234567890abcdef1234567890abcdef12345678&dn=test+movie&tr=udp%3A%2F%2Ftracker.example.com%3A80';

      const result = MagnetParser.parse(magnetUri);

      expect(result.infoHash).toBe('1234567890abcdef1234567890abcdef12345678');
      expect(result.name).toBe('test movie');
      expect(result.trackers).toContain('udp://tracker.example.com:80');
      expect(result.raw).toBe(magnetUri);
    });

    it('should parse magnet URI without display name', () => {
      const magnetUri = 'magnet:?xt=urn:btih:abcdef1234567890abcdef1234567890abcdef12';

      const result = MagnetParser.parse(magnetUri);

      expect(result.infoHash).toBe('abcdef1234567890abcdef1234567890abcdef12');
      expect(result.name).toBeUndefined();
      expect(result.trackers).toEqual([]);
    });

    it('should throw error for invalid magnet URI', () => {
      const invalidUri = 'not-a-magnet-uri';

      expect(() => MagnetParser.parse(invalidUri)).toThrow('Invalid magnet URI format');
    });

    it('should throw error for missing info hash', () => {
      const invalidUri = 'magnet:?dn=test';

      expect(() => MagnetParser.parse(invalidUri)).toThrow('Missing or invalid info hash');
    });

    it('should throw error for invalid info hash format', () => {
      const invalidUri = 'magnet:?xt=urn:btih:invalidhash';

      expect(() => MagnetParser.parse(invalidUri)).toThrow('Invalid info hash format');
    });
  });

  describe('extractInfoHash', () => {
    it('should extract info hash from magnet URI', () => {
      const magnetUri = 'magnet:?xt=urn:btih:1234567890abcdef1234567890abcdef12345678&dn=test';

      const infoHash = MagnetParser.extractInfoHash(magnetUri);

      expect(infoHash).toBe('1234567890abcdef1234567890abcdef12345678');
    });
  });

  describe('createMagnetUri', () => {
    it('should create magnet URI from components', () => {
      const info = {
        infoHash: '1234567890abcdef1234567890abcdef12345678',
        name: 'test movie',
        trackers: ['udp://tracker.example.com:80']
      };

      const magnetUri = MagnetParser.createMagnetUri(info);

      expect(magnetUri).toContain('xt=urn:btih:1234567890abcdef1234567890abcdef12345678');
      expect(magnetUri).toContain('dn=test%20movie');
      expect(magnetUri).toContain('tr=udp%3A%2F%2Ftracker.example.com%3A80');
    });
  });

  describe('isValidMagnetUri', () => {
    it('should return true for valid magnet URI', () => {
      const validUri = 'magnet:?xt=urn:btih:1234567890abcdef1234567890abcdef12345678';

      expect(MagnetParser.isValidMagnetUri(validUri)).toBe(true);
    });

    it('should return false for invalid magnet URI', () => {
      const invalidUri = 'not-a-magnet';

      expect(MagnetParser.isValidMagnetUri(invalidUri)).toBe(false);
    });
  });
});