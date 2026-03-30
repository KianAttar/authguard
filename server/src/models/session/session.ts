import mongoose from "mongoose";
import { AbstractModel } from "../base-model/abstract-model.js";
import { ISessionDoc, SessionModel } from "./model/session-model.js";
import { Challenge } from "../challenge/challenge.js";
import { User } from "../user/user.js";
import { CookieOptions, Request } from "express";
import { AuthMethod, ChallengeMethod } from "../constants.js";
import { InternalServerError, UnprocessableEntityError } from "@mssd/errors";
import { AccessTokenPayload, AuthToken } from "./auth-token.js";
import { CONFIG } from "../../config/config.js";
import { SsoState } from "../sso/sso-state.js";

interface CreateOrUpdateSessionDataBase {
    req: Request;
    session?: Session;
    ssoState?: SsoState;
}

interface SessionWithChallenge extends CreateOrUpdateSessionDataBase {
    challenge: Challenge;
    user?: undefined;
}

interface SessionWithUser extends CreateOrUpdateSessionDataBase {
    challenge?: undefined;
    user: User;
}

export type SessionInfo =
    | ({
          mfaVerified: true;
          lastMfaVerifiedAt: Date;
          lastMfaMethod: ChallengeMethod;
          authMethod: AuthMethod;
      } & AccessTokenPayload)
    | ({
          mfaVerified: false;
          lastMfaVerifiedAt?: Date;
          lastMfaMethod?: ChallengeMethod;
          authMethod: AuthMethod;
      } & AccessTokenPayload);
type CreateOrUpdateSessionData = SessionWithChallenge | SessionWithUser;

class Session extends AbstractModel<ISessionDoc> {
    static readonly ACCESS_TOKEN_COOKIE_NAME = "AT";
    static readonly ACCESS_TOKEN_COOKIE_OPTIONS: CookieOptions = {
        secure: CONFIG.security.tokens.accessToken.secure,
        httpOnly: CONFIG.security.tokens.accessToken.httpOnly,
        maxAge: CONFIG.security.tokens.accessToken.expiresWithin,
        priority: CONFIG.security.tokens.accessToken.priority,
        sameSite: CONFIG.security.tokens.accessToken.sameSite,
        path: CONFIG.security.tokens.accessToken.path
    };
    static readonly SESSION_TOKEN_COOKIE_NAME = "ST";
    static readonly SESSION_TOKEN_COOKIE_OPTIONS: CookieOptions = {
        secure: CONFIG.security.tokens.sessionToken.secure,
        httpOnly: CONFIG.security.tokens.sessionToken.httpOnly,
        maxAge: CONFIG.security.tokens.sessionToken.expiresWithin,
        priority: CONFIG.security.tokens.sessionToken.priority,
        sameSite: CONFIG.security.tokens.sessionToken.sameSite,
        path: CONFIG.security.tokens.sessionToken.path
    };

    static async findById(id: mongoose.Types.ObjectId | string): Promise<Session | undefined> {
        const doc = await SessionModel.findById(id);
        return doc ? new Session(doc) : undefined;
    }

    static async findBySessionToken(sessionToken: string): Promise<Session | undefined> {
        const doc = await SessionModel.findOne({
            sessionToken: new mongoose.Types.UUID(sessionToken)
        });
        return doc ? new Session(doc) : undefined;
    }
    static async findAllByUserId(userId: mongoose.Types.ObjectId | string) {
        const docs = await SessionModel.find({ userId: userId });
        return !docs || docs.length === 0 ? undefined : docs.map((doc) => new Session(doc));
    }

