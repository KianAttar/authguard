import { Router } from "express";
import { setupTotpMfaMethod } from "./setup-totp-method.controller.js";
import { removeTotpMfaMethod } from "./remove-totp-method.controller.js";
import { createTotpVerificationChallenge } from "./create-totp-challenge.controller.js";
import { verifyTotpChallenge } from "./verify-totp-challenge.controller.js";

const router = Router();

router.post("/", setupTotpMfaMethod);
router.delete("/", removeTotpMfaMethod);
router.post("/challenge", createTotpVerificationChallenge);
router.post("/verify", verifyTotpChallenge);
export { router as totpRouter };
