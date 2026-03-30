import { Router } from "express";
import { getNewAccessToken } from "./get-access-token.controller.js";
import { verifyAccessToken } from "./verify-access-token.controller.js";
const router = Router();

router.get("/", getNewAccessToken);
router.get("/verify", verifyAccessToken);
export { router as tokenRouter };
