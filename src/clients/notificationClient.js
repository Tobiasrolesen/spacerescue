//External client: det ENESTE sted i SpaceRescue, der ved, hvordan man taler med
//informationssystemet (URL, HTTP-metode, JSON-format, timeout og fejl).
//Samme rolle over for et andet HTTP-system, som et repository har over for MongoDB.

const DEFAULT_URL = "http://localhost:4000";
const DEFAULT_TIMEOUT_MS = 3000;

//Sender besked om en gennemført tildeling. Kaster en fejl, hvis beskeden ikke kom frem.
async function notifyAssignment(missionId, shipId) {
    //Læses ved hvert kald, så tests kan pege klienten mod et testsystem
    const baseUrl = process.env.INFORMATION_SYSTEM_URL || DEFAULT_URL;
    const timeoutMs = Number(process.env.NOTIFICATION_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

    let res;
    try {
        res = await fetch(`${baseUrl}/api/notifications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event: "MISSION_ASSIGNED",
                missionId: String(missionId),
                shipId: String(shipId)
            }),
            //Uden timeout ville vi vente for evigt, hvis informationssystemet aldrig svarer.
            //AbortSignal.timeout afbryder kaldet efter timeoutMs millisekunder.
            signal: AbortSignal.timeout(timeoutMs)
        });
    } catch (err) {
        if (err.name === "TimeoutError") {
            throw new Error(`Informationssystemet svarede ikke inden for ${timeoutMs} ms`);
        }
        throw new Error(`Kunne ikke kontakte informationssystemet: ${err.cause?.code ?? err.message}`);
    }

    if (!res.ok) {
        throw new Error(`Informationssystemet svarede med status ${res.status}`);
    }
}

module.exports = { notifyAssignment };
