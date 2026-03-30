import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const setupSmsMfaMethod: RequestHandler = function (req, res, next) {
    next(
        new InternalServerError("NOT IMPLEMENTED: setupSmsMfaMethod", new Error("NOT IMPLEMENTED"))
    );
};

export { setupSmsMfaMethod };
