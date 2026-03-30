import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const createSmsVerificationChallenge: RequestHandler = function (req, res, next) {
    next(
        new InternalServerError(
            "NOT IMPLEMENTED: createSmsVerificationChallenge",
            new Error("NOT IMPLEMENTED")
        )
    );
};

export { createSmsVerificationChallenge };
