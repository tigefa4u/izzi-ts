import { AuthorProps, ChannelProp } from "@customTypes";
import { getSkinCollection, getSkinCollectionById } from "api/controllers/SkinCollectionController";
import { createEmbed } from "commons/embeds";
import { Client, Message } from "discord.js";
import { DEFAULT_SUCCESS_TITLE, PAGE_FILTER } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { createSkinList } from "helpers/embedLists/skin";
import loggers from "loggers";
import { titleCase } from "title-case";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { delSkinArr, getSkinArr, setSkinArr } from "./skinCache";

export const show = async (params: {
    author: AuthorProps;
    channel: ChannelProp;
    client: Client;
    args?: string[];
}) => {
	try {
		const filter = PAGE_FILTER;
		const pageNum = params.args?.shift();
		if (pageNum === "page") {
			filter.currentPage = Number(params.args?.shift() || 0);
		}
		let embed = createEmbed();
		let sentMessage: Message;
        	const buttons = 
			await paginatorInteraction(
				params.channel,
				params.author.id,
				{ user_tag: params.author.id },
				filter,
				getSkinCollection,
				(data, options) => {
					if (data) {
						const list = createSkinList(data.data, data.metadata.currentPage, data.metadata.perPage);
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
							pageName: "Skin"
						});
					}
					if (options?.isDelete && sentMessage) {
						sentMessage.delete();
					}
					if (options?.isEdit) {
						sentMessage.editMessage(embed);
					}
				}
			);
		if (buttons) {
			embed.setButtons(buttons);
		}

		params.channel?.sendMessage(embed).then((msg) => {
			sentMessage = msg;
		});
	} catch (err) {
		loggers.error("modules.commands.rpg.skins.skinActions.show(): something went wrong", err);
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
		loggers.error("modules.commands.rpg.skins.skinActions.reset(): something went wrong", err);
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
		let skinArr = getSkinArr(params.author.id);
		// let skinArr = await redisClient.get(`selected-skin-${author.id}`);
		let skin: any;
		let spbtSkin: any;
		const embed = createEmbed();
		embed.setAuthor({
			name: params.author.username,
			iconURL: params.author.displayAvatarURL()
		})
			.setTitle("Error :no_entry:")
			.setThumbnail(params.client.user?.displayAvatarURL() || "");
		if (skinArr) {
			// skinArr = JSON.parse(skinArr);
			skin = skinArr.filter((c: any) => c.id === Number(id))[0];
			if (skin) {
				embed.setDescription(`Summoner **${params.author.username}**, this skin is already in use`);
				params.channel?.sendMessage(embed);
				return;
			}
		} else {
			skinArr = [];
		}
		if (!skin) {
			skin = await getSkinCollectionById({
				user_tag: params.author.id,
				id: Number(id)
			});
			if (!skin) {
				embed.setDescription(`We could not find the skin you were looking for.
						Please make sure you have entered the correct ID`);
				params.channel?.sendMessage(embed);
				return;
			}
			if ((skin.metadata || {}).isSpecial) {
				spbtSkin = skin;
			}
		}
		const index = skinArr.findIndex((i: any) => i.character_id === skin?.character_id);
		if (index >= 0) {
			skinArr[index] = skin;
		} else {
			skinArr.push(skin);
		}
		if (spbtSkin) {
			let spbtSkinArr = getSkinArr("spbt-skins");
			if (!spbtSkinArr) {
				spbtSkinArr = [];
			}
			const idx = spbtSkinArr.findIndex((x: any) => x.character_id === spbtSkin.character_id);
			if (idx >= 0) {
				spbtSkinArr[idx] = spbtSkin;
			} else {
				spbtSkinArr.push(spbtSkin);
			}
			setSkinArr("spbt-skins", spbtSkinArr);
		}
		setSkinArr(params.author.id, skinArr);
		// await redisClient.set(`selected-skin-${author.id}`, JSON.stringify(skinArr));
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Successfully selected Skin Art ${titleCase(skin.name)}`);
		params.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.skins.skinActions.choose(): something went wrong", err);
		return;
	}
};