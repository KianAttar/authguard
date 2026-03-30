import mongoose, { mongo } from "mongoose";
import { AbstractModel } from "../base-model/abstract-model.js";
import { ChallengeModel, ChallengeStatus, IChallengeDoc } from "./model/challenge-model.js";
import { ChallengeMethod } from "../constants.js";
import { ForbiddenError, InternalServerError, RequestDataValidationError } from "@mssd/errors";
import { User } from "../user/user.js";
import { CONFIG } from "../../config/config.js";

interface ChallengeCreationData {
    userId: mongoose.Types.ObjectId;
    sessionId?: mongoose.Types.ObjectId;
    methodIdentifier?: string | mongoose.Types.ObjectId;
    redirectUri?: string;
    webhookUri?: string;
    method?: ChallengeMethod;
    user?: User;
}

abstract class Challenge extends AbstractModel<IChallengeDoc> {
    static async findById(id: mongoose.Types.ObjectId | string): Promise<Challenge | undefined> {
        const doc = await ChallengeModel.findById(id);
        return this.getConcreteChallenge(doc);
    }
    private static getConcreteChallenge(doc: IChallengeDoc | undefined | null) {
        switch (doc?.method) {
            case ChallengeMethod.EMAIL:
                return new EmailChallenge(doc);
            case ChallengeMethod.SMS:
                return new SmsChallenge(doc);
            case ChallengeMethod.TOTP:
                return new TotpChallenge(doc);
            default:
                return undefined;
        }
    }
    static async findByUserId(
        userId: mongoose.Types.ObjectId | string
    ): Promise<Challenge | undefined> {
        const doc = await ChallengeModel.findOne({ userId: userId });
        return this.getConcreteChallenge(doc);
    }
    abstract send(): Promise<Challenge>;

    hasVerified() {
        return this.doc.status === ChallengeStatus.VERIFIED;
    }
    getSessionId() {
        return this.doc.sessionId;
    }
    getUserId() {
        return this.doc.userId;
    }
    async verify(code: string): Promise<Challenge> {
        if (this.shouldCoolDown()) {
            throw new ForbiddenError(
                "You've reached the maximum number of code attempts. Please wait 15 minutes and retry."
            );
        }
        if (await this.doc.verify(code)) {
            this.doc.status = ChallengeStatus.VERIFIED;
            await this.doc.save();
            return this;
        } else {
            this.doc.failedAttempts += 1;
            this.doc.lastFailedAttemptAt = new Date();
            this.doc.save();
            throw new RequestDataValidationError([
                { message: "The code you entered is not correct. Please try again.", path: [] }
            ]);
        }
    }
    protected abstract shouldCoolDown(): boolean;
    protected static createChallengeCode(): string {
        return Math.floor(Math.random() * Math.pow(10, CONFIG.security.mfaChallenge.codeLength))
            .toString()
            .padStart(CONFIG.security.mfaChallenge.codeLength, "0");
    }
    getMethod() {
        return this.doc.method;
    }
    toJSON() {
        let status;
        switch (this.doc.status) {
            case ChallengeStatus.SENT:
                status = "PENDING";
                break;
            case ChallengeStatus.VERIFIED:
                status = "VERIFIED";
                break;
        }
        return {
            id: this.doc.id,
            method: this.doc.method,
            expiresAt: this.doc.expiresAt.toISOString(),
            status,
            sentAt: this.doc.sentAt.toISOString()
        };
    }
}

