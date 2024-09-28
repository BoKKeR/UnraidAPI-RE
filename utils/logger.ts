import winston from "winston";

// Set log level from environment variable, default to 'info'
const logLevel = process.env.LOG_LEVEL || "info";

// Define a custom color scheme for log levels
const logColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  debug: "blue"
};

// Apply the color settings to Winston
winston.addColors(logColors);

// Create Winston logger with colorized output
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.colorize({ all: true }), // Colorize all output (message and level)
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss"
    }),
    winston.format.printf(
      ({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`
    )
  ),
  transports: [new winston.transports.Console()]
});

// Export the logger so it can be used in other files
export default logger;
