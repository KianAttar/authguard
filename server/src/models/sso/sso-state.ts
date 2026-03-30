import { ISsoStateCreationAttrs, ISsoStateDoc, SsoStateModel } from "./model/sso-state.js";
import { AbstractModel } from "../base-model/abstract-model.js";
import * as client from "openid-client";
import mongoose from "mongoose";
import { ForbiddenError, InternalServerError, RequestDataValidationError } from "@mssd/errors";
import { CONFIG, ENV } from "../../config/config.js";
import { AuthProvider } from "../constants.js";
import z from "zod";
import { Request } from "express";
import { dataValidator } from "../../helper/data-validator.js";
interface CreateSsoStateData {
    redirectUrl?: string;
    nextUrl?: string;
    codeVerifier?: string;
    userId?: string | mongoose.Types.ObjectId;
    provider: AuthProvider;
}

interface OAuthPathParams {
    scope: string;
    redirect_uri: string;
    state: string;
    nonce: string;
    code_challenge: string;
    code_challenge_method: string;
}

interface CreateOAuthUrlData {
    provider: AuthProvider;
    frontendRedirectUrl?: string;
    nextUrl?: string;
    userId?: string | mongoose.Types.ObjectId;
}

const jwtClaimSchema = z.object({
    given_name: z.string().optional(),
    family_name: z.string().optional(),
    sub: z.string().min(1),
    picture: z.string().url().optional(),
    email: z.string().min(1).email(),
    email_verified: z.boolean({ coerce: true }).optional()
});

