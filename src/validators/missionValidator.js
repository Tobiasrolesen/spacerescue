const Joi = require("joi");
const { objectId } = require("./commonValidator");

//Regler for oprettelse af en mission (POST /api/missions) - tages i brug i Issue #6
const createMissionSchema = Joi.object({
    title: Joi.string().trim().min(1).max(100).required(),
    destination: Joi.string().trim().min(1).max(100).required(),
    description: Joi.string().trim().max(500).allow(""),

    //Status er valgfri, men kun startværdien er tilladt.
    //En mission skifter kun status gennem tildeling og afslutning.
    status: Joi.string().valid("pending")
});

//Regler for tildeling af rumskib (POST /api/missions/:id/assign) - tages i brug i Issue #7
const assignShipSchema = Joi.object({
    shipId: objectId.required()
});

module.exports = { createMissionSchema, assignShipSchema };
