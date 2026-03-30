import { Router } from "express";
import { getChallenge } from "./getChallenge.js";
import { sendChallenge } from "./send-challenge.js";
import { cancelChallenge } from "./cancel-challenge.controller.js";
import { verifyChallenge } from "./verify-challenge.controller.js";
const router = Router();

router.post("/challenge/send", sendChallenge);
router.post("/challenge", getChallenge);
router.post("/challenge/cancel", cancelChallenge);
router.post("/challenge/verify", verifyChallenge);

export { router as mfaRouter };
