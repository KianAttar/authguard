import { RequestHandler } from "express";
import { InternalServerError, UnauthorizedError } from "@mssd/errors";

const getCurrentUserInfo: RequestHandler = async function (req, res, next) {
    if (!req.isSessionAuthenticated()) throw new UnauthorizedError();
    const user = await req.session.getUser();
    res.json({ user: user });
};

export { getCurrentUserInfo };
