// Simple logging utility for Bible parsing operations

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private debugMode: boolean = false;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    this.logLevel = enabled ? LogLevel.DEBUG : LogLevel.INFO;
  }

  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  logParsingProgress(stage: string, details: any): void {
    if (this.debugMode) {
      this.debug(`Parsing ${stage}:`, details);
    }
  }

  logParsingResult(format: string, booksFound: number, chaptersFound: number, versesFound: number): void {
    this.info(`XML Bible parsed successfully: ${format} format, ${booksFound} books, ${chaptersFound} chapters, ${versesFound} verses`);
  }

  logParsingError(error: Error, context?: string): void {
    const contextStr = context ? ` (${context})` : '';
    this.error(`XML Bible parsing failed${contextStr}:`, error.message);
    if (this.debugMode) {
      this.debug('Full error details:', error);
    }
  }
}