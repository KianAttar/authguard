import { Router } from "express";
import { ssoCallbackEndpoint, ssoRedirectEndpoint } from "./sso-signin-helper.js";
import { AuthProvider } from "../../../models/constants.js";
import { verifySessionToken } from "../../../middleware/auth/stateful-auth.js";
const router = Router();

router.get("/google/callback", ssoCallbackEndpoint({ provider: AuthProvider.GOOGLE }));
router.get("/apple/callback", ssoCallbackEndpoint({ provider: AuthProvider.APPLE }));
router.get("/microsoft/callback", ssoCallbackEndpoint({ provider: AuthProvider.MICROSOFT }));
router.get("/google", ssoRedirectEndpoint({ provider: AuthProvider.GOOGLE }));
router.get("/microsoft", ssoRedirectEndpoint({ provider: AuthProvider.MICROSOFT }));
router.get("/apple", ssoRedirectEndpoint({ provider: AuthProvider.APPLE }));

export { router as SsoRouter };
