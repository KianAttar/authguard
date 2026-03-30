import mongoose from "mongoose";

interface IAccountStatusCreationAttrs {}

interface IAccountStatusDoc extends mongoose.Document, IAccountStatusCreationAttrs {
    isActive: boolean;
    isLocked: boolean;
    isBlocked: boolean;
    isDeletionRequested: boolean;
    DeletionRequestedAt?: Date;
}

interface IAccountStatusModel extends mongoose.Model<IAccountStatusDoc> {}

const accountStatusSchema = new mongoose.Schema<IAccountStatusDoc, IAccountStatusModel>(
    {
        isActive: {
            type: Boolean,
            required: true,
            default: true
        },
        isLocked: {
            type: Boolean,
            required: true,
            default: false
        },
        isBlocked: {
            type: Boolean,
            required: true,
            default: false
        },
        isDeletionRequested: {
            type: Boolean,
            required: true,
            default: false
        },
        DeletionRequestedAt: {
            type: Date
        }
    },
    {
        _id: false
    }
);

export { IAccountStatusCreationAttrs, IAccountStatusDoc, IAccountStatusModel, accountStatusSchema };
