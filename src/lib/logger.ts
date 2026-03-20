export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Keep error logs even in production for debugging,
    // though ideally these would go to a monitoring service (Sentry, etc.)
    console.error(...args);
  },
  info: (...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.info(...args);
    }
  }
};
