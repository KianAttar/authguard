import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const removeTotpMfaMethod: RequestHandler = function (req, res, next) {
    next(
        new InternalServerError(
            "NOT IMPLEMENTED: removeTotpMfaMethod",
            new Error("NOT IMPLEMENTED")
        )
    );
};

export { removeTotpMfaMethod };
