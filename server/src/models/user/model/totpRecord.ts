import mongoose from "mongoose";

interface ITotpRecordCreationAttrs {
    secret: string;
    label: string;
}

interface ITotpRecordDoc extends mongoose.Document, ITotpRecordCreationAttrs {
    isVerified: boolean;
    lastUsedAt?: Date;
    // Virtuals
    createdAt: Date;
    updatedAt: Date;
}

interface ITotpRecordModel extends mongoose.Model<ITotpRecordDoc> {
    build(attrs: ITotpRecordCreationAttrs): ITotpRecordDoc;
}

const totpRecordSchema = new mongoose.Schema<ITotpRecordDoc, ITotpRecordModel>(
    {
        secret: {
            type: String,
            required: true,
            trim: true
        },
        isVerified: {
            type: Boolean,
            default: false,
            required: true
        },
        label: {
            type: String,
            trim: true,
            required: true
        },
        lastUsedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

totpRecordSchema.static("build", function (attrs: ITotpRecordCreationAttrs) {
    return new this(attrs);
});

const TotpRecordModel = mongoose.model<ITotpRecordDoc, ITotpRecordModel>(
    "TotpRecord",
    totpRecordSchema
);
export {
    ITotpRecordCreationAttrs,
    ITotpRecordDoc,
    ITotpRecordModel,
    totpRecordSchema,
    TotpRecordModel
};
