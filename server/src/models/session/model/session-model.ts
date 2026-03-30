import mongoose, { mongo } from "mongoose";
import { AuthMethod, ChallengeMethod, UserRole } from "../../constants.js";
import { CONFIG } from "../../../config/config.js";

interface ISessionCreationAttrs {
    userId: mongoose.Types.ObjectId;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    mfaVerified?: boolean;
    challengeMethod?: ChallengeMethod;
    lastMfaVerifiedAt?: Date;
    authMethod: AuthMethod;
    ip?: string;
    userAgent?: string;
}

interface ISessionDoc extends ISessionCreationAttrs, mongoose.Document {
    userId: mongoose.Types.ObjectId;
    sessionToken: string | mongoose.Types.UUID;
    mfaVerified: boolean;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

interface ISessionModel extends mongoose.Model<ISessionDoc> {
    build(attrs: ISessionCreationAttrs): ISessionDoc;
}

const sessionSchema = new mongoose.Schema<ISessionDoc, ISessionModel>({
    sessionToken: {
        type: mongoose.Types.UUID,
        required: true,
        default: () => new mongoose.Types.UUID(),
        get: (val: mongoose.Types.UUID) => {
            return val.toString("hex");
        },
        immutable: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    role: {
        type: String,
        enum: UserRole,
        required: true
    },
    mfaVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    challengeMethod: {
        type: String,
        enum: ChallengeMethod
    },
    lastMfaVerifiedAt: {
        type: Date
    },
    authMethod: {
        type: String,
        enum: AuthMethod,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + CONFIG.security.tokens.sessionToken.expiresWithin),
        expires: 0
    },
    ip: {
        type: String
    },
    userAgent: {
        type: String
    }
});

sessionSchema.static("build", function (attrs: ISessionCreationAttrs): ISessionDoc {
    return new this(attrs);
});

sessionSchema.pre("save", async function (next) {
    if (!this.isNew && this.isModified("lastMfaVerifiedAt")) {
        this.sessionToken = new mongoose.Types.UUID();
        this.expiresAt = new Date(Date.now() + CONFIG.security.tokens.sessionToken.expiresWithin);
    }
    next();
});

const SessionModel = mongoose.model<ISessionDoc, ISessionModel>("Session", sessionSchema);

export { SessionModel, ISessionDoc, ISessionCreationAttrs };
