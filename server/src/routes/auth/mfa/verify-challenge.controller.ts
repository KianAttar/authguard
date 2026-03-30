import { RequestHandler } from "express";
import mongoose from "mongoose";
import z from "zod";
import { dataValidator } from "../../../helper/data-validator.js";
import { Challenge } from "../../../models/challenge/challenge.js";
import { NotFoundError, UnprocessableEntityError } from "@mssd/errors";
import { Session } from "../../../models/session/session.js";

const schema = z.object({
    challengeId: z
        .string()
        .min(1)
        .refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid challenge identifier."),
    verifier: z.string().min(1)
});

const verifyChallenge: RequestHandler = async function (req, res, next) {
    const { body } = await dataValidator({ body: schema }, req);
    let challenge = await Challenge.findById(body.challengeId);
    if (!challenge) {
        throw new NotFoundError("MFA challenge");
    }
    if (challenge.hasVerified()) {
        throw new UnprocessableEntityError("MFA challenge has already been verified.");
    }
    challenge = await challenge.verify(body.verifier);
    const session = await Session.createOrUpdateSession({
        req,
        challenge
    });
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
};

export { verifyChallenge };
