import mongoose, { mongo } from "mongoose";
import { AbstractModel } from "../base-model/abstract-model.js";
import { IUserDoc, UserModel } from "./model/user-model.js";
import { Challenge } from "../challenge/challenge.js";
import { Session } from "../session/session.js";
import { LinkedAccountModel } from "./model/linked-accounts.js";
import { AuthProvider } from "../constants.js";
import { RequestDataValidationError, UnprocessableEntityError } from "@mssd/errors";
import { Request } from "express";
import { sendEmail } from "../../email/email-service.js";
import { CONFIG } from "../../config/config.js";

interface BaseSignUpDate {
    email: string;
    firstName?: string;
    password?: string;
    emailVerified?: boolean;
    lastName?: string;
    company?: string;
    profileImage?: string;
    dob?: Date;
}

interface ChallengeMethodRecord {
    method: ChallengeMethod;
    identifier: string;
    isVerified: boolean;
}

interface SignUpWithEmailData extends BaseSignUpDate {}
interface SignUpWithPasswordData extends SignUpWithEmailData {
    password: string;
}

interface LinkedAccountDeletionData {
    provider: AuthProvider;
}

interface LinkedAccountCreationData extends LinkedAccountDeletionData {
    pid: string;
}

interface SignInWithSsoData extends BaseSignUpDate, LinkedAccountCreationData {
    req: Request;
}

class User extends AbstractModel<IUserDoc> {
    static async findById(id: mongoose.Types.ObjectId | string): Promise<User | undefined> {
        const doc = await UserModel.findById(id);
        return doc ? new User(doc) : undefined;
    }
    static async findByEmail(email: string): Promise<User | undefined> {
        const doc = await UserModel.findOne({ email: email });
        return doc ? new User(doc) : undefined;
    }
    static async findByPid(pid: string, provider: AuthProvider): Promise<User | undefined> {
        const linkedAccount = await LinkedAccountModel.findOne({ pid: pid, provider: provider });
        return linkedAccount ? User.findById(linkedAccount.userId) : undefined;
    }

