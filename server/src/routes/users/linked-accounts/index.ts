import { Router } from "express";
import { getAllLinkedAccounts } from "./all-linked-accounts.controller.js";
import { unlinkAccountFromGoogle } from "./unlink-google.controller.js";
import { unlinkAccountFromApple } from "./unlink-apple.controller.js";
import { unlinkAccountFromMicrosoft } from "./unlink-microsoft.controller.js";

const router = Router();

router.get("/", getAllLinkedAccounts);

router.get("/google", (req, res) => {
    res.redirect("/api/accounts/auth/signin/sso/google");
});
router.get("/apple", (req, res) => {
    res.redirect("/api/accounts/auth/signin/sso/apple");
});
router.get("/microsoft", (req, res) => {
    res.redirect("/api/accounts/auth/signin/sso/microsoft");
});
router.delete("/google", unlinkAccountFromGoogle);
router.delete("/apple", unlinkAccountFromApple);
router.delete("/microsoft", unlinkAccountFromMicrosoft);

export { router as linkedAccountsRouter };