interface ProcessPkceCallbackData {
    provider: AuthProvider;
    req: Request;
}
interface FrontendRedirectUrlParams {
    baseUrl?: string;
    nextUrl?: string;
    message: string;
    status: "success" | "failed";
    isNewUser?: boolean;
    provider?: AuthProvider;
}
class SsoState extends AbstractModel<ISsoStateDoc> {
    private isVerified: boolean = false;
    private claims?: typeof jwtClaimSchema._type = undefined;
    private static GOOGLE_OAUTH_CONFIG: client.Configuration | undefined = undefined;
    private static MICROSOFT_OAUTH_CONFIG: client.Configuration | undefined = undefined;
    private static PKCE_CODE_CHALLENGE_METHOD = "S256";
    private static GOOGLE_STATIC_PARAMS: Pick<OAuthPathParams, "redirect_uri" | "scope"> = {
        scope: CONFIG.sso.google.scopes.join(" "),
        redirect_uri: CONFIG.sso.google.redirectUri
    };
    private static MICROSOFT_STATIC_PARAMS: Pick<OAuthPathParams, "redirect_uri" | "scope"> = {
        scope: CONFIG.sso.microsoft.scopes.join(" "),
        redirect_uri: CONFIG.sso.microsoft.redirectUri
    };
    static async findById(id: mongoose.Types.ObjectId | string): Promise<SsoState | undefined> {
        const doc = await SsoStateModel.findById(id);
        return doc ? new SsoState(doc) : undefined;
    }
    static async findByState(state: string): Promise<SsoState | undefined> {
        const doc = await SsoStateModel.findOne({ state: state });
        return doc ? new SsoState(doc) : undefined;
    }
    private static async createSsoState(data: CreateSsoStateData) {
        try {
            const doc = await SsoStateModel.build({
                nonce: client.randomNonce(),
                redirectUrl: data.redirectUrl,
                codeVerifier: data.codeVerifier,
                userId: data.userId,
                nextUrl: data.nextUrl,
                provider: data.provider
            }).save();
            return new SsoState(doc);
        } catch (err) {
            if (err instanceof Error) throw new InternalServerError("Error creating SsoState", err);
            else
                throw new InternalServerError(
                    "Error creating SsoState",
                    new Error("Error creating SsoState", { cause: err })
                );
        }
    }
    private static async getOAuthServerConfig(provider: AuthProvider) {
        switch (provider) {
            case AuthProvider.GOOGLE:
                if (!SsoState.GOOGLE_OAUTH_CONFIG) {
                    SsoState.GOOGLE_OAUTH_CONFIG = await client.discovery(
                        CONFIG.sso.google.serverUrl,
                        CONFIG.sso.google.clientId,
                        { client_secret: ENV.GOOGLE_OAUTH_CLIENT_SECRET }
                    );
                }
                return SsoState.GOOGLE_OAUTH_CONFIG;
            case AuthProvider.MICROSOFT:
                if (!SsoState.MICROSOFT_OAUTH_CONFIG) {
                    SsoState.MICROSOFT_OAUTH_CONFIG = await client.discovery(
                        CONFIG.sso.microsoft.serverUrl,
                        CONFIG.sso.microsoft.clientId,
                        { client_secret: ENV.MICROSOFT_OAUTH_CLIENT_SECRET }
                    );
                }
                return SsoState.MICROSOFT_OAUTH_CONFIG;
            default:
                throw new InternalServerError("Oauth provider is not supported", new Error());
        }
    }
    private static getOAuthStaticParams(provider: AuthProvider) {
        switch (provider) {
            case AuthProvider.GOOGLE:
                return SsoState.GOOGLE_STATIC_PARAMS;
            case AuthProvider.MICROSOFT:
                return SsoState.MICROSOFT_STATIC_PARAMS;
            default:
                throw new InternalServerError("Oauth provider is not supported", new Error());
        }
    }
    static async createAuthorizationUrlWithPkce(data: CreateOAuthUrlData) {
        const config = await SsoState.getOAuthServerConfig(data.provider);
        const staticPathParams = SsoState.getOAuthStaticParams(data.provider);
        const authParams: Partial<OAuthPathParams> = {
            ...staticPathParams
        };
        const codeVerifier = client.randomPKCECodeVerifier();
        const code_challenge = await client.calculatePKCECodeChallenge(codeVerifier);
        authParams.code_challenge = code_challenge;
        authParams.code_challenge_method = SsoState.PKCE_CODE_CHALLENGE_METHOD;
        const ssoState = await SsoState.createSsoState({
            codeVerifier,
            redirectUrl: data.frontendRedirectUrl,
            userId: data.userId,
            nextUrl: data.nextUrl,
            provider: data.provider
        });
        authParams.state = ssoState.getState();
        authParams.nonce = ssoState.getNonce();
        return client.buildAuthorizationUrl(config, authParams).toString();
    }
    async getOAuthClaimsFromCallbackUrl(data: ProcessPkceCallbackData) {
        const config = await SsoState.getOAuthServerConfig(data.provider);
        if (this.claims) return this.claims;
        const url = new URL("https://" + data.req.get("host") + data.req.originalUrl);
        try {
            const tokens = await client.authorizationCodeGrant(config, url, {
                expectedNonce: this.doc.nonce,
                expectedState: this.doc.state.toString(),
                pkceCodeVerifier: this.doc.codeVerifier
            });
            const claims = (
                await dataValidator({ claims: jwtClaimSchema }, { claims: tokens.claims() })
            ).claims;
            this.claims = claims;
            this.isVerified = true;
            return claims;
        } catch (err) {
            console.error("Error completing PKCE OAuth flow: ", err);
            if (err instanceof RequestDataValidationError) {
                console.error(
                    `Claims for ${data.provider.valueOf()} does not contain the required fields.`
                );
            }
            throw new ForbiddenError(
                "Failed to complete the authentication process. Please try again."
            );
        }
    }
    getState() {
        return this.doc.state.toString();
    }
    private getNonce() {
        return this.doc.nonce;
    }

    getUserId() {
        return this.doc.userId;
    }
    getProvider() {
        return this.doc.provider;
    }
    getRedirectUrl(params: Omit<FrontendRedirectUrlParams, "baseUrl" | "nextUrl">) {
        const redirectUrl = this.doc.redirectUrl ?? CONFIG.sso.defaultFrontendRedirectUrl;
        return SsoState.createRedirectUrl({
            message: params.message,
            status: params.status,
            baseUrl: redirectUrl,
            isNewUser: params.isNewUser,
            nextUrl: this.doc.nextUrl,
            provider: this.doc.provider
        });
    }
    static createRedirectUrl(params: FrontendRedirectUrlParams) {
        const redirectUrl = new URL(params.baseUrl ?? CONFIG.sso.defaultFrontendRedirectUrl);
        for (const key of Object.keys(params) as Array<keyof typeof params>) {
            redirectUrl.searchParams.set(key, String(params[key]));
        }
        return redirectUrl.toString();
    }
    IsVerified() {
        return this.isVerified;
    }
}

export { SsoState };
