import { v2beta3 } from "@google-cloud/tasks";
import {
	AUTH_TOKEN,
	GCP_PROJECT_ID,
	GCP_TASK_QUEUE,
	GCP_TASK_QUEUE_LOCATION,
	WEBHOOK_BOT_HOST,
	WEBHOOK_BOT_HTTP_PROTOCOL,
	WEBHOOK_BOT_PORT,
} from "environment";
import loggers from "loggers";

const tasksClient = new v2beta3.CloudTasksClient({
	projectId: GCP_PROJECT_ID,
	keyFilename: "izzi-task-queue.json",
});

/**
 * Google Task Queues are being used to send log messages
 * There could be many concurrent users so to avoid rate limit
 * collect a bunch of log messages and send them together (5 second interval)
 */
let success = false;
tasksClient
	.initialize()
	.catch((err) => {
		console.log("Task Queue Failed to initialize", err);
	})
	.then(() => {
		success = true;
		console.log("Task Queue ready");
	});

if (!WEBHOOK_BOT_HOST || !WEBHOOK_BOT_PORT) {
	console.log("[task-queue] Failed: missing bot host:port");
	success = false;
}

const prepareTaskQueueName = (name: string) =>
	`projects/${GCP_PROJECT_ID}/locations/${GCP_TASK_QUEUE_LOCATION}/queues/${GCP_TASK_QUEUE}/tasks/${name
		.trim()
		.replace(" ", "-")}`;

/**
 * Currently Embed data is not supported.
 * Send only string 
 * @param name 
 * @param payload 
 * @returns 
 */
export const taskQueue = async (
	name: string,
	payload:{ message: string; channelId: string; }
) => {
	if (!success) {
		loggers.error("[task-queue] Task Queue was not initialized correctly.");
		return;
	}
	try {
		loggers.info("[task-queue] Creating task with payload: " + name, { payload, });
		await tasksClient.createTask({
			parent: tasksClient.queuePath(
				GCP_PROJECT_ID,
				GCP_TASK_QUEUE_LOCATION,
				GCP_TASK_QUEUE
			),
			task: {
				// Do not send name
				// name: prepareTaskQueueName(name),
				httpRequest: {
					url: `${WEBHOOK_BOT_HTTP_PROTOCOL}://${WEBHOOK_BOT_HOST}:${WEBHOOK_BOT_PORT}/task-queue/logs`,
					httpMethod: "POST",
					body: Buffer.from(JSON.stringify(payload)).toString("base64"),
					headers: {
						Authorization: `Bot ${AUTH_TOKEN}`,
						"Content-Type": "application/json" 
					},
				},
			},
		});
		loggers.info("[task-queue] successfully created task: ", name);
	} catch (err) {
		console.log("task queue failed: ", err);
		loggers.error("[task-queue] failed to create task: ", err);
	}
	return;
};
