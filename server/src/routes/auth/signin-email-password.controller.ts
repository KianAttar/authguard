import { RequestHandler } from "express";
import z from "zod";
import { dataValidator } from "../../helper/data-validator.js";
import { User } from "../../models/user/user.js";
import { RequestDataValidationError } from "@mssd/errors";
import { Session } from "../../models/session/session.js";
const schema = z.object({
    email: z.string().email().min(1),
    password: z
        .string()
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
            `- **Must include at least 12 character**:\n- one lowercase letter (a-z)\n- one uppercase letter (A-Z)\n- one number (0-9)\n- one special character from the following: @, $, !, %, *, ?, &`
        )
        .optional()
});

const signInWithEmailPassword: RequestHandler = async function (req, res, next) {
    const { body } = await dataValidator({ body: schema }, req);
    const user = await User.findByEmail(body.email);
    if (!user) {
        throw new RequestDataValidationError([
            { message: "email or password is incorrect", path: [] }
        ]);
    }
    if (body.password) {
        const { challenge, session } = await user.signInWithPassword(req, body.password);
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
        const challenge = await user.signInWithEmail();
        res.status(202).json({ challenge, mfaMethods: user.getVerifiedChallengeMethods() });
    }
};

export { signInWithEmailPassword };
