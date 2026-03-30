import { Router } from "express";
import { ssoCallbackEndpoint, ssoRedirectEndpoint } from "./sso-signin-helper.js";
import { AuthProvider } from "../../../models/constants.js";
const router = Router();

router.get("/google/callback", ssoCallbackEndpoint({ provider: AuthProvider.GOOGLE }));
router.get("/microsoft/callback", ssoCallbackEndpoint({ provider: AuthProvider.MICROSOFT }));
router.get("/google", ssoRedirectEndpoint({ provider: AuthProvider.GOOGLE }));
router.get("/microsoft", ssoRedirectEndpoint({ provider: AuthProvider.MICROSOFT }));

export { router as SsoRouter };
