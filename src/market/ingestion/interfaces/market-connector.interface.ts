import { RawTick } from './raw-tick.interface';

export interface IMarketConnector {
  connect(symbols: string[]): void;
  disconnect(): void;
  onTick(callback: (data: RawTick) => void): void;
}

export const IMarketConnector = Symbol('IMarketConnector');
