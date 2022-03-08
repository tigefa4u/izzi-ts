import express from "express";
import * as controller from "../controllers/WebhooksController";

const router = express.Router();

const webhookAuth = "izziwebhookauth";
function isWebhookAuth(req: any, res: any, next: any) {
	if (req.headers["authorization"] === webhookAuth && req.body.type === "upvote") {
		return next();
	}
	return res.status(401).send({
		error: true,
		message: "Unauthorized",
		code: 401
	});
}

router.post("/dblwebhook-secret", isWebhookAuth, controller.processUpVote);

export default router;