import express from "express";
import * as controller from "../controllers/BotsController";

const router = express.Router();

router.post("/toggle", controller.toggleRaids);
router.post("/max_location", controller.setMaxLocation);
router.post("/remove_zone_from_cache", controller.removeZoneAndCardFromCache);
router.post("/remove_item_from_cache", controller.removeItemFromCache);
router.post("/remove_stages_and_cards_from_cache", controller.removeAllStagesAndCardsFromCache);

export default router;