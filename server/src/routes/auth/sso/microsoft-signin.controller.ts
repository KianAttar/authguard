// import { RequestHandler } from "express";
// import * as client from "openid-client";
// import { CONFIG, ENV } from "../../../config/config.js";
// import { SsoState } from "../../../models/sso/sso-state.js";
// import z from "zod";
// import { dataValidator } from "../../../helper/data-validator.js";
// import { ForbiddenError } from "@mssd/errors";
// import { User } from "../../../models/user/user.js";
// import { AuthProvider } from "../../../models/constants.js";
// import { Session } from "../../../models/session/session.js";

// const querySchema = z.object({
//     redirectUrl: z.string().min(1).url().optional(),
//     nextUrl: z.string().min(1).url().optional()
// });

// const signInWithMicrosoft: RequestHandler = async function (req, res, next) {
//     const { query } = await dataValidator({ query: querySchema }, req);
//     const redirectTo = await SsoState.createSigninWithGoogleOAuthUrl({
//         frontendRedirectUrl: query.redirectUrl,
//         provider: AuthProvider.GOOGLE,
//         userId: req.session?.getUserId(),
//         nextUrl: query.nextUrl
//     });
//     res.redirect(redirectTo);
// };

// const callbackSchema = z.object({
//     state: z.string().min(1)
// });

// const signInWithMicrosoftCallback: RequestHandler = async function (req, res, next) {
//     let frontendRedirectUrl = new URL(CONFIG.sso.defaultFrontendRedirectUrl);
//     try {
//         let ssoState;
//         try {
//             const { query } = await dataValidator({ query: callbackSchema }, req);
//             ssoState = await SsoState.findByState(query.state);
//             if (!ssoState) throw Error();
//         } catch (err) {
//             throw new ForbiddenError(
//                 "Invalid or expired state parameter. Please retry the login process."
//             );
//         }
//         const url = new URL("https://" + req.get("host") + req.originalUrl);
//         console.log();
//         const ssoRedirectUrl = ssoState.getRedirectUrl();
//         if (ssoRedirectUrl) frontendRedirectUrl = new URL(ssoRedirectUrl);
//         let tokens;
//         try {
//             tokens = await client.authorizationCodeGrant(microsoftServerConfig, url, {
//                 expectedNonce: ssoState.getNonce(),
//                 expectedState: ssoState.getState(),
//                 pkceCodeVerifier: ssoState.getCodeVerifier()
//             });
//         } catch (err) {
//             throw new ForbiddenError(
//                 "Failed to complete the authentication process. Please try again."
//             );
//         }
//         console.log(tokens.claims());
//         let claims;
//         try {
//             claims = (await dataValidator({ claims: jwtClaimSchema }, { claims: tokens.claims() }))
//                 .claims;
//         } catch (err) {
//             throw new ForbiddenError(
//                 "Failed to complete the authentication process. your email address is missing."
//             );
//         }
//         const { session, isNew } = await User.signInWithSso({
//             req,
//             provider: AuthProvider.MICROSOFT,
//             pid: claims.sub,
//             email: claims.email,
//             emailVerified: claims.email_verified,
//             profileImage: claims.picture,
//             firstName: claims.given_name,
//             lastName: claims.family_name
//         });
//         frontendRedirectUrl.searchParams.set("status", "success");
//         frontendRedirectUrl.searchParams.set("isNew", String(isNew));
//         frontendRedirectUrl.searchParams.set("provider", AuthProvider.MICROSOFT.valueOf());
//         frontendRedirectUrl.searchParams.set("message", "Login was successful");
//         res.status(200)
//             .cookie(
//                 Session.ACCESS_TOKEN_COOKIE_NAME,
//                 await session.createAccessToken(),
//                 Session.ACCESS_TOKEN_COOKIE_OPTIONS
//             )
//             .cookie(
//                 Session.SESSION_TOKEN_COOKIE_NAME,
//                 await session.createSessionToken(),
//                 Session.SESSION_TOKEN_COOKIE_OPTIONS
//             );
//         res.redirect(frontendRedirectUrl.toString());
//     } catch (err) {
//         console.log(err);
//         frontendRedirectUrl.searchParams.set("status", "failed");
//         if (err instanceof ForbiddenError) {
//             frontendRedirectUrl.searchParams.set("message", err.toJSON().errors[0].message);
//         } else {
//             frontendRedirectUrl.searchParams.set(
//                 "message",
//                 "Something went wrong! Please try again later."
//             );
//         }
//         res.redirect(frontendRedirectUrl.toString());
//     }
// };

// export { signInWithMicrosoft, signInWithMicrosoftCallback };
