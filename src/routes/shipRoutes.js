const express = require("express");
const shipController = require("../controllers/shipController");

//Routes: forbinder HTTP-metoder og URL'er med controllere.
//Monteres på /api/ships i app.js
const router = express.Router();

router.get("/", shipController.getAll);
router.get("/:id", shipController.getById);
router.post("/", shipController.create);

module.exports = router;
