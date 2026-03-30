import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { CONFIG } from "../../../config/config.js";
interface ISecurityRecordCreationAttrs {}

interface ISecurityRecordDoc extends mongoose.Document, ISecurityRecordCreationAttrs {
    password?: string;
    passwordChangedAt?: Date;
    failedLoginAttempts: number;
    failedChallengeCount: number;
    mfaOnLogin: boolean;
    // Virtuals
}

interface ISecurityRecordModel extends mongoose.Model<ISecurityRecordDoc> {}

const securityRecordSchema = new mongoose.Schema<ISecurityRecordDoc, ISecurityRecordModel>(
    {
        password: {
            type: String,
            trim: true
        },
        passwordChangedAt: {
            type: Date
        },
        failedLoginAttempts: {
            type: Number,
            default: 0,
            required: true
        },
        failedChallengeCount: {
            type: Number,
            default: 0,
            required: true
        },
        mfaOnLogin: {
            type: Boolean,
            default: false,
            required: true
        }
    },
    {
        _id: false,
        timestamps: false
    }
);

securityRecordSchema.pre("save", async function (next) {
    if (this.password && (this.isNew || this.isModified(this.password))) {
        this.password = await bcrypt.hash(this.password, CONFIG.security.password.bcryptSaltRounds);
    }
    next();
});

export {
    securityRecordSchema,
    ISecurityRecordCreationAttrs,
    ISecurityRecordDoc,
    ISecurityRecordModel
};
