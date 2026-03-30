import { RequestHandler } from "express";
import { InternalServerError, UnauthorizedError } from "@mssd/errors";
import { User } from "../../../models/user/user.js";

const getAllLinkedAccounts: RequestHandler = async function (req, res, next) {
    if (!req.isSessionAuthenticated()) throw new UnauthorizedError();
    const linkedAccounts = await User.getAllLinkedAccounts(req.session.getUserId());
    res.status(200).json({ linkedAccounts: linkedAccounts });
};

export { getAllLinkedAccounts };
