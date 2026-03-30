import { Router } from "express";
import { signInWithEmailPassword } from "./signin-email-password.controller.js";
import { signUp } from "./sign-up.controller.js";
import { signOut } from "./sign-out.controller.js";
import { SsoRouter } from "./sso/index.js";
import { tokenRouter } from "./token/index.js";
import { mfaRouter } from "./mfa/index.js";
import { alreadyAuthenticated } from "../../middleware/auth/already-authenticated.js";
import { verifySessionToken } from "../../middleware/auth/stateful-auth.js";
const router = Router();

router.use("/token", tokenRouter);
router.use("/mfa", mfaRouter);
router.delete("/signout", verifySessionToken({ denyAccess: false }), signOut);
router.use("/signin/sso", verifySessionToken({ denyAccess: false }), SsoRouter);
router.use(alreadyAuthenticated());
router.post("/signin", signInWithEmailPassword);
router.post("/signup", signUp);

export { router as authRouter };
