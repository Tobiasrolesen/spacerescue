const Joi = require("joi");

//Regler for oprettelse af et rumskib (POST /api/ships).
//Felter, der ikke står her, afvises automatisk af Joi.
const createShipSchema = Joi.object({
    name: Joi.string().trim().min(1).max(50).required(),
    type: Joi.string().trim().min(1).max(50).required(),

    //Status er valgfri, men kun startværdien er tilladt.
    //Et skib bliver kun "busy" gennem en tildeling - aldrig ved oprettelse.
    status: Joi.string().valid("available")
});

module.exports = { createShipSchema };
