//Opretter startdata: rumskibene Orion, Voyager og Discovery.
//Kan køres flere gange uden at lave dubletter: npm run seed
const { connectDatabase, disconnectDatabase } = require("../src/config/database");
const shipRepository = require("../src/repositories/shipRepository");
const { logger, flushLogs } = require("../src/utils/logger");

const SHIPS = [
    { name: "Orion", type: "Rescue" },
    { name: "Voyager", type: "Transport" },
    { name: "Discovery", type: "Research" }
];

async function seed() {
    let exitCode = 0;

    try {
        await connectDatabase(process.env.MONGODB_URI);

        for (const ship of SHIPS) {
            const created = await shipRepository.createIfNotExists(ship);
            logger.info(created ? `Seed: oprettede ${ship.name}` : `Seed: ${ship.name} findes allerede - springes over`);
        }

        await disconnectDatabase();
    } catch (err) {
        logger.error(`Seed fejlede: ${err.message}`);
        exitCode = 1;
    }

    await flushLogs();
    process.exit(exitCode);
}

seed();
