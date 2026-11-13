const express = require("express");
const shipController = require("../controllers/shipController");
const validate = require("../middleware/validate");
const { idParamSchema } = require("../validators/commonValidator");
const { createShipSchema } = require("../validators/shipValidator");

//Routes: forbinder HTTP-metoder og URL'er med controllere.
//Validering sker i middleware FØR controlleren, så ugyldige data aldrig når service-laget.
//Monteres på /api/ships i app.js
const router = express.Router();

router.get("/", shipController.getAll);
router.get("/:id", validate(idParamSchema, "params"), shipController.getById);
router.post("/", validate(createShipSchema), shipController.create);

module.exports = router;
