import { RequestHandler } from "express";
import { InternalServerError } from "@mssd/errors";

const uploadNewProfileImage: RequestHandler = function (req, res, next) {
    next(
        new InternalServerError(
            "NOT IMPLEMENTED: uploadNewProfileImage",
            new Error("NOT IMPLEMENTED")
        )
    );
};

export { uploadNewProfileImage };
