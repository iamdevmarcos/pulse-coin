export class PriceTickStreamed {
  readonly eventType = 'PriceTickStreamed';

  constructor(
    public readonly symbol: string,
    public readonly price: number,
    public readonly timestamp: number,
    public readonly streamedAt: number,
  ) {}
}
