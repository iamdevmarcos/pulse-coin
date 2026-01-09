import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { IEventBus, PriceTickReceived, PriceTickProcessed } from '../../../core/events';
import { PriceTickValidator } from '../validators/price-tick.validator';

@Injectable()
export class PriceProcessorService implements OnModuleInit {
  private readonly validator = new PriceTickValidator();
  private readonly version = '1.0.0';
  private static readonly PRICE_DECIMAL_PLACES = 2;

  constructor(@Inject(IEventBus) private readonly eventBus: IEventBus) {}

  onModuleInit() {
    console.log('[PriceProcessor] Starting price processor...');
    this.eventBus.subscribe<PriceTickReceived>('PriceTickReceived', (event) => {
      this.processTickEvent(event);
    });
  }

  private processTickEvent(tick: PriceTickReceived): void {
    const validationResult = this.validator.validate(tick);

    if (!validationResult.isValid) {
      console.error('[PriceProcessor] Invalid tick:', validationResult.errors);
      return;
    }

    const processedTick = new PriceTickProcessed(
      tick.symbol,
      this.normalizePrice(tick.price),
      tick.timestamp,
      tick.exchange,
      Date.now(),
      this.version,
    );

    this.eventBus.publish(processedTick);
  }

  /**
   * Rounds the given price to a fixed number of decimal places (as defined by PRICE_DECIMAL_PLACES).
   * This ensures that prices are handled and published with consistent precision.
   * @param price - The original price value to be normalized.
   * @returns The price rounded to a fixed number of decimal places.
   */
  private normalizePrice(price: number): number {
    const factor = Math.pow(10, PriceProcessorService.PRICE_DECIMAL_PLACES);
    return Math.round(price * factor) / factor;
  }
}
