import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { PriceStreamGateway } from './price-stream.gateway';
import { IEventBus, PriceTickProcessed } from '../../../core/events';
import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';

describe('PriceStreamGateway', () => {
  let gateway: PriceStreamGateway;
  let mockEventBus: IEventBus;
  let subscribedHandler: ((event: PriceTickProcessed) => void) | null;

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

    gateway = new PriceStreamGateway(mockEventBus);
    gateway.server = {} as any;
  });

  describe('afterInit', () => {
    it('should subscribe to PriceTickProcessed events', () => {
      gateway.afterInit();

      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        'PriceTickProcessed',
        expect.any(Function),
      );
      expect(subscribedHandler).not.toBeNull();
    });
  });

  describe('handleConnection', () => {
    it('should handle connection without symbol filter', () => {
      const mockClient = {
        readyState: 1,
        send: mock(() => {}),
      } as any as WebSocket;

      const mockRequest = {
        url: '/prices',
      } as IncomingMessage;

      expect(() => {
        gateway.handleConnection(mockClient, mockRequest);
      }).not.toThrow();
    });

    it('should handle connection with symbol filter', () => {
      const mockClient = {
        readyState: 1,
        send: mock(() => {}),
      } as any as WebSocket;

      const mockRequest = {
        url: '/prices?symbols=BTCUSDT,ETHUSDT',
      } as IncomingMessage;

      expect(() => {
        gateway.handleConnection(mockClient, mockRequest);
      }).not.toThrow();
    });
  });

  describe('handleDisconnect', () => {
    it('should clean up client subscription', () => {
      const mockClient = {
        readyState: 1,
        send: mock(() => {}),
      } as any as WebSocket;

      const mockRequest = {
        url: '/prices',
      } as IncomingMessage;

      gateway.handleConnection(mockClient, mockRequest);
      
      expect(() => {
        gateway.handleDisconnect(mockClient);
      }).not.toThrow();
    });
  });

  describe('price streaming', () => {
    beforeEach(() => {
      gateway.afterInit();
    });

    it('should send price to client without filter', () => {
      const mockClient = {
        readyState: 1,
        send: mock(() => {}),
      } as any as WebSocket;

      const mockRequest = {
        url: '/prices',
      } as IncomingMessage;

      gateway.handleConnection(mockClient, mockRequest);

      const tick = new PriceTickProcessed(
        'BTCUSDT',
        50000,
        Date.now(),
        'binance',
        Date.now(),
        '1.0.0',
      );

      subscribedHandler!(tick);

      expect(mockClient.send).toHaveBeenCalled();
    });

    it('should send only matching symbols to filtered client', () => {
      const mockClient = {
        readyState: 1,
        send: mock(() => {}),
      } as any as WebSocket;

      const mockRequest = {
        url: '/prices?symbols=BTCUSDT',
      } as IncomingMessage;

      gateway.handleConnection(mockClient, mockRequest);

      const btcTick = new PriceTickProcessed(
        'BTCUSDT',
        50000,
        Date.now(),
        'binance',
        Date.now(),
        '1.0.0',
      );

      subscribedHandler!(btcTick);

      expect(mockClient.send).toHaveBeenCalled();
    });
  });
});
