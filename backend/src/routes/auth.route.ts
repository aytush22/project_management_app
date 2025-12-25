import { Router } from "express";
import passport from "passport";
import { config } from "../config/app.config.js";
import { googleLoginCallback } from "../controllers/auth.controller.js";
import { registerUserController } from "../controllers/auth.controller.js";
import { loginController } from "../controllers/auth.controller.js";
import { logOutController } from "../controllers/auth.controller.js";

const failedUrl = `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`;
const authRoutes = Router();

authRoutes.post("/register", registerUserController);

authRoutes.post("/login", loginController);

authRoutes.post("/logout", logOutController);

authRoutes.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

authRoutes.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: failedUrl,
  }),
  googleLoginCallback
);

export default authRoutes;
