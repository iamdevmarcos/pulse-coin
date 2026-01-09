import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BinanceWebSocketAdapter } from './binance-websocket.adapter';

describe('BinanceWebSocketAdapter', () => {
  let adapter: BinanceWebSocketAdapter;

  beforeEach(() => {
    adapter = new BinanceWebSocketAdapter();
  });

  afterEach(() => {
    adapter.disconnect();
  });

  describe('connection', () => {
    it('should create instance', () => {
      expect(adapter).toBeDefined();
    });

    it('should not throw when connecting with valid symbols', () => {
      expect(() => {
        adapter.connect(['BTCUSDT', 'ETHUSDT']);
      }).not.toThrow();
    });

    it('should accept tick callback', () => {
      expect(() => {
        adapter.onTick(() => {});
      }).not.toThrow();
    });
  });

  describe('disconnection', () => {
    it('should not throw when disconnecting', () => {
      adapter.connect(['BTCUSDT']);
      expect(() => {
        adapter.disconnect();
      }).not.toThrow();
    });

    it('should handle disconnect without prior connection', () => {
      expect(() => {
        adapter.disconnect();
      }).not.toThrow();
    });
  });
});
