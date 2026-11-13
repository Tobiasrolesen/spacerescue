//Fælles fejlklasse for forventede fejl i SpaceRescue.
//Services kaster disse fejl, og errorHandler-middleware oversætter dem til HTTP-svar.
//På den måde behøver services ikke kende til HTTP, og controllers ikke til forretningsregler.
class AppError extends Error {
    constructor(statusCode, code, message) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;   //HTTP-statuskode, fx 404
        this.code = code;               //Maskinlæsbar fejlkode, fx "SHIP_NOT_FOUND"
    }
}

//Ugyldigt input fra klienten (400). details indeholder én linje pr. fejl.
class ValidationError extends AppError {
    constructor(details) {
        super(400, "VALIDATION_ERROR", "Ugyldigt input");
        this.details = details;
    }
}

//Ressourcen findes ikke (404)
class NotFoundError extends AppError {
    constructor(code, message) {
        super(404, code, message);
    }
}

//Handlingen strider mod systemets tilstand, fx et navn der allerede er taget (409)
class ConflictError extends AppError {
    constructor(code, message) {
        super(409, code, message);
    }
}

module.exports = { AppError, ValidationError, NotFoundError, ConflictError };