    static async createOrUpdateSession(data: CreateOrUpdateSessionData): Promise<Session> {
        // TODO Refactor this function (updateSession Instance method)
        let doc: ISessionDoc;
        if (data.session) {
            // If session is available
            doc = (await SessionModel.findByIdAndUpdate(
                data.session.getId(),
                {
                    ip: data.req.ip,
                    userAgent: data.req.get("user-agent")
                },
                { new: true }
            )) as ISessionDoc;
            return data.user ? new UserSession(doc, data.user) : new Session(doc);
        } else {
            // no session
            const user = data.user ?? (await User.findById(data.challenge.getUserId()));
            if (!user) {
                throw new InternalServerError(
                    "user associated to the current challenge does not exist.",
                    new Error()
                );
            }
            if (!data.challenge) {
                // challenge was not done (login with password)
                doc = await SessionModel.build({
                    userId: user.getUserId(),
                    role: user.getRole(),
                    firstName: user.getFirstName(),
                    authMethod: AuthMethod.PASSWORD,
                    mfaVerified: false,
                    ip: data.req.ip,
                    userAgent: data.req.get("user-agent")
                }).save();
            } else {
                // challenge was done (either new login, or enabling Sudo mode.)
                if (!data.challenge.hasVerified()) {
                    throw new UnprocessableEntityError(
                        "MFA Challenge verification is required to proceed."
                    );
                }
                if (!data.challenge.getSessionId()) {
                    // challenge not associated with a session (it is a login)
                    if (data.req.ip && data.req.get("user-agent")) {
                        const existingDoc = await SessionModel.findOne({
                            userId: user.getUserId(),
                            ip: data.req.ip,
                            userAgent: data.req.get("user-agent")
                        });
                        if (existingDoc) {
                            doc = (await SessionModel.findByIdAndUpdate(
                                existingDoc.id ?? existingDoc._id,
                                {
                                    mfaVerified: true,
                                    lastMfaVerifiedAt: new Date(),
                                    challengeMethod: data.challenge.getMethod()
                                },
                                { new: true }
                            )) as ISessionDoc;
                        }
                    }
                    //@ts-ignore
                    if (!doc)
                        doc = await SessionModel.build({
                            userId: user.getUserId(),
                            role: user.getRole(),
                            firstName: user.getFirstName(),
                            authMethod: AuthMethod.ONE_TIME_PASSWORD,
                            mfaVerified: true,
                            challengeMethod: data.challenge.getMethod(),
                            lastMfaVerifiedAt: new Date(),
                            ip: data.req.ip,
                            userAgent: data.req.get("user-agent")
                        }).save();
                } else {
                    // challenge is associated with a session (entering Sudo mode)
                    doc = (await SessionModel.findByIdAndUpdate(
                        data.challenge.getSessionId(),
                        {
                            mfaVerified: true,
                            lastMfaVerifiedAt: new Date(),
                            challengeMethod: data.challenge.getMethod(),
                            ip: data.req.ip,
                            userAgent: data.req.get("user-agent")
                        },
                        { new: true }
                    )) as ISessionDoc;
                }
            }
            return new UserSession(doc, user);
        }
    }
    // static async getSessionBySessionToken(token: string): Promise<Session | undefined> {
    //     const st = (await (await AuthToken.getInstance()).verifySessionToken(token)).st;
    //     return this.findById(st);
    // }
    async createAccessToken(): Promise<string> {
        console.log("Inside createAccessToken");
        return (await AuthToken.getInstance()).signAccessToken({
            userId: this.doc.userId.toString(),
            role: this.doc.role,
            firstName: this.doc.firstName,
            lastName: this.doc.lastName
        });
    }
    async createSessionToken(): Promise<string> {
        console.log("Inside createSessionToken");
        return (await AuthToken.getInstance()).signSessionToken({
            st: this.doc.sessionToken as string
        });
    }
    async getUser() {
        const user = await User.findById(this.doc.userId);
        if (user) {
            return user;
        } else {
            throw new InternalServerError(
                "User assoicated with a session does not exist.",
                new Error()
            );
        }
    }
    async signOut() {
        await this.doc.deleteOne();
    }

    toJSON() {
        return {
            id: this.doc.id,
            ip: this.doc.ip,
            userAgent: this.doc.userAgent,
            authMethod: this.doc.authMethod,
            mfaVerified: this.doc.mfaVerified,
            lastMfaVerifiedAt: this.doc.lastMfaVerifiedAt?.toISOString(),
            lastMfaMethod: this.doc.challengeMethod,
            createdAt: this.doc.createdAt?.toISOString()
        };
    }

    getSessionInfo(): SessionInfo {
        return {
            userId: this.doc.userId.toString(),
            role: this.doc.role,
            firstName: this.doc.firstName,
            authMethod: this.doc.authMethod,
            mfaVerified: false,
            lastMfaMethod: this.doc.challengeMethod,
            lastMfaVerifiedAt: this.doc.lastMfaVerifiedAt
        };
    }
    getLastMfaVerifiedAt() {
        return this.doc.lastMfaVerifiedAt;
    }
    getUserId() {
        return this.doc.userId;
    }
}

class UserSession extends Session {
    private user: User;
    constructor(doc: ISessionDoc, user: User) {
        super(doc);
        this.user = user;
    }
    async getUser() {
        return this.user;
    }

    async createAccessToken(): Promise<string> {
        console.log("Inside createAccessToken");
        return (await AuthToken.getInstance()).signAccessToken({
            userId: this.doc.userId.toString(),
            role: this.doc.role,
            firstName: this.doc.firstName,
            lastName: this.user.getLastName()
        });
    }
}

export { Session };
