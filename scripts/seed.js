//Opretter startdata: rumskibene Orion, Voyager og Discovery
//samt de to nødsituationer fra casen på Kepler-186f.
//Kan køres flere gange uden at lave dubletter: npm run seed
const { connectDatabase, disconnectDatabase } = require("../src/config/database");
const shipRepository = require("../src/repositories/shipRepository");
const missionRepository = require("../src/repositories/missionRepository");
const { logger, flushLogs } = require("../src/utils/logger");

const SHIPS = [
    { name: "Orion", type: "Rescue" },
    { name: "Voyager", type: "Transport" },
    { name: "Discovery", type: "Research" }
];

const MISSIONS = [
    {
        title: "Oxygen Crisis",
        destination: "Kepler-186f",
        description: "Research station is running out of oxygen"
    },
    {
        title: "Engine Failure",
        destination: "Kepler-186f",
        description: "Cargo ship has lost its engine"
    }
];

async function seed() {
    let exitCode = 0;

    try {
        await connectDatabase(process.env.MONGODB_URI);

        for (const ship of SHIPS) {
            const created = await shipRepository.createIfNotExists(ship);
            logger.info(created ? `Seed: oprettede rumskib ${ship.name}` : `Seed: rumskib ${ship.name} findes allerede - springes over`);
        }

        for (const mission of MISSIONS) {
            const created = await missionRepository.createIfNotExists(mission);
            logger.info(created ? `Seed: oprettede mission ${mission.title}` : `Seed: mission ${mission.title} findes allerede - springes over`);
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
