import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { MarketIngestionService } from './market-ingestion.service';
import { IEventBus } from '../../../core/events';
import { PriceTickReceived } from '../../../core/events';
import { IMarketConnector, RawTick } from '../interfaces';

describe('MarketIngestionService', () => {
  let service: MarketIngestionService;
  let mockEventBus: IEventBus;
  let mockConnector: IMarketConnector;
  let tickCallback: ((data: RawTick) => void) | null;

  beforeEach(() => {
    tickCallback = null;

    mockEventBus = {
      publish: mock(() => {}),
      subscribe: mock(() => {}),
    };

    mockConnector = {
      connect: mock(() => {}),
      disconnect: mock(() => {}),
      onTick: mock((callback: (data: RawTick) => void) => {
        tickCallback = callback;
      }),
    };

    service = new MarketIngestionService(mockEventBus, mockConnector);
  });

  describe('onModuleInit', () => {
    it('should register tick callback', () => {
      service.onModuleInit();

      expect(mockConnector.onTick).toHaveBeenCalled();
      expect(tickCallback).not.toBeNull();
    });

    it('should connect to market with correct symbols', () => {
      service.onModuleInit();

      expect(mockConnector.connect).toHaveBeenCalledWith([
        'BTCUSDT',
        'ETHUSDT',
        'SOLUSDT',
        'BNBUSDT',
      ]);
    });
  });

  describe('tick handling', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should publish PriceTickReceived event when tick arrives', () => {
      const rawTick: RawTick = {
        symbol: 'BTCUSDT',
        price: 50000,
        timestamp: Date.now(),
        tradeId: 'test-123',
      };

      tickCallback!(rawTick);

      expect(mockEventBus.publish).toHaveBeenCalled();
      const publishedEvent = (mockEventBus.publish as any).mock.calls[0][0];
      expect(publishedEvent).toBeInstanceOf(PriceTickReceived);
      expect(publishedEvent.symbol).toBe('BTCUSDT');
      expect(publishedEvent.price).toBe(50000);
      expect(publishedEvent.exchange).toBe('binance');
      expect(publishedEvent.tradeId).toBe('test-123');
    });

    it('should handle multiple ticks correctly', () => {
      const tick1: RawTick = {
        symbol: 'BTCUSDT',
        price: 50000,
        timestamp: Date.now(),
      };

      const tick2: RawTick = {
        symbol: 'ETHUSDT',
        price: 3000,
        timestamp: Date.now(),
      };

      tickCallback!(tick1);
      tickCallback!(tick2);

      expect(mockEventBus.publish).toHaveBeenCalledTimes(2);
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from market', () => {
      service.onModuleDestroy();

      expect(mockConnector.disconnect).toHaveBeenCalled();
    });
  });
});
