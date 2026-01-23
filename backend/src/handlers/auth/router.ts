import { Router } from "express";
import { loginHandler, callbackHandler, refreshHandler } from "@/handlers/auth";

const router = Router();

router.post("/login", loginHandler);
router.post("/callback", callbackHandler);
router.post("/refresh", refreshHandler);

export default router;
