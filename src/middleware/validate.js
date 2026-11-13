const { ValidationError } = require("../errors/AppError");
const { DANISH_MESSAGES } = require("../validators/commonValidator");

//Genbrugelig validerings-middleware.
//Brug: router.post("/", validate(createShipSchema), controller.create)
//      router.get("/:id", validate(idParamSchema, "params"), controller.getById)
function validate(schema, property = "body") {
    return (req, res, next) => {
        //Mangler body helt, validerer vi et tomt objekt, så "påkrævet"-fejlene vises
        const input = req[property] ?? {};

        const { error, value } = schema.validate(input, {
            abortEarly: false,          //Find ALLE fejl, ikke kun den første
            messages: DANISH_MESSAGES
        });

        if (error) {
            const details = error.details.map((detail) => ({
                field: detail.path.join(".") || property,   //Tom sti = fejl i hele body'en
                message: detail.message
            }));
            return next(new ValidationError(details));
        }

        //Body erstattes af de rensede data (fx trimmede strenge).
        //Params ændres ikke - de bliver kun kontrolleret.
        if (property === "body") {
            req.body = value;
        }
        next();
    };
}

module.exports = validate;
