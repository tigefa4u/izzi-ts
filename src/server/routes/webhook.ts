import express from "express";
import * as controller from "../controllers/WebhooksController";

const router = express.Router();

router.post("/dblwebhook-secret", controller.processUpVote);

export default router;