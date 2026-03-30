import { RequestHandler } from "express";
import z from "zod";
import { dataValidator } from "../../../helper/data-validator.js";
import { NotFoundError, UnauthorizedError } from "@mssd/errors";
import { Session } from "../../../models/session/session.js";

const schema = z.object({
    sessionId: z.string().min(1)
});

const destroySession: RequestHandler = async function (req, res, next) {
    if (!req.isSessionAuthenticated()) {
        throw new UnauthorizedError();
    }
    const {
        query: { sessionId }
    } = await dataValidator({ query: schema }, req);
    if (sessionId === req.session.getId()) {
        // logging out itself.
        await req.session.signOut();
    } else {
        const session = await Session.findById(sessionId);
        if (!session) {
            throw new NotFoundError("session");
        }
        await req.session.signOut();
    }
    res.clearCookie(Session.ACCESS_TOKEN_COOKIE_NAME);
    res.clearCookie(Session.SESSION_TOKEN_COOKIE_NAME);
    res.status(204).end();
};

export { destroySession };
