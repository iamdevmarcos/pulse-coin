import { describe, it, expect, beforeEach } from 'bun:test';
import { SymbolFilter } from './symbol-filter';

describe('SymbolFilter', () => {
  let filter: SymbolFilter;

  beforeEach(() => {
    filter = new SymbolFilter();
  });

  describe('parseSymbols', () => {
    it('should return null for undefined input', () => {
      const result = filter.parseSymbols(undefined);
      expect(result).toBeNull();
    });

    it('should parse single symbol', () => {
      const result = filter.parseSymbols('BTCUSDT');
      expect(result).toEqual(['BTCUSDT']);
    });

    it('should parse multiple symbols', () => {
      const result = filter.parseSymbols('BTCUSDT,ETHUSDT');
      expect(result).toEqual(['BTCUSDT', 'ETHUSDT']);
    });

    it('should normalize symbols to uppercase', () => {
      const result = filter.parseSymbols('btcusdt,ethusdt');
      expect(result).toEqual(['BTCUSDT', 'ETHUSDT']);
    });

    it('should trim whitespace', () => {
      const result = filter.parseSymbols(' BTCUSDT , ETHUSDT ');
      expect(result).toEqual(['BTCUSDT', 'ETHUSDT']);
    });

    it('should filter empty strings', () => {
      const result = filter.parseSymbols('BTCUSDT,,ETHUSDT');
      expect(result).toEqual(['BTCUSDT', 'ETHUSDT']);
    });

    it('should return null for empty string', () => {
      const result = filter.parseSymbols('');
      expect(result).toBeNull();
    });

    it('should return null for only commas', () => {
      const result = filter.parseSymbols(',,,');
      expect(result).toBeNull();
    });
  });

  describe('shouldInclude', () => {
    it('should include all symbols when no filter is provided', () => {
      expect(filter.shouldInclude('BTCUSDT', null)).toBe(true);
      expect(filter.shouldInclude('ETHUSDT', null)).toBe(true);
      expect(filter.shouldInclude('SOLUSDT', null)).toBe(true);
    });

    it('should include symbol that matches filter', () => {
      const allowedSymbols = ['BTCUSDT', 'ETHUSDT'];
      expect(filter.shouldInclude('BTCUSDT', allowedSymbols)).toBe(true);
      expect(filter.shouldInclude('ETHUSDT', allowedSymbols)).toBe(true);
    });

    it('should exclude symbol that does not match filter', () => {
      const allowedSymbols = ['BTCUSDT', 'ETHUSDT'];
      expect(filter.shouldInclude('SOLUSDT', allowedSymbols)).toBe(false);
      expect(filter.shouldInclude('BNBUSDT', allowedSymbols)).toBe(false);
    });

    it('should be case insensitive', () => {
      const allowedSymbols = ['BTCUSDT', 'ETHUSDT'];
      expect(filter.shouldInclude('btcusdt', allowedSymbols)).toBe(true);
      expect(filter.shouldInclude('BtcUsDt', allowedSymbols)).toBe(true);
    });
  });
});
