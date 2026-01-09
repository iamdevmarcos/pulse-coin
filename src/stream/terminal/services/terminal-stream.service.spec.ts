import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';
import { TerminalStreamService } from './terminal-stream.service';
import { IEventBus, PriceTickProcessed } from '../../../core/events';

describe('TerminalStreamService', () => {
  let service: TerminalStreamService;
  let mockEventBus: IEventBus;
  let subscribedHandler: ((event: PriceTickProcessed) => void) | null;
  let consoleLogSpy: any;

  beforeEach(() => {
    subscribedHandler = null;

    mockEventBus = {
      publish: mock(() => {}),
      subscribe: mock((eventType: string, handler: any) => {
        if (eventType === 'PriceTickProcessed') {
          subscribedHandler = handler;
        }
      }),
    };

    consoleLogSpy = spyOn(console, 'log');

    service = new TerminalStreamService(mockEventBus);
  });

  describe('onModuleInit', () => {
    it('should subscribe to PriceTickProcessed events', () => {
      service.onModuleInit();

      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        'PriceTickProcessed',
        expect.any(Function),
      );
      expect(subscribedHandler).not.toBeNull();
    });
  });

  describe('price formatting', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should format price output correctly', (done) => {
      const event = new PriceTickProcessed(
        'BTCUSDT',
        50000.12,
        Date.now(),
        'binance',
        Date.now(),
        '1.0.0',
      );

      subscribedHandler!(event);

      setTimeout(() => {
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls.find((call: any[]) =>
          call[0].includes('BTCUSDT'),
        );
        expect(logCall).toBeDefined();
        expect(logCall[0]).toContain('50000.12');
        done();
      }, 150);
    });

    it('should include symbol in output', (done) => {
      const event = new PriceTickProcessed(
        'ETHUSDT',
        3000,
        Date.now(),
        'binance',
        Date.now(),
        '1.0.0',
      );

      subscribedHandler!(event);

      setTimeout(() => {
        const logCall = consoleLogSpy.mock.calls.find((call: any[]) => call[0].includes('ETHUSDT'));
        expect(logCall).toBeDefined();
        done();
      }, 150);
    });
  });

  describe('debouncing', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should debounce rapid price updates', (done) => {
      const event1 = new PriceTickProcessed(
        'BTCUSDT',
        50000,
        Date.now(),
        'binance',
        Date.now(),
        '1.0.0',
      );
      const event2 = new PriceTickProcessed(
        'BTCUSDT',
        50001,
        Date.now(),
        'binance',
        Date.now(),
        '1.0.0',
      );
      const event3 = new PriceTickProcessed(
        'BTCUSDT',
        50002,
        Date.now(),
        'binance',
        Date.now(),
        '1.0.0',
      );

      subscribedHandler!(event1);
      subscribedHandler!(event2);
      subscribedHandler!(event3);

      setTimeout(() => {
        const btcLogs = consoleLogSpy.mock.calls.filter((call: any[]) =>
          call[0].includes('BTCUSDT'),
        );
        expect(btcLogs.length).toBeLessThan(3);
        done();
      }, 150);
    });

    it('should handle different symbols independently', (done) => {
      const btcEvent = new PriceTickProcessed(
        'BTCUSDT',
        50000,
        Date.now(),
        'binance',
        Date.now(),
        '1.0.0',
      );
      const ethEvent = new PriceTickProcessed(
        'ETHUSDT',
        3000,
        Date.now(),
        'binance',
        Date.now(),
        '1.0.0',
      );

      subscribedHandler!(btcEvent);
      subscribedHandler!(ethEvent);

      setTimeout(() => {
        const btcLogs = consoleLogSpy.mock.calls.filter((call: any[]) =>
          call[0].includes('BTCUSDT'),
        );
        const ethLogs = consoleLogSpy.mock.calls.filter((call: any[]) =>
          call[0].includes('ETHUSDT'),
        );
        expect(btcLogs.length).toBeGreaterThan(0);
        expect(ethLogs.length).toBeGreaterThan(0);
        done();
      }, 150);
    });
  });
});
