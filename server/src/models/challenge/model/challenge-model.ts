import mongoose from "mongoose";
import { ChallengeMethod } from "../../constants.js";
import { IUserDoc } from "../../user/model/user-model.js";
import bcrypt from "bcrypt";
import { CONFIG } from "../../../config/config.js";
import { InternalServerError } from "@mssd/errors";

enum ChallengeStatus {
    SENT = "1",
    VERIFIED = "2"
}

/**
 * Interface representing the attributes required to create a new challenge.
 * This interface is used to define the structure of the data needed for
 * creating multi-factor authentication (MFA) challenges.
 */
interface IChallengeCreationAttrs {
    /**
     * The ID of the user associated with the challenge.
     * This is a required field.
     *
     * @type {mongoose.Types.ObjectId}
     */
    userId: mongoose.Types.ObjectId;

    /**
     * The session ID associated with the challenge, if applicable.
     * This field is optional and can be used to link the challenge
     * to a specific session.
     *
     * @type {mongoose.Types.ObjectId}
     */
    sessionId?: mongoose.Types.ObjectId;

    /**
     * The URI to redirect the user to after completing the challenge.
     * This field is optional and can be specified to control the flow
     * after the MFA verification.
     *
     * @type {string}
     */
    redirectUri?: string;

    /**
     * The URI to which a webhook should be sent upon challenge completion.
     * This field is optional and allows for integration with other services
     * upon the successful verification of the challenge.
     *
     * @type {string}
     */
    webhookUri?: string;

    /**
     * The method of MFA to be used for this challenge.
     * This field is required and should conform to the `ChallengeMethod` type.
     *
     * @type {`${ChallengeMethod}`}
     */
    method?: ChallengeMethod;
    challengeCode?: string[];
    methodIdentifier?: string | mongoose.Types.ObjectId;
}

interface IChallengeDoc extends IChallengeCreationAttrs, mongoose.Document {
    status: ChallengeStatus;
    method: ChallengeMethod;
    expiresAt: Date;
    sentCount: number;
    failedAttempts: number;
    lastFailedAttemptAt: Date;
    sentAt: Date;
    removesAt: Date;
    // Virtuals
    createdAt: Date;
    updatedAt: Date;
    verifyChallengeCode(code: string): Promise<boolean>;
}
interface IChallengeDocWithUser extends IChallengeDoc {
    user: IUserDoc;
}
interface IChallengeModel extends mongoose.Model<IChallengeDoc> {
    build(attrs: IChallengeCreationAttrs): IChallengeDoc;
    populateUser(
        this: mongoose.Query<IChallengeDoc, IChallengeDoc>,
        populate: boolean
    ): mongoose.Query<IChallengeDoc, IChallengeDoc>;
}

const challengeSchema = new mongoose.Schema<IChallengeDoc, IChallengeModel>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session"
        },
        redirectUri: {
            type: String
        },
        webhookUri: {
            type: String
        },
        method: {
            type: String,
            required: true,
            enum: ChallengeMethod,
            default: ChallengeMethod.EMAIL
        },
        methodIdentifier: {
            type: String
        },
        challengeCode: {
            type: [String],
            required: true
        },
        status: {
            type: String,
            enum: ChallengeStatus,
            required: true,
            default: ChallengeStatus.SENT
        },
        sentCount: {
            type: Number,
            required: true,
            default: 1
        },
        failedAttempts: {
            type: Number,
            required: true,
            default: 0
        },
        sentAt: {
            type: Date,
            required: true,
            default: Date.now
        },
        lastFailedAttemptAt: {
            type: Date,
            required: true,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => Date.now() + 1000 * 60 * 30,
            expires: 0
        }
    },
    {
        timestamps: true
    }
);

challengeSchema.virtual("user", {
    ref: "User",
    localField: "userId",
    foreignField: "_id",
    justOne: true
});

challengeSchema.static("build", function (attrs: IChallengeCreationAttrs): IChallengeDoc {
    return new this(attrs);
});

challengeSchema.query.populateUser = function (populate: boolean) {
    if (populate) {
        return this.populate("user");
    }
    return this; // If not populating, return the query as is
};

challengeSchema.method("verifyChallengeCode", async function (code: string): Promise<boolean> {
    switch (this.method) {
        case ChallengeMethod.EMAIL:
            if (!this.challengeCode) {
                throw new InternalServerError("Email C", new Error());
            }
            const promises = this.challengeCode.map((hashedCode: string) =>
                bcrypt.compare(code, hashedCode).then((isMatch) => {
                    if (isMatch) throw true;
                    return false;
                })
            );
            try {
                await Promise.all(promises);
                return false;
            } catch (result) {
                if (result === true) {
                    return true; // A match was found
                }
                throw result;
            }
            break;
        case ChallengeMethod.TOTP:
            return false;
            break;
        case ChallengeMethod.SMS:
            return false;
            break;
        default:
            return false;
    }
});

challengeSchema.pre("save", async function (next) {
    if (this.isNew || this.isModified("challengeCode")) {
        this.challengeCode = await Promise.all(
            this.challengeCode.map(async (code) => {
                // Check if the code consists only of digits
                if (/^\d+$/.test(code)) {
                    // Hash the code
                    return bcrypt.hash(code, CONFIG.security.mfaChallenge.bcryptSaltRounds);
                }
                // Leave non-numeric codes as is
                return code;
            })
        );
    }
    next();
});

const ChallengeModel = mongoose.model<IChallengeDoc, IChallengeModel>("Challenge", challengeSchema);

export { ChallengeModel, IChallengeDoc, IChallengeCreationAttrs, ChallengeStatus };

/*
Challenge Code is valid for 5 minutes (email can be resent after 90 seconds)
a Challenge can be up to resent 5 times (5 * 5 = 25) (5 * 90 = 450 (7.5 minutes) seconds required at least to send 5 emails)
*/
