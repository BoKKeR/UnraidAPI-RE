import winston from "winston";

// Set log level from environment variable, default to 'info'
const logLevel = process.env.LOG_LEVEL || "info";

// Create Winston logger with different transports (console in this case)
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss"
    }),
    winston.format.printf(
      ({ timestamp, level, message }) =>
        `${timestamp} [${level.toUpperCase()}]: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console()
    // You can add more transports here, e.g., File transport for logging into a file.
    // new winston.transports.File({ filename: 'app.log' }),
  ]
});

// Export the logger so it can be used in other files
export default logger;
