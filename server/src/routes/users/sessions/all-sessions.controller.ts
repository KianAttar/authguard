import { RequestHandler } from "express";
import { InternalServerError, UnauthorizedError } from "@mssd/errors";
import { Session } from "../../../models/session/session.js";

const getAllSessions: RequestHandler = async function (req, res, next) {
    if (!req.isSessionAuthenticated()) throw new UnauthorizedError();
    const sessions = await Session.findAllByUserId(req.session.getUserId());
    if (!sessions) {
        throw new InternalServerError(
            "Logged in user with no session in the database",
            new Error()
        );
    }
    res.status(200).json({ sessions: sessions });
};

export { getAllSessions };
