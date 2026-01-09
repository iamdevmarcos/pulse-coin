export interface IEventBus {
  publish<T extends { eventType: string }>(event: T): void;
  subscribe<T>(eventType: string, handler: (event: T) => void): void;
}

export const IEventBus = Symbol('IEventBus');
