import { createLogger, format, transports } from "winston";
import { AsyncLocalStorage } from "async_hooks";
import { env } from "../utilities/env";

export const logContext = new AsyncLocalStorage();

const winston = createLogger({
  level: env.LOG_LEVEL,
  format:
    env.NODE_ENV === "development"
      ? format.combine(format.colorize(), format.simple())
      : format.simple(),
  transports: [new transports.Console()],
});

type LogMeta = Record<string, any>;
type LogLevel = "error" | "warn" | "info" | "debug";

const log = (level: LogLevel, message: string, meta?: LogMeta) => {
  const store = logContext.getStore();
  if (store) {
    winston.log(level, message, {
      ...meta,
      ...store,
    });
  } else {
    winston.log(level, message, {
      ...meta,
    });
  }
};

export const logger = {
  error: (message: string, meta?: LogMeta) => log("error", message, meta),
  warn: (message: string, meta?: LogMeta) => log("warn", message, meta),
  info: (message: string, meta?: LogMeta) => log("info", message, meta),
  debug: (message: string, meta?: LogMeta) => log("debug", message, meta),
};
