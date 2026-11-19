//Integrationstests af kommunikationen med informationssystemet (Issue #10).
//
//Testen starter sit eget FALSKE informationssystem på en tilfældig port, så den ikke
//afhænger af, at det rigtige program kører. Det falske system kan sættes til at
//svare normalt, aldrig svare (timeout) eller svare med en fejl.
//
//Kravet: en gyldig lokal tildeling må ALDRIG bortfalde, fordi informationssystemet fejler.

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const { startTestServer, stopTestServer, resetDatabase, createShip, createMission } = require("./helpers/testServer");
const { Assignment } = require("../src/models/assignmentModel");
const { Ship } = require("../src/models/shipModel");

let baseUrl;
let fakeServer;
let fakeUrl;
let mode;                 //"ok" | "hang" | "error"
let received = [];

//Et falsk informationssystem, der opfører sig som "mode" siger
function startFakeInformationSystem() {
    const app = express();
    app.use(express.json());
    app.post("/api/notifications", (req, res) => {
        if (mode === "hang") return;                        //Svarer aldrig
        if (mode === "error") return res.status(500).json({ error: "BOOM" });
        received.push(req.body);
        res.status(201).json({ status: "received" });
    });
    fakeServer = app.listen(0);
    return once(fakeServer, "listening").then(() => `http://127.0.0.1:${fakeServer.address().port}`);
}

async function assign(missionId, shipId) {
    const res = await fetch(`${baseUrl}/missions/${missionId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipId: String(shipId) })
    });
    return { status: res.status, body: await res.json() };
}

//Kontrollerer i databasen, at tildelingen er gemt og skibet optaget
async function assertAssignmentSaved(missionId, shipId) {
    assert.equal(await Assignment.countDocuments({ missionId, shipId, status: "active" }), 1, "Tildelingen skal være gemt");
    assert.equal((await Ship.findById(shipId)).status, "busy", "Skibet skal være busy");
}

describe("Notifikation til informationssystemet", () => {
    before(async () => {
        baseUrl = await startTestServer();
        fakeUrl = await startFakeInformationSystem();
    });

    after(async () => {
        fakeServer.closeAllConnections();   //Lukker også "hængende" forbindelser
        fakeServer.close();
        await stopTestServer();
    });

    beforeEach(async () => {
        await resetDatabase();
        received = [];
        mode = "ok";
        process.env.INFORMATION_SYSTEM_URL = fakeUrl;
        process.env.NOTIFICATION_TIMEOUT_MS = "500";
    });

    it("informationssystemet kører - beskeden sendes med de rigtige data", async () => {
        const orion = await createShip("Orion");
        const oxygen = await createMission("Oxygen Crisis");

        const res = await assign(oxygen._id, orion._id);

        assert.equal(res.status, 201);
        assert.equal(res.body.notification, "sent");
        assert.deepEqual(received, [
            { event: "MISSION_ASSIGNED", missionId: String(oxygen._id), shipId: String(orion._id) }
        ]);
        await assertAssignmentSaved(oxygen._id, orion._id);
    });

    it("informationssystemet er nede - tildelingen gennemføres og beholdes", async () => {
        process.env.INFORMATION_SYSTEM_URL = "http://127.0.0.1:1";   //Ingen lytter her
        const orion = await createShip("Orion");
        const oxygen = await createMission("Oxygen Crisis");

        const res = await assign(oxygen._id, orion._id);

        assert.equal(res.status, 201);
        assert.equal(res.body.notification, "failed");
        await assertAssignmentSaved(oxygen._id, orion._id);
    });

    it("informationssystemet svarer aldrig - timeout, og tildelingen beholdes", async () => {
        mode = "hang";
        const orion = await createShip("Orion");
        const oxygen = await createMission("Oxygen Crisis");

        const started = Date.now();
        const res = await assign(oxygen._id, orion._id);
        const elapsed = Date.now() - started;

        assert.equal(res.status, 201);
        assert.equal(res.body.notification, "failed");
        assert.ok(elapsed >= 450 && elapsed < 3000, `Skal give op efter ca. 500 ms timeout (tog ${elapsed} ms)`);
        await assertAssignmentSaved(oxygen._id, orion._id);
    });

    it("informationssystemet svarer med fejl (500) - tildelingen beholdes", async () => {
        mode = "error";
        const orion = await createShip("Orion");
        const oxygen = await createMission("Oxygen Crisis");

        const res = await assign(oxygen._id, orion._id);

        assert.equal(res.status, 201);
        assert.equal(res.body.notification, "failed");
        await assertAssignmentSaved(oxygen._id, orion._id);
    });

    it("afviste tildelinger sender ingen notifikation", async () => {
        const orion = await createShip("Orion");
        const a = await createMission("Oxygen Crisis");
        const b = await createMission("Engine Failure");

        await assign(a._id, orion._id);
        const rejected = await assign(b._id, orion._id);

        assert.equal(rejected.status, 409);
        assert.equal(received.length, 1, "Kun den gennemførte tildeling må give en notifikation");
    });
});
