import { RequestHandler } from "express";
import { InternalServerError, NotFoundError } from "@mssd/errors";
import z from "zod";
import mongoose from "mongoose";
import { dataValidator } from "../../../helper/data-validator.js";
import { Challenge } from "../../../models/challenge/challenge.js";
import { User } from "../../../models/user/user.js";
const schema = z.object({
    challengeId: z
        .string()
        .min(1)
        .refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid challenge identifier.")
});
const getChallenge: RequestHandler = async function (req, res, next) {
    const { body } = await dataValidator({ body: schema }, req);
    const challenge = await Challenge.findById(body.challengeId);
    if (!challenge) throw new NotFoundError("mfa challenge");
    const user = await User.findById(challenge.getUserId());
    if (!user) {
        throw new InternalServerError("", new Error());
    }
    res.status(200).json({ challenge, mfaMethods: user.getVerifiedChallengeMethods() });
};

export { getChallenge };
