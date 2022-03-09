import express from "express";
import * as controller from "../controllers/DungeonsController";

const router = express.Router();

router.post("/seasons", controller.concludeOrStartDungeons);

export default router;