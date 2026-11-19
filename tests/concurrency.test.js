//Samtidighedstests for tildeling af rumskibe (Issue #8).
//
//Hver test starter fra en ren database, sender requests SAMTIDIGT med Promise.all
//og kontrollerer bagefter både HTTP-svarene OG indholdet i databasen.
//Det er ikke nok at se på statuskoder - databasen skal bevise, at der aldrig
//findes to aktive tildelinger af samme skib eller samme mission.

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { startTestServer, stopTestServer, resetDatabase, createShip, createMission } = require("./helpers/testServer");
const { Assignment } = require("../src/models/assignmentModel");
const { Ship } = require("../src/models/shipModel");
const { Mission } = require("../src/models/missionModel");
const assignmentRepository = require("../src/repositories/assignmentRepository");

let baseUrl;

//Sender en tildelingsrequest og returnerer statuskode og body
async function assign(missionId, shipId) {
    const res = await fetch(`${baseUrl}/missions/${missionId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipId: String(shipId) })
    });
    return { status: res.status, body: await res.json() };
}

//Tæller svar pr. statuskode, fx { 201: 1, 409: 19 }
function countStatuses(results) {
    return results.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
}

describe("Samtidige tildelinger", () => {
    before(async () => {
        baseUrl = await startTestServer();
    });

    after(async () => {
        await stopTestServer();
    });

    beforeEach(async () => {
        await resetDatabase();
    });

    it("to operatører tildeler samme skib til hver sin mission samtidigt - kun én lykkes", async () => {
        const orion = await createShip("Orion");
        const oxygen = await createMission("Oxygen Crisis");
        const engine = await createMission("Engine Failure");

        const results = await Promise.all([assign(oxygen._id, orion._id), assign(engine._id, orion._id)]);

        //HTTP: præcis én succes og én afvisning
        assert.deepEqual(countStatuses(results), { 201: 1, 409: 1 });
        const rejected = results.find((r) => r.status === 409);
        assert.equal(rejected.body.error, "SHIP_UNAVAILABLE");

        //Database: præcis én aktiv tildeling af Orion
        assert.equal(await Assignment.countDocuments({ shipId: orion._id, status: "active" }), 1);
        assert.equal((await Ship.findById(orion._id)).status, "busy");

        //Vinderens mission er active, taberens er stadig pending
        const winnerMissionId = results.find((r) => r.status === 201).body.missionId;
        const statuses = (await Mission.find()).map((m) => [String(m._id), m.status]);
        for (const [id, status] of statuses) {
            assert.equal(status, id === winnerMissionId ? "active" : "pending");
        }
    });

    it("20 samtidige tildelinger af samme skib - præcis én lykkes", async () => {
        const orion = await createShip("Orion");
        const missions = await Promise.all(
            Array.from({ length: 20 }, (_, i) => createMission(`Nødsituation ${i + 1}`))
        );

        const results = await Promise.all(missions.map((m) => assign(m._id, orion._id)));

        assert.deepEqual(countStatuses(results), { 201: 1, 409: 19 });
        assert.ok(results.filter((r) => r.status === 409).every((r) => r.body.error === "SHIP_UNAVAILABLE"));

        //Database: én aktiv tildeling i alt, én aktiv mission og 19 der stadig venter
        assert.equal(await Assignment.countDocuments({ status: "active" }), 1);
        assert.equal(await Mission.countDocuments({ status: "active" }), 1);
        assert.equal(await Mission.countDocuments({ status: "pending" }), 19);
    });

    it("to forskellige skibe til samme mission samtidigt - missionen får kun ét skib", async () => {
        const orion = await createShip("Orion");
        const voyager = await createShip("Voyager");
        const oxygen = await createMission("Oxygen Crisis");

        const results = await Promise.all([assign(oxygen._id, orion._id), assign(oxygen._id, voyager._id)]);

        assert.deepEqual(countStatuses(results), { 201: 1, 409: 1 });
        assert.equal(results.find((r) => r.status === 409).body.error, "MISSION_ALREADY_ASSIGNED");

        //Database: én aktiv tildeling på missionen; det tabende skib er stadig ledigt
        assert.equal(await Assignment.countDocuments({ missionId: oxygen._id, status: "active" }), 1);
        const winnerShipId = results.find((r) => r.status === 201).body.shipId;
        const loserShip = await Ship.findById(winnerShipId === String(orion._id) ? voyager._id : orion._id);
        assert.equal(loserShip.status, "available");
    });

    it("gentaget 10 gange fra ny starttilstand - hver gang præcis én vinder", async () => {
        for (let round = 1; round <= 10; round++) {
            await resetDatabase();
            const orion = await createShip("Orion");
            const a = await createMission("Oxygen Crisis");
            const b = await createMission("Engine Failure");

            const results = await Promise.all([assign(a._id, orion._id), assign(b._id, orion._id)]);

            assert.deepEqual(countStatuses(results), { 201: 1, 409: 1 }, `Runde ${round}`);
            assert.equal(await Assignment.countDocuments({ shipId: orion._id, status: "active" }), 1, `Runde ${round}`);
        }
    });

    it("databasen afviser selv en anden aktiv tildeling - uden om service-laget", async () => {
        //Her springer vi både HTTP, controller og service over og indsætter direkte i MongoDB.
        //Det viser, at garantien ligger i DATABASEN (det unikke indeks) og ikke i vores JavaScript.
        const orion = await createShip("Orion");
        const a = await createMission("Oxygen Crisis");
        const b = await createMission("Engine Failure");

        const results = await Promise.allSettled([
            assignmentRepository.createActive(a._id, orion._id),
            assignmentRepository.createActive(b._id, orion._id)
        ]);

        const fulfilled = results.filter((r) => r.status === "fulfilled");
        const rejected = results.filter((r) => r.status === "rejected");
        assert.equal(fulfilled.length, 1);
        assert.equal(rejected.length, 1);
        assert.equal(rejected[0].reason.code, 11000);   //MongoDB dubletfejl
        assert.ok(rejected[0].reason.keyPattern.shipId, "Det er indekset på shipId, der afviser");
        assert.equal(await Assignment.countDocuments({ shipId: orion._id, status: "active" }), 1);
    });
});
