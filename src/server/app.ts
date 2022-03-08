import express from "express";
import bot from "./routes/bot";
import webhook from "./routes/webhook";
import dungeon from "./routes/dungeon";
import isAuth from "./pipes/auth";

const app = express();
app.use(express.json());

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

app.use("/", isAuth, bot);
app.use("/", isWebhookAuth, webhook);
app.use("/", isAuth, dungeon);

app.listen(5000, () => {
	console.log("listening for webhook on port 5000");
});