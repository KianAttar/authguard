import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const verifyAccessToken: RequestHandler = function (req, res, next) {
    return next(
        new InternalServerError("NOT IMPLEMENTED: verifyAccessToken", new Error("NOT IMPLEMENTED"))
    );
};

export { verifyAccessToken };
