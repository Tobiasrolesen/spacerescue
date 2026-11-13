const morgan = require("morgan");
const { logger } = require("../utils/logger");

//Vælger log-niveau ud fra statuskoden
function levelForStatus(status) {
    if (status === null) return "warn";   //Klienten afbrød, før der blev svaret
    if (status >= 500) return "error";
    if (status >= 400) return "warn";
    return "info";
}

//morgan samler metadata om requesten. Vi logger KUN metadata –
//aldrig body, headers eller andet, der kan indeholde følsomme data.
function format(tokens, req, res) {
    const status = tokens.status(req, res);
    const responseTime = tokens["response-time"](req, res);

    return JSON.stringify({
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: status ? Number(status) : null,
        responseTimeMs: responseTime ? Number(responseTime) : null
    });
}

//morgan skriver hver linje til denne "stream", som sender den videre til winston
const stream = {
    write(line) {
        const request = JSON.parse(line);
        const status = request.status ?? "afbrudt";
        const time = request.responseTimeMs ?? "-";
        const message = `${request.method} ${request.url} ${status} ${time}ms`;

        logger.log(levelForStatus(request.status), message, { type: "http", ...request });
    }
};

const requestLogger = morgan(format, { stream });

module.exports = requestLogger;
