//Informationssystemet - et SELVSTÆNDIGT program, der kører i sin egen proces på sin egen port.
//Det deler ingen kode med SpaceRescue og modtager kun beskeder via HTTP.
//Start: npm run info-system

const express = require("express");

const PORT = process.env.INFO_PORT || 4000;

//Kun til demonstration: forsinker hvert svar, så man kan se SpaceRescues timeout i aktion.
//Fx: INFO_DELAY_MS=5000 (sættes i .env eller i terminalen)
const DELAY_MS = Number(process.env.INFO_DELAY_MS) || 0;

const app = express();
app.use(express.json());

//Modtagne notifikationer gemmes i hukommelsen, så de kan vises med GET
const received = [];

app.post("/api/notifications", async (req, res) => {
    const { event, missionId, shipId } = req.body ?? {};

    if (!event || !missionId || !shipId) {
        return res.status(400).json({ error: "INVALID_NOTIFICATION", message: "event, missionId og shipId er påkrævet" });
    }

    if (DELAY_MS > 0) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }

    const notification = { event, missionId, shipId, receivedAt: new Date().toISOString() };
    received.push(notification);
    console.log(`[Informationssystem] ${event}: rumskib ${shipId} er tildelt mission ${missionId}`);

    res.status(201).json({ status: "received" });
});

app.get("/api/notifications", (req, res) => {
    res.status(200).json(received);
});

app.listen(PORT, () => {
    console.log(`Informationssystemet kører på http://localhost:${PORT}` + (DELAY_MS ? ` (forsinkelse ${DELAY_MS} ms)` : ""));
});
