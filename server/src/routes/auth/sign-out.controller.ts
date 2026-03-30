import { RequestHandler } from "express";
import { Session } from "../../models/session/session.js";

const signOut: RequestHandler = async function (req, res, next) {
    if (req.session && req.session instanceof Session) {
        await req.session.signOut();
        res.clearCookie("ST", { path: Session.SESSION_TOKEN_COOKIE_OPTIONS.path });
        res.clearCookie("AT", { path: Session.ACCESS_TOKEN_COOKIE_OPTIONS.path });
    }
    res.status(204).end();
};

export { signOut };
