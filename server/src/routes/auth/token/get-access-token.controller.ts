import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const getNewAccessToken: RequestHandler = function (req, res, next) {
    return next(
        new InternalServerError(
            "NOT IMPLEMENTED: getAccessTokenThroughCodeExchange",
            new Error("NOT IMPLEMENTED")
        )
    );
};

export { getNewAccessToken };
