import { Router } from "express";
import { getAllSessions } from "./all-sessions.controller.js";
import { destroySession } from "./destroy-session.controller.js";
import { mfaRequiredMiddleware } from "../../../middleware/auth/mfa-auth.js";

const router = Router();

router.get("/", getAllSessions);
router.delete(
    "/:sessionId",
    mfaRequiredMiddleware({ mfaHasCompletedWithin: "15min" }),
    destroySession
);

export { router as sessionsRouter };
