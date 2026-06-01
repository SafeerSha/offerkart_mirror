export interface LogEntry {
    timestamp: string;
    level: "info" | "warn" | "error" | "debug";
    message: string;
    context?: Record<string, unknown>;
    error?: Error;
}

type LogTransport = (entry: LogEntry) => void;

let transport: LogTransport | null = null;

export function setLogTransport(fn: LogTransport) {
    transport = fn;
}

export const logger = {
  log: (...args: any[]) => {
    console.log(...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
  info: (...args: any[]) => {
    console.info(...args);
  }
};

export function createStructuredLogger(component: string) {
  return {
    info: (message: string, context?: Record<string, unknown>) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "info",
        message: `[${component}] ${message}`,
        context,
      };
      if (transport) transport(entry);
      console.info(JSON.stringify(entry));
    },
    warn: (message: string, context?: Record<string, unknown>) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "warn",
        message: `[${component}] ${message}`,
        context,
      };
      if (transport) transport(entry);
      console.warn(JSON.stringify(entry));
    },
    error: (message: string, error?: Error, context?: Record<string, unknown>) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "error",
        message: `[${component}] ${message}`,
        error,
        context,
      };
      if (transport) transport(entry);
      console.error(JSON.stringify(entry));
    },
    debug: (message: string, context?: Record<string, unknown>) => {
      if (process.env.NODE_ENV !== "production") {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: "debug",
          message: `[${component}] ${message}`,
          context,
        };
        if (transport) transport(entry);
        console.debug(JSON.stringify(entry));
      }
    },
  };
}
