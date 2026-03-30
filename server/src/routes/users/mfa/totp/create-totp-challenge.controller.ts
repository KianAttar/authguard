import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const createTotpVerificationChallenge: RequestHandler = function (req, res, next) {
    next(
        new InternalServerError(
            "NOT IMPLEMENTED: createTotpVerificationChallenge",
            new Error("NOT IMPLEMENTED")
        )
    );
};

export { createTotpVerificationChallenge };
