import { PriceTickReceived } from '../../../core/events';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

type TickRule = {
  check: (tick: PriceTickReceived) => boolean;
  message: string;
};

export class PriceTickValidator {
  private static rules: TickRule[] = [
    {
      check: (tick) => !!tick.symbol && tick.symbol.trim() !== '',
      message: 'Symbol cannot be empty',
    },
    {
      check: (tick) => tick.price > 0,
      message: 'Price must be greater than 0',
    },
    {
      check: (tick) => !!tick.timestamp && tick.timestamp > 0,
      message: 'Timestamp must be valid',
    },
    {
      check: (tick) => !!tick.exchange && tick.exchange.trim() !== '',
      message: 'Exchange cannot be empty',
    },
  ];

  validate(tick: PriceTickReceived): ValidationResult {
    const errors = PriceTickValidator.rules
      .filter(rule => !rule.check(tick))
      .map(rule => rule.message);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
