//Fælles hjælpefunktioner til integrationstests.
//Starter SpaceRescue mod en SEPARAT testdatabase, så rigtige data aldrig røres.

//Slår loggen fra under tests. Skal sættes, FØR loggeren indlæses (via app/database nedenfor).
process.env.LOG_SILENT = "true";

//Som standard peger tests på en lukket port, så de aldrig sender beskeder til et rigtigt
//informationssystem. tests/notification.test.js overskriver adressen med et falsk system.
process.env.INFORMATION_SYSTEM_URL = "http://127.0.0.1:1";
process.env.NOTIFICATION_TIMEOUT_MS = "500";

const { once } = require("node:events");
const mongoose = require("mongoose");
const app = require("../../src/app");
const { connectDatabase } = require("../../src/config/database");
const shipRepository = require("../../src/repositories/shipRepository");
const missionRepository = require("../../src/repositories/missionRepository");

let server;

//Starter appen på en tilfældig ledig port og returnerer API'ets adresse
async function startTestServer() {
    await connectDatabase(process.env.MONGODB_URI_TEST);

    //Sikkerhedsnet: testene sletter alt i databasen mellem hver test.
    //Derfor nægter vi at køre mod en database, hvis navn ikke ender på "_test".
    const dbName = mongoose.connection.name;
    if (!dbName.endsWith("_test")) {
        await mongoose.disconnect();
        throw new Error(`Testdatabasen "${dbName}" ender ikke på "_test" - tjek MONGODB_URI_TEST i .env`);
    }

    server = app.listen(0);   //Port 0 = styresystemet vælger en ledig port
    await once(server, "listening");
    return `http://localhost:${server.address().port}/api`;
}

async function stopTestServer() {
    if (server) {
        server.close();
        await once(server, "close");
    }
    //Efterlad testdatabasen tom, så næste kørsel altid starter rent
    await resetDatabase();
    await mongoose.disconnect();
}

//Tømmer alle collections, men bevarer indeksene (dem tester vi jo)
async function resetDatabase() {
    const models = Object.values(mongoose.models);
    await Promise.all(models.map((model) => model.deleteMany({})));
}

//Opretter testdata direkte via repositories (hurtigere og uafhængigt af HTTP)
async function createShip(name) {
    return shipRepository.create({ name, type: "Rescue" });
}

async function createMission(title) {
    return missionRepository.create({ title, destination: "Kepler-186f" });
}

module.exports = { startTestServer, stopTestServer, resetDatabase, createShip, createMission };
