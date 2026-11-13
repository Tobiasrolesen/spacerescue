const mongoose = require("mongoose");
const { logger } = require("../utils/logger");

//Hvor længe vi venter på MongoDB, før vi giver op (ms)
const SERVER_SELECTION_TIMEOUT_MS = 5000;

//Opretter forbindelse til MongoDB. Kaster en fejl, hvis det ikke lykkes.
async function connectDatabase(uri) {
    if (!uri) {
        throw new Error("MONGODB_URI mangler. Opret en .env-fil ud fra .env.example");
    }

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS
        });
    } catch (err) {
        //Vi logger ikke selve URI'en, da den kan indeholde brugernavn og password
        throw new Error(`Kunne ikke forbinde til MongoDB: ${err.message}`);
    }

    const { host, port, name } = mongoose.connection;
    logger.info(`Forbundet til MongoDB (${host}:${port}/${name})`);

    await ensureIndexes();
}

//Sikrer, at alle indeks fra modellerne findes i databasen, FØR serveren tager imod requests.
//Mongoose bygger ellers indeks i baggrunden, og så ville fx de unikke indeks, der
//forhindrer dobbelt tildeling af rumskibe, ikke gælde de første øjeblikke efter opstart.
//Kan et indeks ikke oprettes (fx fordi eksisterende data bryder det), fejler opstarten tydeligt.
async function ensureIndexes() {
    const models = Object.values(mongoose.models);
    await Promise.all(models.map((model) => model.createIndexes()));
    logger.info(`Databaseindeks er klar (${models.map((model) => model.modelName).join(", ")})`);
}

//Lukker forbindelsen pænt, fx når serveren stoppes
async function disconnectDatabase() {
    await mongoose.disconnect();
    logger.info("Forbindelsen til MongoDB er lukket");
}

module.exports = { connectDatabase, disconnectDatabase };
