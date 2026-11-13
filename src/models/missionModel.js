const mongoose = require("mongoose");

//En missions mulige statusser:
//pending   = oprettet, venter på et rumskib
//active    = et rumskib er tildelt
//completed = missionen er afsluttet
const MISSION_STATUSES = ["pending", "active", "completed"];

const missionSchema = new mongoose.Schema(
    {
        //Titler er ikke unikke - to forskellige nødsituationer kan godt hedde det samme
        title: { type: String, required: true, trim: true },
        destination: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: "" },
        status: { type: String, enum: MISSION_STATUSES, default: "pending" }
    },
    {
        timestamps: true,    //createdAt og updatedAt sættes automatisk
        versionKey: false    //Fjerner Mongoose' interne __v-felt
    }
);

const Mission = mongoose.model("Mission", missionSchema);

module.exports = { Mission, MISSION_STATUSES };
