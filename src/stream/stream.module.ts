import { Module } from '@nestjs/common';
import { TerminalStreamService } from './terminal/services/terminal-stream.service';
import { PriceStreamGateway } from './websocket/gateways/price-stream.gateway';
import { IEventBus } from '../core/events';

@Module({})
export class StreamModule {
  static forRoot(eventBus: IEventBus) {
    return {
      module: StreamModule,
      providers: [
        {
          provide: IEventBus,
          useValue: eventBus,
        },
        TerminalStreamService,
        PriceStreamGateway,
      ],
    };
  }
}
