import winston from "winston";

const logFormat = winston.format.printf(
  ({ level, message, category, timestamp, stack }) => {
    return JSON.stringify({
      timestamp,
      category,
      level,
      message,
      stack,
    });
  }
);

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    logFormat
  ),
  transports: [
    // Zapis do plików logów
    // new winston.transports.File({ filename: `logs/error.log`, level: "error" }),
    // new winston.transports.File({ filename: `logs/combined.log` }),

    // Zapis do konsoli
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export function log(
  category: string,
  level: "info" | "warn" | "error",
  message: string,
  error?: Error
) {
  const stackTrace = new Error().stack?.split("\n")[2].trim(); // Pobiera plik i linię kodu
  logger.log({ level, category, message, stack: stackTrace, error });
}

export default logger;
