import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { IEventBus, PriceTickProcessed } from '../../../core/events';

@Injectable()
export class TerminalStreamService implements OnModuleInit {
  private lastPrices: Map<string, number> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly debounceMs = 100;

  constructor(@Inject(IEventBus) private readonly eventBus: IEventBus) {}

  onModuleInit() {
    console.log('[TerminalStream] Starting terminal stream...');
    this.eventBus.subscribe<PriceTickProcessed>('PriceTickProcessed', (event) => {
      this.handlePriceTick(event);
    });
  }

  private handlePriceTick(tick: PriceTickProcessed): void {
    const existingTimer = this.debounceTimers.get(tick.symbol);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.printPrice(tick);
      this.debounceTimers.delete(tick.symbol);
    }, this.debounceMs);

    this.debounceTimers.set(tick.symbol, timer);
  }

  private printPrice(tick: PriceTickProcessed): void {
    const lastPrice = this.lastPrices.get(tick.symbol);
    const priceChange = lastPrice !== undefined ? tick.price - lastPrice : 0;
    const color = this.getColor(priceChange);
    const arrow = this.getArrow(priceChange);

    console.log(`${color}[${tick.symbol}] ${tick.price.toFixed(2)} ${arrow}\x1b[0m`);

    this.lastPrices.set(tick.symbol, tick.price);
  }

  private getColor(priceChange: number): string {
    if (priceChange > 0) return '\x1b[32m'; // green
    if (priceChange < 0) return '\x1b[31m'; // red
    return '\x1b[37m'; // white
  }

  private getArrow(priceChange: number): string {
    if (priceChange > 0) return '↑';
    if (priceChange < 0) return '↓';
    return '→';
  }
}
