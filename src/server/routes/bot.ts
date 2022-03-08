import express from "express";
import * as controller from "../controllers/BotsController";

const router = express.Router();

router.post("/toggle", controller.toggleRaids);
router.post("/max_location", controller.setMaxLocation);

export default router;