import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const verifySmsChallenge: RequestHandler = function (req, res, next) {
    next(
        new InternalServerError("NOT IMPLEMENTED: verifySmsChallenge", new Error("NOT IMPLEMENTED"))
    );
};

export { verifySmsChallenge };
