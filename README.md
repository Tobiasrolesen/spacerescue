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

Opretter rumskibene **Orion** (Rescue), **Voyager** (Transport) og **Discovery** (Research). Scriptet kan køres flere gange: skibe, der allerede findes, springes over og bliver ikke ændret.

## API

| HTTP | Endpoint | Funktion | Svar |
|---|---|---|---|
| GET | `/api/ships` | Hent alle rumskibe | `200` |
| GET | `/api/ships/:id` | Hent ét rumskib | `200`, `400 VALIDATION_ERROR`, `404 SHIP_NOT_FOUND` |
| POST | `/api/ships` | Opret rumskib | `201`, `400 VALIDATION_ERROR`, `409 SHIP_NAME_TAKEN` |

Eksempel på oprettelse:

```json
POST /api/ships
{ "name": "Orion", "type": "Rescue" }
```

Et nyt rumskib får automatisk `"status": "available"`. Skibsnavne er unikke – det håndhæves af et unikt indeks i MongoDB, så reglen også holder, når to requests ankommer samtidigt.

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
