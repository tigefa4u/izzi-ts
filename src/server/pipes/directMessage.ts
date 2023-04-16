import axios from "axios";
import Cache from "cache";
import { APIRequest, MessageEmbed } from "discord.js";
import { DISCORD_BOT_TOKEN } from "environment";
import loggers from "loggers";
import requester from "./requester";

type AR = {
	method: APIRequest["method"];
	url: string;
	data: Record<string, unknown> | string;
}
const __discordApiRequest = async <R>({ data = "", url, method }: AR) => {
	return requester<any, R>({
		method,
		url,
		service: "discordApi",
		data,
		headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
	});
};

async function getDMChannelID(recipient_id: string) {
	if (!recipient_id) throw new Error("Unprocessable Entity");
	const key = "dmchannel::" + recipient_id;
	const resp = await Cache.fetch(key, async () => {
		const result = await __discordApiRequest<{ id: string; }>({
			method: "post",
			url: "/users/@me/channels",
			data: { recipient_id },
		})
			.then((res) => res.id)
			.catch((err) => {
				loggers.error(
					"pipes.directMessage.getDMChannelID: Unable to create DM Channel: ",
					err
				);
				return;
			});
		return result;
	});
	return resp;
}

export const DMUserViaApi = async (
	user_tag: string,
	content: { content?: string; embeds?: MessageEmbed[]; }
) => {
	if (content) {
		const dmChannelId = await getDMChannelID(user_tag);
		if (dmChannelId) {
			return sendChannelMessageViaApi(dmChannelId, content);
		}
	}
};

export const sendChannelMessageViaApi = async (
	channelId: string,
	content: { content?: string; embeds?: MessageEmbed[] }
) => {
	return __discordApiRequest({
		method: "post",
		url: `/channels/${channelId}/messages`,
		data: content,
	}).catch((err) => console.log("Unable to DM", err.response.data));
};

export const getGuildsViaApi = async () => {
	return __discordApiRequest({
		method: "get",
		url: "/users/@me/guilds",
		data: ""
	}).catch((err) => console.log("Unable to fetch guild channels", err));
};