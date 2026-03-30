import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const unlinkAccountFromApple: RequestHandler = function (req, res, next) {
    next(
        new InternalServerError(
            "NOT IMPLEMENTED: unlinkAccountFromApple",
            new Error("NOT IMPLEMENTED")
        )
    );
};

export { unlinkAccountFromApple };
