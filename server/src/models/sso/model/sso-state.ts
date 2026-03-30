import mongoose from "mongoose";
import ms from "ms";
import { AuthProvider } from "../../constants.js";

// Attributes required to create a new SSO state
interface ISsoStateCreationAttrs {
    nonce: string; // Nonce for security purposes
    codeVerifier?: string; // Optional, used in PKCE
    redirectUrl?: string; // URL to redirect after authentication
    nextUrl?: string; // URL to redirect after authentication
    userId?: string | mongoose.Types.ObjectId; // Optional, User ID if the account is being linked
    provider: AuthProvider;
}

// Document returned by MongoDB that includes MongoDB-specific fields
interface ISsoStateDoc extends mongoose.Document, ISsoStateCreationAttrs {
    state: string | mongoose.Types.UUID;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
}

// Custom static method for the model to create instances with validation
interface ISsoStateModel extends mongoose.Model<ISsoStateDoc> {
    build(attrs: ISsoStateCreationAttrs): ISsoStateDoc;
}

// Define the schema
const ssoStateSchema = new mongoose.Schema<ISsoStateDoc, ISsoStateModel>(
    {
        state: {
            type: mongoose.Types.UUID,
            required: true,
            default: () => new mongoose.Types.UUID(),
            immutable: true
        },
        nonce: {
            type: String,
            required: true
        },
        codeVerifier: {
            type: String // Optional field for PKCE
        },
        redirectUrl: {
            type: String
        },
        nextUrl: {
            type: String
        },
        userId: {
            type: String // Optional field for linking accounts
        },
        provider: {
            type: String,
            enum: AuthProvider,
            required: true
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(ms("10min")), // Set expiry time to 10 minutes from creation
            expires: 0
        }
    },
    {
        timestamps: true // Automatically add `createdAt` and `updatedAt`
    }
);

// Add a static method to create instances
ssoStateSchema.static("build", function (attrs: ISsoStateCreationAttrs): ISsoStateDoc {
    return new this(attrs);
});

// Compile the schema into a model
const SsoStateModel = mongoose.model<ISsoStateDoc, ISsoStateModel>("SsoState", ssoStateSchema);

export { SsoStateModel, ISsoStateCreationAttrs, ISsoStateDoc, ISsoStateModel };
