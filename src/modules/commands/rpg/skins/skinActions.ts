import { AuthorProps, ChannelProp } from "@customTypes";
import {
	getSkinCollection,
	getSkinCollectionById,
} from "api/controllers/SkinCollectionController";
import { createEmbed } from "commons/embeds";
import { Client, Message } from "discord.js";
import { IZZI_WEBSITE } from "environment";
import {
	DEFAULT_SUCCESS_TITLE,
	MAX_CHOSEN_SKINS_ALLOWED,
	PAGE_FILTER,
} from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { createSkinList } from "helpers/embedLists/skin";
import loggers from "loggers";
import { titleCase } from "title-case";
import { clone } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { delSkinArr, getSkinArr, setSkinArr } from "./skinCache";

export const show = async (params: {
  author: AuthorProps;
  channel: ChannelProp;
  client: Client;
  args?: string[];
}) => {
	try {
		const filter = clone(PAGE_FILTER);
		const pageNum = params.args?.shift();
		if (pageNum === "-pg") {
			filter.currentPage = Number(params.args?.shift() || 0);
		}
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await paginatorInteraction(
			params.channel,
			params.author.id,
			{ user_tag: params.author.id },
			filter,
			getSkinCollection,
			(data, options) => {
				if (data) {
					const list = createSkinList(
						data.data,
						data.metadata.currentPage,
						data.metadata.perPage
					);
					embed = createEmbedList({
						author: params.author,
						list,
						currentPage: data.metadata.currentPage,
						totalPages: data.metadata.totalPages,
						totalCount: data.metadata.totalCount,
						client: params.client,
						pageCount: data.data.length,
						title: "Skin Collection",
						description: "All the skins you own are shown below.",
						pageName: "Skin",
					});
				} else {
					embed.setDescription(
						`You do not have any skins. You can purchase skins from ${IZZI_WEBSITE}/skins`
					);
				}
				if (options?.isDelete && sentMessage) {
					sentMessage.deleteMessage();
				}
				if (options?.isEdit) {
					sentMessage.editMessage(embed);
				}
			}
		);
		if (!buttons) return;

		embed.setButtons(buttons);

		const msg = await params.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.skins.skinActions.show(): something went wrong",
			err
		);
		return;
	}
};

export const reset = (params: {
  author: AuthorProps;
  channel: ChannelProp;
}) => {
	try {
		delSkinArr(params.author.id);
		const embed = createEmbed()
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription("Successfully reset all skins");

		params.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.skins.skinActions.reset(): something went wrong",
			err
		);
		return;
	}
};

export const choose = async (params: {
  author: AuthorProps;
  channel: ChannelProp;
  client: Client;
  args?: string[];
}) => {
	try {
		const id = params.args?.shift();
		if (!id) return;
		const skinArr = (await getSkinArr(params.author.id)) || [];
		// let skinArr = await redisClient.get(`selected-skin-${author.id}`);
		let skin: any;
		// let spbtSkin: any;
		const embed = createEmbed();
		embed
			.setAuthor({
				name: params.author.username,
				iconURL: params.author.displayAvatarURL(),
			})
			.setTitle("Error :no_entry:")
			.setThumbnail(params.client.user?.displayAvatarURL() || "");

		if (skinArr.length >= MAX_CHOSEN_SKINS_ALLOWED) {
			embed.setDescription(
				`Summoner **${params.author.username}**, ` +
				`You cannot choose more than __${MAX_CHOSEN_SKINS_ALLOWED}__ skins. ` +
				"Please use ``skin remove <id>`` to be able to set another one."
			);
			params.channel?.sendMessage(embed);
			return;
		}
		if (skinArr) {
			skin = skinArr.find((c) => c.id === Number(id));
			if (skin) {
				embed.setDescription(
					`Summoner **${params.author.username}**, this skin is already in use`
				);
				params.channel?.sendMessage(embed);
				return;
			}
		}
		if (!skin) {
			skin = await getSkinCollectionById({
				user_tag: params.author.id,
				id: Number(id),
			});
			if (!skin) {
				embed.setDescription(`We could not find the skin you were looking for.
						Please make sure you have entered the correct ID`);
				params.channel?.sendMessage(embed);
				return;
			}
			// if ((skin.metadata || {}).isSpecial) {
			// 	spbtSkin = skin;
			// }
		}
		const index = skinArr.findIndex(
			(i) => i.character_id === skin?.character_id
		);
		if (index >= 0) {
			skinArr[index] = skin;
		} else {
			skinArr.push(skin);
		}
		// if (spbtSkin) {
		// 	let spbtSkinArr = getSkinArr("spbt-skins");
		// 	if (!spbtSkinArr) {
		// 		spbtSkinArr = [];
		// 	}
		// 	const idx = spbtSkinArr.findIndex(
		// 		(x) => x.character_id === spbtSkin.character_id
		// 	);
		// 	if (idx >= 0) {
		// 		spbtSkinArr[idx] = spbtSkin;
		// 	} else {
		// 		spbtSkinArr.push(spbtSkin);
		// 	}
		// 	setSkinArr("spbt-skins", spbtSkinArr);
		// }
		setSkinArr(params.author.id, skinArr);

		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Successfully selected Skin Art ${titleCase(skin.name)}`);
		params.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.skins.skinActions.choose(): something went wrong",
			err
		);
		return;
	}
};

export const removeSkin = async (params: {
  author: AuthorProps;
  channel: ChannelProp;
  client: Client;
  args?: string[];
}) => {
	try {
		const id = params.args?.shift();
		if (!id) return;
		const skinArr = await getSkinArr(params.author.id);
		if (skinArr) {
			const index = skinArr.findIndex((s) => s.id === Number(id));
			if (index >= 0) {
				skinArr.splice(index, 1);
				setSkinArr(params.author.id, skinArr);
			}
		}
		params.channel?.sendMessage(`Successfully removed skin ID: \`\`${id}\`\``);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.skins.skinActions.removeSkin(): something went wrong",
			err
		);
		return;
	}
};
