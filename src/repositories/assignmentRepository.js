const { Assignment } = require("../models/assignmentModel");

//Repository: det ENESTE sted, hvor der tales med MongoDB om tildelinger.
//Ingen forretningsregler her - kun hent og gem.

//Indsætter en aktiv tildeling. Kaster MongoDB-dubletfejl (11000),
//hvis skibet eller missionen allerede har en aktiv tildeling (se de unikke indeks i modellen).
async function createActive(missionId, shipId) {
    return Assignment.create({ missionId, shipId, status: "active" });
}

async function findActiveByMissionId(missionId) {
    return Assignment.findOne({ missionId, status: "active" });
}

async function deleteById(id) {
    await Assignment.deleteOne({ _id: id });
}

module.exports = { createActive, findActiveByMissionId, deleteById };
