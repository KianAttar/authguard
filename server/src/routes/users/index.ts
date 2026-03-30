import { Router } from "express";
import { sessionsRouter } from "./sessions/index.js";
import { getCurrentUserInfo } from "./current-user-info.controller.js";
import { linkedAccountsRouter } from "./linked-accounts/index.js";
const router = Router();

router.get("/me", getCurrentUserInfo);
router.use("/me/linked-accounts", linkedAccountsRouter);
router.use("/me/sessions", sessionsRouter);

export { router as usersRouter };
