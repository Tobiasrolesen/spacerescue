const { Ship } = require("../models/shipModel");

//Repository: det ENESTE sted, hvor der tales med MongoDB om rumskibe.
//Ingen forretningsregler her - kun hent og gem.

async function findAll() {
    return Ship.find().sort({ name: 1 });
}

async function findById(id) {
    return Ship.findById(id);
}

async function create(data) {
    return Ship.create(data);
}

//Opretter skibet, hvis der ikke findes et med samme navn. Ellers sker der intet.
//$setOnInsert betyder, at et eksisterende skib (og dets status) aldrig overskrives.
//timestamps: false forhindrer Mongoose i at ændre updatedAt på eksisterende skibe,
//derfor sætter vi selv createdAt og updatedAt, når skibet oprettes.
//Returnerer true, hvis skibet blev oprettet.
async function createIfNotExists(data) {
    const now = new Date();
    const result = await Ship.updateOne(
        { name: data.name },
        { $setOnInsert: { ...data, createdAt: now, updatedAt: now } },
        { upsert: true, timestamps: false }
    );
    return result.upsertedCount === 1;
}

//Betinget, atomisk statusændring: opdaterer KUN, hvis skibet stadig har status "from".
//Søgning og opdatering sker i én operation i MongoDB, så ingen anden request kan nå
//at ændre status imellem. Returnerer true, hvis skibet blev opdateret.
async function updateStatus(id, from, to) {
    const result = await Ship.updateOne({ _id: id, status: from }, { $set: { status: to } });
    return result.modifiedCount === 1;
}

module.exports = { findAll, findById, create, createIfNotExists, updateStatus };
