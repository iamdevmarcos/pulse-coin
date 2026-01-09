import { Module } from '@nestjs/common';
import { PriceProcessorService } from './processing/services/price-processor.service';
import { IEventBus } from '../core/events';

@Module({
  providers: [PriceProcessorService],
})
export class PriceModule {
  static forRoot(eventBus: IEventBus) {
    return {
      module: PriceModule,
      providers: [
        {
          provide: IEventBus,
          useValue: eventBus,
        },
        PriceProcessorService,
      ],
    };
  }
}
