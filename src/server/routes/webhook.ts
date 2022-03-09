import express from "express";
import * as controller from "../controllers/WebhooksController";

const router = express.Router();

router.post("/", controller.processUpVote);

export default router;