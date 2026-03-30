import { Router } from "express";
import { getAllAvailableMfaMethods } from "./all-available-methods.controller.js";
import { smsRouter } from "./sms/index.js";
import { totpRouter } from "./totp/index.js";

const router = Router();

router.get("/methods", getAllAvailableMfaMethods);
router.use("/methods/sms", smsRouter);
router.use("/methods/totp", totpRouter);
export { router as userMfaRouter };
