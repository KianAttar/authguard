import { RequestHandler } from "express";
import { InternalServerError, NotFoundError } from "@mssd/errors";
import { dataValidator } from "../../../helper/data-validator.js";
import z from "zod";
import mongoose from "mongoose";
import { ChallengeMethod } from "../../../models/constants.js";
import { Challenge } from "../../../models/challenge/challenge.js";
import { User } from "../../../models/user/user.js";
const schema = z.object({
    challengeId: z
        .string()
        .min(1)
        .refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid challenge identifier."),
    challengeMethod: z
        .enum(Object.values(ChallengeMethod) as [ChallengeMethod, ...ChallengeMethod[]]) //TODO
        .optional()
});

const sendChallenge: RequestHandler = async function (req, res, next) {
    const { body } = await dataValidator({ body: schema }, req);
    const challenge = await Challenge.findById(body.challengeId);
    if (!challenge) throw new NotFoundError("mfa challenge");
    const user = await User.findById(challenge.getUserId());
    if (!user)
        throw new InternalServerError(
            "User associated with the current challenge doesn't exist",
            new Error()
        );
    const newChallenge = await user.sendChallenge(challenge);
    res.status(200).json({ challenge: newChallenge });
};

export { sendChallenge };
