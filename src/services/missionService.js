const missionRepository = require("../repositories/missionRepository");
const { NotFoundError } = require("../errors/AppError");

//Service: forretningsregler for missioner. Kender hverken req, res eller HTTP.
//Tildeling af rumskibe tilføjes her i Issue #7.

async function getAllMissions() {
    return missionRepository.findAll();
}

async function getMissionById(id) {
    const mission = await missionRepository.findById(id);
    if (!mission) {
        throw new NotFoundError("MISSION_NOT_FOUND", `Mission med id ${id} findes ikke`);
    }
    return mission;
}

async function createMission(data) {
    return missionRepository.create(data);
}

module.exports = { getAllMissions, getMissionById, createMission };
