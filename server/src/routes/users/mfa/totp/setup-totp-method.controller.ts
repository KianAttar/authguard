import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const setupTotpMfaMethod: RequestHandler = function (req, res, next) {
    next(
        new InternalServerError("NOT IMPLEMENTED: setupTotpMfaMethod", new Error("NOT IMPLEMENTED"))
    );
};

export { setupTotpMfaMethod };
