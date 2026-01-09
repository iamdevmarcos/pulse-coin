import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { PriceProcessorService } from './price-processor.service';
import { IEventBus, PriceTickReceived, PriceTickProcessed } from '../../../core/events';

describe('PriceProcessorService', () => {
  let service: PriceProcessorService;
  let mockEventBus: IEventBus;
  let subscribedHandler: ((event: PriceTickReceived) => void) | null;

  beforeEach(() => {
    subscribedHandler = null;

    mockEventBus = {
      publish: mock(() => {}),
      subscribe: mock((eventType: string, handler: any) => {
        if (eventType === 'PriceTickReceived') {
          subscribedHandler = handler;
        }
      }),
    };

    service = new PriceProcessorService(mockEventBus);
  });

  describe('onModuleInit', () => {
    it('should subscribe to PriceTickReceived events', () => {
      service.onModuleInit();

      expect(mockEventBus.subscribe).toHaveBeenCalledWith('PriceTickReceived', expect.any(Function));
      expect(subscribedHandler).not.toBeNull();
    });
  });

  describe('tick processing', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should transform valid tick into PriceTickProcessed event', () => {
      const timestamp = Date.now();
      const receivedTick = new PriceTickReceived('BTCUSDT', 50000.456, timestamp, 'binance');

      subscribedHandler!(receivedTick);

      expect(mockEventBus.publish).toHaveBeenCalled();
      const publishedEvent = (mockEventBus.publish as any).mock.calls[0][0];
      expect(publishedEvent).toBeInstanceOf(PriceTickProcessed);
      expect(publishedEvent.symbol).toBe('BTCUSDT');
      expect(publishedEvent.price).toBe(50000.46);
      expect(publishedEvent.timestamp).toBe(timestamp);
      expect(publishedEvent.exchange).toBe('binance');
      expect(publishedEvent.version).toBe('1.0.0');
    });

    it('should normalize price to 2 decimal places', () => {
      const receivedTick = new PriceTickReceived('ETHUSDT', 3000.9876, Date.now(), 'binance');

      subscribedHandler!(receivedTick);

      const publishedEvent = (mockEventBus.publish as any).mock.calls[0][0];
      expect(publishedEvent.price).toBe(3000.99);
    });

    it('should not publish event for invalid tick', () => {
      const invalidTick = new PriceTickReceived('', -100, 0, '');

      subscribedHandler!(invalidTick);

      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle multiple ticks correctly', () => {
      const tick1 = new PriceTickReceived('BTCUSDT', 50000, Date.now(), 'binance');
      const tick2 = new PriceTickReceived('ETHUSDT', 3000, Date.now(), 'binance');

      subscribedHandler!(tick1);
      subscribedHandler!(tick2);

      expect(mockEventBus.publish).toHaveBeenCalledTimes(2);
    });

    it('should continue processing after invalid tick', () => {
      const invalidTick = new PriceTickReceived('', -100, 0, '');
      const validTick = new PriceTickReceived('BTCUSDT', 50000, Date.now(), 'binance');

      subscribedHandler!(invalidTick);
      subscribedHandler!(validTick);

      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });
  });
});
