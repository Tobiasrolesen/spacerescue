const shipService = require("../services/shipService");

//Controller: oversætter mellem HTTP og service-laget.
//Fejl kastet i servicen sendes automatisk videre til errorHandler af Express 5.

async function getAll(req, res) {
    const ships = await shipService.getAllShips();
    res.status(200).json(ships);
}

async function getById(req, res) {
    const ship = await shipService.getShipById(req.params.id);
    res.status(200).json(ship);
}

async function create(req, res) {
    const ship = await shipService.createShip(req.body);
    res.status(201).json(ship);
}

module.exports = { getAll, getById, create };
