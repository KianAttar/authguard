import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const verifyEmailChallenge: RequestHandler = function (req, res, next) {
    next(
        new InternalServerError(
            "NOT IMPLEMENTED: verifyEmailChallenge",
            new Error("NOT IMPLEMENTED")
        )
    );
};

export { verifyEmailChallenge };
