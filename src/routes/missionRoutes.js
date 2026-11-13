const express = require("express");
const missionController = require("../controllers/missionController");
const validate = require("../middleware/validate");
const { idParamSchema } = require("../validators/commonValidator");
const { createMissionSchema, assignShipSchema } = require("../validators/missionValidator");

//Routes: forbinder HTTP-metoder og URL'er med controllere.
//Validering sker i middleware FØR controlleren, så ugyldige data aldrig når service-laget.
//Monteres på /api/missions i app.js
const router = express.Router();

router.get("/", missionController.getAll);
router.get("/:id", validate(idParamSchema, "params"), missionController.getById);
router.post("/", validate(createMissionSchema), missionController.create);

//Tildeling af rumskib
router.post(
    "/:id/assign",
    validate(idParamSchema, "params"),
    validate(assignShipSchema),
    missionController.assign
);
router.get("/:id/assignment", validate(idParamSchema, "params"), missionController.getAssignment);

module.exports = router;
