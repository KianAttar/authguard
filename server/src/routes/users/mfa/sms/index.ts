import { Router } from "express";
import { setupSmsMfaMethod } from "./setup-sms-method.controller.js";
import { removeSmsMfaMethod } from "./remove-sms-method.controller.js";
import { verifySmsChallenge } from "./verify-sms-challenge.controller.js";
import { createSmsVerificationChallenge } from "./create-sms-challenge.controller.js";

const router = Router();

router.post("/", setupSmsMfaMethod);
router.delete("/", removeSmsMfaMethod);
router.post("/challenge", createSmsVerificationChallenge);
router.post("/verify", verifySmsChallenge);

export { router as smsRouter };
