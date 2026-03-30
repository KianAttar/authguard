import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const requestAccountDeletion: RequestHandler = function (req, res, next) {
    next(
        new InternalServerError(
            "NOT IMPLEMENTED: requestAccountDeletion",
            new Error("NOT IMPLEMENTED")
        )
    );
};

export { requestAccountDeletion };
