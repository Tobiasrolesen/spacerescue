const express = require("express");
const path = require("path");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const shipRoutes = require("./routes/shipRoutes");
const missionRoutes = require("./routes/missionRoutes");

const app = express();

//Registrering af middleware
//Loggeren registreres først, så alle requests bliver logget
app.use(requestLogger);
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

//Routes
app.use("/api/ships", shipRoutes);
app.use("/api/missions", missionRoutes);

//Fejlhåndtering registreres til sidst, så den fanger fejl fra alle routes
app.use(errorHandler);

//app.js starter ikke selv serveren - det gør server.js.
//Derfor kan appen bruges i tests uden at lytte på en port.
module.exports = app;
