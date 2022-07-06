import express from "express";
import * as controller from "../controllers/WebhooksController";

const router = express.Router();

router.post("/", controller.processUpVote);
router.post("/server", controller.processServerUpvote);

export default router;