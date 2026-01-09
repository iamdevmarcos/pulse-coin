import { describe, it, expect, beforeEach } from 'bun:test';
import { InMemoryEventBus } from './in-memory-event-bus';
import {
  PriceTickReceived,
  PriceTickProcessed,
  PriceTickStreamed,
} from '../contracts';

describe('InMemoryEventBus', () => {
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    eventBus = new InMemoryEventBus();
  });

  describe('publish and subscribe', () => {
    it('should publish and receive events', (done) => {
      const event = new PriceTickReceived('BTCUSDT', 50000, Date.now(), 'binance');

      eventBus.subscribe<PriceTickReceived>('PriceTickReceived', (receivedEvent) => {
        expect(receivedEvent.symbol).toBe('BTCUSDT');
        expect(receivedEvent.price).toBe(50000);
        expect(receivedEvent.exchange).toBe('binance');
        done();
      });

      eventBus.publish(event);
    });

    it('should support multiple subscribers for the same event type', () => {
      const event = new PriceTickReceived('ETHUSDT', 3000, Date.now(), 'binance');
      let callCount = 0;

      eventBus.subscribe<PriceTickReceived>('PriceTickReceived', () => {
        callCount++;
      });

      eventBus.subscribe<PriceTickReceived>('PriceTickReceived', () => {
        callCount++;
      });

      eventBus.publish(event);

      setTimeout(() => {
        expect(callCount).toBe(2);
      }, 50);
    });
  });

  describe('event type filtering', () => {
    it('should only receive events of subscribed type', (done) => {
      const receivedEvent = new PriceTickReceived('BTCUSDT', 50000, Date.now(), 'binance');
      const processedEvent = new PriceTickProcessed(
        'BTCUSDT',
        50000,
        Date.now(),
        'binance',
        Date.now(),
        '1.0.0',
      );

      let receivedCount = 0;

      eventBus.subscribe<PriceTickReceived>('PriceTickReceived', () => {
        receivedCount++;
      });

      eventBus.publish(receivedEvent);
      eventBus.publish(processedEvent);

      setTimeout(() => {
        expect(receivedCount).toBe(1);
        done();
      }, 50);
    });

    it('should isolate different event types', () => {
      const receivedEvent = new PriceTickReceived('BTCUSDT', 50000, Date.now(), 'binance');
      const processedEvent = new PriceTickProcessed(
        'ETHUSDT',
        3000,
        Date.now(),
        'binance',
        Date.now(),
        '1.0.0',
      );
      const streamedEvent = new PriceTickStreamed('SOLUSDT', 100, Date.now(), Date.now());

      const receivedEvents: string[] = [];
      const processedEvents: string[] = [];
      const streamedEvents: string[] = [];

      eventBus.subscribe<PriceTickReceived>('PriceTickReceived', (event) => {
        receivedEvents.push(event.symbol);
      });

      eventBus.subscribe<PriceTickProcessed>('PriceTickProcessed', (event) => {
        processedEvents.push(event.symbol);
      });

      eventBus.subscribe<PriceTickStreamed>('PriceTickStreamed', (event) => {
        streamedEvents.push(event.symbol);
      });

      eventBus.publish(receivedEvent);
      eventBus.publish(processedEvent);
      eventBus.publish(streamedEvent);

      setTimeout(() => {
        expect(receivedEvents).toEqual(['BTCUSDT']);
        expect(processedEvents).toEqual(['ETHUSDT']);
        expect(streamedEvents).toEqual(['SOLUSDT']);
      }, 50);
    });
  });

  describe('event contracts', () => {
    it('should preserve all event properties', (done) => {
      const timestamp = Date.now();
      const event = new PriceTickReceived('BTCUSDT', 50000, timestamp, 'binance', 'trade-123');

      eventBus.subscribe<PriceTickReceived>('PriceTickReceived', (receivedEvent) => {
        expect(receivedEvent.symbol).toBe('BTCUSDT');
        expect(receivedEvent.price).toBe(50000);
        expect(receivedEvent.timestamp).toBe(timestamp);
        expect(receivedEvent.exchange).toBe('binance');
        expect(receivedEvent.tradeId).toBe('trade-123');
        expect(receivedEvent.eventType).toBe('PriceTickReceived');
        done();
      });

      eventBus.publish(event);
    });

    it('should handle PriceTickProcessed events correctly', (done) => {
      const timestamp = Date.now();
      const processedAt = Date.now();
      const event = new PriceTickProcessed(
        'ETHUSDT',
        3000,
        timestamp,
        'binance',
        processedAt,
        '1.0.0',
      );

      eventBus.subscribe<PriceTickProcessed>('PriceTickProcessed', (receivedEvent) => {
        expect(receivedEvent.symbol).toBe('ETHUSDT');
        expect(receivedEvent.price).toBe(3000);
        expect(receivedEvent.timestamp).toBe(timestamp);
        expect(receivedEvent.exchange).toBe('binance');
        expect(receivedEvent.processedAt).toBe(processedAt);
        expect(receivedEvent.version).toBe('1.0.0');
        expect(receivedEvent.eventType).toBe('PriceTickProcessed');
        done();
      });

      eventBus.publish(event);
    });
  });
});
