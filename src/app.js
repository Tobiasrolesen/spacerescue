const express = require("express");
const path = require("path");
const requestLogger = require("./middleware/requestLogger");

const app = express();

//Registrering af middleware
//Loggeren registreres først, så alle requests bliver logget
app.use(requestLogger);
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

//Routes monteres her i de kommende Issues (fx /api/ships og /api/missions)

//app.js starter ikke selv serveren - det gør server.js.
//Derfor kan appen bruges i tests uden at lytte på en port.
module.exports = app;
