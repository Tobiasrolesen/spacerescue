const shipRepository = require("../repositories/shipRepository");
const { NotFoundError, ConflictError } = require("../errors/AppError");

//MongoDB's fejlkode, når et unikt indeks ville blive brudt
const DUPLICATE_KEY_ERROR = 11000;

//Service: forretningsregler for rumskibe. Kender hverken req, res eller HTTP.

async function getAllShips() {
    return shipRepository.findAll();
}

async function getShipById(id) {
    const ship = await shipRepository.findById(id);
    if (!ship) {
        throw new NotFoundError("SHIP_NOT_FOUND", `Rumskib med id ${id} findes ikke`);
    }
    return ship;
}

async function createShip(data) {
    try {
        return await shipRepository.create(data);
    } catch (err) {
        //Det er databasens unikke indeks, der afgør, om navnet er taget.
        //Derfor virker reglen også ved to samtidige requests.
        if (err.code === DUPLICATE_KEY_ERROR) {
            throw new ConflictError("SHIP_NAME_TAKEN", `Der findes allerede et rumskib med navnet ${data.name}`);
        }
        throw err;
    }
}

module.exports = { getAllShips, getShipById, createShip };
