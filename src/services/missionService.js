const missionRepository = require("../repositories/missionRepository");
const shipRepository = require("../repositories/shipRepository");
const assignmentRepository = require("../repositories/assignmentRepository");
const shipService = require("./shipService");
const { NotFoundError, ConflictError } = require("../errors/AppError");
const { logger } = require("../utils/logger");

//MongoDB's fejlkode, når et unikt indeks ville blive brudt
const DUPLICATE_KEY_ERROR = 11000;

//Service: forretningsregler for missioner og tildelinger. Kender hverken req, res eller HTTP.

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

//Tildeler et rumskib til en mission.
//
//Reglerne "et skib har kun én aktiv mission" og "en mission har kun ét aktivt skib"
//håndhæves af DATABASEN via partielle unikke indeks på assignments - ikke af et
//forudgående tjek i JavaScript. Et tjek efterfulgt af en lagring kan nemlig ikke
//forhindre, at to samtidige requests begge ser "ledig" (race condition).
async function assignShip(missionId, shipId) {
    //1. Findes mission og skib? (Giver forståelige 404-fejl)
    const mission = await getMissionById(missionId);
    await shipService.getShipById(shipId);

    //En afsluttet mission har ingen aktiv tildeling, så indekset stopper den ikke - vi gør
    if (mission.status === "completed") {
        throw new ConflictError("MISSION_COMPLETED", "Missionen er afsluttet og kan ikke få tildelt et rumskib");
    }

    //2. Indsæt tildelingen. Her virker databasegarantien:
    //   Har skibet eller missionen allerede en aktiv tildeling, afviser MongoDB indsættelsen.
    let assignment;
    try {
        assignment = await assignmentRepository.createActive(missionId, shipId);
    } catch (err) {
        throw translateDuplicateError(err);
    }

    //3. Opdatér status på skib og mission, så oversigterne viser det rigtige.
    //   Begge opdateringer er betingede ("kun hvis stadig available/pending").
    //   Fejler en af dem, ruller vi alt tilbage, så der ikke opstår en halv tilstand.
    let shipUpdated = false;
    let missionUpdated = false;
    try {
        shipUpdated = await shipRepository.updateStatus(shipId, "available", "busy");
        missionUpdated = shipUpdated && await missionRepository.updateStatus(missionId, "pending", "active");
    } catch (err) {
        await rollbackAssignment(assignment, shipUpdated, missionUpdated);
        throw err;
    }

    if (!shipUpdated) {
        await rollbackAssignment(assignment, shipUpdated, missionUpdated);
        throw new ConflictError("SHIP_UNAVAILABLE", "Rumskibet er ikke ledigt");
    }
    if (!missionUpdated) {
        await rollbackAssignment(assignment, shipUpdated, missionUpdated);
        throw new ConflictError("MISSION_NOT_ASSIGNABLE", "Missionen kan ikke længere få tildelt et rumskib");
    }

    return assignment;
}

//Henter missionens aktive tildeling
async function getAssignment(missionId) {
    await getMissionById(missionId);

    const assignment = await assignmentRepository.findActiveByMissionId(missionId);
    if (!assignment) {
        throw new NotFoundError("ASSIGNMENT_NOT_FOUND", "Missionen har ingen aktiv tildeling");
    }
    return assignment;
}

//Oversætter MongoDB's dubletfejl til en forståelig konflikt.
//keyPattern fortæller, hvilket indeks der blev brudt.
function translateDuplicateError(err) {
    if (err.code !== DUPLICATE_KEY_ERROR) {
        return err;
    }
    if (err.keyPattern?.shipId) {
        return new ConflictError("SHIP_UNAVAILABLE", "Rumskibet er allerede tildelt en aktiv mission");
    }
    if (err.keyPattern?.missionId) {
        return new ConflictError("MISSION_ALREADY_ASSIGNED", "Missionen har allerede et rumskib tildelt");
    }
    return err;
}

//Fjerner en tildeling og ruller statusændringer tilbage, hvis tildelingen ikke kunne gennemføres helt.
//Fejler oprydningen også (fx fordi databasen er nede), logges det, så det kan rettes manuelt.
async function rollbackAssignment(assignment, shipUpdated, missionUpdated) {
    try {
        if (missionUpdated) {
            await missionRepository.updateStatus(assignment.missionId, "active", "pending");
        }
        if (shipUpdated) {
            await shipRepository.updateStatus(assignment.shipId, "busy", "available");
        }
        await assignmentRepository.deleteById(assignment._id);
    } catch (err) {
        logger.error(`Tilbagerulning af tildeling ${assignment._id} fejlede: ${err.message}`, {
            assignmentId: String(assignment._id),
            missionId: String(assignment.missionId),
            shipId: String(assignment.shipId)
        });
    }
}

module.exports = { getAllMissions, getMissionById, createMission, assignShip, getAssignment };
