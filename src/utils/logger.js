const path = require("path");
const winston = require("winston");

const { combine, timestamp, printf, json, colorize } = winston.format;

//Fast placering af logfilen. Stien bygges ud fra projektmappen
//og kan aldrig påvirkes af data fra en request.
const LOG_DIR = path.join(__dirname, "..", "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "spacerescue.log");

//Læsevenligt format til konsollen: [2026-11-13 14:02:11] warn: GET /api/ships/123 404 4ms
const consoleFormat = combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
);

//Én JSON-linje pr. hændelse i filen, så den er nem at søge i og analysere
const fileFormat = combine(timestamp(), json());

//Logfilen gemmes som variabel, så vi kan vente på, at den er skrevet færdig ved nedlukning
const fileTransport = new winston.transports.File({ filename: LOG_FILE, format: fileFormat });

const logger = winston.createLogger({
    level: "info",
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        fileTransport
    ]
});

//Venter på, at alt er skrevet til logfilen. Bruges før process.exit(),
//så de sidste beskeder (fx hvorfor serveren stoppede) ikke går tabt.
function flushLogs() {
    return new Promise((resolve) => {
        fileTransport.on("finish", resolve);
        logger.end();
    });
}

module.exports = { logger, flushLogs, LOG_FILE };
