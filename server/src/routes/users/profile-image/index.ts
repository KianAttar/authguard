import { Router } from "express";
import { uploadNewProfileImage } from "./upload-profile-image.controller.js";
import { removeProfileImage } from "./remove-profile-image.controller.js";

const router = Router();

router.put("/", uploadNewProfileImage);
router.delete("/", removeProfileImage);

export { router as profileImageRouter };
