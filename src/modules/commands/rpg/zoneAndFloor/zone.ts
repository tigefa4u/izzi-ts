import { AuthorProps, ChannelProp } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { UserProps } from "@customTypes/users";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { getAllZones, getMaxLocation, getZoneByLocationId } from "api/controllers/ZonesController";
import { loadImage } from "canvas";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Client, Message } from "discord.js";
import { parsePremiumUsername } from "helpers";
import { DEFAULT_ERROR_TITLE, PAGE_FILTER, REQUIRED_TRADE_LEVEL } from "helpers/constants/constants";
import { createEmbedList } from "helpers/embedLists";
import { createZoneList } from "helpers/embedLists/zone";
import loggers from "loggers";
import { titleCase } from "title-case";
import { clone } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { attachButtonToFloorEmbed } from ".";

async function handleNextZone(params: {
    user: UserProps;
    zn: string;
    channel: ChannelProp
}) {
	const { user, zn } = params;
	let embed = createEmbed().setTitle(DEFAULT_ERROR_TITLE);
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
			if (isNaN(user.ruin)) {
				user.ruin = 1;
			}
		}
		const maxLocation = await getMaxLocation();
		if (!maxLocation) {
			params.channel?.sendMessage("Unexpected error occured. Please try again later");
			return;
		}
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

		embed.setTitle(`Successfully travelled to __${titleCase(zone.name)}__\n[Zone ${user.ruin}]`)
			.setDescription(zone.description);

		try {
			zone.filepath = zone.filepath.replace("http://66.135.0.56:5013/", "https://assets.izzi-xenex.xyz/");
			await loadImage(zone.filepath);
			const attachment = createAttachment(zone.filepath, "zone.jpg");
			embed.attachFiles([ attachment ])
				.setImage("attachment://zone.jpg");
		} catch (err) {
			loggers.error("Failed to load image for zone: ", err);
		}

		if (user.level < REQUIRED_TRADE_LEVEL) {
			embed.setHideConsoleButtons(true);
		}
		embed = attachButtonToFloorEmbed({
			embed,
			channel: params.channel
		});
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
	const filter = clone(PAGE_FILTER);
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
			} else {
				embed.setDescription("No data available");
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
	return;
}

export const zone = async ({ context, client, options, args }: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const zn = args.shift();
		if (!zn || zn === "-pg") {
			const opts = {} as { page: number };
			if (zn === "-pg") {
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
			name: parsePremiumUsername(author.username),
			iconURL: author.displayAvatarURL()
		});
		context.channel?.sendMessage(embed);
	} catch (err) {
		loggers.error("modules.commands.rpg.zoneAndFloor.zone: ERROR", err);
		return;
	}
};