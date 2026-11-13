const app = require("./app");
const { connectDatabase, disconnectDatabase } = require("./config/database");

const PORT = process.env.PORT || 3000;

//Vi forbinder til MongoDB, før serveren starter.
//Uden database giver det ingen mening at tage imod requests.
async function start() {
    try {
        await connectDatabase(process.env.MONGODB_URI);
    } catch (err) {
        console.error(`${err.message} - serveren starter ikke.`);
        process.exit(1);
    }

    const server = app.listen(PORT, () => {
        console.log(`SpaceRescue kører på http://localhost:${PORT}`);
    });

    //Lukker serveren og databaseforbindelsen pænt ved Ctrl+C eller stop
    async function shutdown(signal) {
        console.log(`${signal} modtaget - lukker SpaceRescue ned...`);
        server.close(async () => {
            await disconnectDatabase();
            process.exit(0);
        });
    }

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();
