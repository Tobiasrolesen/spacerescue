const Joi = require("joi");

//Fælles regler og fejlbeskeder, som alle validators bruger.

//Et MongoDB-id består af præcis 24 hexadecimale tegn.
//Ved at tjekke det her, når et ugyldigt id som "abc" aldrig databasen (ellers 500).
const objectId = Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({ "string.pattern.base": "{{#label}} skal være et gyldigt ID" });

//Bruges til routes med :id i URL'en, fx GET /api/ships/:id
const idParamSchema = Joi.object({
    id: objectId.required()
});

//Danske fejlbeskeder. {{#label}} er feltets navn, {{#limit}} grænsen osv.
const DANISH_MESSAGES = {
    "any.required": "{{#label}} er påkrævet",
    "any.only": "{{#label}} skal være en af: {{#valids}}",
    "string.base": "{{#label}} skal være tekst",
    "string.empty": "{{#label}} må ikke være tom",
    "string.min": "{{#label}} skal være mindst {{#limit}} tegn",
    "string.max": "{{#label}} må højst være {{#limit}} tegn",
    "object.base": "Body skal være et JSON-objekt",
    "object.unknown": "{{#label}} er ikke et tilladt felt"
};

module.exports = { objectId, idParamSchema, DANISH_MESSAGES };
