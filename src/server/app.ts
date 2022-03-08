import express from "express";
import flushBattleCooldowns from "./autoClear";
import bot from "./routes/bot";
import webhook from "./routes/webhook";

const webhookAuth = "izziwebhookauth";

async function redisBattleCleanup() {
	await flushBattleCooldowns();
	return;
}

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

const app = express();
app.use(express.json());

app.use("/", bot);
app.use("/", webhook);

app.listen(5000, () => {
	console.log("listening for webhook on port 5000");
});