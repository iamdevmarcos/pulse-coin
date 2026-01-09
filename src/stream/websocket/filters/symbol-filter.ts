export class SymbolFilter {
  parseSymbols(queryString?: string): string[] | null {
    if (!queryString) {
      return null;
    }

    const symbols = queryString
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

    return symbols.length > 0 ? symbols : null;
  }

  shouldInclude(symbol: string, allowedSymbols: string[] | null): boolean {
    if (!allowedSymbols) {
      return true;
    }

    return allowedSymbols.includes(symbol.toUpperCase());
  }
}
