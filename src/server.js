const app = require("./app");
const { connectDatabase, disconnectDatabase } = require("./config/database");
const { logger, flushLogs } = require("./utils/logger");

const PORT = process.env.PORT || 3000;

//Skriver de sidste logbeskeder færdigt, før processen stopper
async function exit(code) {
    await flushLogs();
    process.exit(code);
}

//Vi forbinder til MongoDB, før serveren starter.
//Uden database giver det ingen mening at tage imod requests.
async function start() {
    try {
        await connectDatabase(process.env.MONGODB_URI);
    } catch (err) {
        logger.error(`${err.message} - serveren starter ikke.`);
        await exit(1);
    }

    const server = app.listen(PORT, () => {
        logger.info(`SpaceRescue kører på http://localhost:${PORT}`);
    });

    //Lukker serveren og databaseforbindelsen pænt ved Ctrl+C eller stop
    async function shutdown(signal) {
        logger.info(`${signal} modtaget - lukker SpaceRescue ned...`);
        server.close(async () => {
            await disconnectDatabase();
            await exit(0);
        });
    }

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();
