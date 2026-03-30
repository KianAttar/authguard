import { Router } from "express";
import { sessionsRouter } from "./sessions/index.js";
import { getCurrentUserInfo } from "./current-user-info.controller.js";
import { updateCurrentUserInfo } from "./update-current-user.controller.js";
import { requestAccountDeletion } from "./request-account-deletion.controller.js";
import { linkedAccountsRouter } from "./linked-accounts/index.js";
import { profileImageRouter } from "./profile-image/index.js";
import { userMfaRouter } from "./mfa/index.js";
const router = Router();

router.get("/me", getCurrentUserInfo);
router.patch("/me", updateCurrentUserInfo);
router.delete("/me", requestAccountDeletion);
router.use("/me/mfa", userMfaRouter);
router.use("/me/linked-accounts", linkedAccountsRouter);
router.use("/me/profile-image", profileImageRouter);
router.use("/me/sessions", sessionsRouter);

export { router as usersRouter };
