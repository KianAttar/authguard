import mongoose, { IndexDefinition } from "mongoose";
import { AuthProvider } from "../../constants.js";

interface ILinkedAccountCreationAttrs {
    userId: mongoose.Types.ObjectId;
    provider: AuthProvider;
    pid: string;
}

interface ILinkedAccountDoc extends ILinkedAccountCreationAttrs, mongoose.Document {
    // VIRTUALs
    createdAt: Date;
    updatedAt: Date;
}

interface ILinkedAccountModel extends mongoose.Model<ILinkedAccountDoc> {
    build(attrs: ILinkedAccountCreationAttrs): ILinkedAccountDoc;
}

const linkedAccountSchema = new mongoose.Schema<ILinkedAccountDoc, ILinkedAccountModel>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        provider: {
            type: String,
            enum: AuthProvider,
            required: true
        },
        pid: {
            type: String,
            required: true
        }
    },
    {
        id: true,
        timestamps: true
    }
);
linkedAccountSchema.index({ userId: "asc" });
linkedAccountSchema.index({ pid: "asc" });

linkedAccountSchema.static(
    "build",
    function (attrs: ILinkedAccountCreationAttrs): ILinkedAccountDoc {
        return new this(attrs);
    }
);

const LinkedAccountModel = mongoose.model<ILinkedAccountDoc, ILinkedAccountModel>(
    "LinkedAccount",
    linkedAccountSchema
);

export { LinkedAccountModel };
