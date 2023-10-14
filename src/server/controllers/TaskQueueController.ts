import { debounce } from "helpers";
import { sendChannelMessageViaApi } from "../pipes/directMessage";

let queue: Map<string, { messages: string[]; }> = new Map();

const logToOsChannel = async () => {
	try {
		console.log("sending logs to os");
		queue.forEach(({ messages }, key) => {
			const msg = messages.join("\n");
			sendChannelMessageViaApi(key, { content: msg });
		});
	} catch (err) {
		console.log("Unable to log data to os channels");
	}
	queue = new Map();
};

export const handleLogTask = async (req: any, res: any) => {
	try {
		const data = req.body;
		console.log("[task-queue] received task queue body: ", data);
		if (data.channelId && data.message) {
			const obj = queue.get(data.channelId);
			if (obj && (obj.messages || []).length >= 20) {
				logToOsChannel();
			} else if (!obj) {
				queue.set(data.channelId, { messages: [ data.message ] });
			} else {
				obj.messages.push(data.message);
				queue.set(data.channelId, obj);
			}
			debounce(logToOsChannel, 1000 * 30)();
		}
	} catch (err) {
		console.error("[task-queue] Unable to process task: ", err);
	}
	return res.status(200).send({ message: "ok" });
};