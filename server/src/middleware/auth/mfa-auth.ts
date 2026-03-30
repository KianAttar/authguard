import { RequestHandler } from "express";
import z from "zod";
import { zodTransformToMsHelper } from "../../helper/zod-transform-time-ms.js";
import { Session } from "inspector/promises";
import { UnauthorizedError } from "@mssd/errors";
interface Options {
    mfaHasCompletedWithin: string;
}
const schema = z.object({
    mfaHasCompletedWithin: z.string().min(1).transform(zodTransformToMsHelper).default("15min")
});

// Middleware function
const mfaRequiredMiddleware = function (options?: Options): RequestHandler {
    const { data: opts, error } = schema.safeParse(options);
    if (error) throw Error();
    return async (req, res, next) => {
        if (!req.isSessionAuthenticated()) {
            throw new UnauthorizedError(); // user need to login
        }
        const lastMfaVerifiedTime = req.session.getLastMfaVerifiedAt();
        if (
            !lastMfaVerifiedTime ||
            Date.now() - lastMfaVerifiedTime.getTime() > opts.mfaHasCompletedWithin
        ) {
            return res.redirect(
                "/challenge_page?redirect_url=https://dev-server.com/sensitive-action"
            );
        }
        next();
    };
};

export { mfaRequiredMiddleware };
