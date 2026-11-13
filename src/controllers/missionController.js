const missionService = require("../services/missionService");

//Controller: oversætter mellem HTTP og service-laget.
//Fejl kastet i servicen sendes automatisk videre til errorHandler af Express 5.

async function getAll(req, res) {
    const missions = await missionService.getAllMissions();
    res.status(200).json(missions);
}

async function getById(req, res) {
    const mission = await missionService.getMissionById(req.params.id);
    res.status(200).json(mission);
}

async function create(req, res) {
    const mission = await missionService.createMission(req.body);
    res.status(201).json(mission);
}

module.exports = { getAll, getById, create };
