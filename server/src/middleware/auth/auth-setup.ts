import { RequestHandler } from "express";
import { Session } from "../../models/session/index.js";

const authMiddlewareSetup = function (): RequestHandler {
    return async (req, res, next) => {
        req.isSessionAuthenticated = function (): this is Express.SessionAuthenticatedRequest {
            return Boolean(this.session) && this.session instanceof Session;
        };
        req.isStatelesslyAuthenticated =
            function (): this is Express.StatelesslyAuthenticatedRequest {
                return this.accessToken !== undefined && Object.keys(this.accessToken).length > 0;
            };
        next();
    };
};

export { authMiddlewareSetup };
