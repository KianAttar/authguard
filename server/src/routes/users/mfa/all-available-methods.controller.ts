import { RequestHandler } from "express";
import { InternalServerError, UnauthorizedError } from "@mssd/errors";

const getAllAvailableMfaMethods: RequestHandler = async function (req, res, next) {
    if (!req.isSessionAuthenticated()) throw new UnauthorizedError();
    const user = await req.session.getUser();
    res.status(200).json({ ChallengeMethods: user.getAllChallengeMethods() });
};

export { getAllAvailableMfaMethods };
