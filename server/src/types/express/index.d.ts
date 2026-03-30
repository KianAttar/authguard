import { AccessTokenPayload } from "../../models/session/auth-token.ts";
import { Session } from "../../models/session/session.ts";
import express from "express";
declare global {
    namespace Express {
        interface Request {
            accessToken?: AccessTokenPayload | undefined;
            session?: Session | undefined;
            isStatelesslyAuthenticated(): this is StatelesslyAuthenticatedRequest;
            isSessionAuthenticated(): this is SessionAuthenticatedRequest;
        }
        interface StatelesslyAuthenticatedRequest extends Request {
            accessToken: AccessTokenPayload;
            session?: Session | undefined;
        }
        interface SessionAuthenticatedRequest extends Request {
            accessToken?: AccessTokenPayload | undefined;
            session: Session;
        }
    }
}
