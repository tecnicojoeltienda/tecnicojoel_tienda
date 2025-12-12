import express from "express";
// import cookieParser from "cookie-parser"; // <-- eliminar
import * as authCtrl from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();


router.post("/login", authCtrl.login);

router.post("/logout", authCtrl.logout);

router.get("/refresh", authCtrl.refresh);

router.get("/me", authMiddleware, (req, res) => {
  return res.status(200).json({ success: true, data: req.user });
});

export default router;