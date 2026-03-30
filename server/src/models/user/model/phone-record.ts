import mongoose from "mongoose";
import lib from "google-libphonenumber";

interface IPhoneRecordCreationAttrs {
    number: string;
    verified?: boolean;
}

interface IPhoneRecordDoc extends mongoose.Document, IPhoneRecordCreationAttrs {
    verified: boolean;
    // VIRTUALs
    regionCode?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface IPhoneRecordModel extends mongoose.Model<IPhoneRecordDoc> {}

const phoneRecordSchema = new mongoose.Schema<IPhoneRecordDoc, IPhoneRecordModel>(
    {
        number: {
            type: String,
            required: [true, "Phone number is required"],
            validate: {
                validator: function (v: string) {
                    const phoneUtil = lib.PhoneNumberUtil.getInstance();
                    return phoneUtil.isValidNumber(phoneUtil.parseAndKeepRawInput(v));
                },
                message: "Phone number is not valid, received {VALUE}"
            }
        },
        verified: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    {
        _id: false
    }
);

phoneRecordSchema.virtual("regionCode").get(function () {
    try {
        return lib.PhoneNumberUtil.getInstance().parse(this.number).getCountryCode();
    } catch (err) {
        return undefined;
    }
});

export { IPhoneRecordCreationAttrs, IPhoneRecordDoc, IPhoneRecordModel, phoneRecordSchema };
