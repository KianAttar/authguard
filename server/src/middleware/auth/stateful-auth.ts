import { Request, Response, NextFunction, RequestHandler } from "express";
import { Session, SessionInfo } from "../../models/session/session.js";
import { ClientError, UnauthorizedError } from "@mssd/errors";
import { AuthToken } from "../../models/session/auth-token.js";

interface VerifySessionTokenOptions {
    denyAccess?: boolean;
}
const defaultOptions: VerifySessionTokenOptions = {
    denyAccess: true
};
const verifySessionToken = function (opt?: VerifySessionTokenOptions): RequestHandler {
    return async (req, res, next) => {
        opt = { ...defaultOptions, ...opt };
        if (req.isSessionAuthenticated()) return next();
        const token = req.cookies[Session.SESSION_TOKEN_COOKIE_NAME];
        if (!token) {
            if (opt.denyAccess) throw new UnauthorizedError();
            next();
            return;
        }
        const authToken = await AuthToken.getInstance();
        let st: string;
        try {
            st = (await authToken.verifySessionToken(token)).st;
        } catch (err) {
            if (!(err instanceof ClientError)) throw err;
            if (opt.denyAccess) throw err;
            next();
            return;
        }
        const session = await Session.findBySessionToken(st);
        if (!session) {
            if (opt.denyAccess) {
                throw new UnauthorizedError();
            }
            next();
            return;
        }
        req.session = session;
        next();
    };
};

export { verifySessionToken };
