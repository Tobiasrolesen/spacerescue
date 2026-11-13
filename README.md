# SpaceRescue – Galaksens redningscentral

Året er 2479. SpaceRescue er backend'en for galaksens centrale redningstjeneste. Systemet administrerer **rumskibe**, **redningsmissioner** og **tildelinger** af rumskibe til missioner – også når flere operatører arbejder samtidigt, så et skib aldrig bliver tildelt to missioner på én gang.

Systemet er et REST API bygget med **Node.js**, **Express** og **MongoDB** (via Mongoose). Der er ingen grafisk brugerflade; API'et demonstreres med Postman.

> Projektet udvikles Issue for Issue. Se [Issues](https://github.com/Tobiasrolesen/spacerescue/issues) og [SpaceRescue Board](https://github.com/users/Tobiasrolesen/projects/9).

## Krav

- [Node.js](https://nodejs.org/) 22 eller nyere
- [MongoDB](https://www.mongodb.com/try/download/community) kørende lokalt på `localhost:27017` (fx sammen med MongoDB Compass)

## Kom i gang

```bash
# 1. Hent projektet
git clone https://github.com/Tobiasrolesen/spacerescue.git
cd spacerescue

# 2. Installer afhængigheder
npm install

# 3. Opret din lokale konfiguration
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env

# 4. Start serveren
npm start                   # eller: npm run dev  (genstarter automatisk ved ændringer)
```

Når serveren kører, ser du:

```
Forbundet til MongoDB (localhost:27017/spacerescue)
SpaceRescue kører på http://localhost:3000
```

Kan MongoDB ikke nås, skriver serveren en tydelig fejl og stopper i stedet for at starte uden database.

### Startdata

```bash
npm run seed
```

Opretter rumskibene **Orion** (Rescue), **Voyager** (Transport) og **Discovery** (Research) samt de to nødsituationer fra casen på Kepler-186f: **Oxygen Crisis** (forskningsstationen mangler ilt) og **Engine Failure** (fragtskibet har mistet sin motor). Scriptet kan køres flere gange: data, der allerede findes, springes over og bliver ikke ændret.

## API

| HTTP | Endpoint | Funktion | Svar |
|---|---|---|---|
| GET | `/api/ships` | Hent alle rumskibe | `200` |
| GET | `/api/ships/:id` | Hent ét rumskib | `200`, `400 VALIDATION_ERROR`, `404 SHIP_NOT_FOUND` |
| POST | `/api/ships` | Opret rumskib | `201`, `400 VALIDATION_ERROR`, `409 SHIP_NAME_TAKEN` |
| GET | `/api/missions` | Hent alle missioner (nyeste først) | `200` |
| GET | `/api/missions/:id` | Hent én mission | `200`, `400 VALIDATION_ERROR`, `404 MISSION_NOT_FOUND` |
| POST | `/api/missions` | Opret mission | `201`, `400 VALIDATION_ERROR` |
| POST | `/api/missions/:id/assign` | Tildel rumskib til mission | `201`, `400 VALIDATION_ERROR`, `404 MISSION_NOT_FOUND` / `SHIP_NOT_FOUND`, `409 SHIP_UNAVAILABLE` / `MISSION_ALREADY_ASSIGNED` / `MISSION_COMPLETED` |
| GET | `/api/missions/:id/assignment` | Hent missionens aktive tildeling | `200`, `400 VALIDATION_ERROR`, `404 MISSION_NOT_FOUND` / `ASSIGNMENT_NOT_FOUND` |

### Rumskibe

```json
POST /api/ships
{ "name": "Orion", "type": "Rescue" }
```

Et nyt rumskib får automatisk `"status": "available"`. Skibsnavne er unikke – det håndhæves af et unikt indeks i MongoDB, så reglen også holder, når to requests ankommer samtidigt.

### Missioner

```json
POST /api/missions
{
  "title": "Oxygen Crisis",
  "destination": "Kepler-186f",
  "description": "Research station is running out of oxygen"
}
```

En ny mission får automatisk `"status": "pending"`. `title` og `destination` er påkrævet, `description` er valgfri.

| Status | Betydning |
|---|---|
| `pending` | Oprettet, venter på et rumskib |
| `active` | Et rumskib er tildelt |
| `completed` | Missionen er afsluttet |

### Tildeling af rumskibe

```json
POST /api/missions/:id/assign
{ "shipId": "6af6e19c1e89a46ce0e01b84" }
```

```json
201 Created
{ "_id": "...", "missionId": "...", "shipId": "...", "status": "active", "createdAt": "..." }
```

Reglerne:

- Et rumskib må kun være tildelt **én aktiv mission** ad gangen → ellers `409 SHIP_UNAVAILABLE`
- En mission må kun have **ét aktivt rumskib** → ellers `409 MISSION_ALREADY_ASSIGNED`
- En afsluttet mission kan ikke få et rumskib → `409 MISSION_COMPLETED`
- Ukendte missioner og rumskibe → `404`

#### Databasegarantien mod dobbelt tildeling

Det er **ikke** nok at tjekke "er Orion ledig?" i JavaScript og derefter gemme. To operatører kan begge nå at læse "ledig", før nogen af dem har gemt – `async/await` ændrer ikke på det, fordi andre requests kan køre, mens vi venter på databasen.

Derfor gemmes tildelinger i en separat `assignments`-collection med to **partielle unikke indeks** (`src/models/assignmentModel.js`):

| Indeks | Felt | Gælder for | Betyder |
|---|---|---|---|
| `unique_active_ship` | `shipId` | `status: "active"` | Et skib kan kun have én aktiv tildeling |
| `unique_active_mission` | `missionId` | `status: "active"` | En mission kan kun have én aktiv tildeling |

Indekset er *partielt*, så et skib godt kan have mange **afsluttede** tildelinger, men kun én **aktiv**. Ankommer to requests samtidigt, kan MongoDB kun indsætte den ene – den anden afvises med dubletfejl `11000`, som `missionService` oversætter til `409`. Indeksene oprettes ved opstart, før serveren tager imod requests.

Flowet i `missionService.assignShip()`:

1. Find mission og skib (`404` hvis de ikke findes; `409` hvis missionen er afsluttet).
2. **Indsæt aktiv tildeling** – her afgør databasen, om skibet/missionen er optaget.
3. Opdatér skibet til `busy` og missionen til `active` med **betingede, atomiske** opdateringer ("kun hvis stadig `available`/`pending`").
4. Fejler trin 3, slettes tildelingen og statusændringerne rulles tilbage, så der ikke opstår en halv tilstand. (Uden replica set har en lokal MongoDB ikke transaktioner, derfor denne kompensation.)

`status` på skib og mission er en visning til oversigterne; den autoritative sandhed om, hvem der er tildelt hvad, ligger i `assignments`.

### Validering

Input valideres med **Joi** i `src/middleware/validate.js`, *før* requesten når controlleren. Skemaerne ligger i `src/validators/`.

- Alle fejl findes på én gang og returneres som `400 VALIDATION_ERROR` med en `details`-liste pr. felt.
- Ukendte felter afvises, så klienten opdager stavefejl og forsøg på at sende felter, der ikke må sættes.
- `status` må ved oprettelse kun have startværdien (`available` for skibe, `pending` for missioner). Status ændres kun gennem tildeling og afslutning.
- Ugyldige id'er (fx `/api/ships/abc`) afvises, før de når MongoDB.
- Strenge trimmes, så `"  Orion  "` gemmes som `"Orion"`.

```json
400 Bad Request
{
  "error": "VALIDATION_ERROR",
  "message": "Ugyldigt input",
  "details": [
    { "field": "name", "message": "\"name\" er påkrævet" },
    { "field": "hacker", "message": "\"hacker\" er ikke et tilladt felt" }
  ]
}
```

### Fejlformat

Alle fejl returneres som JSON med en maskinlæsbar kode og en forståelig besked:

```json
{ "error": "SHIP_NOT_FOUND", "message": "Rumskib med id 000000000000000000000000 findes ikke" }
```

Services og middleware kaster fejlklasser fra `src/errors/AppError.js` (`ValidationError`, `NotFoundError`, `ConflictError`), og `src/middleware/errorHandler.js` oversætter dem til HTTP-svar. Uventede fejl giver `500` uden tekniske detaljer; detaljerne logges.

## Konfiguration

Konfiguration ligger i `.env` (som aldrig committes). Se `.env.example`:

| Variabel | Standard | Beskrivelse |
|---|---|---|
| `PORT` | `3000` | Porten API'et lytter på |
| `MONGODB_URI` | `mongodb://localhost:27017/spacerescue` | Forbindelse til MongoDB |
| `INFORMATION_SYSTEM_URL` | `http://localhost:4000` | Det eksterne informationssystem |

`.env` indlæses med Node's indbyggede `--env-file-if-exists`, så der er ingen afhængighed af `dotenv`.

## Logging

SpaceRescue logger med **winston** (fælles logger i `src/utils/logger.js`) og **morgan** (request-middleware i `src/middleware/requestLogger.js`).

- **Konsol:** læsevenlige linjer, fx `[2026-11-13 14:02:11] warn: GET /findes-ikke 404 0.9ms`
- **Fil:** `logs/spacerescue.log` – én JSON-linje pr. hændelse (tidspunkt i UTC). Mappen oprettes automatisk og committes ikke.
- **Niveauer:** 2xx/3xx → `info`, 4xx → `warn`, 5xx → `error`. Opstart, databaseforbindelse og nedlukning logges også.
- **Kun metadata:** metode, URL, statuskode og svartid. Bodies, headers og forbindelsesstrengen til MongoDB logges aldrig.
- Filstien er fast i koden og kan ikke påvirkes af en request.

## Projektstruktur

```
spacerescue/
├── src/
│   ├── app.js            # Express-opsætning (lytter ikke på en port → kan testes)
│   ├── server.js         # Opstart: forbinder til MongoDB og starter serveren
│   ├── config/           # Databaseforbindelse
│   ├── routes/           # HTTP-metoder og URL'er → controllers
│   ├── controllers/      # Modtager requests og sender HTTP-svar
│   ├── services/         # Forretningsregler
│   ├── repositories/     # Henter og gemmer data i MongoDB
│   ├── models/           # Mongoose-skemaer
│   ├── middleware/       # Request-logger, validering og fejlhåndtering
│   ├── clients/          # Kommunikation med andre HTTP-systemer
│   ├── validators/       # Joi-skemaer til validering af input
│   ├── errors/           # Fejlklasser (ValidationError, NotFoundError, ConflictError)
│   └── utils/            # Fælles værktøjer, fx winston-loggeren
├── information-system/   # Separat Express-program, der modtager notifikationer
├── scripts/              # Fx seed af startdata
├── tests/                # Automatiserede tests (node:test)
└── public/               # Statiske filer
```

## Postman

Requests og dokumentation samles i Postman-collectionen **"Space Rescue Collection"**. Collection-variablen `baseUrl` peger på `http://localhost:3000`.

---

*Arkitekturdiagram, API-oversigt, testbeskrivelse og afsnittet "AI-agenter og kvalitetssikring" tilføjes i de kommende Issues.*
