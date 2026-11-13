const mongoose = require("mongoose");

//En tildeling af et rumskib til en mission.
//active    = skibet er på missionen
//completed = missionen er afsluttet, og skibet er frigivet (Issue #9)
const ASSIGNMENT_STATUSES = ["active", "completed"];

const assignmentSchema = new mongoose.Schema(
    {
        missionId: { type: mongoose.Schema.Types.ObjectId, ref: "Mission", required: true },
        shipId: { type: mongoose.Schema.Types.ObjectId, ref: "Ship", required: true },
        status: { type: String, enum: ASSIGNMENT_STATUSES, default: "active" }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

//DATABASEGARANTIEN mod dobbelt tildeling.
//Et partielt unikt indeks gælder kun for dokumenter, der matcher partialFilterExpression.
//Derfor kan et skib have mange AFSLUTTEDE tildelinger, men kun én AKTIV.
//Forsøger to requests at indsætte en aktiv tildeling af Orion samtidigt,
//afviser MongoDB den ene med en dubletfejl (kode 11000) - uanset timing i JavaScript.

//Et rumskib må kun være tildelt én aktiv mission ad gangen
assignmentSchema.index(
    { shipId: 1 },
    { unique: true, partialFilterExpression: { status: "active" }, name: "unique_active_ship" }
);

//En mission må kun have ét aktivt rumskib
assignmentSchema.index(
    { missionId: 1 },
    { unique: true, partialFilterExpression: { status: "active" }, name: "unique_active_mission" }
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = { Assignment, ASSIGNMENT_STATUSES };
