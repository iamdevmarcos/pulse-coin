import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { IEventBus } from '../../../core/events';
import { PriceTickReceived } from '../../../core/events';
import { IMarketConnector } from '../interfaces';

@Injectable()
export class MarketIngestionService implements OnModuleInit, OnModuleDestroy {
  private readonly symbols = ['BTCUSDT', 'ETHUSDT', 'DOGEUSDT'];

  constructor(
    @Inject(IEventBus) private readonly eventBus: IEventBus,
    @Inject(IMarketConnector) private readonly marketConnector: IMarketConnector,
  ) {}

  onModuleInit() {
    console.log('[MarketIngestion] Starting ingestion service...');
    this.marketConnector.onTick((tick) => {
      const event = new PriceTickReceived(
        tick.symbol,
        tick.price,
        tick.timestamp,
        'binance',
        tick.tradeId,
      );
      this.eventBus.publish(event);
    });

    this.marketConnector.connect(this.symbols);
  }

  onModuleDestroy() {
    console.log('[MarketIngestion] Stopping ingestion service...');
    this.marketConnector.disconnect();
  }
}
