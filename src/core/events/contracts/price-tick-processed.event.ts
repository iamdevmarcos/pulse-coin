export class PriceTickProcessed {
  readonly eventType = 'PriceTickProcessed';

  constructor(
    public readonly symbol: string,
    public readonly price: number,
    public readonly timestamp: number,
    public readonly exchange: string,
    public readonly processedAt: number,
    public readonly version: string,
  ) {}
}
