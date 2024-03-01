import express, { Request, Response } from "express";
import bot from "./routes/bot";
import webhook from "./routes/webhook";
import dungeon from "./routes/dungeon";
import isAuth from "./pipes/auth";

const app = express();
app.use(express.json());

const webhookAuth = "wKm(.DT#*XL,S#9F";
const botID = "784851074472345633";
function isWebhookAuth(req: Request, res: Response, next: () => void) {
	if (req.headers["authorization"] === webhookAuth && req.body.type === "upvote") {
		if (req.body.bot && req.body.bot !== botID) {
			return res.status(401).send({
				error: true,
				message: "Unauthorized",
				code: 401
			});
		}
		return next();
	}
	return res.status(401).send({
		error: true,
		message: "Unauthorized",
		code: 401
	});
}

app.use("/dblwebhook-secret", isWebhookAuth, webhook);
app.use("/dungeon", isAuth, dungeon);
// app.get("/task-queue", (req, res) => {
// 	taskQueue("test", {
// 		message: "hello world",
// 		channelId: OS_LOG_CHANNELS.GIVE
// 	});
// 	return res.status(200).send({ message: "ok" });
// });
app.use("/", isAuth, bot);

app.listen(5000, () => {
	console.log("listening for webhook on port 5000");
});