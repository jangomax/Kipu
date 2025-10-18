import { Router } from "express";
import { loginHandler, callbackHandler } from "@/handlers/auth";

const router = Router();

router.post("/login", loginHandler);
router.post("/callback", callbackHandler);

export default router;
