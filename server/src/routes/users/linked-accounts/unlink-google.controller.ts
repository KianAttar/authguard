import { RequestHandler } from "express";
import { InternalServerError, UnauthorizedError } from "@mssd/errors";
import { User } from "../../../models/user/user.js";
import { AuthProvider } from "../../../models/constants.js";

const unlinkAccountFromGoogle: RequestHandler = async function (req, res, next) {
    if (!req.isSessionAuthenticated()) throw new UnauthorizedError();
    await User.unlinkAccount(req.session?.getUserId(), { provider: AuthProvider.GOOGLE });
    res.status(204).end();
};

export { unlinkAccountFromGoogle };
