import express from "express";
import isAuth from "server/pipes/auth";
import * as controller from "../controllers/BotsController";

const router = express.Router();

router.post("/toggle", isAuth, controller.toggleRaids);
router.post("/max_location", isAuth, controller.setMaxLocation);

export default router;