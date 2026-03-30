import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const cancelChallenge: RequestHandler = function (req, res, next) {
    next(new InternalServerError("NOT IMPLEMENTED: cancelChallenge", new Error("NOT IMPLEMENTED")));
};

export { cancelChallenge };
