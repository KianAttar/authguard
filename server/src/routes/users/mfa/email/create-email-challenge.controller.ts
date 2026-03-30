import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const createEmailVerificationChallenge: RequestHandler = function (req, res, next) {
    next(
        new InternalServerError(
            "NOT IMPLEMENTED: createEmailVerificationChallenge",
            new Error("NOT IMPLEMENTED")
        )
    );
};

export { createEmailVerificationChallenge };
