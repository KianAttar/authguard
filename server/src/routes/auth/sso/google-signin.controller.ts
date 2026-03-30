// import { RequestHandler } from "express";
// import { SsoState } from "../../../models/sso/sso-state.js";
// import z from "zod";
// import { dataValidator } from "../../../helper/data-validator.js";
// import { ForbiddenError, RequestDataValidationError } from "@mssd/errors";
// import { User } from "../../../models/user/user.js";
// import { AuthProvider } from "../../../models/constants.js";
// import { Session } from "../../../models/session/session.js";

// const querySchema = z.object({
//     redirectUrl: z.string().min(1).url().optional(),
//     nextUrl: z.string().min(1).url().optional()
// });

// const signInWithGoogle: RequestHandler = async function (req, res, next) {
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

// const signInWithGoogleCallback: RequestHandler = async function (req, res, next) {
//     try {
//         const { query } = await dataValidator({ query: callbackSchema }, req);
//         const ssoState = await SsoState.findByState(query.state);
//         if (!ssoState) {
//             return res.redirect(
//                 SsoState.createRedirectUrl({
//                     message: "Invalid or expired state parameter. Please retry the login process.",
//                     status: "failed"
//                 })
//             );
//         }
//         let claims;
//         try {
//             claims = await ssoState.getGoogleOAuthClaimsFromCallbackUrl({ req: req });
//         } catch (err) {
//             if (err instanceof ForbiddenError) {
//                 return res.redirect(
//                     ssoState.getRedirectUrl({
//                         status: "failed",
//                         message: err.serializeErrors()[0].message
//                     })
//                 );
//             }
//             throw err; // throw other errors as is
//         }
//         if (req.isSessionAuthenticated()) {
//             const user = await req.session.getUser();
//             await user.linkAccount({
//                 req,
//                 provider: AuthProvider.GOOGLE,
//                 pid: claims.sub,
//                 email: claims.email,
//                 emailVerified: claims.email_verified,
//                 profileImage: claims.picture,
//                 firstName: claims.given_name,
//                 lastName: claims.family_name
//             });
//             const session = await Session.createOrUpdateSession({
//                 req,
//                 user,
//                 session: req.session
//             });
//             return (
//                 res
//                     // .cookie(
//                     //     Session.ACCESS_TOKEN_COOKIE_NAME,
//                     //     await session.createAccessToken(),
//                     //     Session.ACCESS_TOKEN_COOKIE_OPTIONS
//                     // )
//                     // .cookie(
//                     //     Session.SESSION_TOKEN_COOKIE_NAME,
//                     //     await session.createSessionToken(),
//                     //     Session.SESSION_TOKEN_COOKIE_OPTIONS
//                     // )
//                     .redirect(
//                         ssoState.getRedirectUrl({
//                             message: `Your ${ssoState.getProvider().valueOf()} was linked successfully.`,
//                             status: "success",
//                             isNewUser: false
//                         })
//                     )
//             );
//         } else {
//             // Login Request
//             const { session, isNew, user } = await User.signInWithSso({
//                 req,
//                 provider: AuthProvider.GOOGLE,
//                 pid: claims.sub,
//                 email: claims.email,
//                 emailVerified: claims.email_verified,
//                 profileImage: claims.picture,
//                 firstName: claims.given_name,
//                 lastName: claims.family_name
//             });
//             res.status(200)
//                 .cookie(
//                     Session.ACCESS_TOKEN_COOKIE_NAME,
//                     await session.createAccessToken(),
//                     Session.ACCESS_TOKEN_COOKIE_OPTIONS
//                 )
//                 .cookie(
//                     Session.SESSION_TOKEN_COOKIE_NAME,
//                     await session.createSessionToken(),
//                     Session.SESSION_TOKEN_COOKIE_OPTIONS
//                 );
//             res.redirect(
//                 ssoState.getRedirectUrl({
//                     message: "Login was Successful.",
//                     status: "success",
//                     isNewUser: isNew
//                 })
//             );
//         }
//     } catch (err) {
//         let message;
//         if (err instanceof RequestDataValidationError) {
//             message = "Invalid or expired state parameter. Please retry the login process.";
//         } else if (err instanceof ForbiddenError) {
//             message = err.toJSON().errors[0].message;
//         } else {
//             message = "Something went wrong! Please try again.";
//         }
//         res.redirect(
//             SsoState.createRedirectUrl({ message, status: "failed", provider: AuthProvider.GOOGLE })
//         );
//     }
// };

// export { signInWithGoogle, signInWithGoogleCallback };
