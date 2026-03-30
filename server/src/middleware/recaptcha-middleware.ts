// import { ForbiddenError, RequestDataValidationError } from "@mssd/errors";
// import axios from "axios";
// import { RequestHandler } from "express";
// import { ENV, CONFIG } from "../config/config";
// import z from "zod";
// import { dataValidator } from "../helper/data-validator";
// const schema = z.object({
//     recaptchaToken: z.string().min(1, "reCAPTCHA token is missing.")
// });
// interface SetRecaptchaOnRequestOptions {
//     behavior: "SetRecaptchaOnRequestObject";
// }
// interface RespondOptions {
//     behavior: "Respond";
//     v3_score_threshold: number;
//     v2_fallback: boolean;
// }

// const recaptchaMiddleware = function (options: Options): RequestHandler {
//     return async (req, res, next) => {
//         const {
//             body: { recaptchaToken }
//         } = await dataValidator({ body: schema }, req);
//         const response = await axios.post(CONFIG.security.reCaptcha.verifyUrl, null, {
//             params: {
//                 secret: ENV.RECAPTCHA_SECRET_KEY,
//                 response: recaptchaToken
//             }
//         });
//         const { success, score } = response.data as { success: boolean; score: number };
//         if (score != undefined) {
//         } else {
//             // recaptcha v2
//         }
//         if (success && score >= CONFIG.security.reCaptcha.scoreThreshold) {
//             next();
//         } else {
//             return next(
//                 new ForbiddenError(
//                     "Almost there! Please complete reCAPTCHA to verify you're not a robot to proceed."
//                 )
//             );
//         }
//     };
// };

// export { recaptchaMiddleware };
