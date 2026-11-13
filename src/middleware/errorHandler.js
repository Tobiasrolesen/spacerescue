const { AppError } = require("../errors/AppError");
const { logger } = require("../utils/logger");

//Central fejlhåndtering. Express 5 sender automatisk fejl fra async-funktioner hertil.
//Minimal udgave - udvides i Issue #11 (ukendte routes, databasefejl m.m.).
function errorHandler(err, req, res, next) {
    //Vores egne, forventede fejl (fx NotFoundError)
    if (err instanceof AppError) {
        const body = { error: err.code, message: err.message };
        if (err.details) {
            body.details = err.details;   //Fx valideringsfejl pr. felt
        }
        return res.status(err.statusCode).json(body);
    }

    //Klientfejl fra Express selv, fx ugyldig JSON i body (400)
    if (err.status >= 400 && err.status < 500) {
        return res.status(err.status).json({ error: "BAD_REQUEST", message: "Requesten kunne ikke behandles" });
    }

    //Alt andet er en uventet fejl. Detaljerne logges, men sendes ikke til klienten.
    logger.error(`Uventet fejl: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Der opstod en uventet fejl" });
}

module.exports = errorHandler;
