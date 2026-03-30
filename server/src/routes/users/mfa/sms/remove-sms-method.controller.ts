import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const removeSmsMfaMethod: RequestHandler = function (req, res, next) {
    next(
        new InternalServerError("NOT IMPLEMENTED: removeSmsMfaMethod", new Error("NOT IMPLEMENTED"))
    );
};

export { removeSmsMfaMethod };
