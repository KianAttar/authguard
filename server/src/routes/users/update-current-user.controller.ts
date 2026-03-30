import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const updateCurrentUserInfo: RequestHandler = function (req, res, next) {
    next(
        new InternalServerError(
            "NOT IMPLEMENTED: updateCurrentUserInfo",
            new Error("NOT IMPLEMENTED")
        )
    );
};

export { updateCurrentUserInfo };
