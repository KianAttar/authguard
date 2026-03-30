import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const refreshAccessToken: RequestHandler = function (req, res, next) {
    return next(
        new InternalServerError("NOT IMPLEMENTED: refreshAccessToken", new Error("NOT IMPLEMENTED"))
    );
};

export { refreshAccessToken };
