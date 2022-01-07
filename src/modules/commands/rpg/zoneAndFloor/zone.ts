import { AuthorProps, ChannelProp } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { UserProps } from "@customTypes/users";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { getAllZones, getZoneByLocationId } from "api/controllers/ZonesController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Client, Message } from "discord.js";
import { DEFAULT_ERROR_TITLE, PAGE_FILTER } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { createZoneList } from "helpers/embedLists/zone";
import loggers from "loggers";
import { titleCase } from "title-case";
import { paginatorInteraction } from "utility/ButtonInteractions";

async function handleNextZone(params: {
    user: UserProps;
    zn: string;
    channel: ChannelProp
}) {
	const { user, zn } = params;
	const embed = createEmbed().setTitle(DEFAULT_ERROR_TITLE);
	if ((user.ruin == user.max_ruin && zn == "n") || parseInt(zn) > user.max_ruin) {
		embed
			.setDescription(
				`Summoner **${user.username}**, you have not unlocked this zone yet!`
			);
		params.channel?.sendMessage(embed);
		return;
	} else {
		if (zn === "n") user.ruin = user.ruin + 1;
		else {
			user.ruin = parseInt(zn);
		}
		const maxLocation = 10;
		if (user.ruin > maxLocation) {
			user.ruin = maxLocation;
			params.channel?.sendMessage("You've already reached the last zone of XeneX.");
			return;
		}
		user.floor = 1;
		const zone = await getZoneByLocationId({ location_id: user.ruin });
		if (!zone) return;
		if (user.ruin < user.max_ruin) {
			user.max_floor = zone.max_floor;
		} else if (user.ruin == user.max_ruin) {
			user.max_floor = user.max_ruin_floor;
		}
	    const attachment = createAttachment(zone.filepath, "zone.jpg");
		embed.attachFiles([ attachment ])
			.setTitle(`Successfully travelled to __${titleCase(zone.name)}__\n[Zone ${user.ruin}]`)
			.setDescription(zone.description)
			.setImage("attachment://zone.jpg");
	}
	await updateRPGUser({ user_tag: user.user_tag }, {
		max_floor: user.max_floor,
		ruin: user.ruin,
		floor: user.floor
	});
	return embed;
}

async function handleZones(params: {
    user: UserProps;
    channel: ChannelProp;
    author: AuthorProps;
    client: Client;
}, options?: {
        page: number;
    }) {
	const filter = PAGE_FILTER;
	if (options?.page && !isNaN(options.page)) {
		filter.currentPage = options.page;
	}
	let embed = createEmbed();
	let sentMessage: Message;
	const buttons = await paginatorInteraction(
		params.channel,
		params.author.id,
		{},
		filter,
		getAllZones,
		(data, options) => {
			if (data) {
				const list = createZoneList(data.data);
				embed = createEmbedList({
					author: params.author,
					list,
					currentPage: data.metadata.currentPage,
					totalPages: data.metadata.totalPages,
					totalCount: data.metadata.totalCount,
					client: params.client,
					pageCount: data.data.length,
					title: "Zones/Arena:map:",
					description: "All the Zones available in the Xenverse are shown below.",
					pageName: "Zone"
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
	return;
}

export const zone = async ({ context, client, options, args }: BaseProps) => {
	try {
		const author = options?.author;
		if (!author) return;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const zn = args.shift();
		if (!zn || zn === "page") {
			const opts = {} as { page: number };
			if (zn === "page") {
				opts.page = parseInt(args.shift() || "0");
			}
			await handleZones({
				client,
				user,
				channel: context.channel,
				author
			}, opts);
			return;
		}
		const embed = await handleNextZone({
			user,
			zn,
			channel: context.channel
		});
		if (!embed) return;
		embed.setAuthor({
			name: author.username,
			iconURL: author.displayAvatarURL()
		});
		context.channel.sendMessage(embed);
	} catch (err) {
		loggers.error("modules.commands.rpg.zoneAndFloor.zone(): something went wrong", err);
		return;
	}
};