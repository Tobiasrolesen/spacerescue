const { Mission } = require("../models/missionModel");

//Repository: det ENESTE sted, hvor der tales med MongoDB om missioner.
//Ingen forretningsregler her - kun hent og gem.

//Nyeste missioner først, så de seneste nødsituationer står øverst
async function findAll() {
    return Mission.find().sort({ createdAt: -1 });
}

async function findById(id) {
    return Mission.findById(id);
}

async function create(data) {
    return Mission.create(data);
}

//Opretter missionen, hvis der ikke findes en med samme titel. Bruges kun af seed-scriptet.
//Samme princip som shipRepository.createIfNotExists - eksisterende missioner røres ikke.
//Returnerer true, hvis missionen blev oprettet.
async function createIfNotExists(data) {
    const now = new Date();
    const result = await Mission.updateOne(
        { title: data.title },
        { $setOnInsert: { ...data, createdAt: now, updatedAt: now } },
        { upsert: true, timestamps: false }
    );
    return result.upsertedCount === 1;
}

module.exports = { findAll, findById, create, createIfNotExists };
