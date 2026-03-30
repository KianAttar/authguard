import mongoose from "mongoose";
import {
    ISecurityRecordCreationAttrs,
    ISecurityRecordDoc,
    securityRecordSchema
} from "./security-record.js";
import { phoneRecordSchema, IPhoneRecordCreationAttrs, IPhoneRecordDoc } from "./phone-record.js";
import {
    ITotpRecordCreationAttrs,
    ITotpRecordDoc,
    TotpRecordModel,
    totpRecordSchema
} from "./totpRecord.js";
import {
    accountStatusSchema,
    IAccountStatusCreationAttrs,
    IAccountStatusDoc
} from "./account-status.js";
import bcrypt from "bcrypt";
import { UserRole } from "../../constants.js";
import { NotFoundError, UnprocessableEntityError } from "@mssd/errors";

interface IUserCreationAttrs {
    firstName?: string;
    email: string;
    emailVerified?: boolean;
    lastName?: string;
    company?: string;
    profileImage?: string;
    dob?: Date;
    status?: IAccountStatusCreationAttrs;
    phone?: IPhoneRecordCreationAttrs;
    security?: ISecurityRecordCreationAttrs;
}

interface IUserDoc extends mongoose.Document, IUserCreationAttrs {
    emailVerified: boolean;
    status: IAccountStatusDoc;
    role: UserRole;
    security: ISecurityRecordDoc;
    phone?: IPhoneRecordDoc;
    totpRecords: ITotpRecordDoc[];
    // Virtuals
    createdAt: Date;
    updatedAt: Date;

    verifyPassword(password: string): Promise<boolean>;
    deleteTotpRecord(id: mongoose.Types.ObjectId | string): void;
    addTotpRecord(attrs: ITotpRecordCreationAttrs): ITotpRecordDoc;
}

interface IUserModel extends mongoose.Model<IUserDoc> {
    build(attrs: IUserCreationAttrs): IUserDoc;
    challengeFailed(userId: mongoose.Types.ObjectId): Promise<void>;
}

const userSchema = new mongoose.Schema<IUserDoc, IUserModel>(
    {
        firstName: {
            type: String,
            trim: true,
            lowercase: true
        },
        lastName: {
            type: String,
            trim: true,
            lowercase: true
        },
        company: {
            type: String,
            trim: true,
            lowercase: true
        },
        profileImage: {
            type: String,
            trim: true
        },
        dob: {
            type: Date
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [
                /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i,
                'invalid email, received "{VALUE}"'
            ]
        },
        emailVerified: {
            type: Boolean,
            required: true,
            default: false
        },
        // @ts-ignore
        security: {
            type: securityRecordSchema,
            default: () => ({})
        },
        phone: {
            type: phoneRecordSchema
        },
        totpRecords: {
            type: [totpRecordSchema],
            validate: {
                validator: function (v: any[]) {
                    return v.length <= 3;
                },
                message: "You can only have a maximum of 3 TOTP records."
            }
        },
        status: {
            type: accountStatusSchema,
            default: () => ({}),
            required: true
        },
        role: {
            type: String,
            enum: UserRole,
            required: true,
            default: UserRole.USER
        }
    },
    {
        id: true,
        timestamps: true
    }
);

userSchema.index({ email: 1 });

userSchema.static("build", function (attrs: IUserCreationAttrs) {
    return new this(attrs);
});

userSchema.method("verifyPassword", async function (password: string): Promise<boolean> {
    if (!this.security.password) return false;
    else return bcrypt.compare(password, this.security.password);
});
userSchema.methods.addTotpRecord = async function (
    attrs: ITotpRecordCreationAttrs
): Promise<ITotpRecordDoc> {
    if (this.totpRecords.length >= 3) {
        throw new UnprocessableEntityError(
            "You can only have a maximum of 3 TOTP records. Please remove one first in order to add a new one."
        );
    }
    const newTotpRecord = TotpRecordModel.build(attrs);
    this.totpRecords.push(newTotpRecord);
    await this.save(); // Save the updated user document to the database
    return newTotpRecord;
};

userSchema.methods.deleteTotpRecord = async function (
    totpRecordId: mongoose.Types.ObjectId | string
): Promise<void> {
    const index = this.totpRecords.findIndex(
        (record: ITotpRecordDoc) =>
            (record?.id.toString() ?? (record._id as mongoose.Types.ObjectId).toString()) ===
            totpRecordId.toString()
    );

    if (index === -1) {
        throw new NotFoundError("totp record");
    }

    // Remove the TOTP record from the array
    this.totpRecords.splice(index, 1);
    await this.save();
};

const UserModel = mongoose.model<IUserDoc, IUserModel>("User", userSchema);

export { UserModel, IUserDoc };
