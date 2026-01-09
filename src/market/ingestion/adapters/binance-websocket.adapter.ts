import { WebSocket } from 'ws';
import { IMarketConnector, RawTick } from '../interfaces';

interface BinanceTradePayload {
  e: string;
  E: number;
  s: string;
  t: number;
  p: string;
  q: string;
  T: number;
}

export class BinanceWebSocketAdapter implements IMarketConnector {
  private ws: WebSocket | null = null;
  private tickCallback: ((data: RawTick) => void) | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly baseReconnectDelay = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;

  connect(symbols: string[]): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === 1)) {
      return;
    }

    this.isConnecting = true;
    const streams = symbols.map((symbol) => `${symbol.toLowerCase()}@trade`).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`; // public binance websocket url ;)

    console.log(`[BinanceAdapter] Connecting to ${url}`);

    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      console.log(`[BinanceAdapter] Connected successfully`);
      this.reconnectAttempts = 0;
      this.isConnecting = false;
    });

    this.ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.data && message.data.e === 'trade') {
          const payload = message.data as BinanceTradePayload;
          const tick = this.convertToRawTick(payload);
          if (this.tickCallback) this.tickCallback(tick);
        }
      } catch (error) {
        console.error('[BinanceAdapter] Error parsing message:', error);
      }
    });

    this.ws.on('error', (error) => {
      console.error('[BinanceAdapter] WebSocket error:', error);
      this.isConnecting = false;
    });

    this.ws.on('close', () => {
      console.log('[BinanceAdapter] Connection closed');
      this.isConnecting = false;
      this.scheduleReconnect(symbols);
    });
  }

  disconnect(): void {
    console.log('[BinanceAdapter] Disconnecting...');
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  onTick(callback: (data: RawTick) => void): void {
    this.tickCallback = callback;
  }

  private convertToRawTick(payload: BinanceTradePayload): RawTick {
    return {
      symbol: payload.s,
      price: parseFloat(payload.p),
      timestamp: payload.T,
      tradeId: payload.t.toString(),
    };
  }

  private scheduleReconnect(symbols: string[]): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        '[BinanceAdapter] Max reconnection attempts reached. Stopping reconnection.',
      );
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(
      `[BinanceAdapter] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect(symbols);
    }, delay);
  }
}
