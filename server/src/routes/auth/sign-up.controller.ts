import { RequestHandler } from "express";
import { dataValidator } from "../../helper/data-validator.js";
import z from "zod";
import { User } from "../../models/user/user.js";
import { Session } from "../../models/session/session.js";

const schema = z.object({
    firstName: z
        .string()
        .min(1)
        .regex(/^[a-zA-Z]+$/, "firstName must contain only english letters.")
        .optional(),
    email: z.string().email().min(1),
    password: z
        .string()
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
            `- **Must include at least 12 character**:\n- one lowercase letter (a-z)\n- one uppercase letter (A-Z)\n- one number (0-9)\n- one special character from the following: @, $, !, %, *, ?, &`
        )
        .optional(),
    lastName: z
        .string()
        .regex(/^[a-zA-Z]$/, "firstName must contain only english letters.")
        .optional(),
    company: z.string().optional(),
    dob: z.date({ coerce: true }).max(new Date()).optional()
});

const signUp: RequestHandler = async function (req, res) {
    const { body } = await dataValidator({ body: schema }, req);
    if (body.password) {
        const { challenge, session, user } = await User.signUpWithPassword(req, {
            email: body.email,
            password: body.password,
            firstName: body.firstName,
            lastName: body.lastName,
            company: body.company,
            dob: body.dob
        });
        if (challenge) {
            res.status(202).json({ challenge, mfaMethods: user.getVerifiedChallengeMethods() });
        } else {
            res.status(200)
                .cookie(
                    Session.ACCESS_TOKEN_COOKIE_NAME,
                    await session.createAccessToken(),
                    Session.ACCESS_TOKEN_COOKIE_OPTIONS
                )
                .cookie(
                    Session.SESSION_TOKEN_COOKIE_NAME,
                    await session.createSessionToken(),
                    Session.SESSION_TOKEN_COOKIE_OPTIONS
                )
                .json({ user: await session.getUser() });
        }
    } else {
        const { challenge, user } = await User.signUpWithEmail({
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
            company: body.company,
            dob: body.dob
        });
        res.status(202).json({ challenge, mfaMethods: user.getVerifiedChallengeMethods() });
    }
};

export { signUp };
