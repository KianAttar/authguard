import { decodeProtectedHeader, exportJWK, importPKCS8, jwtVerify, SignJWT } from "jose";
import { CONFIG, ENV } from "../../config/config.js";
import { JWK } from "jose";
import { UnauthorizedError } from "@mssd/errors";
import { errors as joseErrors } from "jose";
import { JWTPayload } from "jose";
import z, { ZodError } from "zod";
import { UserRole } from "../constants.js";

const accessTokenPayloadSchema = z.object({
    userId: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1).optional(),
    role: z.nativeEnum(UserRole),
    iat: z.date({ coerce: true })
});

export interface AccessTokenPayload {
    userId: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
}

const sessionTokenPayloadSchema = z.object({
    st: z.string().min(1),
    iat: z.date({ coerce: true })
});

export interface SessionTokenPayload {
    st: string;
}

class AuthToken {
    private static instance: AuthToken;
    private static accessTokenKeySet: JWK[];
    private static sessionTokenKey: JWK;

    private constructor() {}

    static async getInstance() {
        if (!this.instance) {
            this.instance = new AuthToken();
            await this.initializeKeys();
        }
        return this.instance;
    }
    private static async initializeKeys() {
        const accessTokenKey1 = await exportJWK(
            await importPKCS8(ENV.ACCESS_TOKEN_SIGN_PRIVATE_KEY_1, "ES256")
        );
        const accessTokenKey2 = await exportJWK(
            await importPKCS8(ENV.ACCESS_TOKEN_SIGN_PRIVATE_KEY_2, "ES256")
        );
        const sessionTokenKey = await exportJWK(
            await importPKCS8(ENV.SESSION_TOKEN_SIGN_PRIVATE_KEY, "ES256")
        );
        accessTokenKey1.kid = "C9B20D68-4F95-47D1-90A8-4A3139BDAFBE";
        accessTokenKey2.kid = "7ACCB32B-A1D2-458E-90CD-D188F56EC244";
        sessionTokenKey.kid = "660B23CC-DE5A-4779-A9BD-39ECA81AA5D2";
        this.accessTokenKeySet = [accessTokenKey1, accessTokenKey2];
        this.sessionTokenKey = sessionTokenKey;
    }

    private getLatestKey() {
        return AuthToken.accessTokenKeySet.at(-1)!;
    }
    // Sign a payload and return a signed JWT
    async signAccessToken(data: AccessTokenPayload): Promise<string> {
        const jwk = this.getLatestKey();
        const jwt = await new SignJWT(data as unknown as JWTPayload)
            .setProtectedHeader({ alg: "ES256", kid: jwk.kid })
            .setExpirationTime(CONFIG.security.tokens.accessToken.expiresWithin)
            .setIssuedAt()
            .setIssuer(CONFIG.security.tokens.accessToken.issuer)
            .sign(jwk);
        return jwt;
    }
    async signSessionToken(data: SessionTokenPayload): Promise<string> {
        const jwk = AuthToken.sessionTokenKey;
        const jwt = await new SignJWT(data as unknown as JWTPayload)
            .setProtectedHeader({ alg: "ES256", kid: jwk.kid })
            .setExpirationTime(CONFIG.security.tokens.sessionToken.expiresWithin)
            .setIssuedAt()
            .setIssuer(CONFIG.security.tokens.sessionToken.issuer)
            .sign(jwk);
        return jwt;
    }

    async verifyAccessToken(jwt: string) {
        try {
            const header = decodeProtectedHeader(jwt);
            const key = header.kid && AuthToken.accessTokenKeySet.find((k) => k.kid === header.kid);
            if (!key) {
                throw new UnauthorizedError();
            }
            const { payload } = await jwtVerify(jwt, { ...key, d: undefined });
            return await accessTokenPayloadSchema.parseAsync(payload);
        } catch (err) {
            if (err instanceof joseErrors.JOSEError || err instanceof ZodError) {
                throw new UnauthorizedError();
            }
            throw err; // throw other errors
        }
    }

    async verifySessionToken(jwt: string) {
        try {
            const header = decodeProtectedHeader(jwt);
            const key = header.kid && AuthToken.sessionTokenKey;
            if (!key) {
                throw new UnauthorizedError();
            }
            const { payload } = await jwtVerify(jwt, { ...key, d: undefined });
            return await sessionTokenPayloadSchema.parseAsync(payload);
        } catch (err) {
            if (err instanceof joseErrors.JOSEError || err instanceof ZodError) {
                throw new UnauthorizedError();
            }
            throw err; // throw other errors
        }
    }

    getAccessTokenJwksAsJson(): string {
        return JSON.stringify(
            AuthToken.accessTokenKeySet.map((key) => {
                delete key.d;
                return key;
            })
        );
    }
}

export { AuthToken };
