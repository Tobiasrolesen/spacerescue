const mongoose = require("mongoose");

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
    console.log(`Forbundet til MongoDB (${host}:${port}/${name})`);
}

//Lukker forbindelsen pænt, fx når serveren stoppes
async function disconnectDatabase() {
    await mongoose.disconnect();
    console.log("Forbindelsen til MongoDB er lukket");
}

module.exports = { connectDatabase, disconnectDatabase };
