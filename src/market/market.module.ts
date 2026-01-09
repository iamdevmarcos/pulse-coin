import { Module } from '@nestjs/common';
import { MarketIngestionService } from './ingestion/services/market-ingestion.service';
import { BinanceWebSocketAdapter } from './ingestion/adapters';
import { IMarketConnector } from './ingestion/interfaces';
import { IEventBus, InMemoryEventBus } from '../core/events';

@Module({
  providers: [
    {
      provide: IEventBus,
      useClass: InMemoryEventBus,
    },
    {
      provide: IMarketConnector,
      useClass: BinanceWebSocketAdapter,
    },
    MarketIngestionService,
  ],
  exports: [IEventBus],
})
export class MarketModule {}
