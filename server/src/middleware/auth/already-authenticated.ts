import { RequestHandler } from "express";
import { Session } from "../../models/session/index.js";
import { verifySessionToken } from "./stateful-auth.js";

const alreadyAuthenticated = function (): RequestHandler | RequestHandler[] {
    console.log("already authenticated is called");
    return [
        verifySessionToken({ denyAccess: false }),
        async (req, res, next) => {
            if (req.session && req.session instanceof Session) {
                res.status(200)
                    // .cookie(
                    //     Session.ACCESS_TOKEN_COOKIE_NAME,
                    //     await req.session.createAccessToken(),
                    //     Session.ACCESS_TOKEN_COOKIE_OPTIONS
                    // )
                    // .cookie(
                    //     Session.SESSION_TOKEN_COOKIE_NAME,
                    //     await req.session.createSessionToken(),
                    //     Session.SESSION_TOKEN_COOKIE_OPTIONS
                    // )
                    .json({ user: await req.session.getUser() });
                return;
            }
            next();
        }
    ];
};

export { alreadyAuthenticated };
