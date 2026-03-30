import { RequestHandler } from "express";
import { InternalServerError, UnauthorizedError } from "@mssd/errors";
import { User } from "../../../models/user/user.js";
import { AuthProvider } from "../../../models/constants.js";

const unlinkAccountFromMicrosoft: RequestHandler = async function (req, res, next) {
    if (!req.isSessionAuthenticated()) throw new UnauthorizedError();
    await User.unlinkAccount(req.session.getUserId(), { provider: AuthProvider.MICROSOFT });
    res.status(204).end();
};

export { unlinkAccountFromMicrosoft };
