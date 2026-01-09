import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IEventBus } from './event-bus.interface';

interface EventWrapper {
  type: string;
  payload: any;
}

export class InMemoryEventBus implements IEventBus {
  private readonly eventStream = new Subject<EventWrapper>();

  publish<T extends { eventType: string }>(event: T): void {
    this.eventStream.next({
      type: event.eventType,
      payload: event,
    });
  }

  subscribe<T>(eventType: string, handler: (event: T) => void): void {
    this.eventStream
      .pipe(filter((wrapper) => wrapper.type === eventType))
      .subscribe((wrapper) => handler(wrapper.payload as T));
  }
}
