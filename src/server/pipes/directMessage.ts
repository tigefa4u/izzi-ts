import axios from "axios";
import Cache from "cache";
import { DISCORD_BOT_TOKEN } from "environment";
import loggers from "loggers";
import requester from "./requester";

async function getDMChannelID(recipient_id: string) {
	if (!recipient_id) throw new Error("Unprocessable Entity");
	const key = "dmchannel::" + recipient_id;
	const resp = await Cache.fetch(key, async () => {
		const result = await requester<any, { id: string; }>({
			method: "POST",
			url: "/users/@me/channels",
			service: "discordApi",
			data: { recipient_id },
			headers: { "Authorization": `Bot ${DISCORD_BOT_TOKEN}` }
		}).then((res) => res.id)
			.catch((err) => {
				loggers.error("pipes.directMessage.getDMChannelID: Unable to create DM Channel: ", err);
				return;
			});
		return result;
	});
	return resp;
}

export const DMUserViaApi = async (user_tag: string, content: { content: string; }) => {
	if (content) {
		const dmChannelId = await getDMChannelID(user_tag);
		if (dmChannelId) {
			return requester({
				method: "POST",
				url: `/channels/${dmChannelId}/messages`,
				service: "discordApi",
				data: content,
				headers: { "Authorization": `Bot ${DISCORD_BOT_TOKEN}` }
			}).catch(err => console.log("Unable to DM", err.response.data));
		}
	}
};