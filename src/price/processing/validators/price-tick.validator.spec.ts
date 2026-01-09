import { describe, it, expect, beforeEach } from 'bun:test';
import { PriceTickValidator } from './price-tick.validator';
import { PriceTickReceived } from '../../../core/events';

describe('PriceTickValidator', () => {
  let validator: PriceTickValidator;

  beforeEach(() => {
    validator = new PriceTickValidator();
  });

  describe('valid ticks', () => {
    it('should validate a correct tick', () => {
      const tick = new PriceTickReceived('BTCUSDT', 50000, Date.now(), 'binance');

      const result = validator.validate(tick);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate tick with optional tradeId', () => {
      const tick = new PriceTickReceived('BTCUSDT', 50000, Date.now(), 'binance', 'trade-123');

      const result = validator.validate(tick);

      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid ticks', () => {
    it('should reject tick with empty symbol', () => {
      const tick = new PriceTickReceived('', 50000, Date.now(), 'binance');

      const result = validator.validate(tick);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Symbol cannot be empty');
    });

    it('should reject tick with zero price', () => {
      const tick = new PriceTickReceived('BTCUSDT', 0, Date.now(), 'binance');

      const result = validator.validate(tick);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Price must be greater than 0');
    });

    it('should reject tick with negative price', () => {
      const tick = new PriceTickReceived('BTCUSDT', -100, Date.now(), 'binance');

      const result = validator.validate(tick);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Price must be greater than 0');
    });

    it('should reject tick with invalid timestamp', () => {
      const tick = new PriceTickReceived('BTCUSDT', 50000, 0, 'binance');

      const result = validator.validate(tick);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Timestamp must be valid');
    });

    it('should reject tick with empty exchange', () => {
      const tick = new PriceTickReceived('BTCUSDT', 50000, Date.now(), '');

      const result = validator.validate(tick);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Exchange cannot be empty');
    });

    it('should collect multiple errors', () => {
      const tick = new PriceTickReceived('', -100, 0, '');

      const result = validator.validate(tick);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
