export class PriceTickReceived {
  readonly eventType = 'PriceTickReceived';

  constructor(
    public readonly symbol: string,
    public readonly price: number,
    public readonly timestamp: number,
    public readonly exchange: string,
    public readonly tradeId?: string,
  ) {}
}
