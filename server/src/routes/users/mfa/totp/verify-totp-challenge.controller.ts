import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const verifyTotpChallenge: RequestHandler = function (req, res, next) {
    next(
        new InternalServerError(
            "NOT IMPLEMENTED: verifyTotpChallenge",
            new Error("NOT IMPLEMENTED")
        )
    );
};

export { verifyTotpChallenge };
