import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Inject } from '@nestjs/common';
import { WebSocket, WebSocketServer as WSServer } from 'ws';
import { IEventBus, PriceTickProcessed } from '../../../core/events';
import { SymbolFilter } from '../filters/symbol-filter';
import { IncomingMessage } from 'http';
import { parse } from 'url';

interface ClientSubscription {
  symbols: string[] | null;
}

@WebSocketGateway({ path: '/prices' })
export class PriceStreamGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: WSServer;

  private readonly symbolFilter = new SymbolFilter();
  private readonly clientSubscriptions = new Map<WebSocket, ClientSubscription>();

  constructor(@Inject(IEventBus) private readonly eventBus: IEventBus) {}

  afterInit() {
    console.log('[PriceStreamGateway] WebSocket server initialized');
    this.eventBus.subscribe<PriceTickProcessed>('PriceTickProcessed', (event) => {
      this.handlePriceTick(event);
    });
  }

  handleConnection(client: WebSocket, request: IncomingMessage) {
    const parsedUrl = parse(request.url || '', true);
    const symbolsQuery = parsedUrl.query.symbols as string | undefined;
    const symbols = this.symbolFilter.parseSymbols(symbolsQuery);

    this.clientSubscriptions.set(client, { symbols });

    console.log(
      `[PriceStreamGateway] Client connected (symbols: ${symbols ? symbols.join(',') : 'ALL'})`,
    );
  }

  handleDisconnect(client: WebSocket) {
    this.clientSubscriptions.delete(client);
    console.log(`[PriceStreamGateway] Client disconnected`);
  }

  private handlePriceTick(tick: PriceTickProcessed): void {
    const payload = JSON.stringify({
      symbol: tick.symbol,
      price: tick.price,
      timestamp: tick.timestamp,
      exchange: tick.exchange,
    });

    this.clientSubscriptions.forEach((subscription, client) => {
      if (
        client.readyState === 1 &&
        this.symbolFilter.shouldInclude(tick.symbol, subscription.symbols)
      ) {
        client.send(payload);
      }
    });
  }
}
