const mongoose = require("mongoose");

//Et rumskibs mulige statusser
const SHIP_STATUSES = ["available", "busy"];

const shipSchema = new mongoose.Schema(
    {
        //unique: MongoDB opretter et unikt indeks, så to skibe aldrig kan hedde det samme -
        //heller ikke hvis to requests forsøger at oprette samme navn samtidigt.
        name: { type: String, required: true, trim: true, unique: true },
        type: { type: String, required: true, trim: true },
        status: { type: String, enum: SHIP_STATUSES, default: "available" }
    },
    {
        timestamps: true,    //createdAt og updatedAt sættes automatisk
        versionKey: false    //Fjerner Mongoose' interne __v-felt
    }
);

const Ship = mongoose.model("Ship", shipSchema);

module.exports = { Ship, SHIP_STATUSES };
