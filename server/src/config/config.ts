import z from "zod";
import yaml from "yaml";
import fs from "fs";
import path from "path";
import { zodTransformToMsHelper } from "../helper/zod-transform-time-ms.js";

const envVarsSchema = z.object({
    RECAPTCHA_SECRET_KEY: z.string().min(1),
    ACCESS_TOKEN_SIGN_PRIVATE_KEY_1: z.string().min(1),
    ACCESS_TOKEN_SIGN_PRIVATE_KEY_2: z.string().min(1),
    SESSION_TOKEN_SIGN_PRIVATE_KEY: z.string().min(1),
    AWS_SES_ACCESS_KEY: z.string().min(1),
    AWS_SES_SECRET_ACCESS_KEY: z.string().min(1),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1),
    MICROSOFT_OAUTH_CLIENT_SECRET: z.string().min(1),
    TOTP_ENCRYPTION_KEY: z.string().min(1)
});

const { data: envVars, error: envError } = envVarsSchema.safeParse(process.env);
if (envError) {
    console.error("Error parsing ENV variables: ");
    console.error(envError.format());
    process.exit(1);
}

const CookieOptionsSchema = z.object({
    httpOnly: z.boolean().optional().default(true),
    path: z.string().optional().default("/"),
    secure: z.boolean().optional().default(true),
    sameSite: z
        .union([z.boolean(), z.enum(["lax", "strict", "none"])])
        .optional()
        .default("lax"),
    priority: z.enum(["low", "medium", "high"]).optional().default("medium")
});

const configSchema = z.object({
    sso: z.object({
        defaultFrontendRedirectUrl: z.string().min(1).url(),
        google: z.object({
            serverUrl: z
                .string()
                .url()
                .optional()
                .default("https://accounts.google.com")
                .transform((val) => new URL(val)),
            clientId: z.string().min(1),
            scopes: z.array(z.string().min(1)).min(1),
            redirectUri: z.string().min(1).url()
        }),
        microsoft: z
            .object({
                serverUrl: z
                    .string()
                    .url()
                    .optional()
                    .default("https://login.microsoftonline.com")
                    .transform((val) => new URL(val)),
                clientId: z.string().min(1),
                tenant: z.string().optional().default("common"),
                scopes: z.array(z.string().min(1)).min(1),
                redirectUri: z.string().min(1).url()
            })
            .superRefine((data, ctx) => {
                data.serverUrl = new URL(`${data.serverUrl.toString()}${data.tenant}`);
            })
    }),
    security: z.object({
        tokens: z.object({
            accessToken: z
                .object({
                    expiresWithin: z.string().default("1h").transform(zodTransformToMsHelper),
                    issuer: z.string().default("authguard")
                })
                .merge(CookieOptionsSchema),
            sessionToken: z
                .object({
                    expiresWithin: z.string().default("90d").transform(zodTransformToMsHelper),
                    issuer: z.string().default("authguard")
                })
                .merge(CookieOptionsSchema)
        }),
        password: z.object({
            bcryptSaltRounds: z.number().min(5).default(14)
        }),
        mfaChallenge: z.object({
            bcryptSaltRounds: z.number().min(5).default(10),
            codeLength: z.number().min(6).default(6)
        }),
        reCaptcha: z.object({
            siteKey: z.string().min(1),
            verifyUrl: z.string().min(1).url(),
            scoreThreshold: z.number().min(0.1).max(1.0)
        })
    }),
    general: z.object({
        serverName: z.string().min(1).default("AuthGuard")
    })
});

const file = fs.readFileSync(path.join(import.meta.dirname, "./server.config.yml"), "utf8");
const configs = yaml.parse(file, { prettyErrors: true });
const { data: configVars, error: configError } = configSchema.safeParse(configs);
if (configError) {
    console.error("Error parsing Service Config file: ");
    console.error(configError.issues);
    process.exit(1);
}

const CONFIG = Object.freeze(configVars);
const ENV = Object.freeze(envVars);

export { CONFIG, ENV };
export default { CONFIG, ENV };
