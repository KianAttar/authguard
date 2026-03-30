import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const removeProfileImage: RequestHandler = function (req, res, next) {
    next(
        new InternalServerError("NOT IMPLEMENTED: removeProfileImage", new Error("NOT IMPLEMENTED"))
    );
};

export { removeProfileImage };
