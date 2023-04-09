import express from "express";
import * as controller from "../controllers/DungeonsController";

const router = express.Router();

router.post("/seasons", controller.concludeOrStartDungeons);
router.get("/dgBans", controller.getDgBans);
router.post("/dgBans", controller.setDgBans);

export default router;