    static async signUpWithPassword(req: Request, data: SignUpWithPasswordData) {
        let user = await User.findByEmail(data.email);
        if (user) {
            try {
                const { challenge, session } = await user.signInWithPassword(req, data.password);
                if (challenge) {
                    return { user, challenge };
                } else {
                    return { user, session };
                }
            } catch (err) {
                if (err instanceof RequestDataValidationError) {
                    // intercept "email or password is incorrect" which means password wasn't correct. since initial request was to signup, we redirect them to signin.
                    throw new RequestDataValidationError([
                        {
                            message:
                                "An account with this email already exists. Please try logging in instead.",
                            path: []
                        }
                    ]);
                } else {
                    throw err; // throw other errors as is
                }
            }
        }

        user = await User.create(data);
        return { challenge: await user.createAndSendChallenge(), user };
    }
    static async signUpWithEmail(data: SignUpWithEmailData) {
        let user = await User.findByEmail(data.email);
        if (user) return { challenge: await user.signInWithEmail(), user };
        user = await User.create(data);
        return { challenge: await user.createAndSendChallenge(), user };
    }
    static async signInWithSso(data: SignInWithSsoData) {
        let isNew = false;
        let user = await User.findByPid(data.pid, data.provider);

        if (!user) {
            user = await User.findByEmail(data.email);
        }
        if (user) {
            // User already exits but account is not linked
            await user.createLinkedAccount({ pid: data.pid, provider: data.provider });
        } else {
            // new User
            isNew = true;
            user = await User.create({
                email: data.email,
                emailVerified: data.emailVerified ?? true,
                firstName: data.firstName,
                lastName: data.lastName,
                company: data.company,
                dob: data.dob,
                profileImage: data.profileImage
            });
            await user.createLinkedAccount({ pid: data.pid, provider: data.provider });
        }

        // user must be set here
        const session = await Session.createOrUpdateSession({ user, req: data.req });
        return { user, session, isNew };
    }
    static async getAllLinkedAccounts(userId: string | mongoose.Types.ObjectId) {
        const linkedAccountDocs = await LinkedAccountModel.find({ userId: userId });
        return !linkedAccountDocs || linkedAccountDocs.length === 0
            ? undefined
            : linkedAccountDocs.map((acc) => ({
                  linkedAt: acc.createdAt.toISOString(),
                  provider: acc.provider
              }));
    }
    async signInWithPassword(req: Request, password: string) {
        if (!(await this.doc.verifyPassword(password))) {
            throw new RequestDataValidationError([
                { message: "email or password is incorrect", path: [] }
            ]);
        }
        if (!this.isEmailVerified() || this.hasMfaOnLogin()) {
            const challenge = await Challenge.findByUserId(this.doc.id);
            if (challenge) return { challenge: await this.sendChallenge(challenge) };
            return { challenge: await this.createAndSendChallenge() };
        } else {
            return {
                session: (await Session.createOrUpdateSession({ req, user: this })) as Session
            };
        }
    }
    async signInWithEmail(): Promise<Challenge> {
        let challenge = await Challenge.findByUserId(this.doc.id);
        if (challenge) {
            return this.sendChallenge(challenge);
        }
        return this.createAndSendChallenge();
    }
    isEmailVerified(): boolean {
        return this.doc.emailVerified;
    }
    hasMfaOnLogin(): boolean {
        return this.doc.security.mfaOnLogin;
    }
    getUserId() {
        return this.doc.id;
    }
    getFirstName() {
        return this.doc.firstName;
    }
    getLastName() {
        return this.doc.lastName;
    }
    getRole() {
        return this.doc.role;
    }
    async linkAccount(data: SignInWithSsoData) {
        await this.createLinkedAccount({ pid: data.pid, provider: data.provider });
        // Updating user info
        data.firstName && !this.doc.firstName && (this.doc.firstName = data.firstName);
        data.lastName && !this.doc.lastName && (this.doc.lastName = data.lastName);
        data.company && !this.doc.company && (this.doc.company = data.company);
        data.profileImage && !this.doc.profileImage && (this.doc.profileImage = data.profileImage);
        data.dob && !this.doc.dob && (this.doc.dob = data.dob);
        data.emailVerified &&
            !this.doc.emailVerified &&
            (this.doc.emailVerified = data.emailVerified);
        this.doc.save();
    }
    async unlinkAccount(data: LinkedAccountDeletionData) {
        await User.unlinkAccount(this.doc.id, { provider: data.provider });
    }
    // helper
    private async createAndSendChallenge(): Promise<Challenge> {
        const challenge = await Challenge.create({
            userId: this.doc.id
        });
        if (challenge.rawChallengeCode) {
            await this.sendEmail(challenge.rawChallengeCode);
        }
        return challenge;
    }
    async sendChallenge(challenge: Challenge) {
        const updatedChallenge = await challenge.send();
        if (updatedChallenge.rawChallengeCode) {
            await this.sendEmail(updatedChallenge.rawChallengeCode);
        }
        return challenge;
    }
    private async sendEmail(code: string): Promise<void> {
        sendEmail({ code, to: this.doc.email });
    }
    private static async create(data: BaseSignUpDate): Promise<User> {
        try {
            const newUser = await UserModel.build({
                email: data.email,
                emailVerified: data.emailVerified,
                firstName: data.firstName,
                security: { password: data.password },
                company: data.company,
                lastName: data.lastName,
                dob: data.dob,
                profileImage: data.profileImage
            }).save();
            return new User(newUser);
        } catch (err) {
            if (err instanceof mongo.MongoError && err.code === 11000) {
                throw new UnprocessableEntityError(
                    "An account already exists with this email; Please login."
                );
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
    private async createLinkedAccount(data: LinkedAccountCreationData) {
        try {
            const existingLinkedAccount = await LinkedAccountModel.findOne({
                userId: this.getUserId(),
                provider: data.provider
            });
            if (existingLinkedAccount) {
                if (data.pid === existingLinkedAccount.pid) {
                    return;
                } else {
                    throw new UnprocessableEntityError(
                        `Your account is already linked to ${data.provider.valueOf()}. To link a different ${data.provider.valueOf()} account, please unlink from the existing one first.`
                    );
                }
            }
            const doc = await LinkedAccountModel.build({
                pid: data.pid,
                provider: data.provider,
                userId: this.doc.id
            }).save();
            return;
        } catch (err) {
            if (err instanceof mongo.MongoError && err.code === 11000) {
                // Already linked
                return;
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
    static async unlinkAccount(
        userId: string | mongoose.Types.ObjectId,
        data: LinkedAccountDeletionData
    ) {
        try {
            await LinkedAccountModel.findOneAndDelete({
                userId: userId,
                provider: data.provider
            });
            return;
        } catch (err) {
            throw err;
        }
    }
    getAllChallengeMethods(): ChallengeMethodRecord[] {
        const res: ChallengeMethodRecord[] = [];
        res.push({
            identifier: this.doc.email,
            method: ChallengeMethod.EMAIL,
            isVerified: this.doc.emailVerified
        });
        if (this.doc.phone?.number) {
            res.push({
                identifier: this.doc.phone.number,
                method: ChallengeMethod.SMS,
                isVerified: this.doc.phone.verified
            });
        }
        const totpRecords = this.doc.totpRecords.map((totp) => ({
            identifier: totp.label,
            isVerified: totp.isVerified,
            method: ChallengeMethod.TOTP
        })) as ChallengeMethodRecord[];
        res.push(...totpRecords);
        return res;
    }
    getVerifiedChallengeMethods(): ChallengeMethodRecord[] {
        return this.getAllChallengeMethods().filter((rec) => rec.isVerified);
    }
    toJSON() {
        return {
            id: this.doc.id,
            firstName: this.doc.firstName,
            lastName: this.doc.lastName,
            company: this.doc.company,
            profileImage: this.doc.profileImage,
            dob: this.doc.dob,
            email: this.doc.email,
            emailVerified: this.doc.emailVerified,
            phone: this.doc.phone?.number,
            phoneVerified: this.doc.phone?.verified,
            mfaOnLogin: this.doc.security.mfaOnLogin
        };
    }
}

export { User };
