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

## Konfiguration

Konfiguration ligger i `.env` (som aldrig committes). Se `.env.example`:

| Variabel | Standard | Beskrivelse |
|---|---|---|
| `PORT` | `3000` | Porten API'et lytter på |
| `MONGODB_URI` | `mongodb://localhost:27017/spacerescue` | Forbindelse til MongoDB |
| `INFORMATION_SYSTEM_URL` | `http://localhost:4000` | Det eksterne informationssystem |

`.env` indlæses med Node's indbyggede `--env-file-if-exists`, så der er ingen afhængighed af `dotenv`.

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
│   ├── middleware/       # Logger, validering og fejlhåndtering
│   └── clients/          # Kommunikation med andre HTTP-systemer
├── information-system/   # Separat Express-program, der modtager notifikationer
├── scripts/              # Fx seed af startdata
├── tests/                # Automatiserede tests (node:test)
└── public/               # Statiske filer
```

## Postman

Requests og dokumentation samles i Postman-collectionen **"Space Rescue Collection"**. Collection-variablen `baseUrl` peger på `http://localhost:3000`.

---

*Arkitekturdiagram, API-oversigt, testbeskrivelse og afsnittet "AI-agenter og kvalitetssikring" tilføjes i de kommende Issues.*
