import { describe, it, expect, beforeEach } from 'bun:test';
import { InMemoryEventBus } from './core/events/event-bus/in-memory-event-bus';
import { PriceTickReceived, PriceTickProcessed } from './core/events';
import { MarketIngestionService } from './market/ingestion/services/market-ingestion.service';
import { PriceProcessorService } from './price/processing/services/price-processor.service';
import { IMarketConnector, RawTick } from './market/ingestion/interfaces';

describe('PulseX Integration Tests', () => {
  let eventBus: InMemoryEventBus;
  let ingestionService: MarketIngestionService;
  let processorService: PriceProcessorService;
  let mockConnector: IMarketConnector;
  let tickCallback: ((data: RawTick) => void) | null;

  beforeEach(() => {
    tickCallback = null;
    eventBus = new InMemoryEventBus();

    mockConnector = {
      connect: () => {},
      disconnect: () => {},
      onTick: (callback: (data: RawTick) => void) => {
        tickCallback = callback;
      },
    };

    ingestionService = new MarketIngestionService(eventBus, mockConnector);
    processorService = new PriceProcessorService(eventBus);
    
    ingestionService.onModuleInit();
    processorService.onModuleInit();
  });

  describe('End-to-End Event Flow', () => {
    it('should flow from RawTick to PriceTickProcessed', (done) => {
      let receivedEventFired = false;
      let processedEventFired = false;

      eventBus.subscribe<PriceTickReceived>('PriceTickReceived', (event) => {
        if (event.symbol === 'BTCUSDT' && event.price === 50000) {
          receivedEventFired = true;
          expect(event.exchange).toBe('binance');
        }
      });

      eventBus.subscribe<PriceTickProcessed>('PriceTickProcessed', (event) => {
        if (event.symbol === 'BTCUSDT' && event.price === 50000) {
          processedEventFired = true;
          expect(event.exchange).toBe('binance');
          expect(event.version).toBe('1.0.0');
        }
      });

      const rawTick: RawTick = {
        symbol: 'BTCUSDT',
        price: 50000,
        timestamp: Date.now(),
        tradeId: 'test-123',
      };

      tickCallback!(rawTick);

      setTimeout(() => {
        expect(receivedEventFired).toBe(true);
        expect(processedEventFired).toBe(true);
        done();
      }, 50);
    });

    it('should handle multiple symbols independently', (done) => {
      const receivedSymbols = new Set<string>();
      const processedSymbols = new Set<string>();

      eventBus.subscribe<PriceTickReceived>('PriceTickReceived', (event) => {
        receivedSymbols.add(event.symbol);
      });

      eventBus.subscribe<PriceTickProcessed>('PriceTickProcessed', (event) => {
        processedSymbols.add(event.symbol);
      });

      const ticks: RawTick[] = [
        { symbol: 'BTCUSDT', price: 50000, timestamp: Date.now() },
        { symbol: 'ETHUSDT', price: 3000, timestamp: Date.now() },
        { symbol: 'SOLUSDT', price: 100, timestamp: Date.now() },
      ];

      ticks.forEach((tick) => tickCallback!(tick));

      setTimeout(() => {
        expect(receivedSymbols.has('BTCUSDT')).toBe(true);
        expect(receivedSymbols.has('ETHUSDT')).toBe(true);
        expect(receivedSymbols.has('SOLUSDT')).toBe(true);
        expect(processedSymbols.has('BTCUSDT')).toBe(true);
        expect(processedSymbols.has('ETHUSDT')).toBe(true);
        expect(processedSymbols.has('SOLUSDT')).toBe(true);
        done();
      }, 100);
    });

    it('should filter invalid ticks in processor', (done) => {
      let processedCount = 0;

      eventBus.subscribe<PriceTickProcessed>('PriceTickProcessed', () => {
        processedCount++;
      });

      const validTick: RawTick = {
        symbol: 'BTCUSDT',
        price: 50000,
        timestamp: Date.now(),
      };

      const invalidTick: RawTick = {
        symbol: '',
        price: -100,
        timestamp: 0,
      };

      tickCallback!(validTick);
      tickCallback!(invalidTick);
      tickCallback!(validTick);

      setTimeout(() => {
        expect(processedCount).toBe(2);
        done();
      }, 100);
    });
  });

  describe('System Resilience', () => {
    it('should continue processing after error', (done) => {
      let successCount = 0;

      eventBus.subscribe<PriceTickProcessed>('PriceTickProcessed', () => {
        successCount++;
      });

      const validTick: RawTick = {
        symbol: 'BTCUSDT',
        price: 50000,
        timestamp: Date.now(),
      };

      const invalidTick: RawTick = {
        symbol: '',
        price: 0,
        timestamp: 0,
      };

      tickCallback!(validTick);
      tickCallback!(invalidTick);
      tickCallback!(validTick);
      tickCallback!(validTick);

      setTimeout(() => {
        expect(successCount).toBe(3);
        done();
      }, 100);
    });
  });
});
