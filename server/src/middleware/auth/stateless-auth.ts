import { Request, Response, NextFunction, RequestHandler } from "express";
import { Session } from "../../models/session/session.js";
import { ClientError, UnauthorizedError } from "@mssd/errors";
import { AuthToken } from "../../models/session/auth-token.js";

interface VerifyAccessTokenOptions {
    denyAccess?: boolean;
}
const defaultOptions: VerifyAccessTokenOptions = {
    denyAccess: true
};
// Middleware function
const verifyAccessToken = function (opt?: VerifyAccessTokenOptions): RequestHandler {
    return async (req, res, next: NextFunction) => {
        opt = { ...defaultOptions, ...opt };
        if (req.accessToken) return next(); // already was called
        let token =
            req.cookies[Session.ACCESS_TOKEN_COOKIE_NAME] ??
            (req.headers["authorization"] && req.headers["authorization"].split(" ")[1]);
        if (!token) {
            if (opt.denyAccess) throw new UnauthorizedError();
            next();
            return;
        }
        const authToken = await AuthToken.getInstance();
        try {
            const payload = await authToken.verifyAccessToken(token);
            req.accessToken = payload;
            next();
        } catch (err) {
            if (!(err instanceof ClientError)) throw err;
            if (opt.denyAccess) throw err;
            next();
            return;
        }
    };
};

export { verifyAccessToken };
