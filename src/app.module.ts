import { Module, Global } from '@nestjs/common';
import { IEventBus, InMemoryEventBus } from './core/events';
import { MarketIngestionService } from './market/ingestion/services/market-ingestion.service';
import { BinanceWebSocketAdapter } from './market/ingestion/adapters';
import { IMarketConnector } from './market/ingestion/interfaces';
import { PriceProcessorService } from './price/processing/services/price-processor.service';
import { TerminalStreamService } from './stream/terminal/services/terminal-stream.service';
import { PriceStreamGateway } from './stream/websocket/gateways/price-stream.gateway';

@Global()
@Module({
  providers: [
    {
      provide: IEventBus,
      useFactory: () => {
        return new InMemoryEventBus();
      },
    },
    {
      provide: IMarketConnector,
      useClass: BinanceWebSocketAdapter,
    },
    MarketIngestionService,
    PriceProcessorService,
    TerminalStreamService,
    PriceStreamGateway,
  ],
  exports: [IEventBus],
})
export class AppModule {}