class EmailChallenge extends Challenge {
    rawChallengeCode: string | undefined;
    protected shouldCoolDown() {
        return this.doc.failedAttempts >= 10 || this.doc.sentCount >= 5;
    }
    private addChallengeCode(code: string): void {
        this.rawChallengeCode = code;
        this.doc.challengeCode = [...this.doc.challengeCode, code];
    }
    getRawChallengeCode(): string | undefined {
        return this.rawChallengeCode;
    }
    static async create(data: ChallengeCreationData): Promise<Challenge> {
        const code = Challenge.createChallengeCode();
        const user = data.user ?? (await User.findById(data.userId));
        if (!user) {
            throw new InternalServerError(
                "The user associated with the current challenge does not exit!",
                new Error()
            );
        }
        try {
            const doc = await ChallengeModel.build({
                userId: data.userId,
                sessionId: data.sessionId,
                redirectUri: data.redirectUri,
                webhookUri: data.webhookUri,
                method: data.method,
                challengeCode: [code]
            }).save();
            const challenge = new EmailChallenge(doc);
            challenge.rawChallengeCode = code;
            return challenge;
        } catch (err) {
            if (err instanceof mongo.MongoError && err.code === 11000) {
                return (await Challenge.findByUserId(data.userId))!.send();
            }
            if (err instanceof mongoose.Error.ValidationError) {
                throw new RequestDataValidationError(
                    Object.values(err.errors).map((er) => ({
                        message: er.message,
                        path: [er.path]
                    }))
                );
            }

            throw err; // Throw other errors as-is
        }
    }
    async send(): Promise<Challenge> {
        const ONE_MINUTE_AGO = new Date(Date.now() - 60 * 1000);
        if (this.doc.sentAt > ONE_MINUTE_AGO) {
            console.log("sentAt is less than 1 minute ago");
            console.log(this.doc.sentAt, ">", ONE_MINUTE_AGO);
            console.log("returning the current challenge");
            return this; // OR we could throw an error.
        }
        const FIFTEEN_MINUTE_AGO = new Date(Date.now() - 15 * 60 * 1000);
        if (this.shouldCoolDown()) {
            console.log("Should CoolDown: Yes");
            const latestFailure =
                this.doc.sentAt > this.doc.lastFailedAttemptAt
                    ? this.doc.sentAt
                    : this.doc.lastFailedAttemptAt;
            if (latestFailure > FIFTEEN_MINUTE_AGO) {
                console.log("latestFailure is within 15 minutes ago: YES");
                console.log(latestFailure, ">", FIFTEEN_MINUTE_AGO);
                throw new ForbiddenError(
                    "You've reached the maximum number of code attempts. Please wait 15 minutes and retry."
                );
            } else {
                console.log("latestFailure is within 15 minutes ago: NO");
                console.log("RESET Challenge");
                console.log(latestFailure, ">", FIFTEEN_MINUTE_AGO);
                this.doc.failedAttempts = 0;
                this.doc.sentCount = 0;
                this.doc.sentAt = new Date();
                this.doc.lastFailedAttemptAt = new Date();
                this.doc.challengeCode = [];
            }
        }
        this.doc.sentCount += 1;
        this.doc.sentAt = new Date();
        this.addChallengeCode(Challenge.createChallengeCode());
        console.log(this.rawChallengeCode);
        await this.doc.save();
        return this;
    }
}

class TotpChallenge extends Challenge {
    static async create(data: ChallengeCreationData): Promise<Challenge> {
        const user = data.user ?? (await User.findById(data.userId));
        if (!user) {
            throw new InternalServerError(
                "The user associated with the current challenge does not exit!",
                new Error()
            );
        }
        try {
            const doc = await ChallengeModel.build({
                userId: data.userId,
                sessionId: data.sessionId,
                redirectUri: data.redirectUri,
                webhookUri: data.webhookUri,
                method: ChallengeMethod.TOTP
            }).save();
            const challenge = new Challenge(doc);
            challenge.rawChallengeCode = code;
            return challenge;
        } catch (err) {
            if (err instanceof mongo.MongoError && err.code === 11000) {
                return await Challenge.findByUserId(data.userId);
            }
            if (err instanceof mongoose.Error.ValidationError) {
                throw new RequestDataValidationError(
                    Object.values(err.errors).map((er) => ({
                        message: er.message,
                        path: [er.path]
                    }))
                );
            }

            throw err; // Throw other errors as-is
        }
    }
    async send(): Promise<Challenge> {
        return this;
    }
    protected shouldCoolDown() {
        return this.doc.failedAttempts >= 10;
    }
}

class SmsChallenge extends Challenge {
    static async create(data: ChallengeCreationData): Promise<Challenge> {
        const code = Challenge.createChallengeCode();
        const user = data.user ?? (await User.findById(data.userId));
        if (!user) {
            throw new InternalServerError(
                "The user associated with the current challenge does not exit!",
                new Error()
            );
        }
        try {
            const doc = await ChallengeModel.build({
                userId: data.userId,
                sessionId: data.sessionId,
                redirectUri: data.redirectUri,
                webhookUri: data.webhookUri,
                method: data.method,
                challengeCode: [code]
            }).save();
            const challenge = new Challenge(doc);
            challenge.rawChallengeCode = code;
            return challenge;
        } catch (err) {
            if (err instanceof mongo.MongoError && err.code === 11000) {
                return (await Challenge.findByUserId(data.userId))!.send();
            }
            if (err instanceof mongoose.Error.ValidationError) {
                throw new RequestDataValidationError(
                    Object.values(err.errors).map((er) => ({
                        message: er.message,
                        path: [er.path]
                    }))
                );
            }

            throw err; // Throw other errors as-is
        }
    }
    async send(): Promise<Challenge> {
        return this;
    }
    protected shouldCoolDown() {
        return this.doc.failedAttempts >= 10;
    }
}

export { Challenge };
