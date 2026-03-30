import { RequestHandler } from "express";
import { Session } from "../../models/session/index.js";
import { verifySessionToken } from "./stateful-auth.js";

const alreadyAuthenticated = function (): RequestHandler | RequestHandler[] {
    return [
        verifySessionToken({ denyAccess: false }),
        async (req, res, next) => {
            if (req.session && req.session instanceof Session) {
                res.status(200).json({ user: await req.session.getUser() });
                return;
            }
            next();
        }
    ];
};

export { alreadyAuthenticated };
